import React, { useState } from 'react';
import { Plus, Search, Filter, Upload, Download, MoreVertical, Edit, Trash2, Mail, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LoadingState } from '@/components/ui/loading-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { RoleBadge } from '@/components/ui/role-badge';
import { useUsers } from '@/hooks/useUsers';
import { useUserFormations } from '@/hooks/useUserFormations';
import { useUserTutors } from '@/hooks/useUserTutors';
import { User, CreateUserData } from '@/services/userService';
import SimplifiedUserModal from './SimplifiedUserModal';
import UserDetailModal from './UserDetailModal';
import ExcelImport from './ExcelImport';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const EnhancedUsersList: React.FC = () => {
  const { users, loading, error, createUser, updateUser, deleteUser, bulkCreateUsers } = useUsers();
  const { getUserFormations } = useUserFormations();
  const { getUserTutors } = useUserTutors();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isStudentExcelImportOpen, setIsStudentExcelImportOpen] = useState(false);
  const [isInstructorExcelImportOpen, setIsInstructorExcelImportOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [preselectedRole, setPreselectedRole] = useState<'Admin' | 'Formateur' | 'Étudiant' | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === '' || user.role === selectedRole;
    const matchesStatus = selectedStatus === '' || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = (role?: 'Admin' | 'Formateur' | 'Étudiant') => {
    setSelectedUser(null);
    setModalMode('create');
    setPreselectedRole(role || null);
    setIsUserModalOpen(true);
  };

  const handleCreateInstructor = () => {
    handleCreateUser('Formateur');
  };

  const handleCreateAdmin = () => {
    handleCreateUser('Admin');
  };

  const handleCreateStudent = () => {
    handleCreateUser('Étudiant');
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setModalMode('edit');
    setPreselectedRole(null);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      await deleteUser(userId);
    }
  };

  const handleSaveUser = async (userData: CreateUserData, formationIds: string[], tutorData?: any) => {
    if (modalMode === 'create') {
      return await createUser(userData, formationIds, tutorData);
    } else if (selectedUser) {
      return await updateUser(selectedUser.id!, userData);
    }
    throw new Error('Mode invalide');
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsUserDetailModalOpen(true);
  };

  const handleExcelImport = async (usersData: CreateUserData[], formationIds?: string[]) => {
    await bulkCreateUsers(usersData);
  };

  const exportUsers = () => {
    const exportData = filteredUsers.map(user => {
      const userFormations = getUserFormations(user.id!);
      const formationsText = userFormations.map(assignment => 
        `${assignment.formation.title} (${assignment.formation.level})`
      ).join(', ');

      return {
        'Prénom': user.first_name,
        'Nom': user.last_name,
        'Email': user.email,
        'Rôle': user.role,
        'Formations': formationsText,
        'Statut': user.status,
        'Date de création': user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');
    
    const filename = `utilisateurs_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const sendInvitation = (email: string) => {
    console.log(`Renvoyer l'invitation à ${email}`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id!));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleCancelSelection = () => {
    setSelectedUsers([]);
    setBulkAction('');
  };

  const handleApplyBulkAction = async () => {
    if (!bulkAction) {
      toast.error('Veuillez choisir une action');
      return;
    }

    const selectedUserData = users.filter(user => selectedUsers.includes(user.id!));

    switch (bulkAction) {
      case 'activate':
        // Logique pour activer les utilisateurs
        for (const user of selectedUserData) {
          await updateUser(user.id!, { ...user, status: 'Actif' as any });
        }
        toast.success(`${selectedUsers.length} utilisateur(s) activé(s)`);
        break;
      
      case 'deactivate':
        // Logique pour désactiver les utilisateurs
        for (const user of selectedUserData) {
          await updateUser(user.id!, { ...user, status: 'Inactif' as any });
        }
        toast.success(`${selectedUsers.length} utilisateur(s) désactivé(s)`);
        break;
      
      case 'change-role':
        toast.info('Fonctionnalité de modification de rôle en cours de développement');
        break;
      
      case 'send-email':
        toast.info('Fonctionnalité d\'envoi d\'email en cours de développement');
        break;
      
      case 'export':
        const exportData = selectedUserData.map(user => {
          const userFormations = getUserFormations(user.id!);
          const formationsText = userFormations.map(assignment => 
            `${assignment.formation.title} (${assignment.formation.level})`
          ).join(', ');

          return {
            'Prénom': user.first_name,
            'Nom': user.last_name,
            'Email': user.email,
            'Rôle': user.role,
            'Formations': formationsText,
            'Statut': user.status,
            'Date de création': user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : ''
          };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs sélectionnés');
        
        const filename = `selection_utilisateurs_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
        toast.success('Export réalisé avec succès');
        break;
      
      case 'delete':
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedUsers.length} utilisateur(s) ?`)) {
          for (const userId of selectedUsers) {
            await deleteUser(userId);
          }
          toast.success(`${selectedUsers.length} utilisateur(s) supprimé(s)`);
        }
        break;
    }

    handleCancelSelection();
  };

  if (loading && users.length === 0) {
    return <LoadingState message="Chargement des utilisateurs..." />;
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-8">
        <div className="text-center">
          <div className="text-destructive mb-2">Erreur</div>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const isAllSelected = filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length;
  const isSomeSelected = selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length;

  return (
    <div className="glass-card rounded-xl">
      {/* Bandeau de sélection */}
      {selectedUsers.length > 0 && (
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <Checkbox 
                  checked={true}
                  className="border-white data-[state=checked]:bg-white data-[state=checked]:text-primary"
                />
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''} sélectionné{selectedUsers.length > 1 ? 's' : ''}
                </div>
                <div className="text-sm text-muted-foreground">
                  Choisissez une action à appliquer à la sélection
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[200px] justify-between">
                    {bulkAction === 'activate' && 'Activer les utilisateurs'}
                    {bulkAction === 'deactivate' && 'Désactiver les utilisateurs'}
                    {bulkAction === 'change-role' && 'Modifier le rôle'}
                    {bulkAction === 'send-email' && 'Envoyer un email'}
                    {bulkAction === 'export' && 'Exporter la sélection'}
                    {bulkAction === 'delete' && 'Supprimer les utilisateurs'}
                    {!bulkAction && 'Choisir une action'}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem onClick={() => setBulkAction('activate')}>
                    Activer les utilisateurs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkAction('deactivate')}>
                    Désactiver les utilisateurs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkAction('change-role')}>
                    Modifier le rôle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkAction('send-email')}>
                    Envoyer un email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkAction('export')}>
                    Exporter la sélection
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setBulkAction('delete')}
                    className="text-destructive focus:text-destructive"
                  >
                    Supprimer les utilisateurs
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button onClick={handleApplyBulkAction} variant="default">
                Appliquer
              </Button>
              
              <Button onClick={handleCancelSelection} variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Gestion des utilisateurs
            </h2>
            <p className="text-muted-foreground mt-1">
              {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={exportUsers}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Button
              onClick={() => setIsInstructorExcelImportOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Importer Formateurs
            </Button>
            <Button
              onClick={() => setIsStudentExcelImportOpen(true)}
              variant="success"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Importer Étudiants
            </Button>
            <Button
              onClick={handleCreateAdmin}
              variant="elegant"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter un Administrateur
            </Button>
            <Button
              onClick={handleCreateInstructor}
              variant="info"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter un Formateur
            </Button>
            <Button
              onClick={handleCreateStudent}
              variant="premium"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter un Étudiant
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col lg:flex-row gap-4 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Tous les rôles</option>
              <option value="Admin">Administrateur</option>
              <option value="Formateur">Formateur</option>
              <option value="Étudiant">Étudiant</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Tous les statuts</option>
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
              <option value="En attente">En attente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Sélectionner tous les utilisateurs"
                  className={isSomeSelected ? "data-[state=checked]:bg-primary/50" : ""}
                />
              </TableHead>
              <TableHead>Nom & Prénom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Formations</TableHead>
              <TableHead>Tuteurs</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {filteredUsers.map((user) => {
              const userFormations = getUserFormations(user.id!);
              const userTutorsList = getUserTutors(user.id!);
              const isSelected = selectedUsers.includes(user.id!);
              
              return (
                <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectUser(user.id!, checked as boolean)}
                      aria-label={`Sélectionner ${user.first_name} ${user.last_name}`}
                    />
                  </TableCell>
                  <TableCell onClick={() => handleViewUser(user)}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                        {user.profile_photo_url ? (
                          <img 
                            src={user.profile_photo_url} 
                            alt={`Photo de profil de ${user.first_name} ${user.last_name}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-primary">
                            {user.first_name[0]}{user.last_name[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {user.first_name} {user.last_name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell onClick={() => handleViewUser(user)}>
                    <div className="text-sm text-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell onClick={() => handleViewUser(user)}>
                    {<RoleBadge role={user.role} />}
                  </TableCell>
                  <TableCell onClick={() => handleViewUser(user)}>
                    <div className="max-w-xs">
                      {user.role === 'Admin' ? (
                        <span className="text-xs text-muted-foreground">-</span>
                      ) : userFormations.length > 0 ? (
                        <div className="space-y-1">
                          {userFormations.slice(0, 2).map((assignment) => (
                            <div key={assignment.id} className="text-xs bg-info/10 text-info px-2 py-1 rounded-full inline-block mr-1">
                              {assignment.formation.title}
                            </div>
                          ))}
                          {userFormations.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{userFormations.length - 2} autre{userFormations.length - 2 > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Aucune formation</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell onClick={() => handleViewUser(user)}>
                    <div className="max-w-xs">
                      {user.role === 'Étudiant' && userTutorsList.length > 0 ? (
                        <div className="space-y-1">
                          {userTutorsList.slice(0, 2).map((tutor, index) => (
                            <div key={index} className="text-xs bg-secondary/10 text-secondary-foreground px-2 py-1 rounded-full inline-block mr-1">
                              {tutor.tutor_first_name} {tutor.tutor_last_name}
                            </div>
                          ))}
                          {userTutorsList.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{userTutorsList.length - 2} autre{userTutorsList.length - 2 > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {user.role === 'Étudiant' ? 'Aucun tuteur' : '-'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell onClick={() => handleViewUser(user)}>
                    {<StatusBadge status={user.status} type="user" />}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {user.status === 'En attente' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendInvitation(user.email)}
                          className="h-8 w-8 p-0"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUser(user)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(user.id!)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Aucun utilisateur trouvé</div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SimplifiedUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        user={selectedUser}
        mode={modalMode}
        preselectedRole={preselectedRole}
      />

      <UserDetailModal
        isOpen={isUserDetailModalOpen}
        onClose={() => setIsUserDetailModalOpen(false)}
        user={selectedUser}
      />

      {isExcelImportOpen && (
        <ExcelImport
          onImport={handleExcelImport}
          onClose={() => setIsExcelImportOpen(false)}
        />
      )}

      {isInstructorExcelImportOpen && (
        <ExcelImport
          onImport={handleExcelImport}
          onClose={() => setIsInstructorExcelImportOpen(false)}
          preselectedRole="Formateur"
        />
      )}

      {isStudentExcelImportOpen && (
        <ExcelImport
          onImport={handleExcelImport}
          onClose={() => setIsStudentExcelImportOpen(false)}
          preselectedRole="Étudiant"
        />
      )}
    </div>
  );
};

export default EnhancedUsersList;
