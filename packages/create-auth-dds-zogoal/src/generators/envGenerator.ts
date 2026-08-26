import path from 'path'
import fs from 'fs'
import { appendToEnvFile, ensureGitIgnoreHasEnv, safeWriteFile } from '../utils/fileUtils.js'
import { logger } from '../utils/logger.js'

export function setupEnvironmentVariables(
  backendDir: string,
  credentials?: { clientId?: string; clientSecret?: string; authUrl?: string }
): void {
  const envExamplePath = path.join(backendDir, '.env.example')
  const envPath = path.join(backendDir, '.env')

  // 1. Create / Update .env.example
  const defaultExample = `PORT=5001
DDS_AUTH_URL=http://localhost:5000
DDS_CLIENT_ID=
DDS_CLIENT_SECRET=
`
  if (!fs.existsSync(envExamplePath)) {
    safeWriteFile(envExamplePath, defaultExample, true)
    logger.success(`.env.example template created`)
  } else {
    appendToEnvFile(envExamplePath, 'DDS_AUTH_URL', 'http://localhost:5000')
    appendToEnvFile(envExamplePath, 'DDS_CLIENT_ID', '')
    appendToEnvFile(envExamplePath, 'DDS_CLIENT_SECRET', '')
    logger.success(`.env.example updated with DDS variables`)
  }

  // 2. Safe .env update
  if (fs.existsSync(envPath)) {
    logger.success(`Existing .env detected — preserving existing configuration`)
    appendToEnvFile(envPath, 'DDS_AUTH_URL', credentials?.authUrl || 'http://localhost:5000')
    appendToEnvFile(envPath, 'DDS_CLIENT_ID', credentials?.clientId || '')
    appendToEnvFile(envPath, 'DDS_CLIENT_SECRET', credentials?.clientSecret || '')
  } else {
    const defaultEnv = `PORT=5001
DDS_AUTH_URL=${credentials?.authUrl || 'http://localhost:5000'}
DDS_CLIENT_ID=${credentials?.clientId || ''}
DDS_CLIENT_SECRET=${credentials?.clientSecret || ''}
`
    safeWriteFile(envPath, defaultEnv, true)
    logger.success(`.env file created with environment placeholders`)
  }

  // 3. Ensure .env is protected in .gitignore
  ensureGitIgnoreHasEnv(backendDir)
}
