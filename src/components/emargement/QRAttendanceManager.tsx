import React, { useState, useEffect } from 'react';
import { QrCode, Users, Send, CheckCircle, ArrowRight, PenTool } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AttendanceSheet } from '@/services/attendanceService';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import QRCodeDisplayModal from './QRCodeDisplayModal';
import InstructorSigningModal from './InstructorSigningModal';
import GeneratedAttendanceSheet from './GeneratedAttendanceSheet';
import RealtimeAttendanceIndicator from './RealtimeAttendanceIndicator';

interface QRAttendanceManagerProps {
  attendanceSheet: AttendanceSheet;
  instructorId: string;
  onUpdate: () => void;
}

interface AttendanceStats {
  totalStudents: number;
  signedStudents: number;
  instructorSigned: boolean;
  canSendToAdmin: boolean;
}

const QRAttendanceManager: React.FC<QRAttendanceManagerProps> = ({
  attendanceSheet,
  instructorId,
  onUpdate
}) => {
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 0,
    signedStudents: 0,
    instructorSigned: false,
    canSendToAdmin: false
  });
  const [showQRModal, setShowQRModal] = useState(false);
  const [showInstructorSignModal, setShowInstructorSignModal] = useState(false);
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);
  const [sendingToAdmin, setSendingToAdmin] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [moduleInfo, setModuleInfo] = useState<{ title: string } | null>(null);

  // Charger les statistiques d'émargement
  const loadStats = async () => {
    try {
      // Récupérer le nombre total d'étudiants inscrits
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('user_formation_assignments')
        .select('user_id')
        .eq('formation_id', attendanceSheet.formation_id);

      if (enrollmentError) throw enrollmentError;

      // Récupérer les signatures
      const { data: signatures, error: signaturesError } = await supabase
        .from('attendance_signatures')
        .select('user_id, user_type')
        .eq('attendance_sheet_id', attendanceSheet.id);

      if (signaturesError) throw signaturesError;

      const studentSignatures = signatures?.filter(s => s.user_type === 'student') || [];
      const instructorSignature = signatures?.find(s => s.user_type === 'instructor' && s.user_id === instructorId);
      
      const totalStudents = enrollments?.length || 0;
      const signedStudents = studentSignatures.length;
      const instructorSigned = !!instructorSignature;
      
      // Le formateur peut envoyer à l'admin si tous les étudiants ont signé et que lui-même a signé
      const canSendToAdmin = signedStudents === totalStudents && instructorSigned && totalStudents > 0;

      setStats({
        totalStudents,
        signedStudents,
        instructorSigned,
        canSendToAdmin
      });
    } catch (error) {
      console.error('Error loading attendance stats:', error);
    }
  };

  // Écouter les mises à jour temps réel
  useEffect(() => {
    loadStats();

    // Charger les informations du module
    const loadModuleInfo = async () => {
      try {
        if (attendanceSheet.schedule_slot_id) {
          const { data: slotData } = await supabase
            .from('schedule_slots')
            .select(`
              module_id,
              formation_modules!module_id(title)
            `)
            .eq('id', attendanceSheet.schedule_slot_id)
            .single();

          if (slotData?.formation_modules) {
            setModuleInfo(slotData.formation_modules as { title: string });
          } else {
            setModuleInfo({ title: attendanceSheet.title || 'Module non spécifié' });
          }
        } else {
          setModuleInfo({ title: attendanceSheet.title || 'Module non spécifié' });
        }
      } catch (error) {
        console.error('Error loading module info:', error);
        setModuleInfo({ title: attendanceSheet.title || 'Module non spécifié' });
      }
    };

    loadModuleInfo();

    const channel = supabase
      .channel('qr_attendance_manager')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_signatures',
          filter: `attendance_sheet_id=eq.${attendanceSheet.id}`
        },
        () => {
          setLastUpdate(new Date());
          loadStats();
          onUpdate();
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [attendanceSheet.id, instructorId]);

  const handleStartQRSession = () => {
    setShowQRModal(true);
  };

  const handleInstructorSign = () => {
    setShowInstructorSignModal(true);
  };

  const handleSendToAdmin = async () => {
    try {
      setSendingToAdmin(true);
      
      // Mettre à jour le statut de la feuille d'émargement à "En attente de validation"
      const { error } = await supabase
        .from('attendance_sheets')
        .update({ 
          status: 'En attente de validation',
          closed_at: new Date().toISOString()
        })
        .eq('id', attendanceSheet.id);

      if (error) throw error;

      toast.success('Feuille d\'émargement envoyée à l\'administration pour validation !');
      onUpdate();
    } catch (error) {
      console.error('Error sending to admin:', error);
      toast.error('Erreur lors de l\'envoi à l\'administration');
    } finally {
      setSendingToAdmin(false);
    }
  };

  const attendanceRate = stats.totalStudents > 0 ? (stats.signedStudents / stats.totalStudents) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* État de la session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Session d'émargement - {attendanceSheet.formations?.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informations de la session */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Formation:</span>
              <div className="font-medium">{attendanceSheet.formations?.title}</div>
            </div>
            <div>
              <span className="text-gray-500">Module:</span>
              <div className="font-medium">
                {moduleInfo?.title || attendanceSheet.title || 'Module non spécifié'}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Date:</span>
              <div className="font-medium">
                {format(new Date(attendanceSheet.date), 'EEEE d MMMM yyyy', { locale: fr })}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Horaires:</span>
              <div className="font-medium">
                {attendanceSheet.start_time.substring(0, 5)} - {attendanceSheet.end_time.substring(0, 5)}
              </div>
            </div>
          </div>

          {/* Informations supplémentaires */}
          {attendanceSheet.room && (
            <div className="pt-2 border-t">
              <span className="text-gray-500 text-sm">Salle:</span>
              <span className="font-medium ml-2">{attendanceSheet.room}</span>
            </div>
          )}

          {/* Statut */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Statut:</span>
              <Badge 
                className={
                  attendanceSheet.status === 'En cours'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : attendanceSheet.status === 'En attente de validation'
                    ? 'bg-orange-100 text-orange-800 border-orange-200'
                    : attendanceSheet.status === 'Validé'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }
              >
                {attendanceSheet.status}
              </Badge>
            </div>
            {/* Badge type de session */}
            {attendanceSheet.session_type === 'autonomie' && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                Session en autonomie
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques d'émargement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Suivi des signatures
            </div>
            <RealtimeAttendanceIndicator 
              isConnected={isRealtimeConnected} 
              lastUpdate={lastUpdate}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Étudiants signés</span>
              <span>{stats.signedStudents}/{stats.totalStudents} ({Math.round(attendanceRate)}%)</span>
            </div>
            <Progress value={attendanceRate} className="h-3" />
          </div>

          {/* Statistiques détaillées */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
              <div className="text-sm text-blue-700">Inscrits</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.signedStudents}</div>
              <div className="text-sm text-green-700">Signés</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.totalStudents - stats.signedStudents}</div>
              <div className="text-sm text-orange-700">En attente</div>
            </div>
          </div>

          {/* Statut formateur */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Signature formateur:</span>
              {stats.instructorSigned ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Signé
                </Badge>
              ) : (
                <Badge variant="outline">En attente</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Démarrer la session QR - uniquement pour les sessions encadrées */}
          {attendanceSheet.status === 'En cours' && attendanceSheet.session_type !== 'autonomie' && (
            <Button 
              onClick={handleStartQRSession}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Afficher le QR Code aux étudiants
            </Button>
          )}

          {/* Message pour les sessions en autonomie */}
          {attendanceSheet.session_type === 'autonomie' && attendanceSheet.status === 'En cours' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <Users className="w-4 h-4" />
                <span className="font-medium">Session en autonomie</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Le QR Code n'est pas disponible pour les sessions en autonomie. 
                L'émargement se fait via les liens envoyés par l'administration.
              </p>
            </div>
          )}


          {/* Consulter la feuille d'émargement */}
          <Button 
            onClick={() => setShowAttendanceSheet(true)}
            variant="outline"
            className="w-full"
          >
            Consulter la feuille d'émargement
          </Button>

          {/* Envoyer à l'administration */}
          {stats.canSendToAdmin && attendanceSheet.status === 'En cours' && (
            <Button 
              onClick={handleSendToAdmin}
              disabled={sendingToAdmin}
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="lg"
            >
              {sendingToAdmin ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Envoyer à l'administration
            </Button>
          )}

          {/* Informations sur l'envoi */}
          {attendanceSheet.status === 'En attente de validation' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-800">
                <ArrowRight className="w-4 h-4" />
                <span className="font-medium">Feuille envoyée à l'administration</span>
              </div>
              <p className="text-sm text-orange-600 mt-1">
                En attente de validation par l'équipe administrative.
              </p>
            </div>
          )}

          {attendanceSheet.status === 'Validé' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Feuille validée</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                La feuille d'émargement a été validée par l'administration.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <QRCodeDisplayModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        attendanceSheet={attendanceSheet}
      />

      <InstructorSigningModal
        isOpen={showInstructorSignModal}
        onClose={() => setShowInstructorSignModal(false)}
        attendanceSheet={attendanceSheet}
        instructorId={instructorId}
        onSigned={() => {
          loadStats();
          onUpdate();
        }}
      />

      {showAttendanceSheet && (
        <GeneratedAttendanceSheet
          attendanceSheetId={attendanceSheet.id}
          onClose={() => setShowAttendanceSheet(false)}
        />
      )}
    </div>
  );
};

export default QRAttendanceManager;