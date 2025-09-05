import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CreateTextBookModal from './CreateTextBookModal';
import TextBookCard from './TextBookCard';
import { textBookService, TextBook } from '@/services/textBookService';
import { useToast } from '@/hooks/use-toast';

const TextBooksList: React.FC = () => {
  const [textBooks, setTextBooks] = useState<TextBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchTextBooks = async () => {
    try {
      setLoading(true);
      const data = await textBookService.getTextBooks();
      setTextBooks(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des cahiers de texte:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les cahiers de texte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTextBooks();
  }, []);

  const filteredTextBooks = textBooks.filter(textBook =>
    textBook.formations?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    textBook.academic_year.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSuccess = () => {
    fetchTextBooks();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement des cahiers de texte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher par formation ou année..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" />
          Créer un Cahier de Texte
        </Button>
      </div>

      {filteredTextBooks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="h-8 w-8 text-purple-600">📚</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Aucun cahier de texte trouvé' : 'Aucun cahier de texte'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Commencez par créer votre premier cahier de texte pour une formation.'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer mon premier cahier de texte
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTextBooks.map((textBook) => (
            <TextBookCard
              key={textBook.id}
              textBook={textBook}
            />
          ))}
        </div>
      )}

      <CreateTextBookModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default TextBooksList;