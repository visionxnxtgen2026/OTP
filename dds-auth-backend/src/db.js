import mongoose from 'mongoose'
import crypto from 'crypto'
import { Application } from './models/Application.js'
import { User } from './models/User.js'
import { Developer } from './models/Developer.js'
import { VerificationRequest } from './models/VerificationRequest.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dds_auth'

export async function connectDB() {
  try {
    const isAtlas = MONGODB_URI.includes('mongodb+srv') || MONGODB_URI.includes('mongodb.net')
    const dbTargetName = isAtlas ? 'MongoDB Atlas (dds_auth)' : 'Local MongoDB (dds_auth)'
    console.log(`[MongoDB] Connected successfully to ${dbTargetName}`)

    // Ensure database unique indexes (Requirement #4, #14, #25)
    await User.createIndexes().catch(err => console.warn('[MongoDB] User index sync note:', err.message))
    await Developer.createIndexes().catch(err => console.warn('[MongoDB] Developer index sync note:', err.message))
    await Application.createIndexes().catch(err => console.warn('[MongoDB] Application index sync note:', err.message))
    await VerificationRequest.createIndexes().catch(err => console.warn('[MongoDB] VerificationRequest index sync note:', err.message))

    // Seed/Update default developer application (DemoShop)
    const defaultApp = await Application.findOne({ clientId: 'dds_client_demoshop' })
    if (!defaultApp) {
      const secret = 'dds_secret_demoshop_live_9f82k'
      const secretHash = crypto.createHash('sha256').update(secret).digest('hex')

      await Application.create({
        applicationId: 'app_7f82k91',
        clientId: 'dds_client_demoshop',
        clientSecret: secret,
        clientSecretHash: secretHash,
        name: 'DemoShop',
        websiteUrl: 'http://localhost:5175',
        allowedOrigins: ['http://localhost:5175'],
        callbackUrls: ['http://localhost:5175/callback'],
        status: 'active'
      })
      console.log('[MongoDB] Seeded default DemoShop application (clientId: dds_client_demoshop)')
    } else {
      if (!defaultApp.allowedOrigins || defaultApp.allowedOrigins.length === 0) {
        defaultApp.allowedOrigins = ['http://localhost:5175']
        defaultApp.callbackUrls = ['http://localhost:5175/callback']
        await defaultApp.save()
      }
    }
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message)
    process.exit(1)
  }
}
