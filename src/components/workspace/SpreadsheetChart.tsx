import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { X, Maximize2, Minimize2 } from 'lucide-react';

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'radar' | 'scatter' | 'donut' | 'stacked-bar' | 'horizontal-bar';

interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  dataRange: string;
  labelsRange: string;
  colors: string[];
}

interface Props {
  config: ChartConfig;
  data: { label: string; value: number; value2?: number }[];
  onRemove: () => void;
  onUpdate: (config: Partial<ChartConfig>) => void;
}

const CHART_COLORS = [
  'hsl(var(--primary))', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316',
  '#6366f1', '#14b8a6', '#e11d48', '#a855f7'
];

const SpreadsheetChart: React.FC<Props> = ({ config, data, onRemove, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  const colors = config.colors?.length ? config.colors : CHART_COLORS;

  const renderChart = () => {
    const chartData = data.map((d, i) => ({ ...d, fill: colors[i % colors.length] }));
    const height = expanded ? 500 : 300;

    switch (config.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name={config.title} radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Bar>
              {data.some(d => d.value2 !== undefined) && (
                <Bar dataKey="value2" name="Série 2" radius={[4, 4, 0, 0]} fill={colors[1]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'stacked-bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip /><Legend />
              <Bar dataKey="value" stackId="a" fill={colors[0]} radius={[0, 0, 0, 0]} />
              {data.some(d => d.value2 !== undefined) && (
                <Bar dataKey="value2" stackId="a" fill={colors[1]} radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'horizontal-bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip /><Legend />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip /><Legend />
              <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              {data.some(d => d.value2 !== undefined) && (
                <Line type="monotone" dataKey="value2" stroke={colors[1]} strokeWidth={2} dot={{ r: 4 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip /><Legend />
              <Area type="monotone" dataKey="value" stroke={colors[0]} fill={colors[0]} fillOpacity={0.3} strokeWidth={2} />
              {data.some(d => d.value2 !== undefined) && (
                <Area type="monotone" dataKey="value2" stroke={colors[1]} fill={colors[1]} fillOpacity={0.2} strokeWidth={2} />
              )}
            </AreaChart>
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
                label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)`}
                labelLine
              >
                {chartData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid />
              <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fontSize: 10 }} />
              <Radar name={config.title} dataKey="value" stroke={colors[0]} fill={colors[0]} fillOpacity={0.3} />
              <Tooltip /><Legend />
            </RadarChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="value" name="X" tick={{ fontSize: 11 }} />
              <YAxis dataKey="value2" name="Y" tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name={config.title} data={chartData.filter(d => d.value2 !== undefined)} fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`border border-border rounded-xl bg-card shadow-sm ${expanded ? 'fixed inset-4 z-50' : ''}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        {editing ? (
          <Input
            value={config.title}
            onChange={e => onUpdate({ title: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={e => e.key === 'Enter' && setEditing(false)}
            className="max-w-xs h-7 text-sm"
            autoFocus
          />
        ) : (
          <h4
            className="text-sm font-semibold cursor-pointer hover:text-primary"
            onDoubleClick={() => setEditing(true)}
          >
            {config.title}
          </h4>
        )}
        <div className="flex items-center gap-1">
          <Select value={config.type} onValueChange={(v: ChartType) => onUpdate({ type: v })}>
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Barres</SelectItem>
              <SelectItem value="stacked-bar">Barres empilées</SelectItem>
              <SelectItem value="horizontal-bar">Barres horizontales</SelectItem>
              <SelectItem value="line">Ligne</SelectItem>
              <SelectItem value="area">Aire</SelectItem>
              <SelectItem value="pie">Camembert</SelectItem>
              <SelectItem value="donut">Donut</SelectItem>
              <SelectItem value="radar">Radar</SelectItem>
              <SelectItem value="scatter">Nuage de points</SelectItem>
            </SelectContent>
          </Select>
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
  );
};

export default SpreadsheetChart;
