import React, { useEffect, useRef, useState } from 'react';
import { QrCode, Users, Send, CheckCircle, ArrowRight, PenTool, Calendar, Clock, MapPin, BookOpen, Wifi, Shield, FileText, UserX } from 'lucide-react';
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

const MIN_REFRESH_MS = 120_000;

const QRAttendanceManager: React.FC<QRAttendanceManagerProps> = ({
  attendanceSheet,
  instructorId,
  onUpdate
}) => {
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 0, signedStudents: 0, instructorSigned: false, canSendToAdmin: false
  });
  const [showQRModal, setShowQRModal] = useState(false);
  const [showInstructorSignModal, setShowInstructorSignModal] = useState(false);
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);
  const [sendingToAdmin, setSendingToAdmin] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [moduleInfo, setModuleInfo] = useState<{ title: string } | null>(null);
  const [instructorAbsent, setInstructorAbsent] = useState(false);
  const [togglingInstructorAbsent, setTogglingInstructorAbsent] = useState(false);

  const isInteractionLocked = showInstructorSignModal;
  const lastLoadAtRef = useRef<number>(0);
  const refreshTimerRef = useRef<number | null>(null);
  const queuedRefreshRef = useRef<boolean>(false);

  const loadStats = async () => {
    try {
      let totalStudents = 0;
      const { data: ufaEnrollments } = await supabase
        .from('user_formation_assignments')
        .select('user_id')
        .eq('formation_id', attendanceSheet.formation_id);
      
      if (ufaEnrollments && ufaEnrollments.length > 0) {
        const userIds = ufaEnrollments.map((e: any) => e.user_id);
        const { data: usersData } = await supabase
          .from('users')
          .select('id, role')
          .in('id', userIds);
        if (usersData) {
          totalStudents = usersData.filter(
            (user: any) => user.role === 'Étudiant' && user.id !== attendanceSheet.instructor_id
          ).length;
        }
      }

      const { data: signatures, error: signaturesError } = await supabase
        .from('attendance_signatures')
        .select('user_id, user_type, present')
        .eq('attendance_sheet_id', attendanceSheet.id);
      if (signaturesError) throw signaturesError;

      const studentSignatures = signatures?.filter(s => s.user_type === 'student') || [];
      const instructorSignature = signatures?.find(s => s.user_type === 'instructor' && s.user_id === instructorId);
      const signedStudents = studentSignatures.length;
      const instructorSigned = !!instructorSignature;

      // Charger le statut instructor_absent depuis la feuille
      const { data: sheetData } = await supabase
        .from('attendance_sheets')
        .select('instructor_absent')
        .eq('id', attendanceSheet.id)
        .single();
      const isInstructorAbsent = sheetData?.instructor_absent === true;
      setInstructorAbsent(isInstructorAbsent);

      const canSendToAdmin = signedStudents === totalStudents && (instructorSigned || isInstructorAbsent) && totalStudents > 0;

      setStats({ totalStudents, signedStudents, instructorSigned, canSendToAdmin });
    } catch (error) {
      console.error('Error loading attendance stats:', error);
    }
  };

  const scheduleRefresh = () => {
    if (isInteractionLocked) { queuedRefreshRef.current = true; return; }
    const now = Date.now();
    const elapsed = now - lastLoadAtRef.current;
    const doRefresh = () => {
      lastLoadAtRef.current = Date.now();
      setLastUpdate(new Date());
      loadStats();
      onUpdate();
    };
    if (elapsed >= MIN_REFRESH_MS || lastLoadAtRef.current === 0) { doRefresh(); return; }
    if (refreshTimerRef.current) return;
    const waitMs = Math.max(0, MIN_REFRESH_MS - elapsed);
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      doRefresh();
    }, waitMs);
  };

  useEffect(() => {
    lastLoadAtRef.current = Date.now();
    loadStats();

    const loadModuleInfo = async () => {
      try {
        if (attendanceSheet.schedule_slot_id) {
          const { data: slotData } = await supabase
            .from('schedule_slots')
            .select(`module_id, formation_modules!module_id(title)`)
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
        setModuleInfo({ title: attendanceSheet.title || 'Module non spécifié' });
      }
    };
    loadModuleInfo();

    const channelName = `qr_manager_${attendanceSheet.id}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_signatures' }, (payload) => {
        if (payload.new && (payload.new as any).attendance_sheet_id === attendanceSheet.id) scheduleRefresh();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance_signatures' }, (payload) => {
        if (payload.new && (payload.new as any).attendance_sheet_id === attendanceSheet.id) scheduleRefresh();
      })
      .subscribe((status) => { setIsRealtimeConnected(status === 'SUBSCRIBED'); });

    const pollingInterval = window.setInterval(() => scheduleRefresh(), MIN_REFRESH_MS);

    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(pollingInterval);
      if (refreshTimerRef.current) { window.clearTimeout(refreshTimerRef.current); refreshTimerRef.current = null; }
    };
  }, [attendanceSheet.id, instructorId]);

  useEffect(() => {
    if (!isInteractionLocked && queuedRefreshRef.current) {
      queuedRefreshRef.current = false;
      scheduleRefresh();
    }
  }, [isInteractionLocked]);

  const handleStartQRSession = async () => {
    try {
      if (attendanceSheet.status === 'En attente' || !attendanceSheet.is_open_for_signing) {
        const { error } = await supabase
          .from('attendance_sheets')
          .update({ status: 'En cours', is_open_for_signing: true, opened_at: new Date().toISOString() })
          .eq('id', attendanceSheet.id);
        if (error) throw error;
        onUpdate();
      }
      setShowQRModal(true);
    } catch (error) {
      toast.error("Impossible d'ouvrir l'émargement pour cette session");
    }
  };

  const handleSendToAdmin = async () => {
    try {
      setSendingToAdmin(true);
      const { error } = await supabase
        .from('attendance_sheets')
        .update({ status: 'En attente de validation', closed_at: new Date().toISOString() })
        .eq('id', attendanceSheet.id);
      if (error) throw error;
      toast.success('Feuille d\'émargement envoyée à l\'administration !');
      onUpdate();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi à l\'administration');
    } finally {
      setSendingToAdmin(false);
    }
  };

  const attendanceRate = stats.totalStudents > 0 ? (stats.signedStudents / stats.totalStudents) * 100 : 0;

  const statusConfig = {
    'En cours': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', dot: 'bg-green-500' },
    'En attente de validation': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-500' },
    'Validé': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-500' },
  };
  const currentStatus = statusConfig[attendanceSheet.status as keyof typeof statusConfig] || { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border', dot: 'bg-muted-foreground' };

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* En-tête principal avec gradient */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-accent rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold leading-tight truncate">
                  Session d'émargement
                </h1>
                <p className="text-white/70 text-sm truncate">
                  {attendanceSheet.formations?.title}
                </p>
              </div>
            </div>
            <Badge className={`${currentStatus.bg} ${currentStatus.text} ${currentStatus.border} self-start sm:self-auto`}>
              <span className={`w-2 h-2 ${currentStatus.dot} rounded-full mr-1.5 ${attendanceSheet.status === 'En cours' ? 'animate-pulse' : ''}`} />
              {attendanceSheet.status}
            </Badge>
          </div>

          {/* Infos session */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-white/60" />
              {format(new Date(attendanceSheet.date), 'EEEE d MMMM yyyy', { locale: fr })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-white/60" />
              {attendanceSheet.start_time.substring(0, 5)} - {attendanceSheet.end_time.substring(0, 5)}
            </span>
            {attendanceSheet.room && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-white/60" />
                {attendanceSheet.room}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-white/60" />
              {moduleInfo?.title || 'Module non spécifié'}
            </span>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground text-sm sm:text-base">Suivi des signatures</h2>
          </div>
          <RealtimeAttendanceIndicator isConnected={isRealtimeConnected} lastUpdate={lastUpdate} />
        </div>

        {/* Progress */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Étudiants signés</span>
            <span className="font-semibold text-foreground">
              {stats.signedStudents}/{stats.totalStudents} ({Math.round(attendanceRate)}%)
            </span>
          </div>
          <Progress value={attendanceRate} className="h-2.5" />
        </div>

        {/* Compteurs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary/5 rounded-xl p-3 text-center border border-primary/10">
            <div className="text-xl sm:text-2xl font-bold text-primary">{stats.totalStudents}</div>
            <div className="text-[11px] sm:text-xs text-primary/70 font-medium mt-0.5">Inscrits</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.signedStudents}</div>
            <div className="text-[11px] sm:text-xs text-green-600/70 font-medium mt-0.5">Signés</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.totalStudents - stats.signedStudents}</div>
            <div className="text-[11px] sm:text-xs text-orange-600/70 font-medium mt-0.5">En attente</div>
          </div>
        </div>

        {/* Signature formateur */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs sm:text-sm text-muted-foreground">Signature formateur</span>
          </div>
          {instructorAbsent ? (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              <UserX className="w-3 h-3 mr-1" />
              Formateur absent
            </Badge>
          ) : stats.instructorSigned ? (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Signé
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">En attente</Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-semibold text-foreground text-sm sm:text-base">Actions</h2>
        </div>

        {/* QR - sessions encadrées */}
        {attendanceSheet.session_type !== 'autonomie' && (attendanceSheet.status === 'En cours' || attendanceSheet.status === 'En attente') && (
          <Button onClick={handleStartQRSession} className="w-full rounded-xl bg-primary hover:bg-primary/90 h-11" size="lg">
            <QrCode className="w-4 h-4 mr-2" />
            {attendanceSheet.status === 'En attente' || !attendanceSheet.is_open_for_signing
              ? "Ouvrir l'émargement & afficher le QR Code"
              : 'Afficher le QR Code aux étudiants'}
          </Button>
        )}

        {/* Autonomie info */}
        {attendanceSheet.session_type === 'autonomie' && (attendanceSheet.status === 'En cours' || attendanceSheet.status === 'En attente') && (
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
            <div className="flex items-center gap-2 text-primary">
              <Users className="w-4 h-4" />
              <span className="font-medium text-sm">Session en autonomie</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Le QR Code n'est pas disponible pour les sessions en autonomie. 
              L'émargement se fait via les liens envoyés par l'administration.
            </p>
          </div>
        )}

        {/* Signer formateur */}
        {!stats.instructorSigned && !instructorAbsent && (attendanceSheet.status === 'En cours') && (
          <Button onClick={() => setShowInstructorSignModal(true)} variant="outline" className="w-full rounded-xl h-11">
            <PenTool className="w-4 h-4 mr-2" />
            Signer en tant que formateur
          </Button>
        )}

        {/* Marquer formateur absent */}
        {!stats.instructorSigned && !instructorAbsent && (attendanceSheet.status === 'En cours') && (
          <Button 
            onClick={async () => {
              try {
                setTogglingInstructorAbsent(true);
                const { error } = await supabase
                  .from('attendance_sheets')
                  .update({ instructor_absent: true })
                  .eq('id', attendanceSheet.id);
                if (error) throw error;
                setInstructorAbsent(true);
                toast.success('Formateur marqué comme absent');
                loadStats();
                onUpdate();
              } catch (error) {
                toast.error('Erreur lors du marquage du formateur absent');
              } finally {
                setTogglingInstructorAbsent(false);
              }
            }} 
            variant="outline" 
            disabled={togglingInstructorAbsent}
            className="w-full rounded-xl h-11 border-red-300 text-red-600 hover:bg-red-50"
          >
            {togglingInstructorAbsent ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2" />
            ) : (
              <UserX className="w-4 h-4 mr-2" />
            )}
            Marquer le formateur absent
          </Button>
        )}

        {/* Annuler absence formateur */}
        {instructorAbsent && !stats.instructorSigned && (attendanceSheet.status === 'En cours') && (
          <Button 
            onClick={async () => {
              try {
                setTogglingInstructorAbsent(true);
                const { error } = await supabase
                  .from('attendance_sheets')
                  .update({ instructor_absent: false })
                  .eq('id', attendanceSheet.id);
                if (error) throw error;
                setInstructorAbsent(false);
                toast.success('Absence du formateur annulée');
                loadStats();
                onUpdate();
              } catch (error) {
                toast.error('Erreur lors de l\'annulation');
              } finally {
                setTogglingInstructorAbsent(false);
              }
            }} 
            variant="outline" 
            disabled={togglingInstructorAbsent}
            className="w-full rounded-xl h-11 border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            {togglingInstructorAbsent ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Annuler l'absence du formateur
          </Button>
        )}

        {/* Consulter feuille */}
        <Button onClick={() => setShowAttendanceSheet(true)} variant="outline" className="w-full rounded-xl h-11">
          <FileText className="w-4 h-4 mr-2" />
          Consulter la feuille d'émargement
        </Button>

        {/* Envoyer admin */}
        {stats.canSendToAdmin && attendanceSheet.status === 'En cours' && (
          <Button onClick={handleSendToAdmin} disabled={sendingToAdmin} className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 h-11" size="lg">
            {sendingToAdmin ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Envoyer à l'administration
          </Button>
        )}

        {/* Statut messages */}
        {attendanceSheet.status === 'En attente de validation' && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <ArrowRight className="w-4 h-4" />
              <span className="font-medium text-sm">Feuille envoyée à l'administration</span>
            </div>
            <p className="text-xs text-orange-600 mt-1">En attente de validation par l'équipe administrative.</p>
          </div>
        )}

        {attendanceSheet.status === 'Validé' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium text-sm">Feuille validée</span>
            </div>
            <p className="text-xs text-green-600 mt-1">La feuille d'émargement a été validée par l'administration.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <QRCodeDisplayModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} attendanceSheet={attendanceSheet} />
      <InstructorSigningModal
        isOpen={showInstructorSignModal}
        onClose={() => setShowInstructorSignModal(false)}
        attendanceSheet={attendanceSheet}
        instructorId={instructorId}
        onSigned={() => { loadStats(); onUpdate(); }}
      />
      {showAttendanceSheet && (
        <GeneratedAttendanceSheet attendanceSheetId={attendanceSheet.id} onClose={() => setShowAttendanceSheet(false)} />
      )}
    </div>
  );
};

export default QRAttendanceManager;
