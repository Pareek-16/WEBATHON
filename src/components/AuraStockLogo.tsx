import React from 'react';

interface AuraStockLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  variant?: 'light' | 'dark' | 'auto';
}

export const AuraStockLogo: React.FC<AuraStockLogoProps> = ({
  size = 36,
  showText = true,
  className = '',
  variant = 'auto',
}) => {
  return (
    <div className={`aurastock-brand ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, userSelect: 'none' }}>
      {/* Precision recreation of the Aurastock gradient "A" symbol with star cutout */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 4px 12px rgba(168, 85, 247, 0.45))' }}
      >
        <defs>
          <linearGradient id="auraGrad1" x1="10%" y1="90%" x2="90%" y2="10%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="45%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#E879F9" />
          </linearGradient>
          <linearGradient id="auraGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="60%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
          <linearGradient id="auraGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F472B6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Outer stylized rounded A loop */}
        <path
          d="M20 78 C 14 78, 11 72, 14 66 L 42 16 C 45 10, 55 10, 58 16 L 86 66 C 89 72, 86 78, 80 78 C 74 78, 71 73, 68 67 L 50 33 L 32 67 C 29 73, 26 78, 20 78 Z"
          fill="url(#auraGrad1)"
        />

        {/* Inner glowing fold / dimensional overlay */}
        <path
          d="M42 16 C 45 10, 55 10, 58 16 L 86 66 C 88 70, 86 76, 81 77 C 76 78, 72 74, 69 68 L 50 33 C 45 38, 38 48, 34 56 C 40 45, 46 36, 50 30 Z"
          fill="url(#auraGrad2)"
          opacity="0.9"
        />

        {/* Four-point star cutout in the lower triangle */}
        <path
          d="M50 49 Q 50 59 40 59 Q 50 59 50 69 Q 50 59 60 59 Q 50 59 50 49 Z"
          fill="#FFFFFF"
          filter="drop-shadow(0 0 6px rgba(255, 255, 255, 0.9))"
        />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span
            style={{
              fontSize: size * 0.58,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              background: 'linear-gradient(135deg, #FFFFFF 30%, #E9D5FF 70%, #C084FC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: variant === 'light' ? '#1E1B4B' : 'transparent',
              fontFamily: '"Helvetica Neue", Helvetica, -apple-system, sans-serif',
              textShadow: variant === 'light' ? 'none' : '0 2px 14px rgba(192, 132, 252, 0.35)',
            }}
            className="aurastock-title"
          >
            Aurastock
          </span>
          <span
            style={{
              fontSize: size * 0.26,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted, #9490B8)',
              marginTop: 2,
            }}
          >
            AI Inventory Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
