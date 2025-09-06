import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateTextBookModal from './CreateTextBookModal';
import TextBookCard from './TextBookCard';
import { textBookService, TextBook } from '@/services/textBookService';
import { formationService } from '@/services/formationService';
import { useToast } from '@/hooks/use-toast';

const TextBooksList: React.FC = () => {
  const [textBooks, setTextBooks] = useState<TextBook[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormation, setSelectedFormation] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [textBooksData, formationsData] = await Promise.all([
        textBookService.getTextBooks(),
        formationService.getFormations()
      ]);
      setTextBooks(textBooksData || []);
      setFormations(formationsData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get unique years from textbooks
  const uniqueYears = [...new Set(textBooks.map(tb => tb.academic_year))].sort().reverse();

  const filteredTextBooks = textBooks.filter(textBook => {
    // Search filter
    const matchesSearch = !searchTerm || 
      textBook.formations?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      textBook.academic_year.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Formation filter
    const matchesFormation = selectedFormation === 'all' || 
      textBook.formation_id === selectedFormation;
    
    // Year filter
    const matchesYear = selectedYear === 'all' || 
      textBook.academic_year === selectedYear;
    
    return matchesSearch && matchesFormation && matchesYear;
  });

  const handleCreateSuccess = () => {
    fetchData();
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
      {/* Header with title and create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Gestion des Cahiers de Texte</h2>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Créer un Cahier de texte
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Recherche par mot (titre, formation)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <Select value={selectedFormation} onValueChange={setSelectedFormation}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Toutes les formations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les formations</SelectItem>
              {formations.map((formation) => (
                <SelectItem key={formation.id} value={formation.id}>
                  {formation.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
              <SelectItem value="all">Tous</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Toutes années" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes années</SelectItem>
              {uniqueYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {filteredTextBooks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || selectedFormation !== 'all' || selectedYear !== 'all' 
                ? 'Aucun cahier de texte trouvé' 
                : 'Aucun cahier de texte'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedFormation !== 'all' || selectedYear !== 'all'
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Commencez par créer votre premier cahier de texte pour une formation.'
              }
            </p>
            {!searchTerm && selectedFormation === 'all' && selectedYear === 'all' && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-purple-600 hover:bg-purple-700">
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
              onUpdate={fetchData}
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