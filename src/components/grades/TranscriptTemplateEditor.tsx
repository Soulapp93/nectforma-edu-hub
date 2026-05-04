import React, { useState, useEffect, useMemo, useRef } from 'react';
import DOMPurify from 'dompurify';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, GripVertical, Save, Palette, FileText, Layout, Type, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  getTranscriptTemplate,
  upsertTranscriptTemplate,
  linkTemplateToFormation,
  type TranscriptTemplateConfig,
  type TranscriptHeaderConfig,
  type TranscriptFooterConfig,
  type TranscriptStyleConfig,
} from '@/services/gradesService';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formationId: string;
  establishmentId: string;
}

const DEFAULT_COLUMNS_CONFIG: TranscriptTemplateConfig = {
  sections: [],
  ccColumns: ['moyenne_stagiaire', 'moyenne_classe', 'appreciation'],
  examColumns: ['notes', 'coefficient', 'points', 'appreciation'],
  showExamSection: true,
};

const DEFAULT_HEADER: TranscriptHeaderConfig = { title: 'Bulletin de Formation', showLogo: true, showSession: true, subtitle: '' };
const DEFAULT_FOOTER: TranscriptFooterConfig = { showAssiduity: true, customText: '', showSignature: true };
const DEFAULT_STYLE: TranscriptStyleConfig = { primaryColor: '#3b82f6', fontFamily: 'Segoe UI' };

const CC_COLUMNS = [
  { value: 'moyenne_stagiaire', label: 'Moyenne Stagiaire' },
  { value: 'moyenne_classe', label: 'Moyenne Classe' },
  { value: 'appreciation', label: 'Appreciations' },
];

const EXAM_COLUMNS = [
  { value: 'notes', label: 'Notes' },
  { value: 'coefficient', label: 'Coefficient' },
  { value: 'points', label: 'Points' },
  { value: 'appreciation', label: 'Appreciation' },
];

const TranscriptTemplateEditor: React.FC<Props> = ({ open, onOpenChange, formationId, establishmentId }) => {
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState('Modele par defaut');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [columnsConfig, setColumnsConfig] = useState<TranscriptTemplateConfig>(DEFAULT_COLUMNS_CONFIG);
  const [headerConfig, setHeaderConfig] = useState<TranscriptHeaderConfig>(DEFAULT_HEADER);
  const [footerConfig, setFooterConfig] = useState<TranscriptFooterConfig>(DEFAULT_FOOTER);
  const [styleConfig, setStyleConfig] = useState<TranscriptStyleConfig>(DEFAULT_STYLE);
  const [showPreview, setShowPreview] = useState(false);
  const [draggedSectionIdx, setDraggedSectionIdx] = useState<number | null>(null);

  const { data: modules = [] } = useQuery({
    queryKey: ['formation-modules-template', formationId],
    queryFn: async () => {
      const { data } = await supabase.from('formation_modules').select('id, title, coefficient, semester, order_index').eq('formation_id', formationId).order('order_index');
      return data || [];
    },
    enabled: open && !!formationId,
  });

  const { data: existingTemplate } = useQuery({
    queryKey: ['transcript-template', formationId],
    queryFn: () => getTranscriptTemplate(formationId),
    enabled: open && !!formationId,
  });

  useEffect(() => {
    if (existingTemplate) {
      setTemplateId(existingTemplate.id);
      setTemplateName(existingTemplate.name);
      setColumnsConfig(existingTemplate.columns_config || DEFAULT_COLUMNS_CONFIG);
      setHeaderConfig(existingTemplate.header_config || DEFAULT_HEADER);
      setFooterConfig(existingTemplate.footer_config || DEFAULT_FOOTER);
      setStyleConfig(existingTemplate.style_config || DEFAULT_STYLE);
    }
  }, [existingTemplate]);

  // Section management
  const addSection = () => {
    setColumnsConfig(prev => ({
      ...prev,
      sections: [...prev.sections, { id: `s-${Date.now()}`, title: 'Nouvelle section', moduleIds: [] }],
    }));
  };

  const removeSection = (id: string) => setColumnsConfig(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== id) }));
  const updateSectionTitle = (id: string, title: string) => setColumnsConfig(prev => ({ ...prev, sections: prev.sections.map(s => s.id === id ? { ...s, title } : s) }));

  const toggleModuleInSection = (sectionId: string, moduleId: string) => {
    setColumnsConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id !== sectionId) return s;
        const has = s.moduleIds.includes(moduleId);
        return { ...s, moduleIds: has ? s.moduleIds.filter(id => id !== moduleId) : [...s.moduleIds, moduleId] };
      }),
    }));
  };

  const toggleCC = (col: string) => setColumnsConfig(prev => ({ ...prev, ccColumns: prev.ccColumns.includes(col) ? prev.ccColumns.filter(c => c !== col) : [...prev.ccColumns, col] }));
  const toggleExam = (col: string) => setColumnsConfig(prev => ({ ...prev, examColumns: prev.examColumns.includes(col) ? prev.examColumns.filter(c => c !== col) : [...prev.examColumns, col] }));

  const assignedModuleIds = columnsConfig.sections.flatMap(s => s.moduleIds);
  const unassignedModules = modules.filter(m => !assignedModuleIds.includes(m.id));

  // Drag & Drop sections
  const moveSection = (fromIdx: number, toIdx: number) => {
    setColumnsConfig(prev => {
      const sections = [...prev.sections];
      const [moved] = sections.splice(fromIdx, 1);
      sections.splice(toIdx, 0, moved);
      return { ...prev, sections };
    });
  };

  const handleDragStart = (idx: number) => setDraggedSectionIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedSectionIdx !== null && draggedSectionIdx !== idx) {
      moveSection(draggedSectionIdx, idx);
      setDraggedSectionIdx(idx);
    }
  };
  const handleDragEnd = () => setDraggedSectionIdx(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      const saved = await upsertTranscriptTemplate({
        id: templateId || undefined,
        name: templateName,
        establishment_id: establishmentId,
        template_type: 'bulletin',
        is_active: true,
        columns_config: columnsConfig,
        header_config: headerConfig,
        footer_config: footerConfig,
        style_config: styleConfig,
      });
      await linkTemplateToFormation(formationId, saved.id);
      toast.success('Modele de bulletin sauvegarde');
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Erreur : ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Live preview
  const previewHtml = useMemo(() => {
    const pc = styleConfig.primaryColor;
    const sections = columnsConfig.sections.length > 0
      ? columnsConfig.sections.map(s => ({ title: s.title, modules: modules.filter(m => s.moduleIds.includes(m.id)) }))
      : [{ title: '', modules }];

    const ccCols = columnsConfig.ccColumns;
    const showExam = columnsConfig.showExamSection;
    const examCols = columnsConfig.examColumns;

    let ccColCount = 1 + ccCols.length; // Module + CC columns
    let examColCount = showExam ? examCols.length : 0;

    let html = `<div style="font-family:${styleConfig.fontFamily},sans-serif;font-size:11px;max-width:700px;margin:0 auto;padding:16px;">`;
    // Header
    html += `<div style="text-align:center;margin-bottom:12px;">`;
    html += `<h2 style="font-size:14px;color:${pc};margin:4px 0;">${headerConfig.title}</h2>`;
    if (headerConfig.subtitle) html += `<p style="font-size:11px;color:#666;margin:2px 0;">${headerConfig.subtitle}</p>`;
    html += `<p style="font-size:10px;color:#999;">Etudiant: Jean DUPONT &bull; Formation: Exemple</p>`;
    html += `</div>`;

    // Table
    html += `<table style="width:100%;border-collapse:collapse;font-size:10px;">`;
    // Header row
    html += `<tr style="background:${pc};color:#fff;">`;
    html += `<th style="padding:4px 6px;text-align:left;border:1px solid ${pc};">Matiere</th>`;
    if (ccCols.includes('moyenne_stagiaire')) html += `<th style="padding:4px;text-align:center;border:1px solid ${pc};">Moy. Stag.</th>`;
    if (ccCols.includes('moyenne_classe')) html += `<th style="padding:4px;text-align:center;border:1px solid ${pc};">Moy. Classe</th>`;
    if (ccCols.includes('appreciation')) html += `<th style="padding:4px;text-align:center;border:1px solid ${pc};">Appr.</th>`;
    if (showExam) {
      if (examCols.includes('notes')) html += `<th style="padding:4px;text-align:center;border:1px solid ${pc};">Note Exam</th>`;
      if (examCols.includes('coefficient')) html += `<th style="padding:4px;text-align:center;border:1px solid ${pc};">Coeff</th>`;
      if (examCols.includes('points')) html += `<th style="padding:4px;text-align:center;border:1px solid ${pc};">Points</th>`;
      if (examCols.includes('appreciation')) html += `<th style="padding:4px;text-align:center;border:1px solid ${pc};">Appr. Exam</th>`;
    }
    html += `</tr>`;

    // Sections
    for (const section of sections) {
      if (section.title) {
        const totalCols = 1 + ccCols.length + (showExam ? examCols.length : 0);
        html += `<tr><td colspan="${totalCols}" style="padding:4px 6px;font-weight:bold;background:${pc}22;color:${pc};border:1px solid #ddd;">${section.title}</td></tr>`;
      }
      for (const mod of section.modules) {
        html += `<tr>`;
        html += `<td style="padding:3px 6px;border:1px solid #ddd;">${mod.title} <span style="color:#999;font-size:9px;">(coef ${mod.coefficient || 1})</span></td>`;
        if (ccCols.includes('moyenne_stagiaire')) html += `<td style="padding:3px;text-align:center;border:1px solid #ddd;">14.5</td>`;
        if (ccCols.includes('moyenne_classe')) html += `<td style="padding:3px;text-align:center;border:1px solid #ddd;">12.3</td>`;
        if (ccCols.includes('appreciation')) html += `<td style="padding:3px;text-align:center;border:1px solid #ddd;font-size:9px;">Bien</td>`;
        if (showExam) {
          if (examCols.includes('notes')) html += `<td style="padding:3px;text-align:center;border:1px solid #ddd;">15</td>`;
          if (examCols.includes('coefficient')) html += `<td style="padding:3px;text-align:center;border:1px solid #ddd;">${mod.coefficient || 1}</td>`;
          if (examCols.includes('points')) html += `<td style="padding:3px;text-align:center;border:1px solid #ddd;">${((mod.coefficient || 1) * 14.5).toFixed(0)}</td>`;
          if (examCols.includes('appreciation')) html += `<td style="padding:3px;text-align:center;border:1px solid #ddd;font-size:9px;">—</td>`;
        }
        html += `</tr>`;
      }
    }

    // Average row
    const totalCols = 1 + ccCols.length + (showExam ? examCols.length : 0);
    html += `<tr style="background:#f5f5f5;font-weight:bold;"><td style="padding:4px 6px;border:1px solid #ddd;">Moyenne Generale</td>`;
    html += `<td colspan="${totalCols - 1}" style="padding:4px;text-align:center;border:1px solid #ddd;">14.50/20</td></tr>`;
    html += `</table>`;

    // Footer
    if (footerConfig.showSignature) {
      html += `<div style="margin-top:16px;display:flex;justify-content:space-between;font-size:10px;">`;
      html += `<div style="text-align:center;width:45%;"><div style="border-top:1px solid #999;padding-top:4px;margin-top:40px;">Le Directeur</div></div>`;
      html += `<div style="text-align:center;width:45%;"><div style="border-top:1px solid #999;padding-top:4px;margin-top:40px;">Le Responsable Pedagogique</div></div>`;
      html += `</div>`;
    }
    if (footerConfig.customText) {
      html += `<p style="font-size:9px;color:#666;text-align:center;margin-top:8px;">${footerConfig.customText}</p>`;
    }
    html += `</div>`;
    return DOMPurify.sanitize(html, { ADD_ATTR: ['style', 'colspan', 'rowspan', 'id'] });
  }, [columnsConfig, headerConfig, footerConfig, styleConfig, modules]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 px-6 pt-5 pb-3">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Configurer le bulletin</span>
            <div className="flex items-center gap-2">
              <Button variant={showPreview ? 'secondary' : 'outline'} size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-1.5" data-testid="toggle-preview">
                <Eye className="h-3.5 w-3.5" /> Apercu
              </Button>
              <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5" data-testid="save-template">
                <Save className="h-3.5 w-3.5" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex">
          {/* Left: Editor */}
          <div className={`flex-1 overflow-y-auto px-6 pb-4 space-y-4 ${showPreview ? 'max-w-[50%]' : ''}`}>
            <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Nom du modele" className="h-8 text-sm" />

            <Tabs defaultValue="sections" className="space-y-3">
              <TabsList className="grid grid-cols-4 w-full h-8">
                <TabsTrigger value="sections" className="text-xs gap-1 h-7"><Layout className="h-3 w-3" /> Sections</TabsTrigger>
                <TabsTrigger value="columns" className="text-xs gap-1 h-7"><FileText className="h-3 w-3" /> Colonnes</TabsTrigger>
                <TabsTrigger value="header" className="text-xs gap-1 h-7"><Type className="h-3 w-3" /> En-tete</TabsTrigger>
                <TabsTrigger value="style" className="text-xs gap-1 h-7"><Palette className="h-3 w-3" /> Style</TabsTrigger>
              </TabsList>

              {/* SECTIONS - Drag & Drop */}
              <TabsContent value="sections" className="space-y-3">
                <p className="text-xs text-muted-foreground">Glissez-deposez les sections pour les reorganiser. Cliquez sur les modules pour les assigner.</p>
                {columnsConfig.sections.map((section, idx) => (
                  <Card
                    key={section.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`border-border/50 transition-all ${draggedSectionIdx === idx ? 'opacity-50 scale-[0.98]' : ''}`}
                  >
                    <CardHeader className="py-2 px-3 flex flex-row items-center gap-2 space-y-0">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                      <Input value={section.title} onChange={e => updateSectionTitle(section.id, e.target.value)} className="h-7 text-xs font-semibold border-0 bg-transparent p-0 focus-visible:ring-0 flex-1" />
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => idx > 0 && moveSection(idx, idx - 1)} disabled={idx === 0}><ArrowUp className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => idx < columnsConfig.sections.length - 1 && moveSection(idx, idx + 1)} disabled={idx === columnsConfig.sections.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeSection(section.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-2 pt-0">
                      <div className="flex flex-wrap gap-1">
                        {modules.map(mod => {
                          const inThis = section.moduleIds.includes(mod.id);
                          const inOther = !inThis && assignedModuleIds.includes(mod.id);
                          return (
                            <Badge key={mod.id} variant={inThis ? 'default' : 'outline'}
                              className={`cursor-pointer text-[10px] px-1.5 py-0 ${inOther ? 'opacity-25 cursor-not-allowed' : 'hover:shadow-sm'}`}
                              onClick={() => !inOther && toggleModuleInSection(section.id, mod.id)}>
                              {mod.title}
                            </Badge>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outline" size="sm" onClick={addSection} className="gap-1.5 w-full text-xs">
                  <Plus className="h-3.5 w-3.5" /> Ajouter une section
                </Button>
                {unassignedModules.length > 0 && columnsConfig.sections.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-200 text-xs">
                    <span className="font-medium text-amber-700">{unassignedModules.length} module(s) non assigne(s):</span>
                    <span className="text-amber-600 ml-1">{unassignedModules.map(m => m.title).join(', ')}</span>
                  </div>
                )}
              </TabsContent>

              {/* COLUMNS */}
              <TabsContent value="columns" className="space-y-3">
                <Card>
                  <CardHeader className="py-2 px-3"><CardTitle className="text-xs">Colonnes Controle Continu</CardTitle></CardHeader>
                  <CardContent className="px-3 pb-2 space-y-1.5">
                    {CC_COLUMNS.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 text-xs cursor-pointer">
                        <Checkbox checked={columnsConfig.ccColumns.includes(opt.value)} onCheckedChange={() => toggleCC(opt.value)} />
                        {opt.label}
                      </label>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs">Section Examen</CardTitle>
                      <Switch checked={columnsConfig.showExamSection} onCheckedChange={v => setColumnsConfig(p => ({ ...p, showExamSection: v }))} />
                    </div>
                  </CardHeader>
                  {columnsConfig.showExamSection && (
                    <CardContent className="px-3 pb-2 space-y-1.5">
                      {EXAM_COLUMNS.map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 text-xs cursor-pointer">
                          <Checkbox checked={columnsConfig.examColumns.includes(opt.value)} onCheckedChange={() => toggleExam(opt.value)} />
                          {opt.label}
                        </label>
                      ))}
                    </CardContent>
                  )}
                </Card>
              </TabsContent>

              {/* HEADER */}
              <TabsContent value="header" className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Titre</Label>
                  <Input value={headerConfig.title} onChange={e => setHeaderConfig(p => ({ ...p, title: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Sous-titre</Label>
                  <Input value={headerConfig.subtitle} onChange={e => setHeaderConfig(p => ({ ...p, subtitle: e.target.value }))} className="h-8 text-sm" placeholder="Annee scolaire 2025-2026" />
                </div>
                <label className="flex items-center gap-2 text-xs"><Switch checked={headerConfig.showLogo} onCheckedChange={v => setHeaderConfig(p => ({ ...p, showLogo: v }))} /> Logo etablissement</label>
                <label className="flex items-center gap-2 text-xs"><Switch checked={headerConfig.showSession} onCheckedChange={v => setHeaderConfig(p => ({ ...p, showSession: v }))} /> Dates de session</label>
                <div className="border-t pt-3 space-y-2">
                  <h4 className="text-xs font-semibold">Pied de page</h4>
                  <label className="flex items-center gap-2 text-xs"><Switch checked={footerConfig.showAssiduity} onCheckedChange={v => setFooterConfig(p => ({ ...p, showAssiduity: v }))} /> Assiduite</label>
                  <label className="flex items-center gap-2 text-xs"><Switch checked={footerConfig.showSignature} onCheckedChange={v => setFooterConfig(p => ({ ...p, showSignature: v }))} /> Emplacement signatures</label>
                  <Textarea value={footerConfig.customText} onChange={e => setFooterConfig(p => ({ ...p, customText: e.target.value }))} placeholder="Texte personnalise..." rows={2} className="text-xs" />
                </div>
              </TabsContent>

              {/* STYLE */}
              <TabsContent value="style" className="space-y-3">
                <Label className="text-xs">Couleur principale</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={styleConfig.primaryColor} onChange={e => setStyleConfig(p => ({ ...p, primaryColor: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border-0" />
                  <div className="flex gap-1">
                    {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#1e293b'].map(c => (
                      <button key={c} className="w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c, borderColor: styleConfig.primaryColor === c ? '#000' : 'transparent' }}
                        onClick={() => setStyleConfig(p => ({ ...p, primaryColor: c }))} />
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Live Preview */}
          {showPreview && (
            <div className="w-[50%] border-l bg-muted/20 overflow-y-auto p-4" data-testid="bulletin-preview">
              <p className="text-[10px] text-muted-foreground text-center mb-2">Apercu en temps reel</p>
              <div className="bg-white rounded-lg shadow-sm border p-2" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TranscriptTemplateEditor;
