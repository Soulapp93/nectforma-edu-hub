import React, { useState, useEffect } from 'react';
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
import { Plus, Trash2, GripVertical, Save, Palette, FileText, Layout, Type } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  getTranscriptTemplate,
  upsertTranscriptTemplate,
  linkTemplateToFormation,
  type TranscriptTemplate,
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

const DEFAULT_HEADER_CONFIG: TranscriptHeaderConfig = {
  title: 'Bulletin de Formation',
  showLogo: true,
  showSession: true,
  subtitle: '',
};

const DEFAULT_FOOTER_CONFIG: TranscriptFooterConfig = {
  showAssiduity: true,
  customText: '',
  showSignature: true,
};

const DEFAULT_STYLE_CONFIG: TranscriptStyleConfig = {
  primaryColor: '#3b82f6',
  fontFamily: 'Segoe UI',
};

const CC_COLUMN_OPTIONS = [
  { value: 'moyenne_stagiaire', label: 'Moyenne du Stagiaire' },
  { value: 'moyenne_classe', label: 'Moyenne de Classe' },
  { value: 'appreciation', label: 'Appréciations' },
];

const EXAM_COLUMN_OPTIONS = [
  { value: 'notes', label: 'Notes' },
  { value: 'coefficient', label: 'Coefficient' },
  { value: 'points', label: 'Points' },
  { value: 'appreciation', label: 'Appréciation' },
];

const TranscriptTemplateEditor: React.FC<Props> = ({ open, onOpenChange, formationId, establishmentId }) => {
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState('Modèle par défaut');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [columnsConfig, setColumnsConfig] = useState<TranscriptTemplateConfig>(DEFAULT_COLUMNS_CONFIG);
  const [headerConfig, setHeaderConfig] = useState<TranscriptHeaderConfig>(DEFAULT_HEADER_CONFIG);
  const [footerConfig, setFooterConfig] = useState<TranscriptFooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [styleConfig, setStyleConfig] = useState<TranscriptStyleConfig>(DEFAULT_STYLE_CONFIG);

  // Load modules for this formation
  const { data: modules = [] } = useQuery({
    queryKey: ['formation-modules-template', formationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('formation_modules')
        .select('id, title, order_index')
        .eq('formation_id', formationId)
        .order('order_index');
      return data || [];
    },
    enabled: open && !!formationId,
  });

  // Load existing template
  const { data: existingTemplate, isLoading } = useQuery({
    queryKey: ['transcript-template', formationId],
    queryFn: () => getTranscriptTemplate(formationId),
    enabled: open && !!formationId,
  });

  useEffect(() => {
    if (existingTemplate) {
      setTemplateId(existingTemplate.id);
      setTemplateName(existingTemplate.name);
      setColumnsConfig(existingTemplate.columns_config || DEFAULT_COLUMNS_CONFIG);
      setHeaderConfig(existingTemplate.header_config || DEFAULT_HEADER_CONFIG);
      setFooterConfig(existingTemplate.footer_config || DEFAULT_FOOTER_CONFIG);
      setStyleConfig(existingTemplate.style_config || DEFAULT_STYLE_CONFIG);
    } else {
      setTemplateId(null);
      setTemplateName('Modèle par défaut');
      setColumnsConfig(DEFAULT_COLUMNS_CONFIG);
      setHeaderConfig(DEFAULT_HEADER_CONFIG);
      setFooterConfig(DEFAULT_FOOTER_CONFIG);
      setStyleConfig(DEFAULT_STYLE_CONFIG);
    }
  }, [existingTemplate]);

  const addSection = () => {
    const newSection = {
      id: `s-${Date.now()}`,
      title: 'Nouvelle section',
      moduleIds: [],
    };
    setColumnsConfig(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const removeSection = (sectionId: string) => {
    setColumnsConfig(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
    }));
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    setColumnsConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, title } : s),
    }));
  };

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

  const toggleCCColumn = (col: string) => {
    setColumnsConfig(prev => ({
      ...prev,
      ccColumns: prev.ccColumns.includes(col) ? prev.ccColumns.filter(c => c !== col) : [...prev.ccColumns, col],
    }));
  };

  const toggleExamColumn = (col: string) => {
    setColumnsConfig(prev => ({
      ...prev,
      examColumns: prev.examColumns.includes(col) ? prev.examColumns.filter(c => c !== col) : [...prev.examColumns, col],
    }));
  };

  // Modules already assigned to a section
  const assignedModuleIds = columnsConfig.sections.flatMap(s => s.moduleIds);
  const unassignedModules = modules.filter(m => !assignedModuleIds.includes(m.id));

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
      toast.success('Modèle de bulletin sauvegardé');
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Erreur lors de la sauvegarde : ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Configurer le modèle de bulletin
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Template name */}
          <div className="space-y-2">
            <Label>Nom du modèle</Label>
            <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Ex: Bulletin BTS GPME" />
          </div>

          <Tabs defaultValue="sections" className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="sections" className="text-xs gap-1"><Layout className="h-3 w-3" /> Sections</TabsTrigger>
              <TabsTrigger value="columns" className="text-xs gap-1"><FileText className="h-3 w-3" /> Colonnes</TabsTrigger>
              <TabsTrigger value="header" className="text-xs gap-1"><Type className="h-3 w-3" /> En-tête</TabsTrigger>
              <TabsTrigger value="style" className="text-xs gap-1"><Palette className="h-3 w-3" /> Style</TabsTrigger>
            </TabsList>

            {/* === SECTIONS === */}
            <TabsContent value="sections" className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Organisez vos modules en catégories. Les modules non assignés apparaîtront dans une section "Autres" par défaut.
              </p>

              {columnsConfig.sections.map((section, idx) => (
                <Card key={section.id} className="border-border/50">
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2 flex-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <Input
                        value={section.title}
                        onChange={e => updateSectionTitle(section.id, e.target.value)}
                        className="h-8 text-sm font-semibold border-0 bg-transparent p-0 focus-visible:ring-0"
                        placeholder="Nom de la section"
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSection(section.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-0">
                    <div className="flex flex-wrap gap-1.5">
                      {modules.map(mod => {
                        const isInThisSection = section.moduleIds.includes(mod.id);
                        const isInOtherSection = !isInThisSection && assignedModuleIds.includes(mod.id);
                        return (
                          <Badge
                            key={mod.id}
                            variant={isInThisSection ? 'default' : 'outline'}
                            className={`cursor-pointer text-xs transition-all ${isInOtherSection ? 'opacity-30 cursor-not-allowed' : 'hover:shadow-sm'}`}
                            onClick={() => !isInOtherSection && toggleModuleInSection(section.id, mod.id)}
                          >
                            {mod.title}
                          </Badge>
                        );
                      })}
                    </div>
                    {section.moduleIds.length === 0 && (
                      <p className="text-xs text-muted-foreground italic mt-2">Cliquez sur un module pour l'ajouter à cette section</p>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" size="sm" onClick={addSection} className="gap-2 w-full">
                <Plus className="h-4 w-4" />
                Ajouter une section
              </Button>

              {unassignedModules.length > 0 && columnsConfig.sections.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1">
                    {unassignedModules.length} module(s) non assigné(s) :
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {unassignedModules.map(m => (
                      <Badge key={m.id} variant="outline" className="text-xs text-amber-600">{m.title}</Badge>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                    Ces modules apparaîtront dans une section "Autres" sur le bulletin.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* === COLUMNS === */}
            <TabsContent value="columns" className="space-y-4">
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Colonnes Contrôle Continu</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {CC_COLUMN_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={columnsConfig.ccColumns.includes(opt.value)}
                        onCheckedChange={() => toggleCCColumn(opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Section Examen</CardTitle>
                    <Switch
                      checked={columnsConfig.showExamSection}
                      onCheckedChange={v => setColumnsConfig(p => ({ ...p, showExamSection: v }))}
                    />
                  </div>
                </CardHeader>
                {columnsConfig.showExamSection && (
                  <CardContent className="px-4 pb-3 space-y-2">
                    {EXAM_COLUMN_OPTIONS.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={columnsConfig.examColumns.includes(opt.value)}
                          onCheckedChange={() => toggleExamColumn(opt.value)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </CardContent>
                )}
              </Card>
            </TabsContent>

            {/* === HEADER === */}
            <TabsContent value="header" className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Titre du bulletin</Label>
                  <Input value={headerConfig.title} onChange={e => setHeaderConfig(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Sous-titre (optionnel)</Label>
                  <Input value={headerConfig.subtitle} onChange={e => setHeaderConfig(p => ({ ...p, subtitle: e.target.value }))} placeholder="Ex: Année scolaire 2024-2025" />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Switch checked={headerConfig.showLogo} onCheckedChange={v => setHeaderConfig(p => ({ ...p, showLogo: v }))} />
                  Afficher le logo de l'établissement
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Switch checked={headerConfig.showSession} onCheckedChange={v => setHeaderConfig(p => ({ ...p, showSession: v }))} />
                  Afficher les dates de session
                </label>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="text-sm font-semibold">Pied de page</h4>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Switch checked={footerConfig.showAssiduity} onCheckedChange={v => setFooterConfig(p => ({ ...p, showAssiduity: v }))} />
                  Mention d'assiduité
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Switch checked={footerConfig.showSignature} onCheckedChange={v => setFooterConfig(p => ({ ...p, showSignature: v }))} />
                  Emplacement signature
                </label>
                <div className="space-y-2">
                  <Label>Texte personnalisé</Label>
                  <Textarea
                    value={footerConfig.customText}
                    onChange={e => setFooterConfig(p => ({ ...p, customText: e.target.value }))}
                    placeholder="Ex: Ce bulletin est un document officiel..."
                    rows={2}
                  />
                </div>
              </div>
            </TabsContent>

            {/* === STYLE === */}
            <TabsContent value="style" className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Couleur principale du tableau</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={styleConfig.primaryColor}
                      onChange={e => setStyleConfig(p => ({ ...p, primaryColor: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={styleConfig.primaryColor}
                      onChange={e => setStyleConfig(p => ({ ...p, primaryColor: e.target.value }))}
                      className="w-32"
                    />
                    <div className="flex gap-1">
                      {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'].map(c => (
                        <button
                          key={c}
                          className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                          style={{ backgroundColor: c, borderColor: styleConfig.primaryColor === c ? 'hsl(var(--foreground))' : 'transparent' }}
                          onClick={() => setStyleConfig(p => ({ ...p, primaryColor: c }))}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TranscriptTemplateEditor;
