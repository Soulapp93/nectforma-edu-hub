import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Download, Archive, FileX } from 'lucide-react';
import { TextBook, textBookService } from '@/services/textBookService';
import { useToast } from '@/hooks/use-toast';

interface TextBookCardProps {
  textBook: TextBook;
  onUpdate: () => void;
}

const TextBookCard: React.FC<TextBookCardProps> = ({ textBook, onUpdate }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entriesCount, setEntriesCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEntriesCount = async () => {
      try {
        const entries = await textBookService.getTextBookEntries(textBook.id);
        setEntriesCount(entries?.length || 0);
      } catch (error) {
        console.error('Erreur lors du chargement des entrées:', error);
      }
    };

    fetchEntriesCount();
  }, [textBook.id]);

  const handleOpenTextBook = () => {
    navigate(`/cahier-texte/${textBook.id}`);
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      // Simuler l'export PDF pour le moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Export réussi",
        description: "Le cahier de texte a été exporté en PDF.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter le cahier de texte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    setLoading(true);
    try {
      // Simuler l'archivage pour le moment
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: "Archivage réussi",
        description: "Le cahier de texte a été archivé.",
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'archiver le cahier de texte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Header avec couleur de la formation */}
      <div 
        className="p-6 text-white"
        style={{ 
          background: `linear-gradient(135deg, ${textBook.formations?.color || '#8B5CF6'}, ${textBook.formations?.color || '#8B5CF6'}cc)`
        }}
      >
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            Cahier de texte - {textBook.formations?.title || 'Formation'}
          </h3>
          <div className="text-sm opacity-90">
            {textBook.formations?.title || 'Formation'}
          </div>
          <div className="text-sm opacity-90">
            Année {textBook.academic_year}
          </div>
          <div className="text-sm font-medium">
            {entriesCount} entrée{entriesCount > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Content avec les boutons */}
      <CardContent className="p-6 space-y-3">
        <Button 
          onClick={handleOpenTextBook}
          className="w-full justify-start"
          variant="outline"
          disabled={loading}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Ouvrir
        </Button>

        <Button 
          onClick={handleExportPDF}
          className="w-full justify-start"
          variant="outline"
          disabled={loading}
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter PDF
        </Button>

        <Button 
          onClick={handleArchive}
          className="w-full justify-start"
          variant="outline"
          disabled={loading}
        >
          <Archive className="h-4 w-4 mr-2" />
          Archiver
        </Button>
      </CardContent>
    </Card>
  );
};

export default TextBookCard;