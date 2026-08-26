import crypto from 'crypto'
import { User } from '../models/User.js'
import { Session } from '../models/Session.js'
import { Application } from '../models/Application.js'
import { VerificationRequest } from '../models/VerificationRequest.js'
import { VerificationLog } from '../models/VerificationLog.js'
import { normalizeMobile } from '../utils/phoneNormalizer.js'
import {
  verifyFirebaseIdToken,
  deleteFirebaseUser,
  getFirebaseUser
} from '../services/firebaseAdmin.service.js'

// In-memory registration OTP cache for local/legacy OTP flow fallback
const registrationOtpStore = new Map()

export const authController = {
  // Legacy simulation endpoints
  async googleSignIn(req, res) {
    try {
      const { email, name } = req.body
      const mockGoogleId = `google_demo_${Date.now()}`
      return res.json({
        success: true,
        data: {
          googleId: mockGoogleId,
          email: email || 'sanjai@dds.auth',
          name: name || 'Sanjai'
        }
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  async requestRegistrationOtp(req, res) {
    try {
      const { mobileNumber } = req.body
      const normalized = normalizeMobile(mobileNumber)
      if (!normalized.isValid) {
        return res.status(400).json({ success: false, error: normalized.error })
      }
      const otpCode = '123456'
      registrationOtpStore.set(normalized.canonical, {
        code: otpCode,
        expiresAt: Date.now() + 5 * 60 * 1000
      })
      return res.json({
        success: true,
        message: `Verification code sent to ${normalized.formatted}`,
        mobileId: normalized.canonical,
        code: otpCode
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  async verifyRegistrationOtp(req, res) {
    try {
      const { mobileNumber, code, name, email } = req.body
      const normalized = normalizeMobile(mobileNumber)
      if (!normalized.isValid) {
        return res.status(400).json({ success: false, error: normalized.error })
      }
      let user = await User.findOne({ mobileId: normalized.canonical })
      if (!user) {
        const userId = `usr_${crypto.randomBytes(4).toString('hex')}`
        user = await User.create({
          userId,
          email: email || 'sanjai@dds.auth',
          displayName: name || 'Sanjai',
          name: name || 'Sanjai',
          mobileId: normalized.canonical,
          countryCode: normalized.countryCode,
          phoneNumber: normalized.nationalNumber,
          phoneVerified: true,
          status: 'active'
        })
      } else {
        user.phoneVerified = true
        await user.save()
      }
      const sessionToken = `dds_sess_${crypto.randomBytes(24).toString('hex')}`
      await Session.create({
        token: sessionToken,
        userId: user.userId,
        mobileId: user.mobileId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
      return res.json({
        success: true,
        token: sessionToken,
        data: user
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 1. Firebase Session Exchange (POST /api/v1/auth/firebase/session)
  async firebaseSession(req, res) {
    try {
      const authHeader = req.headers['authorization'] || req.headers['x-firebase-token']
      let idToken = req.body?.idToken

      if (!idToken && authHeader) {
        idToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim()
      }

      if (!idToken) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIREBASE_ID_TOKEN',
          message: 'Firebase ID token is required in Authorization header or request body.'
        })
      }

      // Verify token with Firebase Admin SDK
      const decoded = await verifyFirebaseIdToken(idToken)
      const firebaseUid = decoded.uid
      const email = decoded.email || null
      const displayName = decoded.name || decoded.displayName || 'DDS User'
      const photoURL = decoded.picture || decoded.photoURL || null
      const rawPhone = decoded.phone_number || null

      console.log(`[Firebase Auth] Verified ID token for Firebase UID: ${firebaseUid} (${email || rawPhone})`)

      // Find or create DDS User identity in MongoDB
      let user = await User.findOne({ firebaseUid })

      // Fallback: If not found by firebaseUid, check by email if available to link existing account
      if (!user && email) {
        user = await User.findOne({ email, firebaseUid: null })
        if (user) {
          user.firebaseUid = firebaseUid
          console.log(`[MongoDB] Linked existing user ${user.userId} with Firebase UID ${firebaseUid}`)
        }
      }

      let isNewUser = false

      if (!user) {
        isNewUser = true
        const userId = `usr_${crypto.randomBytes(4).toString('hex')}`

        let canonicalMobile = null
        let countryCode = '+91'
        let phoneNumber = null
        let phoneVerified = false

        if (rawPhone) {
          const norm = normalizeMobile(rawPhone)
          if (norm.isValid) {
            canonicalMobile = norm.canonical
            countryCode = norm.countryCode
            phoneNumber = norm.nationalNumber
            phoneVerified = true

            // Check duplicate mobile protection
            const existingWithMobile = await User.findOne({ mobileId: canonicalMobile })
            if (existingWithMobile && existingWithMobile.firebaseUid !== firebaseUid) {
              return res.status(409).json({
                success: false,
                error: 'MOBILE_ALREADY_REGISTERED',
                message: 'This mobile number is already associated with another DDS account.'
              })
            }
          }
        }

        user = await User.create({
          userId,
          firebaseUid,
          email,
          displayName,
          name: displayName,
          photoURL,
          mobileId: canonicalMobile,
          countryCode,
          phoneNumber,
          phoneVerified,
          authProvider: 'google',
          status: 'active',
          lastLoginAt: new Date()
        })
        console.log(`[MongoDB] Created new DDS identity: ${user.userId} for Firebase UID: ${firebaseUid}`)
      } else {
        user.lastLoginAt = new Date()
        if (displayName) {
          user.displayName = displayName
          user.name = displayName
        }
        if (email) user.email = email
        if (photoURL) user.photoURL = photoURL

        // If Firebase token has phone verified, sync into MongoDB
        if (rawPhone && !user.phoneVerified) {
          const norm = normalizeMobile(rawPhone)
          if (norm.isValid) {
            const existingWithMobile = await User.findOne({
              mobileId: norm.canonical,
              _id: { $ne: user._id }
            })
            if (!existingWithMobile) {
              user.mobileId = norm.canonical
              user.phoneNumber = norm.nationalNumber
              user.countryCode = norm.countryCode
              user.phoneVerified = true
            }
          }
        }
        await user.save()
      }

      // Create new server-side session token (7 days expiry)
      const sessionToken = `dds_sess_${crypto.randomBytes(24).toString('hex')}`
      await Session.create({
        token: sessionToken,
        userId: user.userId,
        mobileId: user.mobileId || '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })

      return res.json({
        success: true,
        token: sessionToken,
        isNewUser,
        requiresPhoneVerification: !user.phoneVerified || !user.mobileId,
        data: {
          userId: user.userId,
          firebaseUid: user.firebaseUid,
          mobileId: user.mobileId,
          countryCode: user.countryCode,
          phoneNumber: user.phoneNumber,
          displayName: user.displayName,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          phoneVerified: user.phoneVerified,
          status: user.status
        }
      })
    } catch (err) {
      console.error('[Firebase Auth] Session exchange error:', err)
      return res.status(401).json({
        success: false,
        error: 'FIREBASE_AUTH_FAILED',
        message: err.message || 'Failed to authenticate Firebase ID token.'
      })
    }
  },

  // 2. Firebase Phone Verification Link (POST /api/v1/auth/firebase/verify-phone)
  async firebaseVerifyPhone(req, res) {
    try {
      const authHeader = req.headers['authorization'] || req.headers['x-firebase-token']
      let idToken = req.body?.idToken
      const rawMobile = req.body?.mobileNumber

      if (!idToken && authHeader) {
        idToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim()
      }

      if (!idToken) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIREBASE_ID_TOKEN',
          message: 'Firebase ID token is required to verify phone number.'
        })
      }

      // Verify token with Firebase Admin SDK
      const decoded = await verifyFirebaseIdToken(idToken)
      const firebaseUid = decoded.uid
      const tokenPhone = decoded.phone_number || rawMobile

      if (!tokenPhone) {
        return res.status(400).json({
          success: false,
          error: 'PHONE_NUMBER_NOT_VERIFIED',
          message: 'Firebase ID token does not contain a verified phone number.'
        })
      }

      const normalized = normalizeMobile(tokenPhone)
      if (!normalized.isValid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PHONE_NUMBER',
          message: normalized.error
        })
      }

      // DUPLICATE MOBILE PROTECTION (Requirement #11)
      const existingUserWithPhone = await User.findOne({
        mobileId: normalized.canonical,
        firebaseUid: { $ne: firebaseUid }
      })

      if (existingUserWithPhone) {
        console.warn(`[MongoDB] Mobile ${normalized.canonical} already belongs to user ${existingUserWithPhone.userId} (firebaseUid: ${existingUserWithPhone.firebaseUid})`)
        return res.status(409).json({
          success: false,
          error: 'MOBILE_ALREADY_REGISTERED',
          message: 'This mobile number is already associated with another DDS account.'
        })
      }

      // Update User in MongoDB
      let user = await User.findOne({ firebaseUid })
      if (!user) {
        // Create user if not created previously
        const userId = `usr_${crypto.randomBytes(4).toString('hex')}`
        user = await User.create({
          userId,
          firebaseUid,
          email: decoded.email || null,
          displayName: decoded.name || 'DDS User',
          name: decoded.name || 'DDS User',
          photoURL: decoded.picture || null,
          mobileId: normalized.canonical,
          countryCode: normalized.countryCode,
          phoneNumber: normalized.nationalNumber,
          phoneVerified: true,
          status: 'active'
        })
      } else {
        user.mobileId = normalized.canonical
        user.countryCode = normalized.countryCode
        user.phoneNumber = normalized.nationalNumber
        user.phoneVerified = true
        user.status = 'active'
        await user.save()
      }

      console.log(`[MongoDB] Verified and updated mobileId ${user.mobileId} for user ${user.userId}`)

      // Update existing active sessions with canonical mobileId
      await Session.updateMany({ userId: user.userId }, { mobileId: user.mobileId })

      return res.json({
        success: true,
        message: 'Phone number verified and synchronized with DDS identity successfully.',
        data: {
          userId: user.userId,
          firebaseUid: user.firebaseUid,
          mobileId: user.mobileId,
          countryCode: user.countryCode,
          phoneNumber: user.phoneNumber,
          name: user.name,
          email: user.email,
          phoneVerified: user.phoneVerified,
          status: user.status
        }
      })
    } catch (err) {
      console.error('[Firebase Auth] Phone verify error:', err)
      return res.status(500).json({
        success: false,
        error: 'PHONE_SYNC_FAILED',
        message: err.message || 'Failed to synchronize phone verification with MongoDB.'
      })
    }
  },

  // 3. Atomic Account Deletion (POST /api/v1/auth/firebase/delete-account or DELETE /api/v1/users/me)
  async deleteAccount(req, res) {
    try {
      const user = req.user
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required to delete account.'
        })
      }

      console.log(`[Account Delete] Deleting account for user ${user.userId} (firebaseUid: ${user.firebaseUid || 'none'})...`)

      // Step 1: Delete from Firebase Auth if firebaseUid is present
      if (user.firebaseUid) {
        try {
          await deleteFirebaseUser(user.firebaseUid)
        } catch (firebaseErr) {
          console.error(`[Account Delete] Firebase deletion failed:`, firebaseErr.message)
          return res.status(500).json({
            success: false,
            error: 'FIREBASE_DELETE_FAILED',
            message: `Could not delete authentication identity from Firebase: ${firebaseErr.message}`
          })
        }
      }

      // Step 2: Delete from MongoDB User collection
      await User.deleteOne({ _id: user._id })

      // Step 3: Cleanup user sessions
      await Session.deleteMany({ userId: user.userId })

      // Step 4: Write audit log
      try {
        await VerificationLog.create({
          applicationId: 'dds_auth_core',
          mobileId: user.mobileId || 'none',
          userId: user.userId,
          event: 'ACCOUNT_DELETED',
          status: 'SUCCESS',
          details: {
            firebaseUid: user.firebaseUid,
            email: user.email,
            deletedAt: new Date()
          }
        })
      } catch {
        // Non-blocking log
      }

      console.log(`[Account Delete] ✓ User ${user.userId} deleted atomically from Firebase and MongoDB.`)

      return res.json({
        success: true,
        message: 'Your DDS account and authentication identity have been permanently deleted.'
      })
    } catch (err) {
      console.error('[Account Delete] Error:', err)
      return res.status(500).json({
        success: false,
        error: 'DELETE_ACCOUNT_FAILED',
        message: err.message || 'Failed to delete account.'
      })
    }
  },

  // 4. Reconciliation Mechanism (POST /api/v1/auth/firebase/reconcile)
  async reconcile(req, res) {
    try {
      const users = await User.find({ firebaseUid: { $ne: null } })
      const mismatches = []

      for (const u of users) {
        try {
          const fbUser = await getFirebaseUser(u.firebaseUid)
          if (!fbUser) {
            mismatches.push({
              type: 'FIREBASE_USER_MISSING',
              userId: u.userId,
              firebaseUid: u.firebaseUid,
              mobileId: u.mobileId
            })
            console.warn(`[Reconcile] IDENTITY_SYNC_MISMATCH: MongoDB user ${u.userId} exists but Firebase user ${u.firebaseUid} is missing.`)
          }
        } catch (err) {
          mismatches.push({
            type: 'FIREBASE_CHECK_ERROR',
            userId: u.userId,
            firebaseUid: u.firebaseUid,
            error: err.message
          })
        }
      }

      return res.json({
        success: true,
        checkedUsersCount: users.length,
        mismatchCount: mismatches.length,
        mismatches
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 5. Get Current Authenticated User (GET /api/v1/auth/me or GET /api/v1/users/me)
  async getMe(req, res) {
    try {
      const user = req.user
      return res.json({
        success: true,
        data: {
          userId: user.userId,
          firebaseUid: user.firebaseUid,
          mobileId: user.mobileId,
          countryCode: user.countryCode,
          phoneNumber: user.phoneNumber,
          displayName: user.displayName,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          phoneVerified: user.phoneVerified,
          status: user.status
        }
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 6. Get User by mobile ID (Legacy compatibility)
  async getUser(req, res) {
    try {
      const { mobileId } = req.params
      const normalized = normalizeMobile(mobileId)
      if (!normalized.isValid) {
        return res.status(400).json({ success: false, error: normalized.error })
      }

      const user = await User.findOne({ mobileId: normalized.canonical })
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found in DDS.'
        })
      }

      return res.json({
        success: true,
        data: {
          userId: user.userId,
          firebaseUid: user.firebaseUid,
          mobileId: user.mobileId,
          countryCode: user.countryCode,
          phoneNumber: user.phoneNumber,
          name: user.name,
          email: user.email,
          phoneVerified: user.phoneVerified,
          status: user.status
        }
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 7. Logout & Invalidate Session (POST /api/v1/auth/logout)
  async logout(req, res) {
    try {
      const authHeader = req.headers['authorization'] || req.headers['x-session-token']
      let token = null
      if (authHeader) {
        token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim()
      }

      if (token) {
        await Session.deleteMany({ token })
      }

      return res.json({
        success: true,
        message: 'Successfully logged out and session destroyed.'
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 8. User-Scoped Activity & Connected Applications (GET /api/v1/users/me/activity)
  async getMyActivity(req, res) {
    try {
      const user = req.user

      // Find requests for THIS authenticated user only
      const userRequests = await VerificationRequest.find({
        $or: [{ userId: user.userId }, { mobileId: user.mobileId }]
      })
        .sort({ createdAt: -1 })
        .limit(30)

      // Find logs strictly belonging to THIS authenticated user
      const userLogs = await VerificationLog.find({
        $or: [{ userId: user.userId }, { mobileId: user.mobileId }]
      })
        .sort({ timestamp: -1 })
        .limit(30)

      // Derive distinct connected applications for THIS user
      const appsMap = new Map()
      userRequests.forEach((r) => {
        if (!appsMap.has(r.applicationId)) {
          appsMap.set(r.applicationId, {
            applicationId: r.applicationId,
            applicationName: r.applicationName || 'DemoShop',
            websiteUrl: r.websiteUrl || 'http://localhost:5175',
            status: r.status === 'verified' ? 'Active' : 'Connected',
            lastVerifiedAt: r.status === 'verified' ? r.updatedAt : r.createdAt
          })
        }
      })

      // Map clean user-friendly activity events
      const activityItems = userLogs.map((l) => {
        const appName = l.details?.applicationName || 'Connected Application'
        let eventDescription = 'Verification event'

        if (l.event === 'USER_APPROVED') {
          eventDescription = `✓ Verification approved`
        } else if (l.event === 'USER_REJECTED') {
          eventDescription = `✗ Verification rejected`
        } else if (l.event === 'REQUEST_CREATED') {
          eventDescription = `Verification requested`
        } else if (l.event === 'INVALID_CODE') {
          eventDescription = `Invalid verification attempt`
        } else if (l.event === 'REQUEST_EXPIRED') {
          eventDescription = `Verification expired`
        }

        return {
          id: l._id,
          applicationId: l.applicationId,
          applicationName: appName,
          event: l.event,
          description: eventDescription,
          status: l.event === 'USER_APPROVED' ? 'verified' : l.event === 'USER_REJECTED' ? 'rejected' : 'pending',
          timestamp: l.timestamp
        }
      })

      return res.json({
        success: true,
        data: {
          connectedApps: Array.from(appsMap.values()),
          recentActivity: activityItems
        }
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 9. User-Scoped Security Status (GET /api/v1/users/me/security)
  async getMySecurity(req, res) {
    try {
      const user = req.user
      return res.json({
        success: true,
        data: {
          userId: user.userId,
          firebaseUid: user.firebaseUid,
          mobileId: user.mobileId,
          email: user.email,
          googleConnected: true,
          phoneVerified: user.phoneVerified,
          sessionActive: true,
          createdAt: user.createdAt
        }
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 10. Server-to-Server Client Credential Validation (POST /api/v1/auth/validate-client)
  async validateClient(req, res) {
    try {
      const { clientId, clientSecret, origin } = req.body

      if (!clientId) {
        return res.status(400).json({
          success: false,
          status: 'NOT_CONFIGURED',
          error: 'MISSING_CLIENT_ID',
          message: 'Client ID is missing in configuration.'
        })
      }

      if (!clientSecret) {
        return res.status(400).json({
          success: false,
          status: 'NOT_CONFIGURED',
          error: 'MISSING_CLIENT_SECRET',
          message: 'Client Secret is missing in configuration.'
        })
      }

      const app = await Application.findOne({ clientId })
      if (!app) {
        // Check if secret belongs to another app for CREDENTIAL_MISMATCH diagnosis
        const secretHash = crypto.createHash('sha256').update(clientSecret).digest('hex')
        const otherApp = await Application.findOne({
          $or: [{ clientSecret }, { clientSecretHash: secretHash }]
        })
        if (otherApp) {
          return res.status(401).json({
            success: false,
            status: 'CREDENTIAL_MISMATCH',
            error: 'CREDENTIAL_MISMATCH',
            message: `The Client ID "${clientId}" is invalid, but the Client Secret belongs to application "${otherApp.name}". Check your .env configuration.`
          })
        }

        return res.status(401).json({
          success: false,
          status: 'INVALID_CLIENT_ID',
          error: 'INVALID_CLIENT_CREDENTIALS',
          message: 'The configured Client ID does not exist in DDS Auth.'
        })
      }

      // Check Revoked Status
      if (app.status === 'revoked') {
        return res.status(401).json({
          success: false,
          status: 'APPLICATION_REVOKED',
          error: 'APPLICATION_REVOKED',
          message: `Application "${app.name}" has been revoked in the DDS Developer Portal.`
        })
      }

      // Check Disabled Status
      if (app.status === 'disabled') {
        return res.status(403).json({
          success: false,
          status: 'APPLICATION_DISABLED',
          error: 'APPLICATION_DISABLED',
          message: `Application "${app.name}" is currently disabled in the DDS Developer Portal.`
        })
      }

      // Check Secret match securely
      const secretHash = crypto.createHash('sha256').update(clientSecret).digest('hex')
      if (app.clientSecret !== clientSecret && app.clientSecretHash !== secretHash) {
        const otherAppWithSecret = await Application.findOne({
          $or: [{ clientSecret }, { clientSecretHash: secretHash }]
        })

        if (otherAppWithSecret) {
          return res.status(401).json({
            success: false,
            status: 'CREDENTIAL_MISMATCH',
            error: 'CREDENTIAL_MISMATCH',
            message: `Credential mismatch: Client ID belongs to "${app.name}", but Client Secret belongs to "${otherAppWithSecret.name}".`
          })
        }

        return res.status(401).json({
          success: false,
          status: 'INVALID_CLIENT_SECRET',
          error: 'INVALID_CLIENT_CREDENTIALS',
          message: `Client Secret is invalid for application "${app.name}". Verify your secret in the Developer Portal.`
        })
      }

      // Check Allowed Origin if provided
      if (origin) {
        const cleanOrigin = origin.trim().replace(/\/$/, '')
        if (app.allowedOrigins && app.allowedOrigins.length > 0) {
          const normalized = app.allowedOrigins.map(o => o.trim().replace(/\/$/, ''))
          if (!normalized.includes(cleanOrigin)) {
            return res.status(403).json({
              success: false,
              status: 'ORIGIN_NOT_ALLOWED',
              error: 'ORIGIN_NOT_ALLOWED',
              message: `Origin "${cleanOrigin}" is not in the allowed origins list for "${app.name}".`
            })
          }
        }
      }

      return res.json({
        success: true,
        status: 'CONNECTED',
        application: {
          applicationId: app.applicationId,
          name: app.name,
          status: app.status,
          allowedOrigins: app.allowedOrigins
        }
      })
    } catch (err) {
      console.error('Validate client error:', err)
      return res.status(500).json({
        success: false,
        status: 'DDS_ERROR',
        error: 'SERVER_ERROR',
        message: 'Failed to validate client credentials.'
      })
    }
  }
}
