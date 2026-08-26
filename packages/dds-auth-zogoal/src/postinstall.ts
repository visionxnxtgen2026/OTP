/**
 * dds-auth-zogoal — postinstall scaffolding script
 *
 * Runs automatically after `npm install dds-auth-zogoal`.
 * Also invocable manually: npx dds-auth-zogoal
 *
 * Safety rules:
 *   - Idempotent: safe to run multiple times
 *   - Non-destructive: never overwrites existing files without warning
 *   - Skips automatically in CI environments
 *   - Automatically creates full React + Express starter stack on EMPTY projects!
 */

import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

// ─── Resolve host project root ─────────────────────────────────────────────
function getProjectRoot(): string {
  const npmPrefix = process.env.npm_config_local_prefix
  if (npmPrefix) return npmPrefix

  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  let dir = __dirname
  for (let i = 0; i < 10; i++) {
    dir = path.dirname(dir)
    const pkgPath = path.join(dir, 'package.json')
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
        if (pkg.name !== 'dds-auth-zogoal') return dir
      } catch { /**/ }
    }
  }
  return process.cwd()
}

// ─── Skip conditions ────────────────────────────────────────────────────────
function shouldSkip(): string | null {
  if (process.env.CI === 'true' || process.env.CI === '1') return 'CI environment detected'
  if (process.env.DDS_SKIP_POSTINSTALL === '1') return 'DDS_SKIP_POSTINSTALL set'
  if (process.env.npm_lifecycle_event === 'prepare') return 'Running inside npm prepare'
  return null
}

// ─── File utilities ─────────────────────────────────────────────────────────
function ensureDir(p: string): void {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

function safeWriteFile(filePath: string, content: string, overwrite = false): boolean {
  if (fs.existsSync(filePath) && !overwrite) return false
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf-8')
  return true
}

function appendEnvKey(envPath: string, key: string, value: string): void {
  ensureDir(path.dirname(envPath))
  let content = ''
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf-8')
    if (new RegExp(`^${key}=`, 'm').test(content)) return
  }
  const nl = content.length > 0 && !content.endsWith('\n') ? '\n' : ''
  fs.appendFileSync(envPath, `${nl}${key}=${value}\n`, 'utf-8')
}

function ensureGitignore(dir: string): void {
  const gp = path.join(dir, '.gitignore')
  let c = fs.existsSync(gp) ? fs.readFileSync(gp, 'utf-8') : ''
  if (/\.env/m.test(c)) return
  const nl = c.length > 0 && !c.endsWith('\n') ? '\n' : ''
  fs.appendFileSync(gp, `${nl}# DDS Auth — Environment secrets\n.env\n.env.*\n!.env.example\nnode_modules\ndist\n`, 'utf-8')
}

function readJson(p: string): any {
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : null } catch { return null }
}

// ─── Architecture detection ─────────────────────────────────────────────────
function detect(cwd: string) {
  let frontendPath: string | null = null
  let backendPath: string | null = null
  let hasReact = false
  let hasExpress = false

  for (const dir of ['frontend', 'client', 'web', 'app']) {
    const full = path.join(cwd, dir)
    if (!fs.existsSync(full)) continue
    const pkg = readJson(path.join(full, 'package.json'))
    if (pkg && (pkg.dependencies?.react || pkg.devDependencies?.react)) {
      frontendPath = full; hasReact = true; break
    }
    if (fs.existsSync(path.join(full, 'src')) || fs.existsSync(path.join(full, 'index.html'))) {
      frontendPath = full; break
    }
  }

  for (const dir of ['backend', 'server', 'api']) {
    const full = path.join(cwd, dir)
    if (!fs.existsSync(full)) continue
    const pkg = readJson(path.join(full, 'package.json'))
    if (pkg && (pkg.dependencies?.express || pkg.dependencies?.['dds-auth-zogoal'])) {
      backendPath = full; hasExpress = true; break
    }
    if (fs.existsSync(path.join(full, 'server.js')) || fs.existsSync(path.join(full, 'index.js'))) {
      backendPath = full; break
    }
  }

  const rootPkg = readJson(path.join(cwd, 'package.json'))
  if (rootPkg) {
    const deps = { ...rootPkg.dependencies, ...rootPkg.devDependencies }
    if ((deps.react || deps['react-dom']) && !frontendPath) { frontendPath = cwd; hasReact = true }
    if (deps.express && !backendPath) { backendPath = cwd; hasExpress = true }
  }

  return { frontendPath, backendPath, hasReact, hasExpress }
}

// ─── Generators ─────────────────────────────────────────────────────────────
const PKG = 'dds-auth-zogoal'

function scaffoldFrontendIntegration(targetDir: string): string[] {
  const created: string[] = []
  const dir = path.join(targetDir, 'src', 'integrations', 'dds')
  ensureDir(dir)

  if (safeWriteFile(path.join(dir, 'DDSVerification.jsx'), `import React from 'react'
import { DDSProvider, DDSVerificationButton } from '${PKG}/react'

/**
 * DDSVerification — drop-in DDS verification component
 * Usage: <DDSVerification merchantApiUrl="http://localhost:5001" onSuccess={fn} />
 */
export const DDSVerification = ({ merchantApiUrl, onSuccess, buttonText, className }) => (
  <DDSProvider merchantApiUrl={merchantApiUrl}>
    <DDSVerificationButton
      merchantApiUrl={merchantApiUrl}
      onVerified={onSuccess}
      buttonText={buttonText || 'Verify Identity with DDS'}
      className={className}
    />
  </DDSProvider>
)

export default DDSVerification
`)) created.push('src/integrations/dds/DDSVerification.jsx')

  if (safeWriteFile(path.join(dir, 'index.js'), `export { DDSVerification } from './DDSVerification.jsx'
export { DDSProvider, DDSVerificationButton, useDDSVerification, DDSStatusBadge } from '${PKG}/react'
`)) created.push('src/integrations/dds/index.js')

  return created
}

function scaffoldBackendIntegration(targetDir: string): string[] {
  const created: string[] = []

  ensureDir(path.join(targetDir, 'src', 'integrations'))
  if (safeWriteFile(path.join(targetDir, 'src', 'integrations', 'dds.js'), `import { DDSAuth } from '${PKG}/server'

const dds = new DDSAuth({
  clientId: process.env.DDS_CLIENT_ID || '',
  clientSecret: process.env.DDS_CLIENT_SECRET || '',
  baseURL: process.env.DDS_AUTH_URL || 'http://localhost:5000'
})

export default dds
`)) created.push('src/integrations/dds.js')

  ensureDir(path.join(targetDir, 'src', 'routes'))
  if (safeWriteFile(path.join(targetDir, 'src', 'routes', 'ddsVerification.routes.js'), `import { Router } from 'express'
import dds from '../integrations/dds.js'

export const ddsVerificationRouter = Router()

// POST /api/dds/verification/request
ddsVerificationRouter.post('/request', async (req, res) => {
  try {
    const { mobileNumber, origin } = req.body
    if (!mobileNumber) return res.status(400).json({ success: false, error: 'mobileNumber is required' })
    const result = await dds.verification.request({
      mobileId: mobileNumber,
      origin: origin || req.headers.origin || 'http://localhost:5175'
    })
    return res.json({ success: true, requestId: result.requestId, status: result.status, expiresAt: result.expiresAt })
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, error: err.message })
  }
})

// GET /api/dds/verification/status/:requestId
ddsVerificationRouter.get('/status/:requestId', async (req, res) => {
  try {
    const result = await dds.verification.getStatus(req.params.requestId)
    return res.json({ success: true, requestId: result.requestId, status: result.status?.toLowerCase(), verifiedAt: result.verifiedAt })
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, error: err.message })
  }
})

export default ddsVerificationRouter
`)) created.push('src/routes/ddsVerification.routes.js')

  return created
}

function scaffoldEmptyProject(cwd: string): string[] {
  const created: string[] = []
  const frontendDir = path.join(cwd, 'frontend')
  const backendDir = path.join(cwd, 'backend')

  ensureDir(frontendDir)
  ensureDir(backendDir)

  // 1. Frontend package.json
  const frontendPkg = {
    name: 'frontend',
    private: true,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite --port 5175',
      build: 'vite build',
      preview: 'vite preview'
    },
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      'dds-auth-zogoal': '^1.0.1'
    },
    devDependencies: {
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      '@vitejs/plugin-react': '^4.3.4',
      vite: '^6.2.0'
    }
  }
  if (safeWriteFile(path.join(frontendDir, 'package.json'), JSON.stringify(frontendPkg, null, 2)))
    created.push('frontend/package.json')

  // 2. Frontend vite.config.js
  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: '0.0.0.0'
  }
})
`
  if (safeWriteFile(path.join(frontendDir, 'vite.config.js'), viteConfig))
    created.push('frontend/vite.config.js')

  // 3. Frontend index.html
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DDS Auth — Demo Application</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`
  if (safeWriteFile(path.join(frontendDir, 'index.html'), indexHtml))
    created.push('frontend/index.html')

  // 4. Frontend src/main.jsx
  ensureDir(path.join(frontendDir, 'src'))
  const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`
  if (safeWriteFile(path.join(frontendDir, 'src', 'main.jsx'), mainJsx))
    created.push('frontend/src/main.jsx')

  // 5. Frontend src/App.jsx
  const appJsx = `import React, { useState } from 'react'
import { DDSProvider, DDSVerificationButton } from 'dds-auth-zogoal/react'

export default function App() {
  const [merchantApiUrl] = useState('http://localhost:5001')
  const [verifiedId, setVerifiedId] = useState(null)

  return (
    <DDSProvider merchantApiUrl={merchantApiUrl}>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#FBFBF9',
        color: '#102F2A',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px -2px rgba(18, 60, 53, 0.05)',
          padding: '32px',
          boxSizing: 'border-box'
        }}>
          {/* Brand Header */}
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#123C35', letterSpacing: '-0.5px' }}>
              DDS Auth
            </div>
            <div style={{ fontSize: '13px', color: '#2F8F6B', fontWeight: 600, marginTop: '2px' }}>
              Secure. Verify. Trust.
            </div>
            <div style={{ fontSize: '11px', color: '#64746E', marginTop: '4px' }}>
              A Zogoal product
            </div>
          </div>

          <div style={{
            backgroundColor: '#F7F8F3',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px',
            fontSize: '13px',
            color: '#123C35',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Backend Connection</span>
            <span style={{ fontWeight: 600, color: '#2F8F6B' }}>● Connected (5001)</span>
          </div>

          {verifiedId ? (
            <div style={{
              textAlign: 'center',
              backgroundColor: '#EEF2EC',
              border: '1px solid #2F8F6B',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px', color: '#2F8F6B' }}>✓</div>
              <div style={{ fontWeight: 700, color: '#123C35', fontSize: '16px' }}>
                Identity Verified!
              </div>
              <div style={{ fontSize: '12px', color: '#64746E', marginTop: '4px', wordBreak: 'break-all' }}>
                Request ID: {verifiedId}
              </div>
              <button
                onClick={() => setVerifiedId(null)}
                style={{
                  marginTop: '16px',
                  backgroundColor: '#123C35',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Verify Another Number
              </button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#123C35', marginBottom: '6px' }}>
                  Mobile Number Verification
                </label>
                <div style={{ fontSize: '12px', color: '#64746E', marginBottom: '16px' }}>
                  Click below to trigger the official DDS mobile verification flow.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <DDSVerificationButton
                  merchantApiUrl={merchantApiUrl}
                  buttonText="Verify with DDS"
                  onVerified={(id) => setVerifiedId(id)}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '24px', fontSize: '12px', color: '#64746E' }}>
          DDS Auth © 2026 Zogoal. All rights reserved.
        </div>
      </div>
    </DDSProvider>
  )
}
`
  if (safeWriteFile(path.join(frontendDir, 'src', 'App.jsx'), appJsx))
    created.push('frontend/src/App.jsx')

  // 6. Backend package.json
  const backendPkg = {
    name: 'backend',
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'node server.js',
      start: 'node server.js'
    },
    dependencies: {
      express: '^4.21.2',
      cors: '^2.8.5',
      dotenv: '^16.4.7',
      'dds-auth-zogoal': '^1.0.1'
    }
  }
  if (safeWriteFile(path.join(backendDir, 'package.json'), JSON.stringify(backendPkg, null, 2)))
    created.push('backend/package.json')

  // 7. Backend server.js
  const serverJs = `import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import dds from './src/integrations/dds.js'
import ddsVerificationRouter from './src/routes/ddsVerification.routes.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 5001
const HOST = process.env.HOST || '0.0.0.0'

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'dds-auth-third-party-backend' })
})

// DDS Verification Routes
app.use('/api/dds/verification', ddsVerificationRouter)

// Alias endpoints for third-party API compatibility
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { mobileNumber } = req.body
    if (!mobileNumber) return res.status(400).json({ success: false, error: 'mobileNumber is required' })
    const result = await dds.verification.request({
      mobileId: mobileNumber,
      origin: req.headers.origin || 'http://localhost:5175'
    })
    return res.json({
      success: true,
      requestId: result.requestId,
      status: result.status,
      expiresAt: result.expiresAt
    })
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, error: err.message })
  }
})

app.get('/api/auth/status/:requestId', async (req, res) => {
  try {
    const result = await dds.verification.getStatus(req.params.requestId)
    return res.json({
      success: true,
      requestId: result.requestId,
      status: result.status?.toLowerCase(),
      verifiedAt: result.verifiedAt
    })
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, error: err.message })
  }
})

app.listen(PORT, HOST, () => {
  console.log(\`[DDS Third-Party Backend] Running on http://\${HOST}:\${PORT}\`)
})
`
  if (safeWriteFile(path.join(backendDir, 'server.js'), serverJs))
    created.push('backend/server.js')

  // 8. Update root package.json dev script
  const rootPkgPath = path.join(cwd, 'package.json')
  let rootPkg = readJson(rootPkgPath) || { name: 'my-dds-app', version: '1.0.0' }
  rootPkg.scripts = rootPkg.scripts || {}
  rootPkg.scripts.dev = rootPkg.scripts.dev || "node -e \"const {spawn}=require('child_process'); spawn('npm', ['--prefix', 'backend', 'run', 'dev'], {stdio:'inherit', shell:true}); spawn('npm', ['--prefix', 'frontend', 'run', 'dev'], {stdio:'inherit', shell:true});\""
  safeWriteFile(rootPkgPath, JSON.stringify(rootPkg, null, 2), true)
  created.push('package.json (updated dev script)')

  return created
}

function scaffoldEnv(backendDir: string, rootDir: string): void {
  const template = `# DDS Auth Configuration — by Zogoal
# Get credentials from: http://localhost:5174 (DDS Developer Portal)
DDS_AUTH_URL=http://localhost:5000
DDS_CLIENT_ID=
DDS_CLIENT_SECRET=
PORT=5001
VITE_API_URL=http://localhost:5001
`
  const examplePath = path.join(backendDir, '.env.example')
  if (!fs.existsSync(examplePath)) {
    fs.writeFileSync(examplePath, template, 'utf-8')
  } else {
    appendEnvKey(examplePath, 'DDS_AUTH_URL', 'http://localhost:5000')
    appendEnvKey(examplePath, 'DDS_CLIENT_ID', '')
    appendEnvKey(examplePath, 'DDS_CLIENT_SECRET', '')
    appendEnvKey(examplePath, 'VITE_API_URL', 'http://localhost:5001')
  }

  const rootExamplePath = path.join(rootDir, '.env.example')
  if (!fs.existsSync(rootExamplePath)) {
    fs.writeFileSync(rootExamplePath, template, 'utf-8')
  }

  const envPath = path.join(backendDir, '.env')
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, template, 'utf-8')
  } else {
    appendEnvKey(envPath, 'DDS_AUTH_URL', 'http://localhost:5000')
    appendEnvKey(envPath, 'DDS_CLIENT_ID', '')
    appendEnvKey(envPath, 'DDS_CLIENT_SECRET', '')
  }

  ensureGitignore(backendDir)
  ensureGitignore(rootDir)
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('')
  console.log(chalk.bold.hex('#123C35')('  ╔══════════════════════════════════════════════════════╗'))
  console.log(chalk.bold.hex('#123C35')('  ║') + chalk.bold.hex('#2F8F6B')('  DDS Auth                                            ') + chalk.bold.hex('#123C35')('║'))
  console.log(chalk.bold.hex('#123C35')('  ║') + chalk.italic.hex('#6F9584')('  Secure. Verify. Trust.                              ') + chalk.bold.hex('#123C35')('║'))
  console.log(chalk.bold.hex('#123C35')('  ║') + chalk.hex('#64746E')('  by ') + chalk.bold.hex('#123C35')('Zogoal                                           ') + chalk.bold.hex('#123C35')('║'))
  console.log(chalk.bold.hex('#123C35')('  ╚══════════════════════════════════════════════════════╝'))
  console.log('')

  const skipReason = shouldSkip()
  if (skipReason) {
    console.log(chalk.hex('#64746E')(`  ℹ Skipping DDS Auth setup: ${skipReason}`))
    console.log(chalk.hex('#64746E')('  ℹ Run manually: npx dds-auth-zogoal'))
    console.log('')
    return
  }

  const cwd = getProjectRoot()
  console.log(chalk.hex('#64746E')(`  Inspecting project at: ${cwd}`))
  console.log('')

  let arch = detect(cwd)
  const allCreated: string[] = []

  // Check if project is completely empty / unconfigured
  const isEmptyProject = !arch.frontendPath && !arch.backendPath

  if (isEmptyProject) {
    console.log(chalk.bold.hex('#2F8F6B')('  ✓ ') + chalk.hex('#102F2A')('New / Empty project detected — creating full DDS Auth starter stack...'))
    const emptyFiles = scaffoldEmptyProject(cwd)
    allCreated.push(...emptyFiles)

    arch.frontendPath = path.join(cwd, 'frontend')
    arch.backendPath = path.join(cwd, 'backend')
  }

  if (arch.frontendPath) {
    const files = scaffoldFrontendIntegration(arch.frontendPath)
    allCreated.push(...files)
    console.log(chalk.bold.hex('#2F8F6B')('  ✓ ') + chalk.hex('#102F2A')('DDS frontend integration configured'))
  }

  if (arch.backendPath) {
    const files = scaffoldBackendIntegration(arch.backendPath)
    allCreated.push(...files)
    console.log(chalk.bold.hex('#2F8F6B')('  ✓ ') + chalk.hex('#102F2A')('DDS backend integration configured'))

    scaffoldEnv(arch.backendPath, cwd)
    console.log(chalk.bold.hex('#2F8F6B')('  ✓ ') + chalk.hex('#102F2A')('Environment template configured (.env.example)'))
    console.log(chalk.bold.hex('#2F8F6B')('  ✓ ') + chalk.hex('#102F2A')('Git protection verified (.gitignore → .env)'))
  }

  // If empty project, trigger npm install inside frontend & backend so dependencies are installed
  if (isEmptyProject) {
    console.log('')
    console.log(chalk.hex('#64746E')('  Installing frontend & backend dependencies...'))
    try {
      execSync('npm install --no-audit', { cwd: path.join(cwd, 'frontend'), stdio: 'inherit' })
      execSync('npm install --no-audit', { cwd: path.join(cwd, 'backend'), stdio: 'inherit' })
      console.log(chalk.bold.hex('#2F8F6B')('  ✓ Starter dependencies installed successfully.'))
    } catch {
      console.log(chalk.hex('#64746E')('  Note: Run npm install inside frontend/ and backend/ if needed.'))
    }
  }

  console.log('')
  console.log(chalk.bold.hex('#2F8F6B')('  ✓ DDS Auth integration is ready.'))
  console.log('')
  console.log(chalk.bold.hex('#102F2A')('  Next Steps:'))
  console.log(chalk.hex('#102F2A')('  1. Open DDS Developer Portal: ') + chalk.bold.hex('#123C35')('http://localhost:5174'))
  console.log(chalk.hex('#102F2A')('  2. Register your app & add credentials to backend/.env'))
  console.log(chalk.hex('#102F2A')('  3. Start both Frontend & Backend with ONE command:'))
  console.log(chalk.bold.hex('#2F8F6B')('       npm run dev'))
  console.log('')
  console.log(chalk.bold.hex('#123C35')('  DDS Auth — Secure. Verify. Trust. — by Zogoal\n'))
}

main().catch(err => {
  console.log(chalk.bold.hex('#C48A32')('  ⚠ DDS Auth postinstall note:'), err.message)
  process.exit(0)
})
