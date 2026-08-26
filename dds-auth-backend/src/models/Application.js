import mongoose from 'mongoose'

const applicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    clientId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    clientSecret: {
      type: String,
      required: true
    },
    clientSecretHash: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    websiteUrl: {
      type: String,
      default: 'http://localhost:5175'
    },
    allowedOrigins: {
      type: [String],
      default: ['http://localhost:5175']
    },
    callbackUrls: {
      type: [String],
      default: ['http://localhost:5175/callback']
    },
    status: {
      type: String,
      enum: ['active', 'disabled', 'revoked'],
      default: 'active',
      index: true
    },
    developerId: {
      type: String,
      default: 'dev_001'
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
)

export const Application = mongoose.model('Application', applicationSchema)
