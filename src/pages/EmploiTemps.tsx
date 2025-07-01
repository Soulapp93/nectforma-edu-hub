
import React, { useState } from 'react';
import { Calendar, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const EmploiTemps = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');

  const scheduleData = [
    {
      id: 1,
      title: 'Introduction au Marketing Digital',
      time: '08:00 - 11:00',
      instructor: 'Formateur Prof',
      day: 'Lun',
      color: 'bg-pink-400'
    },
    {
      id: 2,
      title: 'Introduction au Marketing Digital',
      time: '08:00 - 11:00', 
      instructor: 'Formateur Prof',
      day: 'Mar',
      color: 'bg-blue-400'
    },
    {
      id: 3,
      title: 'Introduction au Marketing Digital',
      time: '08:00 - 11:00',
      instructor: 'Formateur Prof',
      day: 'Mer',
      color: 'bg-green-400'
    },
    {
      id: 4,
      title: 'Introduction au Marketing Digital',
      time: '08:00 - 11:00',
      instructor: 'Formateur Prof',
      day: 'Jeu',
      color: 'bg-purple-400'
    },
    {
      id: 5,
      title: 'Introduction au Marketing Digital',
      time: '10:00 - 11:00',
      instructor: 'Formateur Prof',
      day: 'Ven',
      color: 'bg-orange-400'
    },
    {
      id: 6,
      title: 'Introduction au Marketing Digital',
      time: '10:00 - 11:00',
      instructor: 'Formateur Prof',
      day: 'Sam',
      color: 'bg-yellow-400'
    },
    {
      id: 7,
      title: 'Introduction au Marketing Digital',
      time: '08:00 - 11:00',
      instructor: 'Formateur Prof',
      day: 'Dim',
      color: 'bg-red-400'
    }
  ];

  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Emploi du Temps</h1>
        <p className="text-gray-600">Consultez votre planning</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['day', 'week', 'month'] as const).map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => setView(viewType)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    view === viewType
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {viewType === 'day' ? 'Jour' : viewType === 'week' ? 'Semaine' : 'Mois'}
                </button>
              ))}
            </div>

            {/* Date Navigation */}
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-gray-900">
                Aujourd'hui | Semaine du 23/06 au 29/06/2025
              </span>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">24/06/2025</span>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-8 gap-0">
          {/* Time column header */}
          <div className="p-4 bg-gray-50 border-b border-r border-gray-200">
            <span className="text-sm font-medium text-gray-500">Horaire</span>
          </div>
          
          {/* Day headers */}
          {days.map((day) => (
            <div key={day} className="p-4 bg-gray-50 border-b border-r border-gray-200 text-center">
              <span className="text-sm font-medium text-gray-900">{day}</span>
            </div>
          ))}

          {/* Time slots and schedule items */}
          {timeSlots.map((time) => (
            <React.Fragment key={time}>
              {/* Time label */}
              <div className="p-4 border-b border-r border-gray-200 bg-gray-50">
                <span className="text-sm text-gray-600">{time}</span>
              </div>
              
              {/* Day columns */}
              {days.map((day) => {
                const daySchedule = scheduleData.filter(item => item.day === day);
                const currentTimeSchedule = daySchedule.find(item => item.time.startsWith(time));
                
                return (
                  <div key={`${day}-${time}`} className="p-2 border-b border-r border-gray-200 min-h-[60px]">
                    {currentTimeSchedule && (
                      <div className={`${currentTimeSchedule.color} text-white p-3 rounded-lg text-xs`}>
                        <div className="font-medium mb-1">{currentTimeSchedule.title}</div>
                        <div className="text-xs opacity-90">{currentTimeSchedule.time}</div>
                        <div className="text-xs opacity-90">Form: {currentTimeSchedule.instructor}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmploiTemps;
