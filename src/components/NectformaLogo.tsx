import React from 'react';
import { Link } from 'react-router-dom';

interface NectformaLogoProps {
  variant?: 'light' | 'dark' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  linkTo?: string;
  className?: string;
}

const BookIcon: React.FC<{ size: string; variant: string }> = ({ size, variant }) => {
  const sizeMap: Record<string, number> = { sm: 28, md: 34, lg: 42, xl: 52, '2xl': 120 };
  const s = sizeMap[size] || 34;

  return (
    <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Blue gradient for left page */}
        <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E88E5" />
          <stop offset="50%" stopColor="#1565C0" />
          <stop offset="100%" stopColor="#0D47A1" />
        </linearGradient>
        {/* Green gradient for right page */}
        <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#43A047" />
          <stop offset="50%" stopColor="#2E7D32" />
          <stop offset="100%" stopColor="#1B5E20" />
        </linearGradient>
        {/* Shine overlay */}
        <linearGradient id="shine" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        {/* Shadow */}
        <filter id="bookShadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.3" />
        </filter>
      </defs>

      <g filter="url(#bookShadow)">
        {/* Left page (blue) */}
        <path d="M6 16 C6 12, 10 10, 14 10 L30 10 C31 10, 32 11, 32 12 L32 50 C32 51, 31 52, 30 52 L10 52 C7 52, 6 50, 6 48 Z" fill="url(#blueGrad)" />
        {/* Left page shine */}
        <path d="M6 16 C6 12, 10 10, 14 10 L30 10 C31 10, 32 11, 32 12 L32 50 C32 51, 31 52, 30 52 L10 52 C7 52, 6 50, 6 48 Z" fill="url(#shine)" />
        {/* Left page curl */}
        <path d="M6 48 C6 50, 7 52, 10 52 L30 52 C28 54, 18 56, 6 54 Z" fill="#0D47A1" opacity="0.5" />

        {/* Right page (green) */}
        <path d="M58 16 C58 12, 54 10, 50 10 L34 10 C33 10, 32 11, 32 12 L32 50 C32 51, 33 52, 34 52 L54 52 C57 52, 58 50, 58 48 Z" fill="url(#greenGrad)" />
        {/* Right page shine */}
        <path d="M58 16 C58 12, 54 10, 50 10 L34 10 C33 10, 32 11, 32 12 L32 34 L44 10 L50 10 C54 10, 58 12, 58 16 Z" fill="white" opacity="0.12" />
        {/* Right page curl */}
        <path d="M58 48 C58 50, 57 52, 54 52 L34 52 C36 54, 46 56, 58 54 Z" fill="#1B5E20" opacity="0.5" />

        {/* Spine */}
        <path d="M31 10 L32 8 L33 10" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />

        {/* Letter N */}
        <text x="18" y="38" textAnchor="middle" fontFamily="'Plus Jakarta Sans', Arial, sans-serif" fontWeight="800" fontSize="18" fill="white" opacity="0.95">N</text>

        {/* Letter F */}
        <text x="46" y="38" textAnchor="middle" fontFamily="'Plus Jakarta Sans', Arial, sans-serif" fontWeight="800" fontSize="18" fill="white" opacity="0.95">F</text>
      </g>
    </svg>
  );
};

const NectformaLogo: React.FC<NectformaLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showIcon = true,
  linkTo,
  className = '',
}) => {
  const textSizeClass = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  }[size];

  const textColorClass = {
    light: 'text-white',
    dark: 'text-foreground',
    gradient: 'bg-gradient-to-r from-[#1565C0] to-[#2E7D32] bg-clip-text text-transparent',
  }[variant];

  const oColorClass = {
    light: 'text-white/70',
    dark: 'text-[#1565C0]',
    gradient: 'text-[#2E7D32]',
  }[variant];

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && <BookIcon size={size} variant={variant} />}
      <span className={`${textSizeClass} font-bold tracking-tight ${textColorClass}`}>
        Nectf<span className={`${oColorClass} font-extrabold`}>o</span>rma
      </span>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
};

export { BookIcon };
export default NectformaLogo;
