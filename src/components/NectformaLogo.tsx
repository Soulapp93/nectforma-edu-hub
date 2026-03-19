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
    sm: { icon: 28, text: 'text-sm', gap: 'gap-1.5', subtitle: 'text-[8px]' },
    md: { icon: 34, text: 'text-lg', gap: 'gap-2', subtitle: 'text-[9px]' },
    lg: { icon: 42, text: 'text-xl', gap: 'gap-2.5', subtitle: 'text-[10px]' },
    xl: { icon: 52, text: 'text-2xl', gap: 'gap-3', subtitle: 'text-[11px]' },
  };

  const config = sizeConfig[size];

  const textColorClass = {
    light: 'text-white',
    dark: 'text-foreground',
    gradient: 'bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent',
  }[variant];

  const isLight = variant === 'light';

  const gradientId = `logo-grad-${Math.random().toString(36).slice(2, 8)}`;

  // Shield + graduation cap icon inspired by PCA PREAD
  const LogoIcon = ({ size: s }: { size: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={isLight ? '#FFC107' : '#1a1a5e'} />
          <stop offset="100%" stopColor={isLight ? '#FF9800' : '#2d2d8a'} />
        </linearGradient>
      </defs>
      {/* Shield background */}
      <path
        d="M32 4 L56 14 V32 C56 46 45 56 32 60 C19 56 8 46 8 32 V14 L32 4Z"
        fill={`url(#${gradientId})`}
        opacity="0.95"
      />
      {/* Graduation cap */}
      <polygon
        points="32,18 48,26 32,32 16,26"
        fill={isLight ? '#1a1a5e' : '#FFC107'}
        opacity="0.9"
      />
      {/* Cap underside */}
      <polygon
        points="32,32 48,26 48,28 32,34 16,28 16,26"
        fill={isLight ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'}
      />
      {/* Book */}
      <path
        d="M18 42 Q18 38 24 38 Q28 38 32 40 L32 48 Q28 46 24 46 Q18 46 18 42 Z"
        fill={isLight ? '#1a1a5e' : '#FFC107'}
        opacity="0.7"
      />
      <path
        d="M46 42 Q46 38 40 38 Q36 38 32 40 L32 48 Q36 46 40 46 Q46 46 46 42 Z"
        fill={isLight ? '#1a1a5e' : '#FFC107'}
        opacity="0.55"
      />
      {/* Tassel */}
      <line x1="44" y1="26" x2="48" y2="34" stroke={isLight ? '#1a1a5e' : '#FFC107'} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="48" cy="35" r="2" fill={isLight ? '#1a1a5e' : '#FFC107'} />
    </svg>
  );

  const content = (
    <div className={`flex flex-col items-center ${className}`}>
      {showIcon && <LogoIcon size={config.icon} />}
      <span className={`${config.text} font-extrabold tracking-tight ${textColorClass} mt-0.5`}>
        Nectforma
      </span>
      {size !== 'sm' && (
        <span className={`${config.subtitle} font-semibold tracking-[0.2em] uppercase ${isLight ? 'text-white/50' : 'text-muted-foreground'}`}>
          ERP Éducation
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
};

export default NectformaLogo;