import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCurrentUser, useUserWithRelations } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceRecord {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  title: string;
  room?: string;
  formation_title: string;
  status: 'Présent' | 'Absent';
  signed_at?: string;
  absence_reason?: string;
  instructor_name?: string;
}

const SuiviEmargement = () => {
  const { userRole, userId } = useCurrentUser();
  const { relationInfo } = useUserWithRelations();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadAttendanceHistory();
  }, [userId, userRole, relationInfo]);

  const loadAttendanceHistory = async () => {
    try {
      setLoading(true);
      
      // Générer des données démo selon le rôle
      let records: AttendanceRecord[] = [];
      
      if (userRole === 'Étudiant' || (userRole === 'Tuteur' && relationInfo?.type === 'student')) {
        // Données pour étudiant ou pour l'apprenti du tuteur
        records = generateStudentAttendanceHistory();
      } else if (userRole === 'Formateur') {
        // Données pour formateur
        records = generateInstructorAttendanceHistory();
      } else {
        // Données générales pour admin
        records = generateGeneralAttendanceHistory();
      }
      
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateStudentAttendanceHistory = (): AttendanceRecord[] => {
    const formations = ['Formation Développement Web', 'Formation React Avancé', 'Formation Base de données'];
    const instructors = ['Marie Dubois', 'Pierre Martin', 'Sophie Laurent'];
    const rooms = ['Salle A101', 'Salle B203', 'Lab Informatique'];
    const statuses: AttendanceRecord['status'][] = ['Présent', 'Absent'];
    
    return Array.from({ length: 25 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i * 2);
      const status = i === 0 ? 'Présent' : statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        id: `student-${i}`,
        date: date.toISOString().split('T')[0],
        start_time: ['08:30', '09:00', '14:00'][Math.floor(Math.random() * 3)],
        end_time: ['12:00', '17:00', '18:00'][Math.floor(Math.random() * 3)],
        title: `Cours ${formations[Math.floor(Math.random() * formations.length)]}`,
        room: rooms[Math.floor(Math.random() * rooms.length)],
        formation_title: formations[Math.floor(Math.random() * formations.length)],
        status,
        signed_at: status === 'Présent' ? date.toISOString() : undefined,
        absence_reason: undefined,
        instructor_name: instructors[Math.floor(Math.random() * instructors.length)]
      };
    });
  };

  const generateInstructorAttendanceHistory = (): AttendanceRecord[] => {
    const formations = ['Formation Développement Web', 'Formation React Avancé', 'Formation Base de données'];
    const rooms = ['Salle A101', 'Salle B203', 'Lab Informatique'];
    
    return Array.from({ length: 20 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i * 3);
      
      return {
        id: `instructor-${i}`,
        date: date.toISOString().split('T')[0],
        start_time: ['08:30', '09:00', '14:00'][Math.floor(Math.random() * 3)],
        end_time: ['12:00', '17:00', '18:00'][Math.floor(Math.random() * 3)],
        title: `Cours ${formations[Math.floor(Math.random() * formations.length)]}`,
        room: rooms[Math.floor(Math.random() * rooms.length)],
        formation_title: formations[Math.floor(Math.random() * formations.length)],
        status: 'Présent',
        signed_at: date.toISOString(),
        instructor_name: 'Vous'
      };
    });
  };

  const generateGeneralAttendanceHistory = (): AttendanceRecord[] => {
    return [
      ...generateStudentAttendanceHistory().slice(0, 10),
      ...generateInstructorAttendanceHistory().slice(0, 10)
    ];
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = 
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.formation_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.instructor_name && record.instructor_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || statusFilter === '' || record.status === statusFilter;
    const matchesDate = dateFilter === '' || record.date.includes(dateFilter);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    const variants = {
      'Présent': 'bg-green-100 text-green-800 border-green-200',
      'Absent': 'bg-red-100 text-red-800 border-red-200'
    };

    const icons = {
      'Présent': CheckCircle,
      'Absent': XCircle
    };

    const Icon = icons[status];

    return (
      <Badge variant="secondary" className={`${variants[status]} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getStatsCards = () => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter(r => r.status === 'Présent').length;
    const absent = filteredRecords.filter(r => r.status === 'Absent').length;
    
    const attendanceRate = total > 0 ? (present / total * 100).toFixed(1) : '0';

    return [
      {
        title: 'Taux de présence',
        value: `${attendanceRate}%`,
        description: 'Présences sur total des cours',
        icon: CheckCircle,
        color: 'text-green-600'
      },
      {
        title: 'Présences',
        value: present.toString(),
        description: 'Cours suivis avec succès',
        icon: CheckCircle,
        color: 'text-green-600'
      },
      {
        title: 'Absences',
        value: absent.toString(),
        description: 'Cours manqués',
        icon: XCircle,
        color: 'text-red-600'
      }
    ];
  };

  const getPageTitle = () => {
    if (userRole === 'Tuteur' && relationInfo?.type === 'student') {
      return `Suivi Émargement - ${relationInfo.name}`;
    }
    return 'Suivi Émargement';
  };

  const getPageDescription = () => {
    if (userRole === 'Tuteur' && relationInfo?.type === 'student') {
      return `Historique des émargements de votre apprenti ${relationInfo.name}`;
    } else if (userRole === 'Étudiant') {
      return 'Votre historique de présences et absences aux cours';
    } else if (userRole === 'Formateur') {
      return 'Historique de vos interventions et cours dispensés';
    }
    return 'Historique général des émargements';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-64"></div>
          <div className="h-4 bg-gray-200 rounded mb-8 w-96"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{getPageTitle()}</h1>
        <p className="text-gray-600">{getPageDescription()}</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {getStatsCards().map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par cours, formation ou formateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter || 'all'} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Présent">Présent</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full lg:w-48"
            />
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('');
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des émargements */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des émargements</CardTitle>
          <CardDescription>
            {filteredRecords.length} enregistrement{filteredRecords.length > 1 ? 's' : ''} trouvé{filteredRecords.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Cours</TableHead>
                  <TableHead>Formation</TableHead>
                  <TableHead>Horaires</TableHead>
                  <TableHead>Salle</TableHead>
                  <TableHead>Formateur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Observations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(record.date).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{record.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.formation_title}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {record.start_time} - {record.end_time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {record.room || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {record.instructor_name || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(record.status)}
                    </TableCell>
                    <TableCell>
                      {record.absence_reason && (
                        <span className="text-sm text-gray-500">
                          {record.absence_reason}
                        </span>
                      )}
                      {record.signed_at && record.status === 'Présent' && (
                        <span className="text-xs text-green-600">
                          Signé le {new Date(record.signed_at).toLocaleString('fr-FR')}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredRecords.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500">Aucun enregistrement trouvé</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuiviEmargement;