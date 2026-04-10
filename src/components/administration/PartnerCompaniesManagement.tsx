import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/hooks/useEstablishment';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import {
  Briefcase, Plus, Search, Phone, Mail, MapPin,
  Users, Pencil, Trash2, Building2, UserCheck,
} from 'lucide-react';

interface Partner {
  id: string;
  company_name: string;
  company_address: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  position: string | null;
  is_activated: boolean;
  created_at: string;
  student_count?: number;
}

interface PartnerForm {
  company_name: string;
  company_address: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
}

const emptyForm: PartnerForm = {
  company_name: '', company_address: '', first_name: '', last_name: '', email: '', phone: '', position: '',
};

const PartnerCompaniesManagement: React.FC = () => {
  const { establishment } = useEstablishment();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [form, setForm] = useState<PartnerForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch tutors (they represent partner companies)
  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['partner-companies', establishment?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('establishment_id', establishment?.id || '')
        .order('company_name', { ascending: true });
      if (error) throw error;

      // Count students per tutor
      const result: Partner[] = [];
      for (const tutor of (data || [])) {
        const { count } = await supabase
          .from('tutor_student_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('tutor_id', tutor.id);
        result.push({ ...tutor, student_count: count || 0 } as Partner);
      }
      return result;
    },
    enabled: !!establishment?.id,
  });

  // Group by company
  const companiesMap = useMemo(() => {
    const map = new Map<string, Partner[]>();
    partners.forEach(p => {
      const key = p.company_name || 'Sans entreprise';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return map;
  }, [partners]);

  const filteredCompanies = useMemo(() => {
    const entries = Array.from(companiesMap.entries());
    if (!searchTerm) return entries;
    const lower = searchTerm.toLowerCase();
    return entries.filter(([name, tutors]) =>
      name.toLowerCase().includes(lower) ||
      tutors.some(t => `${t.first_name} ${t.last_name}`.toLowerCase().includes(lower) || t.email.toLowerCase().includes(lower))
    );
  }, [companiesMap, searchTerm]);

  const createMutation = useMutation({
    mutationFn: async (data: PartnerForm) => {
      const { error } = await supabase.from('tutors').insert({
        establishment_id: establishment?.id,
        ...data,
        is_activated: true,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-companies'] });
      toast.success('Entreprise partenaire ajoutée');
      closeModal();
    },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PartnerForm }) => {
      const { error } = await supabase.from('tutors').update(data as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-companies'] });
      toast.success('Entreprise mise à jour');
      closeModal();
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tutors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-companies'] });
      toast.success('Contact supprimé');
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const openCreate = () => {
    setEditingPartner(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setForm({
      company_name: partner.company_name || '',
      company_address: partner.company_address || '',
      first_name: partner.first_name || '',
      last_name: partner.last_name || '',
      email: partner.email || '',
      phone: partner.phone || '',
      position: partner.position || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPartner(null);
    setForm(emptyForm);
  };

  const handleSubmit = () => {
    if (!form.company_name.trim() || !form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    if (editingPartner) {
      updateMutation.mutate({ id: editingPartner.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const totalTutors = partners.length;
  const totalStudents = partners.reduce((sum, p) => sum + (p.student_count || 0), 0);

  if (isLoading) return <LoadingState message="Chargement des entreprises partenaires..." />;

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="partner-companies-management">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div><p className="text-2xl font-bold">{filteredCompanies.length}</p><p className="text-xs text-muted-foreground">Entreprises</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div><p className="text-2xl font-bold">{totalTutors}</p><p className="text-xs text-muted-foreground">Tuteurs</p></div>
        </CardContent></Card>
        <Card className="col-span-2 sm:col-span-1"><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Users className="h-5 w-5 text-amber-600" />
          </div>
          <div><p className="text-2xl font-bold">{totalStudents}</p><p className="text-xs text-muted-foreground">Apprentis assignés</p></div>
        </CardContent></Card>
      </div>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une entreprise ou un tuteur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="partner-search"
          />
        </div>
        <Button onClick={openCreate} className="gap-2" data-testid="add-partner-btn">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter un tuteur</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </div>

      {/* Companies list */}
      {filteredCompanies.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Aucune entreprise partenaire"
          description="Ajoutez un tuteur pour créer votre première entreprise partenaire."
        />
      ) : (
        <div className="space-y-4">
          {filteredCompanies.map(([companyName, tutors]) => (
            <Card key={companyName} className="overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{companyName}</h3>
                  {tutors[0]?.company_address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{tutors[0].company_address}</span>
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">{tutors.length} tuteur{tutors.length > 1 ? 's' : ''}</Badge>
              </div>
              <CardContent className="p-0 divide-y divide-border">
                {tutors.map((tutor) => (
                  <div key={tutor.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-primary">
                        {tutor.first_name[0]}{tutor.last_name[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{tutor.first_name} {tutor.last_name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {tutor.position && <span>{tutor.position}</span>}
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{tutor.email}</span>
                        {tutor.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{tutor.phone}</span>}
                      </div>
                    </div>
                    {(tutor.student_count || 0) > 0 && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px] flex-shrink-0">
                        {tutor.student_count} apprenti{(tutor.student_count || 0) > 1 ? 's' : ''}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tutor)} data-testid={`edit-partner-${tutor.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(tutor.id)} data-testid={`delete-partner-${tutor.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg" data-testid="partner-modal">
          <DialogHeader>
            <DialogTitle>{editingPartner ? 'Modifier le tuteur' : 'Ajouter un tuteur'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Prénom *</label>
                <Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="Jean" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom *</label>
                <Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Dupont" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jean.dupont@entreprise.fr" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Téléphone</label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="06 12 34 56 78" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Entreprise *</label>
              <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Nom de l'entreprise" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Adresse</label>
              <Input value={form.company_address} onChange={e => setForm(f => ({ ...f, company_address: e.target.value }))} placeholder="Adresse de l'entreprise" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Poste</label>
              <Input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="Directeur technique" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeModal}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="save-partner-btn">
              {editingPartner ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Êtes-vous sûr de vouloir supprimer ce tuteur ? Cette action est irréversible.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending} data-testid="confirm-delete-partner">
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerCompaniesManagement;
