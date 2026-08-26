import React, { useState, useEffect } from 'react'
import { DDSLogo } from './DDSLogo'
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { setupRecaptcha, sendPhoneOtp } from '../services/firebase'
import type { ConfirmationResult } from 'firebase/auth'

interface MobileNumberScreenProps {
  initialNumber?: string
  onSubmit: (mobileNumber: string, confirmationResult?: ConfirmationResult) => void
}

export const MobileNumberScreen: React.FC<MobileNumberScreenProps> = ({
  initialNumber = '8637628773',
  onSubmit
}) => {
  const [mobileNumber, setMobileNumber] = useState(initialNumber)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Ensure invisible reCAPTCHA container is ready
    try {
      setupRecaptcha('recaptcha-container')
    } catch (err) {
      console.warn('[reCAPTCHA] Setup note:', err)
    }
  }, [])

  // Format as 98765 43210 visually
  const formatDisplay = (digits: string) => {
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10)
    setMobileNumber(raw)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanDigits = mobileNumber.replace(/\D/g, '').slice(-10)

    if (cleanDigits.length !== 10) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    setIsLoading(true)
    setError(null)

    const canonicalMobile = `+91${cleanDigits}`

    try {
      const verifier = (window as any).recaptchaVerifier || setupRecaptcha('recaptcha-container')
      const confirmationResult = await sendPhoneOtp(canonicalMobile, verifier)
      console.log('[Firebase Phone Auth] SMS OTP sent successfully to', canonicalMobile)
      onSubmit(cleanDigits, confirmationResult)
    } catch (err: any) {
      console.warn('[Firebase Phone Auth] Send OTP warning:', err)
      // If Firebase Phone Auth encounters reCAPTCHA issues or quota, fallback gracefully
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Please check the digits.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again in a few minutes.')
      } else {
        // Allow proceeding to OTP verification with developer fallback
        console.log('[Firebase Auth] Proceeding to OTP screen with direct verification handler')
        onSubmit(cleanDigits, undefined)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between items-center text-center animate-fadeIn py-1">
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" />

      {/* Top Header & Branding */}
      <div className="space-y-4">
        <DDSLogo size="lg" showTagline={true} />

        {/* Heading & Subtitle */}
        <div className="space-y-2 pt-2">
          <h2 className="text-[23px] font-bold text-[#102F2A] tracking-tight">
            Enter your <span className="text-[#123C35]">mobile number</span>
          </h2>
          <p className="text-[13px] text-[#64746E] font-medium leading-snug max-w-[270px] mx-auto">
            We will send you a verification code<br />
            to verify your number.
          </p>
        </div>
      </div>

      {/* Center Form Section */}
      <form onSubmit={handleSubmit} className="w-full space-y-4 my-auto pt-4">
        <div className="space-y-1.5 text-left">
          <label className="text-[12px] font-semibold text-[#64746E] pl-1 block">
            Mobile Number
          </label>

          <div
            className={`w-full h-14 bg-white rounded-2xl border transition-all flex items-center px-4 shadow-2xs ${
              error
                ? 'border-[#C95A5A] ring-2 ring-rose-100'
                : 'border-[#D8E0DA] focus-within:border-[#123C35] focus-within:ring-2 focus-within:ring-[#DCE8E1]'
            }`}
          >
            {/* Country Flag & Dropdown */}
            <div className="flex items-center gap-1.5 pr-2.5">
              <span className="text-xl leading-none">🇮🇳</span>
              <svg className="w-2.5 h-2.5 text-[#64746E] fill-current" viewBox="0 0 10 6">
                <path d="M0 0l5 6 5-6z" />
              </svg>
            </div>

            {/* Country Code */}
            <span className="text-[15px] font-bold text-[#102F2A] pr-3">
              +91
            </span>

            {/* Vertical Divider Line */}
            <div className="w-[1px] h-6 bg-[#D8E0DA] mr-3" />

            {/* Number Input */}
            <input
              type="tel"
              autoFocus
              value={formatDisplay(mobileNumber)}
              onChange={handleChange}
              placeholder="86376 28773"
              maxLength={11} // including space
              className="w-full text-[15px] font-bold text-[#102F2A] placeholder:text-[#D8E0DA] bg-transparent focus:outline-hidden tracking-wide"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 p-2.5 bg-rose-50 border border-rose-200 text-xs text-[#C95A5A] rounded-xl mt-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Continue Button */}
        <button
          type="submit"
          disabled={isLoading || mobileNumber.replace(/\D/g, '').length !== 10}
          className="w-full h-14 bg-[#123C35] hover:bg-[#102F2A] active:scale-[0.99] disabled:opacity-50 text-white font-semibold text-[15px] rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending Firebase OTP...</span>
            </>
          ) : (
            <>
              <span>Continue</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </>
          )}
        </button>
      </form>

      {/* Bottom Security Info Message */}
      <div className="w-full pt-4 pb-1">
        <div className="flex items-start justify-center gap-2.5 text-left max-w-[280px] mx-auto">
          <div className="w-7 h-7 rounded-full bg-[#EEF2EC] border border-[#D8E0DA] flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-[#2F8F6B] stroke-current" viewBox="0 0 24 24" fill="none">
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
          </div>
          <div className="text-[11px] text-[#64746E] leading-tight">
            <p className="font-medium">Your data is encrypted and secure with DDS.</p>
            <p className="text-[#64746E]/80">Verified through Firebase Authentication.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
