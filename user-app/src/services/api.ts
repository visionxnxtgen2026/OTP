const DDS_BASE_URL = ((import.meta.env.VITE_DDS_AUTH_URL || import.meta.env.VITE_DDS_API_URL || 'http://localhost:5000') as string).replace(/\/$/, '')
const BACKEND_URL = `${DDS_BASE_URL}/api/v1`

const TOKEN_KEY = 'dds_auth_session_token'

export interface PendingVerificationRequest {
  id: string
  requestId: string
  applicationId: string
  applicationName: string
  websiteUrl: string
  mobileNumber: string
  mobileIdMasked?: string
  status: 'pending' | 'verified' | 'rejected' | 'expired' | 'locked'
  createdAt: string
  expiresAt: string
}

export interface DDSUser {
  userId: string
  firebaseUid?: string
  mobileId: string
  countryCode: string
  phoneNumber: string
  displayName?: string
  name: string
  email: string
  photoURL?: string
  phoneVerified: boolean
  status: string
}

export interface ConnectedApp {
  applicationId: string
  applicationName: string
  websiteUrl: string
  status: string
  lastVerifiedAt: string
}

export interface UserActivityItem {
  id: string
  applicationId?: string
  applicationName?: string
  event: string
  description?: string
  status?: string
  details?: any
  timestamp: string
}

export const userApi = {
  // Token Storage Helpers (sessionStorage + localStorage for persistent login)
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
  },

  setToken(token: string) {
    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(TOKEN_KEY, token)
  },

  clearToken() {
    sessionStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_KEY)
  },

  // 1. Firebase Session Exchange (POST /api/v1/auth/firebase/session)
  async createFirebaseSession(idToken: string): Promise<{
    success: boolean
    token?: string
    isNewUser?: boolean
    requiresPhoneVerification?: boolean
    data?: DDSUser
    error?: string
    message?: string
  }> {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/firebase/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ idToken })
      })
      const result = await res.json()
      if (result.success && result.token) {
        userApi.setToken(result.token)
      }
      return result
    } catch {
      return { success: false, error: 'Could not connect to DDS Auth backend (:5000)' }
    }
  },

  // 2. Firebase Phone Verification Link (POST /api/v1/auth/firebase/verify-phone)
  async verifyFirebasePhone(
    idToken: string,
    mobileNumber?: string
  ): Promise<{
    success: boolean
    data?: DDSUser
    error?: string
    message?: string
  }> {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/firebase/verify-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ idToken, mobileNumber })
      })
      return res.json()
    } catch {
      return { success: false, error: 'Failed to verify phone with DDS backend' }
    }
  },

  // 3. Request OTP for registration (Legacy fallback)
  async requestRegistrationOtp(mobileNumber: string): Promise<{ success: boolean; message?: string; mobileId?: string; code?: string; error?: string }> {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/mobile/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber })
      })
      return res.json()
    } catch {
      return { success: false, error: 'Could not connect to DDS Auth backend (:5000)' }
    }
  },

  // 4. Verify OTP and create/login User in MongoDB (Legacy fallback)
  async verifyRegistrationOtp(payload: {
    mobileNumber: string
    code: string
    name?: string
    email?: string
  }): Promise<{ success: boolean; token?: string; data?: DDSUser; error?: string }> {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/mobile/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await res.json()
      if (result.success && result.token) {
        userApi.setToken(result.token)
      }
      return result
    } catch {
      return { success: false, error: 'Failed to verify OTP with DDS Auth backend' }
    }
  },

  // 5. Get Current Authenticated User (GET /users/me)
  async getMe(): Promise<{ success: boolean; data?: { user: DDSUser }; error?: string }> {
    const token = userApi.getToken()
    if (!token) return { success: false, error: 'NO_TOKEN' }

    try {
      const res = await fetch(`${BACKEND_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!res.ok) {
        userApi.clearToken()
        return { success: false, error: 'SESSION_INVALID' }
      }
      const data = await res.json()
      return { success: true, data: { user: data.data } }
    } catch {
      return { success: false, error: 'NETWORK_ERROR' }
    }
  },

  // 6. Logout & Destroy Session (POST /auth/logout)
  async logout(): Promise<{ success: boolean }> {
    const token = userApi.getToken()
    try {
      if (token) {
        await fetch(`${BACKEND_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      userApi.clearToken()
    }
    return { success: true }
  },

  // 7. Atomic Account Deletion (DELETE /users/me)
  async deleteAccount(): Promise<{ success: boolean; message?: string; error?: string }> {
    const token = userApi.getToken()
    if (!token) return { success: false, error: 'UNAUTHENTICATED' }

    try {
      const res = await fetch(`${BACKEND_URL}/users/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const result = await res.json()
      if (result.success) {
        userApi.clearToken()
      }
      return result
    } catch {
      return { success: false, error: 'Failed to delete account.' }
    }
  },

  // 8. Polling for pending verification requests from third-party apps
  async getPendingRequests(mobileId: string): Promise<{ success: boolean; data: PendingVerificationRequest[] }> {
    const token = userApi.getToken()
    if (!token) return { success: false, data: [] }

    try {
      const res = await fetch(`${BACKEND_URL}/verifications/pending?mobileId=${encodeURIComponent(mobileId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch pending requests')
      return res.json()
    } catch {
      return { success: false, data: [] }
    }
  },

  // 9. Approve verification request with 6-digit code
  async approveRequest(payload: {
    requestId: string
    code: string
  }): Promise<{ success: boolean; status?: string; error?: string; message?: string }> {
    try {
      const res = await fetch(`${BACKEND_URL}/verifications/${encodeURIComponent(payload.requestId)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: payload.code })
      })
      return res.json()
    } catch {
      return { success: false, error: 'Failed to connect to DDS server.' }
    }
  },

  // 10. Reject verification request
  async rejectRequest(payload: {
    requestId: string
  }): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const res = await fetch(`${BACKEND_URL}/verifications/${encodeURIComponent(payload.requestId)}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      return res.json()
    } catch {
      return { success: false, error: 'Failed to reject request.' }
    }
  },

  // 11. Get Strictly Authenticated User-Scoped Activity (GET /users/me/activity)
  async getMyActivity(): Promise<{
    success: boolean
    data?: {
      connectedApps: ConnectedApp[]
      recentActivity: UserActivityItem[]
    }
    error?: string
  }> {
    const token = userApi.getToken()
    if (!token) return { success: false, error: 'UNAUTHENTICATED' }

    try {
      const res = await fetch(`${BACKEND_URL}/users/me/activity`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!res.ok) {
        return { success: false, error: 'UNAUTHORIZED' }
      }
      return res.json()
    } catch {
      return { success: false, error: 'NETWORK_ERROR' }
    }
  }
}
