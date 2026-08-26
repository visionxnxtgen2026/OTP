import React, { useEffect, useState } from 'react'
import { devApi } from '../services/api'
import type { Application } from '../services/api'
import {
  Plus,
  Copy,
  Check,
  Search,
  ArrowLeft,
  Key,
  Shield,
  Globe,
  Link,
  Power,
  Trash2,
  RotateCw,
  Eye,
  EyeOff,
  AlertTriangle,
  Server,
  Loader2,
  Activity,
  CheckCircle2,
  XCircle,
  X,
  ExternalLink
} from 'lucide-react'

interface ApplicationsViewProps {
  onOpenCreate: () => void
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({ onOpenCreate }) => {
  const [apps, setApps] = useState<Application[]>([])
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [search, setSearch] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Security & Reveal State
  const [showSecret, setShowSecret] = useState(false)
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false)
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Test Connection State
  const [testConnStatus, setTestConnStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle')
  const [testConnMessage, setTestConnMessage] = useState<string | null>(null)

  // Origin Modal State
  const [isAddOriginOpen, setIsAddOriginOpen] = useState(false)
  const [newOrigin, setNewOrigin] = useState('')
  const [originError, setOriginError] = useState<string | null>(null)
  const [originToRemove, setOriginToRemove] = useState<string | null>(null)

  // Callback Modal State
  const [isAddCallbackOpen, setIsAddCallbackOpen] = useState(false)
  const [newCallback, setNewCallback] = useState('')
  const [callbackError, setCallbackError] = useState<string | null>(null)
  const [callbackToRemove, setCallbackToRemove] = useState<string | null>(null)

  // Status Toggle State
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  // Delete / Danger Zone Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    loadApps()
  }, [])

  // Auto-hide secret after 30 seconds
  useEffect(() => {
    let timeout: any = null
    if (showSecret) {
      timeout = setTimeout(() => setShowSecret(false), 30000)
    }
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [showSecret])

  const loadApps = async () => {
    try {
      const res = await devApi.getApplications()
      if (res.success && res.data) {
        setApps(res.data)
        if (selectedApp) {
          const updated = res.data.find((a) => a.applicationId === selectedApp.applicationId)
          if (updated) setSelectedApp(updated)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // 1. Reveal Secret
  const handleConfirmReveal = () => {
    setShowSecret(true)
    setIsRevealModalOpen(false)
  }

  // 2. Regenerate Client Secret
  const handleRegenerateSecret = async () => {
    if (!selectedApp) return
    setIsRegenerating(true)
    try {
      const res = await devApi.regenerateSecret(selectedApp.applicationId)
      if (res.success && res.clientSecret) {
        setSelectedApp({ ...selectedApp, clientSecret: res.clientSecret })
        setShowSecret(true)
        setIsRegenerateModalOpen(false)
        await loadApps()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsRegenerating(false)
    }
  }

  // 3. Test Connection
  const handleTestConnection = async () => {
    if (!selectedApp) return
    setTestConnStatus('testing')
    setTestConnMessage(null)
    try {
      const res = await devApi.testConnection(selectedApp.applicationId)
      if (res.success) {
        setTestConnStatus('success')
        setTestConnMessage(res.message || 'Connection successful. Application is correctly configured.')
      } else {
        setTestConnStatus('failed')
        setTestConnMessage(res.message || res.error || 'Connection failed.')
      }
    } catch {
      setTestConnStatus('failed')
      setTestConnMessage('Failed to reach DDS Auth server.')
    }
  }

  // 4. Add Allowed Origin
  const handleAddOrigin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedApp || !newOrigin.trim()) return
    setOriginError(null)

    try {
      const res = await devApi.addOrigin(selectedApp.applicationId, newOrigin.trim())
      if (res.success && res.data) {
        setSelectedApp({ ...selectedApp, allowedOrigins: res.data })
        setIsAddOriginOpen(false)
        setNewOrigin('')
        await loadApps()
      } else {
        setOriginError(res.message || res.error || 'Failed to add origin')
      }
    } catch {
      setOriginError('Connection error')
    }
  }

  // 5. Remove Allowed Origin
  const handleConfirmRemoveOrigin = async () => {
    if (!selectedApp || !originToRemove) return
    try {
      const res = await devApi.removeOrigin(selectedApp.applicationId, originToRemove)
      if (res.success && res.data) {
        setSelectedApp({ ...selectedApp, allowedOrigins: res.data })
        setOriginToRemove(null)
        await loadApps()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 6. Add Callback URL
  const handleAddCallback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedApp || !newCallback.trim()) return
    setCallbackError(null)

    try {
      const res = await devApi.addCallback(selectedApp.applicationId, newCallback.trim())
      if (res.success && res.data) {
        setSelectedApp({ ...selectedApp, callbackUrls: res.data })
        setIsAddCallbackOpen(false)
        setNewCallback('')
        await loadApps()
      } else {
        setCallbackError(res.message || res.error || 'Failed to add callback URL')
      }
    } catch {
      setCallbackError('Connection error')
    }
  }

  // 7. Remove Callback URL
  const handleConfirmRemoveCallback = async () => {
    if (!selectedApp || !callbackToRemove) return
    try {
      const res = await devApi.removeCallback(selectedApp.applicationId, callbackToRemove)
      if (res.success && res.data) {
        setSelectedApp({ ...selectedApp, callbackUrls: res.data })
        setCallbackToRemove(null)
        await loadApps()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 8. Toggle Application Status (Active <-> Disabled)
  const handleToggleStatus = async () => {
    if (!selectedApp) return
    setIsTogglingStatus(true)
    try {
      const res = await devApi.toggleStatus(selectedApp.applicationId)
      if (res.success && res.status) {
        setSelectedApp({ ...selectedApp, status: res.status })
        await loadApps()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsTogglingStatus(false)
    }
  }

  // 9. Delete Application (Type-to-Confirm)
  const handleDeleteApp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedApp) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const res = await devApi.deleteApplication(selectedApp.applicationId, deleteConfirmText)
      if (res.success) {
        setIsDeleteModalOpen(false)
        setSelectedApp(null)
        setDeleteConfirmText('')
        await loadApps()
      } else {
        setDeleteError(res.message || res.error || 'Failed to delete application')
      }
    } catch {
      setDeleteError('Connection error during deletion.')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredApps = apps.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.applicationId.toLowerCase().includes(search.toLowerCase()) ||
      a.clientId.toLowerCase().includes(search.toLowerCase())
  )

  // =========================================================================
  // VIEW: SINGLE APPLICATION DETAILS
  // =========================================================================
  if (selectedApp) {
    const isAppActive = selectedApp.status === 'active'

    return (
      <div className="space-y-6 animate-fadeIn pb-16">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedApp(null)}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#123C35] hover:text-[#102F2A] bg-white border border-[#D8E0DA] hover:bg-[#EEF2EC] px-4 py-2.5 rounded-2xl shadow-2xs cursor-pointer transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-[#123C35]" />
            <span>Back to Applications</span>
          </button>

          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full border ${
              isAppActive
                ? 'bg-[#EEF2EC] text-[#2F8F6B] border-[#D8E0DA]'
                : 'bg-amber-50 text-[#C48A32] border-amber-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isAppActive ? 'bg-[#2F8F6B] animate-pulse' : 'bg-[#C48A32]'}`} />
            <span className="capitalize">{selectedApp.status}</span>
          </span>
        </div>

        {/* Section: Application Header */}
        <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 sm:p-7 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF2EC] text-[#123C35] border border-[#D8E0DA] flex items-center justify-center font-black text-2xl shadow-2xs shrink-0">
                {selectedApp.name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#102F2A] tracking-tight truncate">
                    {selectedApp.name}
                  </h1>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize border ${
                      isAppActive
                        ? 'bg-[#EEF2EC] text-[#2F8F6B] border-[#D8E0DA]'
                        : 'bg-amber-50 text-[#C48A32] border-amber-200'
                    }`}
                  >
                    ● {selectedApp.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#64746E] font-mono">
                  <Globe className="w-3.5 h-3.5 text-[#6F9584]" />
                  <a
                    href={selectedApp.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#123C35] hover:underline flex items-center gap-1 truncate"
                  >
                    <span>{selectedApp.websiteUrl}</span>
                    <ExternalLink className="w-3 h-3 text-[#64746E]" />
                  </a>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#D8E0DA]/50">
              <span className="text-[10px] uppercase font-bold text-[#64746E] block">Created On</span>
              <span className="text-xs text-[#102F2A] font-semibold">
                {new Date(selectedApp.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: APPLICATION CREDENTIALS                                        */}
        {/* ========================================================================= */}
        <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#EEF2EC] text-[#123C35] flex items-center justify-center font-bold">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#102F2A] uppercase tracking-wider">
                Application Credentials
              </h2>
              <p className="text-[11px] text-[#64746E]">
                Use these credentials to authenticate API calls from your backend server.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Application ID */}
            <div className="bg-[#F7F8F3] border border-[#D8E0DA] rounded-2xl p-4 space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-[#64746E] tracking-wider">
                  Application ID
                </span>
                <button
                  onClick={() => handleCopy(selectedApp.applicationId, 'appId')}
                  className="text-xs font-bold text-[#123C35] hover:text-[#2F8F6B] flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'appId' ? <Check className="w-3.5 h-3.5 text-[#2F8F6B]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'appId' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <code className="font-mono font-bold text-[#102F2A] text-sm block truncate break-all">
                {selectedApp.applicationId}
              </code>
            </div>

            {/* Client ID */}
            <div className="bg-[#F7F8F3] border border-[#D8E0DA] rounded-2xl p-4 space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-[#64746E] tracking-wider">
                  Client ID
                </span>
                <button
                  onClick={() => handleCopy(selectedApp.clientId, 'clientId')}
                  className="text-xs font-bold text-[#123C35] hover:text-[#2F8F6B] flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'clientId' ? <Check className="w-3.5 h-3.5 text-[#2F8F6B]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'clientId' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <code className="font-mono font-bold text-[#102F2A] text-sm block truncate break-all">
                {selectedApp.clientId}
              </code>
            </div>
          </div>

          {/* Client Secret */}
          <div className="bg-[#F7F8F3] border border-[#D8E0DA] rounded-2xl p-4 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase text-[#64746E] tracking-wider">
                Client Secret (Backend Server Only)
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (showSecret) setShowSecret(false)
                    else setIsRevealModalOpen(true)
                  }}
                  className="text-xs font-bold text-[#102F2A] hover:text-[#123C35] flex items-center gap-1 cursor-pointer"
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5 text-[#64746E]" /> : <Eye className="w-3.5 h-3.5 text-[#64746E]" />}
                  <span>{showSecret ? 'Hide Secret' : 'Reveal Secret'}</span>
                </button>

                <button
                  onClick={() => handleCopy(selectedApp.clientSecret, 'secret')}
                  className="text-xs font-bold text-[#123C35] hover:text-[#2F8F6B] flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'secret' ? <Check className="w-3.5 h-3.5 text-[#2F8F6B]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'secret' ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => setIsRegenerateModalOpen(true)}
                  className="text-xs font-bold text-[#C48A32] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            <code className="font-mono font-bold text-[#102F2A] text-sm block tracking-wider break-all bg-white p-2.5 rounded-xl border border-[#D8E0DA]">
              {showSecret ? selectedApp.clientSecret : '••••••••••••••••••••••••••••••••••••••••••••'}
            </code>

            <p className="text-[11px] text-[#64746E] font-medium">
              🔒 Never expose your Client Secret in frontend React or browser code. Keep safe in your backend environment variables.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: INTEGRATION STATUS & TEST CONNECTION                           */}
        {/* ========================================================================= */}
        <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#EEF2EC] text-[#123C35] flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-[#102F2A] uppercase tracking-wider">
                  Integration Status
                </h2>
              </div>
              <p className="text-[11px] text-[#64746E]">
                Verify server-to-server connectivity and credential health for {selectedApp.name}.
              </p>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={testConnStatus === 'testing'}
              className="py-2.5 px-4 bg-[#123C35] hover:bg-[#102F2A] active:scale-[0.99] disabled:opacity-50 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
            >
              {testConnStatus === 'testing' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Testing Connectivity...</span>
                </>
              ) : testConnStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2F8F6B]" />
                  <span>✓ Connected</span>
                </>
              ) : testConnStatus === 'failed' ? (
                <>
                  <XCircle className="w-3.5 h-3.5 text-rose-300" />
                  <span>⚠ Failed</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5" />
                  <span>Test Connection</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-[#F7F8F3] border border-[#D8E0DA] rounded-2xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#64746E] block">Integration Status</span>
              <span className="font-bold text-[#2F8F6B] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2F8F6B] animate-pulse" />
                ● Active & Connected
              </span>
            </div>

            <div className="p-3.5 bg-[#F7F8F3] border border-[#D8E0DA] rounded-2xl space-y-1 min-w-0">
              <span className="text-[10px] font-bold uppercase text-[#64746E] block">Allowed Origin</span>
              <span className="font-mono font-bold text-[#102F2A] truncate block">
                {selectedApp.allowedOrigins?.[0] || 'http://localhost:5175'}
              </span>
            </div>

            <div className="p-3.5 bg-[#F7F8F3] border border-[#D8E0DA] rounded-2xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#64746E] block">Credentials</span>
              <span className="font-bold text-[#2F8F6B] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2F8F6B]" />
                <span>✓ Valid & Hashed</span>
              </span>
            </div>
          </div>

          {testConnStatus === 'success' && testConnMessage && (
            <div className="p-3.5 bg-[#EEF2EC] border border-[#D8E0DA] text-[#123C35] rounded-2xl text-xs flex items-start gap-2.5 font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-[#2F8F6B] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">✓ Connection Successful</strong>
                <span>{testConnMessage}</span>
              </div>
            </div>
          )}

          {testConnStatus === 'failed' && testConnMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-[#C95A5A] rounded-2xl text-xs flex items-start gap-2.5 font-medium animate-fadeIn">
              <XCircle className="w-4 h-4 text-[#C95A5A] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">✗ Connection Failed</strong>
                <span>{testConnMessage}</span>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: ALLOWED ORIGINS                                                */}
        {/* ========================================================================= */}
        <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#EEF2EC] text-[#123C35] flex items-center justify-center font-bold">
                  <Globe className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-[#102F2A] uppercase tracking-wider">
                  Allowed Origins
                </h2>
              </div>
              <p className="text-[11px] text-[#64746E]">
                Only requests from registered origins are authorized to use this application.
              </p>
            </div>

            <button
              onClick={() => {
                setNewOrigin('')
                setOriginError(null)
                setIsAddOriginOpen(true)
              }}
              className="py-2 px-3.5 bg-[#EEF2EC] hover:bg-[#DCE8E1] text-[#123C35] border border-[#D8E0DA] rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Origin</span>
            </button>
          </div>

          <div className="space-y-2">
            {(!selectedApp.allowedOrigins || selectedApp.allowedOrigins.length === 0) ? (
              <div className="p-4 bg-[#F7F8F3] rounded-2xl border border-[#D8E0DA] text-xs text-[#64746E] italic text-center">
                No allowed origins configured. Requests from any browser origin will be rejected.
              </div>
            ) : (
              selectedApp.allowedOrigins.map((origin, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#F7F8F3] hover:bg-[#EEF2EC]/60 border border-[#D8E0DA] rounded-2xl flex items-center justify-between text-xs transition-colors"
                >
                  <code className="font-mono font-bold text-[#102F2A] truncate pr-2">{origin}</code>
                  <button
                    onClick={() => setOriginToRemove(origin)}
                    className="p-1.5 text-[#64746E] hover:text-[#C95A5A] hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Remove origin"
                    aria-label="Remove origin"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: REDIRECT / CALLBACK URLS                                       */}
        {/* ========================================================================= */}
        <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#EEF2EC] text-[#123C35] flex items-center justify-center font-bold">
                  <Link className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-[#102F2A] uppercase tracking-wider">
                  Redirect / Callback URLs
                </h2>
              </div>
              <p className="text-[11px] text-[#64746E]">
                Only registered callback URLs can be used by this application.
              </p>
            </div>

            <button
              onClick={() => {
                setNewCallback('')
                setCallbackError(null)
                setIsAddCallbackOpen(true)
              }}
              className="py-2 px-3.5 bg-[#EEF2EC] hover:bg-[#DCE8E1] text-[#123C35] border border-[#D8E0DA] rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Callback URL</span>
            </button>
          </div>

          <div className="space-y-2">
            {(!selectedApp.callbackUrls || selectedApp.callbackUrls.length === 0) ? (
              <div className="p-4 bg-[#F7F8F3] rounded-2xl border border-[#D8E0DA] text-xs text-[#64746E] italic text-center">
                No callback URLs registered.
              </div>
            ) : (
              selectedApp.callbackUrls.map((cbUrl, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#F7F8F3] hover:bg-[#EEF2EC]/60 border border-[#D8E0DA] rounded-2xl flex items-center justify-between text-xs transition-colors"
                >
                  <code className="font-mono font-bold text-[#102F2A] truncate pr-2">{cbUrl}</code>
                  <button
                    onClick={() => setCallbackToRemove(cbUrl)}
                    className="p-1.5 text-[#64746E] hover:text-[#C95A5A] hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Remove callback URL"
                    aria-label="Remove callback URL"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: API CONFIGURATION                                              */}
        {/* ========================================================================= */}
        <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#EEF2EC] text-[#123C35] flex items-center justify-center font-bold">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#102F2A] uppercase tracking-wider">
                API Configuration
              </h2>
              <p className="text-[11px] text-[#64746E]">
                Integration endpoints for SDK and server-to-server challenge verification.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-[#F7F8F3] rounded-2xl border border-[#D8E0DA] space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#64746E] block">Base URL</span>
              <div className="flex items-center justify-between">
                <code className="font-mono text-xs font-bold text-[#102F2A]">http://localhost:5000</code>
                <button
                  onClick={() => handleCopy('http://localhost:5000', 'apiBase')}
                  className="text-[11px] text-[#123C35] font-bold hover:underline cursor-pointer"
                >
                  {copiedKey === 'apiBase' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-[#F7F8F3] rounded-2xl border border-[#D8E0DA] space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#64746E] block">API Version</span>
              <span className="font-mono text-xs font-bold text-[#102F2A] block">v1 (REST / JSON)</span>
            </div>

            <div className="p-3.5 bg-[#F7F8F3] rounded-2xl border border-[#D8E0DA] space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#64746E] block">API Status</span>
              <span className="text-xs font-bold text-[#2F8F6B] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2F8F6B]" />
                Operational
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#102F2A] text-white rounded-2xl text-xs font-mono space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-[#6F9584] text-[11px] pb-1 border-b border-[#123C35]">
              <span>Verification Endpoints</span>
              <span>Protected by Client Credentials</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#2F8F6B]">POST /api/v1/verifications</span>
              <button
                onClick={() => handleCopy('POST /api/v1/verifications', 'ep1')}
                className="text-[10px] text-[#6F9584] hover:text-white cursor-pointer"
              >
                {copiedKey === 'ep1' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#DCE8E1]">GET /api/v1/verifications/:requestId</span>
              <button
                onClick={() => handleCopy('GET /api/v1/verifications/:requestId', 'ep2')}
                className="text-[10px] text-[#6F9584] hover:text-white cursor-pointer"
              >
                {copiedKey === 'ep2' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#2F8F6B]">POST /api/v1/verifications/:requestId/approve</span>
              <button
                onClick={() => handleCopy('POST /api/v1/verifications/:requestId/approve', 'ep3')}
                className="text-[10px] text-[#6F9584] hover:text-white cursor-pointer"
              >
                {copiedKey === 'ep3' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 6: APPLICATION STATUS                                             */}
        {/* ========================================================================= */}
        <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#EEF2EC] text-[#123C35] flex items-center justify-center font-bold">
                  <Power className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-[#102F2A] uppercase tracking-wider">
                  Application Status
                </h2>
              </div>
              <p className="text-[11px] text-[#64746E]">
                Temporarily pause new verification requests without revoking credentials.
              </p>
            </div>

            <button
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
              className={`py-2.5 px-5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer ${
                isAppActive
                  ? 'bg-amber-50 hover:bg-amber-100 text-[#C48A32] border border-amber-200'
                  : 'bg-[#EEF2EC] hover:bg-[#DCE8E1] text-[#2F8F6B] border border-[#D8E0DA]'
              }`}
            >
              {isTogglingStatus ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Power className="w-3.5 h-3.5" />
              )}
              <span>{isAppActive ? 'Disable Application' : 'Enable Application'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 7: DANGER ZONE (Bottom Section)                                   */}
        {/* ========================================================================= */}
        <div className="border border-rose-200 bg-[#FDF2F2] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-[#C95A5A]">
            <AlertTriangle className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Danger Zone</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-[#102F2A]">Delete this application</h3>
              <p className="text-xs text-[#64746E]">
                Deleting this application revokes its credentials and stops new verification requests.
              </p>
            </div>

            <button
              onClick={() => {
                setDeleteConfirmText('')
                setDeleteError(null)
                setIsDeleteModalOpen(true)
              }}
              className="py-2.5 px-4 bg-[#C95A5A] hover:bg-rose-700 active:scale-[0.99] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Application</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODALS                                                                    */}
        {/* ========================================================================= */}

        {/* MODAL 1: REVEAL SECRET */}
        {isRevealModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#D8E0DA] space-y-5">
              <div className="flex items-center gap-3 text-[#C48A32]">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-200 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102F2A]">Reveal Client Secret?</h3>
                  <p className="text-xs text-[#64746E]">Security Notice</p>
                </div>
              </div>

              <p className="text-xs text-[#64746E] leading-relaxed bg-[#F7F8F3] p-3.5 rounded-2xl border border-[#D8E0DA]">
                This secret must remain private and must only be stored on your backend server. Never expose it in browser JavaScript or React frontends.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRevealModalOpen(false)}
                  className="px-4 py-2 bg-[#EEF2EC] hover:bg-[#DCE8E1] text-[#102F2A] rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReveal}
                  className="px-4 py-2 bg-[#123C35] hover:bg-[#102F2A] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Reveal Secret
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: REGENERATE SECRET */}
        {isRegenerateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#D8E0DA] space-y-5">
              <div className="flex items-center gap-3 text-[#C48A32]">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-200 shrink-0">
                  <RotateCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102F2A]">Regenerate Client Secret?</h3>
                  <p className="text-xs text-[#64746E]">Immediate Invalidation</p>
                </div>
              </div>

              <p className="text-xs text-[#102F2A] leading-relaxed bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
                Regenerating this secret will invalidate the current secret immediately. Any third-party backend using the old secret will stop authenticating.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegenerateModalOpen(false)}
                  className="px-4 py-2 bg-[#EEF2EC] hover:bg-[#DCE8E1] text-[#102F2A] rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isRegenerating}
                  onClick={handleRegenerateSecret}
                  className="px-4 py-2 bg-[#C48A32] hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {isRegenerating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Regenerate Secret</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: ADD ALLOWED ORIGIN */}
        {isAddOriginOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#D8E0DA] space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#102F2A]">Add Allowed Origin</h3>
                <p className="text-xs text-[#64746E]">
                  Allow browser requests originating from this domain
                </p>
              </div>

              {originError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-[#C95A5A] rounded-xl">
                  {originError}
                </div>
              )}

              <form onSubmit={handleAddOrigin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#102F2A] mb-1.5">
                    Origin URL
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    placeholder="https://shop.example.com"
                    className="w-full px-4 py-2.5 bg-[#F7F8F3] border border-[#D8E0DA] focus:bg-white focus:border-[#123C35] rounded-xl text-xs font-mono text-[#102F2A] focus:outline-hidden"
                  />
                  <span className="text-[11px] text-[#64746E] mt-1 block">
                    Examples: <code className="text-[#102F2A] font-bold">https://shop.example.com</code> or <code className="text-[#102F2A] font-bold">http://localhost:5175</code>
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOriginOpen(false)}
                    className="px-4 py-2 bg-[#EEF2EC] hover:bg-[#DCE8E1] text-[#102F2A] rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#123C35] hover:bg-[#102F2A] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    Add Origin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: REMOVE ORIGIN */}
        {originToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#D8E0DA] space-y-4">
              <h3 className="text-base font-bold text-[#102F2A]">Remove Origin?</h3>
              <p className="text-xs text-[#64746E]">
                Are you sure you want to remove <code className="font-mono font-bold text-[#102F2A]">{originToRemove}</code>? Requests from this origin will no longer be accepted.
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setOriginToRemove(null)}
                  className="px-4 py-2 bg-[#EEF2EC] hover:bg-[#DCE8E1] text-[#102F2A] rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemoveOrigin}
                  className="px-4 py-2 bg-[#C95A5A] hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Remove Origin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 5: ADD CALLBACK URL */}
        {isAddCallbackOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#D8E0DA] space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#102F2A]">Add Callback URL</h3>
                <p className="text-xs text-[#64746E]">
                  Register a valid URL for authentication redirects
                </p>
              </div>

              {callbackError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-[#C95A5A] rounded-xl">
                  {callbackError}
                </div>
              )}

              <form onSubmit={handleAddCallback} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#102F2A] mb-1.5">
                    Callback URL
                  </label>
                  <input
                    type="text"
                    required
                    value={newCallback}
                    onChange={(e) => setNewCallback(e.target.value)}
                    placeholder="https://shop.example.com/auth/callback"
                    className="w-full px-4 py-2.5 bg-[#F7F8F3] border border-[#D8E0DA] focus:bg-white focus:border-[#123C35] rounded-xl text-xs font-mono text-[#102F2A] focus:outline-hidden"
                  />
                  <span className="text-[11px] text-[#64746E] mt-1 block">
                    Example: <code className="text-[#102F2A] font-bold">http://localhost:5175/callback</code>
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCallbackOpen(false)}
                    className="px-4 py-2 bg-[#EEF2EC] hover:bg-[#DCE8E1] text-[#102F2A] rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#123C35] hover:bg-[#102F2A] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    Add URL
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 6: REMOVE CALLBACK */}
        {callbackToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#D8E0DA] space-y-4">
              <h3 className="text-base font-bold text-[#102F2A]">Remove Callback URL?</h3>
              <p className="text-xs text-[#64746E]">
                Are you sure you want to remove <code className="font-mono font-bold text-[#102F2A]">{callbackToRemove}</code>?
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCallbackToRemove(null)}
                  className="px-4 py-2 bg-[#EEF2EC] hover:bg-[#DCE8E1] text-[#102F2A] rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemoveCallback}
                  className="px-4 py-2 bg-[#C95A5A] hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 7: DELETE APPLICATION */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-rose-200 space-y-5">
              <div className="flex items-center gap-3 text-[#C95A5A]">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-200 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#102F2A]">Delete "{selectedApp.name}"?</h3>
                  <p className="text-xs text-[#C95A5A] font-semibold">This action cannot be undone.</p>
                </div>
              </div>

              <div className="text-xs text-[#64746E] space-y-2 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                <p className="font-bold text-[#102F2A]">This action will:</p>
                <ul className="list-disc pl-4 space-y-1 text-[#64746E]">
                  <li>Revoke the Client ID and Client Secret permanently</li>
                  <li>Disable all API verification access immediately</li>
                  <li>Remove configured origins and callback URLs</li>
                  <li>Stop all new verification requests</li>
                </ul>
              </div>

              {deleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-[#C95A5A] rounded-xl">
                  {deleteError}
                </div>
              )}

              <form onSubmit={handleDeleteApp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#102F2A] mb-1.5">
                    Type <strong className="text-[#C95A5A] underline select-all">{selectedApp.name}</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    required
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={selectedApp.name}
                    className="w-full px-4 py-2.5 bg-[#F7F8F3] border border-[#D8E0DA] focus:bg-white focus:border-[#C95A5A] rounded-xl text-xs text-[#102F2A] font-bold focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2.5 bg-[#EEF2EC] hover:bg-[#DCE8E1] text-[#102F2A] rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting || deleteConfirmText !== selectedApp.name}
                    className="px-5 py-2.5 bg-[#C95A5A] hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Delete Application</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // =========================================================================
  // VIEW: APPLICATIONS LIST
  // =========================================================================
  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102F2A] tracking-tight">
            Registered Applications
          </h1>
          <p className="text-xs text-[#64746E]">
            Manage client IDs, secrets, origins, and integration credentials.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="py-2.5 px-4 bg-[#123C35] hover:bg-[#102F2A] active:scale-[0.99] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Application</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by application name, ID, or client ID..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-[#D8E0DA] focus:border-[#123C35] rounded-2xl text-xs text-[#102F2A] focus:outline-hidden shadow-2xs placeholder:text-[#64746E]"
        />
        <Search className="w-4 h-4 text-[#64746E] absolute left-3.5 top-3.5 pointer-events-none" />
      </div>

      {/* Applications Cards Grid */}
      {filteredApps.length === 0 ? (
        <div className="bg-white border border-[#D8E0DA] rounded-3xl p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2EC] text-[#123C35] flex items-center justify-center mx-auto border border-[#D8E0DA]">
            <Key className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#102F2A]">No applications found</h3>
          <p className="text-xs text-[#64746E] max-w-sm mx-auto">
            {search ? 'No application matched your search criteria.' : 'You have not registered any client applications yet.'}
          </p>
          {!search && (
            <button
              onClick={onOpenCreate}
              className="mt-2 py-2 px-4 bg-[#123C35] hover:bg-[#102F2A] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create your first application</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredApps.map((app) => {
            const isActive = app.status === 'active'
            return (
              <div
                key={app.applicationId}
                onClick={() => setSelectedApp(app)}
                className="bg-white border border-[#D8E0DA] hover:border-[#123C35] rounded-3xl p-5 shadow-2xs hover:shadow-sm transition-all cursor-pointer space-y-4 text-left flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#EEF2EC] text-[#123C35] border border-[#D8E0DA] flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#102F2A] group-hover:text-[#123C35] transition-colors truncate">
                        {app.name}
                      </h3>
                      <p className="text-[11px] text-[#64746E] font-mono truncate">{app.websiteUrl}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize border shrink-0 ${
                      isActive
                        ? 'bg-[#EEF2EC] text-[#2F8F6B] border-[#D8E0DA]'
                        : 'bg-amber-50 text-[#C48A32] border-amber-200'
                    }`}
                  >
                    ● {app.status}
                  </span>
                </div>

                <div className="bg-[#F7F8F3] p-3 rounded-2xl border border-[#D8E0DA] space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#64746E]">Client ID:</span>
                    <code className="font-mono font-bold text-[#102F2A] truncate max-w-[170px]">{app.clientId}</code>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#64746E]">Allowed Origins:</span>
                    <span className="font-bold text-[#102F2A]">{app.allowedOrigins?.length || 1} registered</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#64746E] pt-1">
                  <span>Created {new Date(app.createdAt).toLocaleDateString()}</span>
                  <span className="font-bold text-[#123C35] group-hover:underline flex items-center gap-1">
                    <span>Manage</span>
                    <span>&rarr;</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
