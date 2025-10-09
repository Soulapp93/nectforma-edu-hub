import React from 'react';
import ModernFileViewer from './viewers/ModernFileViewer';

interface DocumentViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * DocumentViewer - Visionneuse de documents moderne
 * 
 * Supporte:
 * - PDFs avec contrôles avancés (zoom, navigation, rotation)
 * - Images (JPG, PNG, GIF, SVG, etc.)
 * - Vidéos (MP4, WEBM, etc.)
 * - Documents Office (via Office Online Viewer)
 * 
 * Fonctionnalités:
 * - Zoom ajustable pour PDFs
 * - Navigation page par page
 * - Rotation des pages
 * - Mode plein écran
 * - Téléchargement
 * - Raccourcis clavier
 */
const DocumentViewer: React.FC<DocumentViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose
}) => {
  return (
    <ModernFileViewer
      fileUrl={fileUrl}
      fileName={fileName}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
};

export default DocumentViewer;