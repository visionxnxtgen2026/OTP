import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import chalk from 'chalk'
import { detectProject } from '../detect/projectDetector.js'
import { logger } from '../utils/logger.js'

export async function runDoctorCommand(cwd: string): Promise<void> {
  console.log('')
  console.log(chalk.bold.hex('#123C35')('  ╔══════════════════════════════════════════════════════╗'))
  console.log(chalk.bold.hex('#123C35')('  ║') + chalk.bold.hex('#2F8F6B')('  DDS Auth Diagnostics & Health Check (Doctor)        ') + chalk.bold.hex('#123C35')('║'))
  console.log(chalk.bold.hex('#123C35')('  ║') + chalk.hex('#64746E')('  by ') + chalk.bold.hex('#123C35')('Zogoal                                           ') + chalk.bold.hex('#123C35')('║'))
  console.log(chalk.bold.hex('#123C35')('  ╚══════════════════════════════════════════════════════╝'))
  console.log('')

  // 1. Environment checks
  try {
    const nodeVer = process.version
    logger.success(`Node.js Runtime: ${nodeVer}`)
  } catch {
    logger.error('Node.js runtime not detected')
  }

  try {
    const npmVer = execSync('npm -v', { encoding: 'utf-8' }).trim()
    logger.success(`npm Package Manager: v${npmVer}`)
  } catch {
    logger.warn('npm CLI unavailable')
  }

  // 2. Project structure
  const arch = detectProject(cwd)
  if (arch.hasReact) {
    logger.success('React Framework: Detected')
  } else {
    logger.info('React Framework: Not detected in root')
  }

  if (arch.hasExpress || arch.hasNode) {
    logger.success('Node.js / Express Server: Detected')
  } else {
    logger.info('Node.js / Express Server: Not detected in root')
  }

  // 3. DDS Package check
  if (arch.existingDDSIntegration) {
    logger.success('DDS Auth Integration: Installed (@visionnxtgen2026/dds-auth)')
  } else {
    logger.warn('DDS Auth Integration: Not installed yet. Run "npx create-auth-dds-zogoal" to configure.')
  }

  // 4. Environment & Secrets protection check
  const checkDirs = [cwd, arch.backendPath, arch.frontendPath].filter(Boolean) as string[]
  let foundEnv = false
  for (const dir of checkDirs) {
    const envFile = path.join(dir, '.env')
    if (fs.existsSync(envFile)) {
      foundEnv = true
      const content = fs.readFileSync(envFile, 'utf-8')
      const hasClientId = /DDS_CLIENT_ID=/m.test(content)
      const hasClientSecret = /DDS_CLIENT_SECRET=/m.test(content)
      const hasAuthUrl = /DDS_AUTH_URL=/m.test(content)

      logger.success(`Environment Config: Found .env in ${path.basename(dir) || 'root'}`)
      logger.dim(`DDS_AUTH_URL: ${hasAuthUrl ? 'Configured' : 'Missing'}`)
      logger.dim(`DDS_CLIENT_ID: ${hasClientId ? 'Configured' : 'Missing'}`)
      logger.dim(`DDS_CLIENT_SECRET: ${hasClientSecret ? 'Configured (Hidden)' : 'Missing'}`)
    }
  }

  if (!foundEnv) {
    logger.warn('No .env file found. Expected in backend folder.')
  }

  // 5. DDS Auth Backend reachability test
  const authUrl = process.env.DDS_AUTH_URL || 'http://localhost:5000'
  try {
    const res = await fetch(`${authUrl}/health`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      logger.success(`DDS Auth Server Connectivity: Connected (${authUrl})`)
    } else {
      logger.warn(`DDS Auth Server replied with HTTP ${res.status} at ${authUrl}`)
    }
  } catch {
    logger.warn(`DDS Auth Server is not reachable at ${authUrl} (ensure server is running on port 5000)`)
  }

  console.log('')
  console.log(chalk.bold.hex('#123C35')('  Diagnostics Complete.'))
  console.log('')
}
