import React from 'react'
import type { VerificationStatus } from './types.js'

export interface DDSStatusBadgeProps {
  status: VerificationStatus
  className?: string
}

export const DDSStatusBadge: React.FC<DDSStatusBadgeProps> = ({ status, className = '' }) => {
  const configs: Record<VerificationStatus, { label: string; bg: string; text: string; dot: string }> = {
    idle: {
      label: 'Not Verified',
      bg: '#F7F8F3',
      text: '#64746E',
      dot: '#A8B3AE'
    },
    requesting: {
      label: 'Requesting...',
      bg: '#EEF2EC',
      text: '#123C35',
      dot: '#123C35'
    },
    pending: {
      label: 'Awaiting User Approval',
      bg: '#FEF9C3',
      text: '#854D0E',
      dot: '#EAB308'
    },
    verified: {
      label: 'Verified by DDS',
      bg: '#EEF2EC',
      text: '#2F8F6B',
      dot: '#2F8F6B'
    },
    rejected: {
      label: 'Rejected by User',
      bg: '#FEE2E2',
      text: '#991B1B',
      dot: '#EF4444'
    },
    expired: {
      label: 'Request Expired',
      bg: '#F1F5F9',
      text: '#475569',
      dot: '#94A3B8'
    },
    error: {
      label: 'Verification Failed',
      bg: '#FEE2E2',
      text: '#991B1B',
      dot: '#EF4444'
    }
  }

  const current = configs[status] || configs.idle

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: current.bg,
        color: current.text,
        border: '1px solid rgba(0,0,0,0.06)'
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '9999px',
          backgroundColor: current.dot
        }}
      />
      <span>{current.label}</span>
    </span>
  )
}
