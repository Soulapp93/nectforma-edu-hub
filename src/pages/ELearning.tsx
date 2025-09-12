
import React, { useState } from 'react';
import { Plus, Monitor, Video, FileText, Settings } from 'lucide-react';
import VirtualClasses from '../components/elearning/VirtualClasses';
import Recordings from '../components/elearning/Recordings';
import Materials from '../components/elearning/Materials';
import SettingsTab from '../components/elearning/Settings';
import VideoCall from '../components/elearning/VideoCall';
import CreateClassModal from '../components/elearning/modals/CreateClassModal';
import { VirtualClass } from '@/services/virtualClassService';

// Legacy interface for video call compatibility
interface LegacyVirtualClass {
  id: number;
  title: string;
  instructor: string;
  participants: number;
  maxParticipants: number;
  startTime: string;
  endTime: string;
  date: string;
}

const ELearning = () => {
  const [activeTab, setActiveTab] = useState('classes');
  const [selectedClass, setSelectedClass] = useState<LegacyVirtualClass | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleJoinClass = (classItem: VirtualClass) => {
    // Convert to legacy format for video call compatibility
    const legacyClass: LegacyVirtualClass = {
      id: parseInt(classItem.id.slice(-8), 16), // Convert UUID to number for compatibility
      title: classItem.title,
      instructor: classItem.instructor ? `${classItem.instructor.first_name} ${classItem.instructor.last_name}` : 'Instructeur',
      participants: classItem.current_participants,
      maxParticipants: classItem.max_participants,
      startTime: classItem.start_time,
      endTime: classItem.end_time,
      date: classItem.date
    };
    setSelectedClass(legacyClass);
    setIsInCall(true);
  };

  const handleLeaveCall = () => {
    setIsInCall(false);
    setSelectedClass(null);
  };

  const handleCreateClass = (classData: any) => {
    console.log('Nouvelle classe créée:', classData);
    setIsCreateModalOpen(false);
  };

  // If user is in a video call, show the video call interface
  if (isInCall && selectedClass) {
    return (
      <VideoCall 
        selectedClass={selectedClass} 
        onLeaveCall={handleLeaveCall} 
      />
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">E-Learning</h1>
          <p className="text-muted-foreground">Gérez vos cours en ligne et vidéoconférences</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg flex items-center font-medium transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle classe virtuelle
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'classes', label: 'Classes virtuelles', icon: Monitor },
            { id: 'recordings', label: 'Enregistrements', icon: Video },
            { id: 'materials', label: 'Ressources', icon: FileText },
            { id: 'settings', label: 'Paramètres', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-screen">
        {activeTab === 'classes' && (
          <VirtualClasses onJoinClass={handleJoinClass} />
        )}
        
        {activeTab === 'recordings' && (
          <Recordings />
        )}
        
        {activeTab === 'materials' && (
          <Materials />
        )}
        
        {activeTab === 'settings' && (
          <SettingsTab />
        )}
      </div>

      {/* Create Class Modal */}
      <CreateClassModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateClass}
      />
    </div>
  );
};

export default ELearning;
