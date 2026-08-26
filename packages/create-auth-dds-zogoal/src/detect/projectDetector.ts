import fs from 'fs'
import path from 'path'
import { safeReadJson } from '../utils/fileUtils.js'

export interface ProjectArchitecture {
  isMonorepoOrMultiFolder: boolean
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

export function detectProject(cwd: string): ProjectArchitecture {
  const rootPkg = safeReadJson(path.join(cwd, 'package.json'))

  // Check subfolders
  const potentialFrontends = ['frontend', 'client', 'web', 'app', 'ui', 'src']
  const potentialBackends = ['backend', 'server', 'api', 'services/api']

  let frontendPath: string | null = null
  let backendPath: string | null = null

  // 1. Detect frontend folder
  for (const dir of potentialFrontends) {
    const full = path.join(cwd, dir)
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
      const subPkg = safeReadJson(path.join(full, 'package.json'))
      if (subPkg && (subPkg.dependencies?.react || subPkg.devDependencies?.react)) {
        frontendPath = full
        break
      } else if (dir !== 'src' && fs.existsSync(path.join(full, 'src'))) {
        frontendPath = full
        break
      }
    }
  }

  // 2. Detect backend folder
  for (const dir of potentialBackends) {
    const full = path.join(cwd, dir)
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
      const subPkg = safeReadJson(path.join(full, 'package.json'))
      if (subPkg && (subPkg.dependencies?.express || subPkg.dependencies?.['@visionnxtgen2026/dds-auth'] || subPkg.dependencies?.['@dds/auth'] || subPkg.dependencies?.['@dds/auth-sdk'])) {
        backendPath = full
        break
      } else if (fs.existsSync(path.join(full, 'server.js')) || fs.existsSync(path.join(full, 'src', 'server.ts')) || fs.existsSync(path.join(full, 'server.ts'))) {
        backendPath = full
        break
      }
    }
  }

  // 3. Fallback to root detection if no subfolders identified
  let hasReact = false
  let hasNode = false
  let hasExpress = false
  let isNextJs = false
  let hasTypeScript = false

  const allPkgs = [
    rootPkg,
    frontendPath ? safeReadJson(path.join(frontendPath, 'package.json')) : null,
    backendPath ? safeReadJson(path.join(backendPath, 'package.json')) : null
  ].filter(Boolean)

  for (const pkg of allPkgs) {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    if (deps.react || deps['react-dom']) hasReact = true
    if (deps.next) {
      hasReact = true
      isNextJs = true
    }
    if (deps.express) hasExpress = true
    if (deps.typescript || fs.existsSync(path.join(cwd, 'tsconfig.json'))) hasTypeScript = true
    if (deps.express || deps.dotenv || deps.cors || pkg.type === 'module') hasNode = true
  }

  // If root package has React and no separate frontend
  if (rootPkg && (rootPkg.dependencies?.react || rootPkg.devDependencies?.react) && !frontendPath) {
    frontendPath = cwd
    hasReact = true
  }

  // If root package has Express/server and no separate backend
  if (rootPkg && (rootPkg.dependencies?.express || rootPkg.devDependencies?.express) && !backendPath) {
    backendPath = cwd
    hasExpress = true
    hasNode = true
  }

  // Check existing DDS integration
  let existingDDSIntegration = false
  for (const pkg of allPkgs) {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    if (deps['@visionnxtgen2026/dds-auth'] || deps['@dds/auth'] || deps['@dds/auth-sdk'] || deps['@dds/auth-react']) {
      existingDDSIntegration = true
    }
  }
  if (
    fs.existsSync(path.join(cwd, 'src', 'integrations', 'dds')) ||
    fs.existsSync(path.join(cwd, 'src', 'integrations', 'dds.ts')) ||
    fs.existsSync(path.join(cwd, 'src', 'integrations', 'dds.js'))
  ) {
    existingDDSIntegration = true
  }

  let packageManager: 'npm' | 'yarn' | 'pnpm' = 'npm'
  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) packageManager = 'pnpm'
  else if (fs.existsSync(path.join(cwd, 'yarn.lock'))) packageManager = 'yarn'

  return {
    isMonorepoOrMultiFolder: !!(frontendPath && backendPath && frontendPath !== backendPath),
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
