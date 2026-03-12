import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Eye, Printer, ChevronLeft, ChevronRight, Users, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEstablishment } from '@/hooks/useEstablishment';
import {
  getEvaluationPeriods,
  getEvaluations,
  getGradesByEvaluation,
  getGradingRules,
  getCompetencyBlocks,
  getTeachingUnits,
  calculateModuleAverage,
  calculateWeightedAverage,
  getMention,
  getDecision,
  isAboveEliminatoryThreshold,
  DECISIONS,
  MENTIONS,
  type CompetencyBlock,
  type TeachingUnit,
} from '@/services/gradesService';
import GenerateTranscriptModal from './GenerateTranscriptModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  mode: 'admin' | 'student';
  studentId?: string;
}

interface ModuleBulletin {
  moduleId: string;
  moduleTitle: string;
  evaluationMode: string;
  ccAverage: number | null;
  ebAverage: number | null;
  average: number | null;
  classAverage: number | null;
  coefficient: number;
  appreciation: string;
  isEliminatory: boolean;
}

interface BlockBulletin {
  blockId: string | null;
  blockTitle: string;
  blockCode: string | null;
  modules: ModuleBulletin[];
  blockAverage: number | null;
  classBlockAverage: number | null;
  blockCoefficient: number;
}

interface StudentBulletin {
  studentId: string;
  studentName: string;
  studentEmail: string;
  blocks: BlockBulletin[];
  generalAverage: number | null;
  classGeneralAverage: number | null;
  decision: string;
  mention: string | null;
}

const TranscriptsPanel: React.FC<Props> = ({ mode, studentId }) => {
  const { userId } = useCurrentUser();
  const { establishment } = useEstablishment();
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

  const { data: periods = [] } = useQuery({
    queryKey: ['periods-for-transcripts', selectedFormation],
    queryFn: () => getEvaluationPeriods(selectedFormation),
    enabled: !!selectedFormation,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['formation-students-transcripts', selectedFormation],
    queryFn: async () => {
      if (mode === 'student' && studentId) {
        const { data } = await supabase.from('users').select('id, first_name, last_name, email').eq('id', studentId).single();
        return data ? [{ user_id: data.id, first_name: data.first_name, last_name: data.last_name, email: data.email }] : [];
      }
      const { data } = await supabase.rpc('get_formation_students', { formation_id_param: selectedFormation });
      return data || [];
    },
    enabled: !!selectedFormation,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['formation-modules-transcripts', selectedFormation],
    queryFn: async () => {
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, coefficient, order_index, teaching_unit_id, evaluation_mode')
        .eq('formation_id', selectedFormation)
        .order('order_index');
      return data || [];
    },
    enabled: !!selectedFormation,
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ['competency-blocks-transcripts', selectedFormation],
    queryFn: () => getCompetencyBlocks(selectedFormation),
    enabled: !!selectedFormation,
  });

  const { data: teachingUnits = [] } = useQuery({
    queryKey: ['teaching-units-transcripts', selectedFormation],
    queryFn: () => getTeachingUnits(selectedFormation),
    enabled: !!selectedFormation,
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations-transcripts', selectedFormation, selectedPeriod],
    queryFn: async () => {
      const allEvals = await getEvaluations(selectedFormation);
      if (selectedPeriod && selectedPeriod !== 'all') return allEvals.filter(e => e.period_id === selectedPeriod);
      return allEvals;
    },
    enabled: !!selectedFormation,
  });

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

  const { data: gradingRules } = useQuery({
    queryKey: ['grading-rules-transcripts', selectedFormation],
    queryFn: () => getGradingRules(selectedFormation),
    enabled: !!selectedFormation,
  });

  // Build bulletins organized by blocks
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
      compensation_mode: 'intra_block',
      has_eliminatory_threshold: false,
      eliminatory_threshold: null,
    };
    const rules = gradingRules || defaultRules;

    // Group modules into blocks
    // UE -> block mapping
    const ueBlockMap = new Map<string, string>();
    teachingUnits.forEach(u => {
      if (u.block_id) ueBlockMap.set(u.id, u.block_id);
    });

    // Module -> block mapping (via UE)
    const getModuleBlockId = (mod: any): string | null => {
      if (mod.teaching_unit_id && ueBlockMap.has(mod.teaching_unit_id)) {
        return ueBlockMap.get(mod.teaching_unit_id)!;
      }
      return null;
    };

    // Organize modules by block
    const blockModules = new Map<string | null, any[]>();
    modules.forEach(mod => {
      const blockId = getModuleBlockId(mod);
      if (!blockModules.has(blockId)) blockModules.set(blockId, []);
      blockModules.get(blockId)!.push(mod);
    });

    // Calculate module averages for a student
    const getStudentModuleBulletin = (student: any, mod: any): ModuleBulletin => {
      const moduleEvals = evaluations.filter(e => e.module_id === mod.id);
      const ccEvals = moduleEvals.filter(e => e.evaluation_type !== 'examen_blanc');
      const ebEvals = moduleEvals.filter(e => e.evaluation_type === 'examen_blanc');

      const getAvgForEvals = (evals: any[]) => {
        const studentGrades = evals
          .map(e => allGrades.get(e.id)?.find((g: any) => g.student_id === student.user_id))
          .filter(Boolean);
        return calculateModuleAverage(studentGrades, 20);
      };

      const ccAvg = ccEvals.length > 0 ? getAvgForEvals(ccEvals) : null;
      const ebAvg = ebEvals.length > 0 ? getAvgForEvals(ebEvals) : null;

      // Combined average
      const evalMode = mod.evaluation_mode || 'both';
      let average: number | null = null;
      if (evalMode === 'cc_only') {
        average = ccAvg;
      } else if (evalMode === 'exam_only') {
        average = ebAvg;
      } else {
        // Both: combine all evaluations
        const allStudentGrades = moduleEvals
          .map(e => allGrades.get(e.id)?.find((g: any) => g.student_id === student.user_id))
          .filter(Boolean);
        average = calculateModuleAverage(allStudentGrades, 20);
      }

      const isElim = !isAboveEliminatoryThreshold(average, rules as any);

      return {
        moduleId: mod.id,
        moduleTitle: mod.title,
        evaluationMode: evalMode,
        ccAverage: ccAvg,
        ebAverage: ebAvg,
        average,
        classAverage: null, // filled later
        coefficient: mod.coefficient || 1,
        appreciation: '',
        isEliminatory: isElim,
      };
    };

    // Calculate class averages
    const classModuleAverages = new Map<string, number[]>();
    modules.forEach(mod => {
      const avgs: number[] = [];
      students.forEach(s => {
        const mb = getStudentModuleBulletin(s, mod);
        if (mb.average !== null) avgs.push(mb.average);
      });
      classModuleAverages.set(mod.id, avgs);
    });

    return students.map(student => {
      const studentBlocks: BlockBulletin[] = [];

      // Process blocks with modules
      const processedBlocks = blocks.length > 0
        ? [...blocks.map(b => ({ id: b.id, title: b.title, code: b.code, coefficient: b.coefficient })), { id: null as string | null, title: 'Autres modules', code: null, coefficient: 1 }]
        : [{ id: null as string | null, title: 'Modules', code: null, coefficient: 1 }];

      for (const block of processedBlocks) {
        const bModules = blockModules.get(block.id) || [];
        if (bModules.length === 0 && block.id !== null) continue;

        const moduleBulletins = bModules.map(mod => {
          const mb = getStudentModuleBulletin(student, mod);
          const classAvgs = classModuleAverages.get(mod.id) || [];
          mb.classAverage = classAvgs.length > 0
            ? Math.round((classAvgs.reduce((a, b) => a + b, 0) / classAvgs.length) * 100) / 100
            : null;
          return mb;
        });

        const blockAvg = calculateWeightedAverage(
          moduleBulletins.map(m => ({ average: m.average, coefficient: m.coefficient }))
        );

        // Class block average
        const classBlockAvgs = students.map(s => {
          const sMods = bModules.map(mod => {
            const mb = getStudentModuleBulletin(s, mod);
            return { average: mb.average, coefficient: mod.coefficient || 1 };
          });
          return calculateWeightedAverage(sMods);
        }).filter(a => a !== null) as number[];

        const classBlockAvg = classBlockAvgs.length > 0
          ? Math.round((classBlockAvgs.reduce((a, b) => a + b, 0) / classBlockAvgs.length) * 100) / 100
          : null;

        if (moduleBulletins.length > 0) {
          studentBlocks.push({
            blockId: block.id,
            blockTitle: block.title,
            blockCode: block.code,
            modules: moduleBulletins,
            blockAverage: blockAvg,
            classBlockAverage: classBlockAvg,
            blockCoefficient: block.coefficient,
          });
        }
      }

      // General average
      const allModuleBulletins = studentBlocks.flatMap(b => b.modules);
      const generalAvg = calculateWeightedAverage(
        allModuleBulletins.map(m => ({ average: m.average, coefficient: m.coefficient }))
      );

      // Class general
      const allStudentAvgs = students.map(s => {
        const sMods = modules.map(mod => {
          const mb = getStudentModuleBulletin(s, mod);
          return { average: mb.average, coefficient: mod.coefficient || 1 };
        });
        return calculateWeightedAverage(sMods);
      }).filter(a => a !== null) as number[];

      const classGeneralAvg = allStudentAvgs.length > 0
        ? Math.round((allStudentAvgs.reduce((a, b) => a + b, 0) / allStudentAvgs.length) * 100) / 100
        : null;

      const decision = generalAvg !== null ? getDecision(generalAvg, rules as any) : 'en_cours';
      const mention = generalAvg !== null ? getMention(generalAvg, rules as any) : null;

      return {
        studentId: student.user_id,
        studentName: `${student.last_name} ${student.first_name}`,
        studentEmail: student.email || '',
        blocks: studentBlocks,
        generalAverage: generalAvg,
        classGeneralAverage: classGeneralAvg,
        decision,
        mention,
      };
    });
  }, [students, modules, evaluations, allGrades, gradingRules, blocks, teachingUnits]);

  const currentBulletin = bulletins[currentStudentIndex] || null;
  const selectedFormationData = availableFormations.find((f: any) => f.id === selectedFormation);
  const selectedPeriodData = periods.find(p => p.id === selectedPeriod);

  // Check if any module has EB evaluations
  const hasExamBlanc = evaluations.some(e => e.evaluation_type === 'examen_blanc');
  const hasCC = evaluations.some(e => e.evaluation_type !== 'examen_blanc');

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
        .student-info { display: flex; justify-content: space-between; margin: 15px 0; padding: 10px; background: #f9f5ff; border-radius: 6px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #d4d4d8; padding: 8px 10px; }
        th { background: #6b21a8; color: white; font-weight: 600; font-size: 12px; }
        .block-row { background: #ede9fe; font-weight: 700; }
        .block-row td { border-top: 2px solid #7c3aed; }
        .module-row td { border-bottom: 1px solid #e4e4e7; }
        .avg-green { color: #16a34a; }
        .avg-red { color: #dc2626; }
        .eliminatory { background: #fef2f2 !important; }
        .total-row { background: #f3e8ff; font-weight: 700; }
        .total-row td { border-top: 2px solid #6b21a8; }
        .decision-box { margin-top: 15px; padding: 12px; text-align: center; border: 2px solid; border-radius: 8px; }
        .decision-admis { border-color: #16a34a; background: #f0fdf4; color: #16a34a; }
        .decision-ajourne { border-color: #dc2626; background: #fef2f2; color: #dc2626; }
        .decision-rattrapage { border-color: #d97706; background: #fffbeb; color: #d97706; }
        .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #999; }
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

  const decisionLabel = (decision: string) => DECISIONS.find(d => d.value === decision)?.label || 'En cours';
  const mentionLabel = (mention: string | null) => mention ? MENTIONS.find(m => m.value === mention)?.label || '' : '';
  const avgColor = (val: number | null) => val === null ? '' : val >= 10 ? 'text-green-600' : 'text-red-600';

  // Flat modules for list view
  const allModulesFlat = bulletins[0]?.blocks.flatMap(b => b.modules) || [];

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
        {selectedFormation && mode === 'admin' && bulletins.length > 0 && (
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
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        /* ============ VUE LISTE ============ */
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {bulletins.length} étudiant(s) • {selectedFormationData?.title}
              {selectedPeriodData ? ` — ${selectedPeriodData.name}` : ''}
              {blocks.length > 0 && ` • ${blocks.length} bloc(s) de compétences`}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-primary/10">
                  <th className="text-left p-3 border-b border-border font-semibold">#</th>
                  <th className="text-left p-3 border-b border-border font-semibold">Étudiant</th>
                  {allModulesFlat.map(mod => (
                    <th key={mod.moduleId} className="text-center p-3 border-b border-border font-semibold min-w-[80px]">
                      <span className="text-xs">{mod.moduleTitle}</span>
                      {mod.isEliminatory && <span className="text-red-500 text-[9px] block">Élim.</span>}
                    </th>
                  ))}
                  <th className="text-center p-3 border-b border-border font-semibold bg-primary/20 min-w-[90px]">Moy. Gén.</th>
                  <th className="text-center p-3 border-b border-border font-semibold min-w-[80px]">Décision</th>
                  <th className="text-center p-3 border-b border-border font-semibold min-w-[60px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {bulletins.map((b, idx) => {
                  const flatMods = b.blocks.flatMap(bl => bl.modules);
                  return (
                    <tr key={b.studentId} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                      <td className="p-3 text-muted-foreground">{idx + 1}</td>
                      <td className="p-3 font-medium whitespace-nowrap">{b.studentName}</td>
                      {flatMods.map(m => (
                        <td key={m.moduleId} className={`p-3 text-center font-semibold ${avgColor(m.average)} ${m.isEliminatory ? 'bg-red-50 dark:bg-red-950/20' : ''}`}>
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
                  );
                })}
                {/* Class average row */}
                <tr className="bg-primary/10 font-semibold border-t-2 border-primary/30">
                  <td className="p-3" colSpan={2}>Moyenne de classe</td>
                  {allModulesFlat.map((mod, i) => {
                    const classAvg = bulletins[0]?.blocks.flatMap(b => b.modules)[i]?.classAverage;
                    return (
                      <td key={mod.moduleId} className={`p-3 text-center ${avgColor(classAvg ?? null)}`}>
                        {classAvg !== null && classAvg !== undefined ? classAvg.toFixed(2) : '—'}
                      </td>
                    );
                  })}
                  <td className={`p-3 text-center font-bold bg-primary/5 ${avgColor(bulletins[0]?.classGeneralAverage ?? null)}`}>
                    {bulletins[0]?.classGeneralAverage?.toFixed(2) || '—'}
                  </td>
                  <td className="p-3" colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : currentBulletin ? (
        /* ============ VUE BULLETIN ============ */
        <div className="space-y-4">
          {/* Navigation */}
          <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3 border border-border/50">
            <Button variant="ghost" size="sm" disabled={currentStudentIndex <= 0} onClick={() => setCurrentStudentIndex(prev => prev - 1)} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{currentBulletin.studentName}</span>
              <Badge variant="secondary" className="text-xs">{currentStudentIndex + 1} / {bulletins.length}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
                <Printer className="h-3.5 w-3.5" /> Imprimer
              </Button>
              <Button variant="ghost" size="sm" disabled={currentStudentIndex >= bulletins.length - 1} onClick={() => setCurrentStudentIndex(prev => prev + 1)} className="gap-1">
                Suivant <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bulletin */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div ref={printRef} className="bulletin">
                {/* Header */}
                <div className="bg-primary/5 border-b border-primary/20 p-6 text-center">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-left">
                      {establishment?.logo_url && <img src={establishment.logo_url} alt="" className="h-10 mb-1" />}
                      <p className="text-xs text-muted-foreground font-medium">{establishment?.name}</p>
                      {establishment?.address && <p className="text-[10px] text-muted-foreground">{establishment.address}</p>}
                    </div>
                    <div className="text-right">
                      <h1 className="text-lg font-bold text-primary">Bulletin de Formation</h1>
                      <h2 className="text-sm font-semibold">{selectedFormationData?.title}</h2>
                      {selectedFormationData?.level && <p className="text-xs text-muted-foreground">{selectedFormationData.level}</p>}
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

                {/* Student info */}
                <div className="px-6 py-3 bg-muted/30 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Apprenant</p>
                      <p className="text-base font-bold">{currentBulletin.studentName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{currentBulletin.studentEmail}</p>
                  </div>
                </div>

                {/* Grades table organized by blocks */}
                <div className="px-4 py-4">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="text-left p-2.5 font-semibold text-xs uppercase tracking-wider border border-primary/50" style={{ width: hasCC && hasExamBlanc ? '30%' : '40%' }}>
                          Matière
                        </th>
                        {hasCC && (
                          <th className="text-center p-2.5 font-semibold text-xs uppercase tracking-wider border border-primary/50" style={{ width: '15%' }}>
                            CC
                          </th>
                        )}
                        {hasExamBlanc && (
                          <th className="text-center p-2.5 font-semibold text-xs uppercase tracking-wider border border-primary/50" style={{ width: '15%' }}>
                            Examen Blanc
                          </th>
                        )}
                        <th className="text-center p-2.5 font-semibold text-xs uppercase tracking-wider border border-primary/50" style={{ width: '15%' }}>
                          Moy. Stagiaire
                        </th>
                        <th className="text-center p-2.5 font-semibold text-xs uppercase tracking-wider border border-primary/50" style={{ width: '15%' }}>
                          Moy. Classe
                        </th>
                        <th className="text-center p-2.5 font-semibold text-xs uppercase tracking-wider border border-primary/50" style={{ width: '10%' }}>
                          Coef.
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBulletin.blocks.map((block, blockIdx) => (
                        <React.Fragment key={block.blockId || 'default'}>
                          {/* Block header row (only if blocks exist) */}
                          {blocks.length > 0 && block.blockId && (
                            <tr className="bg-accent/50">
                              <td colSpan={hasCC && hasExamBlanc ? 6 : 5} className="p-2.5 border border-border/50 font-bold text-sm">
                                <div className="flex items-center gap-2">
                                  <Layers className="h-4 w-4 text-primary" />
                                  {block.blockCode && <Badge variant="secondary" className="text-[10px]">{block.blockCode}</Badge>}
                                  {block.blockTitle}
                                </div>
                              </td>
                            </tr>
                          )}
                          {/* Module rows */}
                          {block.modules.map((mod, modIdx) => (
                            <tr key={mod.moduleId} className={`border-b border-border/50 ${mod.isEliminatory ? 'bg-red-50/50 dark:bg-red-950/10' : modIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                              <td className="p-2.5 border border-border/50 font-medium">
                                {mod.moduleTitle}
                                {mod.isEliminatory && (
                                  <span className="text-[9px] text-red-600 ml-1 font-bold">(ÉLIM.)</span>
                                )}
                              </td>
                              {hasCC && (
                                <td className={`p-2.5 border border-border/50 text-center font-semibold ${avgColor(mod.ccAverage)}`}>
                                  {mod.evaluationMode === 'exam_only' ? <span className="text-muted-foreground text-xs">—</span> : mod.ccAverage !== null ? mod.ccAverage.toFixed(2) : '—'}
                                </td>
                              )}
                              {hasExamBlanc && (
                                <td className={`p-2.5 border border-border/50 text-center font-semibold ${avgColor(mod.ebAverage)}`}>
                                  {mod.evaluationMode === 'cc_only' ? <span className="text-muted-foreground text-xs">—</span> : mod.ebAverage !== null ? mod.ebAverage.toFixed(2) : '—'}
                                </td>
                              )}
                              <td className={`p-2.5 border border-border/50 text-center font-bold text-base ${avgColor(mod.average)}`}>
                                {mod.average !== null ? mod.average.toFixed(2) : '—'}
                              </td>
                              <td className={`p-2.5 border border-border/50 text-center font-semibold ${avgColor(mod.classAverage)}`}>
                                {mod.classAverage !== null ? mod.classAverage.toFixed(2) : '—'}
                              </td>
                              <td className="p-2.5 border border-border/50 text-center text-xs text-muted-foreground">
                                {mod.coefficient}
                              </td>
                            </tr>
                          ))}
                          {/* Block subtotal */}
                          {blocks.length > 0 && block.blockId && (
                            <tr className="bg-accent/30 font-semibold">
                              <td className="p-2 border border-border/50 text-right text-xs uppercase tracking-wider pr-4">
                                Moyenne {block.blockTitle}
                              </td>
                              {hasCC && <td className="border border-border/50"></td>}
                              {hasExamBlanc && <td className="border border-border/50"></td>}
                              <td className={`p-2 border border-border/50 text-center font-bold ${avgColor(block.blockAverage)}`}>
                                {block.blockAverage !== null ? block.blockAverage.toFixed(2) : '—'}
                              </td>
                              <td className={`p-2 border border-border/50 text-center ${avgColor(block.classBlockAverage)}`}>
                                {block.classBlockAverage !== null ? block.classBlockAverage.toFixed(2) : '—'}
                              </td>
                              <td className="p-2 border border-border/50 text-center text-xs">{block.blockCoefficient}</td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      {/* General average row */}
                      <tr className="bg-primary/10 font-bold border-t-2 border-primary/40">
                        <td className="p-3 border border-primary/30 text-sm uppercase tracking-wider">
                          Moyenne Générale
                        </td>
                        {hasCC && <td className="border border-primary/30"></td>}
                        {hasExamBlanc && <td className="border border-primary/30"></td>}
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

                {/* Decision */}
                <div className="px-6 pb-4">
                  <div className={`p-4 rounded-lg border-2 text-center ${decisionColor(currentBulletin.decision)}`}>
                    <p className="text-xs uppercase tracking-wider font-medium mb-1">Décision du conseil</p>
                    <p className="text-xl font-bold">{decisionLabel(currentBulletin.decision)}</p>
                    {currentBulletin.mention && (
                      <p className="text-sm mt-1">Mention : {mentionLabel(currentBulletin.mention)}</p>
                    )}
                  </div>
                </div>

                {/* Footer */}
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
