import React, { useState, useEffect } from 'react';
import { quizService, QuizSession, QuizParticipant } from '@/services/quizService';
import QuizGameOrchestrator from './QuizGameOrchestrator';
import QuizParticles from './QuizParticles';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Zap, LogIn, ArrowLeft, ArrowRight, Users, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const EMOJI_LIST = ['😎', '🦊', '🐱', '🦁', '🐸', '🐼', '🦄', '🐲', '🎯', '⚡', '🔥', '💎', '🌟', '👾', '🤖', '🎮', '🏆', '🚀', '💪', '🧠', '🎪', '🎭', '🎨', '🎵'];

const BAD_WORDS = ['con', 'pute', 'merde', 'bite', 'fuck', 'shit', 'ass', 'dick', 'cul', 'salop', 'enculé', 'nique', 'batar'];

function filterBadWords(text: string): boolean {
  const lower = text.toLowerCase();
  return BAD_WORDS.some(w => lower.includes(w));
}

function randomPseudo(): string {
  const adjectives = ['Rapide', 'Malin', 'Brave', 'Cool', 'Epic', 'Mega', 'Super', 'Turbo', 'Ultra', 'Ninja'];
  const nouns = ['Renard', 'Dragon', 'Panda', 'Lion', 'Tigre', 'Aigle', 'Loup', 'Faucon', 'Phoenix', 'Koala'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}`;
}

/** Generate or retrieve a persistent anonymous ID for this browser */
function getAnonymousId(): string {
  const key = 'quiz_anonymous_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

type Step = 'pin' | 'profile' | 'lobby' | 'game';

interface Props {
  initialPin?: string;
  onClose: () => void;
}

const QuizJoinScreen: React.FC<Props> = ({ initialPin = '', onClose }) => {
  const anonymousId = getAnonymousId();
  const [step, setStep] = useState<Step>('pin');
  const [pin, setPin] = useState(initialPin);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [nickname, setNickname] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😎');
  const [myParticipant, setMyParticipant] = useState<QuizParticipant | null>(null);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [quizTitle, setQuizTitle] = useState('');

  // Auto-validate PIN from QR scan
  useEffect(() => {
    if (initialPin && initialPin.length === 6) {
      handleValidatePin(initialPin);
    }
  }, [initialPin]);

  const handleValidatePin = async (pinCode?: string) => {
    const codeToUse = pinCode || pin;
    if (!codeToUse.trim() || codeToUse.length !== 6) {
      toast.error('Entrez un code PIN à 6 chiffres');
      return;
    }
    setLoading(true);
    try {
      const s = await quizService.getSessionByPin(codeToUse);
      if (!s) {
        toast.error('Session introuvable ou terminée');
        return;
      }
      setSession(s);
      try {
        const quiz = await quizService.getQuiz(s.quiz_id);
        setQuizTitle(quiz.title);
      } catch {}
      setNickname(randomPseudo());
      setSelectedEmoji(EMOJI_LIST[Math.floor(Math.random() * EMOJI_LIST.length)]);
      setStep('profile');
    } catch {
      toast.error('Erreur connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!session) return;
    if (!nickname.trim()) {
      toast.error('Choisis un pseudo');
      return;
    }
    if (filterBadWords(nickname)) {
      toast.error('Ce pseudo contient des mots inappropriés');
      return;
    }
    setLoading(true);
    try {
      const p = await quizService.joinSessionAnonymous(session.id, anonymousId, nickname, selectedEmoji);
      setMyParticipant(p);
      const ps = await quizService.getParticipants(session.id);
      setParticipants(ps);
      setStep('lobby');
      toast.success('Tu as rejoint la partie ! 🎮');
    } catch (err: any) {
      if (err?.code === '23505') {
        // Already joined
        const ps = await quizService.getParticipants(session.id);
        const me = ps.find(p => p.anonymous_id === anonymousId);
        if (me) {
          setMyParticipant(me);
          setParticipants(ps);
          setStep('lobby');
        }
      } else {
        toast.error('Erreur connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to session changes (to detect when host starts the game)
  useEffect(() => {
    if (!session || step !== 'lobby') return;

    const sessionSub = quizService.subscribeToSession(session.id, (payload: any) => {
      const newSession = payload.new as QuizSession;
      setSession(newSession);
      if (newSession.status !== 'waiting') {
        setStep('game');
      }
    });

    const participantSub = quizService.subscribeToParticipants(session.id, (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setParticipants(prev => [...prev, payload.new as QuizParticipant]);
      } else if (payload.eventType === 'UPDATE') {
        setParticipants(prev => prev.map(p => p.id === payload.new.id ? payload.new as QuizParticipant : p));
      }
    });

    return () => {
      supabase.removeChannel(sessionSub);
      supabase.removeChannel(participantSub);
    };
  }, [session?.id, step]);

  // Game phase - show orchestrator
  if (step === 'game' && session) {
    return <QuizGameOrchestrator sessionId={session.id} isHost={false} onExit={onClose} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <QuizParticles count={20} />

      <div className="relative z-10 w-full max-w-sm space-y-6 text-center">
        {/* Logo */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto shadow-2xl">
          <Zap className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-black text-white">Quiz Interactif</h1>

        {/* Step 1: PIN Entry */}
        {step === 'pin' && (
          <div className="space-y-4">
            <p className="text-white/70">Entrez le code PIN pour rejoindre</p>
            <Input
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="text-center text-3xl font-black tracking-[0.5em] py-6 bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-2xl"
              maxLength={6}
              onKeyDown={e => e.key === 'Enter' && handleValidatePin()}
            />
            <Button onClick={() => handleValidatePin()} disabled={loading || pin.length !== 6}
              className="w-full py-6 text-lg font-bold rounded-2xl gap-2"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>
              <ArrowRight className="h-5 w-5" />
              {loading ? 'Recherche...' : 'Continuer'}
            </Button>
            <button onClick={onClose} className="text-white/50 text-sm hover:text-white/80 transition-colors">
              Retour
            </button>
          </div>
        )}

        {/* Step 2: Profile Setup */}
        {step === 'profile' && (
          <div className="space-y-5">
            {quizTitle && (
              <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm inline-block">
                <span className="text-white/90 text-sm font-medium">🎯 {quizTitle}</span>
              </div>
            )}
            <p className="text-white/70">Personnalise ton profil de joueur</p>

            {/* Nickname */}
            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium text-left block">Ton pseudo</label>
              <div className="relative">
                <Input
                  value={nickname}
                  onChange={e => setNickname(e.target.value.slice(0, 20))}
                  placeholder="Entre ton pseudo..."
                  maxLength={20}
                  className="text-center text-xl font-bold py-5 bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-2xl"
                />
                <button
                  onClick={() => setNickname(randomPseudo())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50 hover:text-white/80 bg-white/10 px-2 py-1 rounded-lg"
                >
                  🎲 Aléatoire
                </button>
              </div>
            </div>

            {/* Emoji selection */}
            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium text-left block">Ton avatar</label>
              <div className="grid grid-cols-8 gap-2 p-3 rounded-2xl bg-white/5 backdrop-blur-sm">
                {EMOJI_LIST.map(emoji => (
                  <button key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`text-2xl p-1.5 rounded-xl transition-all hover:scale-110 ${
                      selectedEmoji === emoji 
                        ? 'ring-2 ring-amber-400 scale-110 bg-white/20' 
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
              <span className="text-4xl">{selectedEmoji}</span>
              <span className="text-xl font-bold text-white">{nickname || 'Ton pseudo'}</span>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep('pin')} variant="ghost"
                className="flex-1 py-5 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 gap-1">
                <ArrowLeft className="h-4 w-4" /> Retour
              </Button>
              <Button onClick={handleJoinSession} disabled={loading || !nickname.trim()}
                className="flex-1 py-5 text-lg font-bold rounded-2xl gap-2"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>
                <LogIn className="h-5 w-5" />
                {loading ? 'Connexion...' : 'Rejoindre'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Lobby - Waiting for host */}
        {step === 'lobby' && session && (
          <div className="space-y-5">
            {quizTitle && (
              <h2 className="text-2xl font-black text-white">{quizTitle}</h2>
            )}

            {/* My profile card */}
            <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <span className="text-4xl">{selectedEmoji}</span>
              <div className="text-left">
                <p className="text-lg font-bold text-white">{nickname}</p>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Connecté
                </p>
              </div>
            </div>

            {/* Waiting animation */}
            <div className="py-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-white/80 text-lg font-medium">En attente du lancement...</p>
              <p className="text-white/50 text-sm mt-1">L'animateur va bientôt démarrer le quiz</p>
            </div>

            {/* Participants list */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4" /> Joueurs connectés
                </h3>
                <span className="text-2xl font-black text-amber-400">{participants.length}</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-auto">
                {participants.map(p => (
                  <div key={p.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                      p.anonymous_id === anonymousId ? 'bg-amber-500/30 ring-1 ring-amber-400/50' : 'bg-white/10'
                    }`}>
                    <span className="text-lg">{p.avatar_emoji || '😎'}</span>
                    <span className="text-white">{p.nickname || 'Joueur'}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={onClose} className="text-white/50 text-sm hover:text-white/80 transition-colors">
              Quitter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizJoinScreen;
