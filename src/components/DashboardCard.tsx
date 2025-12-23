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
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  onClick,
  clickable = false
}) => {
  return (
    <div 
      className={`stats-card group ${
        clickable ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground/80">{description}</p>
          {trend && (
            <div className="flex items-center gap-1.5 pt-1">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                trend.isPositive 
                  ? 'bg-success/10 text-success' 
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trend.value}%</span>
              </div>
            </div>
          )}
        </div>
        <div className="icon-container w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
          <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
