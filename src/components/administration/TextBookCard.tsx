import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText } from 'lucide-react';
import { TextBook } from '@/services/textBookService';

interface TextBookCardProps {
  textBook: TextBook;
}

const TextBookCard: React.FC<TextBookCardProps> = ({ textBook }) => {
  const navigate = useNavigate();

  const handleOpenTextBook = () => {
    navigate(`/cahier-texte/${textBook.id}`);
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader 
        className="pb-4"
        style={{ 
          background: `linear-gradient(135deg, ${textBook.formations?.color || '#8B5CF6'}, ${textBook.formations?.color || '#8B5CF6'}cc)`
        }}
      >
        <div className="flex items-start justify-between text-white">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span className="text-sm font-medium">Cahier de texte</span>
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-lg font-semibold text-white mb-1">
            {textBook.formations?.title || 'Formation'}
          </h3>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {textBook.academic_year}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>
            Créé le {new Date(textBook.created_at).toLocaleDateString('fr-FR')}
          </span>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleOpenTextBook}
            className="w-full"
            variant="default"
          >
            Ouvrir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TextBookCard;