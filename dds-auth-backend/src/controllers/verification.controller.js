import crypto from 'crypto'
import { User } from '../models/User.js'
import { VerificationRequest } from '../models/VerificationRequest.js'
import { VerificationLog } from '../models/VerificationLog.js'
import { normalizeMobile } from '../utils/phoneNormalizer.js'
import { sendVerificationToUser } from '../services/socket.service.js'

export const verificationController = {
  // 1. Create Verification Request (Called by Third-Party SDK with Client Credentials)
  async createVerification(req, res) {
    try {
      const { mobileId } = req.body
      const app = req.application

      if (!mobileId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_MOBILE_ID',
          message: 'mobileId parameter is required.'
        })
      }

      const normalized = normalizeMobile(mobileId)
      if (!normalized.isValid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_MOBILE_FORMAT',
          message: normalized.error
        })
      }

      // Exact Canonical Lookup in MongoDB
      const user = await User.findOne({
        mobileId: normalized.canonical,
        phoneVerified: true,
        status: 'active'
      })

      // CRITICAL RULE: If user is not registered or not verified -> 404 MOBILE_NOT_REGISTERED
      if (!user) {
        await VerificationLog.create({
          applicationId: app.applicationId,
          mobileId: normalized.canonical,
          event: 'MOBILE_NOT_REGISTERED',
          details: {
            reason: 'Mobile number is not registered or not verified in DDS',
            requestedBy: app.name
          },
          timestamp: new Date()
        })

        console.log(`[DDS Auth] Rejecting verification request: ${normalized.canonical} is NOT registered.`)

        return res.status(404).json({
          success: false,
          error: 'MOBILE_NOT_REGISTERED',
          message: 'This mobile number is not registered with DDS.'
        })
      }

      // Generate Cryptographically Secure Random 6-Digit Verification Challenge Code
      const rawCode = crypto.randomInt(100000, 1000000).toString()
      const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex')
      const requestId = `req_${crypto.randomBytes(4).toString('hex')}`
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000) // 2 Minutes TTL

      const verificationDoc = await VerificationRequest.create({
        requestId,
        applicationId: app.applicationId,
        applicationName: app.name,
        websiteUrl: app.websiteUrl,
        userId: user.userId,
        mobileId: user.mobileId,
        codeHash,
        deliveryCode: rawCode, // stored internally only for hash comparison & audits
        status: 'pending',
        attempts: 0,
        expiresAt
      })

      // Log Event
      await VerificationLog.create({
        applicationId: app.applicationId,
        requestId,
        mobileId: user.mobileId,
        event: 'REQUEST_CREATED',
        details: {
          applicationName: app.name,
          userId: user.userId,
          expiresAt
        },
        timestamp: new Date()
      })

      console.log(`[DDS Auth] Verification challenge created for ${user.mobileId} by ${app.name} (${requestId})`)

      // Targeted Real-Time Socket.IO Event sent exclusively to the matching user's room
      // CRITICAL: NO plaintext code or hash is sent to the User App!
      const masked = `+91 ••••• ${user.phoneNumber.slice(-4)}`
      sendVerificationToUser(user.userId, user.mobileId, {
        id: requestId,
        requestId,
        applicationId: app.applicationId,
        applicationName: app.name,
        websiteUrl: app.websiteUrl,
        mobileNumber: user.mobileId,
        mobileIdMasked: masked,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString()
      })

      // Response to Third-Party SDK / Backend:
      // The 6-digit verification code belongs to the Third-Party Website / Merchant to display!
      return res.status(200).json({
        success: true,
        requestId: verificationDoc.requestId,
        status: 'pending',
        verificationCode: rawCode
      })
    } catch (err) {
      console.error('Create verification error:', err)
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: err.message
      })
    }
  },

  // 2. Get Verification Status (Called by Third-Party SDK)
  async getStatus(req, res) {
    try {
      const { requestId } = req.params
      const request = await VerificationRequest.findOne({ requestId })

      if (!request) {
        return res.status(404).json({
          success: false,
          error: 'REQUEST_NOT_FOUND',
          message: 'Verification request not found.'
        })
      }

      // Check Expiration
      if (request.status === 'pending' && new Date() > request.expiresAt) {
        request.status = 'expired'
        await request.save()

        await VerificationLog.create({
          applicationId: request.applicationId,
          requestId: request.requestId,
          mobileId: request.mobileId,
          event: 'REQUEST_EXPIRED',
          details: { expiredAt: new Date() },
          timestamp: new Date()
        })
      }

      return res.json({
        success: true,
        requestId: request.requestId,
        status: request.status
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 3. User App Polling: Get Pending Requests for Registered User (NO code returned!)
  async getPendingRequests(req, res) {
    try {
      const { mobileId, mobileNumber } = req.query
      const target = mobileId || mobileNumber

      if (!target) {
        return res.json({ success: true, data: [] })
      }

      const normalized = normalizeMobile(target)
      if (!normalized.isValid) {
        return res.json({ success: true, data: [] })
      }

      const now = new Date()
      const pending = await VerificationRequest.find({
        mobileId: normalized.canonical,
        status: 'pending',
        expiresAt: { $gt: now }
      }).sort({ createdAt: -1 })

      const mapped = pending.map((r) => ({
        id: r.requestId,
        requestId: r.requestId,
        applicationId: r.applicationId,
        applicationName: r.applicationName,
        websiteUrl: r.websiteUrl,
        mobileNumber: r.mobileId,
        mobileIdMasked: `+91 ••••• ${r.mobileId.slice(-4)}`,
        status: r.status,
        expiresAt: r.expiresAt.toISOString(),
        createdAt: r.createdAt.toISOString()
        // NO plaintext code or deliveryCode returned to User App!
      }))

      return res.json({
        success: true,
        data: mapped
      })
    } catch (err) {
      console.error('Get pending requests error:', err)
      return res.status(500).json({ success: false, error: err.message, data: [] })
    }
  },

  // 4. User App Action: Approve Verification with Code
  async approveVerification(req, res) {
    try {
      const { requestId } = req.params
      const { code } = req.body

      const request = await VerificationRequest.findOne({ requestId })
      if (!request) {
        return res.status(404).json({
          success: false,
          error: 'REQUEST_NOT_FOUND',
          message: 'Verification request not found.'
        })
      }

      if (request.status === 'verified') {
        return res.status(400).json({
          success: false,
          error: 'REQUEST_ALREADY_COMPLETED',
          message: 'This verification request has already been verified.'
        })
      }

      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'REQUEST_INACTIVE',
          message: `This request is already ${request.status}.`
        })
      }

      // Check Expiration
      if (new Date() > request.expiresAt) {
        request.status = 'expired'
        await request.save()

        await VerificationLog.create({
          applicationId: request.applicationId,
          requestId: request.requestId,
          mobileId: request.mobileId,
          event: 'REQUEST_EXPIRED',
          timestamp: new Date()
        })

        return res.status(400).json({
          success: false,
          error: 'REQUEST_EXPIRED',
          message: 'Verification request has expired.'
        })
      }

      // Check Max Attempts
      if (request.attempts >= 5) {
        request.status = 'locked'
        await request.save()

        await VerificationLog.create({
          applicationId: request.applicationId,
          requestId: request.requestId,
          mobileId: request.mobileId,
          event: 'REQUEST_LOCKED',
          details: { attempts: request.attempts },
          timestamp: new Date()
        })

        return res.status(403).json({
          success: false,
          error: 'REQUEST_LOCKED',
          message: 'Maximum verification attempts exceeded. Request locked.'
        })
      }

      // Compare Code Hash
      const enteredHash = crypto.createHash('sha256').update(String(code).trim()).digest('hex')
      const isMatch = enteredHash === request.codeHash || request.deliveryCode === String(code).trim()

      if (!isMatch) {
        request.attempts += 1
        if (request.attempts >= 5) {
          request.status = 'locked'
        }
        await request.save()

        await VerificationLog.create({
          applicationId: request.applicationId,
          requestId: request.requestId,
          mobileId: request.mobileId,
          event: request.attempts >= 5 ? 'REQUEST_LOCKED' : 'INVALID_CODE',
          details: { attemptNumber: request.attempts },
          timestamp: new Date()
        })

        return res.status(400).json({
          success: false,
          error: 'INVALID_CODE',
          message: `Invalid verification code. Please enter the code displayed on ${request.applicationName || 'DemoShop'}.`,
          remainingAttempts: Math.max(0, 5 - request.attempts)
        })
      }

      // Verification Success
      request.status = 'verified'
      request.verifiedAt = new Date()
      await request.save()

      await VerificationLog.create({
        applicationId: request.applicationId,
        requestId: request.requestId,
        mobileId: request.mobileId,
        event: 'USER_APPROVED',
        details: { verifiedAt: request.verifiedAt },
        timestamp: new Date()
      })

      console.log(`[DDS Auth] Request ${requestId} successfully APPROVED by user ${request.mobileId}`)

      return res.json({
        success: true,
        status: 'verified',
        message: 'Verification approved successfully.'
      })
    } catch (err) {
      console.error('Approve verification error:', err)
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 5. User App Action: Reject Verification
  async rejectVerification(req, res) {
    try {
      const { requestId } = req.params
      const request = await VerificationRequest.findOne({ requestId })

      if (!request) {
        return res.status(404).json({ success: false, error: 'REQUEST_NOT_FOUND' })
      }

      request.status = 'rejected'
      await request.save()

      await VerificationLog.create({
        applicationId: request.applicationId,
        requestId: request.requestId,
        mobileId: request.mobileId,
        event: 'USER_REJECTED',
        timestamp: new Date()
      })

      console.log(`[DDS Auth] Request ${requestId} REJECTED by user ${request.mobileId}`)

      return res.json({
        success: true,
        status: 'rejected',
        message: 'Verification request rejected.'
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  }
}
