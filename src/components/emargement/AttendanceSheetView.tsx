import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, FileText, Download, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AttendanceSheet, AttendanceSignature } from '@/services/attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceSheetViewProps {
  attendanceSheet: AttendanceSheet;
  onExportPDF?: () => void;
  onValidate?: () => void;
  showActions?: boolean;
}

const AttendanceSheetView: React.FC<AttendanceSheetViewProps> = ({
  attendanceSheet: initialAttendanceSheet,
  onExportPDF,
  onValidate,
  showActions = true
}) => {
  const [attendanceSheet, setAttendanceSheet] = useState<AttendanceSheet>(initialAttendanceSheet);
  const [realTimeSignatures, setRealTimeSignatures] = useState<AttendanceSignature[]>(attendanceSheet.signatures || []);

  // Écouter les mises à jour en temps réel des signatures
  useEffect(() => {
    if (!attendanceSheet.id) return;

    const loadSignatures = async () => {
      const { data: signatures, error } = await supabase
        .from('attendance_signatures')
        .select('*')
        .eq('attendance_sheet_id', attendanceSheet.id);

      if (!error && signatures) {
        setRealTimeSignatures(signatures as unknown as AttendanceSignature[]);
      }
    };

    // Charger les signatures existantes au montage
    loadSignatures();

    const channel = supabase
      .channel(`attendance_sheet_view_${attendanceSheet.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_signatures',
          filter: `attendance_sheet_id=eq.${attendanceSheet.id}`
        },
        async () => {
          logger.log('Real-time signature update received');
          await loadSignatures();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [attendanceSheet.id]);

  // Mettre à jour l'attendance sheet avec les nouvelles signatures
  useEffect(() => {
    setAttendanceSheet(prev => ({
      ...prev,
      signatures: realTimeSignatures
    }));
  }, [realTimeSignatures]);

  const signedUsers = realTimeSignatures?.filter(sig => sig.present) || [];
  const absentUsers = realTimeSignatures?.filter(sig => !sig.present) || [];
  const delayedUsers = realTimeSignatures?.filter(sig => sig.present && sig.user_type === 'student') || [];

  // Simulated total expected users (in production, fetch from formation enrollment)
  const totalExpectedUsers = Math.max(signedUsers.length + absentUsers.length, 8);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Présent':
        return 'bg-success-muted text-success border-success/30';
      case 'Retard':
        return 'bg-warning-muted text-warning border-warning/30';
      case 'Absent':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="bg-card">
      {/* Header */}
      <div 
        className="text-white p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, hsl(262, 83%, 58%), hsl(280, 75%, 60%))',
        }}
      >
        <h1 className="text-2xl font-bold mb-4">FEUILLE D'ÉMARGEMENT</h1>
        <h2 className="text-lg font-semibold mb-2">{attendanceSheet.formations?.title}</h2>
        
        <div className="flex justify-center items-center space-x-8 mt-4 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{format(new Date(attendanceSheet.date), 'dd/MM/yyyy', { locale: fr })}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{attendanceSheet.start_time.substring(0, 5)}</span>
          </div>
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            <span>{attendanceSheet.room || 'A101'}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{attendanceSheet.instructor?.first_name} {attendanceSheet.instructor?.last_name}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="p-6 border-b bg-muted/50 flex justify-between items-center">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger en PDF
            </Button>
            <Button onClick={onValidate} className="bg-success hover:bg-success/90 text-success-foreground">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Valider & Signer
            </Button>
          </div>
        </div>
      )}

      {/* Participants List */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          Liste des participants ({signedUsers.length + 3})
        </h3>
        
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Nom et Prénom
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Statut
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Motif
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Signature
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Present Users */}
              {signedUsers.map((signature, index) => (
                <tr key={signature.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-success mr-2"></div>
                      <div>
                        <div className="font-medium text-foreground">
                          {signature.user?.first_name} {signature.user?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Licence Informatique L1
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-success-muted text-success">
                      Présent.e
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                    -
                  </td>
                  <td className="px-4 py-3 text-center">
                    {signature.signature_data ? (
                      <img
                        src={signature.signature_data}
                        alt="Signature"
                        className="h-8 max-w-20 object-contain mx-auto border rounded"
                      />
                    ) : (
                      <div className="text-xs text-muted-foreground/60">Non signé</div>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* Demo delayed user */}
              <tr className="bg-card">
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-warning mr-2"></div>
                    <div>
                      <div className="font-medium text-foreground">Dan</div>
                      <div className="text-sm text-muted-foreground">Licence Informatique L1</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-warning-muted text-warning">
                    Retard
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                  Transport
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="text-xs text-muted-foreground/60">Non signé</div>
                </td>
              </tr>

              {/* Demo absent users */}
              <tr className="bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-destructive mr-2"></div>
                    <div>
                      <div className="font-medium text-foreground">Eva</div>
                      <div className="text-sm text-muted-foreground">Licence Informatique L1</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-destructive/10 text-destructive">
                    Absent.e
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                  Maladie
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="text-xs text-muted-foreground/60">Absent</div>
                </td>
              </tr>

              <tr className="bg-card">
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-destructive mr-2"></div>
                    <div>
                      <div className="font-medium text-foreground">Frank</div>
                      <div className="text-sm text-muted-foreground">Licence Informatique L1</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-destructive/10 text-destructive">
                    Absent.e
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                  Autre
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="text-xs text-muted-foreground/60">Absent</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Signatures Section */}
      <div className="p-6 border-t bg-muted/50">
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
          {/* Signature formateur - TOUJOURS affichée (même en autonomie) */}
          <div className="text-center">
            <h4 className="font-semibold mb-2 text-foreground">Signature du Formateur</h4>

            <div className="h-20 border-2 border-border rounded-lg flex items-center justify-center bg-background">
              {((attendanceSheet as any).instructor_absent) ? (
                <span
                  className="text-2xl text-muted-foreground italic"
                  style={{ fontFamily: 'cursive, "Brush Script MT", "Segoe Script", Georgia, serif' }}
                >
                  ABSENT
                </span>
              ) : attendanceSheet.signatures?.find(sig => sig.user_type === 'instructor')?.signature_data ? (
                <img
                  src={attendanceSheet.signatures.find(sig => sig.user_type === 'instructor')?.signature_data}
                  alt="Signature formateur"
                  className="h-16 max-w-32 object-contain"
                />
              ) : (
                <div className="w-32 h-12 bg-muted rounded flex items-center justify-center">
                  <span className="text-muted-foreground text-xs">Signature requise</span>
                </div>
              )}
            </div>

            <div className="mt-2 text-center text-sm text-muted-foreground border-t border-border pt-2">
              {attendanceSheet.instructor ? `${attendanceSheet.instructor.first_name} ${attendanceSheet.instructor.last_name}` : 'Non assigné'}
            </div>
          </div>

          <div className="text-center">
            <h4 className="font-semibold mb-2 text-foreground">Signature de l'Administration</h4>
            <div className="h-20 border-2 border-border rounded-lg flex items-center justify-center bg-background">
              <div className="w-32 h-12 bg-muted rounded flex items-center justify-center">
                <span className="text-muted-foreground text-xs">Signature requise</span>
              </div>
            </div>
            <div className="mt-2 text-center text-sm text-muted-foreground border-t border-border pt-2">
              Administration
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceSheetView;