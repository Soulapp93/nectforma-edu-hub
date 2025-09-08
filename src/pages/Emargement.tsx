import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { attendanceService, AttendanceSheet } from '@/services/attendanceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AttendanceSigningModal from '../components/emargement/AttendanceSigningModal';
import EnhancedAttendanceSheetModal from '../components/administration/EnhancedAttendanceSheetModal';

const Emargement = () => {
  const [attendanceSheets, setAttendanceSheets] = useState<AttendanceSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<AttendanceSheet | null>(null);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);
  const { userId, userRole } = useCurrentUser();

  // Données fictives pour la demo - Multiple cours
  const mockAttendanceSheets: AttendanceSheet[] = [
    {
      id: 'demo-1',
      schedule_slot_id: 'slot-1',
      formation_id: 'formation-1',
      title: 'Cours HTML5 & CSS3',
      date: '2025-07-23',
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
      date: '2025-07-23',
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
      date: '2025-07-23',
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
      title: 'Cours Base de Données',
      date: '2025-07-23',
      start_time: '16:45',
      end_time: '18:45',
      room: 'Salle 104',
      instructor_id: 'instructor-4',
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
        title: 'Base de Données MySQL',
        level: 'Développement Web Full-Stack'
      },
      instructor: {
        first_name: 'Sophie',
        last_name: 'Bernard'
      },
      signatures: [
        {
          id: 'sig-1',
          attendance_sheet_id: 'demo-4',
          user_id: userId || 'user-demo',
          user_type: 'student',
          signature_data: 'data:image/png;base64,mock-signature',
          present: true,
          signed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    }
  ];

  const fetchTodaysAttendance = async () => {
    if (!userId || !userRole) return;
    
    try {
      setLoading(true);
      // Pour la demo, on utilise des données fictives
      // En production, on utiliserait: attendanceService.getTodaysAttendanceForUser(userId, userRole);
      setAttendanceSheets(mockAttendanceSheets);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Erreur lors du chargement des émargements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaysAttendance();
  }, [userId, userRole]);

  const handleSignAttendance = (sheet: AttendanceSheet) => {
    setSelectedSheet(sheet);
    setIsSigningModalOpen(true);
  };

  const checkIfSigned = (sheet: AttendanceSheet) => {
    return sheet.signatures?.some(sig => sig.user_id === userId) || false;
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
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-8 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Gestion des Émargements</h1>
          <p className="text-purple-100">Suivez, signez et analysez les présences.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Badge Mon Pointage */}
        <div className="mb-6">
          <Badge className="bg-purple-600 text-white px-4 py-2 text-sm font-medium rounded-full">
            📋 Mon Pointage
          </Badge>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Mon Pointage</h2>
              <p className="text-gray-600">mercredi 23 juillet 2025</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="bg-purple-600 text-white hover:bg-purple-700 border-purple-600"
              >
                📅 Aujourd'hui
              </Button>
              <Button 
                variant="outline"
                className="border-gray-300"
              >
                🕒 Historique
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : attendanceSheets.length > 0 ? (
            <div className="space-y-6">
              {attendanceSheets.map((sheet) => {
                const isSigned = checkIfSigned(sheet);
                
                return (
                  <Card key={sheet.id} className="overflow-hidden hover:shadow-lg transition-all border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">[DEMO] {sheet.formations?.title}</h3>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <FileText className="h-4 w-4 mr-1" />
                            {sheet.formations?.level}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <Users className="h-4 w-4 mr-1" />
                            Formateur: {sheet.instructor?.first_name} {sheet.instructor?.last_name}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div className="flex items-center justify-end mb-1">
                            <Clock className="h-4 w-4 mr-1" />
                            {sheet.start_time} - {sheet.end_time}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        {!isSigned && isAttendanceOpen(sheet) ? (
                          <Button
                            onClick={() => handleSignAttendance(sheet)}
                            className="bg-green-600 hover:bg-green-700 text-white w-full"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Signer ma présence
                          </Button>
                        ) : isSigned ? (
                          <Button variant="outline" disabled className="bg-green-50 w-full">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                            Présence confirmée
                          </Button>
                        ) : !isAttendanceOpen(sheet) ? (
                          <Button variant="outline" disabled className="w-full">
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

      {/* Modal de signature */}
      {selectedSheet && userId && (
        <AttendanceSigningModal
          isOpen={isSigningModalOpen}
          onClose={() => {
            setIsSigningModalOpen(false);
            setSelectedSheet(null);
          }}
          attendanceSheet={selectedSheet}
          userId={userId}
          userRole={userRole || 'Étudiant'}
          onSigned={fetchTodaysAttendance}
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
    </div>
  );
};

export default Emargement;