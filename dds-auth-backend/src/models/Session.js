import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    firebaseUid: {
      type: String,
      default: null,
      index: true
    },
    mobileId: {
      type: String,
      default: '',
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '7d' } // automatic TTL index in MongoDB
    }
  },
  {
    timestamps: true
  }
)

export const Session = mongoose.model('Session', sessionSchema)
