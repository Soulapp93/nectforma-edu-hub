import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  children,
  className
}) => {
  return (
    <div className={cn('mb-6', className)}>
      <div className={cn(
        'flex flex-col md:flex-row md:items-center md:justify-between gap-4'
      )}>
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-foreground md:text-2xl">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-2 flex-wrap">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
