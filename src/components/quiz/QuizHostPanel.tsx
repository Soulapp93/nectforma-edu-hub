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
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: theme.bgGradient }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 backdrop-blur-xl shrink-0" style={{ background: theme.cardBg }}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onExit} className="rounded-xl text-white hover:bg-white/10 shrink-0 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="font-bold text-sm sm:text-base truncate" style={{ color: theme.textColor }}>{quiz.title}</h2>
            <div className="flex items-center gap-1.5 text-xs">
              <Badge variant="outline" className="border-white/20 text-white/80 text-[10px] px-1.5 py-0">PIN: {session.pin_code}</Badge>
              <Badge variant={session.status === 'waiting' ? 'secondary' : 'default'} className="gap-0.5 text-[10px] px-1.5 py-0">
                {session.status === 'waiting' ? '⏳ Attente' : 
                 session.status === 'question_active' ? '🔴 En cours' : 
                 session.status === 'showing_results' ? '📊 Résultats' : session.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full shrink-0" style={{ background: theme.primaryColor + '30' }}>
          <Users className="h-3.5 w-3.5" style={{ color: theme.primaryColor }} />
          <span className="font-bold text-sm" style={{ color: theme.textColor }}>{participants.length}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 sm:p-4 overflow-hidden min-h-0">
        {/* Main area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Lobby */}
          {phase === 'lobby' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 sm:space-y-6">
                <div className="text-4xl sm:text-6xl md:text-8xl font-black tracking-[0.3em] sm:tracking-[0.5em]" style={{ color: theme.primaryColor }}>
                  {session.pin_code}
                </div>
                <p className="text-sm sm:text-lg" style={{ color: theme.textColor + '80' }}>
                  {participants.length} joueur{participants.length > 1 ? 's' : ''} connecté{participants.length > 1 ? 's' : ''}
                </p>
                <div className="flex gap-2 sm:gap-3 justify-center">
                  <Button onClick={() => setShowQR(true)}
                    variant="outline" size="sm"
                    className="px-3 sm:px-6 py-2 sm:py-5 text-sm sm:text-lg rounded-xl sm:rounded-2xl gap-1.5 border-white/20 text-white hover:bg-white/10">
                    <QrCode className="h-4 w-4 sm:h-5 sm:w-5" /> QR Code
                  </Button>
                  <Button onClick={onStart} disabled={participants.length === 0} size="sm"
                    className="px-4 sm:px-8 py-2 sm:py-5 text-sm sm:text-xl font-black rounded-xl sm:rounded-2xl gap-1.5"
                    style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, color: '#fff' }}>
                    <Play className="h-4 w-4 sm:h-6 sm:w-6" /> Commencer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Question phase */}
          {phase === 'question' && currentQuestion && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-3 sm:p-4 rounded-2xl flex-1 flex flex-col min-h-0" style={{ background: theme.cardBg }}>
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <Badge className="gap-1 text-xs" style={{ background: theme.primaryColor + '30', color: theme.textColor }}>
                    <Target className="h-3 w-3" /> Question {currentQuestionIndex + 1}/{questions.length}
                  </Badge>
                  <Badge className="gap-1 text-xs" style={{ background: theme.accentColor + '30', color: theme.accentColor }}>
                    <Clock className="h-3 w-3" /> {currentQuestion.time_limit}s
                  </Badge>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black flex items-center justify-center text-center leading-tight py-2 sm:py-4" style={{ color: theme.textColor }}>
                  {currentQuestion.title}
                </h3>
                {(currentQuestion.options || []).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-auto shrink-0">
                    {(currentQuestion.options || []).map((opt: any, i: number) => {
                      const colors = ['#E21B3C', '#1368CE', '#D89E00', '#26890C'];
                      return (
                        <div key={opt.id} className="p-2 sm:p-2.5 rounded-xl text-white font-medium flex items-center gap-2 text-xs sm:text-sm"
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
              <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-3 shrink-0">
                {quiz.show_leaderboard_after_each && (
                  <Button onClick={onShowLeaderboard} className="flex-1 py-2.5 sm:py-3 rounded-xl gap-1.5 text-sm"
                    style={{ background: theme.accentColor, color: '#fff' }}>
                    <BarChart3 className="h-4 w-4" /> Classement
                  </Button>
                )}
                <Button onClick={onNextQuestion} className="flex-1 py-2.5 sm:py-3 rounded-xl gap-1.5 text-sm"
                  style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, color: '#fff' }}>
                  {currentQuestionIndex + 1 >= questions.length ? (
                    <><Trophy className="h-4 w-4" /> Terminer</>
                  ) : (
                    <><SkipForward className="h-4 w-4" /> Suivante</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Leaderboard phase */}
          {phase === 'leaderboard' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 sm:p-6 rounded-2xl" style={{ background: theme.cardBg }}>
                  <h3 className="text-lg font-bold mb-3" style={{ color: theme.textColor }}>🏆 Classement en direct</h3>
                  <div className="space-y-2">
                    {sorted.slice(0, 10).map((p, i) => {
                      const medals = ['🥇', '🥈', '🥉'];
                      return (
                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl"
                          style={{ background: i === 0 ? theme.accentColor + '20' : 'rgba(255,255,255,0.05)' }}>
                          <div className="flex items-center gap-2">
                            <span className="font-bold w-7 text-center text-sm" style={{ color: theme.textColor }}>
                              {i < 3 ? medals[i] : `#${i + 1}`}
                            </span>
                            <span className="text-lg">{p.avatar_emoji || '😎'}</span>
                            <span className="font-medium text-sm" style={{ color: theme.textColor }}>{p.nickname || 'Joueur'}</span>
                          </div>
                          <span className="font-bold" style={{ color: theme.primaryColor }}>{p.total_score}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
              <Button onClick={onNextQuestion} className="mt-2 sm:mt-3 w-full py-2.5 sm:py-3 rounded-xl gap-1.5 shrink-0 text-sm"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, color: '#fff' }}>
                {currentQuestionIndex + 1 >= questions.length ? (
                  <><Trophy className="h-4 w-4" /> Voir le podium</>
                ) : (
                  <><ChevronRight className="h-4 w-4" /> Question suivante</>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar: participants */}
        <div className="w-full lg:w-64 rounded-2xl p-3 flex flex-col shrink-0 max-h-[30vh] lg:max-h-none" style={{ background: theme.cardBg }}>
          <h3 className="font-bold mb-2 flex items-center gap-2 text-sm shrink-0" style={{ color: theme.textColor }}>
            <Users className="h-3.5 w-3.5" /> Joueurs ({participants.length})
          </h3>
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-1.5">
              {sorted.map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-base">{p.avatar_emoji || '😎'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: theme.textColor }}>{p.nickname || 'Joueur'}</p>
                    <p className="text-[10px]" style={{ color: theme.textColor + '60' }}>{p.total_score} pts</p>
                  </div>
                  {p.current_streak >= 3 && (
                    <span className="text-[10px]" style={{ color: theme.accentColor }}>🔥{p.current_streak}</span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {phase !== 'lobby' && (
            <Button onClick={onEndGame} variant="ghost" size="sm"
              className="w-full mt-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1 shrink-0">
              <StopCircle className="h-3.5 w-3.5" /> Terminer
            </Button>
          )}
        </div>
      </div>
      <QuizQRCodeModal open={showQR} onOpenChange={setShowQR} pinCode={session.pin_code} />
    </div>
  );
};

export default QuizHostPanel;
