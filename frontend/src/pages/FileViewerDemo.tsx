import React from 'react';
import { Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ModernFileViewer from '@/components/ui/viewers/ModernFileViewer';
import FileIcon from '@/components/ui/FileIcon';
import { useFileViewer } from '@/hooks/useFileViewer';
import { useNavigate } from 'react-router-dom';
import demoFiles from '@/utils/demoFiles';

const FileViewerDemo: React.FC = () => {
  const { isOpen, currentFile, openFile, closeViewer } = useFileViewer();
  const navigate = useNavigate();

  const handleOpenFile = (file: typeof demoFiles[0]) => {
    openFile(file.url, file.name, file.type);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Démonstration du ModernFileViewer
              </h1>
              <p className="text-gray-600 mt-2">
                Testez la visualisation de différents types de fichiers avec notre nouveau système
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Files Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demoFiles.map((file) => (
            <Card key={file.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                    <FileIcon fileName={file.name} size="lg" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{file.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {file.type.split('/')[1].toUpperCase()} • {file.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <strong>Type MIME:</strong> {file.type}
                  </div>
                  
                  <Button
                    onClick={() => handleOpenFile(file)}
                    className="w-full flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualiser avec ModernFileViewer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-12 bg-white rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Fonctionnalités du ModernFileViewer
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">📄 Documents PDF</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Navigation par pages avec miniatures</li>
                <li>• Zoom et rotation</li>
                <li>• Recherche dans le document</li>
                <li>• Mode plein écran</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">🏢 Documents Office</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PowerPoint, Word, Excel</li>
                <li>• Rendu via Office Online</li>
                <li>• Fallback Google Docs Viewer</li>
                <li>• Interface native</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">🖼️ Images</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Zoom et pan</li>
                <li>• Rotation d'image</li>
                <li>• Tous formats supportés</li>
                <li>• Qualité optimisée</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">🎥 Vidéos</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Lecteur HTML5 avancé</li>
                <li>• Contrôles personnalisés</li>
                <li>• Support multi-format</li>
                <li>• Raccourcis clavier</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">🎵 Audio</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Interface élégante</li>
                <li>• Lecteur intégré</li>
                <li>• Contrôles avancés</li>
                <li>• Visualisation moderne</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">⌨️ Raccourcis</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <kbd>Escape</kbd> : Fermer</li>
                <li>• <kbd>←/→</kbd> : Navigation</li>
                <li>• <kbd>Ctrl+/Ctrl-</kbd> : Zoom</li>
                <li>• <kbd>Space</kbd> : Play/Pause</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ModernFileViewer */}
      {isOpen && currentFile && (
        <ModernFileViewer
          fileUrl={currentFile.url}
          fileName={currentFile.name}
          mimeType={currentFile.mimeType}
          isOpen={isOpen}
          onClose={closeViewer}
        />
      )}
    </div>
  );
};

export default FileViewerDemo;