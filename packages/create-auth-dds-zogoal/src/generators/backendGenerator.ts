import path from 'path'
import { safeWriteFile, ensureDir } from '../utils/fileUtils.js'
import { logger } from '../utils/logger.js'

export function generateBackendIntegration(targetDir: string, hasTypeScript: boolean): string[] {
  const ext = hasTypeScript ? 'ts' : 'js'
  const createdFiles: string[] = []

  // 1. Backend SDK client initialization in src/integrations/dds.ts (or root integrations)
  const integrationsDir = path.join(targetDir, 'src', 'integrations')
  ensureDir(integrationsDir)

  const ddsClientContent = hasTypeScript
    ? `import { DDSAuth } from '@visionnxtgen2026/dds-auth/server'

export const dds = new DDSAuth({
  clientId: process.env.DDS_CLIENT_ID || '',
  clientSecret: process.env.DDS_CLIENT_SECRET || '',
  baseURL: process.env.DDS_AUTH_URL || 'http://localhost:5000'
})

export default dds
`
    : `import { DDSAuth } from '@visionnxtgen2026/dds-auth/server'

export const dds = new DDSAuth({
  clientId: process.env.DDS_CLIENT_ID || '',
  clientSecret: process.env.DDS_CLIENT_SECRET || '',
  baseURL: process.env.DDS_AUTH_URL || 'http://localhost:5000'
})

export default dds
`
  const clientPath = path.join(integrationsDir, `dds.${ext}`)
  if (safeWriteFile(clientPath, ddsClientContent, false)) {
    createdFiles.push(clientPath)
  }

  // 2. Express Verification Routes
  const routesDir = path.join(targetDir, 'src', 'routes')
  ensureDir(routesDir)

  const routesContent = hasTypeScript
    ? `import { Router, Request, Response } from 'express'
import { dds } from '../integrations/dds.js'

export const ddsVerificationRouter = Router()

/**
 * POST /api/dds/verification/request
 * Initiates a secure mobile verification challenge via DDS Auth
 */
ddsVerificationRouter.post('/request', async (req: Request, res: Response) => {
  try {
    const { mobileNumber, origin } = req.body
    if (!mobileNumber) {
      return res.status(400).json({ success: false, error: 'Mobile number is required' })
    }

    const requestOrigin = origin || req.headers.origin || 'http://localhost:5175'

    const result = await dds.verification.request({
      mobileId: mobileNumber,
      origin: requestOrigin
    })

    return res.status(200).json({
      success: true,
      requestId: result.requestId,
      expiresAt: result.expiresAt,
      status: result.status
    })
  } catch (err: any) {
    console.error('[DDS Verification Route Error]:', err.message)
    const statusCode = err.statusCode || 500
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Failed to initiate DDS verification'
    })
  }
})

/**
 * GET /api/dds/verification/status/:requestId
 * Polls verification challenge approval status
 */
ddsVerificationRouter.get('/status/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params
    const result = await dds.verification.getStatus(requestId)

    return res.status(200).json({
      success: true,
      requestId: result.requestId,
      status: result.status.toLowerCase(),
      verifiedAt: result.verifiedAt
    })
  } catch (err: any) {
    const statusCode = err.statusCode || 500
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Failed to retrieve verification status'
    })
  }
})

export default ddsVerificationRouter
`
    : `import { Router } from 'express'
import { dds } from '../integrations/dds.js'

export const ddsVerificationRouter = Router()

ddsVerificationRouter.post('/request', async (req, res) => {
  try {
    const { mobileNumber, origin } = req.body
    if (!mobileNumber) {
      return res.status(400).json({ success: false, error: 'Mobile number is required' })
    }

    const requestOrigin = origin || req.headers.origin || 'http://localhost:5175'

    const result = await dds.verification.request({
      mobileId: mobileNumber,
      origin: requestOrigin
    })

    return res.status(200).json({
      success: true,
      requestId: result.requestId,
      expiresAt: result.expiresAt,
      status: result.status
    })
  } catch (err) {
    console.error('[DDS Verification Route Error]:', err.message)
    const statusCode = err.statusCode || 500
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Failed to initiate DDS verification'
    })
  }
})

ddsVerificationRouter.get('/status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params
    const result = await dds.verification.getStatus(requestId)

    return res.status(200).json({
      success: true,
      requestId: result.requestId,
      status: result.status.toLowerCase(),
      verifiedAt: result.verifiedAt
    })
  } catch (err) {
    const statusCode = err.statusCode || 500
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Failed to retrieve verification status'
    })
  }
})

export default ddsVerificationRouter
`
  const routesPath = path.join(routesDir, `ddsVerification.routes.${ext}`)
  if (safeWriteFile(routesPath, routesContent, false)) {
    createdFiles.push(routesPath)
  }

  logger.success(`DDS Server integration created at src/integrations/dds.${ext}`)
  logger.success(`Verification routes created at src/routes/ddsVerification.routes.${ext}`)
  return createdFiles
}
