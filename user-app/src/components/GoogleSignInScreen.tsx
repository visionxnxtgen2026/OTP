import React, { useState } from 'react'
import { DDSLogo } from './DDSLogo'
import { SecurityIllustration } from './SecurityIllustration'
import { Loader2, AlertCircle } from 'lucide-react'
import { signInWithGoogle } from '../services/firebase'
import { userApi } from '../services/api'
import type { DDSUser } from '../services/api'

interface GoogleSignInScreenProps {
  onContinue: (payload: { user?: DDSUser; requiresPhone: boolean }) => void
  onSuccess: (user: DDSUser) => void
}

export const GoogleSignInScreen: React.FC<GoogleSignInScreenProps> = ({
  onContinue,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      // 1. Firebase Google Sign-In (Requirement #2, #6)
      const { idToken } = await signInWithGoogle()

      // 2. Exchange Firebase ID Token with DDS Auth Backend & MongoDB (Requirement #8)
      const sessionRes = await userApi.createFirebaseSession(idToken)

      if (sessionRes.success && sessionRes.data) {
        if (sessionRes.requiresPhoneVerification || !sessionRes.data.phoneVerified || !sessionRes.data.mobileId) {
          // Proceed to Screen 2: Enter Mobile Number
          onContinue({ user: sessionRes.data, requiresPhone: true })
        } else {
          // Direct login to Dashboard if already phone-verified
          onSuccess(sessionRes.data)
        }
      } else {
        setErrorMessage(sessionRes.message || sessionRes.error || 'Failed to authenticate with DDS server.')
      }
    } catch (err: any) {
      console.error('[Google Sign-In] Error:', err)
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Sign-in cancelled. Please try again.')
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMessage('Network connection error. Check your internet connection.')
      } else {
        setErrorMessage(err.message || 'Google authentication failed.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between items-center text-center animate-fadeIn py-1">
      {/* Top Header & Branding */}
      <div className="space-y-4">
        <DDSLogo size="lg" showTagline={true} />

        {/* Welcome Section */}
        <div className="space-y-1.5 pt-1">
          <h2 className="text-[22px] font-bold text-[#102F2A] tracking-tight">
            Welcome to <span className="text-[#123C35]">DDS</span>
          </h2>
          <p className="text-[13px] text-[#64746E] font-medium leading-snug max-w-[260px] mx-auto">
            The secure mobile verification platform<br />
            for developers and businesses.
          </p>
        </div>
      </div>

      {/* Central Security Illustration */}
      <div className="my-auto w-full py-2">
        <SecurityIllustration />
      </div>

      {/* Bottom CTA Area */}
      <div className="w-full space-y-4 pt-2">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-[#C95A5A] rounded-2xl flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Large Rounded Google Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full h-14 bg-white hover:bg-[#EEF2EC] active:scale-[0.99] transition-all rounded-2xl border border-[#D8E0DA] shadow-xs flex items-center justify-center gap-3.5 px-5 cursor-pointer disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 text-[#123C35] animate-spin" />
              <span className="text-sm font-semibold text-[#102F2A]">Connecting to Google...</span>
            </>
          ) : (
            <>
              {/* Official Google G Logo */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="text-[14px] font-bold text-[#102F2A] tracking-tight">
                Continue with Google
              </span>
            </>
          )}
        </button>

        {/* Security Message */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#64746E] pb-1">
          <svg className="w-3.5 h-3.5 text-[#2F8F6B] shrink-0 stroke-current" viewBox="0 0 24 24" fill="none">
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
          <span>Your data is encrypted and secure with DDS.</span>
        </div>
      </div>
    </div>
  )
}
