import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Save, Palette, FolderKanban, Settings2, PenTool, Upload, Eraser,
  Plus, X, ArrowUp, ArrowDown, Trash2, Stamp, UserCircle2, Image as ImageIcon, Pencil,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  getTranscriptTemplate,
  upsertTranscriptTemplate,
  linkTemplateToFormation,
  getGradingRules,
  upsertGradingRules,
  getEstablishmentSignatories,
  upsertEstablishmentSignatory,
  deleteEstablishmentSignatory,
  type EstablishmentSignatory,
} from '@/services/gradesService';
import { fileUploadService } from '@/services/fileUploadService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// ----- Types ---------------------------------------------------------------

interface DisplayConfig {
  showLogo: boolean;
  showRank: boolean;
  showECTS: boolean;
  showSubjectAppreciation: boolean;
  showJuryAppreciation: boolean;
  showSignatures: boolean;
  showQRCode: boolean;
  showBulletinNumber: boolean;
}

interface ColumnsDisplay {
  cc: boolean;
  ds: boolean;
  exam: boolean;
  oral: boolean;
  moyenne: boolean;
  coefficient: boolean;
  points: boolean;
  status: boolean;
}

interface CategoryBlock {
  id: string;
  title: string;
  color: string;
  moduleIds: string[];
}

interface CalcConfig {
  mode: 'simple' | 'ponderee' | 'ects' | 'points';
  ccWeight: 'equal' | 'weighted_x2' | 'weighted_x05';
  oralWeight: 'equal' | 'weighted_x2' | 'weighted_x05';
  validationThreshold: number;
  passingThreshold: number;
  mentionPassable: number;
  mentionAB: number;
  mentionBien: number;
  mentionTB: number;
  mentionFelicitations: number;
  ectsEnabled: boolean;
  ectsTotalSemester: number;
  ectsDefaultPerModule: number;
  ectsRule: 'on_validation' | 'on_average';
  compensationEnabled: boolean;
  compensationScope: 'all' | 'within_block';
  compensationFloor: number;
  compensationBetweenSemesters: boolean;
  rattrapageEnabled: boolean;
  rattrapageThreshold: number;
}

const PRIMARY_COLORS = ['#0F172A', '#1E40AF', '#7C3AED', '#06B6D4', '#0F766E', '#9A3412', '#0B1220'];
const ACCENT_COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#FBBF24', '#EC4899'];
const CAT_COLORS = ['#3B82F6', '#10B981', '#F97316', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];
const FONTS = [
  { value: 'Inter', label: 'Inter (moderne)' },
  { value: 'Segoe UI', label: 'Segoe UI' },
  { value: 'Georgia', label: 'Georgia (élégant)' },
  { value: 'Times New Roman', label: 'Times New Roman' },
];
const FONT_SIZES = [
  { value: 'sm', label: 'Petite' },
  { value: 'md', label: 'Moyenne (standard)' },
  { value: 'lg', label: 'Grande' },
];

const DEFAULT_DISPLAY: DisplayConfig = {
  showLogo: true, showRank: true, showECTS: true,
  showSubjectAppreciation: true, showJuryAppreciation: true,
  showSignatures: true, showQRCode: false, showBulletinNumber: true,
};
const DEFAULT_COLUMNS: ColumnsDisplay = {
  cc: true, ds: true, exam: true, oral: true,
  moyenne: true, coefficient: false, points: false, status: true,
};
const DEFAULT_CALC: CalcConfig = {
  mode: 'simple', ccWeight: 'equal', oralWeight: 'equal',
  validationThreshold: 10, passingThreshold: 10,
  mentionPassable: 10, mentionAB: 12, mentionBien: 14, mentionTB: 16, mentionFelicitations: 18,
  ectsEnabled: true, ectsTotalSemester: 30, ectsDefaultPerModule: 3, ectsRule: 'on_validation',
  compensationEnabled: true, compensationScope: 'all', compensationFloor: 6,
  compensationBetweenSemesters: false, rattrapageEnabled: true, rattrapageThreshold: 8,
};

// ============================================================================

interface Props {
  formationId: string;
  establishmentId: string;
  formationTitle?: string;
}

const BulletinConfigurationPanel: React.FC<Props> = ({ formationId, establishmentId, formationTitle }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('style');
  const [saving, setSaving] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);

  // Style config
  const [primaryColor, setPrimaryColor] = useState(PRIMARY_COLORS[0]);
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0]);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState('md');
  const [display, setDisplay] = useState<DisplayConfig>(DEFAULT_DISPLAY);
  const [columns, setColumns] = useState<ColumnsDisplay>(DEFAULT_COLUMNS);

  // Categories
  const [categories, setCategories] = useState<CategoryBlock[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(CAT_COLORS[0]);

  // Calc config
  const [calc, setCalc] = useState<CalcConfig>(DEFAULT_CALC);

  // Modules to assign in categories
  const { data: modules = [] } = useQuery({
    queryKey: ['formation-modules-config', formationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, coefficient, order_index')
        .eq('formation_id', formationId)
        .order('order_index');
      return data || [];
    },
    enabled: !!formationId,
  });

  // Existing template
  const { data: existingTemplate } = useQuery({
    queryKey: ['transcript-template', formationId],
    queryFn: () => getTranscriptTemplate(formationId),
    enabled: !!formationId,
  });

  // Existing rules
  const { data: existingRules } = useQuery({
    queryKey: ['grading-rules-config', formationId],
    queryFn: () => getGradingRules(formationId),
    enabled: !!formationId,
  });

  // Load template
  useEffect(() => {
    if (existingTemplate) {
      setTemplateId(existingTemplate.id);
      const sc: any = existingTemplate.style_config || {};
      if (sc.primaryColor) setPrimaryColor(sc.primaryColor);
      if (sc.accentColor) setAccentColor(sc.accentColor);
      if (sc.fontFamily) setFontFamily(sc.fontFamily);
      if (sc.fontSize) setFontSize(sc.fontSize);
      if (sc.display) setDisplay({ ...DEFAULT_DISPLAY, ...sc.display });
      if (sc.columns) setColumns({ ...DEFAULT_COLUMNS, ...sc.columns });
      const cc: any = existingTemplate.columns_config || {};
      if (Array.isArray(cc.sections) && cc.sections.length > 0) {
        setCategories(
          cc.sections.map((s: any, i: number) => ({
            id: s.id || `cat-${i}`,
            title: s.title || 'Catégorie',
            color: s.color || CAT_COLORS[i % CAT_COLORS.length],
            moduleIds: s.moduleIds || [],
          }))
        );
      }
    }
  }, [existingTemplate]);

  // Load rules
  useEffect(() => {
    if (existingRules) {
      setCalc((prev) => ({
        ...prev,
        validationThreshold: existingRules.validation_threshold ?? prev.validationThreshold,
        mentionPassable: existingRules.mention_passable_threshold ?? prev.mentionPassable,
        mentionAB: existingRules.mention_ab_threshold ?? prev.mentionAB,
        mentionBien: existingRules.mention_bien_threshold ?? prev.mentionBien,
        mentionTB: existingRules.mention_tb_threshold ?? prev.mentionTB,
        compensationEnabled: existingRules.allow_compensation ?? prev.compensationEnabled,
        compensationFloor: existingRules.compensation_threshold ?? prev.compensationFloor,
        ectsEnabled: existingRules.credits_system === 'ects',
        ectsTotalSemester: existingRules.credits_per_semester ?? prev.ectsTotalSemester,
      }));
    }
  }, [existingRules]);

  // ----- Categories handlers ------------------------------------------------
  const addCategory = () => {
    const title = newCatName.trim();
    if (!title) return toast.error('Nom de la catégorie requis');
    setCategories((prev) => [...prev, { id: `cat-${Date.now()}`, title, color: newCatColor, moduleIds: [] }]);
    setNewCatName('');
    setNewCatColor(CAT_COLORS[0]);
  };
  const removeCategory = (id: string) => setCategories((prev) => prev.filter((c) => c.id !== id));
  const moveCategory = (idx: number, dir: -1 | 1) => {
    setCategories((prev) => {
      const next = [...prev];
      const tgt = idx + dir;
      if (tgt < 0 || tgt >= next.length) return prev;
      [next[idx], next[tgt]] = [next[tgt], next[idx]];
      return next;
    });
  };
  const addModuleToCategory = (catId: string, moduleId: string) => {
    if (!moduleId) return;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, moduleIds: c.moduleIds.includes(moduleId) ? c.moduleIds : [...c.moduleIds, moduleId] }
          : c
      )
    );
  };
  const removeModuleFromCategory = (catId: string, moduleId: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, moduleIds: c.moduleIds.filter((id) => id !== moduleId) } : c))
    );
  };

  const totalAssignedModules = useMemo(
    () => new Set(categories.flatMap((c) => c.moduleIds)).size,
    [categories]
  );

  // ----- Save ---------------------------------------------------------------
  const handleSave = async () => {
    setSaving(true);
    try {
      const styleCfg: any = { primaryColor, accentColor, fontFamily, fontSize, display, columns };
      const colCfg: any = {
        sections: categories.map((c) => ({ id: c.id, title: c.title, color: c.color, moduleIds: c.moduleIds })),
        ccColumns: ['moyenne_stagiaire', 'moyenne_classe', 'appreciation'],
        examColumns: ['notes', 'coefficient', 'points'],
        showExamSection: columns.exam,
      };
      const saved = await upsertTranscriptTemplate({
        id: templateId || undefined,
        name: 'Configuration bulletin',
        establishment_id: establishmentId,
        template_type: 'bulletin',
        is_active: true,
        columns_config: colCfg,
        header_config: { title: 'Bulletin de notes', showLogo: display.showLogo, showSession: true, subtitle: '' },
        footer_config: { showAssiduity: false, customText: '', showSignature: display.showSignatures },
        style_config: styleCfg,
      });
      await linkTemplateToFormation(formationId, saved.id);

      await upsertGradingRules({
        formation_id: formationId,
        validation_threshold: calc.validationThreshold,
        allow_compensation: calc.compensationEnabled,
        compensation_threshold: calc.compensationFloor,
        credits_system: calc.ectsEnabled ? 'ects' : 'none',
        credits_per_semester: calc.ectsTotalSemester,
        mention_passable_threshold: calc.mentionPassable,
        mention_ab_threshold: calc.mentionAB,
        mention_bien_threshold: calc.mentionBien,
        mention_tb_threshold: calc.mentionTB,
      });

      queryClient.invalidateQueries({ queryKey: ['transcript-template', formationId] });
      queryClient.invalidateQueries({ queryKey: ['grading-rules-config', formationId] });
      toast.success('Configuration sauvegardée');
    } catch (err: any) {
      toast.error('Erreur : ' + (err.message || 'sauvegarde impossible'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-card rounded-2xl border-2 border-primary/20 shadow-sm p-5 sm:p-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow">
            E
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Configuration avancée</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Personnalisation du bulletin de notes{formationTitle ? ` — ${formationTitle}` : ''}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-5 rounded-xl shadow-md"
          data-testid="config-save-btn"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Sauvegarde…' : 'Enregistrer'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent p-0 h-auto border-b border-border w-full justify-start rounded-none gap-6">
          <TabsTrigger value="style" className="gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none pb-3 px-1">
            <Palette className="h-4 w-4 text-rose-500" /> Style du bulletin
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none pb-3 px-1">
            <FolderKanban className="h-4 w-4 text-amber-500" /> Catégories & Blocs
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none pb-3 px-1">
            <Settings2 className="h-4 w-4 text-violet-500" /> Règles de calcul
          </TabsTrigger>
          <TabsTrigger value="signatures" className="gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none pb-3 px-1">
            <PenTool className="h-4 w-4 text-emerald-500" /> Signatures & Cachets
          </TabsTrigger>
        </TabsList>

        {/* TAB 1 — STYLE */}
        <TabsContent value="style" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Apparence */}
            <Card className="rounded-2xl">
              <CardContent className="p-5 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-rose-500 flex items-center gap-2"><Palette className="h-4 w-4" /> Apparence générale</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Couleurs et charte graphique du bulletin</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Couleur principale</Label>
                  <div className="flex flex-wrap gap-2">
                    {PRIMARY_COLORS.map((c) => (
                      <button key={c} onClick={() => setPrimaryColor(c)}
                        className={`h-9 w-9 rounded-full transition-all ${primaryColor === c ? 'ring-2 ring-offset-2 ring-amber-400 scale-110' : 'hover:scale-105'}`}
                        style={{ background: c }} data-testid={`primary-color-${c}`} />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Couleur d'accent</Label>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_COLORS.map((c) => (
                      <button key={c} onClick={() => setAccentColor(c)}
                        className={`h-9 w-9 rounded-full transition-all ${accentColor === c ? 'ring-2 ring-offset-2 ring-amber-400 scale-110' : 'hover:scale-105'}`}
                        style={{ background: c }} data-testid={`accent-color-${c}`} />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Police du bulletin</Label>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONTS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Taille du texte</Label>
                    <Select value={fontSize} onValueChange={setFontSize}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONT_SIZES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Éléments à afficher */}
            <Card className="rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-violet-500 flex items-center gap-2">● Éléments à afficher</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Choisissez ce qui apparaîtra sur le bulletin</p>
                </div>

                {[
                  { k: 'showLogo', l: "Logo / Cachet de l'établissement" },
                  { k: 'showRank', l: 'Rang dans la promotion' },
                  { k: 'showECTS', l: 'Crédits ECTS' },
                  { k: 'showSubjectAppreciation', l: 'Appréciation par matière' },
                  { k: 'showJuryAppreciation', l: 'Appréciation générale du jury' },
                  { k: 'showSignatures', l: 'Zone de signatures' },
                  { k: 'showQRCode', l: 'Code de vérification / QR' },
                  { k: 'showBulletinNumber', l: 'Numéro de référence du bulletin' },
                ].map((it) => (
                  <div key={it.k} className="flex items-center justify-between border-b border-border/50 pb-3">
                    <span className="text-sm">{it.l}</span>
                    <Switch
                      checked={(display as any)[it.k]}
                      onCheckedChange={(v) => setDisplay({ ...display, [it.k]: v } as DisplayConfig)}
                      data-testid={`display-${it.k}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Disposition des colonnes */}
            <Card className="rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">▤ Disposition des colonnes</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Colonnes visibles dans le tableau des notes</p>
                </div>

                {[
                  { k: 'cc', l: 'Contrôle Continu (CC)' },
                  { k: 'ds', l: 'Devoir Surveillé (DS)' },
                  { k: 'exam', l: 'Examen Final' },
                  { k: 'oral', l: 'Oral / Soutenance' },
                  { k: 'moyenne', l: 'Moyenne par matière' },
                  { k: 'coefficient', l: 'Coefficient' },
                  { k: 'points', l: 'Points (note × coef)' },
                  { k: 'status', l: 'Statut (Validé / Ajourné)' },
                ].map((it) => (
                  <div key={it.k} className="flex items-center justify-between border-b border-border/50 pb-3">
                    <span className="text-sm">{it.l}</span>
                    <Switch
                      checked={(columns as any)[it.k]}
                      onCheckedChange={(v) => setColumns({ ...columns, [it.k]: v } as ColumnsDisplay)}
                      data-testid={`column-${it.k}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Aperçu */}
            <Card className="rounded-2xl">
              <CardContent className="p-5">
                <h3 className="text-sm font-bold text-cyan-600 flex items-center gap-2 mb-3">▦ Aperçu du bulletin</h3>
                <p className="text-[11px] text-muted-foreground mb-3">Rendu en temps réel selon vos paramètres</p>
                <div className="rounded-xl border-2 border-border overflow-hidden text-[11px]" style={{ fontFamily }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ background: primaryColor, color: '#fff' }}>
                    <div className="flex items-center gap-2">
                      {display.showLogo && (
                        <div className="h-9 w-9 rounded-md flex items-center justify-center font-bold text-sm" style={{ background: accentColor }}>
                          E
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-sm">{formationTitle || 'Établissement'}</div>
                        <div className="opacity-80 text-[9px]">École Supérieure Privée</div>
                      </div>
                    </div>
                    <div className="text-[9px] font-bold px-2 py-1 rounded" style={{ background: accentColor }}>BULLETIN</div>
                  </div>
                  <table className="w-full text-[10px]">
                    <thead style={{ background: primaryColor, color: '#fff' }}>
                      <tr>
                        <th className="text-left p-2">Matière</th>
                        {columns.cc && <th className="p-2">CC</th>}
                        {columns.ds && <th className="p-2">DS</th>}
                        {columns.exam && <th className="p-2">Exam</th>}
                        {columns.oral && <th className="p-2">Oral</th>}
                        {columns.moyenne && <th className="p-2">Moy.</th>}
                        {columns.status && <th className="p-2">Statut</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {['Mathématiques', 'Gestion', 'Anglais'].map((s, i) => (
                        <tr key={s} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                          <td className="p-2 font-medium">{s}</td>
                          {columns.cc && <td className="text-center p-2">14</td>}
                          {columns.ds && <td className="text-center p-2">12</td>}
                          {columns.exam && <td className="text-center p-2">15</td>}
                          {columns.oral && <td className="text-center p-2 text-muted-foreground">—</td>}
                          {columns.moyenne && <td className="text-center p-2 font-bold" style={{ color: primaryColor }}>13.67</td>}
                          {columns.status && <td className="text-center p-2"><span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[9px] font-semibold">Validé</span></td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(display.showRank || display.showECTS) && (
                    <div className="text-right text-[9px] text-muted-foreground p-2 border-t">
                      {display.showRank && 'Rang : 2/45 · '}{display.showECTS && 'ECTS : 30'}
                    </div>
                  )}
                  {display.showJuryAppreciation && (
                    <div className="px-3 py-2 text-[10px] italic text-muted-foreground" style={{ background: `${accentColor}15` }}>
                      Appréciation : Élève sérieux.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2 — CATEGORIES */}
        <TabsContent value="categories" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
            {/* Left : new category */}
            <div className="space-y-4">
              <Card className="rounded-2xl">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-bold text-violet-500 flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Nouvelle catégorie
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Bloc ou section de matières</p>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nom de la catégorie</Label>
                    <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Ex: Matières scientifiques" data-testid="new-cat-name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Couleur</Label>
                    <div className="flex flex-wrap gap-2">
                      {CAT_COLORS.map((c) => (
                        <button key={c} onClick={() => setNewCatColor(c)}
                          className={`h-7 w-7 rounded-full transition-all ${newCatColor === c ? 'ring-2 ring-offset-2 ring-foreground' : 'hover:scale-105'}`}
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <Button onClick={addCategory} className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-5" data-testid="add-category-btn">
                    Créer la catégorie
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="p-5 space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">📋 Résumé</h3>
                  <p className="font-semibold mt-2">{categories.length} catégorie{categories.length !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-muted-foreground">{totalAssignedModules} matière{totalAssignedModules !== 1 ? 's' : ''} au total</p>
                  <div className="space-y-1.5 mt-3">
                    {categories.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                          {c.title}
                        </span>
                        <span className="text-muted-foreground">{c.moduleIds.length} mat.</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right : list of categories */}
            <div className="space-y-4">
              {categories.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="p-10 text-center text-sm text-muted-foreground">
                    Aucune catégorie. Créez-en une pour regrouper vos matières.
                  </CardContent>
                </Card>
              ) : (
                categories.map((cat, idx) => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    modules={modules}
                    onMoveUp={() => moveCategory(idx, -1)}
                    onMoveDown={() => moveCategory(idx, 1)}
                    onRemove={() => removeCategory(cat.id)}
                    onAddModule={(modId) => addModuleToCategory(cat.id, modId)}
                    onRemoveModule={(modId) => removeModuleFromCategory(cat.id, modId)}
                  />
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 3 — RULES */}
        <TabsContent value="rules" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Mode de calcul */}
            <Card className="rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-violet-500 flex items-center gap-2"><Settings2 className="h-4 w-4" /> Mode de calcul</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Méthode de calcul des moyennes</p>
                </div>
                {[
                  { v: 'simple', l: 'Moyenne simple (toutes épreuves égales)' },
                  { v: 'ponderee', l: 'Moyenne pondérée (par coefficient)' },
                  { v: 'ects', l: 'Système ECTS (crédits européens)' },
                  { v: 'points', l: 'Système de points bruts' },
                ].map((opt) => (
                  <label
                    key={opt.v}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      calc.mode === opt.v ? 'border-violet-400 bg-violet-50/40 dark:bg-violet-900/10 shadow-sm' : 'border-border hover:bg-muted/30'
                    }`}
                    data-testid={`calc-mode-${opt.v}`}
                  >
                    <input type="radio" name="calc-mode" checked={calc.mode === opt.v}
                      onChange={() => setCalc({ ...calc, mode: opt.v as CalcConfig['mode'] })} className="accent-violet-500" />
                    <span className="text-sm">{opt.l}</span>
                  </label>
                ))}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Poids du CC</Label>
                    <Select value={calc.ccWeight} onValueChange={(v) => setCalc({ ...calc, ccWeight: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equal">Égal aux autres épreuves</SelectItem>
                        <SelectItem value="weighted_x2">Poids ×2</SelectItem>
                        <SelectItem value="weighted_x05">Poids ×0.5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Poids de l'oral / soutenance</Label>
                    <Select value={calc.oralWeight} onValueChange={(v) => setCalc({ ...calc, oralWeight: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equal">Égal aux autres épreuves</SelectItem>
                        <SelectItem value="weighted_x2">Poids ×2</SelectItem>
                        <SelectItem value="weighted_x05">Poids ×0.5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seuils */}
            <Card className="rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">🔖 Seuils de passage</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Notes minimales pour valider une matière ou l'année</p>
                </div>
                {[
                  { k: 'validationThreshold', l: 'Note minimale de validation matière' },
                  { k: 'passingThreshold', l: 'Moyenne générale de passage' },
                  { k: 'mentionPassable', l: 'Seuil pour mention Passable' },
                  { k: 'mentionAB', l: 'Seuil pour mention Assez Bien' },
                  { k: 'mentionBien', l: 'Seuil pour mention Bien' },
                  { k: 'mentionTB', l: 'Seuil pour mention Très Bien' },
                  { k: 'mentionFelicitations', l: 'Seuil pour mention Félicitations' },
                ].map((it) => (
                  <div key={it.k} className="flex items-center justify-between gap-3 border-b border-border/40 pb-3">
                    <span className="text-sm">{it.l}</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number" step={0.5} min={0} max={20}
                        value={(calc as any)[it.k]}
                        onChange={(e) => setCalc({ ...calc, [it.k]: parseFloat(e.target.value) || 0 } as CalcConfig)}
                        className="w-16 h-9 text-center"
                        data-testid={`rule-${it.k}`}
                      />
                      <span className="text-xs text-muted-foreground">/20</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ECTS */}
            <Card className="rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-rose-500 flex items-center gap-2">🎓 Crédits ECTS</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Paramètres du système européen de crédits</p>
                </div>
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <span className="text-sm">Activer les crédits ECTS</span>
                  <Switch checked={calc.ectsEnabled} onCheckedChange={(v) => setCalc({ ...calc, ectsEnabled: v })} />
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-3">
                  <span className="text-sm">Crédits totaux du semestre</span>
                  <div className="flex items-center gap-1">
                    <Input type="number" min={0} value={calc.ectsTotalSemester}
                      onChange={(e) => setCalc({ ...calc, ectsTotalSemester: parseInt(e.target.value) || 0 })}
                      className="w-20 h-9 text-center" />
                    <span className="text-xs text-muted-foreground">crédits</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-3">
                  <span className="text-sm">Crédits par défaut par matière</span>
                  <div className="flex items-center gap-1">
                    <Input type="number" min={0} value={calc.ectsDefaultPerModule}
                      onChange={(e) => setCalc({ ...calc, ectsDefaultPerModule: parseInt(e.target.value) || 0 })}
                      className="w-20 h-9 text-center" />
                    <span className="text-xs text-muted-foreground">crédits</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm">Règle d'acquisition ECTS</span>
                  <Select value={calc.ectsRule} onValueChange={(v) => setCalc({ ...calc, ectsRule: v as any })}>
                    <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_validation">Si note ≥ seuil de validation</SelectItem>
                      <SelectItem value="on_average">Si moyenne ≥ seuil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Compensation */}
            <Card className="rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">⚖ Règles de compensation</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Comment les bonnes notes compensent les mauvaises</p>
                </div>
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <span className="text-sm">Activer la compensation entre matières</span>
                  <Switch checked={calc.compensationEnabled} onCheckedChange={(v) => setCalc({ ...calc, compensationEnabled: v })} />
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-3">
                  <span className="text-sm">Périmètre de compensation</span>
                  <Select value={calc.compensationScope} onValueChange={(v) => setCalc({ ...calc, compensationScope: v as any })}>
                    <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes matières confondues</SelectItem>
                      <SelectItem value="within_block">Dans la même catégorie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-3">
                  <span className="text-sm">Note plancher (pas de compensation en dessous)</span>
                  <div className="flex items-center gap-1">
                    <Input type="number" step={0.5} min={0} max={20} value={calc.compensationFloor}
                      onChange={(e) => setCalc({ ...calc, compensationFloor: parseFloat(e.target.value) || 0 })}
                      className="w-16 h-9 text-center" />
                    <span className="text-xs text-muted-foreground">/20</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <span className="text-sm">Compensation entre semestres</span>
                  <Switch checked={calc.compensationBetweenSemesters} onCheckedChange={(v) => setCalc({ ...calc, compensationBetweenSemesters: v })} />
                </div>
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <span className="text-sm">Rattrapage autorisé si moy. ≥ seuil</span>
                  <Switch checked={calc.rattrapageEnabled} onCheckedChange={(v) => setCalc({ ...calc, rattrapageEnabled: v })} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm">Seuil minimum pour accès rattrapage</span>
                  <div className="flex items-center gap-1">
                    <Input type="number" step={0.5} min={0} max={20} value={calc.rattrapageThreshold}
                      onChange={(e) => setCalc({ ...calc, rattrapageThreshold: parseFloat(e.target.value) || 0 })}
                      className="w-16 h-9 text-center" />
                    <span className="text-xs text-muted-foreground">/20</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Récapitulatif */}
          <div className="mt-5 rounded-2xl bg-primary p-5 text-primary-foreground">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">📌 Récapitulatif des règles actives</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="opacity-70 uppercase tracking-wider text-[10px]">Mode calcul</p>
                <p className="font-semibold text-amber-300 text-sm capitalize mt-0.5">{calc.mode === 'simple' ? 'Moyenne simple' : calc.mode === 'ponderee' ? 'Pondérée' : calc.mode === 'ects' ? 'ECTS' : 'Points bruts'}</p>
              </div>
              <div>
                <p className="opacity-70 uppercase tracking-wider text-[10px]">Seuil validation</p>
                <p className="font-semibold text-amber-300 text-sm mt-0.5">≥ {calc.validationThreshold}/20</p>
              </div>
              <div>
                <p className="opacity-70 uppercase tracking-wider text-[10px]">Seuil passage</p>
                <p className="font-semibold text-amber-300 text-sm mt-0.5">≥ {calc.passingThreshold}/20</p>
              </div>
              <div>
                <p className="opacity-70 uppercase tracking-wider text-[10px]">Compensation</p>
                <p className="font-semibold text-amber-300 text-sm mt-0.5">{calc.compensationEnabled ? 'Activée' : 'Désactivée'}</p>
              </div>
              <div>
                <p className="opacity-70 uppercase tracking-wider text-[10px]">ECTS</p>
                <p className="font-semibold text-amber-300 text-sm mt-0.5">{calc.ectsEnabled ? `${calc.ectsTotalSemester} crédits/sem.` : '—'}</p>
              </div>
              <div>
                <p className="opacity-70 uppercase tracking-wider text-[10px]">Rattrapage</p>
                <p className="font-semibold text-amber-300 text-sm mt-0.5">{calc.rattrapageEnabled ? `≥ ${calc.rattrapageThreshold}/20` : '—'}</p>
              </div>
              <div>
                <p className="opacity-70 uppercase tracking-wider text-[10px]">Mention TB</p>
                <p className="font-semibold text-amber-300 text-sm mt-0.5">≥ {calc.mentionTB}/20</p>
              </div>
              <div>
                <p className="opacity-70 uppercase tracking-wider text-[10px]">Félicitations</p>
                <p className="font-semibold text-amber-300 text-sm mt-0.5">≥ {calc.mentionFelicitations}/20</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 4 — SIGNATURES */}
        <TabsContent value="signatures" className="mt-5">
          <SignatoriesManager establishmentId={establishmentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ============================================================================
// CATEGORY CARD
// ============================================================================
const CategoryCard: React.FC<{
  category: CategoryBlock;
  modules: any[];
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onAddModule: (id: string) => void;
  onRemoveModule: (id: string) => void;
}> = ({ category, modules, onMoveUp, onMoveDown, onRemove, onAddModule, onRemoveModule }) => {
  const [pickModule, setPickModule] = useState('');
  const availableModules = modules.filter((m: any) => !category.moduleIds.includes(m.id));
  const assigned = modules.filter((m: any) => category.moduleIds.includes(m.id));
  const tone = category.color;

  return (
    <Card className="rounded-2xl border-2" style={{ borderColor: `${tone}40` }} data-testid={`category-card-${category.id}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-base font-bold text-primary flex items-center gap-2">
            <span className="h-3 w-3 rounded-full shrink-0" style={{ background: tone }} />
            {category.title}
          </h4>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onMoveUp} className="h-7 w-7 p-0"><ArrowUp className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={onMoveDown} className="h-7 w-7 p-0"><ArrowDown className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={onRemove} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"><X className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {assigned.map((m: any) => (
            <span key={m.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: `${tone}15`, color: tone, border: `1px solid ${tone}40` }}>
              {m.title}
              <button onClick={() => onRemoveModule(m.id)} className="text-destructive hover:text-destructive/80" data-testid={`remove-mod-${m.id}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Select value={pickModule} onValueChange={setPickModule}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Ajouter une matière..." /></SelectTrigger>
            <SelectContent>
              {availableModules.length === 0 ? (
                <div className="text-xs text-muted-foreground px-2 py-1">Toutes les matières sont déjà ajoutées</div>
              ) : (
                availableModules.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)
              )}
            </SelectContent>
          </Select>
          <Button
            onClick={() => { if (pickModule) { onAddModule(pickModule); setPickModule(''); } }}
            disabled={!pickModule}
            className="gap-1.5 text-white rounded-xl"
            style={{ background: tone }}
            data-testid={`add-mod-${category.id}`}
          >
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// SIGNATORIES MANAGER (custom, flexible)
// ============================================================================
const SignatoriesManager: React.FC<{ establishmentId: string }> = ({ establishmentId }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EstablishmentSignatory | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: signatories = [] } = useQuery({
    queryKey: ['establishment-signatories', establishmentId],
    queryFn: () => getEstablishmentSignatories(establishmentId),
    enabled: !!establishmentId,
  });

  const upsertMut = useMutation({
    mutationFn: (payload: Partial<EstablishmentSignatory>) =>
      upsertEstablishmentSignatory({ ...payload, establishment_id: establishmentId, role_label: payload.role_label || 'Responsable' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['establishment-signatories', establishmentId] });
      toast.success('Signataire enregistré');
      setEditing(null);
      setCreating(false);
    },
    onError: (e: any) => toast.error(e?.message || 'Erreur'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteEstablishmentSignatory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['establishment-signatories', establishmentId] });
      toast.success('Signataire supprimé');
    },
    onError: (e: any) => toast.error(e?.message || 'Erreur'),
  });

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-emerald-600 flex items-center gap-2"><PenTool className="h-4 w-4" /> Signatures et cachets</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Définissez les signataires personnalisés de votre établissement (responsable pédagogique, directeur, cachet officiel, etc.).
                Ils apparaîtront en bas des bulletins de notes.
              </p>
            </div>
            <Button onClick={() => setCreating(true)} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl" data-testid="add-signatory-btn">
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          </div>

          {signatories.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-xl p-10 text-center">
              <PenTool className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucun signataire défini</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Cliquez sur "Ajouter" pour créer votre premier signataire ou cachet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {signatories.map((s) => (
                <div key={s.id} className="border-2 border-border rounded-xl overflow-hidden hover:shadow-lg transition-all" data-testid={`signatory-card-${s.id}`}>
                  <div className="h-1.5 bg-emerald-500" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                        {s.is_stamp ? <Stamp className="h-4 w-4 text-emerald-600" /> : <UserCircle2 className="h-4 w-4 text-emerald-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{s.role_label}</p>
                        {s.name && <p className="text-[11px] text-muted-foreground truncate">{s.name}</p>}
                      </div>
                    </div>

                    <div className="h-24 rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                      {s.signature_image ? (
                        <img src={s.signature_image} alt={s.role_label} className="max-h-20 max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Aucune image</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing(s)} className="flex-1 gap-1.5" data-testid={`edit-signatory-${s.id}`}>
                        <Pencil className="h-3.5 w-3.5" /> Modifier
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteMut.mutate(s.id)} className="text-destructive hover:bg-destructive/10" data-testid={`delete-signatory-${s.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(editing || creating) && (
        <SignatoryEditor
          signatory={editing || undefined}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={(payload) => upsertMut.mutate({ ...(editing || {}), ...payload, order_index: editing?.order_index ?? signatories.length })}
        />
      )}
    </div>
  );
};

// ============================================================================
// SIGNATORY EDITOR
// ============================================================================
const SignatoryEditor: React.FC<{
  signatory?: EstablishmentSignatory;
  onClose: () => void;
  onSave: (payload: Partial<EstablishmentSignatory>) => void;
}> = ({ signatory, onClose, onSave }) => {
  const [roleLabel, setRoleLabel] = useState(signatory?.role_label || '');
  const [name, setName] = useState(signatory?.name || '');
  const [isStamp, setIsStamp] = useState(signatory?.is_stamp || false);
  const [imageData, setImageData] = useState<string | null>(signatory?.signature_image || null);
  const [mode, setMode] = useState<'draw' | 'upload'>(signatory?.signature_image ? 'upload' : 'draw');
  const [uploading, setUploading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1f2937';
  }, [mode]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const evt: any = 'touches' in e ? e.touches[0] : e;
    return {
      x: ((evt.clientX - rect.left) / rect.width) * canvas.width,
      y: ((evt.clientY - rect.top) / rect.height) * canvas.height,
    };
  };
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const stopDrawing = () => setDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await fileUploadService.uploadFile(file, 'module-files');
      setImageData(url);
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!roleLabel.trim()) {
      toast.error('Le rôle / fonction est requis');
      return;
    }
    let signatureImage: string | null = imageData;
    if (mode === 'draw' && canvasRef.current) {
      signatureImage = canvasRef.current.toDataURL('image/png');
    }
    onSave({
      role_label: roleLabel.trim(),
      name: name.trim() || null,
      is_stamp: isStamp,
      signature_image: signatureImage,
      is_active: true,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0" data-testid="signatory-editor">
        <DialogHeader className="p-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-emerald-500" />
            {signatory ? 'Modifier le signataire' : 'Nouveau signataire'}
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Rôle / Fonction *</Label>
              <Input value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)} placeholder="ex: Responsable pédagogique" data-testid="signatory-role-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nom de la personne (optionnel)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Marie Dupont" data-testid="signatory-name-input" />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div className="flex items-center gap-2">
              <Stamp className="h-4 w-4 text-amber-500" />
              <span className="text-sm">Cette entrée est un cachet (pas de personne associée)</span>
            </div>
            <Switch checked={isStamp} onCheckedChange={setIsStamp} data-testid="signatory-stamp-switch" />
          </div>

          {/* Mode tabs */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
            <button onClick={() => setMode('draw')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${mode === 'draw' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}>
              <PenTool className="h-3 w-3 inline mr-1" /> Dessiner
            </button>
            <button onClick={() => setMode('upload')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${mode === 'upload' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}>
              <Upload className="h-3 w-3 inline mr-1" /> Importer une image
            </button>
          </div>

          {mode === 'draw' && (
            <div className="space-y-2">
              <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="w-full touch-none cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  data-testid="signatory-canvas"
                />
              </div>
              <Button variant="outline" size="sm" onClick={clearCanvas} className="gap-1.5">
                <Eraser className="h-3.5 w-3.5" /> Effacer
              </Button>
            </div>
          )}

          {mode === 'upload' && (
            <div className="space-y-3">
              <label className={`flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:bg-muted/30 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? (
                  <span className="text-sm">Téléversement…</span>
                ) : imageData ? (
                  <img src={imageData} alt="" className="max-h-32 object-contain" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Cliquer pour importer</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG transparent recommandé · max 5 Mo</p>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  data-testid="signatory-upload-input" />
              </label>
              {imageData && (
                <Button variant="ghost" size="sm" onClick={() => setImageData(null)} className="gap-1.5 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" /> Retirer l'image
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white" data-testid="signatory-save-btn">
            <Save className="h-4 w-4" /> Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulletinConfigurationPanel;
