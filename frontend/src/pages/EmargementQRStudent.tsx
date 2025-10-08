import React, { useState } from 'react';
import { QrCode, Users, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StudentQRScanner from '@/components/emargement/StudentQRScanner';

const EmargementQRStudent = () => {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Émargement étudiant
          </h1>
          <p className="text-gray-600">
            Scannez le QR code pour pointer votre présence
          </p>
        </div>

        {/* Action principale */}
        <Card className="mb-6">
          <CardContent className="p-6 text-center space-y-4">
            <Users className="w-12 h-12 mx-auto text-purple-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">
              Scanner le QR Code
            </h2>
            <p className="text-gray-600">
              Votre formateur va afficher un QR code au tableau. Scannez-le pour accéder à la feuille d'émargement.
            </p>
            <Button 
              onClick={() => setShowScanner(true)}
              size="lg"
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <QrCode className="w-5 h-5 mr-2" />
              Commencer l'émargement
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Instructions</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs flex-shrink-0">
                  1
                </div>
                <div>
                  Attendez que votre formateur affiche le QR code au tableau
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs flex-shrink-0">
                  2
                </div>
                <div>
                  Cliquez sur "Commencer l'émargement" et scannez le QR code
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs flex-shrink-0">
                  3
                </div>
                <div>
                  Sélectionnez votre nom dans la liste des étudiants
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs flex-shrink-0">
                  4
                </div>
                <div>
                  Signez électroniquement pour valider votre présence
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Option alternative */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">
            Problème avec la caméra ?
          </p>
          <Button 
            variant="outline" 
            onClick={() => setShowScanner(true)}
            className="text-purple-600 border-purple-600 hover:bg-purple-50"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Saisir le code manuellement
          </Button>
        </div>
      </div>

      {/* Scanner Modal */}
      <StudentQRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
      />
    </div>
  );
};

export default EmargementQRStudent;