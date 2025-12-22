import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Search } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen pt-24 pb-16 overflow-hidden bg-background">
      {/* Background gradient orb - soft purple only */}
      <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-lavender blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-120px)]">
          {/* Left content */}
          <div className="space-y-8">
            <p className="text-sm font-medium text-primary">Powered by NECTFY</p>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Simplifiez la gestion
              <br />
              <span className="text-primary">de vos formations</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg">
              La plateforme tout-en-un pour digitaliser, automatiser et optimiser 
              la gestion de vos organismes de formation.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/auth">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-3 h-auto text-base font-medium shadow-button hover:shadow-button-hover transition-all">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/solutions">
                <Button variant="outline" className="rounded-full px-6 py-3 h-auto text-base font-medium border-border hover:bg-secondary">
                  Demander une démo
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Right content - Floating cards */}
          <div className="relative hidden lg:block">
            {/* Main gradient orb - purple only */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[450px] h-[450px] rounded-full bg-primary/30 animate-float" />
            </div>
            
            {/* Performance Card */}
            <div className="absolute top-10 left-0 bg-card rounded-xl p-5 shadow-card animate-float-delayed border border-border">
              <h4 className="font-semibold text-foreground mb-4">Performance</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-8">
                  <span className="text-sm text-muted-foreground">Temps économisé</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-foreground">80%</span>
                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--border))" strokeWidth="3"/>
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" 
                        strokeDasharray={`${80 * 0.88} 88`} strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <span className="text-sm text-muted-foreground">Erreurs réduites</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-foreground">70%</span>
                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--border))" strokeWidth="3"/>
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" 
                        strokeDasharray={`${70 * 0.88} 88`} strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <span className="text-sm text-muted-foreground">Satisfaction</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-foreground">98%</span>
                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--border))" strokeWidth="3"/>
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" 
                        strokeDasharray={`${98 * 0.88} 88`} strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Search Card */}
            <div className="absolute bottom-20 right-0 bg-card rounded-xl p-4 shadow-card border border-border" style={{ animationDelay: '2s' }}>
              <div className="flex items-center gap-3 px-3 py-2 bg-secondary rounded-lg mb-3">
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Rechercher...</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <p className="font-medium text-sm text-foreground">Formation Web Dev</p>
                  <p className="text-xs text-muted-foreground">12 apprenants • En cours</p>
                </div>
                <div className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <p className="font-medium text-sm text-foreground">UX Design Avancé</p>
                  <p className="text-xs text-muted-foreground">8 apprenants • Planifié</p>
                </div>
              </div>
            </div>
            
            {/* Decorative stars */}
            <div className="absolute top-0 right-20 w-3 h-3 text-primary">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12,0 15,9 24,9 17,14 20,24 12,18 4,24 7,14 0,9 9,9"/>
              </svg>
            </div>
            <div className="absolute bottom-40 left-20 w-2 h-2 text-primary/60">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12,0 15,9 24,9 17,14 20,24 12,18 4,24 7,14 0,9 9,9"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
