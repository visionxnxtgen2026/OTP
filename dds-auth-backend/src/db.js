import mongoose from 'mongoose'
import crypto from 'crypto'
import { Application } from './models/Application.js'
import { User } from './models/User.js'
import { Developer } from './models/Developer.js'
import { VerificationRequest } from './models/VerificationRequest.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dds_auth'

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    const isAtlas = MONGODB_URI.includes('mongodb+srv') || MONGODB_URI.includes('mongodb.net')
    const dbTargetName = isAtlas ? 'MongoDB Atlas (dds_auth)' : 'Local MongoDB (dds_auth)'
    console.log(`[MongoDB] Connected successfully to ${dbTargetName}`)

    // Ensure database unique indexes asynchronously (non-blocking server startup)
    Promise.all([
      User.createIndexes().catch(() => {}),
      Developer.createIndexes().catch(() => {}),
      Application.createIndexes().catch(() => {}),
      VerificationRequest.createIndexes().catch(() => {})
    ])

    // Seed/Update default developer application (DemoShop)
    try {
      const defaultApp = await Application.findOne({ clientId: 'dds_client_demoshop' })
      if (!defaultApp) {
        const secret = 'dds_secret_demoshop'
        const secretHash = crypto.createHash('sha256').update(secret).digest('hex')

        await Application.create({
          applicationId: 'app_7f82k91',
          clientId: 'dds_client_demoshop',
          clientSecret: secret,
          clientSecretHash: secretHash,
          name: 'DemoShop',
          websiteUrl: 'http://localhost:5175',
          allowedOrigins: ['http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'],
          callbackUrls: ['http://localhost:5175/callback'],
          status: 'active'
        })
        console.log('[MongoDB] Seeded default DemoShop application (clientId: dds_client_demoshop)')
      }
    } catch (seedErr) {
      console.warn('[MongoDB] Default app seed note:', seedErr.message)
    }
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message)
    process.exit(1)
  }
}
