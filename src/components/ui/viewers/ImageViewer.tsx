
import React from 'react';

interface ImageViewerProps {
  fileUrl: string;
  fileName: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ fileUrl, fileName }) => {
  return (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <img
        src={fileUrl}
        alt={fileName}
        className="max-w-full max-h-full object-contain"
        onError={(e) => {
          console.error('Erreur de chargement de l\'image:', fileUrl);
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    </div>
  );
};

export default ImageViewer;
