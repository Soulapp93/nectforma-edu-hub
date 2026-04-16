import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Medal, Search, GraduationCap, Calendar, Users, FileText, CheckCircle2,
  Clock, XCircle, Download, Eye, ArrowLeft, ChevronRight, BookOpen,
  LayoutTemplate, Printer, Loader2, Settings2, Sparkles,
} from 'lucide-react';
import {
  diplomaService, type DiplomaTemplate, type DiplomaTemplateData, DIPLOMA_VARIABLES, PRESET_TEMPLATES,
} from '@/services/diplomaService';

const DiplomaTemplateEditor = React.lazy(() => import('./DiplomaTemplateEditor'));

const getLevelColor = (level?: string) => {
  const colors: Record<string, string> = {
    'BAC+1': 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300',
    'BAC+2': 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
    'BAC+3': 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
    'BAC+4': 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
    'BAC+5': 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
  };
  return colors[level || ''] || 'bg-muted text-muted-foreground';
};

const MENTION_LABELS: Record<string, string> = { tres_bien: 'Tres bien', bien: 'Bien', assez_bien: 'Assez bien', passable: 'Passable' };
const DECISION_COLORS: Record<string, string> = {
  admis: 'bg-emerald-100 text-emerald-700', ajourne: 'bg-red-100 text-red-700', rattrapage: 'bg-amber-100 text-amber-700', en_cours: 'bg-blue-100 text-blue-700',
};

const DiplomaManagement: React.FC = () => {
  const { establishment } = useEstablishment();
  const { userId } = useCurrentUser();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // Navigation state (3 levels: formations list > promotions > students)
  const [selectedProgramName, setSelectedProgramName] = useState<string | null>(null);
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);

  // Formations
  const { data: formations = [], isLoading } = useQuery({
    queryKey: ['diploma-formations', establishment?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('formations')
        .select('id, title, status, color, level, start_date, end_date, academic_year, duration_years, semesters_count, formation_modules(id)')
        .eq('establishment_id', establishment?.id || '')
        .order('title');
      return data || [];
    },
    enabled: !!establishment?.id,
  });

  // Student counts per formation
  const { data: studentCounts = {} } = useQuery({
    queryKey: ['diploma-student-counts', formations.map((f: any) => f.id).join(',')],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const f of formations) {
        const { count } = await supabase.from('user_formation_assignments').select('id', { count: 'exact', head: true }).eq('formation_id', f.id);
        counts[f.id] = count || 0;
      }
      return counts;
    },
    enabled: formations.length > 0,
  });

  // Promotions per formation
  const { data: promotions = [] } = useQuery({
    queryKey: ['diploma-promotions', selectedProgramName],
    queryFn: async () => {
      if (!selectedProgramName) return [];
      const formIds = formations.filter((f: any) => f.title === selectedProgramName).map((f: any) => f.id);
      if (formIds.length === 0) return [];
      const { data } = await supabase.from('promotions').select('*').in('formation_id', formIds).order('academic_year', { ascending: false });
      return data || [];
    },
    enabled: !!selectedProgramName,
  });

  // Students for selected formation
  const { data: students = [] } = useQuery({
    queryKey: ['diploma-students', selectedFormationId],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_formation_students', { formation_id_param: selectedFormationId! });
      return (data || []).sort((a: any, b: any) => (a.last_name || '').localeCompare(b.last_name || ''));
    },
    enabled: !!selectedFormationId,
  });

  // Transcripts for selected formation
  const { data: transcripts = [] } = useQuery({
    queryKey: ['diploma-transcripts', selectedFormationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('transcripts')
        .select('id, student_id, general_average, decision, mention, jury_date, is_published')
        .eq('formation_id', selectedFormationId!);
      return data || [];
    },
    enabled: !!selectedFormationId,
  });

  // Templates
  const { data: templates = [] } = useQuery({
    queryKey: ['diploma-templates', establishment?.id],
    queryFn: () => diplomaService.getTemplates(establishment!.id),
    enabled: !!establishment?.id,
  });

  // Generated diplomas for this formation
  const { data: generatedDiplomas = [] } = useQuery({
    queryKey: ['generated-diplomas', selectedFormationId],
    queryFn: () => diplomaService.getGeneratedDiplomas(selectedFormationId!),
    enabled: !!selectedFormationId,
  });

  const selectedFormation = formations.find((f: any) => f.id === selectedFormationId);

  // Auto-select from URL
  useEffect(() => {
    const fId = searchParams.get('formationId');
    if (fId && formations.length > 0 && !selectedFormationId) {
      const match = formations.find((f: any) => f.id === fId);
      if (match) {
        setSelectedFormationId(fId);
        setSelectedProgramName((match as any).title);
      }
    }
  }, [searchParams, formations, selectedFormationId]);

  // Group formations
  const formationGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    formations.forEach((f: any) => {
      if (!groups[f.title]) groups[f.title] = [];
      groups[f.title].push(f);
    });
    Object.values(groups).forEach(g => g.sort((a: any, b: any) => (b.academic_year || '').localeCompare(a.academic_year || '')));
    return groups;
  }, [formations]);

  const programNames = useMemo(() => Object.keys(formationGroups).sort(), [formationGroups]);
  const filteredPrograms = useMemo(() => programNames.filter(n => n.toLowerCase().includes(searchTerm.toLowerCase())), [programNames, searchTerm]);

  // Student data merged with transcripts
  const studentData = useMemo(() => {
    return students.map((s: any) => {
      const transcript = transcripts.find((t: any) => t.student_id === s.user_id);
      const generated = generatedDiplomas.find((d: any) => d.student_id === s.user_id);
      return {
        ...s,
        transcript,
        generated,
        isAdmis: transcript?.decision === 'admis',
      };
    });
  }, [students, transcripts, generatedDiplomas]);

  const admisCount = studentData.filter(s => s.isAdmis).length;
  const publishedCount = transcripts.filter((t: any) => t.is_published).length;
  const allBulletinsPublished = transcripts.length > 0 && publishedCount === transcripts.length;
  const canGenerateDiplomas = admisCount > 0 && allBulletinsPublished;

  // Generate diplomas
  const handleGenerate = async () => {
    if (!selectedTemplateId || !selectedFormationId || !establishment) return;
    setGenerating(true);
    try {
      const admisStudents = studentData.filter(s => s.isAdmis);
      let count = 0;
      for (const s of admisStudents) {
        await diplomaService.upsertGeneratedDiploma({
          student_id: s.user_id,
          formation_id: selectedFormationId,
          template_id: selectedTemplateId,
          transcript_id: s.transcript?.id || null,
          establishment_id: establishment.id,
          status: 'generated',
        });
        count++;
      }
      queryClient.invalidateQueries({ queryKey: ['generated-diplomas', selectedFormationId] });
      toast.success(`${count} diplome(s) genere(s) avec succes`);
      setShowGenerateDialog(false);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la generation');
    } finally {
      setGenerating(false);
    }
  };

  // Preview diploma for a student
  const previewStudent = useMemo(() => {
    if (!previewStudentId) return null;
    return studentData.find(s => s.user_id === previewStudentId);
  }, [previewStudentId, studentData]);

  const previewTemplate = useMemo(() => {
    if (!selectedTemplateId) return templates[0] || null;
    return templates.find(t => t.id === selectedTemplateId) || null;
  }, [selectedTemplateId, templates]);

  if (isLoading) return <LoadingState message="Chargement des formations..." />;

  // ============ Level 3: Formation detail with students ============
  if (selectedFormationId && selectedFormation) {
    return (
      <div className="space-y-4" data-testid="diploma-formation-detail">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => { setSelectedFormationId(null); }} data-testid="diploma-back">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: (selectedFormation as any).color || '#6366f1' }}>
              {(selectedFormation as any).title?.charAt(0)}
            </div>
            <div>
              <h2 className="text-sm font-semibold">{(selectedFormation as any).title}</h2>
              <p className="text-xs text-muted-foreground">{(selectedFormation as any).academic_year} - {(selectedFormation as any).level}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => { setEditingTemplateId(null); setShowEditor(true); }} data-testid="create-template-btn">
              <LayoutTemplate className="h-3.5 w-3.5" /> Creer un modele
            </Button>
            {templates.length > 0 && (
              <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setShowGenerateDialog(true)} disabled={!canGenerateDiplomas} data-testid="generate-diplomas-btn"
                title={!allBulletinsPublished ? 'Les bulletins doivent etre publies avant de generer les diplomes' : admisCount === 0 ? 'Aucun etudiant admis' : ''}>
                <Sparkles className="h-3.5 w-3.5" /> Generer les diplomes ({admisCount})
              </Button>
            )}
          </div>
        </div>

        {/* Templates bar */}
        {templates.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <p className="text-xs text-muted-foreground shrink-0">Modeles :</p>
            {templates.map(t => (
              <Badge key={t.id} variant={selectedTemplateId === t.id ? 'default' : 'outline'}
                className="cursor-pointer shrink-0" onClick={() => setSelectedTemplateId(t.id)} data-testid={`template-badge-${t.id}`}>
                <LayoutTemplate className="h-3 w-3 mr-1" />{t.name}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" className="h-6 text-xs shrink-0" onClick={() => { setEditingTemplateId(selectedTemplateId); setShowEditor(true); }}>
              <Settings2 className="h-3 w-3 mr-1" /> Modifier
            </Button>
          </div>
        )}

        {/* Warning: bulletins not published */}
        {transcripts.length > 0 && !allBulletinsPublished && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Les bulletins de notes doivent etre publies avant de generer les diplomes. Publiez-les dans l'onglet "Gestion des notes et releves" &gt; "Bulletin de notes".
            </p>
          </div>
        )}

        {transcripts.length === 0 && students.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Aucun PV valide. Validez le PV et les resultats dans l'onglet "Gestion des notes et releves" &gt; "Jury & Deliberation" avant de generer les diplomes.
            </p>
          </div>
        )}

        {templates.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-8">
              <LayoutTemplate className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">Aucun modele de diplome</p>
              <p className="text-xs text-muted-foreground mb-3">Creez un modele pour pouvoir generer des diplomes</p>
              <Button size="sm" className="gap-1.5" onClick={() => { setEditingTemplateId(null); setShowEditor(true); }}>
                <LayoutTemplate className="h-3.5 w-3.5" /> Creer un modele
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-3 flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div><p className="text-lg font-bold">{students.length}</p><p className="text-[10px] text-muted-foreground">Etudiants</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-3 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div><p className="text-lg font-bold">{admisCount}</p><p className="text-[10px] text-muted-foreground">Admis</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-3 flex items-center gap-3">
            <Medal className="h-5 w-5 text-amber-500" />
            <div><p className="text-lg font-bold">{generatedDiplomas.length}</p><p className="text-[10px] text-muted-foreground">Diplomes generes</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-3 flex items-center gap-3">
            <Printer className="h-5 w-5 text-blue-500" />
            <div><p className="text-lg font-bold">{generatedDiplomas.filter(d => d.status === 'delivered').length}</p><p className="text-[10px] text-muted-foreground">Delivres</p></div>
          </CardContent></Card>
        </div>

        {/* Students list */}
        <Card>
          <CardContent className="p-0">
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase border-b bg-muted/30">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Etudiant</div>
              <div className="col-span-2 text-center">Moyenne</div>
              <div className="col-span-2 text-center">Decision</div>
              <div className="col-span-1 text-center">Mention</div>
              <div className="col-span-1 text-center">Diplome</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {studentData.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Aucun etudiant dans cette formation</div>
            ) : (
              <div className="divide-y">
                {studentData.map((s, idx) => {
                  const decColor = DECISION_COLORS[s.transcript?.decision || ''] || 'bg-muted text-muted-foreground';
                  return (
                    <div key={s.user_id} className="px-4 py-2.5 hover:bg-muted/30 transition-colors" data-testid={`student-row-${s.user_id}`}>
                      <div className="hidden sm:grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-1 text-xs text-muted-foreground">{idx + 1}</div>
                        <div className="col-span-3">
                          <p className="text-sm font-medium truncate">{s.first_name} {s.last_name}</p>
                          <p className="text-[10px] text-muted-foreground">{s.email}</p>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="text-sm font-bold">{s.transcript?.general_average?.toFixed(2) ?? '—'}</span>
                          <span className="text-xs text-muted-foreground">/20</span>
                        </div>
                        <div className="col-span-2 text-center">
                          {s.transcript?.decision ? (
                            <Badge className={`${decColor} text-[10px]`}>{s.transcript.decision === 'admis' ? 'Admis' : s.transcript.decision === 'ajourne' ? 'Ajourne' : s.transcript.decision === 'rattrapage' ? 'Rattrapage' : s.transcript.decision}</Badge>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                        <div className="col-span-1 text-center text-xs">
                          {s.transcript?.mention ? MENTION_LABELS[s.transcript.mention] || s.transcript.mention : '—'}
                        </div>
                        <div className="col-span-1 text-center">
                          {s.generated ? (
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-0.5" />Genere</Badge>
                          ) : s.isAdmis ? (
                            <Badge variant="outline" className="text-[10px]"><Clock className="h-3 w-3 mr-0.5" />En attente</Badge>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                        <div className="col-span-2 flex justify-end gap-1">
                          {s.isAdmis && templates.length > 0 && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setPreviewStudentId(s.user_id); setShowPreview(true); }} data-testid={`preview-${s.user_id}`}>
                              <Eye className="h-3 w-3" /> Apercu
                            </Button>
                          )}
                        </div>
                      </div>
                      {/* Mobile */}
                      <div className="sm:hidden space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{s.first_name} {s.last_name}</p>
                          <span className="text-sm font-bold">{s.transcript?.general_average?.toFixed(2) ?? '—'}/20</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {s.transcript?.decision && <Badge className={`${decColor} text-[10px]`}>{s.transcript.decision}</Badge>}
                          {s.generated && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Diplome genere</Badge>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template Editor Dialog */}
        <Suspense fallback={null}>
          {showEditor && establishment && (
            <DiplomaTemplateEditor
              open={showEditor}
              onOpenChange={setShowEditor}
              establishmentId={establishment.id}
              templateId={editingTemplateId}
            />
          )}
        </Suspense>

        {/* Generate Dialog */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent className="sm:max-w-md" data-testid="generate-dialog">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Generer les diplomes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                <strong>{admisCount}</strong> etudiant(s) admis recevront un diplome.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Modele de diplome</label>
                <Select value={selectedTemplateId || ''} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="h-9" data-testid="select-template"><SelectValue placeholder="Choisir un modele" /></SelectTrigger>
                  <SelectContent>
                    {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-xs text-amber-700">
                Les diplomes seront generes pour tous les etudiants ayant la decision "Admis".
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Annuler</Button>
              <Button onClick={handleGenerate} disabled={!selectedTemplateId || generating} className="gap-1.5" data-testid="confirm-generate">
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generer ({admisCount})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={v => { setShowPreview(v); if (!v) setPreviewStudentId(null); }}>
          <DialogContent className="max-w-[900px] w-[95vw]" data-testid="preview-dialog">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" />Apercu du diplome</DialogTitle>
            </DialogHeader>
            {previewStudent && previewTemplate && (
              <div className="flex justify-center overflow-auto py-4">
                <div className="shadow-xl" style={{
                  width: previewTemplate.orientation === 'landscape' ? 800 : 520,
                  height: previewTemplate.orientation === 'landscape' ? 520 : 800,
                  backgroundColor: previewTemplate.template_data?.backgroundColor || '#fff',
                  position: 'relative',
                  ...(previewTemplate.template_data?.borderStyle === 'double' ? { border: `${previewTemplate.template_data.borderWidth || 4}px double ${previewTemplate.template_data.borderColor || '#d4af37'}` } :
                    previewTemplate.template_data?.borderStyle === 'simple' ? { border: `${previewTemplate.template_data.borderWidth || 3}px solid ${previewTemplate.template_data.borderColor || '#333'}` } :
                    previewTemplate.template_data?.borderStyle === 'ornate' ? { border: `${previewTemplate.template_data.borderWidth || 3}px solid ${previewTemplate.template_data.borderColor || '#9333ea'}`, boxShadow: `inset 0 0 0 ${(previewTemplate.template_data.borderWidth || 3) + 6}px ${previewTemplate.template_data.borderColor || '#9333ea'}20` } : {}),
                }}>
                  {(previewTemplate.template_data?.elements || []).map((el: any) => {
                    const content = diplomaService.resolveVariables(
                      el.content || '',
                      { first_name: previewStudent.first_name, last_name: previewStudent.last_name },
                      { title: (selectedFormation as any)?.title, level: (selectedFormation as any)?.level, academic_year: (selectedFormation as any)?.academic_year },
                      { name: establishment?.name || '' },
                      previewStudent.transcript ? { general_average: previewStudent.transcript.general_average, decision: previewStudent.transcript.decision, mention: previewStudent.transcript.mention, jury_date: previewStudent.transcript.jury_date } : undefined,
                      `DIP-${new Date().getFullYear()}-${String(studentData.indexOf(previewStudent) + 1).padStart(4, '0')}`
                    );
                    if (el.type === 'line') return <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, backgroundColor: el.styles?.backgroundColor || '#000' }} />;
                    if (el.type === 'rectangle') return <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, backgroundColor: el.styles?.backgroundColor || 'transparent', border: `${el.styles?.borderWidth || 1}px solid ${el.styles?.borderColor || '#000'}`, borderRadius: el.styles?.borderRadius || 0 }} />;
                    if (el.type === 'signature_zone') return (
                      <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <div style={{ width: '80%', borderBottom: '1px solid #999', marginBottom: 4, paddingTop: el.height - 30 }} />
                        <span style={{ fontSize: el.styles?.fontSize || 11, color: el.styles?.color || '#444', fontFamily: el.styles?.fontFamily, fontStyle: 'italic' }}>{content}</span>
                      </div>
                    );
                    if (el.type === 'image') return (
                      <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height }}>
                        {el.content ? <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : null}
                      </div>
                    );
                    return (
                      <div key={el.id} style={{
                        position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
                        fontSize: el.styles?.fontSize, fontFamily: el.styles?.fontFamily, fontWeight: el.styles?.fontWeight,
                        fontStyle: el.styles?.fontStyle, textAlign: el.styles?.textAlign, color: el.styles?.color,
                        textDecoration: el.styles?.textDecoration, letterSpacing: el.styles?.letterSpacing,
                        display: 'flex', alignItems: 'center',
                        justifyContent: el.styles?.textAlign === 'center' ? 'center' : el.styles?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                        overflow: 'hidden',
                      }}>
                        {content}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============ Level 2: Promotions list ============
  if (selectedProgramName) {
    const groupFormations = formationGroups[selectedProgramName] || [];
    return (
      <div className="space-y-4" data-testid="diploma-promotions">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedProgramName(null)}><ArrowLeft className="h-4 w-4" /></Button>
            <GraduationCap className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold text-sm">{selectedProgramName}</h2>
              <p className="text-xs text-muted-foreground">{groupFormations.length} promotion(s)</p>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groupFormations.map((f: any) => (
            <Card key={f.id} className="hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer group" onClick={() => setSelectedFormationId(f.id)} data-testid={`promo-card-${f.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {f.academic_year && <Badge variant="outline" className="text-[10px]"><Calendar className="h-3 w-3 mr-1" />{f.academic_year}</Badge>}
                  <Badge className={`${getLevelColor(f.level)} text-[10px]`}>{f.level}</Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    {f.start_date && <span><Calendar className="h-3 w-3 inline mr-1" />{format(new Date(f.start_date), 'MMM yyyy', { locale: fr })} — {f.end_date ? format(new Date(f.end_date), 'MMM yyyy', { locale: fr }) : '...'}</span>}
                    <span><Users className="h-3 w-3 inline mr-1" />{studentCounts[f.id] || 0} etudiants</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <span className="text-xs text-primary font-medium group-hover:underline flex items-center gap-1">Gerer les diplomes <ChevronRight className="h-3.5 w-3.5" /></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ============ Level 1: Formations list ============
  return (
    <div className="space-y-4" data-testid="diploma-formations-list">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Medal className="h-5 w-5 text-primary" /></div>
          <div>
            <h2 className="font-semibold">Gestion des Diplomes</h2>
            <p className="text-xs text-muted-foreground">Selectionnez une formation pour gerer les diplomes</p>
          </div>
        </CardContent>
      </Card>

      {formations.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher une formation..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" data-testid="diploma-search" />
        </div>
      )}

      {filteredPrograms.length === 0 ? (
        <EmptyState icon={Medal} title="Aucune formation" description="Les formations apparaitront ici une fois creees." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map(name => {
            const group = formationGroups[name];
            const first = group[0];
            const totalStudents = group.reduce((sum: number, f: any) => sum + (studentCounts[f.id] || 0), 0);
            const moduleCount = group.reduce((sum: number, f: any) => sum + (f.formation_modules?.length || 0), 0);
            return (
              <Card key={name} className="hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer group overflow-hidden"
                onClick={() => setSelectedProgramName(name)} data-testid={`formation-card-${name}`}>
                <div className="h-1.5" style={{ backgroundColor: first.color || '#6366f1' }} />
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${getLevelColor(first.level)} text-[10px]`}>{first.level}</Badge>
                    <Badge variant="outline" className="text-[10px]">{group.length} promotion{group.length > 1 ? 's' : ''}</Badge>
                  </div>
                  <h3 className="font-semibold text-sm">{name}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span><Clock className="h-3 w-3 inline mr-1" />{first.duration_years || 1}an(s)</span>
                    <span><BookOpen className="h-3 w-3 inline mr-1" />{moduleCount} module{moduleCount > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-xs text-primary font-medium group-hover:underline flex items-center gap-1">Voir les promotions <ChevronRight className="h-3.5 w-3.5" /></span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DiplomaManagement;
