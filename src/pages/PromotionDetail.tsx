import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Clock, BookOpen, GraduationCap, UserPlus, UserMinus, Search } from 'lucide-react';
import { promotionService, Promotion } from '@/services/promotionService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUsers } from '@/hooks/useUsers';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Student {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_photo_url: string;
}

const PromotionDetail = () => {
  const { promotionId } = useParams<{ promotionId: string }>();
  const navigate = useNavigate();
  const { userRole } = useCurrentUser();
  const { users } = useUsers();
  
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';

  const fetchData = async () => {
    if (!promotionId) return;
    try {
      setLoading(true);
      const [promoData, studentsData] = await Promise.all([
        promotionService.getPromotionById(promotionId),
        promotionService.getPromotionStudents(promotionId)
      ]);
      setPromotion(promoData);
      setStudents(studentsData as Student[]);
    } catch (err) {
      console.error('Erreur:', err);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [promotionId]);

  const handleAddStudent = async () => {
    if (!selectedStudentId || !promotionId) return;
    try {
      setAddingStudent(true);
      await promotionService.assignStudentToPromotion(selectedStudentId, promotionId);
      toast.success('Étudiant inscrit dans la promotion');
      setShowAddStudentModal(false);
      setSelectedStudentId('');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!promotionId || !confirm(`Retirer ${studentName} de cette promotion ?`)) return;
    try {
      await promotionService.removeStudentFromPromotion(studentId, promotionId);
      toast.success('Étudiant retiré');
      fetchData();
    } catch (err) {
      toast.error('Erreur lors du retrait');
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><div className="text-lg">Chargement...</div></div>;
  }

  if (!promotion) {
    return (
      <div className="p-8">
        <div className="text-destructive">Promotion non trouvée</div>
        <Button onClick={() => navigate(-1)} className="mt-4">Retour</Button>
      </div>
    );
  }

  const formation = promotion.formation as any;
  const formationColor = formation?.color || '#8B5CF6';

  // Available students (not already in this promotion)
  const enrolledStudentIds = new Set(students.map(s => s.user_id));
  const availableStudents = users.filter(u => u.role === 'Étudiant' && !enrolledStudentIds.has(u.id));

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Back */}
      <div className="bg-card/80 backdrop-blur-md border-b border-primary/10 px-8 py-4 shadow-sm">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/formations/${promotion.formation_id}`)}
          className="flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à {formation?.title || 'la formation'}
        </Button>
      </div>

      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="rounded-xl p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden" style={{ backgroundColor: formationColor }}>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                  {formation?.level}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                  {promotion.academic_year}
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 break-words">{promotion.name}</h1>
              <p className="text-white/80 text-sm mb-3">{formation?.title}</p>
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{new Date(promotion.start_date).toLocaleDateString('fr-FR')} - {new Date(promotion.end_date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{students.length} / {promotion.capacity} étudiants</span>
                </div>
              </div>
            </div>
            {isAdmin && (
              <Button 
                variant="secondary" 
                onClick={() => setShowAddStudentModal(true)}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs sm:text-sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Inscrire un étudiant
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Students list */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-lg border border-primary/10">
          <div className="p-4 sm:p-6 border-b border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Étudiants de la promotion ({students.length})
              </h2>
            </div>
            {students.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un étudiant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </div>
          
          <div className="p-4 sm:p-6">
            {students.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block p-6 rounded-2xl bg-muted/30 mb-4">
                  <GraduationCap className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Aucun étudiant inscrit</h3>
                <p className="text-muted-foreground mb-4">Inscrivez des étudiants dans cette promotion.</p>
                {isAdmin && (
                  <Button onClick={() => setShowAddStudentModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Inscrire un étudiant
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map((student) => (
                  <div
                    key={student.user_id}
                    className="flex items-center justify-between p-3 rounded-xl border border-primary/10 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {student.first_name?.[0]}{student.last_name?.[0]}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{student.first_name} {student.last_name}</div>
                        <div className="text-sm text-muted-foreground">{student.email}</div>
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStudent(student.user_id, `${student.first_name} ${student.last_name}`)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      <Dialog open={showAddStudentModal} onOpenChange={setShowAddStudentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Inscrire un étudiant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Étudiant</label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un étudiant" />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} — {s.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddStudentModal(false)}>Annuler</Button>
              <Button onClick={handleAddStudent} disabled={!selectedStudentId || addingStudent}>
                {addingStudent ? 'Inscription...' : 'Inscrire'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromotionDetail;
