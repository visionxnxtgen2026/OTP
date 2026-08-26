import { useState, useEffect, useRef, useCallback } from 'react'
import type {
  VerificationStatus,
  UseDDSVerificationOptions,
  DDSVerificationHookResult
} from './types.js'
import { useDDSContext } from './DDSProvider.js'

export function useDDSVerification(
  options: UseDDSVerificationOptions = {}
): DDSVerificationHookResult {
  const context = useDDSContext()
  const merchantApiUrl = options.merchantApiUrl || context.merchantApiUrl || 'http://localhost:5001'
  const {
    pollIntervalMs = 1500,
    onSuccess,
    onRejected,
    onExpired,
    onError
  } = options

  const [status, setStatus] = useState<VerificationStatus>('idle')
  const [requestId, setRequestId] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(120)
  const [error, setError] = useState<string | null>(null)

  const pollingRef = useRef<any>(null)
  const timerRef = useRef<any>(null)

  const reset = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    setStatus('idle')
    setRequestId(null)
    setVerificationCode(null)
    setError(null)
    setCountdown(120)
  }, [])

  const initiateVerification = useCallback(
    async (mobileNumber: string) => {
      reset()
      setStatus('requesting')
      setError(null)

      try {
        const cleanNumber = mobileNumber.replace(/\D/g, '').slice(-10)
        const canonical = `+91${cleanNumber}`

        const res = await fetch(`${merchantApiUrl}/api/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobileNumber: canonical })
        })

        const data = await res.json()

        if (res.ok && data.success && data.requestId) {
          setRequestId(data.requestId)
          setStatus('pending')
          return {
            success: true,
            requestId: data.requestId
          }
        } else {
          const errText = data.message || data.error || 'Failed to initiate verification'
          setStatus('error')
          setError(errText)
          if (onError) onError(new Error(errText))
          return { success: false, error: errText }
        }
      } catch (err: any) {
        setStatus('error')
        const networkError = `Connection to API (${merchantApiUrl}) failed: ${err.message}`
        setError(networkError)
        if (onError) onError(new Error(networkError))
        return { success: false, error: networkError }
      }
    },
    [merchantApiUrl, onError, reset]
  )

  useEffect(() => {
    if (status === 'pending' && requestId) {
      setCountdown(120)

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            clearInterval(pollingRef.current)
            setStatus('expired')
            if (onExpired) onExpired(requestId)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${merchantApiUrl}/api/auth/status/${encodeURIComponent(requestId)}`)
          const data = await res.json()

          if (res.ok && data.success) {
            if (data.status === 'verified') {
              clearInterval(pollingRef.current)
              clearInterval(timerRef.current)
              setStatus('verified')
              if (onSuccess) onSuccess(requestId)
            } else if (data.status === 'rejected') {
              clearInterval(pollingRef.current)
              clearInterval(timerRef.current)
              setStatus('rejected')
              if (onRejected) onRejected(requestId)
            } else if (data.status === 'expired') {
              clearInterval(pollingRef.current)
              clearInterval(timerRef.current)
              setStatus('expired')
              if (onExpired) onExpired(requestId)
            }
          }
        } catch {
          // Continue polling on transient errors
        }
      }, pollIntervalMs)
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status, requestId, merchantApiUrl, pollIntervalMs, onSuccess, onRejected, onExpired])

  return {
    status,
    requestId,
    verificationCode,
    countdown,
    error,
    loading: status === 'requesting' || status === 'pending',
    isVerified: status === 'verified',
    isPending: status === 'pending',
    initiateVerification,
    reset
  }
}
