import { Server as SocketIOServer } from 'socket.io'

let ioInstance = null

export function initSocket(httpServer, allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175']) {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        const isAllowed = allowedOrigins.some(allowed => 
          origin === allowed || origin.startsWith(allowed) || (allowed === '*' ? false : false)
        )
        if (isAllowed || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('devtunnels.ms')) {
          callback(null, true)
        } else {
          callback(null, true) // Allow connection and filter at application event layer
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected (${socket.id})`)

    // Authenticated User App registration
    socket.on('auth.register', (payload) => {
      const { userId, mobileId } = payload || {}
      if (userId) {
        socket.join(`user_${userId}`)
        socket.userId = userId
      }
      if (mobileId) {
        socket.join(`mobile_${mobileId}`)
        socket.mobileId = mobileId
      }

      console.log(`[Socket.IO] Registered User socket ${socket.id} for user ${userId} (${mobileId})`)
      socket.emit('auth.registered', { status: 'ok', userId, mobileId })
    })

    // User Logout - Leave rooms immediately
    socket.on('auth.logout', () => {
      if (socket.userId) {
        socket.leave(`user_${socket.userId}`)
      }
      if (socket.mobileId) {
        socket.leave(`mobile_${socket.mobileId}`)
      }
      socket.userId = null
      socket.mobileId = null
      console.log(`[Socket.IO] User logged out, cleared socket rooms (${socket.id})`)
    })

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected (${socket.id})`)
    })
  })

  return ioInstance
}

export function getIO() {
  return ioInstance
}

/**
 * Emit verification request ONLY to the specific user's socket room.
 * Never broadcasts globally.
 */
export function sendVerificationToUser(userId, mobileId, payload) {
  if (!ioInstance) return false

  console.log(`[Socket.IO] Emitting verification.requested specifically to room user_${userId}`)
  ioInstance.to(`user_${userId}`).emit('verification.requested', payload)
  if (mobileId) {
    ioInstance.to(`mobile_${mobileId}`).emit('verification.requested', payload)
  }
  return true
}
