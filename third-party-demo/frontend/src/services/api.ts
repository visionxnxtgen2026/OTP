const THIRD_PARTY_BACKEND_URL = ((import.meta.env.VITE_THIRD_PARTY_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001') as string).replace(/\/$/, '')

export interface DdsAuthHealth {
  status: 'CONNECTED' | 'INVALID_CLIENT_ID' | 'INVALID_CLIENT_SECRET' | 'CREDENTIAL_MISMATCH' | 'APPLICATION_REVOKED' | 'APPLICATION_DISABLED' | 'ORIGIN_NOT_ALLOWED' | 'DDS_UNREACHABLE' | 'NOT_CONFIGURED' | 'CHECKING'
  applicationId?: string | null
  applicationName?: string | null
  clientId?: string | null
  message?: string
}

export interface VerificationRequestResponse {
  success: boolean
  requestId?: string
  status?: string
  verificationCode?: string
  message?: string
  error?: string
}

export interface VerificationStatusResponse {
  success: boolean
  requestId?: string
  status?: 'pending' | 'verified' | 'rejected' | 'expired' | 'locked'
  error?: string
}

export interface HealthResponse {
  status: 'ok' | 'error'
  service?: string
  ddsAuth?: DdsAuthHealth
}

export const thirdPartyApi = {
  async checkHealth(): Promise<HealthResponse> {
    try {
      const res = await fetch(`${THIRD_PARTY_BACKEND_URL}/api/health`)
      if (!res.ok) throw new Error('Health check failed')
      return res.json()
    } catch {
      return {
        status: 'error',
        ddsAuth: {
          status: 'DDS_UNREACHABLE',
          message: 'Could not connect to DemoShop Backend at http://localhost:5001.'
        }
      }
    }
  },

  async initiateVerification(payload: {
    mobileNumber: string
  }): Promise<VerificationRequestResponse> {
    try {
      const res = await fetch(`${THIRD_PARTY_BACKEND_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      return data
    } catch {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Could not connect to DemoShop backend (http://localhost:5001)'
      }
    }
  },

  async pollStatus(requestId: string): Promise<VerificationStatusResponse> {
    try {
      const res = await fetch(`${THIRD_PARTY_BACKEND_URL}/api/auth/status/${encodeURIComponent(requestId)}`)
      const data = await res.json()
      return data
    } catch {
      return { success: false, error: 'Failed to check status' }
    }
  }
}
