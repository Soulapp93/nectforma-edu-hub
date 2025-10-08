import React, { useState, useEffect } from 'react';
import { Calendar, Clock, QrCode, Hash, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { attendanceService, AttendanceSheet } from '@/services/attendanceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import QRAttendanceCard from '../components/emargement/QRAttendanceCard';

const EmargementQR = () => {
  const [attendanceSheets, setAttendanceSheets] = useState<AttendanceSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const { userId, userRole } = useCurrentUser();
  const navigate = useNavigate();

  // Données de démonstration pour le prototype
  const mockAttendanceSheets: AttendanceSheet[] = [
    {
      id: 'qr-demo-1',
      schedule_slot_id: 'slot-1',
      formation_id: 'formation-1',
      title: 'Développement Web Avancé - Session QR',
      date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '12:00',
      room: 'Salle Informatique A',
      instructor_id: 'instructor-1',
      status: 'En cours',
      is_open_for_signing: true,
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      formations: {
        title: 'Développement Web Avancé',
        level: 'Master 1'
      },
      instructor: {
        first_name: 'Marie',
        last_name: 'Dubois'
      },
      signatures: []
    },
    {
      id: 'qr-demo-2',
      schedule_slot_id: 'slot-2',
      formation_id: 'formation-2',
      title: 'Intelligence Artificielle - Session QR',
      date: new Date().toISOString().split('T')[0],
      start_time: '14:00',
      end_time: '17:00',
      room: 'Salle Tech B',
      instructor_id: 'instructor-2',
      status: 'En attente',
      is_open_for_signing: false,
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      formations: {
        title: 'Intelligence Artificielle',
        level: 'Master 2'
      },
      instructor: {
        first_name: 'Jean',
        last_name: 'Martin'
      },
      signatures: []
    },
    {
      id: 'qr-demo-3',
      schedule_slot_id: 'slot-3',
      formation_id: 'formation-3',
      title: 'Cybersécurité Appliquée - Session QR',
      date: new Date().toISOString().split('T')[0],
      start_time: '08:00',
      end_time: '10:00',
      room: 'Salle Sécurité',
      instructor_id: 'instructor-3',
      status: 'Validé',
      is_open_for_signing: false,
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      formations: {
        title: 'Cybersécurité Appliquée',
        level: 'Master 2'
      },
      instructor: {
        first_name: 'Sophie',
        last_name: 'Laurent'
      },
      signatures: [
        {
          id: 'sig-1',
          attendance_sheet_id: 'qr-demo-3',
          user_id: userId || 'demo-user',
          user_type: 'student' as const,
          signed_at: new Date().toISOString(),
          present: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: null
        }
      ]
    }
  ];

  useEffect(() => {
    setAttendanceSheets(mockAttendanceSheets);
  }, [userId]);

  const checkIfSigned = (sheet: AttendanceSheet): boolean => {
    return sheet.signatures?.some(sig => sig.user_id === userId) || false;
  };

  const isAttendanceOpen = (sheet: AttendanceSheet): boolean => {
    return sheet.is_open_for_signing || false;
  };

  const getActiveSessionsCount = () => {
    return attendanceSheets.filter(sheet => sheet.status === 'En cours').length;
  };

  const getSignedSessionsCount = () => {
    return attendanceSheets.filter(sheet => checkIfSigned(sheet)).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header avec navigation */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/emargement')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'émargement classique
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <QrCode className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Émargement QR Code & Code</h1>
              <p className="text-blue-100">Prototype du nouveau système d'émargement moderne</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Sessions Actives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {getActiveSessionsCount()}
              </div>
              <div className="text-xs text-muted-foreground">
                Émargement possible maintenant
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Mes Émargements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {getSignedSessionsCount()}
              </div>
              <div className="text-xs text-muted-foreground">
                Sessions émargées aujourd'hui
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {attendanceSheets.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Prévues aujourd'hui
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Badge de prototype */}
        <div className="mb-6">
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 text-sm font-medium">
            🧪 PROTOTYPE - Interface de démonstration
          </Badge>
        </div>

        {/* En-tête des sessions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Sessions d'aujourd'hui
            </h2>
            <p className="text-muted-foreground mt-1">
              Utilisez le QR Code ou le code numérique pour vous émarger rapidement
            </p>
          </div>
        </div>

        {/* Liste des sessions avec cartes QR */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : attendanceSheets.length > 0 ? (
          <div className="grid gap-6">
            {attendanceSheets.map((sheet) => {
              const isSigned = checkIfSigned(sheet);
              const isOpen = isAttendanceOpen(sheet);

              return (
                <QRAttendanceCard
                  key={sheet.id}
                  attendanceSheet={sheet}
                  userRole={userRole}
                  isAlreadySigned={isSigned}
                  isAttendanceOpen={isOpen}
                />
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune session programmée
              </h3>
              <p className="text-muted-foreground">
                Les sessions d'émargement apparaîtront ici quand elles seront disponibles.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Informations sur le prototype */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              💡 À propos de ce prototype
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-700 mb-2">Pour les étudiants :</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Scanner le QR code affiché par le formateur</li>
                  <li>• Ou saisir le code numérique à 6 chiffres</li>
                  <li>• Émargement instantané et sécurisé</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-purple-700 mb-2">Pour les formateurs :</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Génération automatique du QR code et code</li>
                  <li>• Suivi en temps réel des émargements</li> 
                  <li>• Codes avec expiration automatique</li>
                </ul>
              </div>
            </div>
            <div className="pt-2 border-t border-blue-200">
              <p className="text-xs text-muted-foreground">
                <strong>Codes de test :</strong> Pour tester la saisie manuelle, utilisez le code <code className="bg-white px-1 rounded">123456</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmargementQR;