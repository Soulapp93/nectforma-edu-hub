import React, { useState, useEffect } from 'react';
import { X, Edit, Download, CheckCircle2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AttendanceSheet, attendanceService } from '@/services/attendanceService';
import { pdfExportService } from '@/services/pdfExportService';
import SignaturePad from '@/components/ui/signature-pad';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedAttendanceSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceSheet: AttendanceSheet;
  onUpdate: () => void;
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
  onUpdate
}) => {
  const [mode, setMode] = useState<'view' | 'edit' | 'signature'>('view');
  const [students, setStudents] = useState<Student[]>([]);
  const [adminSignature, setAdminSignature] = useState<string>('');
  const [instructorSignature, setInstructorSignature] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Charger les données de la feuille d'émargement
  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les signatures séparément
      const { data: signatures, error: signaturesError } = await supabase
        .from('attendance_signatures')
        .select(`
          *,
          users(first_name, last_name, email)
        `)
        .eq('attendance_sheet_id', attendanceSheet.id);

      if (signaturesError) throw signaturesError;

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
        .eq('formation_id', attendanceSheet.formation_id);

      if (studentsError) throw studentsError;

      // Mapper les étudiants avec leurs signatures
      const mappedStudents: Student[] = (studentData || []).map(assignment => ({
        id: assignment.users.id,
        firstName: assignment.users.first_name,
        lastName: assignment.users.last_name,
        formation: (attendanceSheet.formations as any)?.title || '',
        signature: signatures?.find(
          (sig: any) => sig.user_id === assignment.users.id
        )
      }));

      setStudents(mappedStudents);
      
      // Charger les signatures existantes si disponibles
      const instrSig = signatures?.find((sig: any) => sig.user_type === 'instructor')?.signature_data;
      const adminSig = signatures?.find((sig: any) => sig.user_type === 'admin')?.signature_data;
      if (instrSig) setInstructorSignature(instrSig);
      if (adminSig) setAdminSignature(adminSig);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && attendanceSheet.id) {
      loadAttendanceData();
    }
  }, [isOpen, attendanceSheet.id]);

  const handleStudentStatusChange = (studentId: string, present: boolean, absenceReason?: string) => {
    // Mettre à jour le statut dans la base de données
    // Cette fonctionnalité sera implémentée plus tard
    console.log('Update student status:', { studentId, present, absenceReason });
  };

  const handleExportPDF = async () => {
    try {
      await pdfExportService.exportAttendanceSheetSimple(attendanceSheet);
      toast.success('Feuille d\'émargement exportée en PDF');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  const handleValidateAndSign = () => {
    setMode('signature');
  };

  const handleSaveSignature = async (signature: string) => {
    try {
      setAdminSignature(signature);
      await attendanceService.validateAttendanceSheet(attendanceSheet.id, 'admin-user-id', signature);
      toast.success('Feuille d\'émargement validée et signée');
      setMode('view');
      onUpdate();
    } catch (error) {
      console.error('Error saving signature:', error);
      toast.error('Erreur lors de la validation');
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

  if (mode === 'signature') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Signature administrative</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <SignaturePad
              width={400}
              height={200}
              onSave={handleSaveSignature}
              onCancel={() => setMode('view')}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Feuille d'émargement</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-white">
          {/* En-tête */}
          <div 
            className="p-8 text-white text-center"
            style={{ backgroundColor: formationColor }}
          >
            <h1 className="text-4xl font-bold mb-6">FEUILLE D'ÉMARGEMENT</h1>
            <div className="space-y-2 text-base">
              <div className="font-semibold text-xl">{attendanceSheet.formations?.title}</div>
              <div className="font-medium">{attendanceSheet.title}</div>
              <div className="flex items-center justify-center gap-8 text-sm mt-4">
                <div>📅 {format(new Date(attendanceSheet.date), 'dd/MM/yyyy', { locale: fr })}</div>
                <div>🕒 {attendanceSheet.start_time} - {attendanceSheet.end_time}</div>
                <div>🏫 {attendanceSheet.room || 'Salle non spécifiée'}</div>
                <div>👨‍🏫 {(attendanceSheet as any).instructor ? `${(attendanceSheet as any).instructor.first_name} ${(attendanceSheet as any).instructor.last_name}` : 'Non assigné'}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                📄 Télécharger en PDF  
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={mode === 'edit' ? handleValidateAndSign : () => setMode('edit')}
              >
                {mode === 'edit' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    ✅ Valider & Signer
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    ✏️ Modifier
                  </>
                )}
              </Button>
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
                      {mode === 'edit' ? (
                        <Select 
                          value={statusInfo.status} 
                          onValueChange={(value: string) => {
                            const present = value === 'Présent';
                            const absenceReason = !present ? 'Autre' : undefined;
                            handleStudentStatusChange(student.id, present, absenceReason);
                          }}
                        >
                          <SelectTrigger className="w-32 mx-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Présent">Présent</SelectItem>
                            <SelectItem value="Absent">Absent</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bgColor}`}>
                          {statusInfo.icon}
                          <span className={`text-xs font-medium ${statusInfo.textColor}`}>
                            {statusInfo.status}
                          </span>
                        </div>
                      )}
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
                <div className="border border-gray-300 rounded-lg h-24 bg-gray-50 flex items-center justify-center p-2">
                  {instructorSignature ? (
                    <img 
                      src={instructorSignature} 
                      alt="Signature formateur" 
                      className="h-16 w-auto"
                    />
                  ) : (
                    <div className="text-xs text-gray-500 text-center">
                      En attente de signature
                    </div>
                  )}
                </div>
                <div className="mt-2 text-center text-sm text-gray-600 border-t pt-2">
                  {(attendanceSheet as any).instructor ? `${(attendanceSheet as any).instructor.first_name} ${(attendanceSheet as any).instructor.last_name}` : 'Formateur non assigné'}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Signature de l'Administration</h4>
                <div 
                  className="border border-gray-300 rounded-lg h-24 bg-gray-50 flex items-center justify-center p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => !adminSignature && setMode('signature')}
                >
                  {adminSignature ? (
                    <img 
                      src={adminSignature} 
                      alt="Signature administration" 
                      className="h-16 w-auto"
                    />
                  ) : (
                    <div className="text-xs text-gray-500 text-center">
                      Cliquez pour signer
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
            Document généré le {format(new Date(), 'PPP à HH:mm', { locale: fr })} - NECTFORIA
          </div>
        </div>

        {/* Close button at bottom */}
        <div className="flex justify-end p-4 border-t">
          <Button onClick={onClose}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedAttendanceSheetModal;