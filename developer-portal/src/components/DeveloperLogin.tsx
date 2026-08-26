import React, { useState } from 'react'
import { signInWithGooglePopup } from '../config/firebase'
import { devApi } from '../services/api'
import type { DeveloperProfile } from '../services/api'
import {
  ShieldCheck,
  Key,
  Radio,
  FileText,
  Loader2,
  AlertCircle,
  Lock,
  ArrowRight
} from 'lucide-react'

interface DeveloperLoginProps {
  onSuccess: (dev: DeveloperProfile) => void
}

export const DeveloperLogin: React.FC<DeveloperLoginProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      // 1. Google Sign-In with Firebase Web SDK (Requirement #6)
      const { idToken } = await signInWithGooglePopup()

      // 2. Exchange Firebase ID Token with DDS Backend (:5000) for Developer session (Requirement #11, #13)
      const sessionRes = await devApi.authSession(idToken)

      if (sessionRes.success && sessionRes.developer) {
        onSuccess(sessionRes.developer)
      } else {
        if (sessionRes.error === 'DEVELOPER_ACCOUNT_DISABLED') {
          setErrorMessage('Your developer account has been disabled. Please contact the DDS Administrator.')
        } else {
          setErrorMessage(sessionRes.message || sessionRes.error || 'Failed to authenticate developer session.')
        }
      }
    } catch (err: any) {
      console.error('[Developer Login] Error:', err)
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Sign-in cancelled. Please try again.')
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Popup was blocked by your browser. Please allow popups for localhost:5174.')
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMessage('Network connection error. Please check your internet connection.')
      } else {
        setErrorMessage(err.message || 'Google authentication failed.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8F3] flex flex-col justify-between font-sans selection:bg-[#DCE8E1] selection:text-[#102F2A]">
      {/* Top Simple Bar */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-[#D8E0DA] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#123C35] flex items-center justify-center text-white font-bold shadow-xs">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#102F2A] text-base tracking-tight">DDS</span>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-[#EEF2EC] text-[#123C35] border border-[#D8E0DA] rounded-md">
                DEVELOPER CONSOLE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#64746E]">
            <span className="hidden sm:inline">Production Portal</span>
            <span className="w-2 h-2 rounded-full bg-[#2F8F6B] animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Grid: Responsive Desktop 2-Column, Mobile Single-Column */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: DDS Developer Messaging */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EEF2EC] border border-[#D8E0DA] rounded-full text-xs font-bold text-[#123C35]">
              <Lock className="w-3.5 h-3.5 text-[#2F8F6B]" />
              <span>Zero-Trust Developer Platform</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#102F2A] tracking-tight leading-[1.15]">
                Developer <span className="text-[#123C35]">Console</span>
              </h1>
              <p className="text-base sm:text-lg text-[#64746E] font-medium leading-relaxed max-w-xl">
                Securely manage your applications, API credentials, allowed origins, and real-time verification audit logs.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-[#D8E0DA] shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2EC] text-[#123C35] flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-[#102F2A]">API Credentials</h3>
                <p className="text-[11px] text-[#64746E]">Client ID & Secret lifecycle management</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#D8E0DA] shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2EC] text-[#123C35] flex items-center justify-center font-bold">
                  <Radio className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-[#102F2A]">Origin Guard</h3>
                <p className="text-[11px] text-[#64746E]">Granular CORS & Redirect URL isolation</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#D8E0DA] shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2EC] text-[#123C35] flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-[#102F2A]">Audit Stream</h3>
                <p className="text-[11px] text-[#64746E]">Real-time immutable verification logs</p>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D8E0DA] shadow-sm space-y-6 animate-fadeIn">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#123C35] text-white flex items-center justify-center mx-auto shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-[#102F2A] tracking-tight">
                  Sign in to Developer Console
                </h2>
                <p className="text-xs text-[#64746E] leading-relaxed">
                  Sign in with your Google account to access and configure your DDS registered applications.
                </p>
              </div>

              {/* Error Message Box */}
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-xs text-[#C95A5A] rounded-2xl flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{errorMessage}</span>
                </div>
              )}

              {/* Large Rounded Google Button (Requirement #5, #6) */}
              <div className="space-y-4">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full h-14 bg-white hover:bg-[#EEF2EC] active:scale-[0.99] transition-all rounded-2xl border border-[#D8E0DA] shadow-xs flex items-center justify-center gap-3.5 px-5 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 text-[#123C35] animate-spin" />
                      <span className="text-sm font-semibold text-[#102F2A]">Authenticating with Google...</span>
                    </>
                  ) : (
                    <>
                      {/* Official Google Logo */}
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
                      <ArrowRight className="w-4 h-4 text-[#64746E]" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-[#64746E] text-center">
                  Sign in with your Google account to access the DDS Developer Console.
                </p>
              </div>

              {/* Security Badge */}
              <div className="pt-2 border-t border-[#D8E0DA] flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#64746E]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2F8F6B] shrink-0" />
                <span>Protected by Firebase Authentication & DDS Core</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer (Requirement #5) */}
      <footer className="w-full bg-white border-t border-[#D8E0DA] py-4 px-6 text-center text-xs text-[#64746E]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} DDS Authentication Platform. All rights reserved.</span>
          <span className="font-semibold text-[#102F2A]">A Zogoal product</span>
        </div>
      </footer>
    </div>
  )
}
