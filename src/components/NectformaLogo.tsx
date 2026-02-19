import React from 'react';
import { Link } from 'react-router-dom';

interface NectformaLogoProps {
  variant?: 'light' | 'dark' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  linkTo?: string;
  className?: string;
}

const NectformaLogo: React.FC<NectformaLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showIcon = true,
  linkTo,
  className = '',
}) => {
  const sizeConfig = {
    sm: { icon: 28, text: 'text-sm', gap: 'gap-1.5' },
    md: { icon: 34, text: 'text-lg', gap: 'gap-2' },
    lg: { icon: 42, text: 'text-xl', gap: 'gap-2.5' },
    xl: { icon: 52, text: 'text-2xl', gap: 'gap-3' },
  };

  const config = sizeConfig[size];

  const textColorClass = {
    light: 'text-white',
    dark: 'text-foreground',
    gradient: 'bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent',
  }[variant];

  const oColorClass = {
    light: 'text-white/70',
    dark: 'text-primary',
    gradient: 'text-primary',
  }[variant];

  const isLight = variant === 'light';

  const gradientId = `logo-grad-${Math.random().toString(36).slice(2, 8)}`;
  const gradientId2 = `logo-grad2-${Math.random().toString(36).slice(2, 8)}`;
  const gradientId3 = `logo-grad3-${Math.random().toString(36).slice(2, 8)}`;

  const LogoIcon = ({ size: s }: { size: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 64 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <defs>
        {/* Main purple-pink gradient */}
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={variant === 'light' ? '#e0b0ff' : '#c084fc'} />
          <stop offset="50%" stopColor={variant === 'light' ? '#d946ef' : '#a855f7'} />
          <stop offset="100%" stopColor={variant === 'light' ? '#f472b6' : '#ec4899'} />
        </linearGradient>
        {/* Cap top gradient */}
        <linearGradient id={gradientId2} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={variant === 'light' ? '#f9a8d4' : '#f472b6'} />
          <stop offset="100%" stopColor={variant === 'light' ? '#c084fc' : '#a855f7'} />
        </linearGradient>
        {/* Book gradient */}
        <linearGradient id={gradientId3} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={variant === 'light' ? '#d8b4fe' : '#a855f7'} />
          <stop offset="60%" stopColor={variant === 'light' ? '#818cf8' : '#7c3aed'} />
          <stop offset="100%" stopColor={variant === 'light' ? '#6366f1' : '#6d28d9'} />
        </linearGradient>
      </defs>

      {/* === GRADUATION CAP === */}
      {/* Cap board (diamond/rhombus shape) */}
      <polygon
        points="32,4 58,18 32,28 6,18"
        fill={`url(#${gradientId2})`}
        stroke={variant === 'light' ? 'rgba(255,255,255,0.3)' : 'none'}
        strokeWidth="0.5"
      />
      {/* Cap underside shadow */}
      <polygon
        points="32,28 58,18 58,20 32,30 6,20 6,18"
        fill={variant === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.25)'}
      />

      {/* === CIRCLE HEAD === */}
      <circle
        cx="32" cy="34" r="11"
        fill={`url(#${gradientId})`}
      />

      {/* === TASSEL === */}
      <line x1="50" y1="18" x2="54" y2="28" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" />
      <circle cx="54" cy="30" r="2.5" fill={`url(#${gradientId})`} />

      {/* === OPEN BOOK === */}
      {/* Left page */}
      <path
        d="M6 56 Q6 50 16 50 Q24 50 32 54 L32 66 Q24 62 16 62 Q6 62 6 56 Z"
        fill={`url(#${gradientId3})`}
        opacity="0.9"
      />
      {/* Right page */}
      <path
        d="M58 56 Q58 50 48 50 Q40 50 32 54 L32 66 Q40 62 48 62 Q58 62 58 56 Z"
        fill={`url(#${gradientId3})`}
        opacity="0.75"
      />
      {/* Book spine highlight */}
      <line x1="32" y1="54" x2="32" y2="66" stroke={variant === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'} strokeWidth="1" />
    </svg>
  );

  const content = (
    <div className={`flex flex-col items-center ${className}`}>
      {showIcon && <LogoIcon size={config.icon} />}
      <span className={`${config.text} font-bold tracking-tight ${textColorClass} mt-1`}>
        Nectf<span className={`${oColorClass} font-extrabold`}>o</span>rma
      </span>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
};

export default NectformaLogo;
