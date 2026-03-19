import React from 'react';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  clickable?: boolean;
  color?: string;
}

const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
  blue: { bg: 'border-l-4 border-l-[hsl(210,90%,60%)]', text: 'text-[hsl(210,90%,60%)]', iconBg: 'bg-[hsl(210,90%,60%)]/10' },
  green: { bg: 'border-l-4 border-l-success', text: 'text-success', iconBg: 'bg-success/10' },
  yellow: { bg: 'border-l-4 border-l-warning', text: 'text-warning', iconBg: 'bg-warning/10' },
  red: { bg: 'border-l-4 border-l-destructive', text: 'text-destructive', iconBg: 'bg-destructive/10' },
  purple: { bg: 'border-l-4 border-l-[hsl(260,60%,55%)]', text: 'text-[hsl(260,60%,55%)]', iconBg: 'bg-[hsl(260,60%,55%)]/10' },
  navy: { bg: 'border-l-4 border-l-primary', text: 'text-primary', iconBg: 'bg-primary/10' },
};

const defaultColors = ['navy', 'blue', 'purple', 'green', 'yellow', 'blue', 'red', 'navy'];

const DashboardCard: React.FC<DashboardCardProps & { index?: number }> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  onClick,
  clickable = false,
  color,
  index = 0
}) => {
  const colorKey = color || defaultColors[index % defaultColors.length];
  const colors = colorMap[colorKey] || colorMap.navy;

  return (
    <div 
      className={`bg-card rounded-xl border border-border/50 ${colors.bg} p-4 sm:p-5 shadow-sm transition-all duration-300 ${
        clickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]' : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-1.5 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground mb-0.5">{value}</p>
          <p className="text-[11px] text-muted-foreground truncate">{description}</p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend.isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-success mr-1" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-destructive mr-1" />
              )}
              <span className={`text-xs font-semibold ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-[10px] text-muted-foreground ml-1">ce mois</span>
            </div>
          )}
        </div>
        <div className={`w-11 h-11 sm:w-12 sm:h-12 ${colors.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;