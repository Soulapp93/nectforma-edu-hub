import { logger } from '@/utils/logger';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { quizService, Quiz, QuizQuestion, QuizSession, QuizParticipant, QuizAnswer } from '@/services/quizService';
import { QuizThemeProvider, QUIZ_THEMES } from './QuizThemeProvider';
import { useQuizAudio } from './QuizAudioManager';
import QuizLobby from './QuizLobby';
import QuizQuestionView from './QuizQuestionView';
import QuizLeaderboard from './QuizLeaderboard';
import QuizPodium from './QuizPodium';
import QuizHostPanel from './QuizHostPanel';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';

type GamePhase = 'lobby' | 'countdown' | 'question' | 'leaderboard' | 'podium';

interface Props {
  sessionId: string;
  isHost: boolean;
  onExit: () => void;
}

const QuizGameOrchestrator: React.FC<Props> = ({ sessionId, isHost, onExit }) => {
  const { userId } = useCurrentUser();
  const audio = useQuizAudio();

  const [session, setSession] = useState<QuizSession | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [myParticipant, setMyParticipant] = useState<QuizParticipant | null>(null);
  const [answerResult, setAnswerResult] = useState<any>(null);
  const [previousRanks, setPreviousRanks] = useState<Record<string, number>>({});
  const [nickname, setNickname] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😎');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [countdown, setCountdown] = useState(0);

  // Load initial data
  useEffect(() => {
    const load = async () => {
      try {
        const s = await quizService.getSession(sessionId);
        setSession(s);
        const [q, qs, ps] = await Promise.all([
          quizService.getQuiz(s.quiz_id),
          quizService.getQuestions(s.quiz_id),
          quizService.getParticipants(sessionId),
        ]);
        setQuiz(q);
        setQuestions(qs);
        setParticipants(ps);

        // Find my participant
        if (!isHost && userId) {
          const me = ps.find(p => p.user_id === userId);
          if (me) setMyParticipant(me);
        }

        // Restore phase from session status
        if (s.status === 'question_active') {
          setPhase('question');
          setCurrentQuestionIndex(s.current_question_index);
        } else if (s.status === 'showing_results') {
          setPhase('leaderboard');
          setCurrentQuestionIndex(s.current_question_index);
        } else if (s.status === 'finished') {
          setPhase('podium');
        }
      } catch (err) {
        logger.error(err);
        toast.error('Erreur chargement session');
      }
    };
    load();
  }, [sessionId, userId, isHost]);

  // Realtime subscriptions
  useEffect(() => {
    const sessionSub = quizService.subscribeToSession(sessionId, (payload: any) => {
      const newSession = payload.new as QuizSession;
      setSession(newSession);

      if (newSession.status === 'question_active') {
        setCurrentQuestionIndex(newSession.current_question_index);
        setAnswerResult(null);
        setPhase('question');
      } else if (newSession.status === 'showing_results') {
        setPhase('leaderboard');
      } else if (newSession.status === 'finished') {
        setPhase('podium');
      }
    });

    const participantSub = quizService.subscribeToParticipants(sessionId, (payload: any) => {
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
  }, [sessionId]);

  // Join session (non-host)
  const joinGame = useCallback(async () => {
    if (!userId || isHost || myParticipant) return;
    try {
      const p = await quizService.joinSession(sessionId, userId, nickname || undefined, selectedEmoji);
      setMyParticipant(p);
      toast.success('Connecté !');
    } catch (err: any) {
      if (err?.code === '23505') {
        // Already joined
        const ps = await quizService.getParticipants(sessionId);
        const me = ps.find(p => p.user_id === userId);
        if (me) setMyParticipant(me);
      } else {
        toast.error('Erreur connexion');
      }
    }
  }, [userId, isHost, myParticipant, sessionId, nickname, selectedEmoji]);

  // Host: start game
  const startGame = useCallback(async () => {
    if (!isHost || !session) return;
    try {
      // Countdown
      setPhase('countdown');
      setCountdown(3);
      audio.sounds.countdown();

      await new Promise(resolve => {
        let c = 3;
        const interval = setInterval(() => {
          c--;
          setCountdown(c);
          if (c <= 0) { clearInterval(interval); resolve(null); }
        }, 1000);
      });

      await quizService.updateSession(session.id, {
        status: 'question_active',
        current_question_index: 0,
        current_question_started_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
      });
    } catch { toast.error('Erreur démarrage'); }
  }, [isHost, session, audio]);

  // Host: next question
  const nextQuestion = useCallback(async () => {
    if (!isHost || !session) return;
    const nextIdx = currentQuestionIndex + 1;

    // Save current ranks for comparison
    const ranks: Record<string, number> = {};
    [...participants].sort((a, b) => b.total_score - a.total_score).forEach((p, i) => {
      ranks[p.id] = i + 1;
    });
    setPreviousRanks(ranks);

    if (nextIdx >= questions.length) {
      // Game over
      await quizService.updateSession(session.id, { status: 'finished', finished_at: new Date().toISOString() });
    } else {
      await quizService.updateSession(session.id, {
        status: 'question_active',
        current_question_index: nextIdx,
        current_question_started_at: new Date().toISOString(),
      });
    }
  }, [isHost, session, currentQuestionIndex, questions.length, participants]);

  // Host: show leaderboard
  const showLeaderboard = useCallback(async () => {
    if (!isHost || !session) return;
    await quizService.updateSession(session.id, { status: 'showing_results' });
  }, [isHost, session]);

  // Player: submit answer
  const handleAnswer = useCallback(async (answerData: any) => {
    if (!myParticipant || !session || !quiz) return;
    const question = questions[currentQuestionIndex];
    if (!question) return;

    const isCorrect = answerData.timeout ? false : quizService.checkAnswer(question, answerData);
    const { points, newStreak } = quizService.calculatePoints(
      isCorrect,
      answerData.timeTakenMs || 0,
      question.time_limit * 1000,
      question.points,
      quiz.bonus_speed_points,
      myParticipant.current_streak,
      quiz.streak_bonus_enabled,
    );

    setAnswerResult({
      isCorrect,
      pointsEarned: points,
      streak: newStreak,
    });

    try {
      await quizService.submitAnswer({
        session_id: session.id,
        question_id: question.id,
        participant_id: myParticipant.id,
        answer_data: answerData,
        is_correct: isCorrect,
        points_earned: points,
        time_taken_ms: answerData.timeTakenMs || null,
        streak_at_time: newStreak,
      });

      await quizService.updateParticipant(myParticipant.id, {
        total_score: myParticipant.total_score + points,
        current_streak: newStreak,
        best_streak: Math.max(myParticipant.best_streak, newStreak),
        correct_answers: myParticipant.correct_answers + (isCorrect ? 1 : 0),
        total_answered: myParticipant.total_answered + 1,
      });

      // Update local
      setMyParticipant(prev => prev ? {
        ...prev,
        total_score: prev.total_score + points,
        current_streak: newStreak,
        best_streak: Math.max(prev.best_streak, newStreak),
        correct_answers: prev.correct_answers + (isCorrect ? 1 : 0),
        total_answered: prev.total_answered + 1,
      } : null);
    } catch (err) {
      logger.error('Error submitting answer:', err);
    }
  }, [myParticipant, session, quiz, questions, currentQuestionIndex]);

  if (!session || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const themePreset = quiz.theme_preset || 'classique';
  const customConfig = quiz.primary_color || quiz.secondary_color ? {
    primaryColor: quiz.primary_color,
    secondaryColor: quiz.secondary_color,
    fontFamily: quiz.font_family,
  } : undefined;

  return (
    <QuizThemeProvider themeId={themePreset} customConfig={customConfig}>
      {/* Host view */}
      {isHost && phase !== 'podium' && phase !== 'countdown' && (
        <QuizHostPanel
          session={session}
          quiz={quiz}
          questions={questions}
          participants={participants}
          currentQuestionIndex={currentQuestionIndex}
          phase={phase}
          onStart={startGame}
          onNextQuestion={nextQuestion}
          onShowLeaderboard={showLeaderboard}
          onEndGame={async () => {
            await quizService.updateSession(session.id, { status: 'finished', finished_at: new Date().toISOString() });
          }}
          onExit={onExit}
        />
      )}

      {/* Player view */}
      {!isHost && (
        <>
          {phase === 'lobby' && (
            <>
              <QuizLobby
                session={session}
                participants={participants}
                isHost={false}
                quizTitle={quiz.title}
                onStart={() => {}}
                onSelectEmoji={setSelectedEmoji}
                onSetNickname={setNickname}
                selectedEmoji={selectedEmoji}
                nickname={nickname}
                audioEnabled={audioEnabled}
                onToggleAudio={() => setAudioEnabled(!audioEnabled)}
              />
              {!myParticipant && (
                <div className="fixed bottom-6 left-4 right-4 z-50">
                  <button onClick={joinGame}
                    className="w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
                    Rejoindre la partie 🎮
                  </button>
                </div>
              )}
            </>
          )}

          {phase === 'countdown' && (
            <div className="min-h-screen flex items-center justify-center"
              style={{ background: QUIZ_THEMES[themePreset]?.bgGradient || QUIZ_THEMES.classique.bgGradient }}>
              <div className="text-center animate-scale-in">
                <span className="text-9xl font-black text-white animate-pulse">{countdown || '🚀'}</span>
              </div>
            </div>
          )}

          {phase === 'question' && questions[currentQuestionIndex] && (
            <QuizQuestionView
              question={questions[currentQuestionIndex]}
              questionIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              timeLimit={questions[currentQuestionIndex].time_limit}
              onAnswer={handleAnswer}
              showResult={answerResult}
            />
          )}

          {phase === 'leaderboard' && (
            <QuizLeaderboard
              participants={participants}
              previousRanks={previousRanks}
              questionIndex={currentQuestionIndex}
              onAdvance={() => {}} // Host controls advancement
            />
          )}

          {phase === 'podium' && (
            <QuizPodium
              participants={participants}
              totalQuestions={questions.length}
              onClose={onExit}
            />
          )}
        </>
      )}

      {/* Host podium view */}
      {isHost && phase === 'podium' && (
        <QuizPodium
          participants={participants}
          totalQuestions={questions.length}
          onClose={onExit}
        />
      )}

      {/* Host countdown view */}
      {isHost && phase === 'countdown' && (
        <div className="min-h-screen flex items-center justify-center"
          style={{ background: QUIZ_THEMES[themePreset]?.bgGradient || QUIZ_THEMES.classique.bgGradient }}>
          <div className="text-center animate-scale-in">
            <span className="text-9xl font-black text-white animate-pulse">{countdown || '🚀'}</span>
          </div>
        </div>
      )}
    </QuizThemeProvider>
  );
};

export default QuizGameOrchestrator;
