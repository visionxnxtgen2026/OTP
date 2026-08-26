import crypto from 'crypto'
import { Application } from '../models/Application.js'
import { Developer } from '../models/Developer.js'
import { Session } from '../models/Session.js'
import { VerificationLog } from '../models/VerificationLog.js'
import { VerificationRequest } from '../models/VerificationRequest.js'
import { verifyFirebaseIdToken } from '../services/firebaseAdmin.service.js'

// Helper to validate origin URL
function isValidOrigin(urlStr) {
  try {
    const url = new URL(urlStr)
    if (!['http:', 'https:'].includes(url.protocol)) return false
    // Origin must not have a path other than root
    if (url.pathname !== '' && url.pathname !== '/') return false
    return true
  } catch {
    return false
  }
}

// Helper to validate callback URL
function isValidCallbackUrl(urlStr) {
  try {
    const url = new URL(urlStr)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

export const developerController = {
  // 1. Developer Session Authentication (Requirement #11, #13, #14, #15)
  async authSession(req, res) {
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
      const email = decoded.email || `${firebaseUid}@developer.dds.auth`
      const displayName = decoded.name || decoded.displayName || 'DDS Developer'
      const photoURL = decoded.picture || decoded.photoURL || null

      console.log(`[Developer Portal Auth] Verified Firebase ID token for UID: ${firebaseUid} (${email})`)

      // Find or create Developer record in MongoDB
      let developer = await Developer.findOne({ firebaseUid })

      if (!developer) {
        // Check if there is an existing developer by email to link
        developer = await Developer.findOne({ email })
        if (developer) {
          developer.firebaseUid = firebaseUid
          developer.lastLoginAt = new Date()
          if (photoURL) developer.photoURL = photoURL
          if (displayName) developer.displayName = displayName
          await developer.save()
        } else {
          // Create new Developer in MongoDB (Requirement #14)
          const developerId = `dev_${crypto.randomBytes(4).toString('hex')}`
          developer = await Developer.create({
            developerId,
            firebaseUid,
            email,
            displayName,
            photoURL,
            accountType: 'developer',
            status: 'active',
            lastLoginAt: new Date()
          })
          console.log(`[Developer Portal] Created new Developer record in MongoDB: ${developer.developerId} (${email})`)
        }
      } else {
        // Update existing developer login timestamp
        developer.lastLoginAt = new Date()
        if (photoURL && !developer.photoURL) developer.photoURL = photoURL
        if (displayName) developer.displayName = displayName
        await developer.save()
      }

      // Check Developer Authorization Status (Requirement #15)
      if (developer.status === 'disabled') {
        console.warn(`[Developer Portal] Rejected disabled developer login: ${developer.developerId}`)
        return res.status(403).json({
          success: false,
          error: 'DEVELOPER_ACCOUNT_DISABLED',
          message: 'Developer account has been disabled. Please contact DDS Administrator.'
        })
      }

      // Generate secure 7-day scoped Developer session token
      const sessionToken = `dds_dev_sess_${crypto.randomBytes(24).toString('hex')}`
      await Session.create({
        token: sessionToken,
        userId: developer.developerId,
        firebaseUid: developer.firebaseUid,
        mobileId: '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })

      // Link any unassigned default demo apps to this developer if they have no apps yet
      const existingAppsCount = await Application.countDocuments({
        developerId: developer.developerId,
        status: { $ne: 'revoked' }
      })
      if (existingAppsCount === 0) {
        await Application.updateMany(
          { developerId: { $in: ['dev_001', null, ''] } },
          { $set: { developerId: developer.developerId } }
        )
      }

      return res.json({
        success: true,
        token: sessionToken,
        developer: {
          developerId: developer.developerId,
          email: developer.email,
          displayName: developer.displayName,
          photoURL: developer.photoURL,
          status: developer.status
        }
      })
    } catch (err) {
      console.error('[Developer Portal Auth] Error:', err.message)
      return res.status(401).json({
        success: false,
        error: 'FIREBASE_AUTH_FAILED',
        message: err.message || 'Firebase authentication failed.'
      })
    }
  },

  // 2. Get Current Authenticated Developer Profile (GET /developer/me)
  async getMe(req, res) {
    try {
      const dev = req.developer
      return res.json({
        success: true,
        data: {
          developerId: dev.developerId,
          email: dev.email,
          displayName: dev.displayName,
          photoURL: dev.photoURL,
          status: dev.status,
          accountType: dev.accountType,
          lastLoginAt: dev.lastLoginAt
        }
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 3. Get Applications (Requirement #16 - Scoped by developerId)
  async getApplications(req, res) {
    try {
      const filter = { status: { $ne: 'revoked' } }
      if (req.developer?.developerId) {
        filter.$or = [
          { developerId: req.developer.developerId },
          { developerId: 'dev_001' },
          { developerId: null },
          { developerId: { $exists: false } }
        ]
      }

      const apps = await Application.find(filter).sort({ createdAt: -1 })
      return res.json({
        success: true,
        data: apps.map((a) => ({
          id: a.applicationId,
          applicationId: a.applicationId,
          clientId: a.clientId,
          clientSecret: a.clientSecret,
          name: a.name,
          websiteUrl: a.websiteUrl,
          allowedOrigins: a.allowedOrigins || ['http://localhost:5175'],
          callbackUrls: a.callbackUrls || ['http://localhost:5175/callback'],
          status: a.status,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt
        }))
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 4. Get Single Application
  async getApplication(req, res) {
    try {
      const { applicationId } = req.params
      const app = await Application.findOne({ applicationId })
      if (!app) {
        return res.status(404).json({ success: false, error: 'Application not found' })
      }
      return res.json({
        success: true,
        data: {
          id: app.applicationId,
          applicationId: app.applicationId,
          clientId: app.clientId,
          clientSecret: app.clientSecret,
          name: app.name,
          websiteUrl: app.websiteUrl,
          allowedOrigins: app.allowedOrigins || [],
          callbackUrls: app.callbackUrls || [],
          status: app.status,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt
        }
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 5. Create New Application (Requirement #16)
  async createApplication(req, res) {
    try {
      const { name, websiteUrl, callbackUrl, allowedOrigin } = req.body

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Application name is required' })
      }

      const randomHex = crypto.randomBytes(4).toString('hex')
      const applicationId = `app_${randomHex}`
      const clientId = `dds_client_${randomHex}`
      const clientSecret = `dds_secret_${crypto.randomBytes(16).toString('hex')}`
      const clientSecretHash = crypto.createHash('sha256').update(clientSecret).digest('hex')

      const finalWebsite = websiteUrl || 'http://localhost:5175'
      const finalOrigin = allowedOrigin || finalWebsite
      const finalCallback = callbackUrl || `${finalWebsite}/callback`

      const developerId = req.developer ? req.developer.developerId : 'dev_001'

      const app = await Application.create({
        applicationId,
        clientId,
        clientSecret,
        clientSecretHash,
        name: name.trim(),
        websiteUrl: finalWebsite,
        allowedOrigins: [finalOrigin.trim().replace(/\/$/, '')],
        callbackUrls: [finalCallback.trim()],
        developerId,
        status: 'active'
      })

      console.log(`[Developer Portal] Created new application: ${app.name} (${app.applicationId}) for developer: ${developerId}`)

      return res.status(201).json({
        success: true,
        data: {
          id: app.applicationId,
          applicationId: app.applicationId,
          clientId: app.clientId,
          clientSecret: app.clientSecret,
          name: app.name,
          websiteUrl: app.websiteUrl,
          allowedOrigins: app.allowedOrigins,
          callbackUrls: app.callbackUrls,
          status: app.status,
          createdAt: app.createdAt
        }
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 6. Add Allowed Origin
  async addOrigin(req, res) {
    try {
      const { applicationId } = req.params
      const { origin } = req.body

      if (!origin || !origin.trim()) {
        return res.status(400).json({ success: false, error: 'Origin URL is required' })
      }

      const rawOrigin = origin.trim().replace(/\/$/, '')

      if (!isValidOrigin(rawOrigin)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_ORIGIN',
          message: 'Origin must include protocol (http:// or https://) and must not contain a subpath (e.g. https://shop.example.com or http://localhost:5175).'
        })
      }

      const app = await Application.findOne({ applicationId })
      if (!app) {
        return res.status(404).json({ success: false, error: 'Application not found' })
      }

      if (app.allowedOrigins.includes(rawOrigin)) {
        return res.status(400).json({
          success: false,
          error: 'DUPLICATE_ORIGIN',
          message: 'This origin is already configured for this application.'
        })
      }

      app.allowedOrigins.push(rawOrigin)
      await app.save()

      return res.json({
        success: true,
        message: 'Origin added successfully.',
        data: app.allowedOrigins
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 7. Remove Allowed Origin
  async removeOrigin(req, res) {
    try {
      const { applicationId } = req.params
      const { origin } = req.body

      if (!origin) {
        return res.status(400).json({ success: false, error: 'Origin to remove is required' })
      }

      const app = await Application.findOne({ applicationId })
      if (!app) {
        return res.status(404).json({ success: false, error: 'Application not found' })
      }

      app.allowedOrigins = app.allowedOrigins.filter((o) => o !== origin.trim() && o !== origin.trim().replace(/\/$/, ''))
      await app.save()

      return res.json({
        success: true,
        message: 'Origin removed.',
        data: app.allowedOrigins
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 8. Add Callback URL
  async addCallbackUrl(req, res) {
    try {
      const { applicationId } = req.params
      const { callbackUrl } = req.body

      if (!callbackUrl || !callbackUrl.trim()) {
        return res.status(400).json({ success: false, error: 'Callback URL is required' })
      }

      const rawUrl = callbackUrl.trim()
      if (!isValidCallbackUrl(rawUrl)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_CALLBACK_URL',
          message: 'Callback URL must be a valid URL with http:// or https://'
        })
      }

      const app = await Application.findOne({ applicationId })
      if (!app) {
        return res.status(404).json({ success: false, error: 'Application not found' })
      }

      if (app.callbackUrls.includes(rawUrl)) {
        return res.status(400).json({
          success: false,
          error: 'DUPLICATE_CALLBACK',
          message: 'This callback URL is already configured.'
        })
      }

      app.callbackUrls.push(rawUrl)
      await app.save()

      return res.json({
        success: true,
        message: 'Callback URL added.',
        data: app.callbackUrls
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 9. Remove Callback URL
  async removeCallbackUrl(req, res) {
    try {
      const { applicationId } = req.params
      const { callbackUrl } = req.body

      if (!callbackUrl) {
        return res.status(400).json({ success: false, error: 'Callback URL to remove is required' })
      }

      const app = await Application.findOne({ applicationId })
      if (!app) {
        return res.status(404).json({ success: false, error: 'Application not found' })
      }

      app.callbackUrls = app.callbackUrls.filter((c) => c !== callbackUrl.trim())
      await app.save()

      return res.json({
        success: true,
        message: 'Callback URL removed.',
        data: app.callbackUrls
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 10. Toggle Application Status
  async toggleStatus(req, res) {
    try {
      const { applicationId } = req.params
      const app = await Application.findOne({ applicationId })
      if (!app) {
        return res.status(404).json({ success: false, error: 'Application not found' })
      }

      if (app.status === 'revoked') {
        return res.status(400).json({
          success: false,
          error: 'CANNOT_MODIFY_REVOKED',
          message: 'Revoked application cannot be modified.'
        })
      }

      const nextStatus = app.status === 'active' ? 'disabled' : 'active'
      app.status = nextStatus
      await app.save()

      console.log(`[Developer Portal] Application ${app.name} (${applicationId}) status changed to: ${nextStatus}`)

      return res.json({
        success: true,
        status: app.status,
        message: `Application is now ${nextStatus}.`
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 11. Regenerate Client Secret
  async regenerateSecret(req, res) {
    try {
      const { applicationId } = req.params
      const app = await Application.findOne({ applicationId })
      if (!app) {
        return res.status(404).json({ success: false, error: 'Application not found' })
      }

      if (app.status === 'revoked') {
        return res.status(400).json({ success: false, error: 'Cannot regenerate secret for revoked application' })
      }

      const newSecret = `dds_secret_${crypto.randomBytes(16).toString('hex')}`
      const newSecretHash = crypto.createHash('sha256').update(newSecret).digest('hex')

      app.clientSecret = newSecret
      app.clientSecretHash = newSecretHash
      await app.save()

      console.log(`[Developer Portal] Regenerated Client Secret for ${app.name} (${applicationId})`)

      return res.json({
        success: true,
        clientSecret: newSecret,
        message: 'Client Secret regenerated successfully. Old secret is invalidated.'
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 12. Delete Application with Type-To-Confirm
  async deleteApplication(req, res) {
    try {
      const { applicationId } = req.params
      const { confirmation } = req.body

      const app = await Application.findOne({ applicationId })
      if (!app) {
        return res.status(404).json({ success: false, error: 'Application not found' })
      }

      // Exact case-sensitive match check
      if (confirmation !== app.name) {
        return res.status(400).json({
          success: false,
          error: 'CONFIRMATION_MISMATCH',
          message: `Confirmation text must match the exact application name "${app.name}".`
        })
      }

      // Mark status as revoked and record timestamp
      app.status = 'revoked'
      app.deletedAt = new Date()
      await app.save()

      console.log(`[Developer Portal] Application PERMANENTLY REVOKED / DELETED: ${app.name} (${applicationId})`)

      return res.json({
        success: true,
        message: `Application "${app.name}" has been permanently deleted and credentials revoked.`
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 13. Test Connection Server-Side
  async testConnection(req, res) {
    try {
      const { applicationId } = req.params
      const app = await Application.findOne({ applicationId })
      if (!app) {
        return res.status(404).json({
          success: false,
          status: 'NOT_FOUND',
          error: 'APPLICATION_NOT_FOUND',
          message: 'Application not found in DDS Auth database.'
        })
      }

      if (app.status === 'revoked') {
        return res.status(400).json({
          success: false,
          status: 'APPLICATION_REVOKED',
          error: 'APPLICATION_REVOKED',
          message: `Application "${app.name}" is revoked. All API credentials have been permanently disabled.`
        })
      }

      if (app.status === 'disabled') {
        return res.status(400).json({
          success: false,
          status: 'APPLICATION_DISABLED',
          error: 'APPLICATION_DISABLED',
          message: `Application "${app.name}" is currently disabled. Enable it to allow verification requests.`
        })
      }

      return res.json({
        success: true,
        status: 'CONNECTED',
        message: `Connection successful. Application "${app.name}" is active, credentials are valid, and origin "${app.allowedOrigins?.[0] || 'http://localhost:5175'}" is configured.`,
        data: {
          applicationId: app.applicationId,
          clientId: app.clientId,
          status: app.status,
          allowedOrigins: app.allowedOrigins
        }
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 14. Get Verification Logs
  async getLogs(req, res) {
    try {
      const { limit = 50 } = req.query
      const logs = await VerificationLog.find()
        .sort({ timestamp: -1 })
        .limit(Number(limit))

      return res.json({
        success: true,
        data: logs.map((l) => ({
          id: l._id,
          applicationId: l.applicationId,
          requestId: l.requestId,
          mobileId: l.mobileId ? `${l.mobileId.slice(0, 6)}****${l.mobileId.slice(-2)}` : 'N/A',
          event: l.event,
          details: l.details,
          timestamp: l.timestamp
        }))
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  },

  // 15. Get Developer Dashboard Statistics
  async getStats(req, res) {
    try {
      const totalApps = await Application.countDocuments({ status: { $ne: 'revoked' } })
      const totalRequests = await VerificationRequest.countDocuments()
      const verifiedRequests = await VerificationRequest.countDocuments({ status: 'verified' })
      const pendingRequests = await VerificationRequest.countDocuments({ status: 'pending' })
      const rejectedRequests = await VerificationRequest.countDocuments({ status: { $in: ['rejected', 'locked', 'expired'] } })

      const successRate = totalRequests > 0 ? Math.round((verifiedRequests / totalRequests) * 100) : 100

      return res.json({
        success: true,
        data: {
          totalApps,
          totalRequests,
          verifiedRequests,
          pendingRequests,
          rejectedRequests,
          successRate
        }
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  }
}
