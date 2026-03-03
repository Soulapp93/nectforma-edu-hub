import React, { useState } from 'react';
import { quizService } from '@/services/quizService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import QuizGameOrchestrator from './QuizGameOrchestrator';
import { useQuizTheme, QUIZ_THEMES } from './QuizThemeProvider';
import QuizParticles from './QuizParticles';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Zap, LogIn } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const QuizJoinScreen: React.FC<Props> = ({ onClose }) => {
  const { userId } = useCurrentUser();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!pin.trim() || pin.length !== 6) {
      toast.error('Entrez un code PIN à 6 chiffres');
      return;
    }
    setLoading(true);
    try {
      const session = await quizService.getSessionByPin(pin);
      if (!session) {
        toast.error('Session introuvable ou terminée');
        return;
      }
      setSessionId(session.id);
    } catch {
      toast.error('Erreur connexion');
    } finally {
      setLoading(false);
    }
  };

  if (sessionId) {
    return <QuizGameOrchestrator sessionId={sessionId} isHost={false} onExit={onClose} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <QuizParticles count={20} />
      <div className="relative z-10 w-full max-w-sm space-y-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto shadow-2xl">
          <Zap className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-black text-white">Quiz Interactif</h1>
        <p className="text-white/70">Entrez le code PIN pour rejoindre</p>
        
        <div className="space-y-4">
          <Input
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="text-center text-3xl font-black tracking-[0.5em] py-6 bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-2xl"
            maxLength={6}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
          <Button onClick={handleJoin} disabled={loading || pin.length !== 6}
            className="w-full py-6 text-lg font-bold rounded-2xl gap-2"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>
            <LogIn className="h-5 w-5" />
            {loading ? 'Connexion...' : 'Rejoindre'}
          </Button>
        </div>

        <button onClick={onClose} className="text-white/50 text-sm hover:text-white/80 transition-colors">
          Retour
        </button>
      </div>
    </div>
  );
};

export default QuizJoinScreen;
