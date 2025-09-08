
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
import AttendanceSheetModal from '../components/administration/AttendanceSheetModal';

const Emargement = () => {
  const [attendanceSheets, setAttendanceSheets] = useState<AttendanceSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<AttendanceSheet | null>(null);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);
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
      <div className="nect-gradient text-white py-8 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Gestion des Émargements</h1>
          <p className="text-purple-100">Suivez, signez et analysez les présences.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">{userRole === 'Formateur' ? (
        /* Vue Formateur */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Mon Pointage</h2>
              <p className="text-gray-600">{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</p>
            </div>
            <Button 
              variant="outline" 
              className="bg-purple-600 text-white hover:bg-purple-700 border-purple-600"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Aujourd'hui
            </Button>
          </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : attendanceSheets.length > 0 ? (
          <div className="space-y-6">
            {attendanceSheets.map((sheet) => {
              const isSigned = checkIfSigned(sheet);
              const signaturesCount = sheet.signatures?.filter(sig => sig.present).length || 0;
              
              return (
                <Card key={sheet.id} className="overflow-hidden border-l-4 border-l-purple-500 hover:shadow-lg transition-all">
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
                        <div>{signaturesCount} présents</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
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
                      
                      <div className="flex gap-2">
                        {userRole === 'Formateur' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSheet(sheet);
                              setShowAttendanceSheet(true);
                            }}
                          >
                            Historique
                          </Button>
                        )}
                        {!isSigned && isAttendanceOpen(sheet) ? (
                          <Button
                            onClick={() => handleSignAttendance(sheet)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Signer ma présence
                          </Button>
                        ) : isSigned ? (
                          <Button variant="outline" disabled className="bg-green-50">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                            Présence confirmée
                          </Button>
                        ) : !isAttendanceOpen(sheet) ? (
                          <Button variant="outline" disabled>
                            <Clock className="h-4 w-4 mr-2" />
                            Émargement fermé
                          </Button>
                        ) : null}
                      </div>
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
      ) : (
        /* Vue Étudiant */
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Mon Pointage</h2>
            <p className="text-gray-600">{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : attendanceSheets.length > 0 ? (
            <div className="space-y-4">
              {attendanceSheets.map((sheet) => {
                const isSigned = checkIfSigned(sheet);
                
                return (
                  <Card key={sheet.id} className="overflow-hidden hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
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
                      
                      <div className="mt-4 flex justify-between items-center">
                        <Badge className={getStatusColor(sheet.status)}>
                          {sheet.status}
                        </Badge>
                        
                        {!isSigned && isAttendanceOpen(sheet) ? (
                          <Button
                            onClick={() => handleSignAttendance(sheet)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Signer ma présence
                          </Button>
                        ) : isSigned ? (
                          <Button variant="outline" disabled className="bg-green-50">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                            Présence confirmée
                          </Button>
                        ) : !isAttendanceOpen(sheet) ? (
                          <Button variant="outline" disabled>
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
      )}
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
        <AttendanceSheetModal
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
