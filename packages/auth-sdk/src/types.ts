declare const process: any

export interface DDSAuthConfig {
  clientId?: string
  clientSecret?: string
  baseURL?: string
  timeoutMs?: number
}

export interface VerificationRequestOptions {
  mobileId: string
  origin?: string
}

export interface VerificationRequestResponse {
  success: boolean
  requestId: string
  status: 'pending' | 'verified' | 'rejected' | 'expired'
  verificationCode?: string
  expiresAt?: string
  message?: string
}

export interface VerificationStatusResponse {
  success: boolean
  requestId: string
  status: 'pending' | 'verified' | 'rejected' | 'expired'
  mobileId?: string
  applicationId?: string
  applicationName?: string
  approvedAt?: string
  expiresAt?: string
}

export interface DDSApplicationStatus {
  success: boolean
  status: 'CONNECTED' | 'INVALID_CLIENT_ID' | 'INVALID_CLIENT_SECRET' | 'CREDENTIAL_MISMATCH' | 'APPLICATION_REVOKED' | 'APPLICATION_DISABLED' | 'ORIGIN_NOT_ALLOWED'
  application?: {
    applicationId: string
    name: string
    status: string
    allowedOrigins: string[]
  }
  message?: string
}

export interface DDSHealthStatus {
  status: 'ok' | 'error'
  ddsAuth: DDSApplicationStatus
}
