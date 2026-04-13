import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Users, Calendar, BookText, CalendarClock, ClipboardCheck,
  ChevronRight, ChevronLeft, ToggleLeft, ToggleRight, Trash2,
  GraduationCap, LayoutGrid, List, FileSpreadsheet, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { promotionService, Promotion } from '@/services/promotionService';
import { useMyContext } from '@/hooks/useMyContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

// Group promotions by formation
interface FormationGroup {
  formationId: string;
  title: string;
  level: string;
  color: string;
  promotions: Promotion[];
  totalStudents: number;
}

const PromotionsList: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormation, setSelectedFormation] = useState<FormationGroup | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { establishment } = useMyContext();
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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

  useEffect(() => { fetchPromotions(); }, [establishment?.id]);

  // Group by formation
  const formationGroups = useMemo(() => {
    const map = new Map<string, FormationGroup>();
    promotions.forEach(p => {
      const fId = p.formation_id;
      if (!map.has(fId)) {
        map.set(fId, {
          formationId: fId,
          title: p.formations?.title || 'Formation',
          level: p.formations?.level || '',
          color: p.formations?.color || '#6366f1',
          promotions: [],
          totalStudents: 0,
        });
      }
      const g = map.get(fId)!;
      g.promotions.push(p);
      g.totalStudents += p.student_count || 0;
    });
    return Array.from(map.values());
  }, [promotions]);

  // Filter
  const filtered = useMemo(() => {
    if (!searchTerm) return formationGroups;
    const s = searchTerm.toLowerCase();
    return formationGroups.filter(g =>
      g.title.toLowerCase().includes(s) ||
      g.level.toLowerCase().includes(s) ||
      g.promotions.some(p => p.name.toLowerCase().includes(s))
    );
  }, [formationGroups, searchTerm]);

  const filteredPromotions = useMemo(() => {
    if (!selectedFormation || !searchTerm) return selectedFormation?.promotions || [];
    const s = searchTerm.toLowerCase();
    return selectedFormation.promotions.filter(p => p.name.toLowerCase().includes(s));
  }, [selectedFormation, searchTerm]);

  const handleToggleActive = async (p: Promotion) => {
    try {
      await promotionService.togglePromotionActive(p.id, !p.is_active);
      toast.success(p.is_active ? 'Promotion desactivee' : 'Promotion activee');
      fetchPromotions();
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async (p: Promotion) => {
    if (!confirm(`Supprimer la promotion "${p.name}" ?`)) return;
    try {
      await promotionService.deletePromotion(p.id);
      toast.success('Promotion supprimee');
      fetchPromotions();
      if (selectedFormation) {
        const updated = selectedFormation.promotions.filter(pr => pr.id !== p.id);
        if (updated.length === 0) setSelectedFormation(null);
        else setSelectedFormation({ ...selectedFormation, promotions: updated });
      }
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  // Shortcut navigation
  const goToParticipants = (formationId: string) => navigate(`/administration?tab=users&formation=${formationId}`);
  const goToTextBook = () => setSearchParams({ tab: 'textbooks' });
  const goToSchedule = () => setSearchParams({ tab: 'schedules' });
  const goToEmargement = () => navigate('/suivi-emargement-admin');
  const goToNotes = () => navigate('/notes-admin');
  const goToFormations = () => setSearchParams({ tab: 'formations' });

  if (loading) return <LoadingState message="Chargement des promotions..." />;

  if (formationGroups.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Aucune promotion"
        description="Les promotions sont creees automatiquement lors de la creation d'une formation."
        action={
          <Button onClick={goToFormations} data-testid="go-to-formations-btn">
            Creer une formation <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        }
      />
    );
  }

  // === DETAIL VIEW: Selected formation ===
  if (selectedFormation) {
    const promos = filteredPromotions;
    return (
      <div className="space-y-4" data-testid="promotion-detail-view">
        {/* Back + Title */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedFormation(null); setSearchTerm(''); }} className="h-9 w-9" data-testid="back-to-formations">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedFormation.color }} />
              <h2 className="text-lg font-semibold truncate">{selectedFormation.title}</h2>
              <Badge variant="secondary" className="text-xs">{selectedFormation.level}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{promos.length} promotion{promos.length > 1 ? 's' : ''}</p>
          </div>
          {/* View mode + Search */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex bg-muted rounded-lg p-0.5">
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('grid')} data-testid="view-grid">
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('list')} data-testid="view-list">
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher..."
                className="pl-8 pr-3 py-1.5 w-48 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
        </div>

        {/* Promotions grid/list */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {promos.map(p => (
              <PromotionCard key={p.id} promotion={p} color={selectedFormation.color}
                onToggle={() => handleToggleActive(p)} onDelete={() => handleDelete(p)}
                onParticipants={() => goToParticipants(p.formation_id)} onTextBook={goToTextBook}
                onSchedule={goToSchedule} onEmargement={goToEmargement} onNotes={goToNotes} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {promos.map(p => (
              <PromotionRow key={p.id} promotion={p} color={selectedFormation.color}
                onToggle={() => handleToggleActive(p)} onDelete={() => handleDelete(p)}
                onParticipants={() => goToParticipants(p.formation_id)} onTextBook={goToTextBook}
                onSchedule={goToSchedule} onEmargement={goToEmargement} onNotes={goToNotes} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // === FORMATIONS LIST ===
  return (
    <div className="space-y-4" data-testid="promotions-list">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher une formation..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            data-testid="search-promotions" />
        </div>
        <Badge variant="secondary" className="shrink-0">{filtered.length} formation{filtered.length > 1 ? 's' : ''}</Badge>
        <div className="flex bg-muted rounded-lg p-0.5">
          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('grid')}>
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('list')}>
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Formations grid/list */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(g => (
            <Card key={g.formationId} className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => { setSelectedFormation(g); setSearchTerm(''); }} data-testid={`formation-group-${g.formationId}`}>
              <div className="h-1.5" style={{ backgroundColor: g.color }} />
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">{g.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{g.level}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" />
                    <span>{g.promotions.length} promotion{g.promotions.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{g.totalStudents} etudiant{g.totalStudents > 1 ? 's' : ''}</span>
                  </div>
                </div>
                {/* Mini chips for active promotions */}
                <div className="flex flex-wrap gap-1">
                  {g.promotions.slice(0, 3).map(p => (
                    <Badge key={p.id} variant={p.is_active ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                      {p.academic_year_start}-{p.academic_year_end}
                    </Badge>
                  ))}
                  {g.promotions.length > 3 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{g.promotions.length - 3}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(g => (
            <div key={g.formationId} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors group"
              onClick={() => { setSelectedFormation(g); setSearchTerm(''); }} data-testid={`formation-group-${g.formationId}`}>
              <div className="w-2 h-10 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{g.title}</h3>
                <p className="text-xs text-muted-foreground">{g.level}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {g.promotions.length}</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {g.totalStudents}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// === PROMOTION CARD (Grid view) ===
const PromotionCard: React.FC<{
  promotion: Promotion; color: string;
  onToggle: () => void; onDelete: () => void;
  onParticipants: () => void; onTextBook: () => void; onSchedule: () => void;
  onEmargement: () => void; onNotes: () => void;
}> = ({ promotion: p, color, onToggle, onDelete, onParticipants, onTextBook, onSchedule, onEmargement, onNotes }) => (
  <Card className="overflow-hidden hover:shadow-md transition-shadow" data-testid={`promotion-card-${p.id}`}>
    <div className="h-1" style={{ backgroundColor: color }} />
    <CardContent className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate">{p.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {p.academic_year_start}-{p.academic_year_end}
          </p>
        </div>
        <Badge variant={p.is_active ? 'default' : 'secondary'} className="shrink-0 text-[10px]">
          {p.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {p.student_count || 0} etudiant{(p.student_count || 0) > 1 ? 's' : ''}</span>
        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {p.academic_year_start}-{p.academic_year_end}</span>
      </div>

      {/* Shortcut buttons */}
      <div className="grid grid-cols-3 gap-1.5">
        <ShortcutBtn icon={Users} label="Participants" onClick={onParticipants} color="text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50" testId={`participants-${p.id}`} />
        <ShortcutBtn icon={CalendarClock} label="Emploi du temps" onClick={onSchedule} color="text-violet-600 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-950/50" testId={`schedule-${p.id}`} />
        <ShortcutBtn icon={BookText} label="Cahier de texte" onClick={onTextBook} color="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50" testId={`textbook-${p.id}`} />
        <ShortcutBtn icon={ClipboardCheck} label="Emargement" onClick={onEmargement} color="text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50" testId={`emargement-${p.id}`} />
        <ShortcutBtn icon={FileSpreadsheet} label="Notes" onClick={onNotes} color="text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50" testId={`notes-${p.id}`} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-2 border-t border-border/50">
        <Button variant="ghost" size="sm" className="text-xs h-7 flex-1" onClick={onToggle} data-testid={`toggle-${p.id}`}>
          {p.is_active ? <ToggleRight className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <ToggleLeft className="w-3.5 h-3.5 mr-1" />}
          {p.is_active ? 'Desactiver' : 'Activer'}
        </Button>
        <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive hover:text-destructive" onClick={onDelete} data-testid={`delete-${p.id}`}>
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Supprimer
        </Button>
      </div>
    </CardContent>
  </Card>
);

// === PROMOTION ROW (List view) ===
const PromotionRow: React.FC<{
  promotion: Promotion; color: string;
  onToggle: () => void; onDelete: () => void;
  onParticipants: () => void; onTextBook: () => void; onSchedule: () => void;
  onEmargement: () => void; onNotes: () => void;
}> = ({ promotion: p, color, onToggle, onDelete, onParticipants, onTextBook, onSchedule, onEmargement, onNotes }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors" data-testid={`promotion-row-${p.id}`}>
    <div className="w-1.5 h-12 rounded-full shrink-0" style={{ backgroundColor: color }} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="font-medium text-sm truncate">{p.name}</h3>
        <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">{p.is_active ? 'Active' : 'Inactive'}</Badge>
      </div>
      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
        <span>{p.academic_year_start}-{p.academic_year_end}</span>
        <span>{p.student_count || 0} etudiant{(p.student_count || 0) > 1 ? 's' : ''}</span>
      </div>
    </div>
    {/* Shortcut icons */}
    <div className="flex items-center gap-0.5 shrink-0">
      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={onParticipants} title="Participants"><Users className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-violet-600" onClick={onSchedule} title="Emploi du temps"><CalendarClock className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={onTextBook} title="Cahier de texte"><BookText className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" onClick={onEmargement} title="Emargement"><ClipboardCheck className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={onNotes} title="Notes"><FileSpreadsheet className="h-4 w-4" /></Button>
    </div>
    {/* Actions */}
    <div className="flex items-center gap-0.5 shrink-0 border-l border-border pl-2">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle}>
        {p.is_active ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

// === SHORTCUT BUTTON ===
const ShortcutBtn: React.FC<{ icon: any; label: string; onClick: () => void; color: string; testId: string }> = ({ icon: Icon, label, onClick, color, testId }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-colors ${color}`} data-testid={testId}>
    <Icon className="h-4 w-4" />
    <span className="text-[10px] font-medium leading-tight">{label}</span>
  </button>
);

export default PromotionsList;
