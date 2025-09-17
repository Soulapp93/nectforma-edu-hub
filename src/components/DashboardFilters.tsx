import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Filter } from 'lucide-react';
import { useFormations } from '@/hooks/useFormations';

interface DashboardFiltersProps {
  selectedFormationId?: string;
  onFormationChange: (formationId?: string) => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  selectedFormationId,
  onFormationChange
}) => {
  const { formations, loading } = useFormations();

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filtres :</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Formation :</label>
            <Select 
              value={selectedFormationId || 'all'} 
              onValueChange={(value) => onFormationChange(value === 'all' ? undefined : value)}
              disabled={loading}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Sélectionner une formation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les formations</SelectItem>
                {formations.map((formation) => (
                  <SelectItem 
                    key={formation.id} 
                    value={formation.id}
                  >
                    {formation.title} - {formation.level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardFilters;