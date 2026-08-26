export type VerificationStatus =
  | 'idle'
  | 'requesting'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'expired'
  | 'error'

export interface DDSProviderConfig {
  merchantApiUrl: string
  defaultOrigin?: string
  autoPoll?: boolean
  pollIntervalMs?: number
  children?: React.ReactNode
}

export interface VerificationState {
  status: VerificationStatus
  requestId: string | null
  verificationCode: string | null
  mobileNumber: string | null
  error: string | null
  countdown: number
}

export interface UseDDSVerificationOptions {
  merchantApiUrl?: string
  pollIntervalMs?: number
  onSuccess?: (requestId: string) => void
  onRejected?: (requestId: string) => void
  onExpired?: (requestId: string) => void
  onError?: (error: Error) => void
}

export interface DDSVerificationHookResult {
  status: VerificationStatus
  requestId: string | null
  verificationCode: string | null
  countdown: number
  error: string | null
  loading: boolean
  isVerified: boolean
  isPending: boolean
  initiateVerification: (mobileNumber: string) => Promise<{ success: boolean; requestId?: string; verificationCode?: string; error?: string }>
  reset: () => void
}
