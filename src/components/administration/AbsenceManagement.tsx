import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Clock, CheckCircle, XCircle, Eye, Loader2, AlertTriangle } from 'lucide-react';
import { absenceJustificationService, AbsenceJustification } from '@/services/absenceJustificationService';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import AbsenceReviewModal from '@/components/emargement/AbsenceReviewModal';
import { toast } from 'sonner';

interface EnrichedJustification extends AbsenceJustification {
  userName?: string;
  userRole?: string;
  absenceDate?: string;
  absenceTitle?: string;
  formationTitle?: string;
}

const AbsenceManagement: React.FC = () => {
  const { userId } = useCurrentUser();
  const [justifications, setJustifications] = useState<EnrichedJustification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; signatureId: string }>({ isOpen: false, signatureId: '' });

  useEffect(() => {
    loadJustifications();
  }, []);

  const loadJustifications = async () => {
    try {
      setLoading(true);
      
      // Fetch all justifications (admin sees all)
      const { data, error } = await supabase
        .from('absence_justifications' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const justifs = (data || []) as unknown as AbsenceJustification[];
      
      // Enrich with user and absence info
      const enriched: EnrichedJustification[] = [];
      
      for (const justif of justifs) {
        // Get signature details
        const { data: sig } = await supabase
          .from('attendance_signatures')
          .select(`
            user_id,
            attendance_sheets(
              title, date,
              formations:formation_id(title)
            )
          `)
          .eq('id', justif.signature_id)
          .single();

        // Get user info
        const { data: user } = await supabase
          .from('users')
          .select('first_name, last_name, role')
          .eq('id', justif.user_id)
          .single();

        enriched.push({
          ...justif,
          userName: user ? `${user.first_name} ${user.last_name}` : 'Inconnu',
          userRole: user?.role || '',
          absenceDate: (sig?.attendance_sheets as any)?.date,
          absenceTitle: (sig?.attendance_sheets as any)?.title,
          formationTitle: ((sig?.attendance_sheets as any)?.formations as any)?.title
        });
      }

      setJustifications(enriched);
    } catch (error) {
      console.error('Error loading justifications:', error);
      toast.error('Erreur lors du chargement des justificatifs');
    } finally {
      setLoading(false);
    }
  };

  const filteredJustifications = justifications.filter(j => {
    if (activeTab === 'pending') return j.status === 'pending';
    if (activeTab === 'validated') return j.status === 'validated';
    if (activeTab === 'rejected') return j.status === 'rejected';
    return true;
  });

  const pendingCount = justifications.filter(j => j.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      pending: { label: 'En attente', icon: <Clock className="h-3 w-3" />, className: 'bg-amber-100 text-amber-800 border-amber-200' },
      validated: { label: 'Validé', icon: <CheckCircle className="h-3 w-3" />, className: 'bg-green-100 text-green-800 border-green-200' },
      rejected: { label: 'Rejeté', icon: <XCircle className="h-3 w-3" />, className: 'bg-red-100 text-red-800 border-red-200' }
    };
    const info = map[status] || map.pending;
    return (
      <Badge variant="secondary" className={`${info.className} flex items-center gap-1`}>
        {info.icon}
        {info.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Gestion des absences
          </h2>
          <p className="text-sm text-muted-foreground">
            Gérez les justificatifs d'absence des étudiants et formateurs
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-destructive text-destructive-foreground text-sm px-3 py-1">
            {pendingCount} à traiter
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            En attente
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="validated" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Validés
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejetés
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <FileText className="h-4 w-4" />
            Tous
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader className="border-b border-border/30">
              <CardTitle className="text-lg">Justificatifs d'absence</CardTitle>
              <CardDescription>
                {filteredJustifications.length} justificatif{filteredJustifications.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Date d'absence</TableHead>
                      <TableHead>Cours</TableHead>
                      <TableHead>Formation</TableHead>
                      <TableHead>Fichier</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJustifications.map((justif) => (
                      <TableRow key={justif.id}>
                        <TableCell className="font-medium">{justif.userName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{justif.userRole}</Badge>
                        </TableCell>
                        <TableCell>
                          {justif.absenceDate
                            ? new Date(justif.absenceDate).toLocaleDateString('fr-FR')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm">{justif.absenceTitle || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/5 text-xs">
                            {justif.formationTitle || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => window.open(justif.file_url, '_blank')}
                          >
                            <FileText className="h-3 w-3" />
                            {justif.file_name?.substring(0, 15)}...
                          </Button>
                        </TableCell>
                        <TableCell>{getStatusBadge(justif.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => setReviewModal({ isOpen: true, signatureId: justif.signature_id })}
                          >
                            <Eye className="h-3 w-3" />
                            Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredJustifications.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground">Aucun justificatif dans cette catégorie</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      <AbsenceReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ isOpen: false, signatureId: '' })}
        signatureId={reviewModal.signatureId}
        adminUserId={userId || ''}
        onReviewed={loadJustifications}
      />
    </div>
  );
};

export default AbsenceManagement;
