import React, { useState } from 'react';
import { Eye, FileText, Image, Video, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModernFileViewer from '@/components/ui/viewers/ModernFileViewer';

const ViewerTestPage: React.FC = () => {
  const [currentViewer, setCurrentViewer] = useState<{
    url: string;
    name: string;
    mimeType: string;
  } | null>(null);

  const testFiles = [
    {
      name: "Document PDF de test",
      url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
      mimeType: "application/pdf",
      icon: FileText,
      color: "#ef4444"
    },
    {
      name: "Présentation PowerPoint (.pptx)",
      url: "https://scholar.harvard.edu/files/torman_personal/files/samplepptx.pptx",
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      icon: FileText,
      color: "#d97706"
    },
    {
      name: "Fichier Excel (.xlsx)",
      url: "https://file-examples.com/storage/fef363408b1b66edd78abdc/2017/10/file_example_XLSX_10.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      icon: FileText,
      color: "#10b981"
    },
    {
      name: "Image haute résolution",
      url: "https://picsum.photos/1920/1080?random=5",
      mimeType: "image/jpeg",
      icon: Image,
      color: "#6366f1"
    },
    {
      name: "Vidéo HD (MP4)",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      mimeType: "video/mp4",
      icon: Video,
      color: "#8b5cf6"
    },
    {
      name: "Fichier audio (MP3)",
      url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      mimeType: "audio/mpeg",
      icon: Volume2,
      color: "#ec4899"
    }
  ];

  const openViewer = (file: typeof testFiles[0]) => {
    setCurrentViewer({
      url: file.url,
      name: file.name,
      mimeType: file.mimeType
    });
  };

  const closeViewer = () => {
    setCurrentViewer(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ModernFileViewer - Test des Améliorations
          </h1>
          <p className="text-xl text-gray-600">
            Testez le nouveau mode plein écran et l'ajustateur de largeur
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {testFiles.map((file, index) => {
            const IconComponent = file.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: file.color + '20' }}
                >
                  <IconComponent 
                    className="w-8 h-8" 
                    style={{ color: file.color }} 
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {file.name}
                </h3>
                <Button 
                  onClick={() => openViewer(file)}
                  className="w-full"
                  style={{ backgroundColor: file.color }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Tester le visualiseur
                </Button>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🚀 Nouvelles Fonctionnalités
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                ⛶ Mode Plein Écran Amélioré
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Vrai plein écran qui masque tout</li>
                <li>• Barre d'outils qui disparaît automatiquement</li>
                <li>• Réapparaît au mouvement de la souris</li>
                <li>• Interface adaptée (sombre) en plein écran</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">
                📏 Ajustateur de Largeur (Chrome-style)
              </h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Taille automatique</li>
                <li>• Ajuster à la largeur</li>
                <li>• Ajuster à la hauteur</li>
                <li>• Page entière</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">
                ⌨️ Raccourcis Clavier
              </h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• <kbd className="px-1 bg-white rounded">Escape</kbd> : Fermer</li>
                <li>• <kbd className="px-1 bg-white rounded">←/→</kbd> : Navigation pages</li>
                <li>• <kbd className="px-1 bg-white rounded">Ctrl +/-</kbd> : Zoom</li>
                <li>• <kbd className="px-1 bg-white rounded">F11</kbd> : Plein écran</li>
              </ul>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">
                🎨 Interface Adaptative
              </h3>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Design responsive</li>
                <li>• Thème sombre en plein écran</li>
                <li>• Contrôles optimisés par type</li>
                <li>• Animations fluides</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            💡 <strong>Astuce :</strong> Testez le mode plein écran en cliquant sur l'icône ⛶ 
            puis utilisez l'ajustateur de largeur (icône ⚏) pour voir les différents modes d'affichage !
          </p>
        </div>
      </div>

      {/* ModernFileViewer */}
      {currentViewer && (
        <ModernFileViewer
          fileUrl={currentViewer.url}
          fileName={currentViewer.name}
          mimeType={currentViewer.mimeType}
          isOpen={!!currentViewer}
          onClose={closeViewer}
        />
      )}
    </div>
  );
};

export default ViewerTestPage;