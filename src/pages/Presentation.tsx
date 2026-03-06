
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import slide1 from '@/assets/presentation/slide-1-features.png';
import slide2 from '@/assets/presentation/slide-2-upcoming.png';

const SLIDES = [
  { id: 'current', image: slide1, title: 'Nos fonctionnalités' },
  { id: 'upcoming', image: slide2, title: 'Prochainement' },
];

const Presentation = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const goNext = useCallback(() => setCurrentSlide(s => Math.min(s + 1, SLIDES.length - 1)), []);
  const goPrev = useCallback(() => setCurrentSlide(s => Math.max(s - 1, 0)), []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, toggleFullscreen]);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center select-none relative overflow-hidden">
      {/* Slide image */}
      <div className="w-full h-screen flex items-center justify-center">
        <img
          src={SLIDES[currentSlide].image}
          alt={SLIDES[currentSlide].title}
          className="max-w-full max-h-full object-contain transition-opacity duration-500"
        />
      </div>

      {/* Navigation overlay */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 z-20">
        <button
          onClick={goPrev}
          disabled={currentSlide === 0}
          className="p-3 rounded-full bg-black/10 hover:bg-black/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-8 bg-violet-500' : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={currentSlide === SLIDES.length - 1}
          className="p-3 rounded-full bg-black/10 hover:bg-black/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Fullscreen toggle */}
      <button 
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors z-20"
      >
        {isFullscreen ? <Minimize className="w-4 h-4 text-gray-700" /> : <Maximize className="w-4 h-4 text-gray-700" />}
      </button>

      <div className="absolute bottom-6 right-8 text-[10px] text-gray-400 z-20 hidden md:block">
        ← → naviguer · F plein écran
      </div>
    </div>
  );
};

export default Presentation;
