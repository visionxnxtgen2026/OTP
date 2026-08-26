import React, { useState, useEffect } from 'react'
import {
  Shield,
  ShieldCheck,
  Check,
  Copy,
  Clock,
  LogOut,
  Trash2,
  Home,
  Activity as ActivityIcon,
  User as UserIcon,
  Radio,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import type { DDSUser, ConnectedApp, UserActivityItem } from '../services/api'
import { userApi } from '../services/api'
import { signOutFirebase } from '../services/firebase'

interface DDSUserDashboardProps {
  user: DDSUser
  socketStatus?: 'connected' | 'reconnecting' | 'disconnected'
  onLogout: () => void
}

type TabType = 'home' | 'activity' | 'security' | 'profile'

export const DDSUserDashboard: React.FC<DDSUserDashboardProps> = ({
  user,
  socketStatus = 'connected',
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([])
  const [recentActivity, setRecentActivity] = useState<UserActivityItem[]>([])
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const rawMobile = user.mobileId || user.phoneNumber || '+918637628773'
  const nationalDigits = rawMobile.replace(/\D/g, '').slice(-10)
  const canonicalMobile = `+91${nationalDigits}`
  const formattedMobile = `+91 ${nationalDigits.slice(0, 5)} ${nationalDigits.slice(5)}`
  const userId = user.userId
  const firebaseUid = user.firebaseUid

  const loadUserActivity = async () => {
    try {
      const res = await userApi.getMyActivity()
      if (res.success && res.data) {
        setConnectedApps(res.data.connectedApps || [])
        setRecentActivity(res.data.recentActivity || [])
      }
    } catch (err) {
      console.error('Failed to load user activity:', err)
    }
  }

  useEffect(() => {
    loadUserActivity()
    const interval = setInterval(loadUserActivity, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOutFirebase()
      await userApi.logout()
    } catch {
      // Ignore network errors during logout
    } finally {
      setIsSigningOut(false)
      setIsSignOutModalOpen(false)
      onLogout()
    }
  }

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true)
    setDeleteError(null)

    try {
      // 1. Delete account from MongoDB and Firebase atomically (Requirement #14, #15, #19)
      const res = await userApi.deleteAccount()
      if (res.success) {
        await signOutFirebase()
        setIsDeletingAccount(false)
        setIsDeleteModalOpen(false)
        onLogout()
      } else {
        setDeleteError(res.error || 'Failed to delete account from DDS.')
        setIsDeletingAccount(false)
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error occurred while deleting account.')
      setIsDeletingAccount(false)
    }
  }

  return (
    <div className="w-full max-w-md min-h-screen bg-[#F7F8F3] sm:bg-white border-0 sm:border-x sm:border-[#D8E0DA] flex flex-col justify-between mx-auto selection:bg-[#DCE8E1] selection:text-[#102F2A] font-sans relative">
      {/* ========================================================================= */}
      {/* 1. TOP APP HEADER                                                         */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-[#F7F8F3]/95 sm:bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-[#D8E0DA] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#123C35] text-white flex items-center justify-center shadow-xs">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[#102F2A] text-sm tracking-tight">DDS</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#EEF2EC] text-[#123C35] border border-[#D8E0DA] rounded-md">
                AUTH
              </span>
            </div>
            <p className="text-[10px] font-semibold text-[#64746E] -mt-0.5">Secure. Verify. Trust.</p>
          </div>
        </div>

        {/* Live Socket Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EEF2EC] border border-[#D8E0DA] text-[#123C35]">
            <span
              className={`w-2 h-2 rounded-full ${
                socketStatus === 'connected'
                  ? 'bg-[#2F8F6B] animate-pulse'
                  : socketStatus === 'reconnecting'
                  ? 'bg-[#C48A32]'
                  : 'bg-[#C95A5A]'
              }`}
            />
            <span>{socketStatus === 'connected' ? 'LIVE' : socketStatus.toUpperCase()}</span>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => setIsSignOutModalOpen(true)}
            className="p-1.5 rounded-xl hover:bg-[#EEF2EC] text-[#64746E] hover:text-[#C95A5A] transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. TAB CONTENT                                                            */}
      {/* ========================================================================= */}
      <main className="flex-1 px-5 py-4 pb-24 overflow-y-auto space-y-4">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-fadeIn">
            {/* User Identity Card */}
            <div className="bg-white rounded-3xl p-5 border border-[#D8E0DA] shadow-2xs space-y-3.5 relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF2EC] text-[#123C35] font-extrabold text-base flex items-center justify-center border border-[#D8E0DA] overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(user.displayName || user.name || 'S').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#102F2A] truncate">
                      {user.displayName || user.name || 'Sanjai'}
                    </h2>
                    <span className="text-[10px] font-bold text-[#2F8F6B] bg-[#EEF2EC] px-2 py-0.5 rounded-full border border-[#D8E0DA]">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-xs text-[#64746E] font-medium truncate">
                    {user.email || 'Google Account Linked'}
                  </p>
                </div>
              </div>

              {/* Identity Details Box */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between bg-[#F7F8F3] p-3 rounded-2xl border border-[#D8E0DA]">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-[#64746E] uppercase tracking-wider block">
                      Registered Mobile
                    </span>
                    <span className="font-mono font-bold text-[#102F2A] text-sm">
                      {formattedMobile}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(canonicalMobile, 'mobile')}
                    className="p-2 text-[#64746E] hover:text-[#123C35] rounded-xl hover:bg-[#EEF2EC] transition-colors cursor-pointer"
                    title="Copy canonical Mobile ID"
                  >
                    {copiedKey === 'mobile' ? (
                      <Check className="w-4 h-4 text-[#2F8F6B]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-[#F7F8F3] px-3 py-2 rounded-xl border border-[#D8E0DA] text-xs">
                  <span className="text-[11px] text-[#64746E] font-medium">User ID</span>
                  <div className="flex items-center gap-1.5">
                    <code className="font-mono text-[11px] font-bold text-[#102F2A]">
                      {userId || 'usr_db97b77f'}
                    </code>
                    <button
                      onClick={() => handleCopy(userId, 'userid')}
                      className="text-[#64746E] hover:text-[#123C35] cursor-pointer"
                    >
                      {copiedKey === 'userid' ? (
                        <Check className="w-3 h-3 text-[#2F8F6B]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Status Pills */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-3 rounded-2xl border border-[#D8E0DA] shadow-2xs space-y-1">
                <CheckCircle2 className="w-4 h-4 text-[#2F8F6B] mx-auto" />
                <span className="text-[10px] font-bold text-[#102F2A] block leading-tight">Mobile Verified</span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-[#D8E0DA] shadow-2xs space-y-1">
                <CheckCircle2 className="w-4 h-4 text-[#2F8F6B] mx-auto" />
                <span className="text-[10px] font-bold text-[#102F2A] block leading-tight">Google Linked</span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-[#D8E0DA] shadow-2xs space-y-1">
                <CheckCircle2 className="w-4 h-4 text-[#2F8F6B] mx-auto" />
                <span className="text-[10px] font-bold text-[#102F2A] block leading-tight">Firebase Sync</span>
              </div>
            </div>

            {/* Live Verification Channel Card */}
            <div className="bg-white rounded-3xl p-5 border border-[#D8E0DA] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#EEF2EC] text-[#123C35] flex items-center justify-center font-bold">
                    <Radio className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-[#102F2A] uppercase tracking-wider">
                    Verification Channel
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2F8F6B] bg-[#EEF2EC] px-2 py-0.5 rounded-full border border-[#D8E0DA]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F8F6B] animate-ping" />
                  LISTENING
                </span>
              </div>

              <p className="text-xs text-[#64746E]">
                When an authorized merchant (like DemoShop) initiates verification for your mobile number, an authorization prompt will pop up here instantly.
              </p>
            </div>

            {/* Connected Applications */}
            <div className="bg-white rounded-3xl p-5 border border-[#D8E0DA] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#102F2A] uppercase tracking-wider">
                  Connected Applications
                </h3>
                <span className="text-xs font-semibold text-[#64746E]">
                  {connectedApps.length} Active
                </span>
              </div>

              {connectedApps.length === 0 ? (
                <div className="p-4 bg-[#F7F8F3] rounded-2xl border border-[#D8E0DA] text-center space-y-1">
                  <Laptop className="w-5 h-5 text-[#64746E] mx-auto" />
                  <p className="text-xs font-semibold text-[#102F2A]">DemoShop</p>
                  <p className="text-[11px] text-[#64746E]">Authorized via DDS Auth SDK</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {connectedApps.map((app) => (
                    <div
                      key={app.applicationId}
                      className="flex items-center justify-between p-3 bg-[#F7F8F3] rounded-2xl border border-[#D8E0DA]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#EEF2EC] text-[#123C35] flex items-center justify-center font-bold text-xs border border-[#D8E0DA]">
                          {(app.applicationName || 'A').charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#102F2A]">{app.applicationName}</h4>
                          <p className="text-[10px] text-[#64746E]">{app.websiteUrl || 'http://localhost:5175'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#2F8F6B] bg-[#EEF2EC] px-2 py-0.5 rounded-full border border-[#D8E0DA]">
                        CONNECTED
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVITY */}
        {activeTab === 'activity' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-5 border border-[#D8E0DA] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#102F2A] uppercase tracking-wider">
                  Verification History
                </h3>
                <span className="text-xs font-semibold text-[#64746E]">
                  {recentActivity.length} Events
                </span>
              </div>

              {recentActivity.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Clock className="w-8 h-8 text-[#64746E] mx-auto opacity-50" />
                  <p className="text-xs font-semibold text-[#102F2A]">No recent activity yet</p>
                  <p className="text-[11px] text-[#64746E]">
                    Verification attempts from third-party websites will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentActivity.map((act) => (
                    <div
                      key={act.id || act.timestamp}
                      className="p-3 bg-[#F7F8F3] rounded-2xl border border-[#D8E0DA] flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#102F2A]">
                            {act.applicationName || 'DemoShop'}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                              act.status === 'VERIFIED'
                                ? 'bg-[#EEF2EC] text-[#2F8F6B] border-[#D8E0DA]'
                                : act.status === 'REJECTED'
                                ? 'bg-rose-50 text-[#C95A5A] border-rose-200'
                                : 'bg-[#EEF2EC] text-[#123C35] border-[#D8E0DA]'
                            }`}
                          >
                            {act.status || act.event}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64746E]">{act.description || act.event || 'Mobile Verification Challenge'}</p>
                        <p className="text-[10px] text-[#64746E] font-mono">
                          {new Date(act.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SECURITY */}
        {activeTab === 'security' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-5 border border-[#D8E0DA] shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-[#102F2A] uppercase tracking-wider">
                Security & Verification Settings
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[#F7F8F3] rounded-2xl border border-[#D8E0DA] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[#102F2A]">Firebase Authentication</p>
                    <p className="text-[11px] text-[#64746E]">Google & Phone Auth Provider</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#2F8F6B] bg-[#EEF2EC] px-2 py-0.5 rounded-full border border-[#D8E0DA]">
                    SYNCHRONIZED
                  </span>
                </div>

                <div className="p-3 bg-[#F7F8F3] rounded-2xl border border-[#D8E0DA] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[#102F2A]">Real-Time Push Alerts</p>
                    <p className="text-[11px] text-[#64746E]">Instant Socket.IO verification events</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#2F8F6B] bg-[#EEF2EC] px-2 py-0.5 rounded-full border border-[#D8E0DA]">
                    ACTIVE
                  </span>
                </div>

                <div className="p-3 bg-[#F7F8F3] rounded-2xl border border-[#D8E0DA] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[#102F2A]">MongoDB Identity Store</p>
                    <p className="text-[11px] text-[#64746E]">Permanent DDS mobile authority</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#123C35] bg-[#EEF2EC] px-2 py-0.5 rounded-full border border-[#D8E0DA]">
                    UNIQUE
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-5 border border-[#D8E0DA] shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-[#102F2A] uppercase tracking-wider">
                User Profile
              </h3>

              <div className="p-4 bg-[#F7F8F3] rounded-2xl border border-[#D8E0DA] space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64746E]">Display Name</span>
                  <span className="font-bold text-[#102F2A]">{user.displayName || user.name || 'Sanjai'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64746E]">Email</span>
                  <span className="font-bold text-[#102F2A]">{user.email || 'Google Account Linked'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64746E]">Mobile ID</span>
                  <span className="font-bold text-[#102F2A] font-mono">{formattedMobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64746E]">DDS User ID</span>
                  <span className="font-mono text-[#102F2A]">{userId}</span>
                </div>
                {firebaseUid && (
                  <div className="flex justify-between">
                    <span className="text-[#64746E]">Firebase UID</span>
                    <span className="font-mono text-[11px] text-[#102F2A] truncate max-w-[170px]">{firebaseUid}</span>
                  </div>
                )}
              </div>

              {/* Sign Out Button (Keeps Account) */}
              <button
                onClick={() => setIsSignOutModalOpen(true)}
                className="w-full py-3 bg-[#F7F8F3] hover:bg-[#EEF2EC] text-[#102F2A] border border-[#D8E0DA] rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Session</span>
              </button>

              {/* Separate Account Deletion Button (Requirement #14, #19) */}
              <div className="pt-2 border-t border-[#D8E0DA]">
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-[#C95A5A] border border-rose-200 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-[#C95A5A]" />
                  <span>Delete DDS Account Permanently</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 3. COMPACT BOTTOM NAVIGATION                                              */}
      {/* ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-[#D8E0DA] px-6 py-2 flex items-center justify-between z-30 shadow-xs">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'text-[#123C35] font-bold'
              : 'text-[#64746E] hover:text-[#102F2A]'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'activity'
              ? 'text-[#123C35] font-bold'
              : 'text-[#64746E] hover:text-[#102F2A]'
          }`}
        >
          <ActivityIcon className={`w-5 h-5 ${activeTab === 'activity' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px]">Activity</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'text-[#123C35] font-bold'
              : 'text-[#64746E] hover:text-[#102F2A]'
          }`}
        >
          <ShieldCheck className={`w-5 h-5 ${activeTab === 'security' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px]">Security</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'text-[#123C35] font-bold'
              : 'text-[#64746E] hover:text-[#102F2A]'
          }`}
        >
          <UserIcon className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 4. SIGN OUT CONFIRMATION MODAL                                            */}
      {/* ========================================================================= */}
      {isSignOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#D8E0DA] space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF2EC] text-[#123C35] flex items-center justify-center mx-auto border border-[#D8E0DA]">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#102F2A]">Sign Out of Session?</h3>
              <p className="text-xs text-[#64746E]">
                Your account remains saved. You can sign in again anytime with Google.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSignOutModalOpen(false)}
                className="flex-1 py-2.5 bg-[#EEF2EC] hover:bg-[#DCE8E1] text-[#102F2A] rounded-2xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignOut}
                disabled={isSigningOut}
                className="flex-1 py-2.5 bg-[#123C35] hover:bg-[#102F2A] text-white rounded-2xl text-xs font-semibold cursor-pointer transition-colors"
              >
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SEPARATE ACCOUNT DELETION MODAL (Requirement #14, #15, #19)            */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#C95A5A] flex items-center justify-center mx-auto border border-rose-200 shadow-2xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#102F2A]">Permanently Delete Account?</h3>
              <p className="text-xs text-[#64746E] leading-relaxed">
                This will permanently delete your authentication identity from <strong className="text-[#102F2A]">Firebase</strong> and all registered mobile verification records from <strong className="text-[#102F2A]">MongoDB</strong>.
              </p>
              <p className="text-[11px] text-[#C95A5A] font-bold">This action cannot be undone.</p>
            </div>

            {deleteError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-xs text-[#C95A5A] rounded-xl">
                {deleteError}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setDeleteError(null)
                }}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 bg-[#EEF2EC] hover:bg-[#DCE8E1] text-[#102F2A] rounded-2xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Keep Account
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 bg-[#C95A5A] hover:bg-rose-700 text-white rounded-2xl text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Permanently</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
