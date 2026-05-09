import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';
import type { AppreciationRange, MentionConfig, SignatoryConfig } from '@/types/bulletinConfig';

export const ConfigCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  onClick: () => void;
  testId: string;
}> = ({ icon, title, description, accent, onClick, testId }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-left rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all p-5 flex flex-col gap-3 group"
    data-testid={testId}
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent}`}>
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-foreground text-base">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{description}</p>
    </div>
    <span className="text-sm font-medium text-primary group-hover:underline">Configurer →</span>
  </button>
);

export const ColorField: React.FC<{ label: string; value?: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <Label>{label}</Label>
    <div className="flex gap-2 items-center">
      <Input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="w-14 h-9 p-1" />
      <Input value={value || ''} onChange={(e) => onChange(e.target.value)} className="flex-1 text-xs" />
    </div>
  </div>
);

export const AppreciationRangeRow: React.FC<{
  range: AppreciationRange;
  onChange: (r: AppreciationRange) => void;
  onDelete: () => void;
}> = ({ range, onChange, onDelete }) => (
  <div className="flex gap-2 items-center">
    <Input type="number" value={range.min} onChange={(e) => onChange({ ...range, min: Number(e.target.value) })} className="w-16 text-xs" placeholder="min" />
    <span className="text-xs">à</span>
    <Input type="number" value={range.max} onChange={(e) => onChange({ ...range, max: Number(e.target.value) })} className="w-16 text-xs" placeholder="max" />
    <Input value={range.text} onChange={(e) => onChange({ ...range, text: e.target.value })} className="flex-1 text-xs" placeholder="Appréciation" />
    <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
  </div>
);

export const MentionRow: React.FC<{
  mention: MentionConfig;
  onChange: (m: MentionConfig) => void;
  onDelete: () => void;
}> = ({ mention, onChange, onDelete }) => (
  <div className="flex gap-2 items-center">
    <Input value={mention.label} onChange={(e) => onChange({ ...mention, label: e.target.value })} className="flex-1 text-xs" placeholder="Label (Bien, TB...)" />
    <span className="text-xs">≥</span>
    <Input type="number" value={mention.threshold} onChange={(e) => onChange({ ...mention, threshold: Number(e.target.value) })} className="w-20 text-xs" />
    <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
  </div>
);

export const SignatoryRow: React.FC<{
  signatory: SignatoryConfig;
  onChange: (s: SignatoryConfig) => void;
  onDelete: () => void;
}> = ({ signatory, onChange, onDelete }) => (
  <div className="flex gap-2 items-center border rounded p-2">
    <Input value={signatory.role_label} onChange={(e) => onChange({ ...signatory, role_label: e.target.value })} className="flex-1 text-xs" placeholder="Rôle (Directeur pédagogique, ...)" />
    <Input type="number" value={signatory.order ?? 1} onChange={(e) => onChange({ ...signatory, order: Number(e.target.value) })} className="w-16 text-xs" placeholder="Ordre" />
    <div className="flex items-center gap-1">
      <Checkbox checked={!!signatory.required} onCheckedChange={(c) => onChange({ ...signatory, required: !!c })} />
      <span className="text-xs">Obligatoire</span>
    </div>
    <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
  </div>
);
