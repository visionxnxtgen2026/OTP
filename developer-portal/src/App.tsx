import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, signOutDeveloper } from './config/firebase'
import { devApi } from './services/api'
import type { DeveloperProfile } from './services/api'
import { DeveloperLogin } from './components/DeveloperLogin'
import { DeveloperDashboard } from './components/DeveloperDashboard'
import { ApplicationsView } from './components/ApplicationsView'
import { VerificationLogsView } from './components/VerificationLogsView'
import { DocumentationView } from './components/DocumentationView'
import { ConfigurationView } from './components/ConfigurationView'
import { CreateAppModal } from './components/CreateAppModal'
import {
  LayoutDashboard,
  AppWindow,
  Key,
  FileText,
  BookOpen,
  LogOut,
  ShieldCheck,
  Plus,
  Loader2,
  Menu,
  X
} from 'lucide-react'

export function App() {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const [developer, setDeveloper] = useState<DeveloperProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'config' | 'logs' | 'docs'>('dashboard')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // 1. Firebase Auth State & Backend Session Synchronization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken()
          const sessionRes = await devApi.authSession(idToken)

          if (sessionRes.success && sessionRes.developer) {
            setDeveloper(sessionRes.developer)
            setAuthState('authenticated')
          } else {
            console.warn('[Developer Portal] Backend session rejected:', sessionRes.error)
            devApi.logout()
            setDeveloper(null)
            setAuthState('unauthenticated')
          }
        } catch (err) {
          console.error('[Developer Portal] Session sync error:', err)
          devApi.logout()
          setDeveloper(null)
          setAuthState('unauthenticated')
        }
      } else {
        devApi.logout()
        setDeveloper(null)
        setAuthState('unauthenticated')
      }
    })

    return () => unsubscribe()
  }, [])

  // 2. Developer Logout Flow
  const handleLogout = async () => {
    try {
      await signOutDeveloper()
    } catch {
      // Ignore network errors
    } finally {
      devApi.logout()
      setDeveloper(null)
      setAuthState('unauthenticated')
      setIsMobileMenuOpen(false)
    }
  }

  // =========================================================================
  // 1. LOADING SCREEN
  // =========================================================================
  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-[#F7F8F3] flex flex-col items-center justify-center font-sans space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-[#123C35] text-white flex items-center justify-center shadow-lg animate-pulse">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="font-extrabold text-[#102F2A] text-lg tracking-tight">DDS DEVELOPER CONSOLE</h2>
          <div className="flex items-center justify-center gap-2 text-xs text-[#64746E] font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#123C35]" />
            <span>Verifying developer session...</span>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // 2. UNAUTHENTICATED LOGIN SCREEN
  // =========================================================================
  if (authState === 'unauthenticated' || !developer) {
    return (
      <DeveloperLogin
        onSuccess={(dev) => {
          setDeveloper(dev)
          setAuthState('authenticated')
        }}
      />
    )
  }

  // =========================================================================
  // 3. AUTHENTICATED DEVELOPER CONSOLE
  // =========================================================================
  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'applications', label: 'Applications', icon: AppWindow },
    { id: 'config', label: 'Integration & Keys', icon: Key },
    { id: 'logs', label: 'Verification Logs', icon: FileText },
    { id: 'docs', label: 'Documentation', icon: BookOpen }
  ]

  return (
    <div className="min-h-screen bg-[#F7F8F3] flex flex-col font-sans selection:bg-[#DCE8E1] selection:text-[#102F2A]">
      {/* Top Application Header */}
      <header className="w-full bg-white border-b border-[#D8E0DA] sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#102F2A] hover:bg-[#EEF2EC] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="w-9 h-9 rounded-2xl bg-[#123C35] flex items-center justify-center text-white font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#102F2A] text-base tracking-tight">
                DDS <span className="text-[#123C35] font-semibold">Developer Portal</span>
              </span>
              <span className="hidden sm:inline text-[10px] font-bold text-[#2F8F6B] bg-[#EEF2EC] px-2 py-0.5 rounded-full border border-[#D8E0DA]">
                DEVELOPER
              </span>
            </div>
          </div>

          {/* Authenticated User Profile Display */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-[#F7F8F3] px-3 py-1.5 rounded-2xl border border-[#D8E0DA]">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#EEF2EC] text-[#123C35] font-extrabold text-xs flex items-center justify-center border border-[#D8E0DA] overflow-hidden shrink-0">
                {developer.photoURL ? (
                  <img src={developer.photoURL} alt={developer.displayName} className="w-full h-full object-cover" />
                ) : (
                  <span>{(developer.displayName || developer.email || 'D').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#102F2A] leading-tight truncate max-w-[130px]">
                    {developer.displayName || 'Developer'}
                  </span>
                </div>
                <span className="text-[10px] text-[#64746E] block truncate max-w-[150px] leading-tight">
                  {developer.email}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-[#64746E] hover:text-[#C95A5A] hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sign Out of Developer Console"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Application Shell */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Desktop Fixed Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-4 sticky top-24">
            <div className="bg-white border border-[#D8E0DA] rounded-3xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EEF2EC] text-[#123C35] flex items-center justify-center font-bold text-sm border border-[#D8E0DA] shrink-0 overflow-hidden">
                  {developer.photoURL ? (
                    <img src={developer.photoURL} alt={developer.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-[#102F2A] truncate">
                      {developer.displayName || 'Developer'}
                    </h4>
                    <span className="text-[9px] font-bold text-[#123C35] bg-[#EEF2EC] px-1.5 py-0.2 rounded-md border border-[#D8E0DA]">
                      DEV
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64746E] font-mono truncate">{developer.developerId}</p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateOpen(true)}
                className="w-full py-2.5 px-3 bg-[#123C35] hover:bg-[#102F2A] active:bg-[#102F2A] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Application</span>
              </button>
            </div>

            <div className="bg-white border border-[#D8E0DA] rounded-3xl p-3 shadow-2xs space-y-1">
              {sidebarLinks.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#EEF2EC] text-[#123C35] font-bold shadow-2xs border border-[#D8E0DA]/70'
                        : 'text-[#64746E] hover:text-[#102F2A] hover:bg-[#F7F8F3]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#123C35]' : 'text-[#64746E]'}`} />
                    <span>{item.label}</span>
                  </button>
                )
              })}

              <div className="pt-2 border-t border-[#D8E0DA]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#C95A5A] hover:bg-rose-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Mobile Drawer / Sidebar Overlay */}
          {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div className="relative w-4/5 max-w-xs bg-white h-full p-5 flex flex-col justify-between shadow-2xl border-r border-[#D8E0DA] z-10 animate-fadeIn">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DA]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#123C35] flex items-center justify-center text-white font-bold">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-[#102F2A] text-sm">Developer Menu</span>
                    </div>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-1.5 rounded-xl hover:bg-[#F7F8F3] text-[#64746E]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      setIsCreateOpen(true)
                    }}
                    className="w-full py-2.5 px-3 bg-[#123C35] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Application</span>
                  </button>

                  <div className="space-y-1">
                    {sidebarLinks.map((item) => {
                      const Icon = item.icon
                      const isActive = activeTab === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id as any)
                            setIsMobileMenuOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left ${
                            isActive
                              ? 'bg-[#EEF2EC] text-[#123C35] font-bold border border-[#D8E0DA]'
                              : 'text-[#64746E] hover:text-[#102F2A] hover:bg-[#F7F8F3]'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#C95A5A] hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sign Out of Console</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Content Area (min-w-0 to prevent flex blowout) */}
          <main className="flex-1 min-w-0 w-full">
            {activeTab === 'dashboard' && (
              <DeveloperDashboard
                onOpenCreate={() => setIsCreateOpen(true)}
                onNavigateTab={(tab) => setActiveTab(tab as any)}
              />
            )}

            {activeTab === 'applications' && (
              <ApplicationsView onOpenCreate={() => setIsCreateOpen(true)} />
            )}

            {activeTab === 'config' && <ConfigurationView />}

            {activeTab === 'logs' && <VerificationLogsView />}

            {activeTab === 'docs' && <DocumentationView />}
          </main>
        </div>
      </div>

      <CreateAppModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => setIsCreateOpen(false)}
      />
    </div>
  )
}

export default App
