import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface HubTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface HubPageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  tabs: HubTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  'data-testid'?: string;
}

const HubPageHeader: React.FC<HubPageHeaderProps> = ({
  title,
  description,
  icon: PageIcon,
  tabs,
  activeTab,
  onTabChange,
  'data-testid': testId,
}) => {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm" data-testid={testId}>
      {/* Title */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
            <PageIcon className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">{title}</h1>
            <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
          </div>
        </div>
      </div>

      {/* Tab bar - scrollable horizontal */}
      <div 
        className="overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          .hub-tabs::-webkit-scrollbar { display: none; }
        `}</style>
        <div className="hub-tabs flex px-3 sm:px-4 lg:px-6 gap-0.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                data-testid={`tab-${tab.id}`}
                className={`
                  flex items-center gap-1.5 
                  px-3 sm:px-4 py-2.5 sm:py-3 
                  text-[12px] sm:text-sm font-medium 
                  border-b-2 
                  transition-all duration-200 
                  whitespace-nowrap
                  ${isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }
                `}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HubPageHeader;
