import {
  FileText, ClipboardCheck, PenLine, FileQuestion,
  GraduationCap, FileCheck, RefreshCw, Sparkles, LucideIcon,
} from 'lucide-react';

export type EvaluationType =
  | 'devoir_maison'
  | 'controle_continu'
  | 'devoir_surveille'
  | 'examen_blanc'
  | 'examen_final'
  | 'partiel'
  | 'rattrapage'
  | 'autre';

export const EVALUATION_TYPE_META: Record<EvaluationType, { label: string; color: string; icon: LucideIcon }> = {
  devoir_maison:    { label: 'Devoir maison',    color: '#3B82F6', icon: FileText },
  controle_continu: { label: 'Contrôle continu', color: '#8B5CF6', icon: ClipboardCheck },
  devoir_surveille: { label: 'Devoir surveillé', color: '#EC4899', icon: PenLine },
  examen_blanc:     { label: 'Examen blanc',     color: '#F59E0B', icon: FileQuestion },
  examen_final:     { label: 'Examen final',     color: '#DC2626', icon: GraduationCap },
  partiel:          { label: 'Partiel',          color: '#EF4444', icon: FileCheck },
  rattrapage:       { label: 'Rattrapage',       color: '#F97316', icon: RefreshCw },
  autre:            { label: 'Autre',            color: '#64748B', icon: Sparkles },
};

export const EVALUATION_TYPE_ORDER: EvaluationType[] = [
  'devoir_maison', 'controle_continu', 'devoir_surveille', 'examen_blanc',
  'examen_final', 'partiel', 'rattrapage', 'autre',
];

export const getEvaluationMeta = (type?: string | null) => {
  if (!type) return EVALUATION_TYPE_META.devoir_maison;
  return EVALUATION_TYPE_META[type as EvaluationType] || EVALUATION_TYPE_META.autre;
};
