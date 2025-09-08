import React from 'react';
import { Calendar, Clock, Users, FileText, Download, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AttendanceSheet } from '@/services/attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AttendanceSheetViewProps {
  attendanceSheet: AttendanceSheet;
  onExportPDF?: () => void;
  onValidate?: () => void;
  showActions?: boolean;
}

const AttendanceSheetView: React.FC<AttendanceSheetViewProps> = ({
  attendanceSheet,
  onExportPDF,
  onValidate,
  showActions = true
}) => {
  const signedUsers = attendanceSheet.signatures?.filter(sig => sig.present) || [];
  const absentUsers = attendanceSheet.signatures?.filter(sig => !sig.present) || [];
  const delayedUsers = attendanceSheet.signatures?.filter(sig => sig.present && sig.user_type === 'student') || [];

  // Simulated total expected users (in production, fetch from formation enrollment)
  const totalExpectedUsers = Math.max(signedUsers.length + absentUsers.length, 8);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Présent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Retard':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Absent':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div 
        className="nect-gradient text-white p-8 text-center"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6, #9333EA)',
          borderRadius: '12px 12px 0 0'
        }}
      >
        <h1 className="text-2xl font-bold mb-4">FEUILLE D'ÉMARGEMENT</h1>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{attendanceSheet.formations?.title}</h2>
          <p className="text-purple-100">Niveau : {attendanceSheet.formations?.level}</p>
          <div className="flex justify-center items-center space-x-6 mt-4 text-sm">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {format(new Date(attendanceSheet.date), 'dd/MM/yyyy', { locale: fr })}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              {attendanceSheet.start_time}
            </div>
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Salle {attendanceSheet.room || 'A101'}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              {attendanceSheet.instructor?.first_name} {attendanceSheet.instructor?.last_name}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger en PDF
            </Button>
            <Button onClick={onValidate} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Valider & Signer
            </Button>
          </div>
        </div>
      )}

      {/* Participants List */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Liste des participants ({signedUsers.length})
        </h3>
        
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="bg-purple-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-purple-900">
                  Nom et Prénom
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-purple-900">
                  Statut
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-purple-900">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-purple-900 w-32">
                  Signature
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Present Users */}
              {signedUsers.map((signature, index) => (
                <tr key={signature.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                      <span className="font-medium text-gray-900">
                        {signature.user?.first_name} {signature.user?.last_name}
                      </span>
                      <br />
                      <span className="text-sm text-gray-500">
                        Licence Informatique L1
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Présent
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                    {signature.user?.email}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {signature.signature_data ? (
                      <img
                        src={signature.signature_data}
                        alt="Signature"
                        className="h-8 max-w-20 object-contain mx-auto border rounded"
                      />
                    ) : (
                      <div className="text-xs text-gray-400">Non signé</div>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* Add some demo absent users */}
              <tr className="bg-white">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-3"></div>
                    <span className="font-medium text-gray-900">Dan</span>
                    <br />
                    <span className="text-sm text-gray-500">Licence Informatique L1</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Retard
                  </Badge>
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">
                  dan@example.com
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="text-xs text-gray-400">Non signé</div>
                </td>
              </tr>

              <tr className="bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-3"></div>
                    <span className="font-medium text-gray-900">Eva</span>
                    <br />
                    <span className="text-sm text-gray-500">Licence Informatique L1</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    Absent
                  </Badge>
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">
                  eva@example.com
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="text-xs text-gray-400">Absent</div>
                </td>
              </tr>

              <tr className="bg-white">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-3"></div>
                    <span className="font-medium text-gray-900">Frank</span>
                    <br />
                    <span className="text-sm text-gray-500">Licence Informatique L1</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    Absent
                  </Badge>
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">
                  frank@example.com
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="text-xs text-gray-400">Absent</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Signatures Section */}
      <div className="p-6 border-t bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <h4 className="font-semibold mb-4 text-gray-900">Signature du Formateur</h4>
            <div className="h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
              {attendanceSheet.signatures?.find(sig => sig.user_type === 'instructor')?.signature_data ? (
                <img
                  src={attendanceSheet.signatures.find(sig => sig.user_type === 'instructor')?.signature_data}
                  alt="Signature formateur"
                  className="h-16 max-w-32 object-contain"
                />
              ) : (
                <span className="text-gray-500 text-sm">Signature en attente...</span>
              )}
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="font-semibold mb-4 text-gray-900">Signature de l'Administration</h4>
            <div className="h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
              <span className="text-gray-500 text-sm">Signature en attente...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceSheetView;