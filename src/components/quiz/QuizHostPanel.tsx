import React, { useState } from 'react';
import { useQuizTheme } from './QuizThemeProvider';
import { Quiz, QuizQuestion, QuizSession, QuizParticipant } from '@/services/quizService';
import QuizQRCodeModal from './QuizQRCodeModal';
import { 
  Play, SkipForward, BarChart3, Users, Trophy, Target, 
  Clock, Zap, StopCircle, ArrowLeft, Volume2, VolumeX,
  ChevronRight, QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  session: QuizSession;
  quiz: Quiz;
  questions: QuizQuestion[];
  participants: QuizParticipant[];
  currentQuestionIndex: number;
  phase: string;
  onStart: () => void;
  onNextQuestion: () => void;
  onShowLeaderboard: () => void;
  onEndGame: () => void;
  onExit: () => void;
}

const QuizHostPanel: React.FC<Props> = ({
  session, quiz, questions, participants, currentQuestionIndex,
  phase, onStart, onNextQuestion, onShowLeaderboard, onEndGame, onExit,
}) => {
  const theme = useQuizTheme();
  const [showQR, setShowQR] = useState(false);
  const sorted = [...participants].sort((a, b) => b.total_score - a.total_score);
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: theme.bgGradient }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 backdrop-blur-xl" style={{ background: theme.cardBg }}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onExit} className="rounded-xl text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-bold" style={{ color: theme.textColor }}>{quiz.title}</h2>
            <div className="flex items-center gap-2 text-sm" style={{ color: theme.textColor + '80' }}>
              <Badge variant="outline" className="border-white/20 text-white/80">PIN: {session.pin_code}</Badge>
              <Badge variant={session.status === 'waiting' ? 'secondary' : 'default'} className="gap-1">
                {session.status === 'waiting' ? '⏳ En attente' : 
                 session.status === 'question_active' ? '🔴 En cours' : 
                 session.status === 'showing_results' ? '📊 Résultats' : session.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: theme.primaryColor + '30' }}>
            <Users className="h-4 w-4" style={{ color: theme.primaryColor }} />
            <span className="font-bold" style={{ color: theme.textColor }}>{participants.length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* Main area */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Current question card */}
          {phase === 'lobby' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="text-6xl sm:text-8xl font-black tracking-[0.5em]" style={{ color: theme.primaryColor }}>
                  {session.pin_code}
                </div>
                <p className="text-lg" style={{ color: theme.textColor + '80' }}>
                  {participants.length} joueur{participants.length > 1 ? 's' : ''} connecté{participants.length > 1 ? 's' : ''}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setShowQR(true)}
                    variant="outline"
                    className="px-6 py-5 text-lg rounded-2xl gap-2 border-white/20 text-white hover:bg-white/10">
                    <QrCode className="h-5 w-5" /> QR Code
                  </Button>
                  <Button onClick={onStart} disabled={participants.length === 0}
                    className="px-8 py-5 text-xl font-black rounded-2xl gap-2"
                    style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, color: '#fff' }}>
                    <Play className="h-6 w-6" /> Commencer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {phase === 'question' && currentQuestion && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 sm:p-6 rounded-2xl flex-1 flex flex-col" style={{ background: theme.cardBg }}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <Badge className="gap-1 text-xs sm:text-sm" style={{ background: theme.primaryColor + '30', color: theme.textColor }}>
                    <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Question {currentQuestionIndex + 1}/{questions.length}
                  </Badge>
                  <Badge className="gap-1 text-xs" style={{ background: theme.accentColor + '30', color: theme.accentColor }}>
                    <Clock className="h-3 w-3" /> {currentQuestion.time_limit}s
                  </Badge>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black flex-1 flex items-center justify-center text-center leading-tight" style={{ color: theme.textColor }}>
                  {currentQuestion.title}
                </h3>
                {(currentQuestion.options || []).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-4">
                    {(currentQuestion.options || []).map((opt: any, i: number) => {
                      const colors = ['#E21B3C', '#1368CE', '#D89E00', '#26890C'];
                      return (
                        <div key={opt.id} className="p-2.5 sm:p-3 rounded-xl text-white font-medium flex items-center gap-2 text-sm sm:text-base"
                          style={{ background: colors[i % colors.length], opacity: opt.isCorrect ? 1 : 0.6 }}>
                          {opt.isCorrect && <span>✓</span>}
                          <span>{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Host controls */}
              <div className="flex gap-3 mt-4">
                {quiz.show_leaderboard_after_each && (
                  <Button onClick={onShowLeaderboard} className="flex-1 py-4 rounded-xl gap-2"
                    style={{ background: theme.accentColor, color: '#fff' }}>
                    <BarChart3 className="h-5 w-5" /> Classement
                  </Button>
                )}
                <Button onClick={onNextQuestion} className="flex-1 py-4 rounded-xl gap-2"
                  style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, color: '#fff' }}>
                  {currentQuestionIndex + 1 >= questions.length ? (
                    <><Trophy className="h-5 w-5" /> Terminer</>
                  ) : (
                    <><SkipForward className="h-5 w-5" /> Suivante</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {phase === 'leaderboard' && (
            <div className="flex-1 flex flex-col">
              <div className="p-6 rounded-2xl flex-1" style={{ background: theme.cardBg }}>
                <h3 className="text-xl font-bold mb-4" style={{ color: theme.textColor }}>🏆 Classement en direct</h3>
                <div className="space-y-2">
                  {sorted.slice(0, 10).map((p, i) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: i === 0 ? theme.accentColor + '20' : 'rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center gap-3">
                          <span className="font-bold w-8 text-center" style={{ color: theme.textColor }}>
                            {i < 3 ? medals[i] : `#${i + 1}`}
                          </span>
                          <span className="text-xl">{p.avatar_emoji || '😎'}</span>
                          <span className="font-medium" style={{ color: theme.textColor }}>{p.nickname || 'Joueur'}</span>
                        </div>
                        <span className="font-bold text-lg" style={{ color: theme.primaryColor }}>{p.total_score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Button onClick={onNextQuestion} className="mt-4 w-full py-4 rounded-xl gap-2"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, color: '#fff' }}>
                {currentQuestionIndex + 1 >= questions.length ? (
                  <><Trophy className="h-5 w-5" /> Voir le podium</>
                ) : (
                  <><ChevronRight className="h-5 w-5" /> Question suivante</>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar: participants */}
        <div className="w-full lg:w-72 rounded-2xl p-4 flex-shrink-0" style={{ background: theme.cardBg }}>
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: theme.textColor }}>
            <Users className="h-4 w-4" /> Joueurs ({participants.length})
          </h3>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {sorted.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-lg">{p.avatar_emoji || '😎'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: theme.textColor }}>{p.nickname || 'Joueur'}</p>
                    <p className="text-xs" style={{ color: theme.textColor + '60' }}>{p.total_score} pts</p>
                  </div>
                  {p.current_streak >= 3 && (
                    <span className="text-xs" style={{ color: theme.accentColor }}>🔥{p.current_streak}</span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {phase !== 'lobby' && (
            <Button onClick={onEndGame} variant="ghost"
              className="w-full mt-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1">
              <StopCircle className="h-4 w-4" /> Terminer
            </Button>
          )}
        </div>
      </div>
      <QuizQRCodeModal open={showQR} onOpenChange={setShowQR} pinCode={session.pin_code} />
    </div>
  );
};

export default QuizHostPanel;
