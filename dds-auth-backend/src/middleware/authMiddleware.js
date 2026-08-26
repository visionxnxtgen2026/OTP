import crypto from 'crypto'
import { Application } from '../models/Application.js'

export async function validateClientCredentials(req, res, next) {
  try {
    const clientId = req.headers['x-client-id'] || req.body.clientId
    const clientSecret = req.headers['x-client-secret'] || req.body.clientSecret

    if (!clientId || !clientSecret) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Missing x-client-id or x-client-secret headers.'
      })
    }

    // Find Application by clientId
    const app = await Application.findOne({ clientId })
    if (!app) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED_APPLICATION',
        message: 'Application not found with provided Client ID.'
      })
    }

    // Check Revoked Status (Requirement #17, #25)
    if (app.status === 'revoked') {
      return res.status(401).json({
        success: false,
        error: 'APPLICATION_REVOKED',
        message: 'This application has been revoked.'
      })
    }

    // Check Disabled Status (Requirement #10, #25)
    if (app.status === 'disabled') {
      return res.status(403).json({
        success: false,
        error: 'APPLICATION_DISABLED',
        message: 'This application is disabled and cannot process verification requests.'
      })
    }

    // Verify secret match (supports plaintext or SHA-256 hash match)
    const secretHash = crypto.createHash('sha256').update(clientSecret).digest('hex')
    if (app.clientSecret !== clientSecret && app.clientSecretHash !== secretHash) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid client secret.'
      })
    }

    // Validate Request Origin (Requirement #5, #6, #25)
    const reqOrigin = req.headers['origin'] || req.headers['x-origin']
    if (reqOrigin) {
      const cleanReqOrigin = reqOrigin.trim().replace(/\/$/, '')

      if (app.allowedOrigins && app.allowedOrigins.length > 0) {
        const normalizedAllowed = app.allowedOrigins.map((o) => o.trim().replace(/\/$/, ''))
        const isAllowed = normalizedAllowed.includes(cleanReqOrigin)

        if (!isAllowed) {
          console.warn(`[DDS Auth Security] Origin rejected: ${cleanReqOrigin} not in ${JSON.stringify(normalizedAllowed)} for app ${app.name}`)
          return res.status(403).json({
            success: false,
            error: 'ORIGIN_NOT_ALLOWED',
            message: 'This origin is not authorized for this application.'
          })
        }
      }
    }

    req.application = app
    next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to authenticate client application.'
    })
  }
}
