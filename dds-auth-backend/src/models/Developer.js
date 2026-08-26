import mongoose from 'mongoose'

const developerSchema = new mongoose.Schema(
  {
    developerId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      index: true
    },
    displayName: {
      type: String,
      default: 'Developer'
    },
    photoURL: {
      type: String,
      default: null
    },
    accountType: {
      type: String,
      enum: ['developer', 'admin'],
      default: 'developer'
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
      index: true
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

export const Developer = mongoose.model('Developer', developerSchema)
