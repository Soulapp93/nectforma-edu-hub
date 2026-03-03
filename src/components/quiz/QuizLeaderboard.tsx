import React, { useEffect, useState } from 'react';
import { useQuizTheme } from './QuizThemeProvider';
import { useQuizAudio } from './QuizAudioManager';
import { QuizParticipant } from '@/services/quizService';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  participants: QuizParticipant[];
  previousRanks?: Record<string, number>;
  questionIndex: number;
  autoAdvance?: number; // auto advance after X ms
  onAdvance: () => void;
}

const QuizLeaderboard: React.FC<Props> = ({ participants, previousRanks, questionIndex, autoAdvance = 5000, onAdvance }) => {
  const theme = useQuizTheme();
  const audio = useQuizAudio();
  const [visibleCount, setVisibleCount] = useState(0);
  const top5 = [...participants].sort((a, b) => b.total_score - a.total_score).slice(0, 5);

  useEffect(() => {
    audio.sounds.leaderboardReveal();
    // Animate entries one by one
    const timers: NodeJS.Timeout[] = [];
    top5.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), (i + 1) * 300));
    });

    // Auto advance
    const advanceTimer = setTimeout(onAdvance, autoAdvance);
    return () => { timers.forEach(clearTimeout); clearTimeout(advanceTimer); };
  }, [questionIndex]);

  const getRankChange = (participantId: string, currentRank: number): 'up' | 'down' | 'same' => {
    if (!previousRanks || previousRanks[participantId] === undefined) return 'same';
    const prev = previousRanks[participantId];
    if (currentRank < prev) return 'up';
    if (currentRank > prev) return 'down';
    return 'same';
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{ background: theme.bgGradient }}>

      <div className="relative z-10 w-full max-w-md mx-auto">
        <h2 className="text-center text-2xl font-black mb-6" style={{ color: theme.textColor }}>
          🏆 Classement
        </h2>

        <div className="space-y-3">
          {top5.map((p, i) => {
            const rank = i + 1;
            const change = getRankChange(p.id, rank);
            const isVisible = i < visibleCount;
            const medals = ['🥇', '🥈', '🥉'];

            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-4 rounded-2xl transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                } ${rank <= 3 ? 'scale-[1.02]' : ''}`}
                style={{
                  background: rank === 1 ? `linear-gradient(135deg, ${theme.accentColor}30, ${theme.primaryColor}20)` : theme.cardBg,
                  border: rank === 1 ? `2px solid ${theme.accentColor}50` : '1px solid transparent',
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                {/* Rank */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg"
                  style={{
                    background: rank <= 3 ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` : 'rgba(255,255,255,0.1)',
                    color: rank <= 3 ? '#fff' : theme.textColor,
                  }}>
                  {rank <= 3 ? medals[rank - 1] : rank}
                </div>

                {/* Player info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{p.avatar_emoji || '😎'}</span>
                    <span className="font-bold truncate" style={{ color: theme.textColor }}>{p.nickname || 'Joueur'}</span>
                  </div>
                  {p.current_streak >= 3 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: theme.accentColor + '30', color: theme.accentColor }}>
                      🔥 Streak x{p.current_streak}
                    </span>
                  )}
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className="text-xl font-black" style={{ color: theme.primaryColor }}>{p.total_score}</p>
                  <div className="flex items-center justify-end gap-1">
                    {change === 'up' && <TrendingUp className="h-3 w-3 text-green-400" />}
                    {change === 'down' && <TrendingDown className="h-3 w-3 text-red-400" />}
                    {change === 'same' && <Minus className="h-3 w-3 text-gray-400" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-[5000ms] ease-linear"
            style={{ background: theme.primaryColor, width: '100%', animation: `shrink ${autoAdvance}ms linear forwards` }} />
        </div>
        <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
      </div>
    </div>
  );
};

export default QuizLeaderboard;
