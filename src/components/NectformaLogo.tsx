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

  const strokeColor = variant === 'light' ? '#ffffff' : 'hsl(var(--primary))';
  const letterNColor = variant === 'light' ? '#ffffff' : 'hsl(var(--primary))';
  const letterFColor = variant === 'light' ? '#ffffff' : 'hsl(var(--accent))';

  const BookIcon = ({ size: s }: { size: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 64 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Book cover / back rectangle with rounded top */}
      <rect
        x="12" y="4" width="40" height="36" rx="4"
        stroke={strokeColor} strokeWidth="2.2" fill="none"
      />

      {/* Left page */}
      <path
        d="M16 42 L16 14 Q16 10 20 10 L32 10 L32 42"
        stroke={strokeColor} strokeWidth="2" fill="none"
      />
      {/* Right page */}
      <path
        d="M48 42 L48 14 Q48 10 44 10 L32 10 L32 42"
        stroke={strokeColor} strokeWidth="2" fill="none"
      />

      {/* Open pages flaring out - left */}
      <path
        d="M16 42 Q10 44 6 48 Q18 42 32 46"
        stroke={strokeColor} strokeWidth="2" fill="none" strokeLinecap="round"
      />
      {/* Open pages flaring out - right */}
      <path
        d="M48 42 Q54 44 58 48 Q46 42 32 46"
        stroke={strokeColor} strokeWidth="2" fill="none" strokeLinecap="round"
      />

      {/* Second curve layer */}
      <path
        d="M14 40 Q8 42 4 46 Q16 40 32 44 Q48 40 60 46 Q56 42 50 40"
        stroke={strokeColor} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.5"
      />

      {/* Page lines left */}
      <line x1="20" y1="18" x2="29" y2="18" stroke={strokeColor} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <line x1="20" y1="22" x2="29" y2="22" stroke={strokeColor} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <line x1="20" y1="26" x2="29" y2="26" stroke={strokeColor} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />

      {/* Page lines right */}
      <line x1="35" y1="18" x2="44" y2="18" stroke={strokeColor} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <line x1="35" y1="22" x2="44" y2="22" stroke={strokeColor} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <line x1="35" y1="26" x2="44" y2="26" stroke={strokeColor} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />

      {/* Letter N */}
      <text
        x="25" y="37"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800" fontSize="12"
        fill={letterNColor} textAnchor="middle"
      >N</text>

      {/* Letter F */}
      <text
        x="39" y="37"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800" fontSize="12"
        fill={letterFColor} textAnchor="middle"
      >F</text>
    </svg>
  );

  const content = (
    <div className={`flex items-center ${config.gap} ${className}`}>
      {showIcon && <BookIcon size={config.icon} />}
      <span className={`${config.text} font-bold tracking-tight ${textColorClass}`}>
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
