import React from 'react'

interface DDSLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
}

export const DDSLogo: React.FC<DDSLogoProps> = ({ size = 'lg', showTagline = true }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center select-none">
      {/* Refined Shield with Deep Forest Green & Sage Accent */}
      <div className="relative mb-3 flex items-center justify-center">
        <svg
          className={`${
            size === 'lg' ? 'w-20 h-20' : size === 'md' ? 'w-16 h-16' : 'w-10 h-10'
          } drop-shadow-[0_6px_16px_rgba(18,60,53,0.12)]`}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="ddsShieldGrad" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6F9584" />
              <stop offset="100%" stopColor="#123C35" />
            </linearGradient>

            <linearGradient id="ddsInnerGlow" x1="50" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#EEF2EC" stopOpacity="0.7" />
            </linearGradient>

            <linearGradient id="ddsOrbitGrad" x1="10" y1="50" x2="90" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#DCE8E1" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#6F9584" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="ddsLockGrad" x1="38" y1="36" x2="62" y2="70" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6F9584" />
              <stop offset="100%" stopColor="#123C35" />
            </linearGradient>
          </defs>

          {/* Subtle Orbital Orbit */}
          <ellipse
            cx="50"
            cy="68"
            rx="36"
            ry="9"
            transform="rotate(-12 50 68)"
            stroke="url(#ddsOrbitGrad)"
            strokeWidth="2.5"
            fill="none"
            opacity="0.85"
          />

          {/* Shield Outer Outline */}
          <path
            d="M50 12 L78 24 C78 54 50 82 50 82 C50 82 22 54 22 24 Z"
            fill="#FFFFFF"
            stroke="url(#ddsShieldGrad)"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />

          {/* Inner Shield Facet */}
          <path
            d="M50 20 L70 29 C70 51 50 72 50 72 C50 72 30 51 30 29 Z"
            fill="url(#ddsInnerGlow)"
            opacity="0.95"
          />

          {/* Center Padlock Mechanism */}
          {/* Shackle */}
          <path
            d="M42 44 V37 C42 32.5 45.5 29 50 29 C54.5 29 58 32.5 58 37 V44"
            stroke="url(#ddsLockGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Lock Body */}
          <rect
            x="37"
            y="43"
            width="26"
            height="22"
            rx="6"
            fill="url(#ddsLockGrad)"
          />

          {/* Keyhole */}
          <circle cx="50" cy="51" r="2.8" fill="#FFFFFF" />
          <polygon points="48.5,52 51.5,52 52,58 48,58" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Brand Title: DDS */}
      <h1 className="text-3xl font-extrabold text-[#102F2A] tracking-wider leading-none font-sans">
        DDS
      </h1>

      {/* Tagline: Secure. Verify. Trust. */}
      {showTagline && (
        <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wide">
          <span className="text-[#102F2A]">Secure.</span>
          <span className="text-[#6F9584]">Verify.</span>
          <span className="text-[#123C35]">Trust.</span>
        </div>
      )}
    </div>
  )
}
