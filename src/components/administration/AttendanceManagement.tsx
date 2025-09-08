import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle2, XCircle, Edit3, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { attendanceService, AttendanceSheet } from '@/services/attendanceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import AttendanceSheetModal from './AttendanceSheetModal';
import AbsenceReasonModal from './AbsenceReasonModal';
import AdminValidationModal from './AdminValidationModal';

const AttendanceManagement = () => {
  const [pendingSheets, setPendingSheets] = useState<AttendanceSheet[]>([]);
  const [allSheets, setAllSheets] = useState<AttendanceSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<AttendanceSheet | null>(null);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState<any>(null);
  const { userId } = useCurrentUser();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pending, all] = await Promise.all([
        attendanceService.getPendingValidationSheets(),
        attendanceService.getAttendanceSheets()
      ]);
      setPendingSheets(pending);
      setAllSheets(all);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feuilles en attente de validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Feuilles en attente de validation ({pendingSheets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingSheets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune feuille en attente de validation
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* Toutes les feuilles d'émargement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Toutes les feuilles d'émargement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Formation</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Horaires</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Présents</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allSheets.map((sheet) => (
                <TableRow key={sheet.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{sheet.formations?.title}</div>
                      <div className="text-sm text-gray-500">{sheet.formations?.level}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(sheet.date), 'dd/MM/yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {sheet.start_time} - {sheet.end_time}
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
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedSheet && showSheetModal && (
        <AttendanceSheetModal
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