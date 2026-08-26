import fs from 'fs'
import path from 'path'
import { safeReadJson } from './utils/fileUtils.js'

export interface ProjectArchitecture {
  frontendPath: string | null
  backendPath: string | null
  hasReact: boolean
  hasNode: boolean
  hasExpress: boolean
  hasTypeScript: boolean
  isNextJs: boolean
  packageManager: 'npm' | 'yarn' | 'pnpm'
  existingDDSIntegration: boolean
}

const FRONTEND_DIRS = ['frontend', 'client', 'web', 'app', 'ui']
const BACKEND_DIRS = ['backend', 'server', 'api']

export function detectProject(cwd: string): ProjectArchitecture {
  const rootPkg = safeReadJson(path.join(cwd, 'package.json'))
  let frontendPath: string | null = null
  let backendPath: string | null = null

  // 1. Detect frontend subfolder
  for (const dir of FRONTEND_DIRS) {
    const full = path.join(cwd, dir)
    if (!fs.existsSync(full) || !fs.statSync(full).isDirectory()) continue
    const subPkg = safeReadJson(path.join(full, 'package.json'))
    if (subPkg && (subPkg.dependencies?.react || subPkg.devDependencies?.react)) {
      frontendPath = full; break
    }
    if (fs.existsSync(path.join(full, 'src')) || fs.existsSync(path.join(full, 'index.html'))) {
      frontendPath = full; break
    }
  }

  // 2. Detect backend subfolder
  for (const dir of BACKEND_DIRS) {
    const full = path.join(cwd, dir)
    if (!fs.existsSync(full) || !fs.statSync(full).isDirectory()) continue
    const subPkg = safeReadJson(path.join(full, 'package.json'))
    if (subPkg && (subPkg.dependencies?.express || subPkg.dependencies?.['dds-auth-zogoal'])) {
      backendPath = full; break
    }
    if (fs.existsSync(path.join(full, 'server.js')) ||
        fs.existsSync(path.join(full, 'index.js')) ||
        fs.existsSync(path.join(full, 'src', 'server.ts'))) {
      backendPath = full; break
    }
  }

  // 3. Root-level detection
  let hasReact = false, hasNode = false, hasExpress = false, isNextJs = false, hasTypeScript = false

  const allPkgs = [
    rootPkg,
    frontendPath ? safeReadJson(path.join(frontendPath, 'package.json')) : null,
    backendPath ? safeReadJson(path.join(backendPath, 'package.json')) : null
  ].filter(Boolean)

  for (const pkg of allPkgs) {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    if (deps.react || deps['react-dom']) hasReact = true
    if (deps.next) { hasReact = true; isNextJs = true }
    if (deps.express) { hasExpress = true; hasNode = true }
    if (deps.typescript || fs.existsSync(path.join(cwd, 'tsconfig.json'))) hasTypeScript = true
    if (deps.dotenv || deps.cors) hasNode = true
  }

  // Fallback: root has React but no subfolder detected
  if (rootPkg && (rootPkg.dependencies?.react || rootPkg.devDependencies?.react) && !frontendPath) {
    frontendPath = cwd; hasReact = true
  }
  // Fallback: root has Express but no subfolder detected
  if (rootPkg && (rootPkg.dependencies?.express || rootPkg.devDependencies?.express) && !backendPath) {
    backendPath = cwd; hasExpress = true; hasNode = true
  }

  // Check for existing DDS integration
  let existingDDSIntegration = false
  for (const pkg of allPkgs) {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    if (deps['dds-auth-zogoal'] || deps['@visionnxtgen2026/dds-auth']) {
      existingDDSIntegration = true
    }
  }
  if (
    fs.existsSync(path.join(frontendPath || cwd, 'src', 'integrations', 'dds')) ||
    fs.existsSync(path.join(backendPath || cwd, 'src', 'integrations', 'dds.js'))
  ) existingDDSIntegration = true

  let packageManager: 'npm' | 'yarn' | 'pnpm' = 'npm'
  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) packageManager = 'pnpm'
  else if (fs.existsSync(path.join(cwd, 'yarn.lock'))) packageManager = 'yarn'

  return {
    frontendPath,
    backendPath,
    hasReact,
    hasNode: hasNode || hasExpress,
    hasExpress,
    hasTypeScript,
    isNextJs,
    packageManager,
    existingDDSIntegration
  }
}
