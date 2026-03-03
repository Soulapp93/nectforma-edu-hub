import React, { useEffect, useRef } from 'react';
import { useQuizTheme } from './QuizThemeProvider';

interface Props {
  count?: number;
  type?: 'ambient' | 'confetti' | 'firework';
}

const QuizParticles: React.FC<Props> = ({ count = 30, type = 'ambient' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useQuizTheme();
  const animRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: any[] = [];

    const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

    for (let i = 0; i < count; i++) {
      if (type === 'confetti') {
        particles.push({
          x: Math.random() * canvas.width,
          y: -20 - Math.random() * canvas.height,
          w: 6 + Math.random() * 8,
          h: 4 + Math.random() * 6,
          color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          vy: 2 + Math.random() * 4,
          vx: (Math.random() - 0.5) * 3,
          rot: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 10,
        });
      } else {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: 1 + Math.random() * 3,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          alpha: 0.1 + Math.random() * 0.4,
          color: theme.particleColor,
        });
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        if (type === 'confetti') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.rotSpeed;
          p.vy += 0.05;
          if (p.y > canvas.height + 20) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
            p.vy = 2 + Math.random() * 4;
          }
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, '0');
          ctx.fill();
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
          p.alpha += (Math.random() - 0.5) * 0.02;
          p.alpha = Math.max(0.05, Math.min(0.5, p.alpha));
        }
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [count, type, theme.particleColor]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default QuizParticles;
