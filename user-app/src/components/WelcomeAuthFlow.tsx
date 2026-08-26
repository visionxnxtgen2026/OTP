import { useState } from 'react'
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react'

interface WelcomeAuthFlowProps {
  onAuthComplete: (user: { name: string; email: string; mobileNumber: string }) => void
}

export const WelcomeAuthFlow: React.FC<WelcomeAuthFlowProps> = ({ onAuthComplete }) => {
  const [step, setStep] = useState<'google' | 'mobile' | 'otp'>('google')
  const [mobileNumber, setMobileNumber] = useState('9876543210')
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleGoogleSignIn = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setStep('mobile')
    }, 1200)
  }

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = mobileNumber.replace(/\D/g, '')
    if (clean.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number')
      return
    }
    setErrorMessage(null)
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setStep('otp')
    }, 800)
  }

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault()
    const entered = otpValues.join('')
    if (entered !== '123456') {
      setErrorMessage('Invalid OTP. Please use 123456 for prototype login.')
      return
    }
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      onAuthComplete({
        name: 'Sanjai',
        email: 'sanjai@zogoal.example',
        mobileNumber: '9876543210'
      })
    }, 900)
  }

  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1)
    const next = [...otpValues]
    next[index] = clean
    setOtpValues(next)
    setErrorMessage(null)
    if (clean && index < 5) {
      const nextInput = document.getElementById(`auth-otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
        {/* Top App Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-600/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Zogoal App</h1>
          <p className="text-xs text-slate-500">Fast, secure identity and financial hub</p>
        </div>

        {/* STEP 1: GOOGLE SIGN IN */}
        {step === 'google' && (
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-13 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium text-xs sm:text-sm flex items-center justify-center gap-3 shadow-2xs active:scale-[0.99] transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span>Signing in with Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  <span>Continue with Google</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              One-click Google authentication with simulated profile
            </p>
          </div>
        )}

        {/* STEP 2: MOBILE NUMBER */}
        {step === 'mobile' && (
          <form onSubmit={handleMobileSubmit} className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Enter Mobile Number</span>
              <button
                type="button"
                onClick={() => setStep('google')}
                className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center bg-white border border-slate-300 focus-within:border-indigo-600 rounded-2xl overflow-hidden shadow-2xs">
              <div className="px-3.5 py-3 bg-slate-50 border-r border-slate-200 text-xs font-semibold text-slate-800">
                🇮🇳 +91
              </div>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full px-3.5 py-3 text-sm font-semibold text-slate-900 bg-transparent focus:outline-hidden font-mono tracking-wider"
                placeholder="9876543210"
                maxLength={10}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || mobileNumber.length !== 10}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending SMS OTP...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: OTP VERIFICATION */}
        {step === 'otp' && (
          <form onSubmit={handleOtpVerify} className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Verify Mobile OTP</span>
              <button
                type="button"
                onClick={() => setStep('mobile')}
                className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter the OTP sent to <strong className="font-mono text-slate-800">+91 {mobileNumber}</strong>
            </p>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-between items-center gap-1.5">
              {otpValues.map((d, idx) => (
                <input
                  key={idx}
                  id={`auth-otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-10 h-12 text-center text-lg font-bold rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-white"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOtpValues(['1', '2', '3', '4', '5', '6'])}
              className="w-full text-center text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Autofill prototype code (123456)
            </button>

            <button
              type="submit"
              disabled={isLoading || otpValues.join('').length !== 6}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Open Dashboard</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
