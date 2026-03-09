import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, TrendingUp, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getGradesByStudent, calculateWeightedAverage, EVALUATION_TYPES } from '@/services/gradesService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  studentId: string;
}

const StudentGradesView: React.FC<Props> = ({ studentId }) => {
  const [selectedFormation, setSelectedFormation] = useState<string>('all');

  const { data: rawGrades = [], isLoading } = useQuery({
    queryKey: ['student-grades', studentId],
    queryFn: () => getGradesByStudent(studentId),
    enabled: !!studentId,
  });

  // Group by formation, then by module
  const formations = new Map<string, { title: string; modules: Map<string, any[]> }>();
  rawGrades.forEach((g: any) => {
    const eval_ = g.evaluations;
    if (!eval_ || !eval_.is_published) return;
    const mod = eval_.formation_modules;
    if (!mod) return;
    const fId = mod.formation_id;
    if (!formations.has(fId)) {
      formations.set(fId, { title: '', modules: new Map() });
    }
    const formation = formations.get(fId)!;
    if (!formation.modules.has(mod.title)) {
      formation.modules.set(mod.title, []);
    }
    formation.modules.get(mod.title)!.push({ ...g, eval: eval_, module: mod });
  });

  const formationList = Array.from(formations.entries());
  const filteredFormations = selectedFormation === 'all' 
    ? formationList 
    : formationList.filter(([id]) => id === selectedFormation);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (rawGrades.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Award className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Aucune note disponible</h3>
          <p className="text-sm text-muted-foreground">Vos notes apparaîtront ici dès qu'elles seront publiées</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {formationList.length > 1 && (
        <Select value={selectedFormation} onValueChange={setSelectedFormation}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Toutes les formations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les formations</SelectItem>
            {formationList.map(([id, f]) => (
              <SelectItem key={id} value={id}>{f.title || 'Formation'}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {filteredFormations.map(([formationId, formation]) => (
        <div key={formationId} className="space-y-3">
          {Array.from(formation.modules.entries()).map(([moduleName, grades]) => {
            const moduleGrades = grades.filter((g: any) => g.value !== null);
            const avg = moduleGrades.length > 0
              ? moduleGrades.reduce((acc: number, g: any) => acc + g.value, 0) / moduleGrades.length
              : null;

            return (
              <Card key={moduleName}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      {moduleName}
                    </CardTitle>
                    {avg !== null && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Moy: {avg.toFixed(2)}/20
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {grades.map((g: any) => {
                      const typeLabel = EVALUATION_TYPES.find(t => t.value === g.eval.evaluation_type)?.label || g.eval.evaluation_type;
                      return (
                        <div key={g.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">{g.eval.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-[10px] h-5">{typeLabel}</Badge>
                              {g.eval.evaluation_date && (
                                <span>{format(new Date(g.eval.evaluation_date), 'dd MMM yyyy', { locale: fr })}</span>
                              )}
                              <span>Coef. {g.eval.coefficient}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            {g.is_absent ? (
                              <Badge variant="destructive" className="text-xs">ABS</Badge>
                            ) : g.is_dispensed ? (
                              <Badge variant="secondary" className="text-xs">DISP</Badge>
                            ) : g.value !== null ? (
                              <span className={`text-lg font-bold ${g.value >= (g.eval.scale / 2) ? 'text-green-600' : 'text-red-600'}`}>
                                {g.value}/{g.eval.scale}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default StudentGradesView;
