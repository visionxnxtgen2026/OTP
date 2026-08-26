import chalk from 'chalk'
import { printBanner } from '../utils/banner.js'
import { logger } from '../utils/logger.js'
import { detectProject } from '../detect/projectDetector.js'
import { generateFrontendIntegration } from '../generators/frontendGenerator.js'
import { generateBackendIntegration } from '../generators/backendGenerator.js'
import { setupEnvironmentVariables } from '../generators/envGenerator.js'
import { installDdsDependencies } from '../installers/dependencyInstaller.js'
import { promptForIntegrationScope, promptForConfirmation } from '../prompts/interactive.js'

export interface InitCommandOptions {
  yes?: boolean
  frontend?: string
  backend?: string
  dryRun?: boolean
}

export async function runInitCommand(cwd: string, options: InitCommandOptions = {}): Promise<void> {
  printBanner()

  // 1. Detect architecture
  const arch = detectProject(cwd)

  let shouldSetupFrontend = options.frontend ? options.frontend === 'react' : arch.hasReact
  let shouldSetupBackend = options.backend ? options.backend === 'express' || options.backend === 'node' : arch.hasNode || arch.hasExpress

  if (arch.hasReact) {
    logger.success('React frontend detected')
  }
  if (arch.hasNode || arch.hasExpress) {
    logger.success('Node.js / Express backend detected')
  }

  // If neither detected automatically and not non-interactive
  if (!shouldSetupFrontend && !shouldSetupBackend && !options.yes) {
    logger.warn('Could not automatically determine project architecture.')
    const choice = await promptForIntegrationScope()
    if (choice === 'cancel') {
      logger.info('Setup cancelled.')
      return
    }
    if (choice === 'both' || choice === 'frontend') shouldSetupFrontend = true
    if (choice === 'both' || choice === 'backend') shouldSetupBackend = true
  }

  // Default to full stack if empty
  if (!shouldSetupFrontend && !shouldSetupBackend) {
    shouldSetupFrontend = true
    shouldSetupBackend = true
  }

  // 2. Existing integration warning
  if (arch.existingDDSIntegration && !options.yes) {
    logger.warn('Existing DDS Auth integration detected.')
    const proceed = await promptForConfirmation('Do you want to update/re-scaffold DDS Auth integration?')
    if (!proceed) {
      logger.info('Setup aborted. Existing files were preserved.')
      return
    }
  }

  // 3. Display setup plan
  console.log('')
  console.log(chalk.bold.hex('#102F2A')('  DDS Auth Setup Plan:'))
  if (shouldSetupFrontend) {
    logger.dim(`• Install @visionnxtgen2026/dds-auth in frontend (${arch.frontendPath ? arch.frontendPath : 'root'})`)
    logger.dim(`• Generate React DDSProvider & DDSVerificationButton components`)
  }
  if (shouldSetupBackend) {
    logger.dim(`• Install @visionnxtgen2026/dds-auth in backend (${arch.backendPath ? arch.backendPath : 'root'})`)
    logger.dim(`• Generate Express DDS Client & Verification Router`)
    logger.dim(`• Generate / Update .env.example & protect .env in .gitignore`)
  }

  if (!options.yes) {
    console.log('')
    const confirm = await promptForConfirmation('Continue with setup?')
    if (!confirm) {
      logger.info('Setup cancelled.')
      return
    }
  }

  if (options.dryRun) {
    logger.info('Dry run enabled — no changes were written.')
    return
  }

  // 4. Install Dependencies
  logger.step('Installing DDS Auth Dependencies...')
  if (shouldSetupFrontend && arch.frontendPath) {
    installDdsDependencies(arch.frontendPath, arch.packageManager)
  }
  if (shouldSetupBackend && arch.backendPath && arch.backendPath !== arch.frontendPath) {
    installDdsDependencies(arch.backendPath, arch.packageManager)
  }
  if (!arch.frontendPath && !arch.backendPath) {
    installDdsDependencies(cwd, arch.packageManager)
  }

  // 5. Generate Frontend Integration
  if (shouldSetupFrontend) {
    logger.step('Configuring Frontend...')
    const targetDir = arch.frontendPath || cwd
    generateFrontendIntegration(targetDir, arch.hasTypeScript)
  }

  // 6. Generate Backend Integration
  if (shouldSetupBackend) {
    logger.step('Configuring Backend...')
    const targetDir = arch.backendPath || cwd
    generateBackendIntegration(targetDir, arch.hasTypeScript)
    setupEnvironmentVariables(targetDir)
  }

  // 7. Success & Next Steps
  console.log('')
  console.log(chalk.bold.hex('#2F8F6B')('  ✓ DDS Auth Setup Complete.'))
  console.log('')
  console.log(chalk.bold.hex('#102F2A')('  Next Steps:'))
  console.log(chalk.hex('#102F2A')('  1. Open DDS Developer Portal: ') + chalk.bold.hex('#123C35')('http://localhost:5174'))
  console.log(chalk.hex('#102F2A')('  2. Register your application and copy Client ID & Client Secret'))
  console.log(chalk.hex('#102F2A')('  3. Add credentials to your backend ') + chalk.bold.hex('#123C35')('.env') + chalk.hex('#102F2A')(' file:'))
  console.log(chalk.hex('#64746E')('     DDS_CLIENT_ID=dds_client_xxxxx'))
  console.log(chalk.hex('#64746E')('     DDS_CLIENT_SECRET=dds_secret_xxxxx'))
  console.log(chalk.hex('#102F2A')('  4. Start your application: ') + chalk.bold.hex('#123C35')('npm run dev'))
  console.log('')
  console.log(chalk.bold.hex('#123C35')('  DDS Auth is ready. Secure. Verify. Trust. — by Zogoal\n'))
}
