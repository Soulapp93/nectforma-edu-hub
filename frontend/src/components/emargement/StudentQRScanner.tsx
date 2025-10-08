import React, { useState } from 'react';
import { QrCode, Hash, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import QRCodeScannerModal from './QRCodeScannerModal';
import StudentAttendancePortal from './StudentAttendancePortal';

interface StudentQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

const StudentQRScanner: React.FC<StudentQRScannerProps> = ({
  isOpen,
  onClose
}) => {
  const [showScanner, setShowScanner] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showAttendancePortal, setShowAttendancePortal] = useState(false);
  const [attendanceSheetId, setAttendanceSheetId] = useState('');
  const [qrCode, setQrCode] = useState('');

  const handleQRCodeScanned = (qrData: string) => {
    console.log('QR Code scanned:', qrData);
    
    // Extraire les informations du QR code
    // Format attendu: http://localhost:5173/emargement/{id}?code={code}
    try {
      const url = new URL(qrData);
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 1];
      const code = url.searchParams.get('code');
      
      if (id && code) {
        setAttendanceSheetId(id);
        setQrCode(code);
        setShowScanner(false);
        setShowAttendancePortal(true);
      } else {
        toast.error('QR Code invalide');
      }
    } catch (error) {
      // Si ce n'est pas une URL, essayer l'ancien format
      if (qrData.startsWith('attendance:')) {
        const parts = qrData.split(':');
        if (parts.length >= 4) {
          setAttendanceSheetId(parts[1]);
          setQrCode(parts[3]);
          setShowScanner(false);
          setShowAttendancePortal(true);
        } else {
          toast.error('Format de QR Code invalide');
        }
      } else {
        toast.error('QR Code non reconnu');
      }
    }
  };

  const handleManualCodeSubmit = () => {
    if (manualCode.length !== 6) {
      toast.error('Le code doit contenir 6 chiffres');
      return;
    }

    // Pour la saisie manuelle, nous devons demander l'ID de la session
    // Dans un vrai scenario, on pourrait faire une recherche par code
    toast.info('Fonctionnalité de saisie manuelle en développement');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Émargement étudiant
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Instructions */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Scannez le QR code affiché par votre formateur ou saisissez le code à 6 chiffres.
              </p>
            </div>

            {/* Option scanner QR */}
            <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowScanner(true)}>
              <CardContent className="p-6 text-center space-y-3">
                <QrCode className="w-12 h-12 mx-auto text-purple-600" />
                <h3 className="font-medium">Scanner le QR Code</h3>
                <p className="text-sm text-gray-600">
                  Utilisez la caméra de votre téléphone
                </p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <QrCode className="w-4 h-4 mr-2" />
                  Ouvrir la caméra
                </Button>
              </CardContent>
            </Card>

            {/* Option saisie manuelle */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="text-center space-y-2">
                  <Hash className="w-8 h-8 mx-auto text-gray-600" />
                  <h3 className="font-medium">Saisie manuelle</h3>
                  <p className="text-sm text-gray-600">
                    Entrez le code à 6 chiffres
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Input
                    placeholder="123456"
                    value={manualCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setManualCode(value);
                    }}
                    className="text-center text-lg font-mono"
                    maxLength={6}
                  />
                  <Button 
                    onClick={handleManualCodeSubmit}
                    disabled={manualCode.length !== 6}
                    variant="outline"
                    className="w-full"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Valider le code
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Aide */}
            <div className="text-center text-xs text-gray-500">
              Le QR code ou le code numérique vous sera fourni par votre formateur au début du cours.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scanner modal */}
      <QRCodeScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onQRCodeScanned={handleQRCodeScanned}
      />

      {/* Attendance portal */}
      <StudentAttendancePortal
        isOpen={showAttendancePortal}
        onClose={() => {
          setShowAttendancePortal(false);
          onClose();
        }}
        attendanceSheetId={attendanceSheetId}
        qrCode={qrCode}
      />
    </>
  );
};

export default StudentQRScanner;