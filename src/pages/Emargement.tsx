
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { attendanceService, AttendanceSheet } from '@/services/attendanceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AttendanceSigningModal from '../components/emargement/AttendanceSigningModal';

const Emargement = () => {
  const [attendanceSheets, setAttendanceSheets] = useState<AttendanceSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<AttendanceSheet | null>(null);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const { userId, userRole } = useCurrentUser();

  const fetchTodaysAttendance = async () => {
    if (!userId || !userRole) return;
    
    try {
      setLoading(true);
      const data = await attendanceService.getTodaysAttendanceForUser(userId, userRole);
      setAttendanceSheets(data);
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Émargement</h1>
        <p className="text-gray-600">Pointez votre présence pour les cours d'aujourd'hui</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : attendanceSheets.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Cours d'aujourd'hui</h2>
          
          <div className="grid gap-6">
            {attendanceSheets.map((sheet) => {
              const isSigned = checkIfSigned(sheet);
              
              return (
                <Card key={sheet.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {sheet.formations?.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600">{sheet.formations?.level}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(sheet.status)}>
                          {sheet.status}
                        </Badge>
                        {isSigned && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Signé
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {format(new Date(sheet.date), 'EEEE d MMMM', { locale: fr })}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {sheet.start_time} - {sheet.end_time}
                      </div>
                      {sheet.room && (
                        <div className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          Salle {sheet.room}
                        </div>
                      )}
                      <div className="flex items-center text-gray-600">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {sheet.signatures?.filter(sig => sig.present).length || 0} présents
                      </div>
                    </div>

                    <div className="flex justify-end">
                      {isSigned ? (
                        <Button variant="outline" disabled className="bg-green-50">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                          Présence confirmée
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSignAttendance(sheet)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Pointer ma présence
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
    </div>
  );
};

export default Emargement;
