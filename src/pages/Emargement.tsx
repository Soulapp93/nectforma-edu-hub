import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle2, AlertCircle, FileText, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { attendanceService, AttendanceSheet } from '@/services/attendanceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AttendanceSigningModal from '../components/emargement/AttendanceSigningModal';
import InstructorSigningModal from '../components/emargement/InstructorSigningModal';
import EnhancedAttendanceSheetModal from '../components/administration/EnhancedAttendanceSheetModal';
import AttendanceHistory from '../components/emargement/AttendanceHistory';
import SignatureManagementModal from '../components/ui/signature-management-modal';
import QRAttendanceCard from '../components/emargement/QRAttendanceCard';

const Emargement = () => {
  const [attendanceSheets, setAttendanceSheets] = useState<AttendanceSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<AttendanceSheet | null>(null);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [isInstructorSigningModalOpen, setIsInstructorSigningModalOpen] = useState(false);
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [userSignature, setUserSignature] = useState<string | null>(null);
  const { userId, userRole } = useCurrentUser();

  // Données fictives pour la demo - Multiple cours
  const mockAttendanceSheets: AttendanceSheet[] = [
    {
      id: 'demo-1',
      schedule_slot_id: 'slot-1',
      formation_id: 'formation-1',
      title: 'Cours HTML5 & CSS3',
      date: new Date().toISOString().split('T')[0],
      start_time: '08:00',
      end_time: '10:00',
      room: 'Salle 101',
      instructor_id: 'instructor-1',
      status: 'En cours',
      is_open_for_signing: true,
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      opened_at: new Date().toISOString(),
      closed_at: null,
      validated_at: null,
      validated_by: null,
      formations: {
        title: 'HTML5 & CSS3',
        level: 'Développement Web Full-Stack'
      },
      instructor: {
        first_name: 'Pierre',
        last_name: 'Dubois'
      },
      signatures: []
    },
    {
      id: 'demo-2',
      schedule_slot_id: 'slot-2',
      formation_id: 'formation-2',
      title: 'Cours JavaScript Avancé',
      date: new Date().toISOString().split('T')[0],
      start_time: '10:15',
      end_time: '12:15',
      room: 'Salle 102',
      instructor_id: 'instructor-2',
      status: 'En cours',
      is_open_for_signing: true,
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      opened_at: new Date().toISOString(),
      closed_at: null,
      validated_at: null,
      validated_by: null,
      formations: {
        title: 'JavaScript Avancé',
        level: 'Développement Web Full-Stack'
      },
      instructor: {
        first_name: 'Marie',
        last_name: 'Martin'
      },
      signatures: []
    },
    {
      id: 'demo-3',
      schedule_slot_id: 'slot-3',
      formation_id: 'formation-3',
      title: 'Cours React.js',
      date: new Date().toISOString().split('T')[0],
      start_time: '13:30',
      end_time: '16:30',
      room: 'Salle 103',
      instructor_id: 'instructor-3',
      status: 'En cours',
      is_open_for_signing: true,
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      opened_at: new Date().toISOString(),
      closed_at: null,
      validated_at: null,
      validated_by: null,
      formations: {
        title: 'React.js',
        level: 'Développement Web Full-Stack'
      },
      instructor: {
        first_name: 'Thomas',
        last_name: 'Leroy'
      },
      signatures: []
    },
    {
      id: 'demo-4',
      schedule_slot_id: 'slot-4',
      formation_id: 'formation-4',
      title: 'Cours Node.js & Express',
      date: new Date().toISOString().split('T')[0],
      start_time: '14:00',
      end_time: '17:00',
      room: 'Salle 105',
      instructor_id: 'instructor-4',
      status: 'En cours',
      is_open_for_signing: true,
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      opened_at: new Date().toISOString(),
      closed_at: null,
      validated_at: null,
      validated_by: null,
      formations: {
        title: 'Node.js & Express',
        level: 'Développement Backend'
      },
      instructor: {
        first_name: 'Antoine',
        last_name: 'Moreau'
      },
      signatures: []
    },
    {
      id: 'demo-5',
      schedule_slot_id: 'slot-5',
      formation_id: 'formation-5',
      title: 'Cours MongoDB & NoSQL',
      date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '11:00',
      room: 'Salle 106',
      instructor_id: 'instructor-5',
      status: 'En attente',
      is_open_for_signing: false,
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      opened_at: null,
      closed_at: null,
      validated_at: null,
      validated_by: null,
      formations: {
        title: 'MongoDB & NoSQL',
        level: 'Bases de Données'
      },
      instructor: {
        first_name: 'Camille',
        last_name: 'Rousseau'
      },
      signatures: []
    },
    {
      id: 'demo-6',
      schedule_slot_id: 'slot-6',
      formation_id: 'formation-6',
      title: 'Cours UX/UI Design',
      date: new Date().toISOString().split('T')[0],
      start_time: '15:30',
      end_time: '18:30',
      room: 'Salle 107',
      instructor_id: 'instructor-6',
      status: 'Terminé',
      is_open_for_signing: false,
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      opened_at: new Date().toISOString(),
      closed_at: new Date().toISOString(),
      validated_at: null,
      validated_by: null,
      formations: {
        title: 'UX/UI Design',
        level: 'Design Graphique'
      },
      instructor: {
        first_name: 'Julie',
        last_name: 'Petit'
      },
      signatures: [
        {
          id: 'sig-1',
          attendance_sheet_id: 'demo-6',
          user_id: userId || 'user-demo',
          user_type: 'student',
          signature_data: 'data:image/png;base64,mock-signature',
          present: true,
          signed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    },
    {
      id: 'demo-7',
      schedule_slot_id: 'slot-7',
      formation_id: 'formation-7',
      title: 'Cours Python & Django',
      date: new Date().toISOString().split('T')[0],
      start_time: '11:15',
      end_time: '12:45',
      room: 'Salle 108',
      instructor_id: 'instructor-7',
      status: 'En cours',
      is_open_for_signing: true,
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      opened_at: new Date().toISOString(),
      closed_at: null,
      validated_at: null,
      validated_by: null,
      formations: {
        title: 'Python & Django',
        level: 'Développement Backend'
      },
      instructor: {
        first_name: 'Lucas',
        last_name: 'Garcia'
      },
      signatures: []
    }
  ];

  const fetchTodaysAttendance = async () => {
    try {
      setLoading(true);
      
      if (userId && userRole) {
        // Essayer de charger les vraies données depuis l'API
        try {
          const realData = await attendanceService.getTodaysAttendanceForUser(userId, userRole);
          console.log('Real attendance data loaded:', realData.length, 'sheets');
          
          if (realData.length > 0) {
            setAttendanceSheets(realData);
            return;
          }
        } catch (error) {
          console.log('Falling back to mock data due to:', error);
        }
      }
      
      // Fallback sur les données de démo
      console.log('Using mock data...', mockAttendanceSheets.length, 'sheets');
      setAttendanceSheets(mockAttendanceSheets);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Erreur lors du chargement des émargements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Charger les données dès le montage du composant
    fetchTodaysAttendance();
    loadUserSignature();
  }, []);

  const loadUserSignature = () => {
    // Charger la signature utilisateur depuis le localStorage
    const signature = localStorage.getItem(`user_signature_${userId}`);
    setUserSignature(signature);
  };

  const handleSaveUserSignature = async (signatureData: string) => {
    if (signatureData) {
      localStorage.setItem(`user_signature_${userId}`, signatureData);
      setUserSignature(signatureData);
    } else {
      localStorage.removeItem(`user_signature_${userId}`);
      setUserSignature(null);
    }
  };

  const handleSignAttendance = (sheet: AttendanceSheet) => {
    console.log('handleSignAttendance called with sheet:', sheet);
    setSelectedSheet(sheet);
    
    // Différencier selon le rôle utilisateur
    if (userRole === 'Formateur') {
      setIsInstructorSigningModalOpen(true);
    } else {
      setIsSigningModalOpen(true);
    }
    console.log('Modal should be opening now');
  };

  const handleInstructorSignAttendance = (sheet: AttendanceSheet) => {
    console.log('handleInstructorSignAttendance called');
    setSelectedSheet(sheet);
    setIsInstructorSigningModalOpen(true);
  };

  const handleSignatureComplete = async () => {
    // Mettre à jour les données locales pour simuler l'ajout temps réel
    if (selectedSheet && userId) {
      const newSignature = {
        id: `sig-${Date.now()}`,
        attendance_sheet_id: selectedSheet.id,
        user_id: userId,
        user_type: 'student' as const,
        signature_data: 'data:image/png;base64,mock-signature',
        present: true,
        signed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mettre à jour la liste des feuilles d'émargement
      setAttendanceSheets(prev => prev.map(sheet => {
        if (sheet.id === selectedSheet.id) {
          return {
            ...sheet,
            signatures: [...(sheet.signatures || []), newSignature]
          };
        }
        return sheet;
      }));

      toast.success('Présence enregistrée avec succès ! ✅');
    }
    
    // Recharger les données (en production cela viendrait de la DB)
    await fetchTodaysAttendance();
  };

  const checkIfSigned = (sheet: AttendanceSheet) => {
    return sheet.signatures?.some(sig => 
      sig.user_id === userId && 
      (userRole === 'Formateur' ? sig.user_type === 'instructor' : sig.user_type === 'student')
    ) || false;
  };

  const isAttendanceOpen = (sheet: AttendanceSheet) => {
    return sheet.is_open_for_signing || false;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En attente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'En cours':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Terminé':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Fermé':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 sm:py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Gestion des Émargements</h1>
          <p className="text-sm sm:text-base text-purple-100">Suivez, signez et analysez les présences.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Badge Mon Pointage */}
        <div className="mb-6">
          <Badge className="bg-purple-600 text-white px-4 py-2 text-sm font-medium rounded-full">
            📋 Mon Pointage
          </Badge>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Mon Pointage</h2>
              <p className="text-sm sm:text-base text-gray-600">mercredi 23 juillet 2025</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={() => setShowSignatureModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white flex-1 sm:flex-none text-sm"
              >
                <PenTool className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Enregistrement signature</span>
                <span className="sm:hidden">Signature</span>
              </Button>
              <Button 
                variant="outline" 
                className="bg-purple-600 text-white hover:bg-purple-700 border-purple-600 text-sm"
              >
                📅 Aujourd'hui
              </Button>
              <Button 
                variant="outline"
                className="border-gray-300 text-sm"
                onClick={() => setShowHistory(true)}
              >
                🕒 <span className="hidden sm:inline">Historique</span>
              </Button>
              <Button 
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50 text-sm hidden sm:flex"
                onClick={() => window.location.href = '/emargement/ameliorations'}
              >
                💡 Améliorations
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : attendanceSheets.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {attendanceSheets.map((sheet) => {
                const isSigned = checkIfSigned(sheet);
                
                return (
                  <Card key={sheet.id} className="overflow-hidden hover:shadow-lg transition-all border border-gray-200">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">[DEMO] {sheet.formations?.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 flex items-center mt-1">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {sheet.formations?.level}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 flex items-center mt-1">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden sm:inline">Formateur: </span>
                            {sheet.instructor?.first_name} {sheet.instructor?.last_name}
                          </p>
                        </div>
                        <div className="text-left sm:text-right text-xs sm:text-sm text-gray-500">
                          <div className="flex items-center sm:justify-end mb-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {sheet.start_time} - {sheet.end_time}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        {!isSigned && isAttendanceOpen(sheet) ? (
                          <Button
                            onClick={() => handleSignAttendance(sheet)}
                            className="bg-green-600 hover:bg-green-700 text-white w-full text-sm sm:text-base"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">
                              {userRole === 'Formateur' ? 'Signer en tant que formateur' : 'Signer ma présence'}
                            </span>
                            <span className="sm:hidden">Signer</span>
                          </Button>
                        ) : isSigned ? (
                          <Button variant="outline" disabled className="bg-green-50 w-full text-sm sm:text-base">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                            <span className="hidden sm:inline">
                              {userRole === 'Formateur' ? 'Cours validé' : 'Présence confirmée'}
                            </span>
                            <span className="sm:hidden">Signé</span>
                          </Button>
                        ) : !isAttendanceOpen(sheet) ? (
                          <Button variant="outline" disabled className="w-full text-sm sm:text-base">
                            <Clock className="h-4 w-4 mr-2" />
                            Émargement fermé
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun cours aujourd'hui
                  </h3>
                  <p className="text-gray-600">
                    Il n'y a pas de cours programmé pour aujourd'hui.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de signature étudiant */}
      {selectedSheet && (
        <AttendanceSigningModal
          isOpen={isSigningModalOpen}
          onClose={() => {
            console.log('Closing signing modal');
            setIsSigningModalOpen(false);
            setSelectedSheet(null);
          }}
          attendanceSheet={selectedSheet}
          userId={userId || 'demo-user'}
          userRole={userRole || 'Étudiant'}
          onSigned={handleSignatureComplete}
        />
      )}

      {/* Modal de signature formateur */}
      {selectedSheet && (
        <InstructorSigningModal
          isOpen={isInstructorSigningModalOpen}
          onClose={() => {
            console.log('Closing instructor signing modal');
            setIsInstructorSigningModalOpen(false);
            setSelectedSheet(null);
          }}
          attendanceSheet={selectedSheet}
          instructorId={userId || 'demo-instructor'}
          onSigned={handleSignatureComplete}
        />
      )}

      {/* Modal feuille d'émargement */}
      {selectedSheet && showAttendanceSheet && (
        <EnhancedAttendanceSheetModal
          isOpen={showAttendanceSheet}
          onClose={() => {
            setShowAttendanceSheet(false);
            setSelectedSheet(null);
          }}
          attendanceSheet={selectedSheet}
          onUpdate={fetchTodaysAttendance}
        />
      )}

      {/* Modal historique */}
      <AttendanceHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

      <SignatureManagementModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        currentSignature={userSignature}
        onSave={handleSaveUserSignature}
        title={`Gestion de ma signature ${userRole === 'Formateur' ? 'formateur' : 'étudiant'}`}
      />
    </div>
  );
};

export default Emargement;