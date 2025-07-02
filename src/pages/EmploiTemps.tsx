
import React, { useState } from 'react';
import { Calendar, Clock, Plus, Upload, Download, Filter } from 'lucide-react';

const EmploiTemps = () => {
  const [currentView, setCurrentView] = useState('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

  const courses = [
    {
      id: 1,
      title: 'Marketing Digital',
      instructor: 'Formateur Prof',
      room: 'Salle A',
      students: 15,
      startTime: '09:00',
      endTime: '12:00',
      day: 'Lundi',
      color: 'bg-blue-500'
    },
    {
      id: 2,
      title: 'Photoshop Avancé',
      instructor: 'Formateur Design',
      room: 'Salle B',
      students: 8,
      startTime: '14:00',
      endTime: '17:00',
      day: 'Mardi',
      color: 'bg-green-500'
    },
    {
      id: 3,
      title: 'Communication digitale',
      instructor: 'Formateur Prof',
      room: 'Salle A',
      students: 12,
      startTime: '10:00',
      endTime: '12:00',
      day: 'Mercredi',
      color: 'bg-purple-500'
    }
  ];

  const getCourseForSlot = (day: string, time: string) => {
    return courses.find(course => 
      course.day === day && 
      course.startTime <= time && 
      course.endTime > time
    );
  };

  const getCourseDuration = (course: any) => {
    const start = parseInt(course.startTime.split(':')[0]);
    const end = parseInt(course.endTime.split(':')[0]);
    return end - start;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Emploi du Temps</h1>
        <p className="text-gray-600">Gérez et visualisez les plannings de cours</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrentView('week')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'week' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Semaine
                </button>
                <button
                  onClick={() => setCurrentView('month')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'month' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Mois
                </button>
              </div>
              
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Upload className="h-4 w-4 mr-2" />
                Importer Excel
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </button>
              <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau cours
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        {currentView === 'week' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="w-20 p-3 text-left text-sm font-medium text-gray-500">Heure</th>
                    {weekDays.map(day => (
                      <th key={day} className="p-3 text-center text-sm font-medium text-gray-500 min-w-48">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((time, timeIndex) => (
                    <tr key={time} className="border-t border-gray-100">
                      <td className="p-3 text-sm text-gray-600 bg-gray-50">{time}</td>
                      {weekDays.map(day => {
                        const course = getCourseForSlot(day, time);
                        const isFirstSlot = course && course.startTime === time;
                        const duration = course ? getCourseDuration(course) : 1;
                        
                        if (course && !isFirstSlot) {
                          return null; // Skip rendering for continuation slots
                        }
                        
                        return (
                          <td key={`${day}-${time}`} className="p-1 border-l border-gray-100 relative">
                            {course && isFirstSlot ? (
                              <div 
                                className={`${course.color} text-white p-3 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
                                style={{ 
                                  minHeight: `${duration * 60}px`,
                                  position: 'relative',
                                  zIndex: 1
                                }}
                              >
                                <div className="font-medium text-sm mb-1">{course.title}</div>
                                <div className="text-xs opacity-90 mb-1">{course.instructor}</div>
                                <div className="text-xs opacity-75">{course.room}</div>
                                <div className="text-xs opacity-75">{course.students} étudiants</div>
                              </div>
                            ) : (
                              <div 
                                className="h-16 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                                onClick={() => console.log('Add course for', day, time)}
                              >
                                <Plus className="h-4 w-4 text-gray-300 opacity-0 hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Monthly View */}
        {currentView === 'month' && (
          <div className="p-6">
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Vue mensuelle</h3>
              <p>La vue mensuelle sera développée prochainement</p>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cours cette semaine</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Heures programmées</p>
              <p className="text-2xl font-bold text-gray-900">32h</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Formateurs actifs</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Salles utilisées</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmploiTemps;
