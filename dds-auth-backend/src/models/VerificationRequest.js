import mongoose from 'mongoose'

const verificationRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    applicationId: {
      type: String,
      required: true,
      index: true
    },
    applicationName: {
      type: String,
      default: 'Third-Party App'
    },
    websiteUrl: {
      type: String,
      default: 'http://localhost:5175'
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    mobileId: {
      type: String,
      required: true,
      index: true
    },
    codeHash: {
      type: String,
      required: true
    },
    deliveryCode: {
      type: String,
      default: null // only for user app prototype display
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'expired', 'locked'],
      default: 'pending',
      index: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    verifiedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
)

export const VerificationRequest = mongoose.model('VerificationRequest', verificationRequestSchema)
