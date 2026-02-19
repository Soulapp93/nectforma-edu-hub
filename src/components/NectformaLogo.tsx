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
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* === BACK BOOK LAYER (3rd/outermost) === */}
      {/* Left back cover */}
      <path
        d="M20 75 L20 20 Q20 14 26 12 L56 8 Q60 7 60 12 L60 75"
        stroke={strokeColor} strokeWidth="2" fill="none" opacity="0.35"
      />
      {/* Right back cover */}
      <path
        d="M100 75 L100 20 Q100 14 94 12 L64 8 Q60 7 60 12 L60 75"
        stroke={strokeColor} strokeWidth="2" fill="none" opacity="0.35"
      />
      {/* Back bottom curves */}
      <path
        d="M20 75 Q30 70 40 72 Q50 74 60 78 Q70 74 80 72 Q90 70 100 75"
        stroke={strokeColor} strokeWidth="2" fill="none" opacity="0.35"
      />

      {/* === MIDDLE BOOK LAYER (2nd) === */}
      {/* Left middle page */}
      <path
        d="M16 78 L16 24 Q16 17 23 15 L56 10 Q60 9 60 14 L60 78"
        stroke={strokeColor} strokeWidth="2" fill="none" opacity="0.55"
      />
      {/* Right middle page */}
      <path
        d="M104 78 L104 24 Q104 17 97 15 L64 10 Q60 9 60 14 L60 78"
        stroke={strokeColor} strokeWidth="2" fill="none" opacity="0.55"
      />
      {/* Middle bottom curves */}
      <path
        d="M16 78 Q28 72 40 74 Q50 77 60 82 Q70 77 80 74 Q92 72 104 78"
        stroke={strokeColor} strokeWidth="2" fill="none" opacity="0.55"
      />

      {/* === FRONT BOOK LAYER (main/foreground) === */}
      {/* Left front page */}
      <path
        d="M12 82 L12 28 Q12 20 20 18 L56 12 Q60 11 60 16 L60 82"
        stroke={strokeColor} strokeWidth="2.5" fill="none"
      />
      {/* Right front page */}
      <path
        d="M108 82 L108 28 Q108 20 100 18 L64 12 Q60 11 60 16 L60 82"
        stroke={strokeColor} strokeWidth="2.5" fill="none"
      />
      {/* Front bottom curves - wide open pages flaring */}
      <path
        d="M12 82 Q24 74 38 76 Q50 80 60 86 Q70 80 82 76 Q96 74 108 82"
        stroke={strokeColor} strokeWidth="2.5" fill="none"
      />

      {/* Extra bottom curve for depth */}
      <path
        d="M8 84 Q22 76 38 78 Q50 82 60 88 Q70 82 82 78 Q98 76 112 84"
        stroke={strokeColor} strokeWidth="1.8" fill="none" opacity="0.3"
      />

      {/* Page lines left side */}
      <line x1="24" y1="34" x2="50" y2="28" stroke={strokeColor} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <line x1="24" y1="40" x2="50" y2="34" stroke={strokeColor} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <line x1="24" y1="46" x2="50" y2="40" stroke={strokeColor} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />

      {/* Page lines right side */}
      <line x1="70" y1="28" x2="96" y2="34" stroke={strokeColor} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <line x1="70" y1="34" x2="96" y2="40" stroke={strokeColor} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <line x1="70" y1="40" x2="96" y2="46" stroke={strokeColor} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />

      {/* Spine center line */}
      <line x1="60" y1="16" x2="60" y2="82" stroke={strokeColor} strokeWidth="1.5" opacity="0.2" />

      {/* Letter N on left page */}
      <text
        x="40" y="66"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800" fontSize="22"
        fill={letterNColor} textAnchor="middle"
      >N</text>

      {/* Letter F on right page */}
      <text
        x="80" y="66"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800" fontSize="22"
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
