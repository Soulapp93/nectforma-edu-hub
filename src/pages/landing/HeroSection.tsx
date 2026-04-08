import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import logoNf from '@/assets/logo-nf.png';

interface HeroSectionProps {
  features: Array<{ icon: React.ReactNode; title: string; desc: string; color: string; img: string }>;
}

export const HeroSection = ({ features }: HeroSectionProps) => (
  <>
      {/* Hero Section */}
      <GradientBackground variant="orbs" className="py-16 md:py-28 px-4 sm:px-6 lg:px-8 relative">
        {/* Floating pedagogical decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Book icons */}
          <BookOpen className="absolute text-primary/[0.07] w-16 h-16 md:w-24 md:h-24" style={{ top: '8%', left: '5%', animation: 'float-slow 8s ease-in-out infinite' }} />
          <BookOpen className="absolute text-accent/[0.06] w-12 h-12 md:w-20 md:h-20" style={{ bottom: '15%', right: '8%', animation: 'float-slow-reverse 10s ease-in-out infinite 2s' }} />
          
          {/* Graduation cap */}
          <GraduationCap className="absolute text-primary/[0.08] w-14 h-14 md:w-20 md:h-20" style={{ top: '15%', right: '10%', animation: 'float-slow 9s ease-in-out infinite 1s' }} />
          <GraduationCap className="absolute text-accent/[0.05] w-10 h-10 md:w-16 md:h-16" style={{ bottom: '25%', left: '12%', animation: 'drift-horizontal 12s ease-in-out infinite' }} />
          
          {/* Pen / Pencil */}
          <Pencil className="absolute text-primary/[0.06] w-10 h-10 md:w-14 md:h-14" style={{ top: '40%', left: '3%', animation: 'float-slow-reverse 7s ease-in-out infinite 3s', transform: 'rotate(-30deg)' }} />
          <PenTool className="absolute text-accent/[0.07] w-8 h-8 md:w-12 md:h-12" style={{ top: '30%', right: '4%', animation: 'float-slow 11s ease-in-out infinite 4s' }} />
          
          {/* Lightbulb */}
          <Lightbulb className="absolute text-warning/[0.08] w-10 h-10 md:w-16 md:h-16" style={{ bottom: '10%', left: '25%', animation: 'float-slow 10s ease-in-out infinite 2s' }} />
          
          {/* Star / Award */}
          <Star className="absolute text-primary/[0.06] w-8 h-8 md:w-12 md:h-12" style={{ top: '60%', right: '15%', animation: 'drift-horizontal 14s ease-in-out infinite 1s' }} />
          <Award className="absolute text-accent/[0.05] w-12 h-12 md:w-16 md:h-16" style={{ top: '70%', left: '8%', animation: 'float-slow 13s ease-in-out infinite 5s' }} />
          
          {/* File/Document */}
          <FileText className="absolute text-primary/[0.05] w-10 h-10 md:w-14 md:h-14" style={{ bottom: '30%', right: '20%', animation: 'float-slow-reverse 9s ease-in-out infinite 3s' }} />
          
          {/* Decorative circles */}
          <div className="absolute w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-primary/[0.04]" style={{ top: '20%', right: '15%', animation: 'spin-slow 40s linear infinite' }} />
          <div className="absolute w-24 h-24 md:w-36 md:h-36 rounded-full border border-dashed border-accent/[0.05]" style={{ bottom: '20%', left: '10%', animation: 'spin-slow 30s linear infinite reverse' }} />
          
          {/* Dotted pattern */}
          <div className="absolute w-40 h-40 md:w-60 md:h-60 opacity-[0.03]" style={{ top: '5%', right: '25%', backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
          <div className="absolute w-32 h-32 md:w-48 md:h-48 opacity-[0.03]" style={{ bottom: '10%', left: '30%', backgroundImage: 'radial-gradient(circle, hsl(var(--accent)) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
        </div>
        <div className="relative max-w-7xl mx-auto text-center px-2">
          <AnimatedSection animation="scale" delay={0}>
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6 md:mb-8 glass">
              <Sparkles className="h-4 w-4 text-primary mr-2 flex-shrink-0 animate-pulse" />
              <span className="text-primary font-medium text-sm md:text-base">La plateforme tout-en-un pour l'enseignement supérieur et la formation professionnelle</span>
            </div>
          </AnimatedSection>
          
          <AnimatedSection animation="fade-up" delay={100}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 md:mb-8 leading-tight text-center">
              <span className="block">Gérez vos formations</span>
              <span className="gradient-text-animated block">
                comme jamais
              </span>
            </h1>
          </AnimatedSection>
          
          <AnimatedSection animation="fade-up" delay={300}>
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 md:mb-12 max-w-4xl mx-auto leading-relaxed px-2">
              NECTFORMA est la solution complète pour les établissements d'enseignement supérieur, 
              organismes de formation, CFA et universités. <span className="text-foreground font-medium">14 modules puissants</span> pour tout gérer.
            </p>
          </AnimatedSection>
          
          <AnimatedSection animation="fade-up" delay={400} className="flex flex-col sm:flex-row gap-4 justify-center mb-12 md:mb-16 px-2">
            <AnimatedButton 
              to="/create-establishment"
              variant="primary"
              size="lg"
              icon={<ArrowRight className="h-5 w-5" />}
            >
              Commencer gratuitement
            </AnimatedButton>
            <AnimatedButton
              href="#fonctionnalites"
              variant="outline"
              size="lg"
              icon={<Play className="h-5 w-5" />}
            >
              Découvrir nos fonctionnalités
            </AnimatedButton>
            <AnimatedButton
              to="/install"
              variant="outline"
              size="lg"
              icon={<Download className="h-5 w-5" />}
            >
              Installer l'application
            </AnimatedButton>
          </AnimatedSection>

          {/* Logo Presentation Section - Navy & Gold Theme */}
          <AnimatedSection animation="scale" delay={500} className="mt-12 md:mt-16 mb-8 md:mb-12 px-2">
             <div className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden aspect-video flex items-center justify-center border border-white/10 logo-presentation-bg">
              
              {/* Étoiles subtiles */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(50)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: Math.random() * 3 + 1 + 'px',
                      height: Math.random() * 3 + 1 + 'px',
                      left: Math.random() * 100 + '%',
                      top: Math.random() * 100 + '%',
                      backgroundColor: i % 3 === 0 ? 'rgba(255, 200, 0, 0.4)' : 'rgba(100, 120, 255, 0.4)',
                      opacity: Math.random() * 0.6 + 0.2,
                      animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite ${Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>

              {/* Rayons lumineux radiaux */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={`ray-${i}`}
                    className="absolute origin-center"
                    style={{
                      width: '2px',
                      height: '200px',
                      background: `linear-gradient(to top, transparent, rgba(100, 120, 255, ${0.08 + (i % 3) * 0.04}), transparent)`,
                      transform: `rotate(${i * 45}deg)`,
                      animation: `pulse-glow-soft ${3 + i * 0.5}s ease-in-out infinite ${i * 0.3}s`
                    }}
                  />
                ))}
              </div>

              {/* Anneaux orbitaux 3D */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '1000px' }}>
                <div 
                  className="absolute w-[280px] h-[280px] md:w-[480px] md:h-[480px] rounded-full border-2 opacity-20"
                  style={{ 
                    borderColor: 'hsl(240 60% 40%)',
                    transform: 'rotateX(75deg)',
                    animation: 'orbit-spin 20s linear infinite'
                  }}
                />
                <div 
                  className="absolute w-[220px] h-[220px] md:w-[380px] md:h-[380px] rounded-full border opacity-30"
                  style={{ 
                    borderColor: 'hsl(245 55% 35%)',
                    transform: 'rotateX(75deg) rotateZ(60deg)',
                    animation: 'orbit-spin 15s linear infinite reverse'
                  }}
                />
                <div 
                  className="absolute w-[160px] h-[160px] md:w-[280px] md:h-[280px] rounded-full border opacity-25"
                  style={{ 
                    borderColor: 'hsl(240 60% 30%)',
                    transform: 'rotateX(75deg) rotateZ(-30deg)',
                    animation: 'orbit-spin 25s linear infinite'
                  }}
                />
                {/* 4ème anneau supplémentaire */}
                <div 
                  className="absolute w-[320px] h-[320px] md:w-[560px] md:h-[560px] rounded-full opacity-10"
                  style={{ 
                    border: '1px dashed hsl(245 55% 35%)',
                    transform: 'rotateX(75deg) rotateZ(15deg)',
                    animation: 'orbit-spin 30s linear infinite'
                  }}
                />
              </div>

              {/* Orbes flottants colorés */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute w-16 h-16 md:w-24 md:h-24 rounded-full"
                     style={{
                       background: 'radial-gradient(circle, rgba(255, 200, 0, 0.2) 0%, transparent 70%)',
                       top: '15%', left: '10%',
                       filter: 'blur(15px)',
                       animation: 'float-particle 12s ease-in-out infinite'
                     }} />
                <div className="absolute w-12 h-12 md:w-20 md:h-20 rounded-full"
                     style={{
                       background: 'radial-gradient(circle, rgba(80, 90, 200, 0.3) 0%, transparent 70%)',
                       bottom: '20%', right: '12%',
                       filter: 'blur(12px)',
                       animation: 'float-particle 15s ease-in-out infinite 3s'
                     }} />
                <div className="absolute w-10 h-10 md:w-16 md:h-16 rounded-full"
                     style={{
                       background: 'radial-gradient(circle, rgba(60, 70, 180, 0.3) 0%, transparent 70%)',
                       top: '60%', left: '75%',
                       filter: 'blur(10px)',
                       animation: 'float-particle 18s ease-in-out infinite 5s'
                     }} />
              </div>

              {/* Halo lumineux derrière le logo - amélioré double couche */}
              <div 
                className="absolute w-40 h-40 md:w-64 md:h-64 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(80, 90, 200, 0.35) 0%, rgba(60, 70, 180, 0.2) 40%, transparent 70%)',
                  filter: 'blur(30px)',
                  animation: 'pulse-glow-soft 3s ease-in-out infinite'
                }}
              />
              <div 
                className="absolute w-24 h-24 md:w-40 md:h-40 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 200, 0, 0.15) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                  animation: 'pulse-glow-soft 4s ease-in-out infinite 1.5s'
                }}
              />

              {/* Logo et nom */}
              <div className="relative z-20 flex flex-col items-center justify-center space-y-4 md:space-y-6">
                {/* Logo Nectforma avec effet 3D */}
                <div 
                  className="relative group"
                  style={{ 
                    animation: 'float-3d 6s ease-in-out infinite',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Cercle lumineux pulsant derrière le logo card */}
                  <div className="absolute -inset-4 md:-inset-6 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                       style={{
                         background: 'conic-gradient(from 0deg, rgba(80,90,200,0.3), rgba(255,200,0,0.2), rgba(60,70,180,0.3), rgba(80,90,200,0.3))',
                         filter: 'blur(20px)',
                         animation: 'orbit-spin 8s linear infinite'
                       }} />
                   <div className="relative logo-card-bg backdrop-blur-sm rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-2xl transition-transform duration-500 hover:scale-105"
                       style={{
                         boxShadow: '0 20px 60px rgba(30, 30, 90, 0.3), 0 10px 30px rgba(40, 40, 120, 0.2), inset 0 1px 0 rgba(255,255,255,0.8)'
                       }}>
                    <NectformaLogo variant="gradient" size="xl" showIcon={true} />
                    {/* Reflet brillant sur le logo */}
                    <div className="absolute inset-0 rounded-2xl md:rounded-3xl overflow-hidden pointer-events-none">
                      <div style={{
                        position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        animation: 'logo-shine 4s ease-in-out infinite 2s'
                      }} />
                    </div>
                  </div>
                </div>
                
                {/* Nom NECTFORMA */}
                <div className="text-center">
                  <h2 
                    className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-wider"
                    style={{
                      background: 'linear-gradient(135deg, hsl(240 60% 20%) 0%, hsl(245 55% 25%) 30%, hsl(45 100% 50%) 60%, hsl(240 60% 20%) 100%)',
                      backgroundSize: '300% 300%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      animation: 'gradient-shift 4s ease infinite',
                      textShadow: 'none',
                      filter: 'drop-shadow(0 2px 10px rgba(30, 30, 90, 0.3))'
                    }}
                  >
                    NECTFORMA
                  </h2>
                   <p 
                    className="mt-3 md:mt-4 text-sm md:text-lg lg:text-xl font-medium tracking-wide nectforma-subtitle"
                    style={{
                      animation: 'fade-in-up 1s ease-out 0.8s both'
                    }}
                  >
                    La solution pour l'enseignement supérieur et la formation professionnelle
                  </p>
                </div>
              </div>

              {/* Particules flottantes - Plus nombreuses */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(18)].map((_, i) => (
                  <div
                    key={`particle-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: Math.random() * 8 + 3 + 'px',
                      height: Math.random() * 8 + 3 + 'px',
                      left: Math.random() * 100 + '%',
                      top: Math.random() * 100 + '%',
                      background: i % 2 === 0 
                        ? `radial-gradient(circle, rgba(80, 90, 200, 0.5) 0%, transparent 70%)`
                        : `radial-gradient(circle, rgba(255, 200, 0, 0.3) 0%, transparent 70%)`,
                      animation: `float-particle ${Math.random() * 10 + 10}s ease-in-out infinite ${Math.random() * 5}s`
                    }}
                  />
                ))}
              </div>

              {/* Effet de brillance traversante */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.1) 55%, transparent 60%)',
                  animation: 'shine-sweep 6s ease-in-out infinite'
                }}
              />
            </div>
          </AnimatedSection>

          {/* Hero Dashboard Preview */}
          <AnimatedSection animation="fade-up" delay={550} className="mt-12 md:mt-16 px-2">
            <div className="relative max-w-5xl mx-auto">
              {/* Browser-like frame */}
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10" style={{
                background: 'linear-gradient(135deg, hsl(240 60% 18%) 0%, hsl(242 58% 15%) 100%)'
              }}>
                {/* Browser top bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-white/10 text-white/50 text-xs font-mono">
                      app.nectforma.com/dashboard
                    </div>
                  </div>
                </div>
                {/* Screenshot */}
                <img 
                  src={tableauDeBordImg} 
                  alt="Tableau de bord NECTFORMA" 
                  className="w-full h-auto"
                  style={{ filter: 'brightness(0.95)' }}
                />
              </div>
              {/* Floating side previews */}
              <div className="hidden lg:block absolute -left-16 top-1/4 w-48 rounded-xl overflow-hidden shadow-xl border border-white/10 rotate-[-6deg] opacity-80 hover:opacity-100 hover:rotate-0 transition-all duration-500">
                <img src={emargement1Img} alt="Émargement" className="w-full h-auto" />
              </div>
              <div className="hidden lg:block absolute -right-16 top-1/3 w-48 rounded-xl overflow-hidden shadow-xl border border-white/10 rotate-[6deg] opacity-80 hover:opacity-100 hover:rotate-0 transition-all duration-500">
                <img src={emploisTempsImg} alt="Emplois du temps" className="w-full h-auto" />
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fade" delay={600} className="mt-10 flex flex-wrap justify-center gap-6 md:gap-10 text-sm md:text-base text-muted-foreground">
            <div className="flex items-center group">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center mr-2 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <span>Essai gratuit 14 jours</span>
            </div>
            <div className="flex items-center group">
              <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center mr-2 group-hover:scale-110 transition-transform">
                <Shield className="h-4 w-4 text-info" />
              </div>
              <span>Données sécurisées</span>
            </div>
            <div className="flex items-center group">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center mr-2 group-hover:scale-110 transition-transform">
                <Zap className="h-4 w-4 text-warning" />
              </div>
              <span>Support réactif</span>
            </div>
          </AnimatedSection>
        </div>
      </GradientBackground>

      <SectionDivider variant="wave" fillColor="fill-primary" />

  </>
);
