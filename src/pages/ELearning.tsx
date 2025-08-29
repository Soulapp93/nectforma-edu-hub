
import React, { useState } from 'react';
import { Plus, Monitor, Video, FileText, Settings } from 'lucide-react';
import VirtualClasses from '../components/elearning/VirtualClasses';
import Recordings from '../components/elearning/Recordings';
import Materials from '../components/elearning/Materials';
import SettingsTab from '../components/elearning/Settings';
import VideoCall from '../components/elearning/VideoCall';
import CreateClassModal from '../components/elearning/modals/CreateClassModal';

interface VirtualClass {
  id: number;
  title: string;
  instructor: string;
  status: 'En cours' | 'Programmé' | 'Terminé';
  participants: number;
  maxParticipants: number;
  startTime: string;
  endTime: string;
  date: string;
  description: string;
  materials: string[];
  recording: boolean;
}

const ELearning = () => {
  const [activeTab, setActiveTab] = useState('classes');
  const [selectedClass, setSelectedClass] = useState<VirtualClass | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleJoinClass = (classItem: VirtualClass) => {
    setSelectedClass(classItem);
    setIsInCall(true);
  };

  const handleLeaveCall = () => {
    setIsInCall(false);
    setSelectedClass(null);
  };

  const handleCreateClass = (classData: any) => {
    console.log('Nouvelle classe créée:', classData);
    // Ici, vous pourriez ajouter la logique pour sauvegarder la classe
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">E-Learning</h1>
          <p className="text-gray-600">Gérez vos cours en ligne et vidéoconférences</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center font-medium"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle classe virtuelle
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
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
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
