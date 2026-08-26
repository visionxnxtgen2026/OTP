import React, { useState, useEffect } from 'react'
import { devApi } from '../services/api'
import type { Application } from '../services/api'
import { Key, Copy, Check, Eye, EyeOff, Terminal, Code, Server } from 'lucide-react'

export const ConfigurationView: React.FC = () => {
  const [apps, setApps] = useState<Application[]>([])
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    loadApps()
  }, [])

  const loadApps = async () => {
    const res = await devApi.getApplications()
    if (res.success && res.data && res.data.length > 0) {
      setApps(res.data)
      setSelectedApp(res.data[0])
    }
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const activeClientId = selectedApp?.clientId || 'dds_client_demoshop'
  const activeClientSecret = selectedApp?.clientSecret || 'dds_secret_demoshop_live_9f82k'
  const baseURL = 'http://localhost:5000'

  const backendEnvSnippet = `PORT=5001
DDS_CLIENT_ID=${activeClientId}
DDS_CLIENT_SECRET=${activeClientSecret}
DDS_AUTH_URL=${baseURL}`

  const serverInitSnippet = `import { DDSAuth } from '@dds/auth-sdk';

const dds = new DDSAuth({
  clientId: process.env.DDS_CLIENT_ID,
  clientSecret: process.env.DDS_CLIENT_SECRET,
  baseURL: process.env.DDS_AUTH_URL || 'http://localhost:5000'
});

// Request mobile verification
const result = await dds.verification.request({
  mobileId: '+918637628773',
  origin: 'http://localhost:5175'
});`

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#123C35] bg-[#EEF2EC] px-2.5 py-0.5 rounded-full mb-1 border border-[#D8E0DA]">
            <Server className="w-3.5 h-3.5 text-[#2F8F6B]" />
            <span>Integration & Configuration</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#102F2A] tracking-tight">
            DDS Auth Integration
          </h2>
          <p className="text-xs text-[#64746E] mt-0.5">
            Configure your third-party backend with credentials and official SDK
          </p>
        </div>

        {apps.length > 1 && (
          <select
            value={selectedApp?.applicationId}
            onChange={(e) => {
              const found = apps.find((a) => a.applicationId === e.target.value)
              if (found) setSelectedApp(found)
            }}
            className="px-3 py-2 bg-[#F7F8F3] border border-[#D8E0DA] rounded-xl text-xs font-semibold text-[#102F2A]"
          >
            {apps.map((a) => (
              <option key={a.applicationId} value={a.applicationId}>
                {a.name} ({a.applicationId})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Credentials Summary Card */}
      <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
        <h3 className="text-sm font-bold text-[#102F2A] uppercase tracking-wider flex items-center gap-2">
          <Key className="w-4 h-4 text-[#123C35]" />
          <span>Application Credentials ({selectedApp?.name || 'DemoShop'})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#F7F8F3] border border-[#D8E0DA] rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-[#64746E]">Client ID</span>
              <button
                onClick={() => handleCopy(activeClientId, 'clientId')}
                className="text-xs font-semibold text-[#123C35] hover:text-[#6F9584] flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedKey === 'clientId' ? (
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
            <code className="font-mono font-bold text-[#102F2A] text-sm block">
              {activeClientId}
            </code>
          </div>

          <div className="bg-[#F7F8F3] border border-[#D8E0DA] rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-[#64746E]">
                Client Secret (Backend Only)
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-xs font-semibold text-[#64746E] hover:text-[#102F2A] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showSecret ? 'Hide' : 'Reveal'}</span>
                </button>
                <button
                  onClick={() => handleCopy(activeClientSecret, 'clientSecret')}
                  className="text-xs font-semibold text-[#123C35] hover:text-[#6F9584] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedKey === 'clientSecret' ? (
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
            <code className="font-mono font-bold text-[#C95A5A] text-sm block">
              {showSecret ? activeClientSecret : '••••••••••••••••••••••••'}
            </code>
          </div>

          <div className="bg-[#F7F8F3] border border-[#D8E0DA] rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-[#64746E]">DDS API Base URL</span>
              <button
                onClick={() => handleCopy(baseURL, 'baseUrl')}
                className="text-xs font-semibold text-[#123C35] hover:text-[#6F9584] flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedKey === 'baseUrl' ? (
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
            <code className="font-mono font-bold text-[#102F2A] text-sm block">
              {baseURL}
            </code>
          </div>

          <div className="bg-[#F7F8F3] border border-[#D8E0DA] rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-[#64746E]">SDK Installation</span>
              <button
                onClick={() => handleCopy('npm install @dds/auth-sdk', 'sdkInstall')}
                className="text-xs font-semibold text-[#123C35] hover:text-[#6F9584] flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedKey === 'sdkInstall' ? (
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
            <code className="font-mono font-bold text-[#123C35] text-sm block">
              npm install @dds/auth-sdk
            </code>
          </div>
        </div>
      </div>

      {/* Backend .env file snippet */}
      <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#102F2A] uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#123C35]" />
              <span>Third-Party Backend .env Configuration</span>
            </h3>
            <p className="text-xs text-[#64746E] mt-0.5">
              Place in <code className="text-[#123C35] font-mono">third-party-demo/backend/.env</code>
            </p>
          </div>
          <button
            onClick={() => handleCopy(backendEnvSnippet, 'envSnippet')}
            className="text-xs font-semibold text-[#123C35] hover:text-[#6F9584] flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copiedKey === 'envSnippet' ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#2F8F6B]" />
                <span className="text-[#2F8F6B]">Copied .env</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy .env</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 bg-[#102F2A] text-[#2F8F6B] rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-[#123C35]">
          {backendEnvSnippet}
        </pre>
      </div>

      {/* Server integration example */}
      <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#102F2A] uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-[#123C35]" />
              <span>Server-Side Integration Example</span>
            </h3>
            <p className="text-xs text-[#64746E] mt-0.5">
              Initialize the SDK in your Node.js / Express backend
            </p>
          </div>
          <button
            onClick={() => handleCopy(serverInitSnippet, 'serverInit')}
            className="text-xs font-semibold text-[#123C35] hover:text-[#6F9584] flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copiedKey === 'serverInit' ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#2F8F6B]" />
                <span className="text-[#2F8F6B]">Copied Example</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Example</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 bg-[#102F2A] text-[#DCE8E1] rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-[#123C35]">
          {serverInitSnippet}
        </pre>
      </div>
    </div>
  )
}
