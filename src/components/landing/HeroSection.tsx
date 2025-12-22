import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen pt-20 md:pt-24 overflow-hidden finbix-hero-bg">
      {/* Decorative gradient orbs */}
      <div className="absolute top-20 right-0 w-[600px] h-[600px] finbix-gradient-orb opacity-40 animate-float" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] finbix-gradient-orb opacity-30 animate-float-delayed" />
      
      {/* Sparkle decorations */}
      <div className="sparkle top-32 right-1/4 animate-pulse-glow" style={{ animationDelay: '0s' }} />
      <div className="sparkle top-48 right-1/3 w-3 h-3 animate-pulse-glow" style={{ animationDelay: '0.5s' }} />
      <div className="sparkle bottom-1/3 right-20 w-5 h-5 animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left animate-fade-in-up">
            <p className="text-primary font-medium mb-4 text-sm md:text-base tracking-wide">
              Powered by NECTFY
            </p>
            
            <h1 className="finbix-title text-foreground mb-6">
              Simplifiez la gestion
              <br />
              <span className="text-primary">de vos formations</span>
            </h1>
            
            <p className="finbix-subtitle mx-auto lg:mx-0 mb-8 md:mb-10">
              La plateforme tout-en-un pour digitaliser, automatiser et optimiser 
              la gestion de vos organismes de formation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                to="/create-establishment" 
                className="btn-finbix inline-flex items-center justify-center text-base md:text-lg group"
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                to="/solutions" 
                className="btn-finbix-outline text-base md:text-lg text-center"
              >
                Demander une démo
              </Link>
            </div>
          </div>
          
          {/* Right content - Floating cards */}
          <div className="relative hidden lg:block h-[500px]">
            {/* Main gradient circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[400px] h-[400px] rounded-full bg-gradient-to-br from-primary/60 via-blue-400/50 to-cyan-400/40 blur-sm animate-float" />
            </div>
            
            {/* Stats floating card */}
            <div className="absolute top-8 left-0 glass-card-strong rounded-2xl p-5 animate-float" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-foreground font-semibold mb-3">Performance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Temps économisé</p>
                    <p className="text-2xl font-bold text-foreground">80%</p>
                  </div>
                  <svg className="w-10 h-10" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3"/>
                    <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" 
                      strokeDasharray="75.4 94.2" strokeLinecap="round" className="stats-circle-ring"/>
                  </svg>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Erreurs réduites</p>
                    <p className="text-2xl font-bold text-foreground">70%</p>
                  </div>
                  <svg className="w-10 h-10" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3"/>
                    <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--warning))" strokeWidth="3" 
                      strokeDasharray="66 94.2" strokeLinecap="round" className="stats-circle-ring"/>
                  </svg>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Satisfaction</p>
                    <p className="text-2xl font-bold text-foreground">98%</p>
                  </div>
                  <svg className="w-10 h-10" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3"/>
                    <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--success))" strokeWidth="3" 
                      strokeDasharray="92 94.2" strokeLinecap="round" className="stats-circle-ring"/>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Search action card */}
            <div className="absolute bottom-16 right-0 glass-card-strong rounded-2xl p-5 w-64 animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg mb-4">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm text-muted-foreground">Rechercher...</span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-foreground">Formation Web Dev</p>
                  <p className="text-xs text-muted-foreground">12 apprenants • En cours</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">UX Design Avancé</p>
                  <p className="text-xs text-muted-foreground">8 apprenants • Planifié</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
