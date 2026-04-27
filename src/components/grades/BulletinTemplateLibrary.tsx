import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, GraduationCap, BookOpen, FileText, Award, Calendar, Layers } from 'lucide-react';
import { BULLETIN_PRESETS, type BulletinPreset } from './bulletinPresets';

interface Props {
  currentPresetId?: string | null;
  onApply: (preset: BulletinPreset) => void;
}

const CATEGORY_ICON: Record<string, any> = {
  BTS: GraduationCap,
  Master: Award,
  'BAC PRO': BookOpen,
  Semestre: Calendar,
  Trimestre: Calendar,
  Personnalisé: Layers,
};

const BulletinTemplateLibrary: React.FC<Props> = ({ currentPresetId, onApply }) => {
  return (
    <div className="space-y-3" data-testid="bulletin-template-library">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Bibliothèque de modèles</p>
          <p className="text-[12px] text-amber-700/80 mt-0.5">
            Démarrez à partir d'un modèle préconfiguré (BTS, Master, BAC Pro, Semestre, Trimestre…) puis personnalisez librement. Le modèle remplace toutes les options visuelles actuelles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {BULLETIN_PRESETS.map((preset) => {
          const Icon = CATEGORY_ICON[preset.category] || FileText;
          const isActive = preset.id === currentPresetId;
          return (
            <Card
              key={preset.id}
              className={`rounded-xl overflow-hidden transition-all hover:shadow-md cursor-pointer ${
                isActive ? 'ring-2 ring-amber-500 border-amber-400' : 'hover:border-amber-300'
              }`}
              data-testid={`preset-card-${preset.id}`}
            >
              <CardContent className="p-0">
                {/* Color preview band */}
                <div className="h-14 relative" style={{ background: `linear-gradient(135deg, ${preset.primaryColor} 60%, ${preset.accentColor} 100%)` }}>
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <Icon className="h-5 w-5 text-white/90" />
                    <Badge className="bg-white/20 text-white border-white/30 text-[10px]">{preset.category}</Badge>
                  </div>
                </div>

                {/* Mini preview of the table */}
                <div className="p-3">
                  <div className="border border-border rounded overflow-hidden mb-2.5" style={{ fontSize: 8 }}>
                    <div className="px-1.5 py-0.5 flex" style={{ background: preset.tableStyle.headerBg, color: preset.tableStyle.headerTextColor }}>
                      {preset.tableColumns.filter((c) => c.visible).slice(0, 5).map((c) => (
                        <div key={c.id} className="flex-1 truncate text-center font-bold">{c.label}</div>
                      ))}
                    </div>
                    <div className="px-1.5 py-0.5 flex" style={{ background: preset.tableStyle.rowBg }}>
                      {preset.tableColumns.filter((c) => c.visible).slice(0, 5).map((c) => (
                        <div key={c.id} className="flex-1 text-center text-muted-foreground">—</div>
                      ))}
                    </div>
                    <div className="px-1.5 py-0.5 flex" style={{ background: preset.tableStyle.rowAltBg }}>
                      {preset.tableColumns.filter((c) => c.visible).slice(0, 5).map((c) => (
                        <div key={c.id} className="flex-1 text-center text-muted-foreground">—</div>
                      ))}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold leading-tight">{preset.name}</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 min-h-[28px]">{preset.description}</p>

                  <Button
                    size="sm"
                    variant={isActive ? 'default' : 'outline'}
                    className={`w-full mt-2 h-8 text-xs gap-1 ${isActive ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                    onClick={() => onApply(preset)}
                    data-testid={`preset-apply-${preset.id}`}
                  >
                    {isActive ? <><Check className="h-3 w-3" />Modèle actif</> : 'Utiliser ce modèle'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BulletinTemplateLibrary;
