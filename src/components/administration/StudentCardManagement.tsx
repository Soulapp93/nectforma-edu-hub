import React, { useState, useMemo, Suspense } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useCurrentUser } from '@/hooks/useCurrentUser';
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
import QRCode from 'react-qr-code';
import {
  CreditCard, Search, ArrowLeft, ChevronRight, Users, Calendar, GraduationCap,
  BookOpen, Clock, LayoutTemplate, Settings2, Sparkles, Loader2, Eye,
  Download, Smartphone, CheckCircle, XCircle, Wallet,
} from 'lucide-react';
import { studentCardService, type StudentCardTemplate, CARD_PRESETS } from '@/services/studentCardService';

const StudentCardEditor = React.lazy(() => import('./StudentCardEditor'));

const getLevelColor = (level?: string) => {
  const colors: Record<string, string> = {
    'BAC+1': 'bg-purple-100 text-purple-800', 'BAC+2': 'bg-blue-100 text-blue-800',
    'BAC+3': 'bg-green-100 text-green-800', 'BAC+4': 'bg-orange-100 text-orange-800',
    'BAC+5': 'bg-red-100 text-red-800',
  };
  return colors[level || ''] || 'bg-muted text-muted-foreground';
};

const StudentCardManagement: React.FC = () => {
  const { establishment } = useEstablishment();
  const { userId } = useCurrentUser();
  const queryClient = useQueryClient();

  const [selectedProgramName, setSelectedProgramName] = useState<string | null>(null);
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: formations = [], isLoading } = useQuery({
    queryKey: ['card-formations', establishment?.id],
    queryFn: async () => {
      const { data } = await supabase.from('formations').select('id, title, status, color, level, start_date, end_date, academic_year, duration_years, formation_modules(id)').eq('establishment_id', establishment?.id || '').order('title');
      return data || [];
    },
    enabled: !!establishment?.id,
  });

  const { data: studentCounts = {} } = useQuery({
    queryKey: ['card-student-counts', formations.map((f: any) => f.id).join(',')],
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

  const { data: students = [] } = useQuery({
    queryKey: ['card-students', selectedFormationId],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_formation_students', { formation_id_param: selectedFormationId! });
      return (data || []).sort((a: any, b: any) => (a.last_name || '').localeCompare(b.last_name || ''));
    },
    enabled: !!selectedFormationId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['card-templates', establishment?.id],
    queryFn: () => studentCardService.getTemplates(establishment!.id),
    enabled: !!establishment?.id,
  });

  const { data: existingCards = [] } = useQuery({
    queryKey: ['student-cards', selectedFormationId],
    queryFn: () => studentCardService.getCards(selectedFormationId!),
    enabled: !!selectedFormationId,
  });

  const selectedFormation = formations.find((f: any) => f.id === selectedFormationId);

  const formationGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    formations.forEach((f: any) => { if (!groups[f.title]) groups[f.title] = []; groups[f.title].push(f); });
    Object.values(groups).forEach(g => g.sort((a: any, b: any) => (b.academic_year || '').localeCompare(a.academic_year || '')));
    return groups;
  }, [formations]);

  const programNames = useMemo(() => Object.keys(formationGroups).sort(), [formationGroups]);
  const filteredPrograms = useMemo(() => programNames.filter(n => n.toLowerCase().includes(searchTerm.toLowerCase())), [programNames, searchTerm]);

  const studentData = useMemo(() => {
    return students.map((s: any, idx: number) => {
      const card = existingCards.find((c: any) => c.student_id === s.user_id);
      return { ...s, card, index: idx };
    });
  }, [students, existingCards]);

  const cardsGenerated = studentData.filter(s => s.card).length;

  const handleGenerateAll = async () => {
    if (!selectedTemplateId || !selectedFormationId || !establishment) return;
    setGenerating(true);
    try {
      const prefix = (establishment.name || 'NF').substring(0, 3).toUpperCase();
      const year = new Date().getFullYear();
      let count = 0;
      for (const s of studentData) {
        const studentNumber = studentCardService.generateStudentNumber(prefix, year, count + 1);
        await studentCardService.generateCard({
          studentId: s.user_id,
          formationId: selectedFormationId,
          establishmentId: establishment.id,
          templateId: selectedTemplateId,
          studentNumber: s.card?.student_number || studentNumber,
          photoUrl: s.avatar_url || null,
        });
        count++;
      }
      queryClient.invalidateQueries({ queryKey: ['student-cards', selectedFormationId] });
      toast.success(`${count} carte(s) generee(s)`);
      setShowGenerate(false);
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setGenerating(false);
    }
  };

  const previewStudent = useMemo(() => {
    if (!previewCardId) return null;
    return studentData.find(s => s.card?.id === previewCardId || s.user_id === previewCardId);
  }, [previewCardId, studentData]);

  const previewTemplate = useMemo(() => templates.find(t => t.id === selectedTemplateId) || templates[0], [selectedTemplateId, templates]);

  if (isLoading) return <LoadingState message="Chargement..." />;

  // ============ Level 3: Formation detail with students ============
  if (selectedFormationId && selectedFormation) {
    return (
      <div className="space-y-4" data-testid="card-formation-detail">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setSelectedFormationId(null)} data-testid="card-back">
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
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => { setEditingTemplateId(null); setShowEditor(true); }} data-testid="create-card-template-btn">
              <LayoutTemplate className="h-3.5 w-3.5" /> Editer les cartes
            </Button>
            {templates.length > 0 && (
              <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setShowGenerate(true)} data-testid="generate-cards-btn">
                <Sparkles className="h-3.5 w-3.5" /> Generer les cartes ({students.length})
              </Button>
            )}
          </div>
        </div>

        {/* Templates bar */}
        {templates.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <p className="text-xs text-muted-foreground shrink-0">Modeles :</p>
            {templates.map(t => (
              <Badge key={t.id} variant={selectedTemplateId === t.id ? 'default' : 'outline'} className="cursor-pointer shrink-0" onClick={() => setSelectedTemplateId(t.id)}>
                <LayoutTemplate className="h-3 w-3 mr-1" />{t.name}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" className="h-6 text-xs shrink-0" onClick={() => { setEditingTemplateId(selectedTemplateId); setShowEditor(true); }}>
              <Settings2 className="h-3 w-3 mr-1" /> Modifier
            </Button>
          </div>
        )}

        {templates.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-8">
              <CreditCard className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">Aucun modele de carte</p>
              <p className="text-xs text-muted-foreground mb-3">Creez un modele pour generer les cartes etudiantes</p>
              <Button size="sm" className="gap-1.5" onClick={() => { setEditingTemplateId(null); setShowEditor(true); }}>
                <LayoutTemplate className="h-3.5 w-3.5" /> Creer un modele
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card><CardContent className="p-3 flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div><p className="text-lg font-bold">{students.length}</p><p className="text-[10px] text-muted-foreground">Etudiants</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-3 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            <div><p className="text-lg font-bold">{cardsGenerated}</p><p className="text-[10px] text-muted-foreground">Cartes generees</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-3 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            <div><p className="text-lg font-bold">{existingCards.filter(c => c.status === 'active').length}</p><p className="text-[10px] text-muted-foreground">Actives</p></div>
          </CardContent></Card>
        </div>

        {/* Students list */}
        <Card>
          <CardContent className="p-0">
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase border-b bg-muted/30">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Etudiant</div>
              <div className="col-span-2">N Etudiant</div>
              <div className="col-span-2 text-center">Statut carte</div>
              <div className="col-span-2 text-center">Validite</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {studentData.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Aucun etudiant</div>
            ) : (
              <div className="divide-y">
                {studentData.map((s, idx) => (
                  <div key={s.user_id} className="px-4 py-2.5 hover:bg-muted/30 transition-colors" data-testid={`card-student-${s.user_id}`}>
                    <div className="hidden sm:grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-xs text-muted-foreground">{idx + 1}</div>
                      <div className="col-span-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {(s.first_name?.[0] || '').toUpperCase()}{(s.last_name?.[0] || '').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{s.first_name} {s.last_name}</p>
                          <p className="text-[10px] text-muted-foreground">{s.email}</p>
                        </div>
                      </div>
                      <div className="col-span-2 text-xs font-mono">{s.card?.student_number || '—'}</div>
                      <div className="col-span-2 text-center">
                        {s.card ? (
                          <Badge className={s.card.status === 'active' ? 'bg-emerald-100 text-emerald-700 text-[10px]' : 'bg-red-100 text-red-700 text-[10px]'}>
                            {s.card.status === 'active' ? 'Active' : 'Expiree'}
                          </Badge>
                        ) : <span className="text-xs text-muted-foreground">Non generee</span>}
                      </div>
                      <div className="col-span-2 text-center text-xs text-muted-foreground">
                        {s.card ? `${format(new Date(s.card.valid_from), 'dd/MM/yy')} - ${format(new Date(s.card.valid_until), 'dd/MM/yy')}` : '—'}
                      </div>
                      <div className="col-span-2 flex justify-end gap-1">
                        {s.card && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setPreviewCardId(s.user_id); setShowPreview(true); }} data-testid={`preview-card-${s.user_id}`}>
                            <Eye className="h-3 w-3" /> Apercu
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* Mobile */}
                    <div className="sm:hidden flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-muted-foreground">{s.card?.student_number || 'Non generee'}</p>
                      </div>
                      {s.card && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Active</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editor */}
        <Suspense fallback={null}>
          {showEditor && establishment && (
            <StudentCardEditor open={showEditor} onOpenChange={setShowEditor} establishmentId={establishment.id} templateId={editingTemplateId} />
          )}
        </Suspense>

        {/* Generate Dialog */}
        <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
          <DialogContent className="sm:max-w-md" data-testid="generate-cards-dialog">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Generer les cartes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground"><strong>{students.length}</strong> carte(s) seront generees.</p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Modele de carte</label>
                <Select value={selectedTemplateId || ''} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="h-9" data-testid="select-card-template"><SelectValue placeholder="Choisir un modele" /></SelectTrigger>
                  <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerate(false)}>Annuler</Button>
              <Button onClick={handleGenerateAll} disabled={!selectedTemplateId || generating} className="gap-1.5" data-testid="confirm-generate-cards">
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generer ({students.length})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={v => { setShowPreview(v); if (!v) setPreviewCardId(null); }}>
          <DialogContent className="max-w-[600px]" data-testid="card-preview-dialog">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Carte etudiant</DialogTitle>
            </DialogHeader>
            {previewStudent && previewStudent.card && (
              <div className="space-y-4">
                {/* Card recto */}
                <div className="rounded-xl overflow-hidden shadow-lg border" style={{ backgroundColor: '#fff', width: '100%', maxWidth: 500, margin: '0 auto', aspectRatio: '500/260' }}>
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    {/* Top band */}
                    <div style={{ backgroundColor: '#1a1a2e', height: 50, display: 'flex', alignItems: 'center', paddingLeft: 20 }}>
                      <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' as const, fontFamily: 'Helvetica' }}>{establishment?.name}</span>
                    </div>
                    <div style={{ padding: '10px 20px' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', letterSpacing: 3, marginBottom: 10 }}>CARTE ETUDIANT</p>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ width: 90, height: 108, borderRadius: 6, border: '2px solid #e2e8f0', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {previewStudent.avatar_url ? <img src={previewStudent.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users className="h-8 w-8 text-gray-300" />}
                        </div>
                        <div style={{ flex: 1, fontSize: 12 }}>
                          <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>{previewStudent.first_name} {previewStudent.last_name}</p>
                          <p style={{ color: '#475569', marginBottom: 2 }}>Formation : {(selectedFormation as any)?.title}</p>
                          <p style={{ color: '#475569', marginBottom: 2 }}>Niveau : {(selectedFormation as any)?.level}</p>
                          <p style={{ color: '#1a1a2e', fontWeight: 600, marginBottom: 2 }}>N : {previewStudent.card.student_number}</p>
                          <p style={{ color: '#475569' }}>Annee : {(selectedFormation as any)?.academic_year}</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#f1f5f9', padding: '6px 0', textAlign: 'center' as const, fontSize: 10, color: '#64748b' }}>
                      Valide du {format(new Date(previewStudent.card.valid_from), 'dd/MM/yyyy')} au {format(new Date(previewStudent.card.valid_until), 'dd/MM/yyyy')}
                    </div>
                  </div>
                </div>

                {/* Card verso */}
                <div className="rounded-xl overflow-hidden shadow-lg border" style={{ backgroundColor: '#fff', width: '100%', maxWidth: 500, margin: '0 auto' }}>
                  <div style={{ backgroundColor: '#1a1a2e', height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' as const }}>CARTE D'ETUDIANT DES METIERS</span>
                  </div>
                  <div style={{ padding: 20, textAlign: 'center' as const }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                      <QRCode value={`${window.location.origin}/verify-card/${previewStudent.card.verification_code}`} size={110} />
                    </div>
                    <p style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic', marginBottom: 12 }}>Scannez le QR code pour verifier cette carte</p>
                    <p style={{ fontSize: 8, color: '#94a3b8', lineHeight: 1.4 }}>
                      Cette carte est strictement personnelle et incessible. Elle atteste de la qualite d'etudiant du titulaire et doit etre presentee sur demande.
                    </p>
                  </div>
                </div>

                {/* Wallet buttons */}
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="sm" className="gap-2 h-9 text-xs" onClick={() => {
                    const url = studentCardService.generateGoogleWalletUrl(previewStudent.card, previewStudent, selectedFormation, establishment);
                    window.open(url, '_blank');
                  }} data-testid="add-google-wallet">
                    <Wallet className="h-4 w-4" /> Ajouter a Google Wallet
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 h-9 text-xs" onClick={() => toast.info('Apple Wallet necessite une configuration serveur. Contactez le support.')} data-testid="add-apple-wallet">
                    <Smartphone className="h-4 w-4" /> Ajouter a Apple Wallet
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setShowPreview(false)}>Fermer</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============ Level 1 & 2: Formations list ============
  return (
    <div className="space-y-4" data-testid="card-formations-list">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><CreditCard className="h-5 w-5 text-primary" /></div>
          <div>
            <h2 className="font-semibold">Gestion des cartes etudiantes</h2>
            <p className="text-xs text-muted-foreground">Selectionnez une formation pour gerer les cartes</p>
          </div>
        </CardContent>
      </Card>

      {formations.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" data-testid="card-search" />
        </div>
      )}

      {filteredPrograms.length === 0 ? (
        <EmptyState icon={CreditCard} title="Aucune formation" description="Les formations apparaitront ici." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map(name => {
            const group = formationGroups[name];
            const first = group[0];
            const totalStudents = group.reduce((sum: number, f: any) => sum + (studentCounts[f.id] || 0), 0);
            return (
              <Card key={name} className="hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer group overflow-hidden"
                onClick={() => { if (group.length === 1) { setSelectedFormationId(group[0].id); setSelectedProgramName(name); } else setSelectedProgramName(name); }}
                data-testid={`card-formation-${name}`}>
                <div className="h-1.5" style={{ backgroundColor: first.color || '#6366f1' }} />
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${getLevelColor(first.level)} text-[10px]`}>{first.level}</Badge>
                    <Badge variant="outline" className="text-[10px]">{group.length} promotion{group.length > 1 ? 's' : ''}</Badge>
                  </div>
                  <h3 className="font-semibold text-sm">{name}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span><Users className="h-3 w-3 inline mr-1" />{totalStudents} etudiant(s)</span>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-xs text-primary font-medium group-hover:underline flex items-center gap-1">
                      {group.length === 1 ? 'Gerer les cartes' : 'Voir les promotions'} <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Promotions dialog */}
      {selectedProgramName && !selectedFormationId && (
        <Dialog open={true} onOpenChange={() => setSelectedProgramName(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>{selectedProgramName} — Promotions</DialogTitle></DialogHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(formationGroups[selectedProgramName] || []).map((f: any) => (
                <Card key={f.id} className="cursor-pointer hover:ring-2 hover:ring-primary/30" onClick={() => setSelectedFormationId(f.id)}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {f.academic_year && <Badge variant="outline" className="text-[10px]"><Calendar className="h-3 w-3 mr-1" />{f.academic_year}</Badge>}
                        <Badge className={`${getLevelColor(f.level)} text-[10px]`}>{f.level}</Badge>
                      </div>
                      <p className="text-sm font-medium">{f.title}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StudentCardManagement;
