import React from 'react'

export const SecurityIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-[280px] h-[210px] mx-auto flex items-center justify-center select-none my-2">
      <svg
        className="w-full h-full"
        viewBox="0 0 300 230"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Backdrop Soft Warm Sage Gradient */}
          <linearGradient id="cloudBackdrop" x1="150" y1="20" x2="150" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EEF2EC" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#DCE8E1" stopOpacity="0.5" />
          </linearGradient>

          {/* Shield Inside Phone Gradient */}
          <linearGradient id="phoneShieldGrad" x1="150" y1="65" x2="150" y2="125" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EEF2EC" />
            <stop offset="100%" stopColor="#DCE8E1" />
          </linearGradient>

          {/* Forest Green Button/Badge Gradient */}
          <linearGradient id="checkBadgeGrad" x1="190" y1="150" x2="210" y2="175" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6F9584" />
            <stop offset="100%" stopColor="#123C35" />
          </linearGradient>
        </defs>

        {/* 1. Background Soft Silhouette */}
        <path
          d="M 60 140 C 40 80, 100 20, 170 30 C 230 40, 270 90, 250 160 C 230 210, 120 220, 60 140 Z"
          fill="url(#cloudBackdrop)"
        />

        {/* 2. Dotted Matrix */}
        <g opacity="0.6">
          {[220, 232, 244].map((x) =>
            [140, 150, 160, 170].map((y) => (
              <circle key={`dot-${x}-${y}`} cx={x} cy={y} r="1.5" fill="#6F9584" />
            ))
          )}
        </g>

        {/* 3. Curved Dashed Trajectory Lines */}
        <path
          d="M 75 125 C 65 80, 100 50, 130 50"
          stroke="#D8E0DA"
          strokeWidth="1.2"
          strokeDasharray="3 3"
          fill="none"
        />
        <path
          d="M 170 50 C 210 50, 230 80, 230 110"
          stroke="#D8E0DA"
          strokeWidth="1.2"
          strokeDasharray="3 3"
          fill="none"
        />

        {/* 4. Bottom Left Stylized Leaves */}
        <path
          d="M 90 190 C 80 170, 95 155, 105 160 C 105 175, 95 185, 90 190 Z"
          fill="#DCE8E1"
          opacity="0.8"
        />
        <path
          d="M 98 188 C 85 180, 88 165, 98 170 C 100 180, 98 185, 98 188 Z"
          fill="#6F9584"
          opacity="0.7"
        />
        <path
          d="M 108 190 C 100 178, 110 168, 118 172 C 118 182, 112 188, 108 190 Z"
          fill="#123C35"
          opacity="0.6"
        />
        <path d="M 85 190 L 115 175" stroke="#6F9584" strokeWidth="1.2" />

        {/* 5. Central Smartphone Device */}
        <rect
          x="108"
          y="40"
          width="84"
          height="145"
          rx="18"
          fill="#FFFFFF"
          stroke="#D8E0DA"
          strokeWidth="2"
        />

        {/* Phone Notch */}
        <path
          d="M 134 40 L 166 40 C 166 44 163 47 160 47 L 140 47 C 137 47 134 44 134 40 Z"
          fill="#EEF2EC"
        />

        {/* Shield Inside Smartphone */}
        <path
          d="M 150 66 L 170 75 C 170 95, 150 115, 150 115 C 150 115, 130 95, 130 75 Z"
          fill="url(#phoneShieldGrad)"
        />

        {/* Checkmark inside Shield */}
        <path
          d="M 143 90 L 148 95 L 158 83"
          stroke="#123C35"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* OTP Dots Box inside phone screen */}
        <rect
          x="120"
          y="125"
          width="60"
          height="16"
          rx="8"
          fill="#F7F8F3"
          stroke="#D8E0DA"
          strokeWidth="1"
        />
        <circle cx="130" cy="133" r="2.2" fill="#123C35" />
        <circle cx="138" cy="133" r="2.2" fill="#123C35" />
        <circle cx="146" cy="133" r="2.2" fill="#123C35" />
        <circle cx="154" cy="133" r="2.2" fill="#123C35" />
        <circle cx="162" cy="133" r="2.2" fill="#123C35" />
        <circle cx="170" cy="133" r="2.2" fill="#123C35" />

        {/* Bottom Platform/Stand */}
        <ellipse cx="150" cy="188" rx="90" ry="4" fill="#D8E0DA" opacity="0.6" />

        {/* 6. Floating Left Padlock Bubble */}
        <g transform="translate(62, 90)">
          <circle cx="12" cy="12" r="12" fill="#FFFFFF" stroke="#D8E0DA" strokeWidth="1.2" />
          <path
            d="M 9 11 V 8.5 C 9 6.8 10.3 5.5 12 5.5 C 13.7 5.5 15 6.8 15 8.5 V 11"
            stroke="#123C35"
            strokeWidth="1.4"
            fill="none"
          />
          <rect x="7.5" y="10.5" width="9" height="7" rx="2" fill="#123C35" />
          <circle cx="12" cy="14" r="1" fill="#FFFFFF" />
        </g>

        {/* 7. Floating Top-Right Paper Airplane */}
        <g transform="translate(218, 48)">
          <path
            d="M 2 12 L 18 2 L 12 18 L 9 13 Z"
            fill="#6F9584"
          />
          <path
            d="M 18 2 L 9 13 L 8 18 Z"
            fill="#123C35"
          />
        </g>

        {/* 8. Floating User Avatar Bubble on Right */}
        <g transform="translate(200, 110)">
          <circle cx="10" cy="10" r="10" fill="#FFFFFF" stroke="#D8E0DA" strokeWidth="1.2" />
          <circle cx="10" cy="8" r="3" fill="#6F9584" />
          <path d="M 5 16 C 5 13 7.5 12 10 12 C 12.5 12 15 13 15 16" fill="#6F9584" />
        </g>

        {/* 9. Floating Checkmark Badge on Bottom-Right of Phone */}
        <g transform="translate(182, 148)">
          <circle cx="12" cy="12" r="12" fill="url(#checkBadgeGrad)" />
          <path
            d="M 8 12 L 11 15 L 16 9"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  )
}
