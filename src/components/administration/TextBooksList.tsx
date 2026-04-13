import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, BookText, Grid, List, Download, Archive, BookOpen } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CreateTextBookModal from './CreateTextBookModal';
import TextBookCard from './TextBookCard';
import FormationPromotionSelector from './FormationPromotionSelector';
import { textBookService, TextBook } from '@/services/textBookService';
import { formationService } from '@/services/formationService';
import { useToast } from '@/hooks/use-toast';

const TextBooksList: React.FC = () => {
  const [textBooks, setTextBooks] = useState<TextBook[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedTextBookForExport, setSelectedTextBookForExport] = useState<TextBook | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<any | null>(null);
  const [promotionTextBooks, setPromotionTextBooks] = useState<TextBook[]>([]);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
      toast({ title: "Erreur", description: "Impossible de charger les données.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-select formation from URL param
  useEffect(() => {
    const fId = searchParams.get('formationId');
    if (fId && formations.length > 0 && !selectedFormation) {
      const match = formations.find((f: any) => f.id === fId);
      if (match) handlePromotionSelect(match);
    }
  }, [searchParams, formations, selectedFormation]);

  const handlePromotionSelect = async (formation: any) => {
    setSelectedFormation(formation);
    setPromotionLoading(true);
    try {
      const allTextBooks = textBooks.filter(tb => tb.formation_id === formation.id);
      setPromotionTextBooks(allTextBooks);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setPromotionLoading(false);
    }
  };

  const handleBackToSelector = () => {
    setSelectedFormation(null);
    setPromotionTextBooks([]);
  };

  const handleCreateSuccess = () => {
    fetchData();
    if (selectedFormation) {
      // Refresh promotion textbooks
      setTimeout(() => {
        const allTextBooks = textBooks.filter(tb => tb.formation_id === selectedFormation.id);
        setPromotionTextBooks(allTextBooks);
      }, 500);
    }
  };

  const openExportModal = (textBook: TextBook) => {
    setSelectedTextBookForExport(textBook);
    setIsExportModalOpen(true);
  };

  const handleExportPDF = async (orientation: 'portrait' | 'landscape') => {
    if (!selectedTextBookForExport) return;
    try {
      const { pdfExportService } = await import('@/services/pdfExportService');
      const entries = await textBookService.getTextBookEntries(selectedTextBookForExport.id);
      await pdfExportService.exportTextBookToPDF(selectedTextBookForExport, entries || [], orientation);
      toast({ title: "Export réussi", description: "Le cahier de texte a été exporté en PDF." });
      setIsExportModalOpen(false);
      setSelectedTextBookForExport(null);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'exporter le cahier de texte.", variant: "destructive" });
    }
  };

  const handleArchive = async (textBookId: string) => {
    try {
      await textBookService.archiveTextBook(textBookId);
      toast({ title: "Archivage réussi", description: "Le cahier de texte a été archivé." });
      fetchData();
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'archiver le cahier de texte.", variant: "destructive" });
    }
  };

  // If a promotion is selected, show its textbooks
  if (selectedFormation) {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-2xl shadow-lg border-2 border-primary/20">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button onClick={handleBackToSelector} className="p-2 hover:bg-muted rounded-xl transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <BookText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Cahiers de texte - {selectedFormation.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedFormation.academic_year || ''} • {promotionTextBooks.length} cahier(s)
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="grid" className="px-2"><Grid className="h-4 w-4" /></TabsTrigger>
                    <TabsTrigger value="list" className="px-2"><List className="h-4 w-4" /></TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button onClick={() => setIsCreateModalOpen(true)} variant="premium" size="sm" className="text-xs">
                  <Plus className="h-4 w-4 mr-1" /> Créer
                </Button>
              </div>
            </div>
          </div>
        </div>

        {promotionLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : promotionTextBooks.length === 0 ? (
          <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Aucun cahier de texte</h3>
            <p className="text-muted-foreground mb-6">Créez un cahier de texte pour cette promotion.</p>
            <Button onClick={() => setIsCreateModalOpen(true)} variant="premium">
              <Plus className="h-4 w-4 mr-2" /> Créer un cahier de texte
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {promotionTextBooks.map((textBook) => (
              <TextBookCard key={textBook.id} textBook={textBook} onUpdate={fetchData} />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {promotionTextBooks.map((textBook) => (
                <div key={textBook.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-8 rounded" style={{ backgroundColor: textBook.formations?.color || '#8B5CF6' }} />
                      <div>
                        <h3 className="font-medium text-foreground">Cahier de texte - {textBook.formations?.title || 'Formation'}</h3>
                        <div className="text-sm text-muted-foreground">{textBook.description || ''}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button onClick={() => navigate(`/cahier-texte/${textBook.id}`)} variant="outline" size="sm">
                        <BookOpen className="h-4 w-4 mr-1" /> Ouvrir
                      </Button>
                      <Button onClick={() => openExportModal(textBook)} variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleArchive(textBook.id)} variant="outline" size="sm">
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <CreateTextBookModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={handleCreateSuccess} />

        <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Exporter en PDF</DialogTitle>
              <DialogDescription>Choisissez l'orientation du document PDF</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-primary hover:bg-primary/5" onClick={() => handleExportPDF('portrait')}>
                <div className="w-8 h-12 border-2 border-current rounded" /><span>Portrait</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-primary hover:bg-primary/5" onClick={() => handleExportPDF('landscape')}>
                <div className="w-12 h-8 border-2 border-current rounded" /><span>Paysage</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Default view: Formation → Promotion selector
  return (
    <>
      <FormationPromotionSelector
        formations={formations}
        loading={loading}
        icon={BookText}
        title="Gestion des cahiers de texte"
        onPromotionSelect={handlePromotionSelect}
        emptyMessage="Créez des formations pour gérer les cahiers de texte."
        headerActions={
          <Button onClick={() => setIsCreateModalOpen(true)} variant="premium" size="sm" className="text-xs sm:text-sm">
            <Plus className="h-4 w-4 mr-1" /> Créer un cahier de texte
          </Button>
        }
      />
      <CreateTextBookModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={handleCreateSuccess} />
    </>
  );
};

export default TextBooksList;
