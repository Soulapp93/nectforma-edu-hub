import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Search, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEstablishment } from '@/hooks/useEstablishment';
import { dossierService, UserProfile } from '@/services/dossierService';
import { DossierDetail } from './DossierDetail';

const DossiersAdministratifs: React.FC = () => {
  const { establishment } = useEstablishment();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [formateurs, setFormateurs] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchStudent, setSearchStudent] = useState('');
  const [searchFormateur, setSearchFormateur] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (establishment?.id) loadUsers();
  }, [establishment?.id]);

  const loadUsers = async () => {
    if (!establishment?.id) return;
    setLoading(true);
    try {
      const [s, f] = await Promise.all([
        dossierService.getEstablishmentUsers(establishment.id, 'Étudiant'),
        dossierService.getEstablishmentUsers(establishment.id, 'Formateur'),
      ]);
      setStudents(s);
      setFormateurs(f);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (selectedUser) {
    return (
      <DossierDetail
        user={selectedUser}
        establishmentId={establishment?.id || ''}
        onBack={() => { setSelectedUser(null); loadUsers(); }}
      />
    );
  }

  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(searchStudent.toLowerCase())
  );
  const filteredFormateurs = formateurs.filter(f =>
    `${f.first_name} ${f.last_name} ${f.email}`.toLowerCase().includes(searchFormateur.toLowerCase())
  );

  const UserCard: React.FC<{ user: UserProfile; onClick: () => void }> = ({ user, onClick }) => (
    <div
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border"
      onClick={onClick}
      data-testid={`dossier-user-${user.id}`}
    >
      {user.profile_photo_url ? (
        <img src={user.profile_photo_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
          {user.first_name?.[0]}{user.last_name?.[0]}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{user.first_name} {user.last_name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      <Badge variant={user.status === 'Actif' ? 'default' : 'secondary'} className="text-xs shrink-0">
        {user.status || 'Actif'}
      </Badge>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="dossiers-administratifs">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne Etudiants */}
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Etudiants</h3>
                <Badge variant="secondary" className="ml-auto">{students.length}</Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un etudiant..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="pl-9"
                  data-testid="search-student"
                />
              </div>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto space-y-1">
              {loading ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Chargement...</p>
              ) : filteredStudents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Aucun etudiant trouve</p>
              ) : (
                filteredStudents.map(s => (
                  <UserCard key={s.id} user={s} onClick={() => setSelectedUser(s)} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Colonne Formateurs */}
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Formateurs</h3>
                <Badge variant="secondary" className="ml-auto">{formateurs.length}</Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un formateur..."
                  value={searchFormateur}
                  onChange={(e) => setSearchFormateur(e.target.value)}
                  className="pl-9"
                  data-testid="search-formateur"
                />
              </div>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto space-y-1">
              {loading ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Chargement...</p>
              ) : filteredFormateurs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Aucun formateur trouve</p>
              ) : (
                filteredFormateurs.map(f => (
                  <UserCard key={f.id} user={f} onClick={() => setSelectedUser(f)} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DossiersAdministratifs;
