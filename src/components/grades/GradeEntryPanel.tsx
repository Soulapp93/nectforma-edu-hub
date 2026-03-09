import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, AlertCircle, CheckCircle2, PenLine } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import {
  getEvaluations,
  getEvaluationsByInstructor,
  getGradesByEvaluation,
  upsertGrades,
  saveGradeHistory,
  type Evaluation,
  type Grade,
} from '@/services/gradesService';

const GradeEntryPanel: React.FC = () => {
  const { userId, userRole } = useCurrentUser();
  const queryClient = useQueryClient();
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const [selectedFormation, setSelectedFormation] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState('');
  const [localGrades, setLocalGrades] = useState<Map<string, Partial<Grade>>>(new Map());
  const [isDirty, setIsDirty] = useState(false);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Formations
  const { data: formations = [] } = useQuery({
    queryKey: ['formations-for-grade-entry'],
    queryFn: async () => {
      if (!isAdmin) {
        const { data } = await supabase
          .from('user_formation_assignments')
          .select('formation_id, formations(id, title)')
          .eq('user_id', userId!);
        return (data || []).map((d: any) => d.formations).filter(Boolean);
      }
      const { data } = await supabase.from('formations').select('id, title').order('title');
      return data || [];
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (formations.length > 0 && !selectedFormation) setSelectedFormation(formations[0].id);
  }, [formations]);

  // Evaluations ouvertes
  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations-for-entry', selectedFormation],
    queryFn: async () => {
      const evals = isAdmin
        ? await getEvaluations(selectedFormation)
        : await getEvaluationsByInstructor(userId!);
      return evals.filter(e => e.status === 'ouvert' || e.status === 'brouillon');
    },
    enabled: !!selectedFormation || !isAdmin,
  });

  // Étudiants de la formation
  const currentEval = evaluations.find(e => e.id === selectedEvaluation);
  const formationIdForStudents = currentEval?.formation_id || selectedFormation;

  const { data: students = [] } = useQuery({
    queryKey: ['formation-students-grades', formationIdForStudents],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_formation_students', {
        formation_id_param: formationIdForStudents,
      });
      return data || [];
    },
    enabled: !!formationIdForStudents,
  });

  // Notes existantes
  const { data: existingGrades = [] } = useQuery({
    queryKey: ['grades-for-entry', selectedEvaluation],
    queryFn: () => getGradesByEvaluation(selectedEvaluation),
    enabled: !!selectedEvaluation,
  });

  // Init local grades when students/existing grades change
  useEffect(() => {
    const map = new Map<string, Partial<Grade>>();
    students.forEach((s: any) => {
      const existing = existingGrades.find(g => g.student_id === s.user_id);
      map.set(s.user_id, existing || {
        evaluation_id: selectedEvaluation,
        student_id: s.user_id,
        value: null,
        status: 'brouillon',
        is_absent: false,
        is_excused: false,
        is_dispensed: false,
        is_cheating: false,
        internal_comment: null,
      });
    });
    setLocalGrades(map);
    setIsDirty(false);
  }, [students, existingGrades, selectedEvaluation]);

  const updateLocalGrade = useCallback((studentId: string, field: string, value: any) => {
    setLocalGrades(prev => {
      const newMap = new Map(prev);
      const grade = { ...newMap.get(studentId) };
      (grade as any)[field] = value;
      // Si absent → value = null
      if (field === 'is_absent' && value) {
        grade.value = null;
      }
      newMap.set(studentId, grade);
      return newMap;
    });
    setIsDirty(true);
  }, []);

  // Navigation clavier
  const handleKeyDown = useCallback((e: React.KeyboardEvent, studentId: string, studentIndex: number) => {
    const studentIds = students.map((s: any) => s.user_id);
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextId = studentIds[studentIndex + 1];
      if (nextId) inputRefs.current.get(nextId)?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevId = studentIds[studentIndex - 1];
      if (prevId) inputRefs.current.get(prevId)?.focus();
    }
  }, [students]);

  // Sauvegarde
  const saveMutation = useMutation({
    mutationFn: async () => {
      const gradesToSave: Partial<Grade>[] = [];
      localGrades.forEach((grade, studentId) => {
        gradesToSave.push({
          evaluation_id: selectedEvaluation,
          student_id: studentId,
          value: grade.value,
          status: grade.status || 'brouillon',
          is_absent: grade.is_absent || false,
          is_excused: grade.is_excused || false,
          is_dispensed: grade.is_dispensed || false,
          is_cheating: grade.is_cheating || false,
          internal_comment: grade.internal_comment || null,
          created_by: userId,
          updated_by: userId,
        });
      });
      // Save history for modified grades
      for (const grade of gradesToSave) {
        const existing = existingGrades.find(g => g.student_id === grade.student_id);
        if (existing && existing.value !== grade.value) {
          await saveGradeHistory({
            grade_id: existing.id,
            old_value: existing.value,
            new_value: grade.value ?? null,
            old_status: existing.status,
            new_status: grade.status || 'brouillon',
            changed_by: userId!,
          });
        }
      }
      await upsertGrades(gradesToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades-for-entry'] });
      toast.success('Notes enregistrées');
      setIsDirty(false);
    },
    onError: (e: any) => toast.error(e.message || 'Erreur lors de l\'enregistrement'),
  });

  return (
    <div className="space-y-4">
      {/* Sélection formation + évaluation */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedFormation} onValueChange={(v) => { setSelectedFormation(v); setSelectedEvaluation(''); }}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Formation" />
          </SelectTrigger>
          <SelectContent>
            {formations.map((f: any) => (
              <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedEvaluation} onValueChange={setSelectedEvaluation}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Sélectionner une évaluation" />
          </SelectTrigger>
          <SelectContent>
            {evaluations.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.title} {e.module_title ? `(${e.module_title})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedEvaluation ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PenLine className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Sélectionnez une évaluation</h3>
            <p className="text-sm text-muted-foreground">Choisissez une formation et une évaluation pour saisir les notes</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Saisie des notes — {currentEval?.title}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (/{currentEval?.scale || 20})
                </span>
              </CardTitle>
              <div className="flex items-center gap-2">
                {isDirty && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Non enregistré
                  </Badge>
                )}
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={!isDirty || saveMutation.isPending}
                  size="sm"
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left p-2 font-semibold">Étudiant</th>
                    <th className="text-center p-2 font-semibold w-24">Note</th>
                    <th className="text-center p-2 font-semibold w-16">ABS</th>
                    <th className="text-center p-2 font-semibold w-16">EXC</th>
                    <th className="text-center p-2 font-semibold w-16">DISP</th>
                    <th className="text-center p-2 font-semibold w-16">FRAD</th>
                    <th className="text-left p-2 font-semibold hidden md:table-cell">Remarque</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student: any, index: number) => {
                    const grade = localGrades.get(student.user_id) || {};
                    const isAbsent = grade.is_absent || false;
                    return (
                      <tr key={student.user_id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-2 font-medium">
                          {student.last_name} {student.first_name}
                        </td>
                        <td className="p-2 text-center">
                          <Input
                            ref={(el) => { if (el) inputRefs.current.set(student.user_id, el); }}
                            type="number"
                            min={0}
                            max={currentEval?.scale || 20}
                            step={0.25}
                            value={grade.value ?? ''}
                            onChange={(e) => updateLocalGrade(student.user_id, 'value', e.target.value === '' ? null : parseFloat(e.target.value))}
                            onKeyDown={(e) => handleKeyDown(e, student.user_id, index)}
                            disabled={isAbsent || grade.is_dispensed}
                            className="w-20 text-center h-8 mx-auto"
                            placeholder="-"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Checkbox
                            checked={grade.is_absent || false}
                            onCheckedChange={(v) => updateLocalGrade(student.user_id, 'is_absent', !!v)}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Checkbox
                            checked={grade.is_excused || false}
                            onCheckedChange={(v) => updateLocalGrade(student.user_id, 'is_excused', !!v)}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Checkbox
                            checked={grade.is_dispensed || false}
                            onCheckedChange={(v) => updateLocalGrade(student.user_id, 'is_dispensed', !!v)}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Checkbox
                            checked={grade.is_cheating || false}
                            onCheckedChange={(v) => updateLocalGrade(student.user_id, 'is_cheating', !!v)}
                          />
                        </td>
                        <td className="p-2 hidden md:table-cell">
                          <Input
                            value={grade.internal_comment || ''}
                            onChange={(e) => updateLocalGrade(student.user_id, 'internal_comment', e.target.value)}
                            className="h-8 text-xs"
                            placeholder="Remarque interne..."
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {students.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Aucun étudiant inscrit à cette formation</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GradeEntryPanel;
