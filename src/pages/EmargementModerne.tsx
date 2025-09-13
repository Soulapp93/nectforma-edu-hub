import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  PenTool, 
  Download, 
  Send,
  Filter,
  Search,
  BarChart3,
  FileText,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { attendanceService, AttendanceSheet } from '@/services/attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import AttendanceSigningModal from '../components/emargement/AttendanceSigningModal';
import SignatureManagementModal from '../components/ui/signature-management-modal';

const EmargementModerne = () => {
  const [attendanceSheets, setAttendanceSheets] = useState<AttendanceSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSheet, setSelectedSheet] = useState<AttendanceSheet | null>(null);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [userSignature, setUserSignature] = useState<string | null>(null);
  
  const { userId, userRole } = useCurrentUser();

  // Données de démonstration
  const mockData: AttendanceSheet[] = [
    {
      id: '1',
      title: 'Formation React Avancé',
      date: '2025-01-15',
      start_time: '09:00',
      end_time: '12:00',
      room: 'Salle A1',
      status: 'En cours',
      is_open_for_signing: true,
      formations: { title: 'React Avancé', level: 'Niveau 3' },
      instructor: { first_name: 'Sophie', last_name: 'Dubois' },
      signatures: [],
      // ... autres champs requis
      schedule_slot_id: 'slot-1',
      formation_id: 'form-1',
      instructor_id: 'inst-1',
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      opened_at: null,
      closed_at: null,
      validated_at: null,
      validated_by: null
    },
    {
      id: '2',
      title: 'Formation JavaScript ES6',
      date: '2025-01-15',
      start_time: '14:00',
      end_time: '17:00',
      room: 'Salle B2',
      status: 'En attente de validation',
      is_open_for_signing: false,
      formations: { title: 'JavaScript ES6', level: 'Niveau 2' },
      instructor: { first_name: 'Pierre', last_name: 'Martin' },
      signatures: [
        {
          id: 'sig-1',
          attendance_sheet_id: '2',
          user_id: 'user-1',
          user_type: 'student',
          present: true,
          signed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      // ... autres champs requis
      schedule_slot_id: 'slot-2',
      formation_id: 'form-2',
      instructor_id: 'inst-2',
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      opened_at: new Date().toISOString(),
      closed_at: new Date().toISOString(),
      validated_at: null,
      validated_by: null
    }
  ];

  useEffect(() => {
    fetchAttendanceData();
    loadUserSignature();
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // En production, utiliser les vraies données
      setAttendanceSheets(mockData);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadUserSignature = () => {
    const signature = localStorage.getItem(`user_signature_${userId}`);
    setUserSignature(signature);
  };

  const handleSaveSignature = async (signatureData: string) => {
    if (signatureData) {
      localStorage.setItem(`user_signature_${userId}`, signatureData);
      setUserSignature(signatureData);
    } else {
      localStorage.removeItem(`user_signature_${userId}`);
      setUserSignature(null);
    }
  };

  const handleSignAttendance = (sheet: AttendanceSheet) => {
    setSelectedSheet(sheet);
    setShowSigningModal(true);
  };

  const handleSignatureComplete = () => {
    toast.success('Présence enregistrée avec succès !');
    fetchAttendanceData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'En attente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'En attente de validation':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Validé':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredSheets = attendanceSheets.filter(sheet => {
    const matchesSearch = sheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sheet.formations?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sheet.instructor?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sheet.instructor?.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sheet.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Statistiques
  const stats = {
    total: attendanceSheets.length,
    active: attendanceSheets.filter(s => s.status === 'En cours').length,
    pending: attendanceSheets.filter(s => s.status === 'En attente de validation').length,
    validated: attendanceSheets.filter(s => s.status === 'Validé').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Émargement Numérique</h1>
              <p className="text-primary-foreground/80">Système moderne de gestion des présences</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowSignatureModal(true)}
                variant="secondary"
                size="sm"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Ma Signature
              </Button>
              <Button variant="secondary" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En Cours</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">À Valider</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Validées</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.validated}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interface principale */}
        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sessions">Sessions Actives</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-6">
            {/* Filtres et recherche */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher une formation ou un formateur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="En cours">En cours</SelectItem>
                      <SelectItem value="En attente">En attente</SelectItem>
                      <SelectItem value="En attente de validation">À valider</SelectItem>
                      <SelectItem value="Validé">Validé</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Plus de filtres
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tableau des sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Sessions d'aujourd'hui</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Formation</TableHead>
                      <TableHead>Formateur</TableHead>
                      <TableHead>Horaires</TableHead>
                      <TableHead>Salle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Présences</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSheets.map((sheet) => (
                      <TableRow key={sheet.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sheet.formations?.title}</p>
                            <p className="text-sm text-muted-foreground">{sheet.formations?.level}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {sheet.instructor?.first_name} {sheet.instructor?.last_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                            {sheet.start_time} - {sheet.end_time}
                          </div>
                        </TableCell>
                        <TableCell>{sheet.room}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(sheet.status)}>
                            {sheet.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span className="text-sm">
                                {sheet.signatures?.length || 0}/25
                              </span>
                            </div>
                            <Progress 
                              value={((sheet.signatures?.length || 0) / 25) * 100} 
                              className="w-16"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {sheet.is_open_for_signing && (
                              <Button
                                size="sm"
                                onClick={() => handleSignAttendance(sheet)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Signer
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <FileText className="h-4 w-4 mr-1" />
                              Voir
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Historique des émargements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Historique à implémenter...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analyses et statistiques</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analyses à implémenter...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {selectedSheet && showSigningModal && (
        <AttendanceSigningModal
          isOpen={showSigningModal}
          onClose={() => {
            setShowSigningModal(false);
            setSelectedSheet(null);
          }}
          attendanceSheet={selectedSheet}
          userId={userId || ''}
          userRole={userRole || 'Étudiant'}
          onSigned={handleSignatureComplete}
        />
      )}

      <SignatureManagementModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        currentSignature={userSignature}
        onSave={handleSaveSignature}
        title="Gestion de ma signature"
      />
    </div>
  );
};

export default EmargementModerne;