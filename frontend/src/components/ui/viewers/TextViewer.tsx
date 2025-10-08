
import React, { useState, useEffect } from 'react';

interface TextViewerProps {
  fileUrl: string;
  fileName: string;
}

const TextViewer: React.FC<TextViewerProps> = ({ fileUrl, fileName }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTextContent = async () => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error('Erreur de chargement du fichier');
        }
        const text = await response.text();
        setContent(text);
      } catch (err) {
        console.error('Erreur lors du chargement du fichier texte:', err);
        setError('Impossible de charger le contenu du fichier');
      } finally {
        setLoading(false);
      }
    };

    fetchTextContent();
  }, [fileUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-auto bg-white">
      <pre className="whitespace-pre-wrap font-mono text-sm">{content}</pre>
    </div>
  );
};

export default TextViewer;
