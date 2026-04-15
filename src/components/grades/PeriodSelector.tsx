import React from 'react';
import { Calendar } from 'lucide-react';

interface Period {
  id: string;
  name: string;
  period_type: string;
  is_locked: boolean;
}

interface PeriodSelectorProps {
  periods: Period[];
  selectedPeriodId: string | null;
  onSelectPeriod: (id: string) => void;
  label?: string;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ periods, selectedPeriodId, onSelectPeriod, label }) => {
  if (periods.length === 0) return null;

  const semesterPeriods = periods.filter(p => p.period_type === 'semestre');
  const examPeriods = periods.filter(p => p.period_type === 'examen_blanc' || p.period_type === 'examen_final' || p.period_type === 'partiels');
  const otherPeriods = periods.filter(p => !['semestre', 'examen_blanc', 'examen_final', 'partiels'].includes(p.period_type));

  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="period-selector">
      {label && (
        <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1 shrink-0">
          <Calendar className="h-3.5 w-3.5" />
          {label}
        </span>
      )}
      {semesterPeriods.map(p => (
        <button
          key={p.id}
          onClick={() => onSelectPeriod(p.id)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all border whitespace-nowrap ${
            selectedPeriodId === p.id
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-background border-border hover:bg-primary/10 hover:border-primary/40 text-foreground'
          }`}
          data-testid={`period-btn-${p.id}`}
        >
          {p.name}
        </button>
      ))}
      {examPeriods.length > 0 && semesterPeriods.length > 0 && (
        <div className="w-px h-4 bg-border shrink-0" />
      )}
      {examPeriods.map(p => (
        <button
          key={p.id}
          onClick={() => onSelectPeriod(p.id)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all border whitespace-nowrap ${
            selectedPeriodId === p.id
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-background border-amber-200 text-amber-700 hover:bg-amber-50'
          }`}
          data-testid={`period-btn-${p.id}`}
        >
          {p.name}
        </button>
      ))}
      {otherPeriods.map(p => (
        <button
          key={p.id}
          onClick={() => onSelectPeriod(p.id)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all border whitespace-nowrap ${
            selectedPeriodId === p.id
              ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
              : 'bg-background border-border hover:bg-blue-50'
          }`}
          data-testid={`period-btn-${p.id}`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
};

export default PeriodSelector;
