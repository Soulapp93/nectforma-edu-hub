import React, { useState } from 'react';
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  Book,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Plus,
  Grid3X3,
  List,
  Calendar as CalendarIcon,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const EmploiTemps = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');

  // Données d'exemple modernisées
  const mockSchedule = [
    {
      id: '1',
      day: 'Lundi',
      date: '15',
      modules: [
        { title: 'Module Introduction', time: '09:00 - 11:00', instructor: 'M. Dubois', room: 'Salle A101', color: 'bg-blue-500' },
        { title: 'Module Avancé', time: '14:00 - 16:00', instructor: 'Mme Martin', room: 'Salle B202', color: 'bg-purple-500' }
      ]
    },
    {
      id: '2',
      day: 'Mardi',
      date: '16',
      modules: [
        { title: 'Module Technique', time: '10:00 - 12:00', instructor: 'M. Durand', room: 'Salle C301', color: 'bg-green-500' },
        { title: 'Module Pratique', time: '15:00 - 17:00', instructor: 'Mme Bernard', room: 'Salle D401', color: 'bg-orange-500' }
      ]
    },
    {
      id: '3',
      day: 'Mercredi',
      date: '17',
      modules: [
        { title: 'Module Créatif', time: '09:30 - 11:30', instructor: 'M. Petit', room: 'Atelier 1', color: 'bg-pink-500' }
      ]
    },
    {
      id: '4',
      day: 'Jeudi',
      date: '18',
      modules: [
        { title: 'Module Théorique', time: '08:00 - 10:00', instructor: 'Mme Leroy', room: 'Amphithéâtre', color: 'bg-indigo-500' },
        { title: 'Module Expert', time: '13:30 - 15:30', instructor: 'M. Moreau', room: 'Salle E501', color: 'bg-teal-500' },
        { title: 'Séminaire', time: '16:00 - 18:00', instructor: 'Dr. Laurent', room: 'Salle F601', color: 'bg-red-500' }
      ]
    },
    {
      id: '5',
      day: 'Vendredi',
      date: '19',
      modules: [
        { title: 'Module Final', time: '10:00 - 12:00', instructor: 'M. Garcia', room: 'Salle G701', color: 'bg-cyan-500' }
      ]
    },
    {
      id: '6',
      day: 'Samedi',
      date: '20',
      modules: []
    },
    {
      id: '7',
      day: 'Dimanche',
      date: '21',
      modules: []
    }
  ];

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(direction === 'next' ? addWeeks(currentWeek, 1) : subWeeks(currentWeek, 1));
  };

  const getWeekInfo = () => {
    const startWeek = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const endWeek = addDays(startWeek, 6);
    return {
      start: format(startWeek, 'd MMMM', { locale: fr }),
      end: format(endWeek, 'd MMMM yyyy', { locale: fr })
    };
  };

  const weekInfo = getWeekInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Header moderne */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Emploi du Temps</h1>
                <p className="text-slate-600 dark:text-slate-300">
                  Semaine du {weekInfo.start} au {weekInfo.end}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau
              </Button>
            </div>
          </div>

          {/* Navigation et vues */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
                className="p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <CalendarIcon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                <span className="font-medium text-slate-900 dark:text-white">
                  {format(currentWeek, 'MMMM yyyy', { locale: fr })}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
                className="p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className="px-3"
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Semaine
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3"
              >
                <List className="h-4 w-4 mr-2" />
                Liste
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-6 py-8">
        {viewMode === 'week' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
            {mockSchedule.map((day) => (
              <Card
                key={day.id}
                className={`overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 border-0 ${
                  day.modules.length > 0 
                    ? 'bg-white dark:bg-slate-800 shadow-lg' 
                    : 'bg-slate-50 dark:bg-slate-900 shadow-sm opacity-60'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                        {day.day}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {day.date}
                        </span>
                        {day.modules.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {day.modules.length} cours
                          </Badge>
                        )}
                      </div>
                    </div>
                    {day.modules.length === 0 && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-slate-400" />
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {day.modules.length === 0 ? (
                    <p className="text-center text-slate-500 dark:text-slate-400 text-sm py-4">
                      Aucun cours
                    </p>
                  ) : (
                    day.modules.map((module, index) => (
                      <div
                        key={index}
                        className="relative p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-200"
                      >
                        <div className={`absolute top-0 left-0 w-1 h-full ${module.color} rounded-l-xl`} />
                        
                        <div className="ml-3">
                          <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">
                            {module.title}
                          </h4>
                          
                          <div className="space-y-1">
                            <div className="flex items-center text-xs text-slate-600 dark:text-slate-300">
                              <Clock className="h-3 w-3 mr-1" />
                              {module.time}
                            </div>
                            <div className="flex items-center text-xs text-slate-600 dark:text-slate-300">
                              <MapPin className="h-3 w-3 mr-1" />
                              {module.room}
                            </div>
                            <div className="flex items-center text-xs text-slate-600 dark:text-slate-300">
                              <User className="h-3 w-3 mr-1" />
                              {module.instructor}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {mockSchedule.filter(day => day.modules.length > 0).map((day) => (
              <Card key={day.id} className="overflow-hidden border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700">
                  <CardTitle className="flex items-center space-x-3">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                      {day.day} {day.date}
                    </span>
                    <Badge variant="outline">{day.modules.length} cours</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {day.modules.map((module, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-3 h-3 ${module.color} rounded-full mt-1`} />
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                              {module.title}
                            </h4>
                            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-2" />
                                {module.time}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-2" />
                                {module.room}
                              </div>
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-2" />
                                {module.instructor}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bouton flottant */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-110"
        >
          <Settings className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default EmploiTemps;