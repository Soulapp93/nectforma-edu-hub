import React from 'react';
import { X, User, Mail, Phone, Building, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { User as UserType } from '@/services/userService';
import { useUserFormations } from '@/hooks/useUserFormations';
import { useUserTutors } from '@/hooks/useUserTutors';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ isOpen, onClose, user }) => {
  const { getUserFormations } = useUserFormations();
  const { getUserTutors } = useUserTutors();

  if (!user) return null;

  const userFormations = getUserFormations(user.id!);
  const userTutors = getUserTutors(user.id!);

  const getRoleBadge = (role: string) => {
    const roleClasses = {
      'Admin': 'bg-hsl(var(--primary)) text-primary-foreground',
      'Formateur': 'bg-hsl(var(--info)) text-info-foreground',
      'Étudiant': 'bg-hsl(var(--muted)) text-muted-foreground'
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${roleClasses[role as keyof typeof roleClasses] || 'bg-hsl(var(--muted)) text-muted-foreground'}`}>
        {role}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'Actif': 'bg-hsl(var(--success)) text-success-foreground',
      'Inactif': 'bg-hsl(var(--destructive)) text-destructive-foreground',
      'En attente': 'bg-hsl(var(--warning)) text-warning-foreground'
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-hsl(var(--muted)) text-muted-foreground'}`}>
        {status}
      </span>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
              {user.profile_photo_url ? (
                <img 
                  src={user.profile_photo_url} 
                  alt={`Photo de profil de ${user.first_name} ${user.last_name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold text-primary">
                  {user.first_name[0]}{user.last_name[0]}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {user.first_name} {user.last_name}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                {getRoleBadge(user.role)}
                {getStatusBadge(user.status)}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          {/* Informations personnelles */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{user.email}</span>
                </div>
              </div>
              {user.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{user.phone}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date de création</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Formations */}
          {userFormations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Formations ({userFormations.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userFormations.map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="font-semibold text-foreground">{assignment.formation.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{assignment.formation.level}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Inscrit le {new Date(assignment.assigned_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tuteurs (pour les étudiants) */}
          {user.role === 'Étudiant' && userTutors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Building className="h-5 w-5" />
                Tuteurs en entreprise ({userTutors.length})
              </h3>
              <div className="space-y-4">
                {userTutors.map((tutor, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-muted/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {tutor.tutor_first_name} {tutor.tutor_last_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{tutor.tutor_email}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{tutor.company_name}</span>
                        </div>
                        {tutor.position && (
                          <p className="text-sm text-muted-foreground">{tutor.position}</p>
                        )}
                      </div>
                    </div>
                    {tutor.contract_type && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Type de contrat:</span>
                            <p className="text-foreground">{tutor.contract_type}</p>
                          </div>
                          {tutor.contract_start_date && (
                            <div>
                              <span className="font-medium text-muted-foreground">Début:</span>
                              <p className="text-foreground">
                                {new Date(tutor.contract_start_date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          )}
                          {tutor.contract_end_date && (
                            <div>
                              <span className="font-medium text-muted-foreground">Fin:</span>
                              <p className="text-foreground">
                                {new Date(tutor.contract_end_date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;