import React, { useState, useEffect, useRef } from 'react';
import { useQuizTheme } from './QuizThemeProvider';
import { useQuizAudio } from './QuizAudioManager';
import QuizCircularTimer from './QuizCircularTimer';
import QuizParticles from './QuizParticles';
import { QuizQuestion } from '@/services/quizService';
import { Zap, Shield, Clock as ClockIcon } from 'lucide-react';

const OPTION_COLORS = ['#E21B3C', '#1368CE', '#D89E00', '#26890C', '#9B59B6', '#E67E22', '#1ABC9C', '#E74C3C'];
const OPTION_SHAPES = ['▲', '◆', '●', '■', '★', '⬡', '⬟', '⬢'];

interface Props {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  timeLimit: number;
  onAnswer: (answerData: any) => void;
  showResult?: { isCorrect: boolean; correctAnswer?: any; pointsEarned: number; streak: number } | null;
  powerUps?: { doublePoints: boolean; freeze: boolean; extraTime: boolean };
  onUsePowerUp?: (type: string) => void;
}

const QuizQuestionView: React.FC<Props> = ({
  question, questionIndex, totalQuestions, timeLimit,
  onAnswer, showResult, powerUps, onUsePowerUp,
}) => {
  const theme = useQuizTheme();
  const audio = useQuizAudio();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');
  const [sliderValue, setSliderValue] = useState(50);
  const [timerRunning, setTimerRunning] = useState(true);
  const startTime = useRef(Date.now());

  useEffect(() => {
    setSelectedOption(null);
    setAnswered(false);
    setTextAnswer('');
    setSliderValue(50);
    setTimerRunning(true);
    startTime.current = Date.now();
  }, [question.id]);

  useEffect(() => {
    if (showResult) {
      setTimerRunning(false);
      if (showResult.isCorrect) {
        audio.sounds.correctAnswer();
        if (showResult.streak >= 3) {
          setTimeout(() => audio.sounds.streakBonus(), 500);
        }
      } else {
        audio.sounds.wrongAnswer();
      }
    }
  }, [showResult]);

  const handleOptionClick = (optionId: string) => {
    if (answered || showResult) return;
    setSelectedOption(optionId);
    setAnswered(true);
    setTimerRunning(false);
    const timeTaken = Date.now() - startTime.current;
    onAnswer({ selectedOptionId: optionId, timeTakenMs: timeTaken });
  };

  const handleTextSubmit = () => {
    if (answered || !textAnswer.trim()) return;
    setAnswered(true);
    setTimerRunning(false);
    const timeTaken = Date.now() - startTime.current;
    onAnswer({ text: textAnswer, timeTakenMs: timeTaken });
  };

  const handleSliderSubmit = () => {
    if (answered) return;
    setAnswered(true);
    setTimerRunning(false);
    const timeTaken = Date.now() - startTime.current;
    onAnswer({ value: sliderValue, timeTakenMs: timeTaken });
  };

  const handleTimeUp = () => {
    if (!answered) {
      setAnswered(true);
      onAnswer({ timeout: true, timeTakenMs: timeLimit * 1000 });
    }
  };

  const getOptionStyle = (opt: any, index: number) => {
    const color = OPTION_COLORS[index % OPTION_COLORS.length];
    const isSelected = selectedOption === opt.id;
    const isCorrectOpt = showResult && opt.isCorrect;
    const isWrongSelected = showResult && isSelected && !showResult.isCorrect;

    if (isCorrectOpt) return { background: theme.correctColor, transform: 'scale(1.02)', boxShadow: `0 0 30px ${theme.correctColor}60` };
    if (isWrongSelected) return { background: theme.wrongColor, transform: 'scale(0.98)', opacity: 0.8 };
    if (showResult && !opt.isCorrect) return { background: color, opacity: 0.3 };
    if (isSelected) return { background: color, transform: 'scale(1.02)', boxShadow: `0 0 20px ${color}60` };
    return { background: color };
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: theme.bgGradient }}>
      <QuizParticles count={15} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: theme.cardBg, color: theme.textColor }}>
            {questionIndex + 1} / {totalQuestions}
          </span>
        </div>
        <QuizCircularTimer duration={timeLimit} isRunning={timerRunning} onTimeUp={handleTimeUp} size={80} />
        {/* Power-ups */}
        {powerUps && !answered && (
          <div className="flex gap-2">
            {powerUps.doublePoints && (
              <button onClick={() => onUsePowerUp?.('double_points')}
                className="p-2 rounded-xl transition-all hover:scale-110 active:scale-95"
                style={{ background: theme.accentColor + '30' }}>
                <Zap className="h-5 w-5" style={{ color: theme.accentColor }} />
              </button>
            )}
            {powerUps.extraTime && (
              <button onClick={() => onUsePowerUp?.('extra_time')}
                className="p-2 rounded-xl transition-all hover:scale-110 active:scale-95"
                style={{ background: '#3B82F6' + '30' }}>
                <ClockIcon className="h-5 w-5 text-blue-400" />
              </button>
            )}
            {powerUps.freeze && (
              <button onClick={() => onUsePowerUp?.('freeze')}
                className="p-2 rounded-xl transition-all hover:scale-110 active:scale-95"
                style={{ background: '#06B6D4' + '30' }}>
                <Shield className="h-5 w-5 text-cyan-400" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Question text */}
      <div className="relative z-10 px-4 py-6 text-center flex-shrink-0">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight"
          style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>
          {question.title}
        </h2>
        {question.description && (
          <p className="mt-2 text-sm opacity-70" style={{ color: theme.textColor }}>{question.description}</p>
        )}
        {question.image_url && (
          <img src={question.image_url} alt="" className="mt-4 mx-auto max-h-48 rounded-2xl object-cover" />
        )}
      </div>

      {/* Result overlay */}
      {showResult && (
        <div className="relative z-20 mx-4 mb-4 p-4 rounded-2xl text-center animate-scale-in backdrop-blur-xl"
          style={{ background: showResult.isCorrect ? theme.correctColor + '20' : theme.wrongColor + '20' }}>
          <span className="text-4xl">{showResult.isCorrect ? '✅' : '❌'}</span>
          <p className="text-lg font-bold mt-1" style={{ color: theme.textColor }}>
            {showResult.isCorrect ? 'Correct !' : 'Raté !'}
          </p>
          <p className="text-2xl font-black" style={{ color: showResult.isCorrect ? theme.correctColor : theme.wrongColor }}>
            +{showResult.pointsEarned} pts
          </p>
          {showResult.streak >= 3 && (
            <div className="mt-1 inline-flex items-center gap-1 px-3 py-1 rounded-full animate-pulse"
              style={{ background: theme.accentColor + '30', color: theme.accentColor }}>
              🔥 Streak x{showResult.streak}
            </div>
          )}
        </div>
      )}

      {/* Answer area */}
      <div className="relative z-10 flex-1 px-4 pb-6 flex flex-col justify-end">
        {/* MCQ / True-False */}
        {(question.question_type === 'mcq' || question.question_type === 'true_false') && (
          <div className={`grid gap-3 ${(question.options || []).length <= 2 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {(question.options || []).map((opt: any, i: number) => (
              <button
                key={opt.id}
                onClick={() => handleOptionClick(opt.id)}
                disabled={answered}
                className={`relative p-4 sm:p-5 rounded-2xl text-white font-bold text-base sm:text-lg transition-all duration-300 ${
                  !answered ? 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer' : ''
                }`}
                style={getOptionStyle(opt, i)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl opacity-60">{OPTION_SHAPES[i % OPTION_SHAPES.length]}</span>
                  <span className="flex-1 text-left">{opt.text}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Open text / Fill blank */}
        {(question.question_type === 'open_text' || question.question_type === 'fill_blank') && (
          <div className="space-y-3">
            <input
              value={textAnswer}
              onChange={e => setTextAnswer(e.target.value)}
              disabled={answered}
              placeholder="Ta réponse..."
              className="w-full px-5 py-4 rounded-2xl text-lg font-bold bg-white/10 border-2 border-white/20 focus:outline-none focus:ring-2"
              style={{ color: theme.textColor }}
              onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
            />
            {!answered && (
              <button onClick={handleTextSubmit}
                className="w-full py-4 rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, color: '#fff' }}>
                Valider ✓
              </button>
            )}
          </div>
        )}

        {/* Slider */}
        {question.question_type === 'slider' && (
          <div className="space-y-4 p-5 rounded-2xl" style={{ background: theme.cardBg }}>
            <div className="text-center">
              <span className="text-4xl font-black" style={{ color: theme.primaryColor }}>{sliderValue}</span>
            </div>
            <input
              type="range"
              min={question.slider_min}
              max={question.slider_max}
              value={sliderValue}
              onChange={e => setSliderValue(Number(e.target.value))}
              disabled={answered}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: theme.primaryColor }}
            />
            <div className="flex justify-between text-sm opacity-60" style={{ color: theme.textColor }}>
              <span>{question.slider_min}</span>
              <span>{question.slider_max}</span>
            </div>
            {!answered && (
              <button onClick={handleSliderSubmit}
                className="w-full py-4 rounded-2xl font-bold text-lg transition-all hover:scale-[1.02]"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, color: '#fff' }}>
                Valider ✓
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizQuestionView;
