import React from 'react';
import { Button } from '@/components/ui/button';
import { Calculator, LayoutGrid, Palette, Signature as SignatureIcon, FileStack, Sparkles, Wand2 } from 'lucide-react';
import { ConfigCard } from './primitives';
import BulletinPreview from '../BulletinPreview';
import type { ResolvedBulletinConfig } from '@/types/bulletinConfig';

export type ActiveSection = 'hub' | 'rules' | 'structure' | 'design' | 'signatures' | 'templates' | 'visual-editor';

interface Props {
  cfg: ResolvedBulletinConfig;
  setSection: (s: ActiveSection) => void;
  periodName?: string;
  formationTitle?: string;
}

const HubSection: React.FC<Props> = ({ cfg, setSection, periodName, formationTitle }) => {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5" data-testid="config-hub">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ConfigCard
              icon={<Calculator className="h-7 w-7" />}
              title="Règles de calculs"
              description="Définissez les règles de calcul des moyennes, coefficients, UE, blocs et décisions."
              accent="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
              onClick={() => setSection('rules')}
              testId="config-card-rules"
            />
            <ConfigCard
              icon={<LayoutGrid className="h-7 w-7" />}
              title="Structure"
              description="Organisez la structure du bulletin : matières, colonnes et leur ordre d'affichage."
              accent="bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
              onClick={() => setSection('structure')}
              testId="config-card-structure"
            />
            <ConfigCard
              icon={<Palette className="h-7 w-7" />}
              title="Design"
              description="Personnalisez l'apparence : couleurs, typographies, styles et mises en page."
              accent="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              onClick={() => setSection('design')}
              testId="config-card-design"
            />
            <ConfigCard
              icon={<SignatureIcon className="h-7 w-7" />}
              title="Signatures"
              description="Ajoutez et positionnez les signatures, cachets et noms sur vos bulletins."
              accent="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              onClick={() => setSection('signatures')}
              testId="config-card-signatures"
            />
            <ConfigCard
              icon={<FileStack className="h-7 w-7" />}
              title="Templates"
              description="Créez, gérez et réutilisez vos modèles de bulletins selon les différentes périodes."
              accent="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              onClick={() => setSection('templates')}
              testId="config-card-templates"
            />
          </div>

          <div className="mt-4 rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5" data-testid="visual-editor-cta">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Wand2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Éditeur visuel du bulletin</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Modifiez chaque élément librement : déplacez, redimensionnez, personnalisez le texte, les couleurs et les images.
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => setSection('visual-editor')}
                className="shrink-0"
                data-testid="open-visual-editor-btn"
              >
                <Wand2 className="h-3.5 w-3.5 mr-1" /> Ouvrir l'éditeur
              </Button>
            </div>
          </div>
        </div>

        <div className="hidden lg:block sticky top-0 self-start">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Aperçu live
          </div>
          <BulletinPreview config={cfg} periodName={periodName} formationTitle={formationTitle} />
          <p className="text-[10px] text-muted-foreground mt-2 italic text-center">
            Mise à jour en temps réel selon vos modifications
          </p>
        </div>
      </div>
    </div>
  );
};

export default HubSection;
