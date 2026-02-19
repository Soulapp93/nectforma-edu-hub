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
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Back book layer */}
      <path
        d="M8 48 L8 14 Q8 10 12 10 L28 10 Q32 10 32 14 L32 48"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
      />
      <path
        d="M56 48 L56 14 Q56 10 52 10 L36 10 Q32 10 32 14 L32 48"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
      />

      {/* Front open book */}
      <path
        d="M6 50 L6 18 Q6 14 10 13 L29 11 Q32 11 32 14 L32 50"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M58 50 L58 18 Q58 14 54 13 L35 11 Q32 11 32 14 L32 50"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Page lines left */}
      <line x1="13" y1="22" x2="27" y2="20" stroke={strokeColor} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <line x1="13" y1="28" x2="27" y2="26" stroke={strokeColor} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />

      {/* Page lines right */}
      <line x1="37" y1="20" x2="51" y2="22" stroke={strokeColor} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <line x1="37" y1="26" x2="51" y2="28" stroke={strokeColor} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />

      {/* Bottom curve */}
      <path
        d="M6 50 Q18 46 32 50 Q46 46 58 50"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Letter N */}
      <text
        x="20"
        y="43"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800"
        fontSize="16"
        fill={letterNColor}
        textAnchor="middle"
      >
        N
      </text>

      {/* Letter F */}
      <text
        x="44"
        y="43"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800"
        fontSize="16"
        fill={letterFColor}
        textAnchor="middle"
      >
        F
      </text>
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
