// src/components/DuckLogo.tsx
interface DuckLogoProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

export function DuckLogo({ className = "", size = 24, animate = false }: DuckLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animate ? 'animate-bob' : ''}`}
    >
      {/* Glow effect */}
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="duckGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>
      
      {/* Duck body */}
      <ellipse
        cx="32"
        cy="38"
        rx="20"
        ry="16"
        fill="url(#duckGradient)"
        filter="url(#glow)"
      />
      
      {/* Duck head */}
      <circle cx="44" cy="22" r="12" fill="url(#duckGradient)" />
      
      {/* Duck eye */}
      <circle cx="48" cy="20" r="3" fill="#1a1a2e" />
      <circle cx="49" cy="19" r="1" fill="white" />
      
      {/* Duck beak */}
      <path
        d="M52 24 L62 26 L52 30 Z"
        fill="#FF6B35"
      />
      
      {/* Wing detail */}
      <path
        d="M22 34 Q28 28 38 32 Q32 36 22 34"
        fill="#E5A000"
        opacity="0.7"
      />
      
      {/* Tail feathers */}
      <path
        d="M12 38 L6 32 L10 38 L4 36 L10 40 L6 42 L12 40"
        stroke="#FFD700"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DuckIcon({ className = "", size = 20 }: DuckLogoProps) {
  // Simpler duck icon for smaller uses
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="duckIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>
      
      {/* Body */}
      <ellipse cx="10" cy="15" rx="8" ry="6" fill="url(#duckIconGradient)" />
      
      {/* Head */}
      <circle cx="16" cy="8" r="5" fill="url(#duckIconGradient)" />
      
      {/* Eye */}
      <circle cx="18" cy="7" r="1.2" fill="#1a1a2e" />
      
      {/* Beak */}
      <path d="M20 9 L24 10 L20 12 Z" fill="#FF6B35" />
    </svg>
  );
}

// Large hero duck mascot for landing page
export function HeroDuck({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Glow background */}
      <div className="absolute inset-0 blur-3xl bg-gradient-to-br from-yellow-400/30 to-orange-500/20 rounded-full" />
      
      <svg
        width="280"
        height="280"
        viewBox="0 0 280 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 animate-bob drop-shadow-2xl"
      >
        <defs>
          <filter id="heroGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFC107" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
          <linearGradient id="heroGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E5A000" />
            <stop offset="100%" stopColor="#CC5500" />
          </linearGradient>
          <radialGradient id="eyeShine" cx="30%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#1a1a2e" />
          </radialGradient>
        </defs>
        
        {/* Shadow */}
        <ellipse cx="140" cy="260" rx="60" ry="12" fill="#000" opacity="0.2" />
        
        {/* Body */}
        <ellipse
          cx="140"
          cy="175"
          rx="85"
          ry="65"
          fill="url(#heroGradient)"
          filter="url(#heroGlow)"
        />
        
        {/* Body highlight */}
        <ellipse
          cx="130"
          cy="160"
          rx="50"
          ry="35"
          fill="#FFE44D"
          opacity="0.3"
        />
        
        {/* Wing */}
        <path
          d="M80 165 Q100 130 150 150 Q120 175 80 165"
          fill="url(#heroGradientDark)"
          opacity="0.6"
        />
        
        {/* Tail feathers */}
        <path
          d="M55 175 L25 140 L45 170 L15 150 L42 178 L20 165 L50 182"
          stroke="#FFD700"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Neck */}
        <ellipse cx="190" cy="130" rx="35" ry="45" fill="url(#heroGradient)" />
        
        {/* Head */}
        <circle cx="200" cy="85" r="50" fill="url(#heroGradient)" />
        
        {/* Head highlight */}
        <circle cx="185" cy="70" r="25" fill="#FFE44D" opacity="0.3" />
        
        {/* Eye white */}
        <ellipse cx="218" cy="75" rx="18" ry="20" fill="#FFFFFF" />
        
        {/* Eye pupil */}
        <circle cx="222" cy="75" r="12" fill="#1a1a2e" />
        
        {/* Eye shine */}
        <circle cx="226" cy="70" r="5" fill="white" />
        <circle cx="218" cy="82" r="2" fill="white" opacity="0.5" />
        
        {/* Eyebrow (confident) */}
        <path
          d="M200 55 Q220 48 238 58"
          stroke="#CC5500"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Beak */}
        <path
          d="M240 90 L280 95 L240 115 Z"
          fill="#FF6B35"
        />
        <path
          d="M240 90 L280 95 L260 95"
          fill="#FF8C55"
        />
        
        {/* Cheek blush */}
        <circle cx="230" cy="100" r="8" fill="#FF6B35" opacity="0.3" />
        
        {/* Crown/sparkles around duck */}
        <g className="animate-sparkle">
          <path d="M100 50 L105 60 L115 55 L108 65 L118 70 L105 70 L100 80 L95 70 L82 70 L92 65 L85 55 L95 60 Z" fill="#FFD700" opacity="0.8" />
        </g>
        <g className="animate-twinkle" style={{ animationDelay: '0.5s' }}>
          <circle cx="60" cy="100" r="4" fill="#FFD700" />
        </g>
        <g className="animate-twinkle" style={{ animationDelay: '1s' }}>
          <circle cx="250" cy="40" r="3" fill="#FFD700" />
        </g>
        <g className="animate-twinkle" style={{ animationDelay: '1.5s' }}>
          <circle cx="40" cy="180" r="3" fill="#F97316" />
        </g>
      </svg>
    </div>
  );
}

