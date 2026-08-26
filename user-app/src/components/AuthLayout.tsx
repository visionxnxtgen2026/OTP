import React from 'react'
import { BackgroundDecorations } from './BackgroundDecorations'
import { ChevronLeft } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
  onBack?: () => void
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, onBack }) => {
  return (
    <div className="min-h-screen bg-[#F7F8F3] flex justify-center selection:bg-[#DCE8E1] selection:text-[#102F2A] font-sans">
      {/* Borderless Responsive Mobile Viewport */}
      <div className="w-full max-w-md min-h-screen bg-[#F7F8F3] sm:bg-white flex flex-col justify-between relative shadow-none sm:shadow-xs border-0 sm:border-x sm:border-[#D8E0DA]">
        {/* Subtle Background Elements */}
        <BackgroundDecorations />

        {/* Top Header / Back Button Area */}
        <div className="relative z-20 h-14 px-4 flex items-center justify-between">
          {onBack ? (
            <button
              onClick={onBack}
              className="p-2 -ml-1 text-[#102F2A] hover:text-[#123C35] transition-transform active:scale-95 cursor-pointer rounded-xl hover:bg-[#EEF2EC]"
              aria-label="Back"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          ) : (
            <div className="h-6" />
          )}
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 flex-1 px-6 flex flex-col justify-between pb-8">
          {children}
        </div>
      </div>
    </div>
  )
}
