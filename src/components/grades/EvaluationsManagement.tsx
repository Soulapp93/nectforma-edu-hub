import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Eye, Lock, Unlock, Calendar, BookOpen } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import {
  getEvaluations,
  getEvaluationsByInstructor,
  deleteEvaluation,
  updateEvaluation,
  EVALUATION_STATUSES,
  EVALUATION_TYPES,
  type Evaluation,
} from '@/services/gradesService';
import CreateEvaluationModal from './CreateEvaluationModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  mode: 'admin' | 'instructor';
}

const EvaluationsManagement: React.FC<Props> = ({ mode }) => {
  const { userId } = useCurrentUser();
  const queryClient = useQueryClient();
  const [selectedFormation, setSelectedFormation] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);

  // Fetch formations
  const { data: formations = [] } = useQuery({
    queryKey: ['formations-for-grades'],
    queryFn: async () => {
      if (mode === 'instructor') {
        const { data } = await supabase
          .from('user_formation_assignments')
          .select('formation_id, formations(id, title, status)')
          .eq('user_id', userId!);
        return (data || []).map((d: any) => d.formations).filter(Boolean);
      }
      const { data } = await supabase
        .from('formations')
        .select('id, title, status')
        .order('title');
      return data || [];
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (formations.length > 0 && !selectedFormation) {
      setSelectedFormation(formations[0].id);
    }
  }, [formations]);

  // Fetch evaluations
  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ['evaluations', selectedFormation, mode],
    queryFn: () => {
      if (mode === 'instructor' && userId) {
        return getEvaluationsByInstructor(userId);
      }
      return getEvaluations(selectedFormation);
    },
    enabled: mode === 'instructor' ? !!userId : !!selectedFormation,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      toast.success('Évaluation supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, isPublished }: { id: string; status: string; isPublished: boolean }) =>
      updateEvaluation(id, { status, is_published: isPublished } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      toast.success('Statut mis à jour');
    },
  });

  const getStatusBadge = (status: string) => {
    const s = EVALUATION_STATUSES.find(es => es.value === status);
    return s ? <Badge className={s.color}>{s.label}</Badge> : <Badge>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const t = EVALUATION_TYPES.find(et => et.value === type);
    return <Badge variant="outline">{t?.label || type}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {mode === 'admin' && (
          <Select value={selectedFormation} onValueChange={setSelectedFormation}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Sélectionner une formation" />
            </SelectTrigger>
            <SelectContent>
              {formations.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle évaluation
        </Button>
      </div>

      {/* Liste des évaluations */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : evaluations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Aucune évaluation</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Créez votre première évaluation pour commencer
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {evaluations.map((evaluation) => (
            <Card key={evaluation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-foreground">{evaluation.title}</h4>
                      {getStatusBadge(evaluation.status)}
                      {getTypeBadge(evaluation.evaluation_type)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {evaluation.module_title && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          {evaluation.module_title}
                        </span>
                      )}
                      {evaluation.evaluation_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(evaluation.evaluation_date), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                      <span>Coef. {evaluation.coefficient} • Barème /{evaluation.scale}</span>
                      {evaluation.period_name && (
                        <span>{evaluation.period_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {evaluation.status === 'brouillon' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => statusMutation.mutate({ id: evaluation.id, status: 'ouvert', isPublished: false })}
                      >
                        <Unlock className="h-3.5 w-3.5 mr-1" />
                        Ouvrir
                      </Button>
                    )}
                    {evaluation.status === 'ouvert' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => statusMutation.mutate({ id: evaluation.id, status: 'cloture', isPublished: false })}
                      >
                        <Lock className="h-3.5 w-3.5 mr-1" />
                        Clôturer
                      </Button>
                    )}
                    {evaluation.status === 'cloture' && mode === 'admin' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => statusMutation.mutate({ id: evaluation.id, status: 'diffuse', isPublished: true })}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Diffuser
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingEvaluation(evaluation)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {evaluation.status === 'brouillon' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('Supprimer cette évaluation ?')) {
                            deleteMutation.mutate(evaluation.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de création/édition */}
      {(showCreateModal || editingEvaluation) && (
        <CreateEvaluationModal
          isOpen={true}
          onClose={() => { setShowCreateModal(false); setEditingEvaluation(null); }}
          evaluation={editingEvaluation}
          formationId={selectedFormation}
          mode={mode}
        />
      )}
    </div>
  );
};

export default EvaluationsManagement;
