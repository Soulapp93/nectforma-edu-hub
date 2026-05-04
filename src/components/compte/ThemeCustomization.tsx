import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { Palette, RotateCcw, Check, Pipette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useEstablishmentTheme, EstablishmentTheme } from '@/hooks/useEstablishmentTheme';

const PREDEFINED_PALETTES = [
  {
    name: 'Violet Nectforma',
    primary: '258 62% 35%',
    secondary: '270 55% 45%',
    sidebar: '258 55% 22%',
    background: '0 0% 100%',
  },
  {
    name: 'Bleu Océan',
    primary: '217 91% 40%',
    secondary: '200 80% 50%',
    sidebar: '217 70% 20%',
    background: '0 0% 100%',
  },
  {
    name: 'Vert Émeraude',
    primary: '160 65% 32%',
    secondary: '142 60% 45%',
    sidebar: '160 55% 18%',
    background: '0 0% 100%',
  },
  {
    name: 'Rouge Bordeaux',
    primary: '350 65% 38%',
    secondary: '0 60% 50%',
    sidebar: '350 50% 20%',
    background: '0 0% 100%',
  },
  {
    name: 'Orange Dynamique',
    primary: '25 90% 48%',
    secondary: '38 85% 55%',
    sidebar: '25 60% 22%',
    background: '0 0% 100%',
  },
  {
    name: 'Bleu Marine',
    primary: '220 60% 30%',
    secondary: '210 55% 45%',
    sidebar: '220 50% 16%',
    background: '0 0% 100%',
  },
  {
    name: 'Rose Fuchsia',
    primary: '320 65% 42%',
    secondary: '340 60% 55%',
    sidebar: '320 50% 22%',
    background: '0 0% 100%',
  },
  {
    name: 'Turquoise',
    primary: '180 60% 35%',
    secondary: '190 55% 48%',
    sidebar: '180 50% 18%',
    background: '0 0% 100%',
  },
  {
    name: 'Gris Anthracite',
    primary: '220 15% 30%',
    secondary: '210 20% 45%',
    sidebar: '220 15% 15%',
    background: '0 0% 100%',
  },
  {
    name: 'Indigo Profond',
    primary: '240 55% 40%',
    secondary: '250 50% 55%',
    sidebar: '240 45% 20%',
    background: '0 0% 100%',
  },
];

function hslToHex(hsl: string): string {
  const parts = hsl.trim().split(/\s+/);
  if (parts.length !== 3) return '#4B0082';
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHSL(hex: string): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (hsl: string) => void;
}

const ColorPickerField: React.FC<ColorPickerFieldProps> = ({ label, value, onChange }) => {
  const hexValue = hslToHex(value);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={hexValue}
            onChange={(e) => onChange(hexToHSL(e.target.value))}
            className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer p-0 overflow-hidden"
          />
        </div>
        <Input
          value={hexValue}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
              onChange(hexToHSL(v));
            }
          }}
          className="w-28 font-mono text-sm"
          placeholder="#000000"
        />
        <div
          className="w-10 h-10 rounded-lg border border-border flex-shrink-0"
          style={{ backgroundColor: `hsl(${value})` }}
        />
      </div>
    </div>
  );
};

const ThemeCustomization: React.FC = () => {
  const { theme, saveTheme, resetTheme, DEFAULT_THEME, loading } = useEstablishmentTheme();
  const [localTheme, setLocalTheme] = useState<Required<Record<keyof EstablishmentTheme, string>>>({
    primary: DEFAULT_THEME.primary,
    secondary: DEFAULT_THEME.secondary,
    sidebar: DEFAULT_THEME.sidebar,
    background: DEFAULT_THEME.background,
  });
  const [saving, setSaving] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);

  useEffect(() => {
    if (theme) {
      setLocalTheme({
        primary: theme.primary || DEFAULT_THEME.primary,
        secondary: theme.secondary || DEFAULT_THEME.secondary,
        sidebar: theme.sidebar || DEFAULT_THEME.sidebar,
        background: theme.background || DEFAULT_THEME.background,
      });
      // Find matching palette
      const match = PREDEFINED_PALETTES.find(p => p.primary === theme.primary);
      setSelectedPalette(match?.name || null);
    }
  }, [theme]);

  const handlePaletteSelect = (palette: typeof PREDEFINED_PALETTES[0]) => {
    setLocalTheme({
      primary: palette.primary,
      secondary: palette.secondary,
      sidebar: palette.sidebar,
      background: palette.background,
    });
    setSelectedPalette(palette.name);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveTheme(localTheme);
      toast.success('Thème mis à jour avec succès ! Les changements sont appliqués pour tous les utilisateurs.');
    } catch (error) {
      logger.error('Error saving theme:', error);
      toast.error('Erreur lors de la sauvegarde du thème');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      await resetTheme();
      setLocalTheme({ ...DEFAULT_THEME });
      setSelectedPalette('Violet Nectforma');
      toast.success('Thème réinitialisé aux couleurs par défaut');
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background rounded-2xl shadow-lg border-2 border-primary/20 p-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-2xl shadow-lg border-2 border-primary/20 p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mr-3">
            <Palette className="h-5 w-5 text-primary-foreground" />
          </div>
          Personnalisation du thème
        </h2>
        <p className="text-muted-foreground text-sm">
          Personnalisez les couleurs de l'interface pour tous les utilisateurs de votre établissement.
        </p>
      </div>

      {/* Predefined Palettes */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Palettes prédéfinies</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {PREDEFINED_PALETTES.map((palette) => (
            <button
              key={palette.name}
              onClick={() => handlePaletteSelect(palette)}
              className={`relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                selectedPalette === palette.name
                  ? 'border-primary ring-2 ring-primary/30 shadow-md'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              {selectedPalette === palette.name && (
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <div className="flex gap-1 mb-2">
                <div className="h-6 w-6 rounded-md" style={{ backgroundColor: `hsl(${palette.primary})` }} />
                <div className="h-6 w-6 rounded-md" style={{ backgroundColor: `hsl(${palette.secondary})` }} />
                <div className="h-6 w-6 rounded-md" style={{ backgroundColor: `hsl(${palette.sidebar})` }} />
              </div>
              <p className="text-xs font-medium text-foreground truncate">{palette.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color Pickers */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Pipette className="h-5 w-5" />
          Personnalisation avancée
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ColorPickerField
            label="Couleur principale"
            value={localTheme.primary}
            onChange={(v) => {
              setLocalTheme(prev => ({ ...prev, primary: v }));
              setSelectedPalette(null);
            }}
          />
          <ColorPickerField
            label="Couleur secondaire / Accent"
            value={localTheme.secondary}
            onChange={(v) => {
              setLocalTheme(prev => ({ ...prev, secondary: v }));
              setSelectedPalette(null);
            }}
          />
          <ColorPickerField
            label="Couleur de la barre latérale"
            value={localTheme.sidebar}
            onChange={(v) => {
              setLocalTheme(prev => ({ ...prev, sidebar: v }));
              setSelectedPalette(null);
            }}
          />
          <ColorPickerField
            label="Couleur d'arrière-plan"
            value={localTheme.background}
            onChange={(v) => {
              setLocalTheme(prev => ({ ...prev, background: v }));
              setSelectedPalette(null);
            }}
          />
        </div>
      </div>

      {/* Preview */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Aperçu</h3>
        <div className="rounded-xl overflow-hidden border border-border shadow-md">
          <div className="flex h-40">
            {/* Sidebar preview */}
            <div
              className="w-16 flex flex-col items-center py-4 gap-3"
              style={{ backgroundColor: `hsl(${localTheme.sidebar})` }}
            >
              <div className="w-8 h-8 rounded-lg bg-white/20" />
              <div className="w-6 h-1 rounded bg-white/40" />
              <div className="w-6 h-1 rounded bg-white/20" />
              <div className="w-6 h-1 rounded bg-white/20" />
            </div>
            {/* Content preview */}
            <div
              className="flex-1 p-4"
              style={{ backgroundColor: `hsl(${localTheme.background})` }}
            >
              {/* Header bar */}
              <div className="h-6 rounded-md mb-3 w-1/3" style={{ backgroundColor: `hsl(${localTheme.primary})` }} />
              {/* Cards */}
              <div className="flex gap-2">
                <div className="flex-1 h-16 rounded-lg bg-white border border-gray-200 p-2">
                  <div className="h-2 w-1/2 rounded mb-2" style={{ backgroundColor: `hsl(${localTheme.primary})` }} />
                  <div className="h-2 w-3/4 rounded bg-gray-200" />
                </div>
                <div className="flex-1 h-16 rounded-lg bg-white border border-gray-200 p-2">
                  <div className="h-2 w-1/2 rounded mb-2" style={{ backgroundColor: `hsl(${localTheme.secondary})` }} />
                  <div className="h-2 w-3/4 rounded bg-gray-200" />
                </div>
              </div>
              {/* Button preview */}
              <div className="mt-3 flex gap-2">
                <div
                  className="h-6 w-20 rounded-md"
                  style={{ backgroundColor: `hsl(${localTheme.primary})` }}
                />
                <div
                  className="h-6 w-20 rounded-md border-2"
                  style={{ borderColor: `hsl(${localTheme.primary})` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={saving}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {saving ? 'Enregistrement...' : 'Appliquer le thème'}
        </Button>
      </div>
    </div>
  );
};

export default ThemeCustomization;
