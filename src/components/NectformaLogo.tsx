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
      viewBox="0 0 100 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Back book layer (outermost) */}
      <path
        d="M10 70 L10 25 Q10 18 18 16 L46 12 Q50 11 50 16 L50 70"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M90 70 L90 25 Q90 18 82 16 L54 12 Q50 11 50 16 L50 70"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.4"
      />

      {/* Middle book layer */}
      <path
        d="M14 72 L14 28 Q14 22 20 20 L46 15 Q50 14 50 18 L50 72"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M86 72 L86 28 Q86 22 80 20 L54 15 Q50 14 50 18 L50 72"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />

      {/* Front book layer (main) */}
      <path
        d="M18 74 L18 30 Q18 25 24 23 L46 18 Q50 17 50 21 L50 74"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M82 74 L82 30 Q82 25 76 23 L54 18 Q50 17 50 21 L50 74"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Page lines left */}
      <line x1="25" y1="35" x2="44" y2="31" stroke={strokeColor} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
      <line x1="25" y1="41" x2="44" y2="37" stroke={strokeColor} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
      <line x1="25" y1="47" x2="44" y2="43" stroke={strokeColor} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />

      {/* Page lines right */}
      <line x1="56" y1="31" x2="75" y2="35" stroke={strokeColor} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
      <line x1="56" y1="37" x2="75" y2="41" stroke={strokeColor} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
      <line x1="56" y1="43" x2="75" y2="47" stroke={strokeColor} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />

      {/* Bottom curved pages */}
      <path
        d="M18 74 Q34 68 50 74 Q66 68 82 74"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14 72 Q32 66 50 72 Q68 66 86 72"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M10 70 Q30 64 50 70 Q70 64 90 70"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.4"
      />

      {/* Letter N - golden/orange like the mockup */}
      <text
        x="35"
        y="62"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800"
        fontSize="18"
        fill={letterNColor}
        textAnchor="middle"
      >
        N
      </text>

      {/* Letter F */}
      <text
        x="65"
        y="62"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800"
        fontSize="18"
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
