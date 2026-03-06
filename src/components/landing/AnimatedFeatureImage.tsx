import React, { useEffect, useRef, useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import Hover3DCard from './Hover3DCard';

interface AnimatedFeatureImageProps {
  images: string[];
  title: string;
  icon: React.ElementType;
  index: number;
}

const AnimatedFeatureImage: React.FC<AnimatedFeatureImageProps> = ({
  images,
  title,
  icon: Icon,
  index,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [parallaxY, setParallaxY] = useState(0);
  const { ref: visibilityRef, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.2,
    triggerOnce: false,
  });

  // Carousel: cycle images every 4s if multiple
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  // Parallax on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const center = rect.top + rect.height / 2;
      const offset = (center - windowHeight / 2) / windowHeight;
      setParallaxY(offset * 30); // 30px max shift
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate deterministic particle positions based on index
  const particles = Array.from({ length: 6 }, (_, i) => ({
    size: 3 + (i % 3) * 2,
    x: 10 + ((index * 17 + i * 23) % 80),
    y: 10 + ((index * 13 + i * 31) % 80),
    delay: i * 0.8,
    duration: 3 + (i % 3),
  }));

  // Circuit line positions
  const circuitLines = [
    { x1: '5%', y1: '20%', length: '30%', angle: 0, delay: 0 },
    { x1: '70%', y1: '75%', length: '25%', angle: 45, delay: 1.5 },
    { x1: '85%', y1: '30%', length: '15%', angle: -30, delay: 0.8 },
  ];

  return (
    <div ref={containerRef} className="relative group">
      <div ref={visibilityRef}>
        {/* Animated halo */}
        <div
          className="absolute -inset-6 rounded-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-700 blur-2xl"
          style={{
            background: `radial-gradient(ellipse at center, hsl(262 83% 55% / 0.3) 0%, hsl(280 65% 45% / 0.15) 50%, transparent 80%)`,
            animation: isVisible ? 'feature-halo-pulse 4s ease-in-out infinite' : 'none',
          }}
        />

        {/* Floating particles */}
        {isVisible &&
          particles.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full pointer-events-none z-40"
              style={{
                width: p.size,
                height: p.size,
                left: `${p.x}%`,
                top: `${p.y}%`,
                background: `radial-gradient(circle, hsl(262 83% 70% / 0.8) 0%, hsl(280 65% 60% / 0.4) 100%)`,
                animation: `feature-particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
                boxShadow: '0 0 6px hsl(262 83% 65% / 0.5)',
              }}
            />
          ))}

        {/* Animated circuit lines */}
        {isVisible &&
          circuitLines.map((line, i) => (
            <div
              key={`circuit-${i}`}
              className="absolute pointer-events-none z-40"
              style={{
                left: line.x1,
                top: line.y1,
                width: line.length,
                height: '2px',
                transform: `rotate(${line.angle}deg)`,
                transformOrigin: 'left center',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, hsl(262 83% 65% / 0.6), transparent)',
                  animation: `feature-circuit-draw 3s ease-in-out ${line.delay}s infinite`,
                }}
              />
              {/* Node dot at end of line */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  right: 0,
                  top: -1,
                  background: 'hsl(262 83% 70%)',
                  boxShadow: '0 0 8px hsl(262 83% 65% / 0.8)',
                  animation: `feature-node-pulse 3s ease-in-out ${line.delay}s infinite`,
                }}
              />
            </div>
          ))}

        <Hover3DCard intensity={6}>
          <div
            className="relative overflow-hidden rounded-2xl shadow-2xl"
            style={{
              background:
                'linear-gradient(135deg, hsl(262 83% 30%) 0%, hsl(270 75% 25%) 40%, hsl(280 65% 20%) 100%)',
              transform: `translateY(${parallaxY}px)`,
              transition: 'transform 0.1s linear',
            }}
          >
            {/* Decorative shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-[20%] -left-[10%] w-[55%] h-[80%] rounded-full bg-white/[0.06] blur-sm" />
              <div className="absolute -bottom-[15%] -right-[8%] w-[45%] h-[70%] rounded-full bg-white/[0.04] blur-sm" />
              <div className="absolute top-[15%] right-[20%] w-[18%] h-[28%] rounded-full bg-white/[0.08]" />
              {/* Dot pattern */}
              <div
                className="absolute top-[10%] left-[60%] w-[30%] h-[30%] opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '10px 10px',
                }}
              />
              {/* Lines and accents */}
              <div className="absolute bottom-[25%] left-[5%] w-[35%] h-[2px] bg-white/15 rounded-full" />
              <div className="absolute top-[60%] left-[45%] w-[6%] h-[10%] bg-white/10 rounded-lg rotate-12" />
              <div className="absolute top-[20%] left-[30%] w-[4%] h-[7%] bg-white/[0.06] rounded-md -rotate-6" />
              {/* Glowing circuit-like lines */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[40%] opacity-10"
                style={{
                  background: 'linear-gradient(180deg, transparent 0%, hsl(262 83% 60% / 0.3) 100%)',
                }}
              />
            </div>

            {/* Image with Ken Burns + Pulse */}
            <div className="relative z-10 p-4 md:p-6">
              {images.map((img, imgIndex) => (
                <img
                  key={imgIndex}
                  src={img}
                  alt={`${title} - Illustration`}
                  className="w-full h-auto object-contain"
                  style={{
                    filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3))',
                    animation: isVisible
                      ? `feature-ken-burns ${12 + index * 2}s ease-in-out infinite, feature-subtle-pulse 6s ease-in-out infinite`
                      : 'none',
                    opacity: images.length > 1 ? (imgIndex === currentImageIndex ? 1 : 0) : 1,
                    transition: 'opacity 0.8s ease-in-out',
                    position: images.length > 1 && imgIndex > 0 ? 'absolute' : 'relative',
                    inset: images.length > 1 && imgIndex > 0 ? '1rem' : undefined,
                  }}
                />
              ))}
            </div>

            {/* Gradient overlay bottom */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[hsl(262_83%_20%_/_0.8)] via-[hsl(270_75%_25%_/_0.4)] to-transparent pointer-events-none z-20" />

            {/* Bottom bar with title + logo */}
            <div className="absolute bottom-0 inset-x-0 z-30 flex items-end justify-between p-4 md:p-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-white/90 text-sm font-medium">{title}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                <span className="text-xs font-semibold text-white">NF</span>
                <span className="text-xs text-white/80">Nectforma</span>
              </div>
            </div>

            {/* Shine effect on hover */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-30">
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '60%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                  animation: 'logo-shine 4s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        </Hover3DCard>
      </div>
    </div>
  );
};

export default AnimatedFeatureImage;
