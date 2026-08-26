import React, { useState, useEffect, useRef } from 'react'
import { userApi } from '../services/api'
import type { PendingVerificationRequest } from '../services/api'
import { DDSLogo } from './DDSLogo'
import {
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'

interface DDSAuthModalProps {
  request: PendingVerificationRequest
  onClose: () => void
  onSuccess: (appName: string) => void
}

export const DDSAuthModal: React.FC<DDSAuthModalProps> = ({
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

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    setErrorMessage(null)

    if (!val) {
      const next = [...otpValues]
      next[index] = ''
      setOtpValues(next)
      return
    }

    const single = val.slice(-1)
    const next = [...otpValues]
    next[index] = single
    setOtpValues(next)

    if (index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        const next = [...otpValues]
        next[index - 1] = ''
        setOtpValues(next)
        inputRefs.current[index - 1]?.focus()
      } else {
        const next = [...otpValues]
        next[index] = ''
        setOtpValues(next)
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    setErrorMessage(null)

    const next = ['', '', '', '', '', '']
    pasted.split('').forEach((char, i) => {
      if (i < 6) next[i] = char
    })
    setOtpValues(next)
    const targetIdx = Math.min(pasted.length, 5)
    inputRefs.current[targetIdx]?.focus()
  }

  const handleApprove = async () => {
    const enteredCode = otpValues.join('')
    if (enteredCode.length !== 6) {
      setErrorMessage('Please enter the 6-digit code shown on the merchant website')
      return
    }

    setIsVerifying(true)
    setErrorMessage(null)

    try {
      const res = await userApi.approveRequest({
        requestId: request.requestId,
        code: enteredCode
      })
      if (res.success) {
        onSuccess(request.applicationName || 'Merchant Application')
      } else {
        setErrorMessage(res.error || res.message || 'Incorrect verification code. Please check the code on the merchant website.')
      }
    } catch {
      setErrorMessage('Network connection error. Failed to approve verification.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    try {
      await userApi.rejectRequest({
        requestId: request.requestId
      })
      onClose()
    } catch {
      onClose()
    } finally {
      setIsRejecting(false)
    }
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-sm bg-[#F7F8F3] rounded-3xl p-6 shadow-2xl border border-[#D8E0DA] relative space-y-5">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <DDSLogo size="sm" showTagline={false} />
          <div className="flex items-center gap-1 text-xs font-bold text-[#123C35] bg-[#EEF2EC] px-2.5 py-1 rounded-full border border-[#D8E0DA]">
            <Clock className="w-3.5 h-3.5 text-[#2F8F6B]" />
            <span>{formatTimer(countdown)}</span>
          </div>
        </div>

        {/* Authorization Request Card */}
        <div className="bg-white p-4 rounded-2xl border border-[#D8E0DA] shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2EC] text-[#123C35] flex items-center justify-center font-bold border border-[#D8E0DA]">
              <Globe className="w-5 h-5" />
            </div>
            <div className="truncate">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64746E]">
                Authorization Request
              </span>
              <h3 className="text-base font-bold text-[#102F2A] truncate">
                {request.applicationName || 'Third-Party App'}
              </h3>
            </div>
          </div>

          <div className="p-3 bg-[#EEF2EC] rounded-xl border border-[#D8E0DA] text-xs space-y-1">
            <div className="flex items-center justify-between text-[#64746E]">
              <span>Merchant Origin:</span>
              <span className="font-semibold text-[#102F2A] font-mono">{request.websiteUrl || 'http://localhost:5175'}</span>
            </div>
            <div className="flex items-center justify-between text-[#64746E]">
              <span>Requested For:</span>
              <span className="font-semibold text-[#102F2A] font-mono">{request.mobileNumber}</span>
            </div>
          </div>
        </div>

        {/* Prompt Instruction */}
        <div className="text-center space-y-1">
          <h4 className="text-sm font-bold text-[#102F2A]">Enter Merchant Code</h4>
          <p className="text-xs text-[#64746E]">
            Type the 6-digit verification code currently shown on <strong className="text-[#102F2A]">{request.applicationName || 'the merchant screen'}</strong>:
          </p>
        </div>

        {/* 6-Digit Manual Input */}
        <div className="flex justify-between items-center gap-1.5" onPaste={handlePaste}>
          {otpValues.map((val, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={val}
              onChange={(e) => handleInputChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-11 h-13 text-center text-xl font-bold rounded-2xl border transition-all bg-white shadow-2xs focus:outline-hidden ${
                errorMessage
                  ? 'border-[#C95A5A] text-[#C95A5A] ring-2 ring-rose-100'
                  : val
                  ? 'border-[#123C35] text-[#102F2A] ring-2 ring-[#DCE8E1]'
                  : 'border-[#D8E0DA] focus:border-[#123C35] focus:ring-2 focus:ring-[#DCE8E1]'
              }`}
            />
          ))}
        </div>

        {errorMessage && (
          <div className="flex items-center gap-1.5 p-2.5 bg-rose-50 border border-rose-200 text-xs text-[#C95A5A] rounded-xl">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleReject}
            disabled={isRejecting || isVerifying}
            className="flex-1 py-3 px-3 bg-white hover:bg-[#EEF2EC] text-[#64746E] border border-[#D8E0DA] rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            <span>Decline</span>
          </button>

          <button
            type="button"
            onClick={handleApprove}
            disabled={isVerifying || isRejecting || otpValues.join('').length !== 6}
            className="flex-1 py-3 px-3 bg-[#123C35] hover:bg-[#102F2A] active:scale-[0.99] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Approving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#2F8F6B]" />
                <span>Approve</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
