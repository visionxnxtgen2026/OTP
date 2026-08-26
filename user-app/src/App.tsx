import { useState, useEffect } from 'react'
import { AuthLayout } from './components/AuthLayout'
import { GoogleSignInScreen } from './components/GoogleSignInScreen'
import { MobileNumberScreen } from './components/MobileNumberScreen'
import { OTPVerificationScreen } from './components/OTPVerificationScreen'
import { DDSUserDashboard } from './components/DDSUserDashboard'
import { DDSAuthModal } from './components/DDSAuthModal'
import { userApi } from './services/api'
import { signOutFirebase } from './services/firebase'
import { connectUserSocket, disconnectUserSocket } from './services/socket'
import type { PendingVerificationRequest, DDSUser } from './services/api'
import type { ConfirmationResult } from 'firebase/auth'
import { Shield, CheckCircle2 } from 'lucide-react'

export function App() {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const [authStep, setAuthStep] = useState<'google' | 'mobile' | 'otp'>('google')
  const [mobileNumber, setMobileNumber] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | undefined>(undefined)
  const [user, setUser] = useState<DDSUser | null>(null)
  const [socketStatus, setSocketStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected')

  const [activeRequest, setActiveRequest] = useState<PendingVerificationRequest | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)

  // 1. Initial Session Check on App Startup
  useEffect(() => {
    const checkSession = async () => {
      const token = userApi.getToken()
      if (!token) {
        setAuthState('unauthenticated')
        return
      }

      try {
        const res = await userApi.getMe()
        if (res.success && res.data?.user) {
          setUser(res.data.user)
          setAuthState('authenticated')
        } else {
          userApi.clearToken()
          setAuthState('unauthenticated')
        }
      } catch {
        userApi.clearToken()
        setAuthState('unauthenticated')
      }
    }

    checkSession()
  }, [])

  // 2. Real-time Socket.IO Connection (ONLY when authenticated)
  useEffect(() => {
    if (authState !== 'authenticated' || !user || !user.mobileId) {
      disconnectUserSocket()
      setSocketStatus('disconnected')
      setActiveRequest(null)
      return
    }

    connectUserSocket(
      { userId: user.userId, mobileId: user.mobileId },
      (incomingReq) => {
        console.log('[User App] Verification request received for authenticated user:', incomingReq)
        setActiveRequest(incomingReq)
      },
      (status) => {
        setSocketStatus(status)
      }
    )

    return () => {
      disconnectUserSocket()
    }
  }, [authState, user])

  // 3. Polling fallback for verification requests (ONLY when authenticated)
  useEffect(() => {
    if (authState !== 'authenticated' || !user || !user.mobileId) return

    const poll = async () => {
      try {
        const res = await userApi.getPendingRequests(user.mobileId)
        if (res.success && res.data.length > 0) {
          if (!activeRequest) {
            setActiveRequest(res.data[0])
          }
        } else if (activeRequest) {
          const stillPending = res.data?.some((r) => r.id === activeRequest.id)
          if (!stillPending) setActiveRequest(null)
        }
      } catch {
        // Ignore polling errors
      }
    }

    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [authState, user, activeRequest])

  const handleGoogleContinue = (payload: { user?: DDSUser; requiresPhone: boolean }) => {
    if (payload.user) {
      setUser(payload.user)
    }
    setAuthStep('mobile')
  }

  const handleGoogleSuccess = (authenticatedUser: DDSUser) => {
    setUser(authenticatedUser)
    setAuthState('authenticated')
    setAuthStep('google')
  }

  const handleMobileSubmit = (num: string, confRes?: ConfirmationResult) => {
    setMobileNumber(num)
    setConfirmationResult(confRes)
    setAuthStep('otp')
  }

  const handleOtpVerified = (verifiedUser: DDSUser) => {
    setUser(verifiedUser)
    setAuthState('authenticated')
    setAuthStep('google')
  }

  const handleBack = () => {
    if (authStep === 'otp') setAuthStep('mobile')
    else if (authStep === 'mobile') setAuthStep('google')
  }

  // Strict Logout Flow (Requirement #18)
  const handleLogout = async () => {
    try {
      await signOutFirebase()
      await userApi.logout()
    } catch {
      // Ignore network errors
    } finally {
      disconnectUserSocket()
      userApi.clearToken()
      setUser(null)
      setActiveRequest(null)
      setAuthState('unauthenticated')
      setAuthStep('google')
      setMobileNumber('')
      setConfirmationResult(undefined)
    }
  }

  const handleVerificationSuccess = (appName: string) => {
    setActiveRequest(null)
    setSuccessBanner(`✓ Successfully verified mobile number for ${appName}!`)
    setTimeout(() => setSuccessBanner(null), 5000)
  }

  // =========================================================================
  // 1. LOADING STATE
  // =========================================================================
  if (authState === 'loading') {
    return (
      <div className="min-h-[100dvh] bg-[#F7F8F3] flex items-center justify-center font-sans">
        <div className="w-full max-w-md bg-white min-h-[100dvh] flex flex-col items-center justify-center space-y-4 shadow-none sm:shadow-xs border-0 sm:border-x sm:border-[#D8E0DA]">
          <div className="w-16 h-16 rounded-3xl bg-[#123C35] text-white flex items-center justify-center shadow-lg animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="font-extrabold text-[#102F2A] text-lg tracking-tight">DDS AUTH</h1>
            <p className="text-xs text-[#64746E] font-medium">Verifying Firebase & MongoDB session...</p>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // 2. UNAUTHENTICATED STATE (Login Screens Only)
  // =========================================================================
  if (authState === 'unauthenticated' || !user) {
    return (
      <div className="min-h-[100dvh] bg-[#F7F8F3] flex flex-col justify-between font-sans selection:bg-[#DCE8E1] selection:text-[#102F2A]">
        <AuthLayout onBack={authStep === 'mobile' || authStep === 'otp' ? handleBack : undefined}>
          {authStep === 'google' && (
            <GoogleSignInScreen
              onContinue={handleGoogleContinue}
              onSuccess={handleGoogleSuccess}
            />
          )}

          {authStep === 'mobile' && (
            <MobileNumberScreen
              initialNumber={mobileNumber}
              onSubmit={handleMobileSubmit}
            />
          )}

          {authStep === 'otp' && (
            <OTPVerificationScreen
              mobileNumber={mobileNumber}
              confirmationResult={confirmationResult}
              onVerifySuccess={handleOtpVerified}
            />
          )}
        </AuthLayout>
      </div>
    )
  }

  // =========================================================================
  // 3. AUTHENTICATED STATE (User Dashboard & Verification Popup)
  // =========================================================================
  return (
    <div className="min-h-[100dvh] bg-[#F7F8F3] flex flex-col justify-between font-sans selection:bg-[#DCE8E1] selection:text-[#102F2A]">
      {/* Toast Notification */}
      {successBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fadeIn max-w-sm w-full px-4">
          <div className="p-3.5 bg-[#EEF2EC] border border-[#D8E0DA] text-[#2F8F6B] rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-[#2F8F6B] shrink-0" />
            <span>{successBanner}</span>
          </div>
        </div>
      )}

      {/* Authenticated Dashboard */}
      <DDSUserDashboard
        user={user}
        socketStatus={socketStatus}
        onLogout={handleLogout}
      />

      {/* Verification Modal (Render ONLY when authenticated AND active request exists) */}
      {activeRequest && (
        <DDSAuthModal
          request={activeRequest}
          onClose={() => setActiveRequest(null)}
          onSuccess={handleVerificationSuccess}
        />
      )}
    </div>
  )
}

export default App
