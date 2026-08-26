import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    googleId: {
      type: String,
      default: null
    },
    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true
    },
    displayName: {
      type: String,
      default: 'DDS User'
    },
    name: {
      type: String,
      default: 'DDS User'
    },
    photoURL: {
      type: String,
      default: null
    },
    mobileId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    countryCode: {
      type: String,
      default: '+91'
    },
    phoneNumber: {
      type: String,
      default: null
    },
    phoneVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    authProvider: {
      type: String,
      default: 'google'
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending', 'deleted'],
      default: 'active'
    },
    lastLoginAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
)

export const User = mongoose.model('User', userSchema)
