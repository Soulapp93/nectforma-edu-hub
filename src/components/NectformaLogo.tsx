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
  const fillColor = variant === 'light' ? 'rgba(255,255,255,0.15)' : 'hsl(var(--primary) / 0.12)';
  const letterNColor = variant === 'light' ? '#ffffff' : 'hsl(var(--primary))';
  const letterFColor = variant === 'light' ? '#ffffff' : 'hsl(var(--primary))';

  const BookIcon = ({ size: s }: { size: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Book cover background - rounded rectangle */}
      <rect
        x="8" y="2" width="32" height="30" rx="3" ry="3"
        fill={fillColor} stroke={strokeColor} strokeWidth="1.8"
      />

      {/* Left page (slightly open, angled left) */}
      <path
        d="M10 34 L10 8 Q10 5 13 5 L24 5 L24 34"
        fill={fillColor} stroke={strokeColor} strokeWidth="1.6"
      />
      {/* Right page (slightly open, angled right) */}
      <path
        d="M38 34 L38 8 Q38 5 35 5 L24 5 L24 34"
        fill={fillColor} stroke={strokeColor} strokeWidth="1.6"
      />

      {/* Open pages flaring out at bottom - left */}
      <path
        d="M10 34 Q6 36 4 40 Q12 35 24 38"
        stroke={strokeColor} strokeWidth="1.6" fill="none" strokeLinecap="round"
      />
      {/* Open pages flaring out at bottom - right */}
      <path
        d="M38 34 Q42 36 44 40 Q36 35 24 38"
        stroke={strokeColor} strokeWidth="1.6" fill="none" strokeLinecap="round"
      />

      {/* Second layer curve (behind) */}
      <path
        d="M8 33 Q5 35 3 38 Q11 33 24 36 Q37 33 45 38 Q43 35 40 33"
        stroke={strokeColor} strokeWidth="1.2" fill="none" opacity="0.4" strokeLinecap="round"
      />

      {/* Text lines on left page */}
      <line x1="13" y1="12" x2="21" y2="12" stroke={strokeColor} strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
      <line x1="13" y1="16" x2="21" y2="16" stroke={strokeColor} strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
      <line x1="13" y1="20" x2="21" y2="20" stroke={strokeColor} strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />

      {/* Text lines on right page */}
      <line x1="27" y1="12" x2="35" y2="12" stroke={strokeColor} strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
      <line x1="27" y1="16" x2="35" y2="16" stroke={strokeColor} strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
      <line x1="27" y1="20" x2="35" y2="20" stroke={strokeColor} strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />

      {/* Letter N */}
      <text
        x="17" y="30"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800" fontSize="10"
        fill={letterNColor} textAnchor="middle"
      >N</text>

      {/* Letter F */}
      <text
        x="31" y="30"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800" fontSize="10"
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
