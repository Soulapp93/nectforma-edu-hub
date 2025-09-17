import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, AlertTriangle, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudentRisk } from '@/hooks/useDashboardStats';

interface EnhancedDashboardCardProps {
  title: string;
  icon: LucideIcon;
  type?: 'hours' | 'students' | 'default';
  // Pour le type 'hours'
  weeklyHours?: number;
  monthlyHours?: number;
  yearlyHours?: number;
  // Pour le type 'students'
  riskStudents?: StudentRisk[];
  excellentStudents?: StudentRisk[];
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
  riskStudents,
  excellentStudents,
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

  if (type === 'students') {
    return (
      <Card className="bg-card col-span-full lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Étudiants assidus */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-foreground">Top Étudiants Assidus (≥90%)</span>
              </div>
              <div className="space-y-1">
                {excellentStudents?.length ? (
                  excellentStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate">{student.name}</span>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        {student.attendanceRate}%
                      </Badge>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Aucun étudiant avec une assiduité ≥ 90% pour cette période/formation</span>
                )}
              </div>
            </div>

            {/* Étudiants à risque */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-foreground">Étudiants à Risque (&lt;75% Présence)</span>
              </div>
              <div className="space-y-1">
                {riskStudents?.length ? (
                  riskStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate">{student.name}</span>
                      <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                        {student.attendanceRate}%
                      </Badge>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Aucun étudiant à risque détecté pour cette période/formation</span>
                )}
              </div>
            </div>
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