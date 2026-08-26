import React, { useState, useRef, useEffect } from 'react'
import { DDSLogo } from './DDSLogo'
import { ArrowRight, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { userApi } from '../services/api'
import { confirmPhoneOtp, auth } from '../services/firebase'
import type { DDSUser } from '../services/api'
import type { ConfirmationResult } from 'firebase/auth'

interface OTPVerificationScreenProps {
  mobileNumber?: string
  confirmationResult?: ConfirmationResult
  onVerifySuccess: (user: DDSUser) => void
}

export const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({
  mobileNumber = '8637628773',
  confirmationResult,
  onVerifySuccess
}) => {
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState<number>(300) // 5 minutes (300s)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccessStep, setIsSuccessStep] = useState(false)
  const [verifiedUser, setVerifiedUser] = useState<DDSUser | null>(null)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    setError(null)

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
    setError(null)

    const next = ['', '', '', '', '', '']
    pasted.split('').forEach((char, i) => {
      if (i < 6) next[i] = char
    })
    setOtpValues(next)
    const targetIdx = Math.min(pasted.length, 5)
    inputRefs.current[targetIdx]?.focus()
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    const entered = otpValues.join('')
    if (entered.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setIsLoading(true)
    setError(null)

    const canonical = `+91${mobileNumber.replace(/\D/g, '').slice(-10)}`

    try {
      let freshIdToken: string | null = null

      // 1. If Firebase ConfirmationResult exists, verify SMS OTP with Firebase Phone Auth
      if (confirmationResult) {
        try {
          const fbRes = await confirmPhoneOtp(confirmationResult, entered)
          freshIdToken = fbRes.idToken
        } catch (fbErr: any) {
          console.warn('[Firebase Auth] Phone confirmation error:', fbErr)
          if (fbErr.code === 'auth/invalid-verification-code') {
            setError('Incorrect OTP code. Please enter the valid 6-digit SMS code.')
            setIsLoading(false)
            return
          }
          if (fbErr.code === 'auth/code-expired') {
            setError('The verification code has expired. Please request a new OTP.')
            setIsLoading(false)
            return
          }
        }
      }

      // If no fresh token yet, retrieve from current Firebase user
      if (!freshIdToken && auth.currentUser) {
        freshIdToken = await auth.currentUser.getIdToken(true)
      }

      // 2. Synchronize verified phone number with DDS Backend & MongoDB
      if (freshIdToken) {
        const syncRes = await userApi.verifyFirebasePhone(freshIdToken, canonical)
        if (syncRes.success && syncRes.data) {
          setVerifiedUser(syncRes.data)
          setIsSuccessStep(true)
          return
        } else {
          setError(syncRes.message || syncRes.error || 'Failed to link verified phone number to MongoDB.')
          setIsLoading(false)
          return
        }
      }

      // Fallback registration verification
      const regRes = await userApi.verifyRegistrationOtp({
        mobileNumber: canonical,
        code: entered
      })

      if (regRes.success && regRes.data) {
        setVerifiedUser(regRes.data)
        setIsSuccessStep(true)
      } else {
        setError(regRes.error || 'Invalid OTP code. Please check and try again.')
      }
    } catch (err: any) {
      console.error('[OTP Verify] Error:', err)
      setError(err.message || 'Connection to DDS server failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // SCREEN 4: Authentication Successful (Requirement #20)
  if (isSuccessStep && verifiedUser) {
    return (
      <div className="flex-1 flex flex-col justify-between items-center text-center animate-fadeIn py-2 space-y-6">
        <div className="space-y-4">
          <DDSLogo size="lg" showTagline={true} />
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-[#102F2A]">Identity Created!</h2>
            <p className="text-xs text-[#64746E]">
              Your Firebase Authentication and MongoDB identity are fully synchronized.
            </p>
          </div>
        </div>

        {/* Status Verification Checklist */}
        <div className="w-full bg-white p-5 rounded-3xl border border-[#D8E0DA] shadow-2xs space-y-3 text-left">
          <div className="flex items-center gap-3 p-2.5 bg-[#F7F8F3] rounded-2xl border border-[#D8E0DA]">
            <CheckCircle2 className="w-5 h-5 text-[#2F8F6B] shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#102F2A]">Google Connected</p>
              <p className="text-[10px] text-[#64746E]">{verifiedUser.email || 'Google Account Linked'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 bg-[#F7F8F3] rounded-2xl border border-[#D8E0DA]">
            <CheckCircle2 className="w-5 h-5 text-[#2F8F6B] shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#102F2A]">Mobile Verified</p>
              <p className="text-[10px] text-[#64746E] font-mono">{verifiedUser.mobileId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 bg-[#F7F8F3] rounded-2xl border border-[#D8E0DA]">
            <CheckCircle2 className="w-5 h-5 text-[#2F8F6B] shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#102F2A]">DDS Identity Created</p>
              <p className="text-[10px] text-[#64746E] font-mono">{verifiedUser.userId}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => onVerifySuccess(verifiedUser)}
          className="w-full h-14 bg-[#123C35] hover:bg-[#102F2A] active:scale-[0.99] text-white font-semibold text-[15px] rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-[#2F8F6B]" />
          <span>Enter DDS User App</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  // SCREEN 3: Enter 6-digit OTP
  return (
    <div className="flex-1 flex flex-col justify-between items-center text-center animate-fadeIn py-1">
      {/* Top Header & Branding */}
      <div className="space-y-4">
        <DDSLogo size="lg" showTagline={true} />

        {/* Heading & Subtitle */}
        <div className="space-y-2 pt-2">
          <h2 className="text-[23px] font-bold text-[#102F2A] tracking-tight">
            Enter the <span className="text-[#123C35]">6-digit</span> OTP
          </h2>
          <p className="text-[13px] text-[#64746E] font-medium leading-snug max-w-[270px] mx-auto">
            We have sent a verification code to<br />
            {mobileNumber ? <span className="font-semibold text-[#102F2A] font-mono">+91 {mobileNumber}</span> : 'your mobile number'}
          </p>
        </div>
      </div>

      {/* Center 6-Digit OTP Form */}
      <form onSubmit={handleConfirm} className="w-full space-y-4 my-auto pt-4">
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between pl-1 pr-1">
            <label className="text-[12px] font-semibold text-[#64746E] block">
              Enter OTP
            </label>
            <button
              type="button"
              onClick={() => setOtpValues(['1', '2', '3', '4', '5', '6'])}
              className="text-[11px] font-bold text-[#123C35] hover:text-[#6F9584] hover:underline cursor-pointer"
            >
              Autofill (123456)
            </button>
          </div>

          {/* 6 Individual Rounded Input Boxes */}
          <div className="flex justify-between items-center gap-1.5 sm:gap-2" onPaste={handlePaste}>
            {otpValues.map((digit, idx) => {
              const isFilled = !!digit
              return (
                <div key={idx} className="relative flex-1 max-w-[48px] h-14">
                  <input
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
                    className={`w-full h-full text-center text-xl font-bold rounded-2xl border transition-all bg-white shadow-2xs cursor-text focus:outline-hidden ${
                      error
                        ? 'border-[#C95A5A] bg-rose-50/20 text-[#C95A5A] ring-2 ring-rose-100'
                        : isFilled
                        ? 'border-[#123C35] text-[#102F2A] ring-2 ring-[#DCE8E1]'
                        : 'border-[#D8E0DA] focus:border-[#123C35] focus:ring-2 focus:ring-[#DCE8E1] text-transparent'
                    }`}
                  />
                  {!digit && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-2 h-2 rounded-full bg-[#D8E0DA]" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {error && (
            <div className="flex items-center gap-1.5 p-2.5 bg-rose-50 border border-rose-200 text-xs text-[#C95A5A] rounded-xl mt-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* OTP Validity Message */}
          <div className="flex items-center gap-1.5 pt-2 pl-1 text-[12px] font-medium text-[#64746E]">
            <svg className="w-4 h-4 text-[#2F8F6B] stroke-current shrink-0" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 12l2 2 4-4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>
              Your OTP is valid for <strong className="text-[#102F2A] font-bold">{formatTimer(countdown)} minutes.</strong>
            </span>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          type="submit"
          disabled={isLoading || otpValues.join('').length !== 6}
          className="w-full h-14 bg-[#123C35] hover:bg-[#102F2A] active:scale-[0.99] disabled:opacity-50 text-white font-semibold text-[15px] rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying with Firebase & MongoDB...</span>
            </>
          ) : (
            <>
              <span>Verify & Complete</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </>
          )}
        </button>
      </form>

      <div className="w-full pb-2" />
    </div>
  )
}
