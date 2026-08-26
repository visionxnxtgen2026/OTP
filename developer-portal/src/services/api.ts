const DDS_BASE_URL = ((import.meta.env.VITE_DDS_AUTH_URL || import.meta.env.VITE_DDS_API_URL || 'http://localhost:5000') as string).replace(/\/$/, '')
const BACKEND_URL = `${DDS_BASE_URL}/api/v1`

const DEV_TOKEN_KEY = 'dds_developer_session_token'

export interface DeveloperProfile {
  developerId: string
  email: string
  displayName: string
  photoURL?: string | null
  status: 'active' | 'disabled'
  accountType?: string
  lastLoginAt?: string
}

export interface Application {
  id: string
  applicationId: string
  clientId: string
  clientSecret: string
  name: string
  websiteUrl: string
  allowedOrigins: string[]
  callbackUrls: string[]
  status: 'active' | 'disabled' | 'revoked'
  createdAt: string
  updatedAt?: string
}

export interface VerificationLog {
  id: string
  applicationId: string
  requestId: string
  mobileId: string
  event: string
  details: any
  timestamp: string
}

export interface DeveloperStats {
  totalApps: number
  totalRequests: number
  verifiedRequests: number
  pendingRequests: number
  rejectedRequests: number
  successRate: number
}

function getAuthHeaders(): HeadersInit {
  const token = devApi.getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export const devApi = {
  // Token Storage Helpers
  getToken(): string | null {
    return sessionStorage.getItem(DEV_TOKEN_KEY) || localStorage.getItem(DEV_TOKEN_KEY)
  },

  setToken(token: string) {
    sessionStorage.setItem(DEV_TOKEN_KEY, token)
    localStorage.setItem(DEV_TOKEN_KEY, token)
  },

  clearToken() {
    sessionStorage.removeItem(DEV_TOKEN_KEY)
    localStorage.removeItem(DEV_TOKEN_KEY)
  },

  // 1. Authenticate Developer Session with Firebase ID Token (POST /api/v1/developer/auth/session)
  async authSession(idToken: string): Promise<{
    success: boolean
    token?: string
    developer?: DeveloperProfile
    error?: string
    message?: string
  }> {
    try {
      const res = await fetch(`${BACKEND_URL}/developer/auth/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ idToken })
      })

      const data = await res.json()
      if (res.ok && data.success && data.token) {
        devApi.setToken(data.token)
      }
      return data
    } catch {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Could not connect to DDS Auth Backend on http://localhost:5000'
      }
    }
  },

  // 2. Get Current Authenticated Developer Profile (GET /api/v1/developer/me)
  async getMe(): Promise<{ success: boolean; data?: DeveloperProfile; error?: string }> {
    const token = devApi.getToken()
    if (!token) return { success: false, error: 'NO_TOKEN' }

    try {
      const res = await fetch(`${BACKEND_URL}/developer/me`, {
        headers: getAuthHeaders()
      })
      if (!res.ok) {
        devApi.clearToken()
        return { success: false, error: 'SESSION_INVALID' }
      }
      return res.json()
    } catch {
      return { success: false, error: 'NETWORK_ERROR' }
    }
  },

  // 3. Logout
  logout() {
    devApi.clearToken()
  },

  // 4. Statistics
  async getStats(): Promise<{ success: boolean; data: DeveloperStats }> {
    try {
      const res = await fetch(`${BACKEND_URL}/developer/stats`, {
        headers: getAuthHeaders()
      })
      return res.json()
    } catch {
      return {
        success: true,
        data: {
          totalApps: 1,
          totalRequests: 0,
          verifiedRequests: 0,
          pendingRequests: 0,
          rejectedRequests: 0,
          successRate: 100
        }
      }
    }
  },

  // 5. Applications List
  async getApplications(): Promise<{ success: boolean; data: Application[] }> {
    try {
      const res = await fetch(`${BACKEND_URL}/developer/apps`, {
        headers: getAuthHeaders()
      })
      return res.json()
    } catch {
      return { success: false, data: [] }
    }
  },

  // 6. Single Application
  async getApplication(applicationId: string): Promise<{ success: boolean; data?: Application }> {
    try {
      const res = await fetch(`${BACKEND_URL}/developer/apps/${encodeURIComponent(applicationId)}`, {
        headers: getAuthHeaders()
      })
      return res.json()
    } catch {
      return { success: false }
    }
  },

  // 7. Create Application
  async createApplication(payload: {
    name: string
    websiteUrl?: string
    callbackUrl?: string
    allowedOrigin?: string
  }): Promise<{ success: boolean; message?: string; data?: Application; error?: string }> {
    const res = await fetch(`${BACKEND_URL}/developer/apps`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
    return res.json()
  },

  // 8. Add Allowed Origin
  async addOrigin(applicationId: string, origin: string): Promise<{ success: boolean; data?: string[]; error?: string; message?: string }> {
    const res = await fetch(`${BACKEND_URL}/developer/apps/${encodeURIComponent(applicationId)}/origins`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ origin })
    })
    return res.json()
  },

  // 9. Remove Allowed Origin
  async removeOrigin(applicationId: string, origin: string): Promise<{ success: boolean; data?: string[]; error?: string; message?: string }> {
    const res = await fetch(`${BACKEND_URL}/developer/apps/${encodeURIComponent(applicationId)}/origins`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ origin })
    })
    return res.json()
  },

  // 10. Add Callback URL
  async addCallback(applicationId: string, callbackUrl: string): Promise<{ success: boolean; data?: string[]; error?: string; message?: string }> {
    const res = await fetch(`${BACKEND_URL}/developer/apps/${encodeURIComponent(applicationId)}/callbacks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ callbackUrl })
    })
    return res.json()
  },

  // 11. Remove Callback URL
  async removeCallback(applicationId: string, callbackUrl: string): Promise<{ success: boolean; data?: string[]; error?: string; message?: string }> {
    const res = await fetch(`${BACKEND_URL}/developer/apps/${encodeURIComponent(applicationId)}/callbacks`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ callbackUrl })
    })
    return res.json()
  },

  // 12. Toggle Status
  async toggleStatus(applicationId: string): Promise<{ success: boolean; status?: 'active' | 'disabled'; error?: string; message?: string }> {
    const res = await fetch(`${BACKEND_URL}/developer/apps/${encodeURIComponent(applicationId)}/toggle-status`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return res.json()
  },

  // 13. Regenerate Secret
  async regenerateSecret(applicationId: string): Promise<{ success: boolean; clientSecret?: string; error?: string; message?: string }> {
    const res = await fetch(`${BACKEND_URL}/developer/apps/${encodeURIComponent(applicationId)}/regenerate-secret`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return res.json()
  },

  // 14. Test Connection Server-Side
  async testConnection(applicationId: string): Promise<{ success: boolean; status?: string; message?: string; error?: string }> {
    const res = await fetch(`${BACKEND_URL}/developer/apps/${encodeURIComponent(applicationId)}/test-connection`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return res.json()
  },

  // 15. Delete Application
  async deleteApplication(applicationId: string, confirmation: string): Promise<{ success: boolean; error?: string; message?: string }> {
    const res = await fetch(`${BACKEND_URL}/developer/apps/${encodeURIComponent(applicationId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ confirmation })
    })
    return res.json()
  },

  // 16. Logs
  async getLogs(): Promise<{ success: boolean; data: VerificationLog[] }> {
    try {
      const res = await fetch(`${BACKEND_URL}/developer/logs`, {
        headers: getAuthHeaders()
      })
      return res.json()
    } catch {
      return { success: false, data: [] }
    }
  }
}
