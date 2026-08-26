import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { DDSAuth } from '../sdk/index.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 5001
const HOST = process.env.HOST || '0.0.0.0'
const DDS_AUTH_URL = process.env.DDS_AUTH_URL || 'http://localhost:5000'
const DDS_CLIENT_ID = process.env.DDS_CLIENT_ID || ''
const DDS_CLIENT_SECRET = process.env.DDS_CLIENT_SECRET || ''

// Parse allowed origins for DemoShop Frontend
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : []

const defaultOrigins = ['http://localhost:5175']
const ALLOWED_ORIGINS = Array.from(new Set([...defaultOrigins, ...envOrigins]))

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (
        ALLOWED_ORIGINS.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.includes('.devtunnels.ms') ||
        origin.includes('.app.github.dev')
      ) {
        return callback(null, true)
      }
      callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS']
  })
)
app.use(express.json())

// Initialize DDS Auth SDK with server-side secrets
const dds = new DDSAuth({
  clientId: DDS_CLIENT_ID,
  clientSecret: DDS_CLIENT_SECRET,
  baseURL: DDS_AUTH_URL
})

// Cached Integration Health State
let ddsIntegrationHealth = {
  status: 'CHECKING',
  applicationId: null,
  applicationName: null,
  clientId: DDS_CLIENT_ID || null,
  message: 'Validating DDS Auth integration...'
}

/**
 * Server-Side Credential Validation with DDS Auth Backend
 */
async function checkDdsIntegration() {
  if (!DDS_CLIENT_ID || !DDS_CLIENT_SECRET) {
    ddsIntegrationHealth = {
      status: 'NOT_CONFIGURED',
      applicationId: null,
      applicationName: null,
      clientId: DDS_CLIENT_ID || null,
      message: 'DDS_CLIENT_ID or DDS_CLIENT_SECRET is missing in backend .env'
    }
    console.warn('[DemoShop] ✗ DDS Auth configuration incomplete: Missing credentials in .env')
    return ddsIntegrationHealth
  }

  try {
    const res = await fetch(`${DDS_AUTH_URL}/api/v1/auth/validate-client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: DDS_CLIENT_ID,
        clientSecret: DDS_CLIENT_SECRET,
        origin: 'http://localhost:5175'
      })
    })

    const data = await res.json()

    if (res.ok && data.success) {
      ddsIntegrationHealth = {
        status: data.status || 'CONNECTED',
        applicationId: data.application?.applicationId || null,
        applicationName: data.application?.name || 'DemoShop',
        clientId: DDS_CLIENT_ID,
        message: data.message || 'DDS credentials and application configuration verified.'
      }
      console.log(`[DemoShop] ✓ DDS credentials valid | Application: "${ddsIntegrationHealth.applicationName}" (${data.application?.status})`)
    } else {
      ddsIntegrationHealth = {
        status: data.status || (res.status === 401 ? 'INVALID_CLIENT_CREDENTIALS' : 'CONFIGURATION_ERROR'),
        applicationId: data.application?.applicationId || null,
        applicationName: data.application?.name || null,
        clientId: DDS_CLIENT_ID,
        message: data.message || data.error || 'DDS credential validation failed.'
      }
      console.warn(`[DemoShop] ✗ DDS Auth validation failed: [${ddsIntegrationHealth.status}] ${ddsIntegrationHealth.message}`)
    }
  } catch (err) {
    ddsIntegrationHealth = {
      status: 'DDS_UNREACHABLE',
      applicationId: null,
      applicationName: null,
      clientId: DDS_CLIENT_ID,
      message: `Could not connect to DDS Auth backend at ${DDS_AUTH_URL}. Ensure it is running.`
    }
    console.warn(`[DemoShop] ✗ DDS Auth backend unreachable at ${DDS_AUTH_URL}:`, err.message)
  }

  return ddsIntegrationHealth
}

// Helper to normalize phone number in third-party backend
function normalizePhone(num) {
  if (!num) return ''
  let cleaned = String(num).replace(/[\s\-\(\)\.]/g, '')
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1)
  if (cleaned.startsWith('0') && cleaned.length === 11) cleaned = cleaned.substring(1)
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`
  if (cleaned.length === 10) return `+91${cleaned}`
  return `+${cleaned}`
}

/**
 * Health check endpoint (Requirement #22)
 */
app.get(['/health', '/api/health'], async (req, res) => {
  const currentHealth = await checkDdsIntegration()
  res.json({
    status: 'ok',
    service: 'third-party-backend',
    port: PORT,
    host: HOST,
    ddsAuth: currentHealth,
    timestamp: new Date().toISOString()
  })
})

/**
 * Safe Debug Endpoint (NEVER exposes secrets)
 */
app.get('/api/debug/dds-config', (req, res) => {
  res.json({
    ddsAuthUrl: DDS_AUTH_URL,
    clientIdConfigured: Boolean(DDS_CLIENT_ID),
    clientSecretConfigured: Boolean(DDS_CLIENT_SECRET),
    integrationStatus: ddsIntegrationHealth.status
  })
})

/**
 * 1. Request Verification
 * Called by DemoShop Frontend (localhost:5175)
 * Returns challenge verificationCode for DemoShop to display to user!
 */
app.post('/api/auth/verify', async (req, res) => {
  const { mobileNumber } = req.body

  if (!mobileNumber) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_REQUEST',
      message: 'mobileNumber is required'
    })
  }

  const canonicalMobile = normalizePhone(mobileNumber)
  console.log(`[DemoShop Backend] Requesting DDS verification for ${canonicalMobile}...`)

  try {
    const originHeader = req.headers.origin || 'http://localhost:5175'

    const challenge = await dds.verification.request({
      mobileId: canonicalMobile,
      origin: originHeader
    })

    console.log(`[DemoShop Backend] ✓ Challenge created: Request ID: ${challenge.requestId}`)

    return res.json({
      success: true,
      requestId: challenge.requestId,
      status: challenge.status,
      expiresAt: challenge.expiresAt
    })
  } catch (err) {
    console.error(`[DemoShop Backend] ✗ Verification request failed:`, err.message)
    const statusCode = err.status || 500

    return res.status(statusCode).json({
      success: false,
      error: err.code || 'VERIFICATION_REQUEST_FAILED',
      message: err.message || 'Unable to request mobile verification.'
    })
  }
})

/**
 * 2. Status Check
 * Polled by DemoShop Frontend until approved/rejected/expired
 */
app.get('/api/auth/status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params
    const result = await dds.verification.status(requestId)

    return res.json({
      success: true,
      requestId: result.requestId,
      status: result.status
    })
  } catch (err) {
    const statusCode = err.status || 500
    return res.status(statusCode).json({
      success: false,
      error: err.code || 'STATUS_CHECK_FAILED',
      message: err.message
    })
  }
})

app.listen(PORT, HOST, async () => {
  console.log(`[DemoShop Third-Party Backend] Running on http://${HOST}:${PORT} (bound to 0.0.0.0 for port forwarding)`)
  console.log(`[DemoShop] DDS Auth configured | Auth URL: ${DDS_AUTH_URL} | Client ID: ${DDS_CLIENT_ID || '(none)'}`)
  await checkDdsIntegration()
})
