
import React, { useState, useEffect, useCallback } from 'react';
import { 
  GraduationCap, Calendar, ClipboardCheck, MessageSquare, Users, 
  LayoutDashboard, BookOpen, FolderOpen, Shield, Bell, UserCog,
  ChevronLeft, ChevronRight, Maximize, Minimize,
  Video, CreditCard, FileText, DollarSign, Building2, Award,
  ClipboardList, DoorOpen, IdCard, Library, Plug, Bot,
  Briefcase, Calculator, BookMarked, School, ArrowRight
} from 'lucide-react';

const SLIDES = [
  {
    id: 'current',
    title: 'NOS FONCTIONNALITÉS',
    subtitle: 'Tout ce dont votre établissement a besoin, en un seul outil.',
    features: [
      { icon: LayoutDashboard, label: 'Tableau de bord', desc: 'Vue synthétique de l\'activité' },
      { icon: GraduationCap, label: 'Gestion des formations', desc: 'Création, suivi et modules' },
      { icon: ClipboardCheck, label: 'Émargement numérique', desc: 'Signatures, QR codes, suivi' },
      { icon: Calendar, label: 'Emplois du temps', desc: 'Planification intelligente' },
      { icon: MessageSquare, label: 'Messagerie', desc: 'Communication interne' },
      { icon: FolderOpen, label: 'Espace de travail', desc: 'Documents, présentations, quiz' },
      { icon: Users, label: 'Gestion des utilisateurs', desc: 'Rôles et permissions' },
      { icon: BookOpen, label: 'Cahiers de textes', desc: 'Suivi pédagogique' },
      { icon: UserCog, label: 'Espace tuteurs', desc: 'Suivi personnalisé' },
      { icon: Shield, label: 'Administration', desc: 'Gestion complète' },
      { icon: Bell, label: 'Notifications', desc: 'Alertes en temps réel' },
      { icon: Building2, label: 'Multi-établissements', desc: 'Gestion centralisée' },
    ],
  },
  {
    id: 'upcoming',
    title: 'PROCHAINEMENT',
    subtitle: 'Les fonctionnalités qui arrivent pour transformer votre gestion.',
    features: [
      { icon: Video, label: 'Classes virtuelles', desc: 'Visio intégrée' },
      { icon: BookMarked, label: 'E-learning', desc: 'Parcours en ligne' },
      { icon: CreditCard, label: 'Facturation & Devis', desc: 'Gestion commerciale' },
      { icon: DollarSign, label: 'Paie & RH', desc: 'Gestion du personnel' },
      { icon: Calculator, label: 'Comptabilité', desc: 'Suivi financier' },
      { icon: FileText, label: 'BPF', desc: 'Bilan pédagogique' },
      { icon: ClipboardList, label: 'Conventions de formation', desc: 'Génération automatique' },
      { icon: School, label: 'Admission', desc: 'Gestion des candidatures' },
      { icon: Award, label: 'Examens', desc: 'Organisation & résultats' },
      { icon: DoorOpen, label: 'Gestion des salles', desc: 'Réservation & planning' },
      { icon: IdCard, label: 'Cartes étudiantes', desc: 'Génération & gestion' },
      { icon: Library, label: 'Bibliothèque & Matériels', desc: 'Inventaire & prêts' },
      { icon: Plug, label: 'Plateformes externes', desc: 'Connexions & API' },
      { icon: Bot, label: 'Agents IA', desc: 'Automatisation intelligente' },
    ],
  },
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

  const slide = SLIDES[currentSlide];
  const isUpcoming = slide.id === 'upcoming';

  return (
    <div className="min-h-screen w-full bg-[#0a0a1a] text-white overflow-hidden select-none">
      {/* Slide container */}
      <div className="relative w-full h-screen flex flex-col">
        
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute w-[800px] h-[800px] rounded-full opacity-15 blur-[120px] transition-all duration-1000"
            style={{
              background: isUpcoming 
                ? 'radial-gradient(circle, #f97316, #ea580c)' 
                : 'radial-gradient(circle, #7c3aed, #4f46e5)',
              top: '-200px',
              right: '-200px',
            }}
          />
          <div 
            className="absolute w-[600px] h-[600px] rounded-full opacity-10 blur-[100px] transition-all duration-1000"
            style={{
              background: isUpcoming
                ? 'radial-gradient(circle, #f59e0b, #d97706)'
                : 'radial-gradient(circle, #06b6d4, #0891b2)',
              bottom: '-150px',
              left: '-150px',
            }}
          />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-8 pt-6 pb-2">
          <div className="flex items-center gap-4">
            <span className="text-3xl font-extrabold tracking-[4px] bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              NECTFORMA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/40 font-medium">
              {currentSlide + 1} / {SLIDES.length}
            </span>
            <button 
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-20">
          {/* Slide badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4 ${
            isUpcoming 
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' 
              : 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
          }`}>
            {isUpcoming ? '🚀 À venir' : '✅ Disponible'}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-center mb-2 tracking-tight">
            <span className={`bg-clip-text text-transparent ${
              isUpcoming 
                ? 'bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400' 
                : 'bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400'
            }`}>
              {slide.title}
            </span>
          </h1>
          <p className="text-base md:text-lg text-white/50 text-center mb-8 max-w-2xl">
            {slide.subtitle}
          </p>

          {/* Features grid */}
          <div className={`grid gap-3 w-full max-w-5xl ${
            slide.features.length > 12 
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7' 
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
          }`}>
            {slide.features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.label}
                  className={`group flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-300 hover:scale-105 ${
                    isUpcoming
                      ? 'bg-orange-500/5 border-orange-500/10 hover:bg-orange-500/10 hover:border-orange-500/30'
                      : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07] hover:border-violet-500/30'
                  }`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                    isUpcoming
                      ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/20'
                      : 'bg-gradient-to-br from-violet-500/20 to-cyan-500/20'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      isUpcoming ? 'text-orange-400' : 'text-violet-400'
                    }`} />
                  </div>
                  <span className="text-xs font-semibold text-white/90 leading-tight">{feat.label}</span>
                  <span className="text-[10px] text-white/40 mt-0.5 leading-tight">{feat.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 z-20">
          <button
            onClick={goPrev}
            disabled={currentSlide === 0}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* Dots */}
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentSlide 
                    ? `w-8 ${isUpcoming ? 'bg-orange-400' : 'bg-violet-400'}` 
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          <button
            onClick={goNext}
            disabled={currentSlide === SLIDES.length - 1}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="absolute bottom-6 right-8 text-[10px] text-white/20 z-20 hidden md:block">
          ← → naviguer · F plein écran
        </div>
      </div>
    </div>
  );
};

export default Presentation;
