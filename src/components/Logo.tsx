import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'horizontal';
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  themeMode?: 'light' | 'dark' | 'auto';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  themeMode = 'auto',
  showSubtitle = true,
}) => {
  // Determine pixel height based on size prop
  let height = 40;
  if (typeof size === 'number') {
    height = size;
  } else {
    switch (size) {
      case 'sm':
        height = variant === 'icon' ? 24 : 32;
        break;
      case 'md':
        height = variant === 'icon' ? 36 : 48;
        break;
      case 'lg':
        height = variant === 'icon' ? 56 : 72;
        break;
      case 'xl':
        height = variant === 'icon' ? 80 : 100;
        break;
    }
  }

  // Text colors based on theme override or default dark/light context
  const darkTextColor = themeMode === 'light' ? '#0B2545' : '#FFFFFF';
  const subTextColor = themeMode === 'light' ? '#475569' : '#94A3B8';

  if (variant === 'icon') {
    return (
      <svg
        width={height}
        height={height}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block ${className}`}
        aria-label="E-ACCESS WEB Icon"
      >
        <defs>
          <linearGradient id="eGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B2545" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          <linearGradient id="aGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>

          <linearGradient id="stethGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0369A1" />
            <stop offset="50%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Letter E */}
        <path
          d="M 42 58 L 92 58 L 92 78 L 66 78 L 66 94 L 88 94 L 88 114 L 66 114 L 66 132 L 94 132 L 94 152 L 42 152 Z"
          fill="url(#eGrad)"
        />

        {/* Letter A */}
        <path
          d="M 120 48 L 148 48 L 178 152 L 154 152 L 146 126 L 122 126 L 114 152 L 90 152 Z M 134 76 L 126 108 L 142 108 Z"
          fill="url(#aGrad)"
        />

        {/* Doctor Mortarboard / Academic Cap on top of 'A' */}
        <path
          d="M 134 22 L 168 34 L 134 46 L 100 34 Z"
          fill="#0F172A"
        />
        <path
          d="M 116 41 L 116 52 C 116 55, 152 55, 152 52 L 152 41"
          fill="#1E293B"
        />
        {/* Cap Tassel */}
        <path
          d="M 158 35 L 164 48 L 162 56"
          stroke="#0EA5E9"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="162" cy="57" r="2" fill="#38BDF8" />

        {/* Stethoscope Tubing & Earpieces */}
        {/* Earpieces near top left of E */}
        <circle cx="34" cy="42" r="4" fill="#0284C7" />
        <circle cx="48" cy="42" r="4" fill="#0284C7" />
        <path
          d="M 34 42 C 34 52, 42 62, 42 72"
          stroke="url(#stethGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 48 42 C 48 52, 42 62, 42 72"
          stroke="url(#stethGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Main Stethoscope Tube Sweeping under EA */}
        <path
          d="M 42 72 C 30 110, 40 170, 100 174 C 150 178, 180 148, 172 120"
          stroke="url(#stethGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Stethoscope Diaphragm / Chest Piece on right */}
        <circle cx="172" cy="116" r="12" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2.5" />
        <circle cx="172" cy="116" r="6" fill="#0B2545" />

        {/* ECG / Heartbeat Line crossing 'A' */}
        <path
          d="M 96 112 L 116 112 L 122 96 L 128 126 L 134 102 L 140 116 L 146 112 L 168 112"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#glow)"
        />
      </svg>
    );
  }

  // Full Horizontal / Stacked Logo with typography
  return (
    <div className={`inline-flex items-center space-x-3 select-none ${className}`}>
      {/* Icon Graphic */}
      <svg
        width={height}
        height={height}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="eGradFull" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B2545" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          <linearGradient id="aGradFull" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>

          <linearGradient id="stethGradFull" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0369A1" />
            <stop offset="50%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          <filter id="glowFull" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Letter E */}
        <path
          d="M 42 58 L 92 58 L 92 78 L 66 78 L 66 94 L 88 94 L 88 114 L 66 114 L 66 132 L 94 132 L 94 152 L 42 152 Z"
          fill="url(#eGradFull)"
        />

        {/* Letter A */}
        <path
          d="M 120 48 L 148 48 L 178 152 L 154 152 L 146 126 L 122 126 L 114 152 L 90 152 Z M 134 76 L 126 108 L 142 108 Z"
          fill="url(#aGradFull)"
        />

        {/* Mortarboard Cap */}
        <path d="M 134 22 L 168 34 L 134 46 L 100 34 Z" fill="#0F172A" />
        <path d="M 116 41 L 116 52 C 116 55, 152 55, 152 52 L 152 41" fill="#1E293B" />
        <path d="M 158 35 L 164 48 L 162 56" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="162" cy="57" r="2" fill="#38BDF8" />

        {/* Stethoscope */}
        <circle cx="34" cy="42" r="4" fill="#0284C7" />
        <circle cx="48" cy="42" r="4" fill="#0284C7" />
        <path d="M 34 42 C 34 52, 42 62, 42 72" stroke="url(#stethGradFull)" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M 48 42 C 48 52, 42 62, 42 72" stroke="url(#stethGradFull)" strokeWidth="4" strokeLinecap="round" fill="none" />

        <path
          d="M 42 72 C 30 110, 40 170, 100 174 C 150 178, 180 148, 172 120"
          stroke="url(#stethGradFull)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        <circle cx="172" cy="116" r="12" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2.5" />
        <circle cx="172" cy="116" r="6" fill="#0B2545" />

        {/* ECG Pulse */}
        <path
          d="M 96 112 L 116 112 L 122 96 L 128 126 L 134 102 L 140 116 L 146 112 L 168 112"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#glowFull)"
        />
      </svg>

      {/* Typography Column */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center font-extrabold tracking-tight" style={{ fontSize: `${height * 0.45}px` }}>
          <span
            className="logo-title text-slate-900 dark:text-white transition-colors"
            style={themeMode === 'light' ? { color: '#0B2545' } : themeMode === 'dark' ? { color: '#FFFFFF' } : undefined}
          >
            E-ACCESS
          </span>
          <span className="text-sky-500 ml-1.5 font-black">WEB</span>
        </div>

        {showSubtitle && (
          <div
            className="font-bold uppercase tracking-wider mt-1 flex items-center space-x-1 text-slate-500 dark:text-slate-400"
            style={{
              fontSize: `${Math.max(10, height * 0.22)}px`,
              color: themeMode === 'light' ? '#475569' : themeMode === 'dark' ? '#94A3B8' : undefined
            }}
          >
            <span className="w-3 h-0.5 bg-sky-500/60 rounded-full inline-block"></span>
            <span>Medical Software Solutions</span>
            <span className="w-3 h-0.5 bg-sky-500/60 rounded-full inline-block"></span>
          </div>
        )}
      </div>
    </div>
  );
};
