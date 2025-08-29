
import React, { useState } from 'react';
import { Monitor, MicOff } from 'lucide-react';
import VideoControls from './videoCall/VideoControls';
import ChatSidebar from './videoCall/ChatSidebar';

interface VirtualClass {
  id: number;
  title: string;
  instructor: string;
  participants: number;
  maxParticipants: number;
  startTime: string;
  endTime: string;
  date: string;
}

interface VideoCallProps {
  selectedClass: VirtualClass;
  onLeaveCall: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({ selectedClass, onLeaveCall }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Formateur Prof',
      message: 'Bonjour à tous, nous commençons dans 2 minutes',
      time: '14:00',
      isInstructor: true
    },
    {
      id: 2,
      sender: 'Marie Dupont',
      message: 'Merci, nous sommes prêts',
      time: '14:01',
      isInstructor: false
    }
  ]);

  const participants = [
    { id: 1, name: 'Formateur Prof', role: 'Instructor', isMuted: false, isVideoOff: false },
    { id: 2, name: 'Marie Dupont', role: 'Student', isMuted: false, isVideoOff: false },
    { id: 3, name: 'Jean Martin', role: 'Student', isMuted: true, isVideoOff: false },
    { id: 4, name: 'Sophie Bernard', role: 'Student', isMuted: false, isVideoOff: true },
    { id: 5, name: 'Pierre Leroy', role: 'Student', isMuted: true, isVideoOff: false },
  ];

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'Vous',
        message: chatMessage,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isInstructor: false
      };
      setMessages([...messages, newMessage]);
      setChatMessage('');
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Main Video Area */}
      <div className="flex-1 relative">
        {/* Main presenter video */}
        <div className="h-full bg-gray-800 flex items-center justify-center relative">
          {isScreenSharing ? (
            <div className="w-full h-full bg-blue-900 flex items-center justify-center">
              <div className="text-center text-white">
                <Monitor className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Partage d'écran actif</h3>
                <p className="text-blue-200">Présentation en cours par {selectedClass.instructor}</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-white">
              <div className="w-40 h-40 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl font-bold">FP</span>
              </div>
              <h3 className="text-2xl font-semibold mb-2">{selectedClass.instructor}</h3>
              <p className="text-gray-300 text-lg">{selectedClass.title}</p>
              <div className="flex items-center justify-center mt-4 space-x-4">
                <span className="bg-green-500 w-3 h-3 rounded-full"></span>
                <span className="text-sm">En direct</span>
              </div>
            </div>
          )}

          {/* Floating controls overlay */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-lg p-3">
            <div className="flex items-center space-x-3 text-white">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">REC</span>
              <span className="text-sm">14:32</span>
            </div>
          </div>
        </div>

        {/* Participants Grid */}
        {!isScreenSharing && (
          <div className="absolute top-4 right-4 w-80 bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-gray-700">
              <span className="text-white text-sm font-medium">
                Participants ({selectedClass.participants})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2 max-h-60 overflow-y-auto">
              {participants.slice(0, 6).map((participant) => (
                <div key={participant.id} className="relative bg-gray-700 rounded aspect-video flex items-center justify-center">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">{participant.name[0]}</span>
                  </div>
                  <div className="absolute bottom-1 left-1 right-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-xs truncate flex-1">
                        {participant.name.split(' ')[0]}
                      </span>
                      {participant.isMuted && (
                        <MicOff className="h-3 w-3 text-red-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Sidebar */}
        <ChatSidebar 
          isChatOpen={isChatOpen}
          setIsChatOpen={setIsChatOpen}
          messages={messages}
          chatMessage={chatMessage}
          setChatMessage={setChatMessage}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* Control Bar */}
      <VideoControls 
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isVideoOff={isVideoOff}
        setIsVideoOff={setIsVideoOff}
        isSpeakerOff={isSpeakerOff}
        setIsSpeakerOff={setIsSpeakerOff}
        isScreenSharing={isScreenSharing}
        setIsScreenSharing={setIsScreenSharing}
        isHandRaised={isHandRaised}
        setIsHandRaised={setIsHandRaised}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        isParticipantsOpen={isParticipantsOpen}
        setIsParticipantsOpen={setIsParticipantsOpen}
        messageCount={messages.length}
        onLeaveCall={onLeaveCall}
        selectedClass={selectedClass}
      />
    </div>
  );
};

export default VideoCall;
