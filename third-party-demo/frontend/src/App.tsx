import React, { useState, useEffect, useRef } from 'react'
import { thirdPartyApi } from './services/api'
import type { DdsAuthHealth } from './services/api'
import {
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Lock,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'

export function App() {
  const [mobileNumber, setMobileNumber] = useState('8637628773')
  const [status, setStatus] = useState<'idle' | 'requesting' | 'pending' | 'verified' | 'rejected' | 'expired' | 'locked'>('idle')
  const [requestId, setRequestId] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(120)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isUnregistered, setIsUnregistered] = useState(false)
  const [ddsHealth, setDdsHealth] = useState<DdsAuthHealth>({ status: 'CHECKING' })
  const [isRetryingHealth, setIsRetryingHealth] = useState(false)

  const pollingRef = useRef<any>(null)
  const timerRef = useRef<any>(null)

  // Format mobile number as 86376 28773 for input display
  const formatInput = (digits: string) => {
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`
  }

  // Health check on startup & periodic poll
  const verifyHealth = async () => {
    try {
      const res = await thirdPartyApi.checkHealth()
      if (res.ddsAuth) {
        setDdsHealth(res.ddsAuth)
      } else {
        setDdsHealth({
          status: res.status === 'ok' ? 'CONNECTED' : 'DDS_UNREACHABLE',
          message: res.status === 'ok' ? 'Connected to DDS Auth' : 'Backend health check failed'
        })
      }
    } catch {
      setDdsHealth({
        status: 'DDS_UNREACHABLE',
        message: 'Could not connect to DemoShop backend (:5001)'
      })
    }
  }

  const handleManualRetryHealth = async () => {
    setIsRetryingHealth(true)
    await verifyHealth()
    setTimeout(() => setIsRetryingHealth(false), 500)
  }

  useEffect(() => {
    verifyHealth()
    const hInterval = setInterval(verifyHealth, 4000)
    return () => clearInterval(hInterval)
  }, [])

  // Poll verification status when pending
  useEffect(() => {
    if (status === 'pending' && requestId) {
      setCountdown(120)

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            clearInterval(pollingRef.current)
            setStatus('expired')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      pollingRef.current = setInterval(async () => {
        try {
          const res = await thirdPartyApi.pollStatus(requestId)
          if (res.success) {
            if (res.status === 'verified') {
              clearInterval(pollingRef.current)
              clearInterval(timerRef.current)
              setStatus('verified')
            } else if (res.status === 'rejected') {
              clearInterval(pollingRef.current)
              clearInterval(timerRef.current)
              setStatus('rejected')
            } else if (res.status === 'expired') {
              clearInterval(pollingRef.current)
              clearInterval(timerRef.current)
              setStatus('expired')
            }
          }
        } catch (err: any) {
          // If server returns 401 Unauthorized (application revoked), fail fast
          if (err.message && (err.message.includes('401') || err.message.includes('revoked'))) {
            clearInterval(pollingRef.current)
            clearInterval(timerRef.current)
            setStatus('idle')
            setErrorMsg(err.message)
            verifyHealth()
          }
        }
      }, 1500)
    }

    return () => {
      clearInterval(pollingRef.current)
      clearInterval(timerRef.current)
    }
  }, [status, requestId])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = mobileNumber.replace(/\D/g, '').slice(0, 10)
    if (clean.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number')
      return
    }

    // Fail-fast if integration status is not connected
    if (!isDdsConnected) {
      setErrorMsg(`Cannot initiate verification: DDS Auth is ${ddsHealth.status}. Please check your backend configuration.`)
      return
    }

    setStatus('requesting')
    setErrorMsg(null)
    setIsUnregistered(false)

    try {
      const res = await thirdPartyApi.initiateVerification({
        mobileNumber: clean
      })

      if (res.success && res.requestId) {
        setRequestId(res.requestId)
        setVerificationCode(res.verificationCode || null)
        setStatus('pending')
      } else {
        setStatus('idle')
        if (res.error === 'MOBILE_NOT_REGISTERED') {
          setIsUnregistered(true)
        } else {
          setErrorMsg(res.message || res.error || 'Failed to initiate verification with DDS')
          if (res.error?.includes('REVOKED') || res.error?.includes('CREDENTIAL') || res.error?.includes('INVALID')) {
            verifyHealth()
          }
        }
      }
    } catch {
      setStatus('idle')
      setErrorMsg('Could not connect to DemoShop Backend on http://localhost:5001')
    }
  }

  const handleReset = () => {
    setStatus('idle')
    setRequestId(null)
    setVerificationCode(null)
    setErrorMsg(null)
    setIsUnregistered(false)
  }

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const isDdsConnected = ddsHealth.status === 'CONNECTED'

  return (
    <div className="min-h-screen bg-[#F7F8F3] flex flex-col font-sans selection:bg-[#DCE8E1] selection:text-[#102F2A]">
      {/* Top DemoShop Navbar */}
      <header className="w-full bg-[#123C35] text-white sticky top-0 z-40 shadow-sm border-b border-[#102F2A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#6F9584] text-white flex items-center justify-center font-black shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight">DemoShop</span>
              <span className="text-[10px] text-[#DCE8E1] block -mt-0.5 font-mono">
                Checkout Flow • Protected by DDS Auth SDK
              </span>
            </div>
          </div>

          {/* Dynamic Integration Status */}
          <div className="flex items-center gap-2">
            {ddsHealth.status === 'CONNECTED' ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#DCE8E1] bg-[#102F2A] px-3 py-1 rounded-full border border-[#6F9584]/40">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F8F6B] animate-pulse" />
                DDS Auth Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-300 bg-rose-950/90 px-3 py-1 rounded-full border border-rose-500/40">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                {ddsHealth.status.replace(/_/g, ' ')}
              </span>
            )}

            <button
              onClick={handleManualRetryHealth}
              className="p-1.5 rounded-xl hover:bg-[#102F2A] text-[#DCE8E1] transition-colors cursor-pointer"
              title="Refresh integration status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetryingHealth ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Col: Order Summary */}
        <div className="md:col-span-5 bg-white border border-[#D8E0DA] rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DA]">
            <h3 className="font-bold text-sm text-[#102F2A]">Order Summary</h3>
            <span className="text-xs text-[#64746E]">2 items</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F7F8F3] border border-[#D8E0DA] flex items-center justify-center text-sm">
                  🎧
                </div>
                <div>
                  <p className="font-bold text-[#102F2A]">Pro ANC Wireless Headphones</p>
                  <p className="text-[#64746E]">Space Gray</p>
                </div>
              </div>
              <span className="font-bold text-[#102F2A] font-mono">$199.00</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F7F8F3] border border-[#D8E0DA] flex items-center justify-center text-sm">
                  🔋
                </div>
                <div>
                  <p className="font-bold text-[#102F2A]">Ultra Slim 100W Power Bank</p>
                  <p className="text-[#64746E]">Matte Black</p>
                </div>
              </div>
              <span className="font-bold text-[#102F2A] font-mono">$49.00</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#D8E0DA] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#64746E]">
              <span>Subtotal</span>
              <span>$248.00</span>
            </div>
            <div className="flex justify-between text-[#64746E]">
              <span>Estimated Tax</span>
              <span>$12.40</span>
            </div>
            <div className="flex justify-between text-[#64746E]">
              <span>Express Delivery</span>
              <span className="text-[#2F8F6B] font-semibold">FREE</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[#102F2A] pt-2 border-t border-[#D8E0DA]">
              <span>Total Amount</span>
              <span className="font-mono">$260.40</span>
            </div>
          </div>
        </div>

        {/* Right Col: DDS Auth Mobile Verification Checkout */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF2EC] text-[#123C35] flex items-center justify-center border border-[#D8E0DA]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64746E]">
                  Identity Verification
                </span>
                <h2 className="text-xl font-bold text-[#102F2A]">Verify with DDS Auth</h2>
              </div>
            </div>

            {/* State 1: IDLE / FORM */}
            {status === 'idle' && (
              <form onSubmit={handleVerify} className="space-y-4">
                <p className="text-xs text-[#64746E]">
                  Enter your registered DDS mobile number to authorize this checkout seamlessly.
                </p>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-[#C95A5A] rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {isUnregistered && (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-xs text-amber-900 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Mobile Number Not Registered</span>
                    </div>
                    <p className="text-amber-700 leading-relaxed">
                      The number <strong className="font-mono">+91 {mobileNumber}</strong> is not registered in the DDS Auth ecosystem.
                    </p>
                    <a
                      href="http://localhost:5173"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-bold text-amber-900 hover:underline"
                    >
                      <span>Open DDS User App to register</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#102F2A] uppercase tracking-wider mb-1.5">
                    Mobile Number
                  </label>
                  <div className="flex items-center h-14 px-4 bg-[#F7F8F3] border border-[#D8E0DA] focus-within:border-[#123C35] focus-within:bg-white rounded-2xl transition-all shadow-2xs">
                    <span className="text-sm font-bold text-[#102F2A] pr-3 border-r border-[#D8E0DA]">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={formatInput(mobileNumber)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setMobileNumber(raw)
                        setErrorMsg(null)
                        setIsUnregistered(false)
                      }}
                      placeholder="86376 28773"
                      className="w-full pl-3 text-sm font-bold text-[#102F2A] placeholder:text-[#D8E0DA] bg-transparent focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isDdsConnected || mobileNumber.replace(/\D/g, '').length !== 10}
                  className="w-full h-14 bg-[#123C35] hover:bg-[#102F2A] active:scale-[0.99] disabled:opacity-50 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Verify with DDS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* State 2: REQUESTING */}
            {status === 'requesting' && (
              <div className="text-center py-10 space-y-3">
                <Loader2 className="w-8 h-8 text-[#123C35] animate-spin mx-auto" />
                <h3 className="text-base font-bold text-[#102F2A]">Calling DDS Auth SDK...</h3>
                <p className="text-xs text-[#64746E]">Creating secure server-side verification challenge</p>
              </div>
            )}

            {/* State 3: PENDING WITH 6-DIGIT CODE CARD */}
            {status === 'pending' && (
              <div className="space-y-6 text-center animate-fadeIn">
                <div className="p-6 bg-[#F7F8F3] border border-[#D8E0DA] rounded-3xl space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64746E]">
                    Enter this code in your DDS App
                  </span>

                  <div className="py-2">
                    <div className="inline-block bg-white px-6 py-3 rounded-2xl border border-[#D8E0DA] shadow-xs">
                      <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#123C35] tracking-widest">
                        {verificationCode || '••••••'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-[#64746E]">
                    <Clock className="w-4 h-4 text-[#123C35]" />
                    <span>Expires in <strong className="text-[#102F2A] font-mono">{formatTimer(countdown)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-[#64746E]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#123C35]" />
                  <span>Waiting for confirmation on your phone...</span>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-[#64746E] hover:text-[#102F2A] cursor-pointer"
                >
                  Cancel verification
                </button>
              </div>
            )}

            {/* State 4: VERIFIED */}
            {status === 'verified' && (
              <div className="text-center py-8 space-y-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-3xl bg-[#EEF2EC] text-[#2F8F6B] border border-[#D8E0DA] flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-[#102F2A]">Verification Successful!</h3>
                  <p className="text-xs text-[#64746E]">
                    Your mobile identity <span className="font-mono font-bold text-[#102F2A]">+91 {mobileNumber}</span> has been authenticated by DDS.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="py-3 px-6 bg-[#123C35] hover:bg-[#102F2A] text-white text-xs font-semibold rounded-2xl transition-all cursor-pointer shadow-xs"
                >
                  Test Another Verification
                </button>
              </div>
            )}

            {/* State 5: REJECTED / EXPIRED */}
            {(status === 'rejected' || status === 'expired') && (
              <div className="text-center py-8 space-y-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-3xl bg-rose-50 text-[#C95A5A] border border-rose-200 flex items-center justify-center mx-auto shadow-xs">
                  <XCircle className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-[#102F2A]">
                    {status === 'rejected' ? 'Verification Declined' : 'Verification Expired'}
                  </h3>
                  <p className="text-xs text-[#64746E]">
                    {status === 'rejected'
                      ? 'The verification request was declined in the DDS Mobile App.'
                      : 'The 2-minute time window expired before confirmation.'}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="py-3 px-6 bg-[#123C35] hover:bg-[#102F2A] text-white text-xs font-semibold rounded-2xl transition-all cursor-pointer shadow-xs"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
export default App
