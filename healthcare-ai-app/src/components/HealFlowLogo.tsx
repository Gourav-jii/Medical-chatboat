interface HealFlowLogoProps {
  className?: string
  iconSize?: string
  textSize?: string
  showText?: boolean
  lightMode?: boolean
}

export default function HealFlowLogo({
  className = '',
  iconSize = 'h-5 w-5',
  textSize = 'text-base sm:text-lg',
  showText = true,
  lightMode = false
}: HealFlowLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105 ${
        lightMode 
          ? 'bg-white shadow-md' 
          : 'bg-gradient-to-br from-blue-600 to-emerald-500 shadow-blue-200/55'
      }`}>
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Heart shape container filled with gradient */}
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill={lightMode ? 'url(#healflow-grad-light)' : 'url(#healflow-grad-dark)'}
          />
          {/* EKG pulse line */}
          <path
            d="M7 12h2.5l1.5-3 2 6 1.5-4 1 2.5h2.5"
            stroke={lightMode ? '#2563eb' : '#ffffff'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="healflow-grad-dark" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" />
              <stop offset="1" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="healflow-grad-light" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2563eb" />
              <stop offset="1" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {showText && (
        <div className="text-left leading-tight">
          <p className={`font-black tracking-tight ${lightMode ? 'text-white' : 'text-slate-900'} ${textSize}`}>
            HealFlow
          </p>
          <p className={`text-[10px] font-medium tracking-wide ${lightMode ? 'text-blue-100' : 'text-slate-500'}`}>
            Reassuring Care Companion
          </p>
        </div>
      )}
    </div>
  )
}
