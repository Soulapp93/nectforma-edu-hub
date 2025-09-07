import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, Clock, FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AttendanceSheet, attendanceService } from '@/services/attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AttendanceSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceSheet: AttendanceSheet;
  onUpdate: () => void;
}

const AttendanceSheetModal: React.FC<AttendanceSheetModalProps> = ({
  isOpen,
  onClose,
  attendanceSheet,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState(attendanceSheet);

  useEffect(() => {
    setSheet(attendanceSheet);
  }, [attendanceSheet]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setLoading(true);
      await attendanceService.updateAttendanceSheetStatus(sheet.id, newStatus);
      setSheet({ ...sheet, status: newStatus });
      toast.success('Statut mis à jour avec succès');
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setLoading(false);
    }
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

  const signedUsers = sheet.signatures?.filter(sig => sig.present) || [];
  const totalExpectedUsers = signedUsers.length; // En production, on devrait récupérer tous les étudiants inscrits

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Feuille d'émargement</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* En-tête de la feuille */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-xl">
                FEUILLE D'ÉMARGEMENT
              </CardTitle>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">{sheet.formations?.title}</h3>
                <p className="text-gray-600">Niveau : {sheet.formations?.level}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{format(new Date(sheet.date), 'EEEE d MMMM yyyy', { locale: fr })}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{sheet.start_time} - {sheet.end_time}</span>
                </div>
                {sheet.room && (
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Salle {sheet.room}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Badge className={getStatusColor(sheet.status)}>
                    {sheet.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Select value={sheet.status} onValueChange={handleStatusUpdate} disabled={loading}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="En attente">En attente</SelectItem>
                    <SelectItem value="En cours">En cours</SelectItem>
                    <SelectItem value="Terminé">Terminé</SelectItem>
                    <SelectItem value="Fermé">Fermé</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Présents</p>
                    <p className="text-2xl font-bold text-green-600">{signedUsers.length}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taux de présence</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {totalExpectedUsers > 0 ? Math.round((signedUsers.length / totalExpectedUsers) * 100) : 0}%
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Statut</p>
                    <p className="text-lg font-semibold">{sheet.status}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des signatures */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Liste des participants</CardTitle>
            </CardHeader>
            <CardContent>
              {signedUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Nom et Prénom</th>
                        <th className="text-left p-3 font-semibold">Statut</th>
                        <th className="text-left p-3 font-semibold">Heure de signature</th>
                        <th className="text-left p-3 font-semibold">Signature</th>
                      </tr>
                    </thead>
                    <tbody>
                      {signedUsers.map((signature, index) => (
                        <tr key={signature.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="p-3 border-b">
                            {signature.user?.first_name} {signature.user?.last_name}
                          </td>
                          <td className="p-3 border-b">
                            <Badge className={signature.present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {signature.present ? 'Présent' : 'Absent'}
                            </Badge>
                          </td>
                          <td className="p-3 border-b">
                            {format(new Date(signature.signed_at), 'HH:mm', { locale: fr })}
                          </td>
                          <td className="p-3 border-b">
                            {signature.signature_data ? (
                              <img
                                src={signature.signature_data}
                                alt="Signature"
                                className="h-8 max-w-24 object-contain border rounded"
                              />
                            ) : (
                              <span className="text-gray-500 text-sm">Pas de signature</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune signature enregistrée</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signatures du formateur et de l'administration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Signatures officielles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-center">
                  <p className="font-medium mb-4">Signature du Formateur</p>
                  <div className="h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                    {sheet.instructor ? (
                      <span className="text-sm text-gray-600">
                        {sheet.instructor.first_name} {sheet.instructor.last_name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">En attente</span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-medium mb-4">Signature de l'Administration</p>
                  <div className="h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                    <span className="text-sm text-gray-500">En attente</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceSheetModal;