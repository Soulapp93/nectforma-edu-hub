import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  accent?: boolean;
}

export const StatCard = ({ title, value, icon: Icon, trend, accent }: StatCardProps) => (
  <Card className={accent ? 'border-primary/30 bg-primary/5' : ''}>
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold mt-1.5">{value}</p>
          {trend && <p className="text-xs text-green-500 mt-1 font-medium">{trend}</p>}
        </div>
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${accent ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}>
          <Icon className={`h-5 w-5 ${accent ? '' : 'text-primary'}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);
