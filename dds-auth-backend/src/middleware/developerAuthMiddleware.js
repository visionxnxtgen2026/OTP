import { Developer } from '../models/Developer.js'
import { Session } from '../models/Session.js'
import { verifyFirebaseIdToken } from '../services/firebaseAdmin.service.js'

/**
 * Middleware to authenticate and authorize Developer Portal requests
 * Requirement #8, #11, #12, #15
 */
export async function authenticateDeveloper(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['x-developer-token']
    let token = null

    if (authHeader) {
      token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim()
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Developer authentication required. Please sign in to the Developer Portal.'
      })
    }

    let developer = null

    // Case 1: Check if token is a session token from MongoDB Session store
    const session = await Session.findOne({ token })
    if (session) {
      if (session.expiresAt && session.expiresAt < new Date()) {
        await Session.deleteOne({ _id: session._id })
        return res.status(401).json({
          success: false,
          error: 'SESSION_EXPIRED',
          message: 'Your developer session has expired. Please sign in again.'
        })
      }

      developer = await Developer.findOne({
        $or: [
          { developerId: session.userId },
          { firebaseUid: session.firebaseUid }
        ]
      })
    }

    // Case 2: Check if token is a Firebase ID Token directly
    if (!developer) {
      try {
        const decoded = await verifyFirebaseIdToken(token)
        if (decoded && decoded.uid) {
          developer = await Developer.findOne({ firebaseUid: decoded.uid })
          if (!developer) {
            // Auto-provision developer if not yet in database
            const devId = `dev_${decoded.uid.substring(0, 8)}`
            developer = await Developer.create({
              developerId: devId,
              firebaseUid: decoded.uid,
              email: decoded.email || `${decoded.uid}@developer.dds.auth`,
              displayName: decoded.name || decoded.displayName || 'Developer',
              photoURL: decoded.picture || decoded.photoURL || null,
              accountType: 'developer',
              status: 'active'
            })
          }
        }
      } catch (tokenErr) {
        console.warn('[Developer Auth Middleware] Token verify note:', tokenErr.message)
      }
    }

    // If still no developer found:
    if (!developer) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid developer authentication token.'
      })
    }

    // Check if account is disabled (Requirement #15)
    if (developer.status === 'disabled') {
      return res.status(403).json({
        success: false,
        error: 'DEVELOPER_ACCOUNT_DISABLED',
        message: 'Developer account has been disabled. Please contact support.'
      })
    }

    req.developer = developer
    next()
  } catch (err) {
    console.error('[Developer Auth Middleware] Error:', err.message)
    return res.status(500).json({
      success: false,
      error: 'AUTH_MIDDLEWARE_ERROR',
      message: 'Failed to authenticate developer.'
    })
  }
}
