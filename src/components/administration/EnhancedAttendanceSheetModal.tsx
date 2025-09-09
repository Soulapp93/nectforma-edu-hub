import React, { useState, useEffect } from 'react';
import { X, Edit, Download, CheckCircle2, RotateCcw, Archive } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AttendanceSheet, attendanceService } from '@/services/attendanceService';
import { pdfExportService } from '@/services/pdfExportService';
import SignaturePad from '@/components/ui/signature-pad';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EnhancedAttendanceSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceSheet: AttendanceSheet;
  onUpdate: () => void;
}

interface StudentStatus {
  id: string;
  name: string;
  status: 'Présent' | 'Retard' | 'Absent';
  motif?: string;
  signature?: string;
}

const ABSENCE_MOTIFS = [
  'Congé',
  'Maladie', 
  'Mission professionnelle',
  'Familiale',
  'Autre'
];

// Données d'exemple pour les étudiants
const DEMO_STUDENTS: StudentStatus[] = [
  { id: '1', name: 'Alice', status: 'Présent' },
  { id: '2', name: 'Bob', status: 'Présent' },
  { id: '3', name: 'Carol', status: 'Présent' },
  { id: '4', name: 'Dan', status: 'Retard', motif: 'Transport' },
  { id: '5', name: 'Eva', status: 'Absent', motif: 'Maladie' },
  { id: '6', name: 'Frank', status: 'Absent', motif: 'Autre' }
];

const EnhancedAttendanceSheetModal: React.FC<EnhancedAttendanceSheetModalProps> = ({
  isOpen,
  onClose,
  attendanceSheet,
  onUpdate
}) => {
  const [mode, setMode] = useState<'view' | 'edit' | 'signature'>('view');
  const [students, setStudents] = useState<StudentStatus[]>(DEMO_STUDENTS);
  const [adminSignature, setAdminSignature] = useState<string>('');
  const [instructorSignature, setInstructorSignature] = useState<string>('');

  useEffect(() => {
    setStudents(DEMO_STUDENTS);
    // Charger les signatures existantes si disponibles
    const instrSig = attendanceSheet.signatures?.find(sig => sig.user_type === 'instructor')?.signature_data;
    if (instrSig) setInstructorSignature(instrSig);
  }, [attendanceSheet]);

  const handleStudentStatusChange = (studentId: string, status: 'Présent' | 'Retard' | 'Absent') => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, status, motif: status === 'Absent' ? 'Maladie' : undefined }
        : student
    ));
  };

  const handleMotifChange = (studentId: string, motif: string) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId ? { ...student, motif } : student
    ));
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Présent':
        return 'bg-green-100 text-green-800';
      case 'Retard':
        return 'bg-yellow-100 text-yellow-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'Présent':
        return 'bg-green-500';
      case 'Retard':
        return 'bg-yellow-500';
      case 'Absent':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
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
          {/* Header */}
          <div 
            className="text-white p-6 text-center"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #9333EA)',
            }}
          >
            <h1 className="text-2xl font-bold mb-4">FEUILLE D'ÉMARGEMENT</h1>
            <h2 className="text-lg font-semibold mb-2">{attendanceSheet.formations?.title}</h2>
            
            <div className="flex justify-center items-center space-x-8 mt-4 text-sm">
              <div className="flex items-center">
                <span className="mr-2">📅</span>
                <span>{format(new Date(attendanceSheet.date), 'dd/MM/yyyy', { locale: fr })}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🕐</span>
                <span>{attendanceSheet.start_time} - {attendanceSheet.end_time}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🏫</span>
                <span>{attendanceSheet.room || 'A101'}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">👨‍🏫</span>
                <span>Formateur</span>
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
              {adminSignature && (
                <Button variant="outline">
                  <Archive className="h-4 w-4 mr-2" />
                  📁 Archiver
                </Button>
              )}
            </div>
          </div>

          {/* Participants List */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Liste des participants
              </h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">
                    {students.filter(s => s.status === 'Présent').length} Présents
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-red-700">
                    {students.filter(s => s.status === 'Absent').length} Absents
                  </span>
                </div>
                {students.filter(s => s.status === 'Retard').length > 0 && (
                  <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-yellow-700">
                      {students.filter(s => s.status === 'Retard').length} En retard
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full">
                <thead className="bg-purple-600 text-white">
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
                <tbody className="divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${getStatusDot(student.status)}`}></div>
                          <div>
                            <div className="font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">Licence Informatique L1</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {mode === 'edit' ? (
                          <Select 
                            value={student.status} 
                            onValueChange={(value: 'Présent' | 'Retard' | 'Absent') => 
                              handleStudentStatusChange(student.id, value)
                            }
                          >
                            <SelectTrigger className="w-32 mx-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Présent">Présent</SelectItem>
                              <SelectItem value="Retard">Retard</SelectItem>
                              <SelectItem value="Absent">Absent</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(student.status)}`}>
                            {student.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {student.status === 'Absent' && mode === 'edit' ? (
                          <Select 
                            value={student.motif || ''} 
                            onValueChange={(value) => handleMotifChange(student.id, value)}
                          >
                            <SelectTrigger className="w-40 mx-auto">
                              <SelectValue placeholder="Choisir motif" />
                            </SelectTrigger>
                            <SelectContent>
                              {ABSENCE_MOTIFS.map(motif => (
                                <SelectItem key={motif} value={motif}>{motif}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-gray-600">
                            {student.motif || (student.status === 'Présent' ? '-' : '')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {student.status === 'Présent' ? (
                          student.signature ? (
                            <img
                              src={student.signature}
                              alt="Signature"
                              className="h-8 max-w-20 object-contain mx-auto border rounded"
                            />
                          ) : (
                            <div className="text-xs text-gray-400">Non signé</div>
                          )
                        ) : student.status === 'Absent' ? (
                          <div className="text-xs text-gray-400">Absent</div>
                        ) : (
                          <div className="text-xs text-gray-400">Non signé</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures Section */}
          <div className="p-6 border-t bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <h4 className="font-semibold mb-2 text-gray-900">Signature du Formateur</h4>
                <div className="h-20 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white">
                  {instructorSignature ? (
                    <img
                      src={instructorSignature}
                      alt="Signature formateur"
                      className="h-16 max-w-32 object-contain"
                    />
                  ) : (
                    <div className="text-gray-500 text-xs">En attente</div>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <h4 className="font-semibold mb-2 text-gray-900">Signature de l'Administration</h4>
                <div className="h-20 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white">
                  {adminSignature ? (
                    <>
                      <img
                        src={adminSignature}
                        alt="Signature administration"
                        className="h-16 max-w-32 object-contain"
                      />
                      <div className="ml-2 text-xs text-green-600">✅ Archivée</div>
                    </>
                  ) : (
                    <div className="text-gray-500 text-xs">En attente</div>
                  )}
                </div>
              </div>
            </div>
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