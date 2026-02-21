import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X, Maximize2, Minimize2, BarChart3, Settings2, Plus, Trash2, Grid3X3 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'radar' | 'scatter' | 'donut' | 'stacked-bar' | 'horizontal-bar' | 'stacked-area' | 'stacked-horizontal-bar' | 'stepped-line' | 'combo';

export type StackMode = 'none' | 'stacked' | 'percent';

interface ChartSeries {
  key: string;
  name: string;
  color: string;
  type?: 'bar' | 'line' | 'area';
}

interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  dataRange: string;
  labelsRange: string;
  colors: string[];
  stackMode?: StackMode;
  showGridLines?: boolean;
  showLegend?: boolean;
  showLabels?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  smooth?: boolean;
  axisXLabel?: string;
  axisYLabel?: string;
  series?: ChartSeries[];
  useHeaderRow?: boolean;
  useLabelColumn?: boolean;
  swapRowsColumns?: boolean;
  borderRadius?: number;
  opacity?: number;
  fontSize?: number;
  backgroundColor?: string;
}

interface Props {
  config: ChartConfig;
  data: { label: string; value: number; value2?: number; value3?: number; value4?: number }[];
  onRemove: () => void;
  onUpdate: (config: Partial<ChartConfig>) => void;
}

const DEFAULT_COLORS = [
  '#4285F4', '#EA4335', '#FBBC04', '#34A853', '#FF6D01',
  '#46BDC6', '#7BAAF7', '#F07B72', '#FCD04F', '#71C287',
  '#FF9E80', '#80CBC4', '#9FA8DA', '#F48FB1', '#CE93D8'
];

const CHART_CATEGORIES: { label: string; types: { type: ChartType; label: string; icon: string }[] }[] = [
  {
    label: 'Courbes',
    types: [
      { type: 'line', label: 'Courbe', icon: '📈' },
      { type: 'stepped-line', label: 'Courbe en escalier', icon: '📊' },
      { type: 'combo', label: 'Combiné', icon: '📉' },
    ]
  },
  {
    label: 'Aires',
    types: [
      { type: 'area', label: 'Aire', icon: '🏔️' },
      { type: 'stacked-area', label: 'Aire empilée', icon: '🗻' },
    ]
  },
  {
    label: 'Colonnes',
    types: [
      { type: 'bar', label: 'Colonnes', icon: '📊' },
      { type: 'stacked-bar', label: 'Colonnes empilées', icon: '📊' },
    ]
  },
  {
    label: 'Barres',
    types: [
      { type: 'horizontal-bar', label: 'Barres', icon: '📊' },
      { type: 'stacked-horizontal-bar', label: 'Barres empilées', icon: '📊' },
    ]
  },
  {
    label: 'Secteurs',
    types: [
      { type: 'pie', label: 'Camembert', icon: '🥧' },
      { type: 'donut', label: 'Anneau', icon: '🍩' },
    ]
  },
  {
    label: 'Nuage de points',
    types: [
      { type: 'scatter', label: 'Nuage', icon: '⚬' },
    ]
  },
  {
    label: 'Autres',
    types: [
      { type: 'radar', label: 'Radar', icon: '🕸️' },
    ]
  },
];

const SpreadsheetChart: React.FC<Props> = ({ config, data, onRemove, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [editorOpen, setEditorOpen] = useState(true);
  const [editorTab, setEditorTab] = useState<'configure' | 'customize'>('configure');
  const [chartTypeOpen, setChartTypeOpen] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);

  const colors = config.colors?.length ? config.colors : DEFAULT_COLORS;
  const showGrid = config.showGridLines !== false;
  const showLegend = config.showLegend !== false;
  const smooth = config.smooth !== false;
  const borderRadius = config.borderRadius ?? 4;
  const opacity = config.opacity ?? 0.8;
  const fontSize = config.fontSize ?? 11;

  const seriesList: ChartSeries[] = config.series?.length
    ? config.series
    : [
        { key: 'value', name: 'Série 1', color: colors[0] },
        ...(data.some(d => d.value2 !== undefined) ? [{ key: 'value2', name: 'Série 2', color: colors[1] }] : []),
        ...(data.some(d => d.value3 !== undefined) ? [{ key: 'value3', name: 'Série 3', color: colors[2] }] : []),
      ];

  const addSeries = () => {
    const idx = seriesList.length;
    const newKey = `value${idx === 0 ? '' : idx + 1}`;
    onUpdate({
      series: [...seriesList, { key: newKey, name: `Série ${idx + 1}`, color: colors[idx % colors.length] }]
    });
  };

  const removeSeries = (i: number) => {
    onUpdate({ series: seriesList.filter((_, idx) => idx !== i) });
  };

  const updateSeries = (i: number, patch: Partial<ChartSeries>) => {
    const updated = seriesList.map((s, idx) => idx === i ? { ...s, ...patch } : s);
    onUpdate({ series: updated });
  };

  const renderChart = () => {
    const chartData = data.map((d, i) => ({ ...d, fill: colors[i % colors.length] }));
    const height = expanded ? 500 : 300;
    const lineType = smooth ? 'monotone' : 'linear';
    const gridEl = showGrid ? <CartesianGrid strokeDasharray="3 3" className="opacity-30" /> : null;
    const legendEl = showLegend ? <Legend wrapperStyle={{ fontSize }} /> : null;

    switch (config.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              {gridEl}
              <XAxis dataKey="label" tick={{ fontSize }} label={config.axisXLabel ? { value: config.axisXLabel, position: 'bottom', fontSize } : undefined} />
              <YAxis tick={{ fontSize }} label={config.axisYLabel ? { value: config.axisYLabel, angle: -90, position: 'insideLeft', fontSize } : undefined} />
              <Tooltip />
              {legendEl}
              {seriesList.map((s, i) => (
                <Bar key={s.key} dataKey={s.key} name={s.name} radius={[borderRadius, borderRadius, 0, 0]} fill={s.color} fillOpacity={opacity}>
                  {i === 0 && chartData.map((_, j) => <Cell key={j} fill={colors[j % colors.length]} />)}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'stacked-bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} stackOffset={config.stackMode === 'percent' ? 'expand' : undefined}>
              {gridEl}
              <XAxis dataKey="label" tick={{ fontSize }} />
              <YAxis tick={{ fontSize }} tickFormatter={config.stackMode === 'percent' ? (v: number) => `${(v * 100).toFixed(0)}%` : undefined} />
              <Tooltip />
              {legendEl}
              {seriesList.map((s) => (
                <Bar key={s.key} dataKey={s.key} stackId="stack" name={s.name} fill={s.color} fillOpacity={opacity} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'horizontal-bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} layout="vertical">
              {gridEl}
              <XAxis type="number" tick={{ fontSize }} />
              <YAxis dataKey="label" type="category" tick={{ fontSize }} width={80} />
              <Tooltip />
              {legendEl}
              {seriesList.map((s, i) => (
                <Bar key={s.key} dataKey={s.key} name={s.name} radius={[0, borderRadius, borderRadius, 0]} fill={s.color} fillOpacity={opacity}>
                  {i === 0 && chartData.map((_, j) => <Cell key={j} fill={colors[j % colors.length]} />)}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'stacked-horizontal-bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} layout="vertical" stackOffset={config.stackMode === 'percent' ? 'expand' : undefined}>
              {gridEl}
              <XAxis type="number" tick={{ fontSize }} />
              <YAxis dataKey="label" type="category" tick={{ fontSize }} width={80} />
              <Tooltip />
              {legendEl}
              {seriesList.map((s) => (
                <Bar key={s.key} dataKey={s.key} stackId="stack" name={s.name} fill={s.color} fillOpacity={opacity} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
      case 'stepped-line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              {gridEl}
              <XAxis dataKey="label" tick={{ fontSize }} />
              <YAxis tick={{ fontSize }} />
              <Tooltip />
              {legendEl}
              {seriesList.map((s) => (
                <Line key={s.key} type={config.type === 'stepped-line' ? 'stepAfter' : lineType} dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData}>
              {gridEl}
              <XAxis dataKey="label" tick={{ fontSize }} />
              <YAxis tick={{ fontSize }} />
              <Tooltip />
              {legendEl}
              {seriesList.map((s) => (
                <Area key={s.key} type={lineType} dataKey={s.key} name={s.name} stroke={s.color} fill={s.color} fillOpacity={0.3} strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'stacked-area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} stackOffset={config.stackMode === 'percent' ? 'expand' : undefined}>
              {gridEl}
              <XAxis dataKey="label" tick={{ fontSize }} />
              <YAxis tick={{ fontSize }} />
              <Tooltip />
              {legendEl}
              {seriesList.map((s) => (
                <Area key={s.key} type={lineType} dataKey={s.key} stackId="stack" name={s.name} stroke={s.color} fill={s.color} fillOpacity={0.4} strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'combo':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={chartData}>
              {gridEl}
              <XAxis dataKey="label" tick={{ fontSize }} />
              <YAxis tick={{ fontSize }} />
              <Tooltip />
              {legendEl}
              {seriesList.map((s, i) => {
                const sType = s.type || (i === 0 ? 'bar' : 'line');
                if (sType === 'bar') return <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} fillOpacity={opacity} radius={[borderRadius, borderRadius, 0, 0]} />;
                if (sType === 'area') return <Area key={s.key} type={lineType} dataKey={s.key} name={s.name} stroke={s.color} fill={s.color} fillOpacity={0.3} />;
                return <Line key={s.key} type={lineType} dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} />;
              })}
            </ComposedChart>
          </ResponsiveContainer>
        );
      case 'pie':
      case 'donut':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={config.type === 'donut' ? '40%' : 0}
                outerRadius="70%"
                label={config.showLabels !== false ? ({ label, percent }: any) => `${label} (${(percent * 100).toFixed(0)}%)` : false}
                labelLine={config.showLabels !== false}
              >
                {chartData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip />
              {legendEl}
            </PieChart>
          </ResponsiveContainer>
        );
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid />
              <PolarAngleAxis dataKey="label" tick={{ fontSize }} />
              <PolarRadiusAxis tick={{ fontSize: 10 }} />
              {seriesList.map((s) => (
                <Radar key={s.key} name={s.name} dataKey={s.key} stroke={s.color} fill={s.color} fillOpacity={0.3} />
              ))}
              <Tooltip />
              {legendEl}
            </RadarChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart>
              {gridEl}
              <XAxis dataKey="value" name="X" tick={{ fontSize }} />
              <YAxis dataKey="value2" name="Y" tick={{ fontSize }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              {legendEl}
              <Scatter name={config.title} data={chartData.filter(d => d.value2 !== undefined)} fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  const renderChartTypeSelector = () => (
    <div className="space-y-3">
      {CHART_CATEGORIES.map(cat => (
        <div key={cat.label}>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">{cat.label}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {cat.types.map(ct => (
              <button
                key={ct.type}
                onClick={() => { onUpdate({ type: ct.type }); setChartTypeOpen(false); }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors hover:bg-accent/50 ${
                  config.type === ct.type ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                }`}
              >
                <span className="text-xl">{ct.icon}</span>
                <span className="text-[10px] leading-tight text-center">{ct.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderConfigureTab = () => (
    <div className="space-y-4 p-3">
      {/* Chart type */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Type de graphique</Label>
        <button
          onClick={() => setChartTypeOpen(!chartTypeOpen)}
          className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-accent/50 transition-colors"
        >
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-sm flex-1 text-left">
            {CHART_CATEGORIES.flatMap(c => c.types).find(t => t.type === config.type)?.label || config.type}
          </span>
          <span className="text-xs text-muted-foreground">▼</span>
        </button>
        {chartTypeOpen && (
          <div className="mt-2 p-2 border border-border rounded-lg bg-card max-h-80 overflow-y-auto">
            {renderChartTypeSelector()}
          </div>
        )}
      </div>

      {/* Stack mode */}
      {['stacked-bar', 'stacked-horizontal-bar', 'stacked-area'].includes(config.type) && (
        <div>
          <Label className="text-xs font-medium text-muted-foreground">Empilement</Label>
          <Select value={config.stackMode || 'none'} onValueChange={v => onUpdate({ stackMode: v as StackMode })}>
            <SelectTrigger className="h-8 text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun empilement</SelectItem>
              <SelectItem value="stacked">Empilé</SelectItem>
              <SelectItem value="percent">100% empilé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Data range */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Plage de données</Label>
        <div className="flex items-center gap-1 mt-1">
          <Input
            value={config.dataRange || ''}
            onChange={e => onUpdate({ dataRange: e.target.value })}
            placeholder="A1:D10"
            className="h-8 text-xs flex-1"
          />
          <button className="h-8 w-8 flex items-center justify-center border border-border rounded hover:bg-accent/50">
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Axis X */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Axe X</Label>
        <Input
          value={config.axisXLabel || ''}
          onChange={e => onUpdate({ axisXLabel: e.target.value })}
          placeholder="Ajouter Axe X"
          className="h-8 text-xs mt-1"
        />
      </div>

      {/* Series */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Série</Label>
        <div className="space-y-2 mt-1">
          {seriesList.map((s, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30">
              <input
                type="color"
                value={s.color}
                onChange={e => updateSeries(i, { color: e.target.value })}
                className="h-6 w-6 rounded border-0 cursor-pointer"
              />
              <Input
                value={s.name}
                onChange={e => updateSeries(i, { name: e.target.value })}
                className="h-7 text-xs flex-1"
              />
              {config.type === 'combo' && (
                <Select value={s.type || (i === 0 ? 'bar' : 'line')} onValueChange={v => updateSeries(i, { type: v as 'bar' | 'line' | 'area' })}>
                  <SelectTrigger className="h-7 w-20 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Barre</SelectItem>
                    <SelectItem value="line">Ligne</SelectItem>
                    <SelectItem value="area">Aire</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {seriesList.length > 1 && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSeries(i)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addSeries}>
            <Plus className="h-3 w-3 mr-1" /> Ajouter Série
          </Button>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <Checkbox
            id="swap"
            checked={config.swapRowsColumns || false}
            onCheckedChange={v => onUpdate({ swapRowsColumns: !!v })}
          />
          <label htmlFor="swap" className="text-xs">Intervertir les lignes et les colonnes</label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="headerRow"
            checked={config.useHeaderRow || false}
            onCheckedChange={v => onUpdate({ useHeaderRow: !!v })}
          />
          <label htmlFor="headerRow" className="text-xs">Utiliser la ligne 1 pour les en-têtes</label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="labelCol"
            checked={config.useLabelColumn || false}
            onCheckedChange={v => onUpdate({ useLabelColumn: !!v })}
          />
          <label htmlFor="labelCol" className="text-xs">Utiliser la colonne A pour les libellés</label>
        </div>
      </div>
    </div>
  );

  const renderCustomizeTab = () => (
    <div className="space-y-4 p-3">
      {/* Title */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Titre du graphique</Label>
        <Input
          value={config.title}
          onChange={e => onUpdate({ title: e.target.value })}
          className="h-8 text-xs mt-1"
        />
      </div>

      {/* Axis Y */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Titre Axe Y</Label>
        <Input
          value={config.axisYLabel || ''}
          onChange={e => onUpdate({ axisYLabel: e.target.value })}
          placeholder="Ajouter titre"
          className="h-8 text-xs mt-1"
        />
      </div>

      {/* Grid + Legend */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="grid"
            checked={showGrid}
            onCheckedChange={v => onUpdate({ showGridLines: !!v })}
          />
          <label htmlFor="grid" className="text-xs">Afficher la grille</label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="legend"
            checked={showLegend}
            onCheckedChange={v => onUpdate({ showLegend: !!v })}
          />
          <label htmlFor="legend" className="text-xs">Afficher la légende</label>
        </div>
        {!['pie', 'donut'].includes(config.type) && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="smooth"
              checked={smooth}
              onCheckedChange={v => onUpdate({ smooth: !!v })}
            />
            <label htmlFor="smooth" className="text-xs">Courbes lisses</label>
          </div>
        )}
        {['pie', 'donut'].includes(config.type) && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="showLabels"
              checked={config.showLabels !== false}
              onCheckedChange={v => onUpdate({ showLabels: !!v })}
            />
            <label htmlFor="showLabels" className="text-xs">Afficher les étiquettes</label>
          </div>
        )}
      </div>

      {/* Legend position */}
      {showLegend && (
        <div>
          <Label className="text-xs font-medium text-muted-foreground">Position légende</Label>
          <Select value={config.legendPosition || 'bottom'} onValueChange={v => onUpdate({ legendPosition: v as any })}>
            <SelectTrigger className="h-8 text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Haut</SelectItem>
              <SelectItem value="bottom">Bas</SelectItem>
              <SelectItem value="left">Gauche</SelectItem>
              <SelectItem value="right">Droite</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Border radius */}
      {['bar', 'stacked-bar', 'horizontal-bar', 'stacked-horizontal-bar', 'combo'].includes(config.type) && (
        <div>
          <Label className="text-xs font-medium text-muted-foreground">Rayon de bordure: {borderRadius}px</Label>
          <Slider
            value={[borderRadius]}
            onValueChange={([v]) => onUpdate({ borderRadius: v })}
            min={0}
            max={20}
            step={1}
            className="mt-2"
          />
        </div>
      )}

      {/* Opacity */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Opacité: {Math.round(opacity * 100)}%</Label>
        <Slider
          value={[opacity * 100]}
          onValueChange={([v]) => onUpdate({ opacity: v / 100 })}
          min={10}
          max={100}
          step={5}
          className="mt-2"
        />
      </div>

      {/* Font size */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Taille de police: {fontSize}px</Label>
        <Slider
          value={[fontSize]}
          onValueChange={([v]) => onUpdate({ fontSize: v })}
          min={8}
          max={18}
          step={1}
          className="mt-2"
        />
      </div>

      {/* Background color */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Couleur de fond</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={config.backgroundColor || '#ffffff'}
            onChange={e => onUpdate({ backgroundColor: e.target.value })}
            className="h-8 w-8 rounded border border-border cursor-pointer"
          />
          <Input
            value={config.backgroundColor || '#ffffff'}
            onChange={e => onUpdate({ backgroundColor: e.target.value })}
            className="h-8 text-xs flex-1"
          />
        </div>
      </div>

      {/* Color palette */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Palette de couleurs</Label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {colors.slice(0, 10).map((c, i) => (
            <input
              key={i}
              type="color"
              value={c}
              onChange={e => {
                const newColors = [...colors];
                newColors[i] = e.target.value;
                onUpdate({ colors: newColors });
              }}
              className="h-7 w-7 rounded border border-border cursor-pointer"
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex ${expanded ? 'fixed inset-4 z-50' : ''}`}>
      {/* Chart area */}
      <div className={`flex-1 border border-border rounded-l-xl bg-card shadow-sm ${!editorOpen ? 'rounded-r-xl' : ''}`}
           style={{ backgroundColor: config.backgroundColor || undefined }}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
          {titleEditing ? (
            <Input
              value={config.title}
              onChange={e => onUpdate({ title: e.target.value })}
              onBlur={() => setTitleEditing(false)}
              onKeyDown={e => e.key === 'Enter' && setTitleEditing(false)}
              className="max-w-xs h-7 text-sm"
              autoFocus
            />
          ) : (
            <h4
              className="text-sm font-semibold cursor-pointer hover:text-primary"
              onDoubleClick={() => setTitleEditing(true)}
            >
              {config.title}
            </h4>
          )}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditorOpen(!editorOpen)} title="Éditeur de graphique">
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
              {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onRemove}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="p-4">{renderChart()}</div>
      </div>

      {/* Side editor panel - Google Sheets style */}
      {editorOpen && (
        <div className="w-72 border border-l-0 border-border rounded-r-xl bg-card shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Éditeur de graphique</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditorOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Tabs value={editorTab} onValueChange={v => setEditorTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2 mx-3 mt-2 h-8">
              <TabsTrigger value="configure" className="text-xs h-7">Configurer</TabsTrigger>
              <TabsTrigger value="customize" className="text-xs h-7">Personnaliser</TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-1">
              <TabsContent value="configure" className="m-0">
                {renderConfigureTab()}
              </TabsContent>
              <TabsContent value="customize" className="m-0">
                {renderCustomizeTab()}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default SpreadsheetChart;
