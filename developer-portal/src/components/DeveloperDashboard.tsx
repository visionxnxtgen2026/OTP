import React, { useEffect, useState } from 'react'
import { devApi } from '../services/api'
import type { DeveloperStats, Application, VerificationLog } from '../services/api'
import {
  AppWindow,
  Activity,
  FileText,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  Sparkles,
  Clock
} from 'lucide-react'

interface DeveloperDashboardProps {
  onOpenCreate: () => void
  onNavigateTab: (tab: string) => void
}

export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({
  onOpenCreate,
  onNavigateTab
}) => {
  const [stats, setStats] = useState<DeveloperStats>({
    totalApps: 1,
    totalRequests: 0,
    verifiedRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    successRate: 100
  })
  const [apps, setApps] = useState<Application[]>([])
  const [recentLogs, setRecentLogs] = useState<VerificationLog[]>([])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 3000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, appsRes, logsRes] = await Promise.all([
        devApi.getStats(),
        devApi.getApplications(),
        devApi.getLogs()
      ])

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }
      if (appsRes.success && appsRes.data) setApps(appsRes.data)
      if (logsRes.success && logsRes.data) setRecentLogs(logsRes.data.slice(0, 5))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#123C35] bg-[#EEF2EC] px-2.5 py-0.5 rounded-full mb-1 border border-[#D8E0DA]">
            <Sparkles className="w-3 h-3 text-[#2F8F6B]" />
            <span>Developer Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102F2A] tracking-tight">
            Developer Dashboard
          </h1>
          <p className="text-xs text-[#64746E] mt-0.5">
            Monitor DDS Auth verifications, API usage, and application credentials
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="py-2.5 px-4 bg-[#123C35] hover:bg-[#102F2A] active:bg-[#102F2A] text-white rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Application</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-[#D8E0DA] rounded-3xl p-4 sm:p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64746E]">Applications</span>
            <AppWindow className="w-4 h-4 text-[#123C35]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#102F2A]">{stats.totalApps}</p>
          <span className="text-[11px] text-[#2F8F6B] font-medium">Registered</span>
        </div>

        <div className="bg-white border border-[#D8E0DA] rounded-3xl p-4 sm:p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64746E]">Active Apps</span>
            <Activity className="w-4 h-4 text-[#2F8F6B]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#2F8F6B]">{stats.totalApps}</p>
          <span className="text-[11px] text-[#64746E] font-medium">100% operational</span>
        </div>

        <div className="bg-white border border-[#D8E0DA] rounded-3xl p-4 sm:p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64746E]">Total Requests</span>
            <FileText className="w-4 h-4 text-[#64746E]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#102F2A]">{stats.totalRequests}</p>
          <span className="text-[11px] text-[#123C35] font-medium">Total dispatched</span>
        </div>

        <div className="bg-white border border-[#D8E0DA] rounded-3xl p-4 sm:p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64746E]">Successful</span>
            <CheckCircle2 className="w-4 h-4 text-[#2F8F6B]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#2F8F6B]">{stats.verifiedRequests}</p>
          <span className="text-[11px] text-[#2F8F6B] font-medium">{stats.successRate}% success rate</span>
        </div>

        <div className="bg-white border border-[#D8E0DA] rounded-3xl p-4 sm:p-5 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64746E]">Failed / Rejected</span>
            <XCircle className="w-4 h-4 text-[#C95A5A]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#C95A5A]">{stats.rejectedRequests}</p>
          <span className="text-[11px] text-[#64746E] font-medium">Expired or rejected</span>
        </div>
      </div>

      {/* 2-Column Split: Active Applications & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#102F2A]">Registered Applications</h3>
              <p className="text-xs text-[#64746E]">Connected third-party client websites</p>
            </div>
            <button
              onClick={() => onNavigateTab('applications')}
              className="text-xs font-semibold text-[#123C35] hover:text-[#6F9584] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {apps.slice(0, 3).map((app) => (
              <div
                key={app.id || app.applicationId}
                className="p-3.5 rounded-2xl bg-[#F7F8F3] border border-[#D8E0DA] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EEF2EC] border border-[#D8E0DA] flex items-center justify-center font-bold text-[#123C35] text-xs shadow-2xs">
                    {app.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#102F2A]">{app.name}</h4>
                    <p className="text-[11px] font-mono text-[#64746E]">{app.clientId}</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#2F8F6B] bg-[#EEF2EC] border border-[#D8E0DA] px-2.5 py-0.5 rounded-full capitalize">
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#102F2A]">Live Verification Stream</h3>
              <p className="text-xs text-[#64746E]">Real-time audit verification pipeline</p>
            </div>
            <button
              onClick={() => onNavigateTab('logs')}
              className="text-xs font-semibold text-[#123C35] hover:text-[#6F9584] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Full Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentLogs.length === 0 ? (
              <div className="p-8 text-center text-[#64746E] text-xs">
                No verification logs yet. Requests from third-party apps will stream here.
              </div>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-[#F7F8F3] border border-[#D8E0DA] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        log.event === 'USER_APPROVED'
                          ? 'bg-[#2F8F6B]'
                          : log.event === 'REQUEST_CREATED'
                          ? 'bg-[#123C35] animate-pulse'
                          : log.event === 'MOBILE_NOT_REGISTERED'
                          ? 'bg-[#C48A32]'
                          : 'bg-[#C95A5A]'
                      }`}
                    />
                    <div>
                      <span className="font-semibold text-[#102F2A]">{log.event}</span>
                      <span className="text-[#64746E] mx-1.5">•</span>
                      <span className="font-mono text-[11px] text-[#64746E]">{log.mobileId}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#64746E] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
