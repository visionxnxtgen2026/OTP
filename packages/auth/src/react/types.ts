import type { ReactNode } from 'react'

export type VerificationStatus = 'idle' | 'requesting' | 'pending' | 'verified' | 'rejected' | 'expired' | 'error'

export interface DDSProviderProps {
  children: ReactNode
  merchantApiUrl?: string
}

export interface DDSContextValue {
  merchantApiUrl: string
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
  countdown: number
  error: string | null
  loading: boolean
  isVerified: boolean
  isPending: boolean
  initiateVerification: (mobileNumber: string) => Promise<{
    success: boolean
    requestId?: string
    error?: string
  }>
  reset: () => void
}
