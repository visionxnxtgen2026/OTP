import { io, Socket } from 'socket.io-client'
import type { PendingVerificationRequest } from './api'

const DDS_BASE_URL = ((import.meta.env.VITE_DDS_AUTH_URL || import.meta.env.VITE_DDS_API_URL || 'http://localhost:5000') as string).replace(/\/$/, '')

let socketInstance: Socket | null = null

export function connectUserSocket(
  user: { userId: string; mobileId: string },
  onRequestReceived: (request: PendingVerificationRequest) => void,
  onStatusChange?: (status: 'connected' | 'reconnecting' | 'disconnected') => void
): Socket {
  if (socketInstance) {
    socketInstance.disconnect()
  }

  socketInstance = io(DDS_BASE_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
  })

  socketInstance.on('connect', () => {
    console.log('[Socket.IO] Connected to DDS Auth Backend as', socketInstance?.id)
    onStatusChange?.('connected')
    // Register identity with server room
    socketInstance?.emit('auth.register', {
      userId: user.userId,
      mobileId: user.mobileId
    })
  })

  socketInstance.on('auth.registered', (data) => {
    console.log('[Socket.IO] Registered on server:', data)
  })

  // Real-time targeted verification event
  socketInstance.on('verification.requested', (payload: PendingVerificationRequest) => {
    console.log('[Socket.IO] Real-time verification request received:', payload)
    onRequestReceived(payload)
  })

  socketInstance.on('disconnect', () => {
    console.log('[Socket.IO] Disconnected from server')
    onStatusChange?.('disconnected')
  })

  socketInstance.on('connect_error', () => {
    onStatusChange?.('reconnecting')
  })

  return socketInstance
}

export function disconnectUserSocket() {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}
