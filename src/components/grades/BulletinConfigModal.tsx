import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  resolveConfigForPeriod,
  upsertConfig,
  listSystemTemplates,
} from '@/services/bulletinConfigService';
import { DEFAULT_CONFIG, type ResolvedBulletinConfig } from '@/types/bulletinConfig';
import { Sparkles, ArrowLeft } from 'lucide-react';

import HubSection, { type ActiveSection } from './bulletin-config/HubSection';
import { RulesSection, RulesTabsList } from './bulletin-config/RulesSection';
import { StructureSection } from './bulletin-config/StructureSection';
import { DesignSection, DesignTabsList } from './bulletin-config/DesignSection';
import { SignaturesSection } from './bulletin-config/SignaturesSection';
import { TemplatesSection } from './bulletin-config/TemplatesSection';
import { VisualEditorSection } from './bulletin-config/VisualEditorSection';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  periodId: string;
  periodName?: string;
  formationTitle?: string;
}

const SECTION_TITLES: Record<ActiveSection, string> = {
  'hub': 'Configuration',
  'rules': 'Règles de calculs',
  'structure': 'Structure',
  'design': 'Design',
  'signatures': 'Signatures',
  'templates': 'Templates',
  'visual-editor': 'Éditeur visuel du bulletin',
};

const BulletinConfigModal: React.FC<Props> = ({ isOpen, onClose, periodId, periodName, formationTitle }) => {
  const queryClient = useQueryClient();
  const [cfg, setCfg] = useState<ResolvedBulletinConfig>(DEFAULT_CONFIG);
  const [section, setSection] = useState<ActiveSection>('hub');

  const { data: loadedCfg, isLoading } = useQuery({
    queryKey: ['bulletin-config-resolved', periodId],
    queryFn: () => resolveConfigForPeriod(periodId),
    enabled: isOpen && !!periodId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['bulletin-config-templates'],
    queryFn: () => listSystemTemplates(),
    enabled: isOpen,
  });

  useEffect(() => {
    if (loadedCfg) setCfg(loadedCfg);
  }, [loadedCfg]);

  useEffect(() => {
    if (isOpen) setSection('hub');
  }, [isOpen]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await upsertConfig(
        { level: 'period', periodId },
        {
          name: `Configuration — ${periodName || 'Periode'}`,
          sources_config: cfg.sources_config,
          calculation_rules: cfg.calculation_rules,
          layout_config: cfg.layout_config,
          design_config: cfg.design_config,
          text_config: cfg.text_config,
          signatures_config: cfg.signatures_config,
          decision_rules: cfg.decision_rules,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulletin-config-resolved'] });
      queryClient.invalidateQueries({ queryKey: ['bulletin-config-templates'] });
      queryClient.invalidateQueries({ queryKey: ['computed-bulletins'] });
      queryClient.invalidateQueries({ queryKey: ['evaluations-transcripts'] });
      queryClient.invalidateQueries({ queryKey: ['combined-source-bulletins'] });
      queryClient.invalidateQueries({ queryKey: ['combined-source-results'] });
      toast.success('Configuration enregistree pour cette periode');
      onClose();
    },
    onError: (e: any) => toast.error(e.message || 'Erreur lors de la sauvegarde'),
  });

  const applyTemplate = async (templateId: string) => {
    try {
      const tpl = templates.find((t: any) => t.id === templateId);
      if (!tpl) return;
      setCfg({
        sources_config: { ...DEFAULT_CONFIG.sources_config, ...tpl.sources_config },
        calculation_rules: { ...DEFAULT_CONFIG.calculation_rules, ...tpl.calculation_rules },
        layout_config: {
          ...DEFAULT_CONFIG.layout_config,
          ...tpl.layout_config,
          sections: { ...DEFAULT_CONFIG.layout_config.sections, ...(tpl.layout_config?.sections || {}) },
        },
        design_config: { ...DEFAULT_CONFIG.design_config, ...tpl.design_config },
        text_config: { ...DEFAULT_CONFIG.text_config, ...tpl.text_config },
        signatures_config: { ...DEFAULT_CONFIG.signatures_config, ...tpl.signatures_config },
        decision_rules: { ...DEFAULT_CONFIG.decision_rules, ...tpl.decision_rules },
        source_chain: [],
      });
      toast.success(`Template "${tpl.name}" applique — n'oubliez pas de sauvegarder`);
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    }
  };

  const isEditableSection =
    section === 'rules' || section === 'structure' || section === 'design' ||
    section === 'signatures' || section === 'visual-editor';

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0"
        data-testid="bulletin-config-modal"
      >
        <DialogHeader className="shrink-0 px-6 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-3" data-testid="config-modal-title">
            {section !== 'hub' && (
              <button
                onClick={() => setSection('hub')}
                className="rounded-lg p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Retour"
                data-testid="config-back-btn"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <Sparkles className="h-5 w-5 text-primary" />
            <span>{SECTION_TITLES[section]}</span>
            {periodName && <Badge variant="outline">{periodName}</Badge>}
            {formationTitle && <Badge variant="secondary" className="text-xs">{formationTitle}</Badge>}
          </DialogTitle>
          {section === 'hub' && (
            <p className="text-sm text-muted-foreground mt-1">
              Personnalisez entièrement vos bulletins de notes — chaque période garde sa propre configuration.
            </p>
          )}
        </DialogHeader>

        {section === 'hub' && (
          <HubSection cfg={cfg} setSection={setSection} periodName={periodName} formationTitle={formationTitle} />
        )}

        {section === 'visual-editor' && (
          <VisualEditorSection cfg={cfg} setCfg={setCfg} />
        )}

        {section === 'templates' && (
          <TemplatesSection templates={templates} applyTemplate={applyTemplate} />
        )}

        {(section === 'rules' || section === 'structure' || section === 'design' || section === 'signatures') && (
          <>
            {/* Templates shortcut */}
            <div className="flex items-center gap-2 border-b px-6 py-2 bg-muted/40 overflow-x-auto" data-testid="templates-shortcut">
              <span className="text-xs text-muted-foreground shrink-0">Appliquer un template :</span>
              {templates.map((t: any) => (
                <Button
                  key={t.id}
                  size="sm"
                  variant="outline"
                  onClick={() => applyTemplate(t.id)}
                  data-testid={`apply-template-${t.id}`}
                  className="shrink-0"
                >
                  {t.name.split(' —')[0]}
                </Button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">Chargement...</div>
            ) : (
              <Tabs
                key={`tabs-${section}`}
                defaultValue={
                  section === 'rules' ? 'sources'
                  : section === 'structure' ? 'layout'
                  : section === 'design' ? 'design'
                  : 'sign'
                }
                className="flex-1 overflow-hidden flex flex-col"
              >
                {section === 'rules' && <RulesTabsList />}
                {section === 'design' && <DesignTabsList />}

                <div className="flex-1 overflow-y-auto mt-4 px-6">
                  {section === 'rules' && <RulesSection cfg={cfg} setCfg={setCfg} />}
                  {section === 'structure' && <StructureSection cfg={cfg} setCfg={setCfg} />}
                  {section === 'design' && <DesignSection cfg={cfg} setCfg={setCfg} />}
                  {section === 'signatures' && <SignaturesSection cfg={cfg} setCfg={setCfg} />}
                </div>
              </Tabs>
            )}
          </>
        )}

        {/* Footer Save bar */}
        {isEditableSection && (
          <div className="flex justify-end gap-2 px-6 py-3 border-t shrink-0">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              data-testid="bulletin-config-save"
            >
              {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer pour cette période'}
            </Button>
          </div>
        )}
        {section === 'hub' && (
          <div className="flex justify-end gap-2 px-6 py-3 border-t shrink-0">
            <Button variant="outline" onClick={onClose} data-testid="config-hub-close">Fermer</Button>
          </div>
        )}
        {section === 'templates' && (
          <div className="flex justify-between gap-2 px-6 py-3 border-t shrink-0">
            <Button variant="ghost" onClick={() => setSection('hub')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulletinConfigModal;
