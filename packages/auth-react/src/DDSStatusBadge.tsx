import React from 'react'
import type { VerificationStatus } from './types.js'

interface DDSStatusBadgeProps {
  status: VerificationStatus
  className?: string
}

export const DDSStatusBadge: React.FC<DDSStatusBadgeProps> = ({ status, className = '' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'verified':
        return 'bg-[#EEF2EC] text-[#2F8F6B] border-[#D8E0DA]'
      case 'pending':
      case 'requesting':
        return 'bg-[#EEF2EC] text-[#123C35] border-[#D8E0DA]'
      case 'rejected':
      case 'error':
        return 'bg-rose-50 text-[#C95A5A] border-rose-200'
      case 'expired':
        return 'bg-amber-50 text-[#C48A32] border-amber-200'
      default:
        return 'bg-[#F7F8F3] text-[#64746E] border-[#D8E0DA]'
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${getBadgeStyle()} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'verified'
            ? 'bg-[#2F8F6B]'
            : status === 'pending' || status === 'requesting'
            ? 'bg-[#123C35] animate-pulse'
            : status === 'rejected' || status === 'error'
            ? 'bg-[#C95A5A]'
            : 'bg-[#64746E]'
        }`}
      />
      <span className="capitalize">{status}</span>
    </span>
  )
}
