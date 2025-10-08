import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, AlertTriangle, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudentRisk } from '@/hooks/useDashboardStats';

interface EnhancedDashboardCardProps {
  title: string;
  icon: LucideIcon;
  type?: 'hours' | 'excellent-students' | 'risk-students' | 'default';
  // Pour le type 'hours'
  weeklyHours?: number;
  monthlyHours?: number;
  yearlyHours?: number;
  // Pour les types 'excellent-students' et 'risk-students'
  students?: StudentRisk[];
  // Pour le type 'default'
  value?: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const EnhancedDashboardCard: React.FC<EnhancedDashboardCardProps> = ({
  title,
  icon: Icon,
  type = 'default',
  weeklyHours,
  monthlyHours,
  yearlyHours,
  students,
  value,
  description,
  trend
}) => {
  if (type === 'hours') {
    return (
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-foreground">{weeklyHours}h</div>
                <div className="text-xs text-muted-foreground">Semaine</div>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{monthlyHours}h</div>
                <div className="text-xs text-muted-foreground">Mois</div>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{yearlyHours}h</div>
                <div className="text-xs text-muted-foreground">Année</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'excellent-students') {
    return (
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-green-600" />
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {students?.length ? (
              students.map((student) => (
                <div key={student.id} className="flex items-center justify-between text-sm">
                  <div className="flex-1 truncate">
                    <span className="text-foreground font-medium">{student.name}</span>
                    {student.formationName && (
                      <div className="text-xs text-muted-foreground truncate">{student.formationName}</div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 ml-2">
                    {student.attendanceRate}%
                  </Badge>
                </div>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">Aucun étudiant avec une assiduité ≥ 90% pour cette période/formation</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'risk-students') {
    return (
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {students?.length ? (
              students.map((student) => (
                <div key={student.id} className="flex items-center justify-between text-sm">
                  <div className="flex-1 truncate">
                    <span className="text-foreground font-medium">{student.name}</span>
                    {student.formationName && (
                      <div className="text-xs text-muted-foreground truncate">{student.formationName}</div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 ml-2">
                    {student.attendanceRate}%
                  </Badge>
                </div>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">Aucun étudiant à risque détecté pour cette période/formation</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Type default
  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center mt-2">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedDashboardCard;