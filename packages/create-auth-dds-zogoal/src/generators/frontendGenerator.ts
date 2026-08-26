import path from 'path'
import { safeWriteFile, ensureDir } from '../utils/fileUtils.js'
import { logger } from '../utils/logger.js'

export function generateFrontendIntegration(targetDir: string, hasTypeScript: boolean): string[] {
  const integrationDir = path.join(targetDir, 'src', 'integrations', 'dds')
  ensureDir(integrationDir)

  const ext = hasTypeScript ? 'tsx' : 'jsx'
  const tsExt = hasTypeScript ? 'ts' : 'js'
  const createdFiles: string[] = []

  // 1. DDSProvider wrapper
  const providerContent = `import React from 'react'
import { DDSProvider as BaseDDSProvider } from '@visionnxtgen2026/dds-auth/react'

export interface DDSProviderProps {
  children: React.ReactNode
  merchantApiUrl?: string
}

export const DDSProvider: React.FC<DDSProviderProps> = ({
  children,
  merchantApiUrl = process.env.REACT_APP_API_URL || process.env.VITE_API_URL || 'http://localhost:5001'
}) => {
  return (
    <BaseDDSProvider merchantApiUrl={merchantApiUrl}>
      {children}
    </BaseDDSProvider>
  )
}

export default DDSProvider
`
  const providerPath = path.join(integrationDir, `DDSProvider.${ext}`)
  if (safeWriteFile(providerPath, providerContent, false)) {
    createdFiles.push(providerPath)
  }

  // 2. DDSVerificationButton component
  const buttonContent = `import React, { useState } from 'react'
import { useDDSVerification, DDSStatusBadge } from '@visionnxtgen2026/dds-auth/react'

export interface DDSVerificationButtonProps {
  onVerified?: (requestId: string) => void
  merchantApiUrl?: string
  buttonText?: string
  className?: string
}

export const DDSVerificationButton: React.FC<DDSVerificationButtonProps> = ({
  onVerified,
  merchantApiUrl,
  buttonText = 'Verify Identity with DDS',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [mobileNumber, setMobileNumber] = useState('')

  const {
    status,
    verificationCode,
    countdown,
    error,
    loading,
    isVerified,
    initiateVerification,
    reset
  } = useDDSVerification({
    merchantApiUrl,
    onSuccess: (reqId) => {
      if (onVerified) onVerified(reqId)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mobileNumber) return
    await initiateVerification(mobileNumber)
  }

  const handleClose = () => {
    setIsOpen(false)
    if (!isVerified) reset()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          borderRadius: '16px',
          backgroundColor: isVerified ? '#EEF2EC' : '#123C35',
          color: isVerified ? '#2F8F6B' : '#FFFFFF',
          fontSize: '13px',
          fontWeight: 700,
          border: isVerified ? '1px solid #D8E0DA' : 'none',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        <span>🛡️</span>
        <span>{isVerified ? '✓ Verified with DDS' : buttonText}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(16, 47, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
          onClick={handleClose}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid #D8E0DA',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              color: '#102F2A'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🛡️</span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#102F2A' }}>
                    DDS Verification
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64746E' }}>
                  Secure. Verify. Trust. — by Zogoal
                </p>
              </div>
              <DDSStatusBadge status={status} />
            </div>

            {status === 'idle' && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64746E' }}>
                  Enter your mobile number to verify your identity on the DDS User App.
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="9876543210"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #D8E0DA',
                      backgroundColor: '#F7F8F3',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#102F2A',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '12px',
                      border: '1px solid #D8E0DA',
                      backgroundColor: '#EEF2EC',
                      color: '#102F2A',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      padding: '10px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: '#123C35',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Send Verification
                  </button>
                </div>
              </form>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏳</div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700 }}>
                  Approval Request Sent
                </h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64746E' }}>
                  Open your <strong>DDS User App</strong> on your mobile to approve this verification.
                </p>
                {verificationCode && (
                  <div style={{ backgroundColor: '#F7F8F3', padding: '12px', borderRadius: '16px', border: '1px solid #D8E0DA', marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64746E', fontWeight: 700, display: 'block' }}>
                      Security Verification Code
                    </span>
                    <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '4px', color: '#123C35', fontFamily: 'monospace' }}>
                      {verificationCode}
                    </span>
                  </div>
                )}
                <span style={{ fontSize: '11px', color: '#854D0E', fontWeight: 600 }}>
                  Time remaining: {countdown}s
                </span>
              </div>
            )}

            {isVerified && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 800, color: '#2F8F6B' }}>
                  Identity Verified!
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64746E' }}>
                  Your identity has been authenticated by DDS.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#123C35',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            )}

            {status === 'rejected' && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>❌</div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800, color: '#991B1B' }}>
                  Verification Rejected
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64746E' }}>
                  The request was declined by the user.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#123C35',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

            {status === 'expired' && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏱️</div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800, color: '#475569' }}>
                  Verification Expired
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64746E' }}>
                  The verification challenge timed out.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#123C35',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

            {status === 'error' && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800, color: '#991B1B' }}>
                  Verification Error
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#991B1B' }}>
                  {error || 'An unexpected error occurred.'}
                </p>
                <button
                  type="button"
                  onClick={reset}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#123C35',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default DDSVerificationButton
`
  const buttonPath = path.join(integrationDir, `DDSVerificationButton.${ext}`)
  if (safeWriteFile(buttonPath, buttonContent, false)) {
    createdFiles.push(buttonPath)
  }

  // 3. Index barrel
  const indexContent = `export * from './DDSProvider'
export * from './DDSVerificationButton'
export { useDDSVerification, DDSStatusBadge } from '@visionnxtgen2026/dds-auth/react'
`
  const indexPath = path.join(integrationDir, `index.${tsExt}`)
  if (safeWriteFile(indexPath, indexContent, false)) {
    createdFiles.push(indexPath)
  }

  logger.success(`DDS React integration created at src/integrations/dds/`)
  return createdFiles
}
