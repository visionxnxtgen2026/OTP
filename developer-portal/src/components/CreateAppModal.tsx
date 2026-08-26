import React, { useState } from 'react'
import { devApi } from '../services/api'
import type { Application } from '../services/api'
import { X, Check, Copy, Loader2, CheckCircle2 } from 'lucide-react'

interface CreateAppModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (app: Application) => void
}

export const CreateAppModal: React.FC<CreateAppModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('DemoShop')
  const [websiteUrl, setWebsiteUrl] = useState('http://localhost:5175')
  const [callbackUrl, setCallbackUrl] = useState('http://localhost:5175/callback')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdApp, setCreatedApp] = useState<Application | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    setError('')

    try {
      const res = await devApi.createApplication({
        name,
        websiteUrl,
        callbackUrl
      })

      if (res.success && res.data) {
        setCreatedApp(res.data)
        onCreated(res.data)
      } else {
        setError(res.message || 'Failed to create application')
      }
    } catch {
      setError('Connection to DDS Auth Backend failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleCloseAndReset = () => {
    setCreatedApp(null)
    setName('')
    setWebsiteUrl('')
    setCallbackUrl('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#D8E0DA] relative">
        <button
          onClick={handleCloseAndReset}
          className="absolute top-5 right-5 p-2 rounded-full text-[#64746E] hover:text-[#102F2A] hover:bg-[#EEF2EC] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {createdApp ? (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF2EC] text-[#2F8F6B] flex items-center justify-center mx-auto border border-[#D8E0DA] shadow-2xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#102F2A]">Application Created Successfully</h3>
              <p className="text-xs text-[#64746E]">
                Credentials generated for your third-party SDK integration.
              </p>
            </div>

            <div className="space-y-3 bg-[#F7F8F3] p-4 rounded-2xl border border-[#D8E0DA] text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#64746E] uppercase tracking-wider mb-1">
                  Application Name
                </label>
                <p className="font-semibold text-[#102F2A] text-sm">{createdApp.name}</p>
              </div>

              <div className="h-px bg-[#D8E0DA]" />

              <div>
                <label className="block text-[10px] font-bold text-[#64746E] uppercase tracking-wider mb-1">
                  Client ID
                </label>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#D8E0DA]">
                  <code className="font-mono font-semibold text-[#102F2A] text-xs">
                    {createdApp.clientId}
                  </code>
                  <button
                    onClick={() => handleCopy(createdApp.clientId, 'clientId')}
                    className="text-[11px] font-semibold text-[#123C35] hover:text-[#6F9584] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'clientId' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#2F8F6B]" />
                        <span className="text-[#2F8F6B]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64746E] uppercase tracking-wider mb-1">
                  Client Secret (Backend Only)
                </label>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#D8E0DA]">
                  <code className="font-mono font-semibold text-[#C95A5A] text-xs">
                    {createdApp.clientSecret}
                  </code>
                  <button
                    onClick={() => handleCopy(createdApp.clientSecret, 'clientSecret')}
                    className="text-[11px] font-semibold text-[#123C35] hover:text-[#6F9584] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'clientSecret' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#2F8F6B]" />
                        <span className="text-[#2F8F6B]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleCloseAndReset}
              className="w-full py-3 bg-[#123C35] hover:bg-[#102F2A] text-white text-xs font-semibold rounded-2xl transition-all cursor-pointer shadow-xs"
            >
              Done & View Applications
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-[#102F2A]">Register New Application</h3>
              <p className="text-xs text-[#64746E]">Register your third-party website with DDS Auth</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-[#C95A5A] rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#102F2A] uppercase tracking-wider mb-1">
                Application Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. DemoShop"
                className="w-full px-4 py-2.5 bg-[#F7F8F3] border border-[#D8E0DA] focus:bg-white focus:border-[#123C35] rounded-2xl text-xs sm:text-sm text-[#102F2A] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102F2A] uppercase tracking-wider mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="http://localhost:5175"
                className="w-full px-4 py-2.5 bg-[#F7F8F3] border border-[#D8E0DA] focus:bg-white focus:border-[#123C35] rounded-2xl text-xs sm:text-sm text-[#102F2A] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102F2A] uppercase tracking-wider mb-1">
                Callback URL
              </label>
              <input
                type="url"
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                placeholder="http://localhost:5175/callback"
                className="w-full px-4 py-2.5 bg-[#F7F8F3] border border-[#D8E0DA] focus:bg-white focus:border-[#123C35] rounded-2xl text-xs sm:text-sm text-[#102F2A] focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-[#D8E0DA] text-[#64746E] hover:bg-[#F7F8F3] rounded-2xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-5 py-2.5 bg-[#123C35] hover:bg-[#102F2A] text-white rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Keys...</span>
                  </>
                ) : (
                  <span>Create Application</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
