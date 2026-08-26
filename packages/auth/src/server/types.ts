export interface DDSAuthConfig {
  clientId: string
  clientSecret: string
  baseURL?: string
  timeoutMs?: number
}

export interface VerificationRequestParams {
  mobileId: string
  origin: string
  callbackUrl?: string
  metadata?: Record<string, any>
}

export interface VerificationRequestResult {
  requestId: string
  expiresAt: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED'
  deepLink?: string
}

export interface VerificationStatusResult {
  requestId: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED'
  mobileId?: string
  verifiedAt?: string
  rejectedAt?: string
  expiredAt?: string
}

export interface TestConnectionResult {
  success: boolean
  applicationId: string
  appName: string
  status: string
  allowedOrigins: string[]
  callbackUrls: string[]
  credentialStatus: 'valid' | 'invalid'
  message: string
}
