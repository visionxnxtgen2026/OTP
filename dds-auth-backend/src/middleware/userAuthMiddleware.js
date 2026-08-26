import { Session } from '../models/Session.js'
import { User } from '../models/User.js'

export async function authenticateUserSession(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['x-session-token']
    let token = null

    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim()
      } else {
        token = authHeader.trim()
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in to access this resource.'
      })
    }

    const session = await Session.findOne({ token })
    if (!session || new Date(session.expiresAt) < new Date()) {
      if (session) await Session.deleteOne({ _id: session._id })
      return res.status(401).json({
        success: false,
        error: 'SESSION_EXPIRED',
        message: 'Your session has expired. Please log in again.'
      })
    }

    const user = await User.findOne({ userId: session.userId, status: 'active' })
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Authenticated user account not found or is inactive.'
      })
    }

    req.user = user
    req.sessionToken = token
    next()
  } catch (err) {
    console.error('User auth middleware error:', err)
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to authenticate user session.'
    })
  }
}
