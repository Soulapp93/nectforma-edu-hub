import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEstablishment } from '@/hooks/useEstablishment';
import { supabase } from '@/integrations/supabase/client';
import {
  getTranscriptModules,
  DECISIONS,
  MENTIONS,
  type Transcript,
} from '@/services/gradesService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transcript: Transcript;
}

const TranscriptDetailModal: React.FC<Props> = ({ isOpen, onClose, transcript }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { establishment } = useEstablishment();

  const { data: modules = [] } = useQuery({
    queryKey: ['transcript-modules', transcript.id],
    queryFn: () => getTranscriptModules(transcript.id),
    enabled: !!transcript.id,
  });

  // Get student info
  const { data: student } = useQuery({
    queryKey: ['student-info-transcript', transcript.student_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('users')
        .select('first_name, last_name, email')
        .eq('id', transcript.student_id)
        .single();
      return data;
    },
    enabled: !!transcript.student_id,
  });

  const { data: formation } = useQuery({
    queryKey: ['formation-transcript', transcript.formation_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('formations')
        .select('title, level')
        .eq('id', transcript.formation_id)
        .single();
      return data;
    },
    enabled: !!transcript.formation_id,
  });

  const decisionLabel = DECISIONS.find(d => d.value === transcript.decision)?.label;
  const mentionLabel = MENTIONS.find(m => m.value === transcript.mention)?.label;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Relevé de notes</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .logo { max-height: 60px; }
        h1 { font-size: 20px; margin: 0; }
        .info { margin: 10px 0; }
        .decision { margin-top: 20px; padding: 15px; background: #f8f8f8; border-radius: 8px; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #666; }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Relevé de notes</DialogTitle>
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimer / PDF
            </Button>
          </div>
        </DialogHeader>

        <div ref={printRef} className="space-y-6">
          {/* En-tête établissement */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              {establishment?.logo_url && (
                <img src={establishment.logo_url} alt="" className="h-12 mb-2 logo" />
              )}
              <h2 className="text-lg font-bold">{establishment?.name || 'Établissement'}</h2>
              {establishment?.address && <p className="text-xs text-muted-foreground">{establishment.address}</p>}
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold">RELEVÉ DE NOTES</h1>
              {transcript.period_name && <p className="text-sm">{transcript.period_name}</p>}
            </div>
          </div>

          {/* Infos étudiant */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Étudiant</p>
              <p className="font-semibold">{student?.first_name} {student?.last_name}</p>
              <p className="text-xs text-muted-foreground">{student?.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Formation</p>
              <p className="font-semibold">{formation?.title}</p>
              <p className="text-xs text-muted-foreground">{formation?.level}</p>
            </div>
          </div>

          {/* Tableau des modules */}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-2 border font-semibold">Module</th>
                {modules.some(m => m.ue_title) && <th className="text-left p-2 border font-semibold">UE</th>}
                <th className="text-center p-2 border font-semibold w-20">Coef.</th>
                <th className="text-center p-2 border font-semibold w-24">Moyenne</th>
                <th className="text-center p-2 border font-semibold w-24">Crédits</th>
                <th className="text-center p-2 border font-semibold w-20">Décision</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => (
                <tr key={mod.id} className="border-b">
                  <td className="p-2 border font-medium">{mod.module_title}</td>
                  {modules.some(m => m.ue_title) && <td className="p-2 border text-muted-foreground">{mod.ue_title || '—'}</td>}
                  <td className="p-2 border text-center">{mod.coefficient}</td>
                  <td className="p-2 border text-center font-semibold">
                    {mod.module_average !== null ? (
                      <span className={mod.module_average >= 10 ? 'text-green-600' : 'text-red-600'}>
                        {mod.module_average.toFixed(2)}/20
                      </span>
                    ) : '—'}
                  </td>
                  <td className="p-2 border text-center">
                    {mod.credits_earned !== null ? `${mod.credits_earned}/${mod.credits_possible}` : '—'}
                  </td>
                  <td className="p-2 border text-center">
                    {mod.is_validated ? (
                      <Badge className="bg-green-100 text-green-800 text-[10px]">Validé</Badge>
                    ) : mod.module_average !== null ? (
                      <Badge className="bg-red-100 text-red-800 text-[10px]">Non validé</Badge>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Résultat global */}
          <div className="p-4 bg-muted/30 rounded-lg border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Moyenne générale</span>
              <span className={`text-xl font-bold ${(transcript.general_average || 0) >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                {transcript.general_average?.toFixed(2) || '—'}/20
              </span>
            </div>
            {transcript.validated_credits !== null && (
              <div className="flex items-center justify-between text-sm">
                <span>Crédits validés</span>
                <span>{transcript.validated_credits}/{transcript.total_credits}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="font-semibold">Décision du jury</span>
              <Badge variant="outline" className={DECISIONS.find(d => d.value === transcript.decision)?.color || ''}>
                {decisionLabel || transcript.decision || '—'}
              </Badge>
            </div>
            {mentionLabel && (
              <div className="flex items-center justify-between text-sm">
                <span>Mention</span>
                <span className="font-medium">{mentionLabel}</span>
              </div>
            )}
          </div>

          {/* Pied de page */}
          <div className="flex justify-between text-xs text-muted-foreground pt-4 border-t">
            <span>Document généré le {new Date(transcript.generated_at || '').toLocaleDateString('fr-FR')}</span>
            <span>{establishment?.name}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TranscriptDetailModal;
