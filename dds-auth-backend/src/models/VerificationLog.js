import mongoose from 'mongoose'

const verificationLogSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      default: 'system',
      index: true
    },
    requestId: {
      type: String,
      default: null,
      index: true
    },
    userId: {
      type: String,
      default: null,
      index: true
    },
    mobileId: {
      type: String,
      required: true,
      index: true
    },
    event: {
      type: String,
      enum: [
        'REQUEST_CREATED',
        'USER_APPROVED',
        'USER_REJECTED',
        'INVALID_CODE',
        'REQUEST_EXPIRED',
        'MOBILE_NOT_REGISTERED',
        'REQUEST_LOCKED'
      ],
      required: true,
      index: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
)

export const VerificationLog = mongoose.model('VerificationLog', verificationLogSchema)
