import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { Archive, Search, Calendar, GraduationCap, ChevronRight, BookText, ClipboardCheck, CalendarDays, Award, FolderOpen, Users, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { archiveService, PromotionArchive, ArchiveSnapshot, archiveModuleLabels, ArchiveModuleType } from '@/services/archiveService';
import { useEstablishment } from '@/hooks/useEstablishment';

const moduleIcons: Record<ArchiveModuleType, React.ReactNode> = {
  formation: <GraduationCap className="h-4 w-4" />,
  promotion: <Users className="h-4 w-4" />,
  dossier_etudiant: <FolderOpen className="h-4 w-4" />,
  cahier_texte: <BookText className="h-4 w-4" />,
  emargement: <ClipboardCheck className="h-4 w-4" />,
  emploi_temps: <CalendarDays className="h-4 w-4" />,
  notes: <Award className="h-4 w-4" />,
};

const ArchivesManagement: React.FC = () => {
  const { establishment } = useEstablishment();
  const [archives, setArchives] = useState<PromotionArchive[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<PromotionArchive | null>(null);
  const [snapshots, setSnapshots] = useState<ArchiveSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');

  // Archive modal state
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [formations, setFormations] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [archiveFormation, setArchiveFormation] = useState('');
  const [archivePromotion, setArchivePromotion] = useState('');
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (establishment?.id) {
      loadArchives();
      loadFormations();
    }
  }, [establishment?.id]);

  const loadArchives = async () => {
    if (!establishment?.id) return;
    setLoading(true);
    try {
      const data = await archiveService.getArchives(establishment.id);
      setArchives(data);
    } catch (err) {
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFormations = async () => {
    if (!establishment?.id) return;
    const { data } = await supabase.from('formations').select('id, title').eq('establishment_id', establishment.id);
    setFormations(data || []);
  };

  const loadPromotions = async (formationId: string) => {
    const { data } = await supabase.from('promotions').select('id, name, academic_year_start, academic_year_end').eq('formation_id', formationId);
    setPromotions(data || []);
  };

  const loadSnapshots = async (archive: PromotionArchive) => {
    setSelectedArchive(archive);
    try {
      const data = await archiveService.getSnapshots(archive.id);
      setSnapshots(data);
    } catch (err) {
      logger.error(err);
    }
  };

  const handleArchive = async () => {
    if (!archiveFormation || !archivePromotion || !establishment?.id) {
      toast.error('Veuillez sélectionner une formation et une promotion');
      return;
    }
    setArchiving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');

      const promo = promotions.find(p => p.id === archivePromotion);
      const academicYear = promo ? `${promo.academic_year_start}-${promo.academic_year_end}` : '';

      await archiveService.collectAndArchive({
        promotionId: archivePromotion,
        formationId: archiveFormation,
        establishmentId: establishment.id,
        archivedBy: session.user.id,
        academicYear,
      });

      toast.success('Promotion archivée avec succès');
      setShowArchiveModal(false);
      loadArchives();
    } catch (err) {
      logger.error(err);
      toast.error('Erreur lors de l\'archivage');
    } finally {
      setArchiving(false);
    }
  };

  const uniqueYears = [...new Set(archives.map(a => a.academic_year).filter(Boolean))];

  const filteredArchives = archives.filter(a => {
    const matchSearch = searchTerm === '' || JSON.stringify(a).toLowerCase().includes(searchTerm.toLowerCase());
    const matchYear = yearFilter === 'all' || a.academic_year === yearFilter;
    return matchSearch && matchYear;
  });

  const renderSnapshotData = (snapshot: ArchiveSnapshot) => {
    const data = snapshot.snapshot_data;
    if (!data) return <p className="text-muted-foreground text-sm">Aucune donnée</p>;

    return (
      <div className="bg-muted/30 rounded-lg p-4 max-h-96 overflow-y-auto">
        <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher dans les archives..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les années</SelectItem>
              {uniqueYears.map(y => (
                <SelectItem key={y} value={y!}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowArchiveModal(true)} className="gap-2">
          <Archive className="h-4 w-4" /> Archiver une promotion
        </Button>
      </div>

      {/* Contenu */}
      {selectedArchive ? (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedArchive(null); setSnapshots([]); }} className="gap-2">
            ← Retour aux archives
          </Button>
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Archive — {selectedArchive.academic_year}</h3>
                <p className="text-sm text-muted-foreground">
                  Archivé le {new Date(selectedArchive.archived_at).toLocaleDateString('fr-FR')} • {(selectedArchive.archive_metadata as any)?.student_count || 0} étudiants
                </p>
              </div>
            </div>

            <Tabs defaultValue={snapshots[0]?.module_type || 'formation'}>
              <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-lg">
                {snapshots.map(s => (
                  <TabsTrigger key={s.module_type} value={s.module_type} className="gap-1.5 text-xs">
                    {moduleIcons[s.module_type]}
                    {archiveModuleLabels[s.module_type]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {snapshots.map(s => (
                <TabsContent key={s.module_type} value={s.module_type}>
                  {renderSnapshotData(s)}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Chargement des archives...</div>
          ) : filteredArchives.length === 0 ? (
            <div className="text-center py-16">
              <Archive className="h-16 w-16 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-lg font-medium text-muted-foreground">Aucune archive</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Archivez une promotion terminée pour conserver ses données</p>
            </div>
          ) : (
            filteredArchives.map(archive => (
              <div
                key={archive.id}
                onClick={() => loadSnapshots(archive)}
                className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Archive className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">Année {archive.academic_year}</p>
                  <p className="text-sm text-muted-foreground">
                    {(archive.archive_metadata as any)?.student_count || 0} étudiants • {(archive.archive_metadata as any)?.modules_count || 0} modules
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                    Archivé
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Archive Modal */}
      <Dialog open={showArchiveModal} onOpenChange={setShowArchiveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archiver une promotion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Formation</Label>
              <Select value={archiveFormation} onValueChange={v => { setArchiveFormation(v); loadPromotions(v); setArchivePromotion(''); }}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une formation" /></SelectTrigger>
                <SelectContent>
                  {formations.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Promotion</Label>
              <Select value={archivePromotion} onValueChange={setArchivePromotion} disabled={!archiveFormation}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une promotion" /></SelectTrigger>
                <SelectContent>
                  {promotions.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.academic_year_start}-{p.academic_year_end})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                ⚠️ L'archivage va capturer un instantané complet de toutes les données de cette promotion (formations, notes, émargement, etc.). Les données originales ne seront pas supprimées.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveModal(false)}>Annuler</Button>
            <Button onClick={handleArchive} disabled={archiving} className="gap-2">
              <Archive className="h-4 w-4" />
              {archiving ? 'Archivage...' : 'Archiver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArchivesManagement;
