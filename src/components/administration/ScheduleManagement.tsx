import React, { useState } from 'react';
import { Plus, Calendar, Clock, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSchedules } from '@/hooks/useSchedules';
import { scheduleService } from '@/services/scheduleService';
import CreateScheduleModal from './CreateScheduleModal';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ScheduleManagement = () => {
  const { schedules, loading, refetch } = useSchedules();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleCreateSchedule = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    refetch();
    setIsCreateModalOpen(false);
    toast.success('Emploi du temps créé avec succès');
  };

  const handleDeleteSchedule = async (scheduleId: string, title: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'emploi du temps "${title}" ?`)) {
      try {
        await scheduleService.deleteSchedule(scheduleId);
        toast.success('Emploi du temps supprimé avec succès');
        refetch();
      } catch (error) {
        toast.error('Erreur lors de la suppression de l\'emploi du temps');
      }
    }
  };

  const handleEditSchedule = (scheduleId: string) => {
    navigate(`/emploi-temps/edit/${scheduleId}`);
  };

  const handleViewSchedule = (scheduleId: string) => {
    navigate(`/emploi-temps/view/${scheduleId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Publié':
        return 'bg-green-100 text-green-800';
      case 'Brouillon':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Emplois du Temps</h2>
          <p className="text-gray-600 mt-1">
            Créez et gérez les emplois du temps pour chaque formation
          </p>
        </div>
        <Button onClick={handleCreateSchedule} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Créer un Emploi du Temps
        </Button>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun emploi du temps
            </h3>
            <p className="text-gray-600 mb-4">
              Commencez par créer votre premier emploi du temps pour une formation
            </p>
            <Button onClick={handleCreateSchedule} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Créer un Emploi du Temps
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: schedule.formations?.color || '#8B5CF6' }}
                  />
                  <Badge variant="secondary" className={getStatusColor(schedule.status)}>
                    {schedule.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{schedule.title}</CardTitle>
                <div className="text-sm text-gray-600">
                  <p>Formation: {schedule.formations?.title}</p>
                  <p>Année: {schedule.academic_year}</p>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    Modifié le {new Date(schedule.updated_at).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewSchedule(schedule.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSchedule(schedule.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSchedule(schedule.id, schedule.title)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateScheduleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default ScheduleManagement;