import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Eye, Send, Plus, Printer, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
import { toast } from 'sonner';
import {
  getEvaluationPeriods,
  getEvaluations,
  getGradesByEvaluation,
  getGradingRules,
  calculateModuleAverage,
  calculateWeightedAverage,
  getMention,
  getDecision,
  DECISIONS,
  MENTIONS,
} from '@/services/gradesService';
import GenerateTranscriptModal from './GenerateTranscriptModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  mode: 'admin' | 'student';
  studentId?: string;
}

interface StudentBulletin {
  studentId: string;
  studentName: string;
  studentEmail: string;
  modules: {
    moduleId: string;
    moduleTitle: string;
    average: number | null;
    classAverage: number | null;
    appreciation: string;
  }[];
  generalAverage: number | null;
  classGeneralAverage: number | null;
  decision: string;
  mention: string | null;
}

const TranscriptsPanel: React.FC<Props> = ({ mode, studentId }) => {
  const { userId } = useCurrentUser();
  const { establishment } = useEstablishment();
  const queryClient = useQueryClient();
  const [selectedFormation, setSelectedFormation] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'bulletin'>('list');
  const printRef = useRef<HTMLDivElement>(null);

  // Formations
  const { data: formations = [] } = useQuery({
    queryKey: ['formations-for-transcripts'],
    queryFn: async () => {
      const { data } = await supabase.from('formations').select('id, title, level, start_date, end_date').order('title');
      return data || [];
    },
    enabled: mode === 'admin',
  });

  // Student formations
  const { data: studentFormations = [] } = useQuery({
    queryKey: ['student-formations-transcripts', studentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_formation_assignments')
        .select('formation_id, formations(id, title, level, start_date, end_date)')
        .eq('user_id', studentId!);
      return (data || []).map((d: any) => d.formations).filter(Boolean);
    },
    enabled: mode === 'student' && !!studentId,
  });

  const availableFormations = mode === 'admin' ? formations : studentFormations;

  // Periods
  const { data: periods = [] } = useQuery({
    queryKey: ['periods-for-transcripts', selectedFormation],
    queryFn: () => getEvaluationPeriods(selectedFormation),
    enabled: !!selectedFormation,
  });

  // Students of formation
  const { data: students = [] } = useQuery({
    queryKey: ['formation-students-transcripts', selectedFormation],
    queryFn: async () => {
      if (mode === 'student' && studentId) {
        const { data } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .eq('id', studentId)
          .single();
        return data ? [{ user_id: data.id, first_name: data.first_name, last_name: data.last_name, email: data.email }] : [];
      }
      const { data } = await supabase.rpc('get_formation_students', { formation_id_param: selectedFormation });
      return data || [];
    },
    enabled: !!selectedFormation,
  });

  // Modules of formation
  const { data: modules = [] } = useQuery({
    queryKey: ['formation-modules-transcripts', selectedFormation],
    queryFn: async () => {
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, coefficient, order_index')
        .eq('formation_id', selectedFormation)
        .order('order_index');
      return data || [];
    },
    enabled: !!selectedFormation,
  });

  // Evaluations for the formation (filtered by period)
  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations-transcripts', selectedFormation, selectedPeriod],
    queryFn: async () => {
      const allEvals = await getEvaluations(selectedFormation);
      if (selectedPeriod) return allEvals.filter(e => e.period_id === selectedPeriod);
      return allEvals;
    },
    enabled: !!selectedFormation,
  });

  // All grades for all evaluations
  const { data: allGrades = new Map(), isLoading } = useQuery({
    queryKey: ['all-grades-transcripts', evaluations.map(e => e.id).join(',')],
    queryFn: async () => {
      const gradesMap = new Map<string, any[]>();
      for (const ev of evaluations) {
        const grades = await getGradesByEvaluation(ev.id);
        gradesMap.set(ev.id, grades);
      }
      return gradesMap;
    },
    enabled: evaluations.length > 0,
  });

  // Grading rules
  const { data: gradingRules } = useQuery({
    queryKey: ['grading-rules-transcripts', selectedFormation],
    queryFn: () => getGradingRules(selectedFormation),
    enabled: !!selectedFormation,
  });

  // Build bulletins
  const bulletins: StudentBulletin[] = React.useMemo(() => {
    if (!students.length || !modules.length) return [];

    const defaultRules = {
      validation_threshold: 10,
      allow_compensation: true,
      compensation_threshold: 8,
      mention_passable_threshold: 10,
      mention_ab_threshold: 12,
      mention_bien_threshold: 14,
      mention_tb_threshold: 16,
    };
    const rules = gradingRules || defaultRules;

    // Calculate class averages per module
    const classModuleAverages = new Map<string, number[]>();

    for (const mod of modules) {
      const moduleEvals = evaluations.filter(e => e.module_id === mod.id);
      const moduleStudentAverages: number[] = [];

      for (const student of students) {
        const studentGrades = moduleEvals
          .map(e => allGrades.get(e.id)?.find((g: any) => g.student_id === student.user_id))
          .filter(Boolean);
        const avg = calculateModuleAverage(studentGrades, 20);
        if (avg !== null) moduleStudentAverages.push(avg);
      }
      classModuleAverages.set(mod.id, moduleStudentAverages);
    }

    return students.map(student => {
      const studentModules = modules.map(mod => {
        const moduleEvals = evaluations.filter(e => e.module_id === mod.id);
        const studentGrades = moduleEvals
          .map(e => allGrades.get(e.id)?.find((g: any) => g.student_id === student.user_id))
          .filter(Boolean);
        const avg = calculateModuleAverage(studentGrades, 20);
        
        const classAvgs = classModuleAverages.get(mod.id) || [];
        const classAvg = classAvgs.length > 0
          ? Math.round((classAvgs.reduce((a, b) => a + b, 0) / classAvgs.length) * 100) / 100
          : null;

        return {
          moduleId: mod.id,
          moduleTitle: mod.title,
          average: avg,
          classAverage: classAvg,
          appreciation: '',
        };
      });

      const generalAvg = calculateWeightedAverage(
        studentModules.map((m, i) => ({
          average: m.average,
          coefficient: (modules[i] as any).coefficient || 1,
        }))
      );

      // Class general average
      const allStudentGeneralAvgs = students.map(s => {
        const sModules = modules.map(mod => {
          const moduleEvals = evaluations.filter(e => e.module_id === mod.id);
          const sGrades = moduleEvals
            .map(e => allGrades.get(e.id)?.find((g: any) => g.student_id === s.user_id))
            .filter(Boolean);
          return { average: calculateModuleAverage(sGrades, 20), coefficient: (mod as any).coefficient || 1 };
        });
        return calculateWeightedAverage(sModules);
      }).filter(a => a !== null) as number[];

      const classGeneralAvg = allStudentGeneralAvgs.length > 0
        ? Math.round((allStudentGeneralAvgs.reduce((a, b) => a + b, 0) / allStudentGeneralAvgs.length) * 100) / 100
        : null;

      const decision = generalAvg !== null ? getDecision(generalAvg, rules as any) : 'en_cours';
      const mention = generalAvg !== null ? getMention(generalAvg, rules as any) : null;

      return {
        studentId: student.user_id,
        studentName: `${student.last_name} ${student.first_name}`,
        studentEmail: student.email || '',
        modules: studentModules,
        generalAverage: generalAvg,
        classGeneralAverage: classGeneralAvg,
        decision,
        mention,
      };
    });
  }, [students, modules, evaluations, allGrades, gradingRules]);

  const currentBulletin = bulletins[currentStudentIndex] || null;
  const selectedFormationData = availableFormations.find((f: any) => f.id === selectedFormation);
  const selectedPeriodData = periods.find(p => p.id === selectedPeriod);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Bulletin de notes - ${currentBulletin?.studentName}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1a1a1a; font-size: 13px; }
        .bulletin { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #6b21a8; padding-bottom: 15px; }
        .header h1 { font-size: 18px; color: #6b21a8; margin: 0 0 5px; }
        .header h2 { font-size: 15px; margin: 0 0 5px; font-weight: normal; }
        .header h3 { font-size: 13px; margin: 0; color: #666; }
        .student-info { display: flex; justify-content: space-between; margin: 15px 0; padding: 10px; background: #f9f5ff; border-radius: 6px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #d4d4d8; padding: 8px 10px; }
        th { background: #6b21a8; color: white; font-weight: 600; font-size: 12px; text-transform: uppercase; }
        .module-row td { border-bottom: 1px solid #e4e4e7; }
        .module-name { font-weight: 500; }
        .avg-cell { text-align: center; font-weight: 600; }
        .avg-green { color: #16a34a; }
        .avg-red { color: #dc2626; }
        .total-row { background: #f3e8ff; font-weight: 700; }
        .total-row td { border-top: 2px solid #6b21a8; }
        .decision-box { margin-top: 15px; padding: 12px; text-align: center; border: 2px solid; border-radius: 8px; }
        .decision-admis { border-color: #16a34a; background: #f0fdf4; color: #16a34a; }
        .decision-ajourne { border-color: #dc2626; background: #fef2f2; color: #dc2626; }
        .decision-rattrapage { border-color: #d97706; background: #fffbeb; color: #d97706; }
        .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #999; border-top: 1px solid #e4e4e7; padding-top: 10px; }
        @media print { body { padding: 15px; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const decisionColor = (decision: string) => {
    switch(decision) {
      case 'admis': return 'text-green-600 bg-green-50 border-green-300';
      case 'ajourne': return 'text-red-600 bg-red-50 border-red-300';
      case 'rattrapage': return 'text-amber-600 bg-amber-50 border-amber-300';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const decisionLabel = (decision: string) => {
    return DECISIONS.find(d => d.value === decision)?.label || 'En cours';
  };

  const mentionLabel = (mention: string | null) => {
    return mention ? MENTIONS.find(m => m.value === mention)?.label || '' : '';
  };

  const avgColor = (val: number | null) => {
    if (val === null) return '';
    return val >= 10 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <Select value={selectedFormation} onValueChange={(v) => { setSelectedFormation(v); setSelectedPeriod(''); setCurrentStudentIndex(0); setViewMode('list'); }}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Sélectionner une formation" />
            </SelectTrigger>
            <SelectContent>
              {availableFormations.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {periods.length > 0 && (
            <Select value={selectedPeriod} onValueChange={(v) => { setSelectedPeriod(v); setCurrentStudentIndex(0); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes les périodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {selectedFormation && mode === 'admin' && (
          <div className="flex gap-2">
            {bulletins.length > 0 && (
              <Button
                variant={viewMode === 'bulletin' ? 'default' : 'outline'}
                onClick={() => setViewMode(viewMode === 'bulletin' ? 'list' : 'bulletin')}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                {viewMode === 'bulletin' ? 'Vue liste' : 'Vue bulletin'}
              </Button>
            )}
          </div>
        )}
      </div>

      {!selectedFormation ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Sélectionnez une formation</h3>
            <p className="text-sm text-muted-foreground">Choisissez une formation pour afficher les relevés de notes</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : bulletins.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Aucun étudiant dans cette formation</h3>
            <p className="text-sm text-muted-foreground">Ajoutez des étudiants à la formation pour générer les bulletins</p>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        /* ============ VUE LISTE : tous les étudiants ============ */
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {bulletins.length} étudiant(s) • {selectedFormationData?.title}
              {selectedPeriodData ? ` — ${selectedPeriodData.name}` : ''}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-primary/10">
                  <th className="text-left p-3 border-b border-border font-semibold">#</th>
                  <th className="text-left p-3 border-b border-border font-semibold">Étudiant</th>
                  {modules.map(mod => (
                    <th key={mod.id} className="text-center p-3 border-b border-border font-semibold min-w-[80px]">
                      <span className="text-xs">{mod.title}</span>
                    </th>
                  ))}
                  <th className="text-center p-3 border-b border-border font-semibold bg-primary/20 min-w-[90px]">Moy. Gén.</th>
                  <th className="text-center p-3 border-b border-border font-semibold min-w-[80px]">Décision</th>
                  <th className="text-center p-3 border-b border-border font-semibold min-w-[60px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {bulletins.map((b, idx) => (
                  <tr key={b.studentId} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                    <td className="p-3 text-muted-foreground">{idx + 1}</td>
                    <td className="p-3 font-medium whitespace-nowrap">{b.studentName}</td>
                    {b.modules.map(m => (
                      <td key={m.moduleId} className={`p-3 text-center font-semibold ${avgColor(m.average)}`}>
                        {m.average !== null ? m.average.toFixed(2) : '—'}
                      </td>
                    ))}
                    <td className={`p-3 text-center font-bold text-base bg-primary/5 ${avgColor(b.generalAverage)}`}>
                      {b.generalAverage !== null ? b.generalAverage.toFixed(2) : '—'}
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline" className={`text-[10px] ${DECISIONS.find(d => d.value === b.decision)?.color || ''}`}>
                        {decisionLabel(b.decision)}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setCurrentStudentIndex(idx); setViewMode('bulletin'); }}
                        className="h-7 px-2"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {/* Ligne moyenne de classe */}
                <tr className="bg-primary/10 font-semibold border-t-2 border-primary/30">
                  <td className="p-3" colSpan={2}>Moyenne de classe</td>
                  {modules.map((mod, i) => {
                    const classAvg = bulletins[0]?.modules[i]?.classAverage;
                    return (
                      <td key={mod.id} className={`p-3 text-center ${avgColor(classAvg ?? null)}`}>
                        {classAvg !== null && classAvg !== undefined ? classAvg.toFixed(2) : '—'}
                      </td>
                    );
                  })}
                  <td className={`p-3 text-center font-bold bg-primary/5 ${avgColor(bulletins[0]?.classGeneralAverage ?? null)}`}>
                    {bulletins[0]?.classGeneralAverage !== null && bulletins[0]?.classGeneralAverage !== undefined
                      ? bulletins[0].classGeneralAverage.toFixed(2) : '—'}
                  </td>
                  <td className="p-3" colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : currentBulletin ? (
        /* ============ VUE BULLETIN : un étudiant à la fois ============ */
        <div className="space-y-4">
          {/* Navigation entre étudiants */}
          <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3 border border-border/50">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentStudentIndex <= 0}
              onClick={() => setCurrentStudentIndex(prev => prev - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {currentBulletin.studentName}
              </span>
              <Badge variant="secondary" className="text-xs">
                {currentStudentIndex + 1} / {bulletins.length}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
                <Printer className="h-3.5 w-3.5" />
                Imprimer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentStudentIndex >= bulletins.length - 1}
                onClick={() => setCurrentStudentIndex(prev => prev + 1)}
                className="gap-1"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bulletin */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div ref={printRef} className="bulletin">
                {/* En-tête */}
                <div className="bg-primary/5 border-b border-primary/20 p-6 text-center">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-left">
                      {establishment?.logo_url && (
                        <img src={establishment.logo_url} alt="" className="h-10 mb-1" />
                      )}
                      <p className="text-xs text-muted-foreground font-medium">{establishment?.name}</p>
                      {establishment?.address && (
                        <p className="text-[10px] text-muted-foreground">{establishment.address}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <h1 className="text-lg font-bold text-primary">Bulletin de Formation</h1>
                      <h2 className="text-sm font-semibold">
                        {selectedFormationData?.title}
                      </h2>
                      {selectedFormationData?.level && (
                        <p className="text-xs text-muted-foreground">{selectedFormationData.level}</p>
                      )}
                      {selectedPeriodData ? (
                        <p className="text-xs text-muted-foreground mt-1">{selectedPeriodData.name}</p>
                      ) : selectedFormationData?.start_date && selectedFormationData?.end_date ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          Session {format(new Date(selectedFormationData.start_date), 'yyyy', { locale: fr })} - {format(new Date(selectedFormationData.end_date), 'yyyy', { locale: fr })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Infos étudiant */}
                <div className="px-6 py-3 bg-muted/30 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Apprenant</p>
                      <p className="text-base font-bold">{currentBulletin.studentName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{currentBulletin.studentEmail}</p>
                  </div>
                </div>

                {/* Tableau des matières */}
                <div className="px-4 py-4">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="text-left p-2.5 font-semibold text-xs uppercase tracking-wider border border-primary/50" style={{ width: '40%' }}>
                          Contrôle continu
                        </th>
                        <th className="text-center p-2.5 font-semibold text-xs uppercase tracking-wider border border-primary/50" style={{ width: '20%' }}>
                          Moyenne du Stagiaire
                        </th>
                        <th className="text-center p-2.5 font-semibold text-xs uppercase tracking-wider border border-primary/50" style={{ width: '20%' }}>
                          Moyenne de Classe
                        </th>
                        <th className="text-center p-2.5 font-semibold text-xs uppercase tracking-wider border border-primary/50" style={{ width: '20%' }}>
                          Appréciations
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBulletin.modules.map((mod, idx) => (
                        <tr key={mod.moduleId} className={`border-b border-border/50 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                          <td className="p-2.5 border border-border/50 font-medium">
                            {mod.moduleTitle}
                          </td>
                          <td className={`p-2.5 border border-border/50 text-center font-bold text-base ${avgColor(mod.average)}`}>
                            {mod.average !== null ? mod.average.toFixed(2) : '—'}
                          </td>
                          <td className={`p-2.5 border border-border/50 text-center font-semibold ${avgColor(mod.classAverage)}`}>
                            {mod.classAverage !== null ? mod.classAverage.toFixed(2) : '—'}
                          </td>
                          <td className="p-2.5 border border-border/50 text-center text-xs text-muted-foreground">
                            {mod.appreciation || '—'}
                          </td>
                        </tr>
                      ))}
                      {/* Ligne Moyenne Générale */}
                      <tr className="bg-primary/10 font-bold border-t-2 border-primary/40">
                        <td className="p-3 border border-primary/30 text-sm uppercase tracking-wider">
                          Moyenne Générale
                        </td>
                        <td className={`p-3 border border-primary/30 text-center text-lg ${avgColor(currentBulletin.generalAverage)}`}>
                          {currentBulletin.generalAverage !== null ? currentBulletin.generalAverage.toFixed(2) : '—'}
                          <span className="text-xs font-normal text-muted-foreground">/20</span>
                        </td>
                        <td className={`p-3 border border-primary/30 text-center ${avgColor(currentBulletin.classGeneralAverage)}`}>
                          {currentBulletin.classGeneralAverage !== null ? currentBulletin.classGeneralAverage.toFixed(2) : '—'}
                          <span className="text-xs font-normal text-muted-foreground">/20</span>
                        </td>
                        <td className="p-3 border border-primary/30"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Décision */}
                <div className="px-6 pb-4">
                  <div className={`p-4 rounded-lg border-2 text-center ${decisionColor(currentBulletin.decision)}`}>
                    <p className="text-xs uppercase tracking-wider font-medium mb-1">Décision du conseil</p>
                    <p className="text-xl font-bold">{decisionLabel(currentBulletin.decision)}</p>
                    {currentBulletin.mention && (
                      <p className="text-sm mt-1">Mention : {mentionLabel(currentBulletin.mention)}</p>
                    )}
                  </div>
                </div>

                {/* Pied de page */}
                <div className="px-6 pb-4 flex justify-between text-[10px] text-muted-foreground border-t border-border/50 pt-3">
                  <span>Document généré le {format(new Date(), 'dd/MM/yyyy', { locale: fr })}</span>
                  <span>{establishment?.name} {establishment?.phone ? `• Tél : ${establishment.phone}` : ''}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {showGenerateModal && (
        <GenerateTranscriptModal
          isOpen={true}
          onClose={() => setShowGenerateModal(false)}
          formationId={selectedFormation}
        />
      )}
    </div>
  );
};

export default TranscriptsPanel;