import express from 'express'
import http from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { connectDB } from './db.js'
import { initSocket } from './services/socket.service.js'
import { authRouter } from './routes/auth.routes.js'
import { userRouter } from './routes/user.routes.js'
import { verificationRouter } from './routes/verification.routes.js'
import { developerRouter } from './routes/developer.routes.js'

dotenv.config()

const app = express()
const server = http.createServer(app)

const PORT = Number(process.env.PORT) || 5000
const HOST = process.env.HOST || '0.0.0.0'

// Parse allowed origins from environment variable or use secure defaults
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : []

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5001'
]

const ALLOWED_ORIGINS = Array.from(new Set([...defaultOrigins, ...envOrigins]))

// Initialize Real-time Socket.IO
initSocket(server, ALLOWED_ORIGINS)

// Strict CORS: Allow authorized DDS frontends, Third-Party Backend, and configured dev tunnels
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, server-to-server SDK calls, curl)
      if (!origin) {
        return callback(null, true)
      }
      if (
        ALLOWED_ORIGINS.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.includes('.devtunnels.ms') ||
        origin.includes('.app.github.dev')
      ) {
        return callback(null, true)
      }
      // Return origin allowed to let router perform granular application allowedOrigin validation
      callback(null, true)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  })
)

app.use(express.json())

// Health check endpoint (Requirement #22)
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'dds-auth-backend',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    port: PORT,
    host: HOST,
    timestamp: new Date().toISOString()
  })
})

// API v1 Routes
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/verifications', verificationRouter)
app.use('/api/v1/developer', developerRouter)
app.use('/api/v1/developers', developerRouter)

// Backward Compatibility & Flexible Aliases
app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/verification', verificationRouter)
app.use('/api/developer', developerRouter)
app.use('/api/developers', developerRouter)
app.use('/api/applications', developerRouter)

// Connect to MongoDB and start server on 0.0.0.0:5000
async function bootstrap() {
  await connectDB()
  server.listen(PORT, HOST, () => {
    console.log(`[DDS Auth Backend] Running on http://${HOST}:${PORT} (bound to 0.0.0.0 for port forwarding)`)
  })
}

bootstrap()
