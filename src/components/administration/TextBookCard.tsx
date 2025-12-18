import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Download, Archive, FileX } from 'lucide-react';
import { TextBook, TextBookEntry, textBookService } from '@/services/textBookService';
import { pdfExportService } from '@/services/pdfExportService';
import { useToast } from '@/hooks/use-toast';

interface TextBookCardProps {
  textBook: TextBook;
  onUpdate: () => void;
}

const TextBookCard: React.FC<TextBookCardProps> = ({ textBook, onUpdate }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entries, setEntries] = useState<TextBookEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const entriesData = await textBookService.getTextBookEntries(textBook.id);
        setEntries((entriesData as TextBookEntry[]) || []);
      } catch (error) {
        console.error('Erreur lors du chargement des entrées:', error);
      }
    };

    fetchEntries();
  }, [textBook.id]);

  const handleOpenTextBook = () => {
    navigate(`/cahier-texte/${textBook.id}?from=administration`);
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      await pdfExportService.exportTextBookToPDF(textBook, entries, 'portrait');
      toast({
        title: "Export réussi",
        description: "Le cahier de texte a été exporté en PDF.",
      });
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
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
      await textBookService.archiveTextBook(textBook.id);
      toast({
        title: "Archivage réussi",
        description: "Le cahier de texte a été archivé.",
      });
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
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
        className="p-4 text-white"
        style={{ 
          background: `linear-gradient(135deg, ${textBook.formations?.color || '#8B5CF6'}, ${textBook.formations?.color || '#8B5CF6'}cc)`
        }}
      >
        <div className="space-y-2">
          <h3 className="text-base font-semibold">
            Cahier de texte - {textBook.formations?.title || 'Formation'}
          </h3>
          <div className="text-sm opacity-90">
            {textBook.formations?.title || 'Formation'}
          </div>
          <div className="text-sm opacity-90">
            Année {textBook.academic_year}
          </div>
          <div className="text-sm font-medium">
            {entries.length} entrée{entries.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Content avec les boutons */}
      <CardContent className="p-4 space-y-2">
        <Button 
          onClick={handleOpenTextBook}
          className="w-full justify-start text-sm"
          variant="outline"
          disabled={loading}
          size="sm"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Ouvrir
        </Button>

        <Button 
          onClick={handleExportPDF}
          className="w-full justify-start text-sm"
          variant="outline"
          disabled={loading}
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter PDF
        </Button>

        <Button 
          onClick={handleArchive}
          className="w-full justify-start text-sm"
          variant="outline"
          disabled={loading}
          size="sm"
        >
          <Archive className="h-4 w-4 mr-2" />
          Archiver
        </Button>
      </CardContent>
    </Card>
  );
};

export default TextBookCard;