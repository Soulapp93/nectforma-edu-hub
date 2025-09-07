import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, RefreshCw, Eye, FileText, Calendar, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { attendanceService, AttendanceSheet } from '@/services/attendanceService';
import { useFormations } from '@/hooks/useFormations';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AttendanceSheetModal from './AttendanceSheetModal';

const AttendanceManagement = () => {
  const [attendanceSheets, setAttendanceSheets] = useState<AttendanceSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormation, setSelectedFormation] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSheet, setSelectedSheet] = useState<AttendanceSheet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { formations } = useFormations();

  const fetchAttendanceSheets = async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getAttendanceSheets();
      setAttendanceSheets(data);
    } catch (error) {
      console.error('Error fetching attendance sheets:', error);
      toast.error('Erreur lors du chargement des feuilles d\'émargement');
    } finally {
      setLoading(false);
    }
  };

  const generateAttendanceSheets = async () => {
    try {
      setLoading(true);
      await attendanceService.generateAttendanceSheets();
      await fetchAttendanceSheets();
      toast.success('Feuilles d\'émargement générées automatiquement');
    } catch (error) {
      console.error('Error generating attendance sheets:', error);
      toast.error('Erreur lors de la génération des feuilles d\'émargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceSheets();
  }, []);

  const filteredSheets = attendanceSheets.filter(sheet => {
    const matchesSearch = sheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sheet.formations?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFormation = !selectedFormation || sheet.formation_id === selectedFormation;
    const matchesStatus = !selectedStatus || sheet.status === selectedStatus;
    
    return matchesSearch && matchesFormation && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En attente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'En cours':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Terminé':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Fermé':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSignatureCount = (sheet: AttendanceSheet) => {
    return sheet.signatures?.filter(sig => sig.present).length || 0;
  };

  const handleViewSheet = (sheet: AttendanceSheet) => {
    setSelectedSheet(sheet);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feuilles d'émargement</h2>
          <p className="text-gray-600">Gérez les feuilles d'émargement de toutes les formations</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={generateAttendanceSheets} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Générer les feuilles
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedFormation} onValueChange={setSelectedFormation}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les formations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les formations</SelectItem>
                {formations.map((formation) => (
                  <SelectItem key={formation.id} value={formation.id}>
                    {formation.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
                <SelectItem value="En cours">En cours</SelectItem>
                <SelectItem value="Terminé">Terminé</SelectItem>
                <SelectItem value="Fermé">Fermé</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedFormation('');
                setSelectedStatus('');
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Sheets Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSheets.map((sheet) => (
            <Card key={sheet.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg leading-tight">
                      {sheet.formations?.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{sheet.formations?.level}</p>
                  </div>
                  <Badge className={getStatusColor(sheet.status)}>
                    {sheet.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(new Date(sheet.date), 'EEEE d MMMM yyyy', { locale: fr })}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {sheet.start_time} - {sheet.end_time}
                  </div>
                  {sheet.room && (
                    <div className="flex items-center text-gray-600">
                      <FileText className="h-4 w-4 mr-2" />
                      Salle {sheet.room}
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {getSignatureCount(sheet)} signatures
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewSheet(sheet)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredSheets.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune feuille d'émargement trouvée
          </h3>
          <p className="text-gray-600 mb-4">
            Générez automatiquement les feuilles à partir de l'emploi du temps
          </p>
          <Button onClick={generateAttendanceSheets} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Générer les feuilles
          </Button>
        </div>
      )}

      {/* Modal for viewing attendance sheet details */}
      {selectedSheet && (
        <AttendanceSheetModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSheet(null);
          }}
          attendanceSheet={selectedSheet}
          onUpdate={fetchAttendanceSheets}
        />
      )}
    </div>
  );
};

export default AttendanceManagement;