import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle2, XCircle, Edit3, FileText, Eye, ArrowLeft, ChevronRight, PenTool, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { attendanceService, AttendanceSheet } from '@/services/attendanceService';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useFormations } from '@/hooks/useFormations';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import EnhancedAttendanceSheetModal from './EnhancedAttendanceSheetModal';
import AbsenceReasonModal from './AbsenceReasonModal';
import AdminValidationModal from './AdminValidationModal';
import AdminAttendanceValidation from '../emargement/AdminAttendanceValidation';
import SignatureManagementModal from '../ui/signature-management-modal';
import { pdfExportService } from '@/services/pdfExportService';

const AttendanceManagement = () => {
  const [pendingSheets, setPendingSheets] = useState<AttendanceSheet[]>([]);
  const [allSheets, setAllSheets] = useState<AttendanceSheet[]>([]);
  const [formationSheets, setFormationSheets] = useState<AttendanceSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<AttendanceSheet | null>(null);
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState<any>(null);
  const [adminSignature, setAdminSignature] = useState<string | null>(null);
  const [view, setView] = useState<'formations' | 'sheets'>('formations');
  const { userId } = useCurrentUser();
  const { formations, loading: formationsLoading } = useFormations();

  useEffect(() => {
    fetchData();
    if (userId) {
      loadAdminSignature();
    }
  }, [userId]);

  const loadAdminSignature = async () => {
    if (!userId) {
      console.log('Pas d\'userId pour charger la signature');
      return;
    }
    
    console.log('Chargement signature admin pour userId:', userId);
    
    try {
      const { data, error } = await supabase
        .from('user_signatures')
        .select('signature_data')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading admin signature:', error);
        setAdminSignature(null);
        return;
      }

      console.log('Données récupérées:', { data, hasData: !!data, hasSignatureData: !!(data?.signature_data) });

      if (data?.signature_data && data.signature_data.trim() !== '') {
        setAdminSignature(data.signature_data);
        console.log('Signature admin chargée avec succès');
      } else {
        setAdminSignature(null);
        console.log('Aucune signature valide trouvée');
      }
    } catch (error) {
      console.error('Error loading admin signature:', error);  
      setAdminSignature(null);
    }
  };

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
      // Trier les feuilles : feuilles en attente de validation en haut, puis par date
      sheets.sort((a, b) => {
        // Priorité aux feuilles en attente de validation
        if (a.status === 'En attente de validation' && b.status !== 'En attente de validation') {
          return -1;
        }
        if (b.status === 'En attente de validation' && a.status !== 'En attente de validation') {
          return 1;
        }
        // Ensuite trier par date (plus récent en premier)
        const dateA = new Date(`${a.date} ${a.start_time}`);
        const dateB = new Date(`${b.date} ${b.start_time}`);
        return dateB.getTime() - dateA.getTime();
      });
      setFormationSheets(sheets);
    } catch (error) {
      toast.error('Erreur lors du chargement des feuilles d\'émargement');
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

  const handleBackToFormations = () => {
    setView('formations');
    setSelectedFormationId(null);
    setFormationSheets([]);
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

  const handleValidateSheet = async (sheet: AttendanceSheet) => {
    if (!userId) {
      toast.error('Utilisateur non identifié');
      return;
    }

    console.log('Début validation, vérification signature admin...');
    console.log('Signature admin disponible:', !!adminSignature);
    
    try {
      if (adminSignature) {
        console.log('Validation avec signature existante');
        await attendanceService.validateAttendanceSheet(sheet.id, userId, adminSignature);
        toast.success('Feuille d\'émargement validée avec la signature enregistrée');
        
        await fetchData();
        // Rafraîchir la vue courante
        if (view === 'sheets' && selectedFormationId) {
          await fetchFormationSheets(selectedFormationId);
        }
      } else {
        // Aucune signature trouvée, ouvrir le modal pour signature manuelle
        console.log('Aucune signature trouvée, ouverture du modal');
        setSelectedSheet(sheet);
        setShowValidationModal(true);
      }
    } catch (error) {
      console.error('Error validating attendance sheet:', error);
      toast.error('Erreur lors de la validation');
    }
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
      if (view === 'sheets' && selectedFormationId) {
        await fetchFormationSheets(selectedFormationId);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSaveAdminSignature = async (signatureData: string) => {
    if (!userId) return;
    
    try {
      if (signatureData && signatureData.trim() !== '') {
        console.log('Sauvegarde signature admin, longueur:', signatureData.length);
        
        // Sauvegarder dans la base de données
        const { error } = await supabase
          .from('user_signatures')
          .upsert({
            user_id: userId,
            signature_data: signatureData
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error saving admin signature:', error);
          toast.error('Erreur lors de la sauvegarde de la signature');
          return;
        }

        setAdminSignature(signatureData);
        toast.success('Signature administrative sauvegardée');
        console.log('Signature admin sauvegardée avec succès');
        
        // Recharger pour vérification
        setTimeout(() => {
          loadAdminSignature();
        }, 500);
        
      } else {
        console.log('Suppression signature admin');
        
        // Supprimer de la base de données
        const { error } = await supabase
          .from('user_signatures')
          .delete()
          .eq('user_id', userId);

        if (error) {
          console.error('Error deleting admin signature:', error);
          toast.error('Erreur lors de la suppression de la signature');
          return;
        }

        setAdminSignature(null);
        toast.success('Signature administrative supprimée');
        console.log('Signature admin supprimée avec succès');
      }
    } catch (error) {
      console.error('Error managing admin signature:', error);
      toast.error('Erreur lors de la gestion de la signature');
    }
  };

  const handleDownloadPDF = async (sheet: AttendanceSheet) => {
    try {
      await pdfExportService.exportAttendanceSheetSimple(sheet);
      toast.success('Feuille d\'émargement téléchargée');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleRowClick = (sheet: AttendanceSheet) => {
    setSelectedSheet(sheet);
    setShowSheetModal(true);
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
            {view === 'formations' && (
              <Button
                onClick={() => setShowSignatureModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Enregistrement signature
              </Button>
            )}
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
                                   handleFormationClick(formation.id);
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
                      <TableHead>Module</TableHead>
                      <TableHead>Salle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formationSheets.map((sheet) => (
                      <TableRow 
                        key={sheet.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleRowClick(sheet)}
                      >
                        <TableCell>
                          {format(new Date(sheet.date), 'dd/MM/yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {sheet.start_time} - {sheet.end_time}
                        </TableCell>
                        <TableCell>
                          {(sheet as any).schedule_slots?.formation_modules?.title || 'Module non défini'}
                        </TableCell>
                        <TableCell>
                          {sheet.room || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(sheet.status)}>
                            {sheet.status}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPDF(sheet)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Télécharger
                            </Button>
                            {sheet.status === 'En attente de validation' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleValidateSheet(sheet)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Valider
                              </Button>
                            )}
                          </div>
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
        <AdminAttendanceValidation
          isOpen={showValidationModal}
          onClose={() => {
            setShowValidationModal(false);
            setSelectedSheet(null);
          }}
          attendanceSheet={selectedSheet}
          onValidate={handleConfirmValidation}
        />
      )}

      <SignatureManagementModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        currentSignature={adminSignature}
        onSave={handleSaveAdminSignature}
        title="Gestion de la signature administrative"
      />
    </div>
  );
};

export default AttendanceManagement;