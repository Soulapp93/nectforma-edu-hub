import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Eye, Send, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import {
  getTranscripts,
  getStudentTranscripts,
  getEvaluationPeriods,
  updateTranscript,
  DECISIONS,
  MENTIONS,
  type Transcript,
} from '@/services/gradesService';
import GenerateTranscriptModal from './GenerateTranscriptModal';
import TranscriptDetailModal from './TranscriptDetailModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  mode: 'admin' | 'student';
  studentId?: string;
}

const TranscriptsPanel: React.FC<Props> = ({ mode, studentId }) => {
  const { userId } = useCurrentUser();
  const queryClient = useQueryClient();
  const [selectedFormation, setSelectedFormation] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [viewTranscript, setViewTranscript] = useState<Transcript | null>(null);

  // Formations (admin)
  const { data: formations = [] } = useQuery({
    queryKey: ['formations-for-transcripts'],
    queryFn: async () => {
      const { data } = await supabase.from('formations').select('id, title').order('title');
      return data || [];
    },
    enabled: mode === 'admin',
  });

  // Periods
  const { data: periods = [] } = useQuery({
    queryKey: ['periods-for-transcripts', selectedFormation],
    queryFn: () => getEvaluationPeriods(selectedFormation),
    enabled: !!selectedFormation && mode === 'admin',
  });

  // Transcripts
  const { data: transcripts = [], isLoading } = useQuery({
    queryKey: ['transcripts', mode, selectedFormation, selectedPeriod, studentId],
    queryFn: () => {
      if (mode === 'student' && studentId) {
        return getStudentTranscripts(studentId);
      }
      return getTranscripts(selectedFormation, selectedPeriod || undefined);
    },
    enabled: mode === 'student' ? !!studentId : !!selectedFormation,
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => updateTranscript(id, {
      is_published: true,
      published_at: new Date().toISOString(),
    } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcripts'] });
      toast.success('Relevé publié');
    },
  });

  const getDecisionBadge = (decision: string | null) => {
    const d = DECISIONS.find(dec => dec.value === decision);
    if (!d) return null;
    return <Badge variant="outline" className={d.color}>{d.label}</Badge>;
  };

  const getMentionLabel = (mention: string | null) => {
    const m = MENTIONS.find(me => me.value === mention);
    return m?.label || null;
  };

  return (
    <div className="space-y-4">
      {mode === 'admin' && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-wrap">
            <Select value={selectedFormation} onValueChange={(v) => { setSelectedFormation(v); setSelectedPeriod(''); }}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Sélectionner une formation" />
              </SelectTrigger>
              <SelectContent>
                {formations.map((f: any) => (
                  <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {periods.length > 0 && (
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Toutes les périodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes</SelectItem>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {selectedFormation && (
            <Button onClick={() => setShowGenerateModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Générer des relevés
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : transcripts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Aucun relevé de notes</h3>
            <p className="text-sm text-muted-foreground">
              {mode === 'admin' ? 'Générez des relevés pour une formation et une période' : 'Vos relevés apparaîtront ici'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {transcripts.map((transcript) => (
            <Card key={transcript.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">
                        {transcript.formation_title || 'Relevé'}
                        {transcript.period_name ? ` — ${transcript.period_name}` : ''}
                      </h4>
                      {getDecisionBadge(transcript.decision)}
                      {!transcript.is_published && mode === 'admin' && (
                        <Badge variant="secondary">Non publié</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {transcript.general_average !== null && (
                        <span className="font-medium">
                          Moyenne: <span className={transcript.general_average >= 10 ? 'text-green-600' : 'text-red-600'}>
                            {transcript.general_average}/20
                          </span>
                        </span>
                      )}
                      {transcript.mention && (
                        <span>Mention: {getMentionLabel(transcript.mention)}</span>
                      )}
                      {transcript.validated_credits !== null && transcript.total_credits !== null && (
                        <span>{transcript.validated_credits}/{transcript.total_credits} crédits</span>
                      )}
                      {transcript.generated_at && (
                        <span>Généré le {format(new Date(transcript.generated_at), 'dd/MM/yyyy', { locale: fr })}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setViewTranscript(transcript)}>
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Voir
                    </Button>
                    {mode === 'admin' && !transcript.is_published && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => publishMutation.mutate(transcript.id)}
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Publier
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showGenerateModal && (
        <GenerateTranscriptModal
          isOpen={true}
          onClose={() => setShowGenerateModal(false)}
          formationId={selectedFormation}
        />
      )}

      {viewTranscript && (
        <TranscriptDetailModal
          isOpen={true}
          onClose={() => setViewTranscript(null)}
          transcript={viewTranscript}
        />
      )}
    </div>
  );
};

export default TranscriptsPanel;
