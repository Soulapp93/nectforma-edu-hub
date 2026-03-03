import React, { useState, useEffect } from 'react';
import { useQuizTheme } from './QuizThemeProvider';
import { QuizSession, QuizParticipant } from '@/services/quizService';
import QuizParticles from './QuizParticles';
import { Users, Copy, Check, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const EMOJI_LIST = ['😎', '🦊', '🐱', '🦁', '🐸', '🐼', '🦄', '🐲', '🎯', '⚡', '🔥', '💎', '🌟', '👾', '🤖', '🎮', '🏆', '🚀', '💪', '🧠', '🎪', '🎭', '🎨', '🎵'];

interface Props {
  session: QuizSession;
  participants: QuizParticipant[];
  isHost: boolean;
  quizTitle: string;
  onStart: () => void;
  onSelectEmoji: (emoji: string) => void;
  onSetNickname: (nickname: string) => void;
  selectedEmoji: string;
  nickname: string;
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

const QuizLobby: React.FC<Props> = ({
  session, participants, isHost, quizTitle, onStart,
  onSelectEmoji, onSetNickname, selectedEmoji, nickname,
  audioEnabled, onToggleAudio,
}) => {
  const theme = useQuizTheme();
  const [copied, setCopied] = useState(false);

  const copyPin = () => {
    navigator.clipboard.writeText(session.pin_code);
    setCopied(true);
    toast.success('PIN copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{ background: theme.bgGradient }}>
      <QuizParticles />

      {/* Audio toggle */}
      <button onClick={onToggleAudio}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all">
        {audioEnabled ? <Volume2 className="h-5 w-5" style={{ color: theme.textColor }} /> :
          <VolumeX className="h-5 w-5" style={{ color: theme.textColor }} />}
      </button>

      <div className="relative z-10 w-full max-w-md mx-auto space-y-6">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-black mb-2" style={{ color: theme.textColor }}>{quizTitle}</h1>
          <p className="text-lg opacity-80" style={{ color: theme.textColor }}>En attente des joueurs...</p>
        </div>

        {/* PIN Code */}
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest mb-2 opacity-60" style={{ color: theme.textColor }}>Code PIN</p>
          <button onClick={copyPin}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl backdrop-blur-xl transition-all hover:scale-105 active:scale-95"
            style={{ background: theme.cardBg, border: `2px solid ${theme.primaryColor}40` }}>
            <span className="text-4xl sm:text-5xl font-black tracking-[0.3em]" style={{ color: theme.primaryColor }}>
              {session.pin_code}
            </span>
            {copied ? <Check className="h-6 w-6 text-green-400" /> : <Copy className="h-6 w-6" style={{ color: theme.textColor + '80' }} />}
          </button>
        </div>

        {/* Player setup (non-host) */}
        {!isHost && (
          <div className="space-y-4 p-5 rounded-2xl backdrop-blur-xl" style={{ background: theme.cardBg }}>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: theme.textColor }}>Ton pseudo</label>
              <input
                value={nickname}
                onChange={e => onSetNickname(e.target.value.slice(0, 20))}
                placeholder="Entre ton pseudo..."
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-lg font-bold placeholder:opacity-40 focus:outline-none focus:ring-2"
                style={{ color: theme.textColor, borderColor: theme.primaryColor + '40' }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: theme.textColor }}>Choisis ton avatar</label>
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_LIST.map(emoji => (
                  <button key={emoji}
                    onClick={() => onSelectEmoji(emoji)}
                    className={`text-2xl p-2 rounded-xl transition-all hover:scale-110 ${
                      selectedEmoji === emoji ? 'ring-2 scale-110 bg-white/20' : 'bg-white/5 hover:bg-white/10'
                    }`}
                    style={{ outlineColor: theme.primaryColor }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Participants */}
        <div className="p-5 rounded-2xl backdrop-blur-xl" style={{ background: theme.cardBg }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2" style={{ color: theme.textColor }}>
              <Users className="h-5 w-5" /> Joueurs connectés
            </h3>
            <span className="text-2xl font-black" style={{ color: theme.accentColor }}>{participants.length}</span>
          </div>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-auto">
            {participants.map(p => (
              <div key={p.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium animate-scale-in"
                style={{ background: theme.primaryColor + '20', color: theme.textColor }}>
                <span className="text-lg">{p.avatar_emoji || '😎'}</span>
                <span>{p.nickname || 'Joueur'}</span>
              </div>
            ))}
            {participants.length === 0 && (
              <p className="text-sm opacity-50 py-4 w-full text-center" style={{ color: theme.textColor }}>
                En attente de joueurs...
              </p>
            )}
          </div>
        </div>

        {/* Start button (host only) */}
        {isHost && (
          <Button
            onClick={onStart}
            disabled={participants.length === 0}
            className={`w-full py-6 text-xl font-black ${theme.buttonStyle}`}
            style={{
              background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
              color: '#fff',
              opacity: participants.length === 0 ? 0.5 : 1,
            }}
          >
            🚀 Lancer le Quiz !
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizLobby;
