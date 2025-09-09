import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle2, XCircle, Edit3, FileText, Eye, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { attendanceService, AttendanceSheet } from '@/services/attendanceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useFormations } from '@/hooks/useFormations';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import EnhancedAttendanceSheetModal from './EnhancedAttendanceSheetModal';
import AbsenceReasonModal from './AbsenceReasonModal';
import AdminValidationModal from './AdminValidationModal';

const AttendanceManagement = () => {
  const [pendingSheets, setPendingSheets] = useState<AttendanceSheet[]>([]);
  const [allSheets, setAllSheets] = useState<AttendanceSheet[]>([]);
  const [formationSheets, setFormationSheets] = useState<AttendanceSheet[]>([]);
  const [pendingFormationSheets, setPendingFormationSheets] = useState<AttendanceSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<AttendanceSheet | null>(null);
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState<any>(null);
  const [view, setView] = useState<'formations' | 'sheets' | 'pending-formation'>('formations');
  const { userId } = useCurrentUser();
  const { formations, loading: formationsLoading } = useFormations();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const pending = await attendanceService.getPendingValidationSheets();
      setPendingSheets(pending);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormationSheets = async (formationId: string) => {
    try {
      setLoading(true);
      const sheets = await attendanceService.getAttendanceSheetsByFormation(formationId);
      // Trier les feuilles du plus ancien au plus récent
      sheets.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.start_time}`);
        const dateB = new Date(`${b.date} ${b.start_time}`);
        return dateA.getTime() - dateB.getTime();
      });
      setFormationSheets(sheets);
    } catch (error) {
      toast.error('Erreur lors du chargement des feuilles d\'émargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingFormationSheets = async (formationId: string) => {
    try {
      setLoading(true);
      const sheets = await attendanceService.getAttendanceSheetsByFormation(formationId);
      // Filtrer seulement les feuilles en attente de validation
      const pending = sheets.filter(sheet => sheet.status === 'En attente de validation');
      pending.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.start_time}`);
        const dateB = new Date(`${b.date} ${b.start_time}`);
        return dateA.getTime() - dateB.getTime();
      });
      setPendingFormationSheets(pending);
    } catch (error) {
      toast.error('Erreur lors du chargement des feuilles en attente');
    } finally {
      setLoading(false);
    }
  };

  const getPendingCountForFormation = (formationId: string): number => {
    return pendingSheets.filter(sheet => sheet.formation_id === formationId).length;
  };

  const handleFormationClick = async (formationId: string) => {
    setSelectedFormationId(formationId);
    setView('sheets');
    await fetchFormationSheets(formationId);
  };

  const handlePendingFormationClick = async (formationId: string) => {
    setSelectedFormationId(formationId);
    setView('pending-formation');
    await fetchPendingFormationSheets(formationId);
  };

  const handleBackToFormations = () => {
    setView('formations');
    setSelectedFormationId(null);
    setFormationSheets([]);
    setPendingFormationSheets([]);
  };

  const handleEditReason = (sheet: AttendanceSheet, signature: any) => {
    setSelectedSheet(sheet);
    setSelectedSignature(signature);
    setShowReasonModal(true);
  };

  const handleSaveReason = async (reasonType: string, reason: string) => {
    if (!selectedSignature) return;
    
    try {
      await attendanceService.updateAbsenceReason(
        selectedSignature.id, 
        reason, 
        reasonType
      );
      await fetchData();
    } catch (error) {
      throw error;
    }
  };

  const handleValidateSheet = (sheet: AttendanceSheet) => {
    setSelectedSheet(sheet);
    setShowValidationModal(true);
  };

  const handleConfirmValidation = async (signatureData?: string) => {
    if (!selectedSheet || !userId) return;
    
    try {
      await attendanceService.validateAttendanceSheet(
        selectedSheet.id, 
        userId, 
        signatureData
      );
      await fetchData();
      // Rafraîchir la vue courante
      if (view === 'pending-formation' && selectedFormationId) {
        await fetchPendingFormationSheets(selectedFormationId);
      } else if (view === 'sheets' && selectedFormationId) {
        await fetchFormationSheets(selectedFormationId);
      }
    } catch (error) {
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En attente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'En cours':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'En attente de validation':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Validé':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading || formationsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const selectedFormation = formations.find(f => f.id === selectedFormationId);

  return (
    <div className="space-y-6">
      {/* Feuilles en attente de validation */}
      {pendingSheets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Feuilles en attente de validation ({pendingSheets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingSheets.map((sheet) => (
                <Card key={sheet.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {sheet.formations?.title}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(new Date(sheet.date), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {sheet.start_time} - {sheet.end_time}
                          </span>
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {sheet.signatures?.filter(s => s.present).length || 0} présents
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(sheet.status)}>
                          {sheet.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSheet(sheet);
                            setShowSheetModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleValidateSheet(sheet)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Valider
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation et contenu principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              {view === 'formations' ? (
                <>
                  <FileText className="h-5 w-5 mr-2" />
                  Gestion des émargements par formation
                </>
              ) : view === 'pending-formation' ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToFormations}
                    className="mr-2 p-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <FileText className="h-5 w-5 mr-2" />
                  Feuilles en attente d'être traitées - {selectedFormation?.title}
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToFormations}
                    className="mr-2 p-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <FileText className="h-5 w-5 mr-2" />
                  Feuilles d'émargement - {selectedFormation?.title}
                </>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {view === 'formations' ? (
            // Vue des formations
            <div className="space-y-4">
              {formations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucune formation disponible
                </div>
              ) : (
                 formations.map((formation) => {
                   const pendingCount = getPendingCountForFormation(formation.id);
                   
                   return (
                     <Card
                       key={formation.id}
                       className="hover:bg-gray-50 transition-colors"
                     >
                       <CardContent className="p-4">
                         <div className="flex items-center justify-between">
                           <div className="cursor-pointer flex-1" onClick={() => handleFormationClick(formation.id)}>
                             <h3 className="font-semibold text-gray-900">
                               {formation.title}
                             </h3>
                             <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                               <span>{formation.level}</span>
                               <span>
                                 {format(new Date(formation.start_date), 'dd/MM/yyyy', { locale: fr })} - {' '}
                                 {format(new Date(formation.end_date), 'dd/MM/yyyy', { locale: fr })}
                               </span>
                               <Badge variant="secondary">{formation.status}</Badge>
                             </div>
                           </div>
                           <div className="flex items-center space-x-2">
                             {pendingCount > 0 && (
                               <Badge 
                                 className="bg-orange-100 text-orange-800 border-orange-200 cursor-pointer hover:bg-orange-200"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handlePendingFormationClick(formation.id);
                                 }}
                               >
                                 {pendingCount} à traiter
                               </Badge>
                             )}
                             <div className="cursor-pointer" onClick={() => handleFormationClick(formation.id)}>
                               <ChevronRight className="h-5 w-5 text-gray-400" />
                             </div>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   );
                 })
              )}
             </div>
           ) : view === 'pending-formation' ? (
             // Vue des feuilles en attente pour une formation
             <div>
               {pendingFormationSheets.length === 0 ? (
                 <div className="text-center py-8 text-gray-500">
                   Aucune feuille en attente de validation pour cette formation
                 </div>
               ) : (
                 <div className="space-y-4">
                   <div className="mb-4 p-4 bg-orange-50 border-l-4 border-l-orange-500 rounded-r-lg">
                     <h3 className="font-semibold text-orange-800 mb-2">En attente d'être traitées</h3>
                     <p className="text-sm text-orange-700">
                       {pendingFormationSheets.length} feuille(s) d'émargement nécessitent une validation par l'administration.
                     </p>
                   </div>
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Date</TableHead>
                         <TableHead>Horaires</TableHead>
                         <TableHead>Salle</TableHead>
                         <TableHead>Présents</TableHead>
                         <TableHead>Actions</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {pendingFormationSheets.map((sheet) => (
                         <TableRow key={sheet.id} className="bg-orange-50/50">
                           <TableCell className="font-medium">
                             {format(new Date(sheet.date), 'dd/MM/yyyy', { locale: fr })}
                           </TableCell>
                           <TableCell>
                             {sheet.start_time} - {sheet.end_time}
                           </TableCell>
                           <TableCell>
                             {sheet.room || '-'}
                           </TableCell>
                           <TableCell>
                             <span className="font-medium">
                               {sheet.signatures?.filter(s => s.present).length || 0}
                             </span>
                           </TableCell>
                           <TableCell>
                             <div className="flex space-x-2">
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => {
                                   setSelectedSheet(sheet);
                                   setShowSheetModal(true);
                                 }}
                               >
                                 <Edit3 className="h-4 w-4 mr-1" />
                                 Modifier
                               </Button>
                               <Button
                                 size="sm"
                                 onClick={() => handleValidateSheet(sheet)}
                                 className="bg-green-600 hover:bg-green-700"
                               >
                                 <CheckCircle2 className="h-4 w-4 mr-1" />
                                 Valider
                               </Button>
                             </div>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </div>
               )}
             </div>
           ) : (
            // Vue des feuilles d'émargement pour une formation
            <div>
              {formationSheets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucune feuille d'émargement pour cette formation
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Horaires</TableHead>
                      <TableHead>Salle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Présents</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formationSheets.map((sheet) => (
                      <TableRow key={sheet.id}>
                        <TableCell>
                          {format(new Date(sheet.date), 'dd/MM/yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {sheet.start_time} - {sheet.end_time}
                        </TableCell>
                        <TableCell>
                          {sheet.room || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(sheet.status)}>
                            {sheet.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sheet.signatures?.filter(s => s.present).length || 0}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSheet(sheet);
                              setShowSheetModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedSheet && showSheetModal && (
        <EnhancedAttendanceSheetModal
          isOpen={showSheetModal}
          onClose={() => {
            setShowSheetModal(false);
            setSelectedSheet(null);
          }}
          attendanceSheet={selectedSheet}
          onUpdate={fetchData}
        />
      )}

      {selectedSignature && showReasonModal && (
        <AbsenceReasonModal
          isOpen={showReasonModal}
          onClose={() => {
            setShowReasonModal(false);
            setSelectedSignature(null);
            setSelectedSheet(null);
          }}
          onSave={handleSaveReason}
          currentReason={selectedSignature.absence_reason}
          currentReasonType={selectedSignature.absence_reason_type}
          studentName={`${selectedSignature.user?.first_name} ${selectedSignature.user?.last_name}`}
        />
      )}

      {selectedSheet && showValidationModal && (
        <AdminValidationModal
          isOpen={showValidationModal}
          onClose={() => {
            setShowValidationModal(false);
            setSelectedSheet(null);
          }}
          attendanceSheet={selectedSheet}
          onValidate={handleConfirmValidation}
        />
      )}
    </div>
  );
};

export default AttendanceManagement;