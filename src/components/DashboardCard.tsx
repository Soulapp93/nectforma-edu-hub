
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
      className={`glass-card rounded-xl p-6 transition-all duration-300 ${
        clickable ? 'cursor-pointer floating-card hover:shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-success mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive mr-1" />
              )}
              <span className={`text-sm ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
                {trend.value}%
              </span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
