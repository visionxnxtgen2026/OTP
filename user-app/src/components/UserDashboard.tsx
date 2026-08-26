import {
  ShieldCheck,
  CheckCircle2,
  LogOut,
  Send,
  CreditCard,
  TrendingUp,
  Activity
} from 'lucide-react'

interface UserDashboardProps {
  user: {
    name: string
    email: string
    mobileNumber: string
  }
  onLogout: () => void
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ user, onLogout }) => {
  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"
                alt={user.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-100 shadow-2xs"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full ring-2 ring-white">
                <CheckCircle2 className="w-3 h-3" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Welcome back, {user.name}
              </h2>
              <p className="text-xs text-slate-500 font-mono">+91 {user.mobileNumber}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Verification Status Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                Security Profile
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold">✓ Mobile Verified</h3>
            <p className="text-xs text-slate-300">
              Your registered number <strong className="font-mono text-white">+91 {user.mobileNumber}</strong> is protected by Zogoal Auth.
            </p>
          </div>
        </div>

        {/* Live Listening Status */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Zogoal Auth Listener</span>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
              Polling (2s)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            When third-party apps request verification for your number, an approval popup will automatically appear here.
          </p>
        </div>

        {/* Quick App Actions */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:bg-slate-100/80 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
              <Send className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Send</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:bg-slate-100/80 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Cards</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:bg-slate-100/80 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Invest</span>
          </div>
        </div>
      </div>
    </div>
  )
}
