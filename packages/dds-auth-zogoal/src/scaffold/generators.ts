import path from 'path'
import { safeWriteFile, ensureDir } from './utils/fileUtils.js'

const PKG = 'dds-auth-zogoal'

// ─── Frontend Generator ──────────────────────────────────────────────────────

export function generateFrontend(targetDir: string): string[] {
  const integrationDir = path.join(targetDir, 'src', 'integrations', 'dds')
  ensureDir(integrationDir)
  const created: string[] = []

  // 1. DDSProvider
  const provider = `import React, { createContext, useContext, useMemo } from 'react'
import { DDSProvider as BaseDDSProvider } from '${PKG}/react'

export const DDSProvider = ({ children, merchantApiUrl = process.env.REACT_APP_API_URL || process.env.VITE_API_URL || 'http://localhost:5001' }) => {
  return <BaseDDSProvider merchantApiUrl={merchantApiUrl}>{children}</BaseDDSProvider>
}
export default DDSProvider
`
  if (safeWriteFile(path.join(integrationDir, 'DDSProvider.jsx'), provider, false))
    created.push('src/integrations/dds/DDSProvider.jsx')

  // 2. DDSVerificationButton — thin wrapper over the built-in component
  const button = `import React from 'react'
import { DDSVerificationButton as BaseButton } from '${PKG}/react'

export const DDSVerificationButton = (props) => <BaseButton {...props} />
export default DDSVerificationButton
`
  if (safeWriteFile(path.join(integrationDir, 'DDSVerificationButton.jsx'), button, false))
    created.push('src/integrations/dds/DDSVerificationButton.jsx')

  // 3. Full DDSVerification modal (standalone — no wrapper dependency)
  const modal = `import React from 'react'
import { DDSProvider, DDSVerificationButton } from '${PKG}/react'

/**
 * DDSVerification — Drop-in DDS verification flow
 *
 * Usage:
 *   <DDSVerification
 *     merchantApiUrl="http://localhost:5001"
 *     onSuccess={(requestId) => console.log('Verified:', requestId)}
 *   />
 */
export const DDSVerification = ({ merchantApiUrl, onSuccess, buttonText, className }) => {
  return (
    <DDSProvider merchantApiUrl={merchantApiUrl}>
      <DDSVerificationButton
        merchantApiUrl={merchantApiUrl}
        onVerified={onSuccess}
        buttonText={buttonText || 'Verify Identity with DDS'}
        className={className}
      />
    </DDSProvider>
  )
}

export default DDSVerification
`
  if (safeWriteFile(path.join(integrationDir, 'DDSVerification.jsx'), modal, false))
    created.push('src/integrations/dds/DDSVerification.jsx')

  // 4. Barrel index
  const idx = `export { DDSProvider } from './DDSProvider.jsx'
export { DDSVerificationButton } from './DDSVerificationButton.jsx'
export { DDSVerification } from './DDSVerification.jsx'
// Re-export hook + badge directly from the package
export { useDDSVerification, DDSStatusBadge } from '${PKG}/react'
`
  if (safeWriteFile(path.join(integrationDir, 'index.js'), idx, false))
    created.push('src/integrations/dds/index.js')

  return created
}

// ─── Backend Generator ───────────────────────────────────────────────────────

export function generateBackend(targetDir: string): string[] {
  const created: string[] = []

  // 1. DDS client init
  ensureDir(path.join(targetDir, 'src', 'integrations'))
  const client = `import { DDSAuth } from '${PKG}/server'

const dds = new DDSAuth({
  clientId: process.env.DDS_CLIENT_ID || '',
  clientSecret: process.env.DDS_CLIENT_SECRET || '',
  baseURL: process.env.DDS_AUTH_URL || 'http://localhost:5000'
})

export default dds
`
  if (safeWriteFile(path.join(targetDir, 'src', 'integrations', 'dds.js'), client, false))
    created.push('src/integrations/dds.js')

  // 2. Verification routes
  ensureDir(path.join(targetDir, 'src', 'routes'))
  const routes = `import { Router } from 'express'
import dds from '../integrations/dds.js'

export const ddsVerificationRouter = Router()

/**
 * POST /api/dds/verification/request
 * Initiates a mobile verification challenge via DDS Auth
 */
ddsVerificationRouter.post('/request', async (req, res) => {
  try {
    const { mobileNumber, origin } = req.body
    if (!mobileNumber) {
      return res.status(400).json({ success: false, error: 'mobileNumber is required' })
    }
    const requestOrigin = origin || req.headers.origin || 'http://localhost:5175'
    const result = await dds.verification.request({ mobileId: mobileNumber, origin: requestOrigin })
    return res.json({
      success: true,
      requestId: result.requestId,
      expiresAt: result.expiresAt,
      status: result.status
    })
  } catch (err) {
    console.error('[DDS /request]', err.message)
    return res.status(err.statusCode || 500).json({ success: false, error: err.message })
  }
})

/**
 * GET /api/dds/verification/status/:requestId
 * Polls DDS verification approval status
 */
ddsVerificationRouter.get('/status/:requestId', async (req, res) => {
  try {
    const result = await dds.verification.getStatus(req.params.requestId)
    return res.json({
      success: true,
      requestId: result.requestId,
      status: result.status.toLowerCase(),
      verifiedAt: result.verifiedAt
    })
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, error: err.message })
  }
})

export default ddsVerificationRouter
`
  if (safeWriteFile(path.join(targetDir, 'src', 'routes', 'ddsVerification.routes.js'), routes, false))
    created.push('src/routes/ddsVerification.routes.js')

  return created
}

// ─── Env Generator ────────────────────────────────────────────────────────────

export function generateEnv(backendDir: string): void {
  const { appendToEnvFile, safeWriteFile, ensureGitIgnoreHasEnv } = require('./utils/fileUtils.js')
  const fs = require('fs')
  const path = require('path')

  const envExamplePath = path.join(backendDir, '.env.example')
  const envPath = path.join(backendDir, '.env')

  const template = `# DDS Auth Configuration — by Zogoal
# Get your credentials from the DDS Developer Portal
DDS_AUTH_URL=http://localhost:5000
DDS_CLIENT_ID=
DDS_CLIENT_SECRET=
PORT=5001
`
  if (!fs.existsSync(envExamplePath)) {
    safeWriteFile(envExamplePath, template, true)
  } else {
    appendToEnvFile(envExamplePath, 'DDS_AUTH_URL', 'http://localhost:5000')
    appendToEnvFile(envExamplePath, 'DDS_CLIENT_ID', '')
    appendToEnvFile(envExamplePath, 'DDS_CLIENT_SECRET', '')
  }

  if (fs.existsSync(envPath)) {
    appendToEnvFile(envPath, 'DDS_AUTH_URL', 'http://localhost:5000')
    appendToEnvFile(envPath, 'DDS_CLIENT_ID', '')
    appendToEnvFile(envPath, 'DDS_CLIENT_SECRET', '')
  }

  ensureGitIgnoreHasEnv(backendDir)
}
