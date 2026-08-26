import React from 'react'

export const BackgroundDecorations: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Subtle organic gradient glows */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#DCE8E1]/50 rounded-full blur-3xl" />
      <div className="absolute top-1/2 -left-28 w-60 h-60 bg-[#EEF2EC]/80 rounded-full blur-2xl" />
      <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-[#DCE8E1]/30 rounded-full blur-3xl" />
    </div>
  )
}
