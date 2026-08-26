import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import { safeReadJson, safeWriteFile } from '../utils/fileUtils.js'
import { logger } from '../utils/logger.js'

const DDS_PACKAGE = '@visionnxtgen2026/dds-auth'
const DDS_VERSION = '^0.1.0'

export function installDdsDependencies(targetDir: string, packageManager = 'npm'): boolean {
  const pkgPath = path.join(targetDir, 'package.json')
  const pkg = safeReadJson(pkgPath)

  if (!pkg) {
    logger.warn(`No package.json found in ${targetDir}. Skipping npm install.`)
    return false
  }

  // Ensure @visionnxtgen2026/dds-auth is in dependencies
  pkg.dependencies = pkg.dependencies || {}
  pkg.dependencies[DDS_PACKAGE] = DDS_VERSION
  safeWriteFile(pkgPath, JSON.stringify(pkg, null, 2), true)

  try {
    const cmd = `${packageManager} install --no-audit --no-fund`
    execSync(cmd, { cwd: targetDir, stdio: 'ignore' })
    logger.success(`${DDS_PACKAGE} installed in ${path.basename(targetDir) || 'project root'}`)
    return true
  } catch (err: any) {
    logger.warn(`Could not run ${packageManager} install automatically: ${err.message}`)
    logger.dim(`Added "${DDS_PACKAGE}": "${DDS_VERSION}" to package.json. Run "npm install" manually.`)
    return true
  }
}
