import React, { useState, useEffect, useRef } from 'react'
import { userApi } from '../services/api'
import type { PendingVerificationRequest } from '../services/api'
import {
  ShieldCheck,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'

interface ZogoalAuthModalProps {
  request: PendingVerificationRequest
  onClose: () => void
  onSuccess: (appName: string) => void
}

export const ZogoalAuthModal: React.FC<ZogoalAuthModalProps> = ({
  request,
  onClose,
  onSuccess
}) => {
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState<number>(120)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Expiration countdown
  useEffect(() => {
    const calcInitial = Math.max(0, Math.floor((new Date(request.expiresAt).getTime() - Date.now()) / 1000))
    setCountdown(calcInitial || 120)

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [request, onClose])

  // Auto focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    setErrorMessage(null)

    if (!val) {
      const updated = [...otpValues]
      updated[index] = ''
      setOtpValues(updated)
      return
    }

    const single = val.slice(-1)
    const updated = [...otpValues]
    updated[index] = single
    setOtpValues(updated)

    if (index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        const updated = [...otpValues]
        updated[index - 1] = ''
        setOtpValues(updated)
        inputRefs.current[index - 1]?.focus()
      } else {
        const updated = [...otpValues]
        updated[index] = ''
        setOtpValues(updated)
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    setErrorMessage(null)

    const updated = ['', '', '', '', '', '']
    pasted.split('').forEach((c, idx) => {
      if (idx < 6) updated[idx] = c
    })
    setOtpValues(updated)
    const targetIdx = Math.min(pasted.length, 5)
    inputRefs.current[targetIdx]?.focus()
  }

  const handleApprove = async () => {
    const enteredCode = otpValues.join('')
    if (enteredCode.length !== 6) {
      setErrorMessage(`Please enter the 6-digit code shown on ${request.applicationName || 'DemoShop'}`)
      return
    }

    setIsVerifying(true)
    setErrorMessage(null)

    try {
      const res = await userApi.approveRequest({
        requestId: request.requestId || request.id,
        code: enteredCode
      })

      if (res.success) {
        onSuccess(request.applicationName)
      } else {
        setErrorMessage(res.error || res.message || `Invalid verification code. Please enter the code displayed on ${request.applicationName || 'DemoShop'}.`)
      }
    } catch {
      setErrorMessage('Connection to DDS Auth backend failed.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    try {
      await userApi.rejectRequest({
        requestId: request.requestId || request.id
      })
      onClose()
    } catch {
      onClose()
    } finally {
      setIsRejecting(false)
    }
  }

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const maskedMobile = request.mobileIdMasked || (request.mobileNumber
    ? `+91 ••••• ${request.mobileNumber.slice(-4)}`
    : '+91 ••••• 8773')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 relative">
        {/* Top Branding */}
        <div className="text-center space-y-1.5 pb-2 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-1">
            <span className="font-bold text-slate-900 text-base tracking-tight">DDS</span>
            <span className="text-indigo-600 font-bold text-base">Auth</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Verification Request
          </span>
        </div>

        {/* Application Request Details */}
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-slate-900 leading-snug">
            <strong className="text-indigo-600">{request.applicationName}</strong> wants to verify your mobile number.
          </h3>
          <div className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Globe className="w-3 h-3 text-slate-400" />
            <span>{request.websiteUrl || 'http://localhost:5175'}</span>
          </div>
        </div>

        {/* Mobile Number Banner */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Mobile Number</span>
          <span className="font-mono font-bold text-slate-900">{maskedMobile}</span>
        </div>

        {/* 6-Digit Code Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Enter Verification Code:</span>
            <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>{formatTimer(countdown)}</span>
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            The verification code is displayed on the <strong className="text-indigo-600">{request.applicationName || 'DemoShop'}</strong> website.
          </p>

          <div className="flex justify-between items-center gap-1.5" onPaste={handlePaste}>
            {otpValues.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(idx, e)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-10 h-12 text-center text-lg font-bold rounded-xl border transition-all bg-white shadow-2xs ${
                  errorMessage
                    ? 'border-rose-400 bg-rose-50/20 text-rose-700 ring-2 ring-rose-100'
                    : digit
                    ? 'border-indigo-600 text-slate-900 ring-2 ring-indigo-50'
                    : 'border-slate-300 text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                }`}
              />
            ))}
          </div>

          {errorMessage && (
            <div className="flex items-center justify-center gap-1 text-xs text-rose-600 font-medium pt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Action Buttons: Reject & Approve */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleReject}
            disabled={isRejecting || isVerifying}
            className="h-12 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-600 font-semibold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {isRejecting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                <span>Rejecting...</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleApprove}
            disabled={isVerifying || isRejecting || otpValues.join('').length !== 6}
            className="h-12 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
