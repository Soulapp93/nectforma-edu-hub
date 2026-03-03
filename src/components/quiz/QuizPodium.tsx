import React, { useEffect, useState } from 'react';
import { useQuizTheme } from './QuizThemeProvider';
import { useQuizAudio } from './QuizAudioManager';
import QuizParticles from './QuizParticles';
import { QuizParticipant } from '@/services/quizService';
import { Trophy, Star, Target } from 'lucide-react';

interface Props {
  participants: QuizParticipant[];
  totalQuestions: number;
  onClose: () => void;
}

const QuizPodium: React.FC<Props> = ({ participants, totalQuestions, onClose }) => {
  const theme = useQuizTheme();
  const audio = useQuizAudio();
  const [phase, setPhase] = useState<'drumroll' | 'reveal3' | 'reveal2' | 'reveal1' | 'celebrate'>('drumroll');
  const [showConfetti, setShowConfetti] = useState(false);

  const sorted = [...participants].sort((a, b) => b.total_score - a.total_score);
  const top3 = sorted.slice(0, 3);

  useEffect(() => {
    audio.sounds.podiumDrumroll();

    const timers = [
      setTimeout(() => setPhase('reveal3'), 2000),
      setTimeout(() => setPhase('reveal2'), 3500),
      setTimeout(() => { setPhase('reveal1'); audio.sounds.victory(); }, 5000),
      setTimeout(() => { setPhase('celebrate'); setShowConfetti(true); }, 6000),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const podiumHeights = ['h-32 sm:h-40', 'h-44 sm:h-56', 'h-24 sm:h-32'];
  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd

  const isRevealed = (rank: number) => {
    if (phase === 'reveal3') return rank === 2;
    if (phase === 'reveal2') return rank <= 2;
    if (phase === 'reveal1' || phase === 'celebrate') return true;
    return false;
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{ background: theme.bgGradient }}>
      
      {showConfetti && <QuizParticles count={100} type="confetti" />}
      <QuizParticles count={20} />

      <div className="relative z-10 w-full max-w-lg mx-auto">
        {/* Title */}
        <div className={`text-center mb-8 transition-all duration-700 ${phase === 'celebrate' ? 'animate-scale-in' : ''}`}>
          <Trophy className="h-12 w-12 mx-auto mb-3" style={{ color: theme.accentColor, filter: `drop-shadow(0 0 20px ${theme.accentColor})` }} />
          <h1 className="text-3xl sm:text-4xl font-black" style={{ color: theme.textColor }}>Résultats</h1>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-3 sm:gap-6 mb-8">
          {podiumOrder.map((rank) => {
            const player = top3[rank];
            if (!player) return <div key={rank} className="flex-1" />;
            const revealed = isRevealed(rank);
            const medals = ['🥇', '🥈', '🥉'];
            const accuracy = player.total_answered > 0 
              ? Math.round((player.correct_answers / player.total_answered) * 100) 
              : 0;

            return (
              <div key={rank} className={`flex-1 flex flex-col items-center transition-all duration-700 ${
                revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}>
                {/* Player card */}
                <div className={`mb-3 text-center transition-all duration-500 ${
                  phase === 'celebrate' && rank === 0 ? 'animate-pulse' : ''
                }`}>
                  <div className={`text-4xl sm:text-5xl mb-1 ${rank === 0 ? 'animate-bounce' : ''}`}>
                    {player.avatar_emoji || '😎'}
                  </div>
                  <span className="text-3xl">{medals[rank]}</span>
                  <p className="font-bold text-sm sm:text-base mt-1 truncate max-w-[120px]" style={{ color: theme.textColor }}>
                    {player.nickname || 'Joueur'}
                  </p>
                  <p className="text-lg sm:text-xl font-black" style={{ color: theme.primaryColor }}>
                    {player.total_score} pts
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Target className="h-3 w-3" style={{ color: theme.textColor + '80' }} />
                    <span className="text-xs" style={{ color: theme.textColor + '80' }}>{accuracy}%</span>
                    {player.best_streak >= 3 && (
                      <>
                        <Star className="h-3 w-3 ml-1" style={{ color: theme.accentColor }} />
                        <span className="text-xs" style={{ color: theme.accentColor }}>x{player.best_streak}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Podium bar */}
                <div
                  className={`w-full ${podiumHeights[rank]} rounded-t-2xl transition-all duration-700`}
                  style={{
                    background: rank === 0
                      ? `linear-gradient(to top, ${theme.accentColor}, ${theme.accentColor}80)`
                      : rank === 1
                        ? `linear-gradient(to top, ${theme.primaryColor}80, ${theme.primaryColor}40)`
                        : `linear-gradient(to top, ${theme.secondaryColor}60, ${theme.secondaryColor}30)`,
                    boxShadow: rank === 0 ? `0 0 40px ${theme.accentColor}40` : 'none',
                    transform: revealed ? 'scaleY(1)' : 'scaleY(0)',
                    transformOrigin: 'bottom',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Full leaderboard */}
        {phase === 'celebrate' && sorted.length > 3 && (
          <div className="space-y-2 animate-fade-in max-h-48 overflow-auto">
            {sorted.slice(3).map((p, i) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: theme.cardBg }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold opacity-60 w-6 text-center" style={{ color: theme.textColor }}>
                    #{i + 4}
                  </span>
                  <span className="text-lg">{p.avatar_emoji || '😎'}</span>
                  <span className="font-medium text-sm" style={{ color: theme.textColor }}>{p.nickname || 'Joueur'}</span>
                </div>
                <span className="font-bold" style={{ color: theme.primaryColor }}>{p.total_score}</span>
              </div>
            ))}
          </div>
        )}

        {/* Close button */}
        {phase === 'celebrate' && (
          <button onClick={onClose}
            className="w-full mt-6 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] animate-fade-in"
            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, color: '#fff' }}>
            Terminer 🎉
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizPodium;
