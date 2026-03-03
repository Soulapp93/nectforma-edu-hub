import React, { useEffect, useState, useRef } from 'react';
import { useQuizTheme } from './QuizThemeProvider';
import { useQuizAudio } from './QuizAudioManager';

interface Props {
  duration: number; // seconds
  isRunning: boolean;
  onTimeUp: () => void;
  size?: number;
}

const QuizCircularTimer: React.FC<Props> = ({ duration, isRunning, onTimeUp, size = 120 }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const theme = useQuizTheme();
  const audio = useQuizAudio();
  const intervalRef = useRef<NodeJS.Timeout>();
  const hasCalledTimeUp = useRef(false);

  useEffect(() => {
    setTimeLeft(duration);
    hasCalledTimeUp.current = false;
  }, [duration]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 0.1;
        if (next <= 5 && next > 4.9 && prev > 5) {
          audio.sounds.timerUrgent();
        }
        if (next <= 0 && !hasCalledTimeUp.current) {
          hasCalledTimeUp.current = true;
          onTimeUp();
          return 0;
        }
        return Math.max(0, next);
      });
    }, 100);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, onTimeUp, audio]);

  const progress = timeLeft / duration;
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const isUrgent = timeLeft <= 5;

  const getColor = () => {
    if (isUrgent) return '#EF4444';
    if (timeLeft <= duration * 0.3) return '#F59E0B';
    return theme.timerColor;
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={`transform -rotate-90 ${isUrgent ? 'animate-pulse' : ''}`}>
        {/* Background circle */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={getColor()} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-100"
          style={{
            filter: isUrgent ? `drop-shadow(0 0 10px ${getColor()})` : 'none',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-bold tabular-nums ${isUrgent ? 'animate-pulse' : ''}`}
          style={{
            fontSize: size * 0.3,
            color: getColor(),
            textShadow: isUrgent ? `0 0 20px ${getColor()}` : 'none',
          }}
        >
          {Math.ceil(timeLeft)}
        </span>
        <span className="text-xs opacity-60" style={{ color: theme.textColor }}>sec</span>
      </div>
    </div>
  );
};

export default QuizCircularTimer;
