import React, { useState, useEffect } from 'react';
import { X, Edit, Download, CheckCircle2, CheckCircle, XCircle, Clock, Building, UserX, ToggleLeft, ToggleRight, PenTool, Timer, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AttendanceSheet, attendanceService } from '@/services/attendanceService';
import { pdfExportService } from '@/services/pdfExportService';
import AdminValidationModal from './AdminValidationModal';
import AbsenceReasonModal from './AbsenceReasonModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface EnhancedAttendanceSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceSheet: AttendanceSheet;
  onUpdate: () => void;
  onValidateSheet: (sheet: AttendanceSheet) => Promise<void>;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  formation: string;
  signature?: {
    id: string;
    attendance_sheet_id: string;
    user_id: string;
    user_type: string;
    signature_data?: string;
    signed_at: string;
    present: boolean;
    absence_reason?: string;
    absence_reason_type?: string;
    delay_minutes?: number;
    created_at: string;
    updated_at: string;
    users?: {
      first_name: string;
      last_name: string;
      email: string;
    } | null;
  };
}

const ABSENCE_MOTIFS = [
  'Congé',
  'Maladie', 
  'Mission professionnelle',
  'Familiale',
  'Autre'
];

const EnhancedAttendanceSheetModal: React.FC<EnhancedAttendanceSheetModalProps> = ({
  isOpen,
  onClose,
  attendanceSheet,
  onUpdate,
  onValidateSheet
}) => {
  const { userId } = useCurrentUser();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [students, setStudents] = useState<Student[]>([]);
  const [adminSignature, setAdminSignature] = useState<string>('');
  const [instructorSignature, setInstructorSignature] = useState<string>('');
  const [instructorName, setInstructorName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [togglingStudentId, setTogglingStudentId] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [establishmentInfo, setEstablishmentInfo] = useState<{ logo_url: string | null; name: string } | null>(null);
  const [isInstructorAbsentLocal, setIsInstructorAbsentLocal] = useState(false);
  const [togglingInstructorAbsent, setTogglingInstructorAbsent] = useState(false);

  // Charger les données de la feuille d'émargement
  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les signatures séparément (sans jointure users)
      const { data: signatures, error: signaturesError } = await supabase
        .from('attendance_signatures')
        .select('*')
        .eq('attendance_sheet_id', attendanceSheet.id);

      if (signaturesError) throw signaturesError;

      // Récupérer les étudiants inscrits à la formation
      // IMPORTANT: Exclure le formateur de la liste des participants
      const instructorIdToExclude = attendanceSheet.instructor_id;
      
      let enrolledStudents: any[] = [];
      
      // Récupérer les étudiants via user_formation_assignments
      const { data: ufaData, error: ufaError } = await supabase
        .from('user_formation_assignments')
        .select(`user_id`)
        .eq('formation_id', attendanceSheet.formation_id);

      if (!ufaError && ufaData && ufaData.length > 0) {
        // Récupérer les détails des utilisateurs séparément
        const userIds = ufaData.map((e: any) => e.user_id);
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, role')
          .in('id', userIds);

        if (!usersError && usersData) {
          // FILTRER STRICTEMENT : uniquement rôle "Étudiant" ET exclure le formateur
          enrolledStudents = usersData
            .filter((user: any) => user.role === 'Étudiant' && user.id !== instructorIdToExclude)
            .map((user: any) => ({ student_id: user.id, users: user }));
        }
      }

      console.log('Étudiants inscrits (modal admin, après filtrage):', enrolledStudents.length, 'Formateur exclu:', instructorIdToExclude);

      // Récupérer uniquement les signatures d'étudiants (user_type = 'student')
      const studentSignatures = signatures?.filter((sig: any) => sig.user_type === 'student') || [];

      // Mapper les étudiants avec leurs signatures
      const mappedStudents: Student[] = enrolledStudents.map((enrollment: any) => {
        const studentId = enrollment.users?.id || enrollment.student_id;
        return {
          id: studentId,
          firstName: enrollment.users?.first_name || '',
          lastName: enrollment.users?.last_name || '',
          formation: (attendanceSheet.formations as any)?.title || '',
          signature: studentSignatures.find((sig: any) => sig.user_id === studentId)
        };
      });

      setStudents(mappedStudents);
      
      // Charger les signatures existantes si disponibles
      console.log('Signatures récupérées:', signatures);
      console.log('instructor_id de la feuille:', attendanceSheet.instructor_id);
      console.log('validated_by de la feuille:', attendanceSheet.validated_by);
      
      // Signature du formateur: prendre la première signature de type "instructor",
      // même si instructor_id n'est pas renseigné sur la feuille
      const instructorSigRecord = signatures?.find((sig: any) => sig.user_type === 'instructor');
      const instrSig = instructorSigRecord?.signature_data;
      
      console.log('Signature formateur trouvée:', !!instrSig);
      console.log('ID formateur (attendance_sheet.instructor_id):', attendanceSheet.instructor_id);

      // Variable pour savoir si on a déjà récupéré le nom du formateur
      let instructorNameFetched = false;

      if (instrSig) {
        console.log('Utilisation de la signature formateur persistée');
        setInstructorSignature(instrSig);
        // Récupérer le nom du formateur séparément
        if (instructorSigRecord?.user_id) {
          const { data: instructorData } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', instructorSigRecord.user_id)
            .single();
          if (instructorData) {
            setInstructorName(`${instructorData.first_name} ${instructorData.last_name}`);
            instructorNameFetched = true;
          }
        }
      }

      // IMPORTANT: Toujours charger le nom du formateur depuis instructor_id même s'il n'a pas signé
      if (!instructorNameFetched && attendanceSheet.instructor_id) {
        const { data: instructorData } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', attendanceSheet.instructor_id)
          .single();
        if (instructorData) {
          setInstructorName(`${instructorData.first_name} ${instructorData.last_name}`);
        }
      }

      // Charger la signature administrative depuis user_signatures si possible
      const adminId = attendanceSheet.validated_by || userId;
      if (adminId) {
        console.log('Chargement signature admin pour utilisateur:', adminId);
        const { data: adminSigData, error: adminSigError } = await supabase
          .from('user_signatures')
          .select('signature_data')
          .eq('user_id', adminId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (adminSigError) {
          console.error('Erreur récupération signature admin:', adminSigError);
        } else if (adminSigData && adminSigData.signature_data) {
          console.log('Signature admin trouvée dans user_signatures');
          setAdminSignature(adminSigData.signature_data);
        } else {
          console.log('Aucune signature admin trouvée dans user_signatures');
          setAdminSignature('');
        }
      }

      // Load establishment info for logo
      if (attendanceSheet.formation_id) {
        const { data: formationData, error: formationError } = await supabase
          .from('formations')
          .select('establishment_id')
          .eq('id', attendanceSheet.formation_id)
          .single();
        
        if (!formationError && formationData?.establishment_id) {
          const { data: establishmentData, error: establishmentError } = await supabase
            .from('establishments')
            .select('logo_url, name')
            .eq('id', formationData.establishment_id)
            .single();
          
          if (!establishmentError && establishmentData) {
            setEstablishmentInfo(establishmentData);
          }
        }
      }

      // Sync instructor_absent state
      const { data: sheetRefresh } = await supabase
        .from('attendance_sheets')
        .select('instructor_absent')
        .eq('id', attendanceSheet.id)
        .single();
      setIsInstructorAbsentLocal(sheetRefresh?.instructor_absent === true);

    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Écouter les mises à jour en temps réel
  useEffect(() => {
    if (!isOpen || !attendanceSheet.id) return;

    loadAttendanceData();

    const channel = supabase
      .channel(`enhanced_attendance_modal_${attendanceSheet.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_signatures',
          filter: `attendance_sheet_id=eq.${attendanceSheet.id}`
        },
        () => {
          console.log('Real-time update detected in modal');
          loadAttendanceData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_sheets',
          filter: `id=eq.${attendanceSheet.id}`
        },
        () => {
          console.log('Attendance sheet updated');
          loadAttendanceData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, attendanceSheet.id]);

  const handleTogglePresence = async (studentId: string, currentlyPresent: boolean) => {
    if (attendanceSheet.status === 'Validé') return;
    
    try {
      setTogglingStudentId(studentId);
      const newPresent = !currentlyPresent;
      const result = await attendanceService.toggleStudentPresence(attendanceSheet.id, studentId, newPresent);
      
      if (newPresent && !result.hasSavedSignature) {
        // L'étudiant n'a pas de signature enregistrée — envoyer un lien de signature
        toast.success('Étudiant marqué présent. Un lien de signature lui est envoyé...');
        try {
          await attendanceService.sendSignatureLink(attendanceSheet.id, [studentId]);
          toast.success('Lien de signature envoyé à l\'étudiant');
        } catch (linkError) {
          console.error('Error sending signature link:', linkError);
          toast.warning('Étudiant marqué présent mais le lien de signature n\'a pas pu être envoyé');
        }
      } else {
        toast.success(newPresent ? 'Étudiant marqué présent' : 'Étudiant marqué absent');
      }
      
      await loadAttendanceData();
      onUpdate();
    } catch (error) {
      console.error('Error toggling presence:', error);
      toast.error('Erreur lors du changement de statut');
    } finally {
      setTogglingStudentId(null);
    }
  };

  const handleStudentStatusChange = (studentId: string, present: boolean, absenceReason?: string) => {
    console.log('Update student status:', { studentId, present, absenceReason });
  };

  const handleExportPDF = async () => {
    try {
      await pdfExportService.exportAttendanceSheetSimple(attendanceSheet);
      toast.success("Feuille d'émargement exportée en PDF");
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error("Erreur lors de l'export PDF");
    }
  };

  const handleValidateSheet = async () => {
    try {
      await onValidateSheet(attendanceSheet);
    } catch (error) {
      console.error('Error validating attendance sheet from modal:', error);
      // Le parent gère déjà les toasts, on évite le doublon ici
    }
  };

  const getStatusInfo = (student: Student) => {
    if (!student.signature) {
      return {
        status: 'Absent',
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        bgColor: 'bg-red-50',
        textColor: 'text-red-700'
      };
    }
    
    if (student.signature.present) {
      return {
        status: 'Présent',
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        bgColor: 'bg-green-50',
        textColor: 'text-green-700'
      };
    }

    return {
      status: 'Absent',
      icon: <XCircle className="w-4 h-4 text-red-500" />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    };
  };


  if (loading || !attendanceSheet) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement de la feuille d'émargement...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formationColor = (attendanceSheet.formations as any)?.color || '#8B5CF6';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto force-light-theme">
        <DialogHeader>
          <DialogTitle>Feuille d'émargement</DialogTitle>
        </DialogHeader>

        <div className="bg-white">
          {/* En-tête */}
          <div 
            className="p-8 text-white relative"
            style={{ backgroundColor: formationColor }}
          >
            {/* Logo établissement en haut à gauche */}
            {establishmentInfo && (
              <div className="absolute top-4 left-4 flex items-center gap-3">
                {establishmentInfo.logo_url ? (
                  <div className="bg-white rounded-lg p-1.5 shadow-md">
                    <img 
                      src={establishmentInfo.logo_url} 
                      alt={establishmentInfo.name}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                ) : (
                  <div className="bg-white/20 rounded-lg p-2">
                    <Building className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-white/90">{establishmentInfo.name}</p>
                </div>
              </div>
            )}
            
            <div className={`text-center ${establishmentInfo ? 'pt-12' : ''}`}>
              <h1 className="text-4xl font-bold mb-6">FEUILLE D'ÉMARGEMENT</h1>
              <div className="space-y-2 text-base">
                <div className="font-semibold text-xl">{attendanceSheet.formations?.title}</div>
                {(attendanceSheet as any).schedule_slots?.formation_modules?.title && (
                  <div className="font-medium text-white/90">📚 Module : {(attendanceSheet as any).schedule_slots.formation_modules.title}</div>
                )}
                <div className="font-medium">{attendanceSheet.title}</div>
                <div className="flex items-center justify-center gap-8 text-sm mt-4 flex-wrap">
                  <div>📅 {format(new Date(attendanceSheet.date), 'dd/MM/yyyy', { locale: fr })}</div>
                  <div>🕒 {attendanceSheet.start_time.substring(0, 5)} - {attendanceSheet.end_time.substring(0, 5)}</div>
                  <div>🏫 {attendanceSheet.room || 'Salle non spécifiée'}</div>
                  <div>👨‍🏫 {instructorName || ((attendanceSheet as any).instructor ? `${(attendanceSheet as any).instructor.first_name} ${(attendanceSheet as any).instructor.last_name}` : 'Non assigné')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des participants */}
          <div className="p-6">
            <h4 className="font-semibold mb-4">Liste des participants ({students.length})</h4>
            
            {/* Statistiques en temps réel */}
            <div className="mb-4 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-700">Présents: {students.filter(s => s.signature?.present).length}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-700">Absents: {students.filter(s => !s.signature || !s.signature.present).length}</span>
              </div>
            </div>
            
            {/* En-tête du tableau */}
            <div 
              className={`grid gap-4 p-3 text-white font-medium text-sm rounded-t-lg ${attendanceSheet.status !== 'Validé' ? 'grid-cols-6' : 'grid-cols-5'}`}
              style={{ backgroundColor: formationColor }}
            >
              <div className="col-span-2">Nom et Prénom</div>
              <div className="text-center">Statut</div>
              <div className="text-center">Retard</div>
              <div className="text-center">Signature</div>
              {attendanceSheet.status !== 'Validé' && (
                <div className="text-center">Actions</div>
              )}
            </div>

            {/* Lignes des étudiants */}
            <div className="border border-gray-200 rounded-b-lg">
              {students.map((student, index) => {
                const statusInfo = getStatusInfo(student);
                const currentDelay = student.signature?.delay_minutes || 0;
                return (
                  <div 
                    key={student.id}
                    className={`grid gap-4 p-3 border-b border-gray-200 last:border-b-0 ${attendanceSheet.status !== 'Validé' ? 'grid-cols-6' : 'grid-cols-5'} ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className="col-span-2 flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: formationColor }}
                      >
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium">{student.lastName} {student.firstName}</div>
                        <div className="text-sm text-gray-500">{student.formation}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bgColor}`}>
                        {statusInfo.icon}
                        <span className={`text-xs font-medium ${statusInfo.textColor}`}>
                          {statusInfo.status}
                        </span>
                      </div>
                    </div>
                    {/* Colonne Retard */}
                    <div className="flex items-center justify-center">
                      {student.signature?.present ? (
                        attendanceSheet.status !== 'Validé' ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="999"
                              value={currentDelay}
                              onChange={async (e) => {
                                const minutes = Math.max(0, parseInt(e.target.value) || 0);
                                if (!student.signature?.id) return;
                                try {
                                  await supabase
                                    .from('attendance_signatures')
                                    .update({ delay_minutes: minutes })
                                    .eq('id', student.signature.id);
                                  // Update local state
                                  setStudents(prev => prev.map(s => 
                                    s.id === student.id && s.signature
                                      ? { ...s, signature: { ...s.signature, delay_minutes: minutes } }
                                      : s
                                  ));
                                } catch (err) {
                                  console.error('Error updating delay:', err);
                                }
                              }}
                              className="w-16 h-8 text-center text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            />
                            <span className="text-xs text-gray-500">min</span>
                          </div>
                        ) : (
                          currentDelay > 0 ? (
                            <div className="flex items-center gap-1 text-amber-600">
                              <Timer className="h-3 w-3" />
                              <span className="text-xs font-medium">{currentDelay} min</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )
                        )
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                    <div className="flex items-center justify-center">
                      {student.signature && student.signature.present ? (
                        <div className="text-center">
                          {student.signature.signature_data ? (
                            <img 
                              src={student.signature.signature_data} 
                              alt="Signature" 
                              className="h-8 w-auto mx-auto mb-1"
                            />
                          ) : (
                            <div className="h-8 flex items-center justify-center text-xs text-amber-600 italic">
                              Présent (signature à compléter)
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {format(new Date(student.signature.signed_at), 'HH:mm', { locale: fr })}
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 h-12 border-2 border-dashed border-gray-300 rounded bg-gray-50 flex items-center justify-center">
                          <span className="text-xs text-gray-400">Non signé</span>
                        </div>
                      )}
                    </div>
                    {attendanceSheet.status !== 'Validé' && (
                      <div className="flex items-center justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={togglingStudentId === student.id}
                          onClick={() => {
                            const isPresent = student.signature?.present === true;
                            handleTogglePresence(student.id, isPresent);
                          }}
                          className={`text-xs ${
                            student.signature?.present
                              ? 'border-red-300 text-red-600 hover:bg-red-50'
                              : 'border-green-300 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {togglingStudentId === student.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                          ) : student.signature?.present ? (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Absent
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Présent
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signatures des responsables */}
          <div className="p-6 border-t">
            {(() => {
              // AUDIT: Différenciation claire entre "formateur absent" et "session autonomie"
              // - instructor_absent = true → Session avec formateur absent (afficher 2 colonnes avec ABSENT en rouge)
              // - session_type = 'autonomie' → Session en autonomie réelle (pas de formateur prévu)
              const isInstructorAbsent = isInstructorAbsentLocal;
              const isAutonomySession = attendanceSheet.session_type === 'autonomie';
              
              // Le nom du formateur doit toujours être affiché (même si absent)
              const resolvedInstructorName =
                instructorName
                  ? instructorName
                  : (attendanceSheet as any).instructor
                    ? `${(attendanceSheet as any).instructor.first_name} ${(attendanceSheet as any).instructor.last_name}`
                    : 'Formateur non assigné';

              // Pour les sessions autonomie RÉELLES (sans formateur absent), on affiche une seule colonne centrée
              if (isAutonomySession && !isInstructorAbsent) {
                return (
                  <div className="flex justify-center">
                    <div className="w-full max-w-md">
                      <h4 className="font-semibold mb-3 text-center">Signature de l'Administration</h4>
                      <div className="border border-border rounded-lg h-24 bg-muted flex items-center justify-center p-2">
                        {attendanceSheet.validated_by && adminSignature ? (
                          <img 
                            src={adminSignature} 
                            alt="Signature administration" 
                            className="h-16 w-auto"
                          />
                        ) : (
                          <div className="text-xs text-muted-foreground text-center">
                            {attendanceSheet.status === 'Validé' ? 'Signature non disponible' : 'En attente de validation'}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-center text-sm text-muted-foreground border-t border-border pt-2">
                        Administration
                      </div>
                    </div>
                  </div>
                );
              }

              // Pour les sessions formateur absent OU présentielles normales → 2 colonnes
              return (
                <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
                  {/* Signature formateur - toujours affichée avec nom du formateur */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Signature du Formateur</h4>
                      {attendanceSheet.status !== 'Validé' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={togglingInstructorAbsent}
                          onClick={async () => {
                            try {
                              setTogglingInstructorAbsent(true);
                              const newAbsentState = !isInstructorAbsent;
                              const { error } = await supabase
                                .from('attendance_sheets')
                                .update({ instructor_absent: newAbsentState })
                                .eq('id', attendanceSheet.id);
                              if (error) throw error;
                              setIsInstructorAbsentLocal(newAbsentState);
                              toast.success(newAbsentState ? 'Formateur marqué absent' : 'Absence du formateur annulée');
                              onUpdate();
                            } catch (error) {
                              toast.error('Erreur lors du changement de statut');
                            } finally {
                              setTogglingInstructorAbsent(false);
                            }
                          }}
                          className={`text-xs ${
                            isInstructorAbsent
                              ? 'border-green-300 text-green-600 hover:bg-green-50'
                              : 'border-red-300 text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {togglingInstructorAbsent ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                          ) : isInstructorAbsent ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Marquer présent
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Marquer absent
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    {isInstructorAbsent ? (
                      <>
                        <div className="border border-border rounded-lg h-24 bg-muted flex items-center justify-center p-2">
                          <span
                            className="text-2xl font-bold text-red-600 italic"
                            style={{ fontFamily: 'cursive, "Brush Script MT", Georgia, serif' }}
                          >
                            ABSENT
                          </span>
                        </div>
                        <div className="mt-2 text-center text-sm text-muted-foreground border-t border-border pt-2">
                          {resolvedInstructorName}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="border border-border rounded-lg h-24 bg-muted flex items-center justify-center p-2">
                          {instructorSignature ? (
                            <img
                              src={instructorSignature}
                              alt="Signature formateur"
                              className="h-16 w-auto"
                            />
                          ) : (
                            <div className="text-xs text-muted-foreground text-center">En attente de signature</div>
                          )}
                        </div>
                        <div className="mt-2 text-center text-sm text-muted-foreground border-t border-border pt-2">
                          {resolvedInstructorName}
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Signature de l'Administration</h4>
                    <div className="border border-border rounded-lg h-24 bg-muted flex items-center justify-center p-2">
                      {attendanceSheet.validated_by && adminSignature ? (
                        <img 
                          src={adminSignature} 
                          alt="Signature administration" 
                          className="h-16 w-auto"
                        />
                      ) : (
                        <div className="text-xs text-muted-foreground text-center">
                          {attendanceSheet.status === 'Validé' ? 'Signature non disponible' : 'En attente de validation'}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-center text-sm text-muted-foreground border-t border-border pt-2">
                      Administration
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 text-center text-xs text-gray-500">
            Document généré le {format(new Date(), 'PPP à HH:mm', { locale: fr })} - NECTFORMA
          </div>
        </div>

        {/* Actions footer */}
        <div className="flex justify-between items-center p-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
          
          <div className="flex gap-2">
            {attendanceSheet.status !== 'Validé' && (
              <Button onClick={handleValidateSheet} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Valider
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </DialogContent>

      {/* Modal de validation administrative */}
      {showValidationModal && (
        <AdminValidationModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          attendanceSheet={attendanceSheet}
          onValidate={async (signatureData?: string) => {
            try {
              // On délègue la validation au parent via onValidateSheet qui réutilise
              // la même logique que le bouton "Valider" de la liste
              await onValidateSheet(attendanceSheet);
            } catch (error) {
              console.error('Error validating from AdminValidationModal in modal:', error);
            }
          }}
        />
      )}
    </Dialog>
  );
};

export default EnhancedAttendanceSheetModal;
