import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Printer, CheckCircle, XCircle, Clock, PenTool, Building } from 'lucide-react';
import InstructorSigningModal from './InstructorSigningModal';
import RealtimeAttendanceIndicator from './RealtimeAttendanceIndicator';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceSheet, AttendanceSignature } from '@/services/attendanceService';

interface GeneratedAttendanceSheetProps {
  attendanceSheetId: string;
  onClose: () => void;
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
    created_at: string;
    updated_at: string;
    users?: {
      first_name: string;
      last_name: string;
      email: string;
    } | null;
  };
}

const GeneratedAttendanceSheet: React.FC<GeneratedAttendanceSheetProps> = ({
  attendanceSheetId,
  onClose
}) => {
  const [attendanceSheet, setAttendanceSheet] = useState<AttendanceSheet | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInstructorSignModal, setShowInstructorSignModal] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [adminSignature, setAdminSignature] = useState<string | null>(null);
  const [establishmentInfo, setEstablishmentInfo] = useState<{ logo_url: string | null; name: string } | null>(null);
  // Charger les données de la feuille d'émargement
  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Récupérer la feuille d'émargement avec les signatures
      const { data: sheetData, error: sheetError } = await supabase
        .from('attendance_sheets')
        .select(`
          *,
          formations!formation_id(title, level, color),
          users:instructor_id(first_name, last_name)
        `)
        .eq('id', attendanceSheetId)
        .single();

      if (sheetError) throw sheetError;

      // Récupérer les signatures séparément
      const { data: signatures, error: signaturesError } = await supabase
        .from('attendance_signatures')
        .select(`
          *,
          users(first_name, last_name, email)
        `)
        .eq('attendance_sheet_id', attendanceSheetId);

      if (signaturesError) throw signaturesError;

      setAttendanceSheet({ ...sheetData, signatures } as any);

      // Charger la signature administrative depuis user_signatures
      let adminSig: string | null = null;
      if (sheetData.validated_by) {
        const { data: adminSigData, error: adminSigError } = await supabase
          .from('user_signatures')
          .select('signature_data')
          .eq('user_id', sheetData.validated_by)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (adminSigError) {
          console.error('Erreur récupération signature admin:', adminSigError);
        } else if (adminSigData && adminSigData.signature_data) {
          adminSig = adminSigData.signature_data;
        }
      }

      setAdminSignature(adminSig);

      // Load establishment info for logo
      if (sheetData.formation_id) {
        const { data: formationData, error: formationError } = await supabase
          .from('formations')
          .select('establishment_id')
          .eq('id', sheetData.formation_id)
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

      // Récupérer les étudiants inscrits à la formation
      const { data: studentData, error: studentsError } = await supabase
        .from('user_formation_assignments')
        .select(`
          user_id,
          users!user_id(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('formation_id', sheetData.formation_id);

      if (studentsError) throw studentsError;

      // Mapper les étudiants avec leurs signatures
      const mappedStudents: Student[] = (studentData || []).map(assignment => ({
        id: assignment.users.id,
        firstName: assignment.users.first_name,
        lastName: assignment.users.last_name,
        formation: sheetData.formations?.title || '',
        signature: signatures?.find(
          (sig: any) => sig.user_id === assignment.users.id
        )
      }));

      setStudents(mappedStudents);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Écouter les changements en temps réel
  useEffect(() => {
    loadAttendanceData();

    // S'abonner aux changements de signatures
    const channel = supabase
      .channel('attendance_signatures_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_signatures',
          filter: `attendance_sheet_id=eq.${attendanceSheetId}`
        },
        (payload) => {
          console.log('Signature change detected:', payload);
          setLastUpdate(new Date());
          loadAttendanceData(); // Recharger les données
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [attendanceSheetId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    console.log('Téléchargement de la feuille d\'émargement...');
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
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la feuille d'émargement...</p>
        </div>
      </div>
    );
  }

  const formationColor = (attendanceSheet.formations as any)?.color || '#8B5CF6';

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Actions bar - Non imprimable */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
          <div>
            <h2 className="text-lg font-semibold">Feuille d'émargement générée</h2>
            <RealtimeAttendanceIndicator 
              isConnected={isRealtimeConnected} 
              lastUpdate={lastUpdate}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>

      {/* Feuille d'émargement - Imprimable */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none">
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
              <div className="font-medium">{attendanceSheet.title}</div>
              <div className="flex items-center justify-center gap-8 text-sm mt-4">
                <div>📅 {format(new Date(attendanceSheet.date), 'dd/MM/yyyy', { locale: fr })}</div>
                <div>🕒 {attendanceSheet.start_time.substring(0, 5)} - {attendanceSheet.end_time.substring(0, 5)}</div>
                <div>🏫 {attendanceSheet.room || 'Salle non spécifiée'}</div>
                <div>👨‍🏫 {attendanceSheet.instructor ? `${attendanceSheet.instructor.first_name} ${attendanceSheet.instructor.last_name}` : 'Non assigné'}</div>
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
            className="grid grid-cols-4 gap-4 p-3 text-white font-medium text-sm rounded-t-lg"
            style={{ backgroundColor: formationColor }}
          >
            <div className="col-span-2">Nom et Prénom</div>
            <div className="text-center">Statut</div>
            <div className="text-center">Signature</div>
          </div>

          {/* Lignes des étudiants */}
          <div className="border border-gray-200 rounded-b-lg">
            {students.map((student, index) => {
              const statusInfo = getStatusInfo(student);
              return (
                <div 
                  key={student.id}
                  className={`grid grid-cols-4 gap-4 p-3 border-b border-gray-200 last:border-b-0 ${
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
                  <div className="flex items-center justify-center">
                    {student.signature ? (
                      <div className="text-center">
                        {student.signature.signature_data ? (
                          <img 
                            src={student.signature.signature_data} 
                            alt="Signature" 
                            className="h-8 w-auto mx-auto mb-1"
                          />
                        ) : (
                          <div className="h-8 flex items-center justify-center text-xs text-gray-500">
                            Signé électroniquement
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Signatures des responsables */}
        <div className="p-6 border-t">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-3">Signature du Formateur</h4>
              {(() => {
                const instructorSignature = (attendanceSheet as any).signatures?.find(
                  (sig: any) => sig.user_type === 'instructor'
                );

                const canInstructorSign = !instructorSignature;

                return (
                  <>
                    <div
                      className={`border border-gray-300 rounded-lg h-24 bg-gray-50 flex items-center justify-center p-2 relative ${
                        canInstructorSign
                          ? 'cursor-pointer hover:bg-gray-100 transition-colors print:cursor-default print:hover:bg-gray-50'
                          : ''
                      }`}
                      onClick={() => {
                        if (canInstructorSign) {
                          setShowInstructorSignModal(true);
                        }
                      }}
                    >
                      {instructorSignature?.signature_data ? (
                        <img
                          src={instructorSignature.signature_data}
                          alt="Signature formateur"
                          className="h-16 w-auto"
                        />
                      ) : (
                        <div className="text-xs text-gray-500 text-center flex flex-col items-center gap-2">
                          <PenTool className="w-5 h-5 print:hidden" />
                          <span>Cliquez pour signer</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-center text-sm text-gray-600 border-t pt-2">
                      {attendanceSheet.instructor
                        ? `${attendanceSheet.instructor.first_name} ${attendanceSheet.instructor.last_name}`
                        : 'Formateur non assigné'}
                    </div>
                  </>
                );
              })()}
            </div>
            <div>
              <h4 className="font-semibold mb-3">Signature de l'Administration</h4>
              <div className="border border-gray-300 rounded-lg h-24 bg-gray-50 flex items-center justify-center p-2">
                {adminSignature ? (
                  <img
                    src={adminSignature}
                    alt="Signature administration"
                    className="h-16 w-auto"
                  />
                ) : (
                  <div className="text-xs text-gray-500 text-center">
                    {attendanceSheet.status === 'Validé' ? 'Validé sans signature' : 'En attente de validation'}
                  </div>
                )}
              </div>
              <div className="mt-2 text-center text-sm text-gray-600 border-t pt-2">
                Administration
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-center text-xs text-gray-500">
          Document généré le {format(new Date(), 'PPP à HH:mm', { locale: fr })} - NECTFY
        </div>
      </div>

      {/* Modal de signature instructeur */}
      <InstructorSigningModal
        isOpen={showInstructorSignModal}
        onClose={() => setShowInstructorSignModal(false)}
        attendanceSheet={attendanceSheet}
        instructorId={attendanceSheet?.instructor_id || ''}
        onSigned={() => {
          loadAttendanceData();
          setShowInstructorSignModal(false);
        }}
      />
    </div>
  );
};

export default GeneratedAttendanceSheet;