import React, { useState, useEffect, useMemo } from 'react';
import { Search, Users, Calendar, BookText, CalendarClock, ClipboardCheck, ChevronRight, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { promotionService, Promotion } from '@/services/promotionService';
import { useMyContext } from '@/hooks/useMyContext';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const PromotionsList: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { establishment } = useMyContext();
  const [, setSearchParams] = useSearchParams();

  const fetchPromotions = async () => {
    if (!establishment?.id) return;
    try {
      setLoading(true);
      const data = await promotionService.getPromotions(establishment.id);
      setPromotions(data);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des promotions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, [establishment?.id]);

  const filtered = useMemo(() => {
    if (!searchTerm) return promotions;
    const s = searchTerm.toLowerCase();
    return promotions.filter(p =>
      p.name.toLowerCase().includes(s) ||
      p.formations?.title?.toLowerCase().includes(s)
    );
  }, [promotions, searchTerm]);

  const handleToggleActive = async (p: Promotion) => {
    try {
      await promotionService.togglePromotionActive(p.id, !p.is_active);
      toast.success(p.is_active ? 'Promotion désactivée' : 'Promotion activée');
      fetchPromotions();
    } catch {
      toast.error('Erreur');
    }
  };

  const handleDelete = async (p: Promotion) => {
    if (!confirm(`Supprimer la promotion "${p.name}" ?`)) return;
    try {
      await promotionService.deletePromotion(p.id);
      toast.success('Promotion supprimée');
      fetchPromotions();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const navigateToTab = (tab: string) => {
    setSearchParams({ tab });
  };

  if (loading) return <LoadingState message="Chargement des promotions..." />;

  if (promotions.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucune promotion"
        description="Les promotions sont créées automatiquement lors de la création d'une formation. Rendez-vous dans l'onglet Gestion des formations."
        action={
          <Button onClick={() => navigateToTab('formations')} data-testid="go-to-formations-btn">
            Créer une formation
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4" data-testid="promotions-list">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher une promotion..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            data-testid="search-promotions"
          />
        </div>
        <Badge variant="secondary" className="shrink-0">{filtered.length} promotion{filtered.length > 1 ? 's' : ''}</Badge>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => (
          <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow" data-testid={`promotion-card-${p.id}`}>
            {/* Color bar */}
            <div className="h-1.5" style={{ backgroundColor: p.formations?.color || '#8B5CF6' }} />
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.formations?.title} &bull; {p.formations?.level}
                  </p>
                </div>
                <Badge variant={p.is_active ? 'default' : 'secondary'} className="shrink-0 text-xs">
                  {p.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{p.academic_year_start}-{p.academic_year_end}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{p.student_count || 0} étudiant{(p.student_count || 0) > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Resource links */}
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant="outline"
                  className={`text-xs cursor-pointer hover:bg-primary/10 ${p.schedule_id ? 'border-blue-300 text-blue-700' : 'opacity-50'}`}
                  onClick={() => p.schedule_id && navigateToTab('schedules')}
                >
                  <CalendarClock className="w-3 h-3 mr-1" />
                  Emploi du temps
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs cursor-pointer hover:bg-primary/10 ${p.text_book_id ? 'border-emerald-300 text-emerald-700' : 'opacity-50'}`}
                  onClick={() => p.text_book_id && navigateToTab('textbooks')}
                >
                  <BookText className="w-3 h-3 mr-1" />
                  Cahier de texte
                </Badge>
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10 border-amber-300 text-amber-700">
                  <ClipboardCheck className="w-3 h-3 mr-1" />
                  Émargement
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 pt-1 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleToggleActive(p)}
                  data-testid={`toggle-promotion-${p.id}`}
                >
                  {p.is_active ? <ToggleRight className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <ToggleLeft className="w-3.5 h-3.5 mr-1" />}
                  {p.is_active ? 'Désactiver' : 'Activer'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-destructive hover:text-destructive ml-auto"
                  onClick={() => handleDelete(p)}
                  data-testid={`delete-promotion-${p.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PromotionsList;
