
import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  Share, 
  MessageCircle, 
  Users, 
  Monitor,
  Hand,
  Settings,
  MoreVertical,
  Volume2,
  VolumeX
} from 'lucide-react';

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

        {/* Participants Grid (when not screen sharing) */}
        {!isScreenSharing && (
          <div className="absolute top-4 right-4 w-80 bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium">
                  Participants ({selectedClass.participants})
                </span>
                <button 
                  onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
                  className="text-gray-400 hover:text-white"
                >
                  <Users className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2 max-h-60 overflow-y-auto">
              {participants.slice(0, 6).map((participant, i) => (
                <div key={participant.id} className="relative bg-gray-700 rounded aspect-video flex items-center justify-center">
                  {participant.isVideoOff ? (
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">{participant.name[0]}</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">{participant.name[0]}</span>
                    </div>
                  )}
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
        <div className={`absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 transform transition-transform ${
          isChatOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Chat du cours</h3>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-purple-600">{message.sender}</p>
                    <span className="text-xs text-gray-500">{message.time}</span>
                  </div>
                  <p className="text-sm text-gray-700">{message.message}</p>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Tapez votre message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                />
                <button 
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                >
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          {/* Left side - Class info */}
          <div className="flex items-center space-x-4">
            <div className="text-white">
              <h4 className="font-medium">{selectedClass.title}</h4>
              <p className="text-sm text-gray-300">
                {selectedClass.participants} participants • {selectedClass.startTime} - {selectedClass.endTime}
              </p>
            </div>
          </div>

          {/* Center - Main controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-full ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'} text-white transition-colors`}
              title={isMuted ? 'Activer le micro' : 'Couper le micro'}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-3 rounded-full ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'} text-white transition-colors`}
              title={isVideoOff ? 'Activer la caméra' : 'Couper la caméra'}
            >
              {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setIsSpeakerOff(!isSpeakerOff)}
              className={`p-3 rounded-full ${isSpeakerOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'} text-white transition-colors`}
              title={isSpeakerOff ? 'Activer le son' : 'Couper le son'}
            >
              {isSpeakerOff ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              className={`p-3 rounded-full ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} text-white transition-colors`}
              title="Partager l'écran"
            >
              <Share className="h-5 w-5" />
            </button>

            <button
              onClick={() => setIsHandRaised(!isHandRaised)}
              className={`p-3 rounded-full ${isHandRaised ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'} text-white transition-colors`}
              title="Lever la main"
            >
              <Hand className="h-5 w-5" />
            </button>
          </div>

          {/* Right side - Secondary controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-3 rounded-full ${isChatOpen ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'} text-white transition-colors relative`}
              title="Chat"
            >
              <MessageCircle className="h-5 w-5" />
              {messages.length > 2 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {messages.length - 2}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
              className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors"
              title="Participants"
            >
              <Users className="h-5 w-5" />
            </button>

            <button className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors">
              <Settings className="h-5 w-5" />
            </button>

            <button className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>

            <button
              onClick={onLeaveCall}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center"
            >
              <Phone className="h-5 w-5 mr-2" />
              Quitter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
