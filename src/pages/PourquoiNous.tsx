import React from 'react';
import { Link } from 'react-router-dom';
import LandingHeader from '@/components/landing/LandingHeader';
import NectformaLogo from '@/components/NectformaLogo';
import AnimatedSection from '@/components/landing/AnimatedSection';
import AnimatedCounter from '@/components/landing/AnimatedCounter';
import AnimatedButton from '@/components/landing/AnimatedButton';
import GradientBackground from '@/components/landing/GradientBackground';
import SectionDivider from '@/components/landing/SectionDivider';
import { 
  Target, Users, Award, Zap, Heart, TrendingUp, 
  Shield, Clock, CheckCircle2, ArrowRight, Star,
  GraduationCap, Building2, Briefcase, Sparkles,
  Monitor, FileCheck, BarChart3, FolderLock,
  BookOpen, Lightbulb, Mail, Phone, MapPin
} from 'lucide-react';

import tableauDeBordImg from '@/assets/illustrations/tableau-de-bord.png';
import emargementImg from '@/assets/illustrations/emargement.png';
import messagerie1Img from '@/assets/illustrations/messagerie.png';
import gestionFormationsImg from '@/assets/illustrations/gestion-formations.png';

const PourquoiNous = () => {
  const audiences = [
    {
      icon: GraduationCap,
      title: 'Établissements d\'enseignement supérieur',
      description: 'Vous êtes une école supérieure privée ou publique et souhaitez optimiser votre gestion ?',
      benefits: [
        'Gestion complète des formations et modules',
        'Émargement numérique conforme',
        'Cahiers de textes automatisés',
        'Emplois du temps visuels',
        'Suivi des apprenants en temps réel'
      ],
      testimonial: {
        text: 'Nectforma a transformé notre gestion quotidienne. Nous avons divisé par 3 le temps administratif !',
        author: 'Marie D., Directrice d\'école supérieure'
      }
    },
    {
      icon: Building2,
      title: 'Organismes de formation & CFA',
      description: 'Vous gérez un organisme de formation ou un centre de formation des apprentis ?',
      benefits: [
        'Interface intuitive pour tous les profils',
        'Messagerie et groupes intégrés',
        'Gestion multi-formations',
        'Suivi pédagogique complet',
        'Exports et rapports détaillés'
      ],
      testimonial: {
        text: 'La plateforme est adoptée par tous nos formateurs et apprentis. Simple et efficace !',
        author: 'Jean-Pierre L., Directeur de CFA'
      }
    },
    {
      icon: Briefcase,
      title: 'Universités & entreprises',
      description: 'Vous êtes une université ou une entreprise avec des alternants à suivre ?',
      benefits: [
        'Espace tuteur entreprise dédié',
        'Suivi des présences de l\'alternant',
        'Communication avec l\'établissement',
        'Accès au planning de formation',
        'Notifications des absences'
      ],
      testimonial: {
        text: 'En tant que tuteur, je peux enfin suivre facilement la formation de mes alternants.',
        author: 'Sophie M., Tutrice entreprise'
      }
    }
  ];

  const advantages = [
    {
      icon: Clock,
      title: 'Gain de temps',
      subtitle: 'administratif',
      description: 'Réduisez par 3 le temps consacré aux tâches administratives répétitives.',
      image: tableauDeBordImg
    },
    {
      icon: Zap,
      title: 'Automatisation',
      subtitle: 'des tâches',
      description: 'Émargements, notifications, rapports... Tout est automatisé pour vous.',
      image: emargementImg
    },
    {
      icon: BarChart3,
      title: 'Suivi en temps réel',
      subtitle: 'de vos formations',
      description: 'Pilotez votre activité avec des tableaux de bord et statistiques en direct.',
      image: messagerie1Img
    },
    {
      icon: FolderLock,
      title: 'Documents centralisés',
      subtitle: '& conformité Qualiopi',
      description: 'Tous vos documents au même endroit, prêts pour les audits de conformité.',
      image: gestionFormationsImg
    }
  ];

  const whyChooseUs = [
    {
      icon: Zap,
      title: 'Simplicité d\'utilisation',
      description: 'Interface intuitive, prise en main immédiate sans formation nécessaire'
    },
    {
      icon: Clock,
      title: 'Gain de temps massif',
      description: 'Automatisation des tâches administratives répétitives'
    },
    {
      icon: Shield,
      title: 'Sécurité des données',
      description: 'Vos données sont hébergées et protégées de manière sécurisée'
    },
    {
      icon: Heart,
      title: 'Support réactif',
      description: 'Équipe disponible pour vous accompagner au quotidien'
    },
    {
      icon: TrendingUp,
      title: 'Évolution continue',
      description: 'Nouvelles fonctionnalités régulières basées sur vos retours'
    },
    {
      icon: Star,
      title: 'Satisfaction client',
      description: 'Des établissements satisfaits qui nous recommandent'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <div className="h-14 md:h-16" />

      {/* Hero Section - Split Layout */}
      <GradientBackground variant="orbs" className="py-16 md:py-28 px-4 sm:px-6 lg:px-8 relative">
        {/* Floating decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <BookOpen className="absolute text-primary/[0.06] w-16 h-16 md:w-24 md:h-24" style={{ top: '8%', left: '5%', animation: 'float-slow 8s ease-in-out infinite' }} />
          <GraduationCap className="absolute text-primary/[0.07] w-14 h-14 md:w-20 md:h-20" style={{ top: '12%', right: '10%', animation: 'float-slow 9s ease-in-out infinite 1s' }} />
          <Lightbulb className="absolute text-warning/[0.06] w-10 h-10 md:w-16 md:h-16" style={{ bottom: '15%', left: '12%', animation: 'drift-horizontal 12s ease-in-out infinite' }} />
          <Star className="absolute text-primary/[0.05] w-8 h-8 md:w-12 md:h-12" style={{ top: '60%', right: '15%', animation: 'drift-horizontal 14s ease-in-out infinite 1s' }} />
          
          {/* Decorative circles */}
          <div className="absolute w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-primary/[0.04]" style={{ top: '20%', right: '15%', animation: 'spin-slow 40s linear infinite' }} />
          <div className="absolute w-24 h-24 md:w-36 md:h-36 rounded-full border border-dashed border-accent/[0.05]" style={{ bottom: '20%', left: '10%', animation: 'spin-slow 30s linear infinite reverse' }} />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left - Text Content */}
            <div className="flex-1 text-center lg:text-left">
              <AnimatedSection animation="fade-up" delay={0}>
                <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6 glass">
                  <Sparkles className="h-4 w-4 text-primary mr-2 animate-pulse" />
                  <span className="text-primary font-medium text-sm">La solution adaptée à vos besoins</span>
                </div>
              </AnimatedSection>

              <AnimatedSection animation="fade-up" delay={100}>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                  <span className="block">Pourquoi choisir</span>
                  <span className="gradient-text-animated block">Nectforma ?</span>
                </h1>
              </AnimatedSection>

              <AnimatedSection animation="fade-up" delay={200}>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Digitalisez, <strong className="text-foreground">automatisez</strong> et pilotez votre établissement d'enseignement supérieur, organisme de formation, CFA ou université avec une solution complète et intuitive.
                </p>
              </AnimatedSection>

              <AnimatedSection animation="fade-up" delay={300} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <AnimatedButton 
                  to="/create-establishment"
                  variant="primary"
                  size="lg"
                  icon={<ArrowRight className="h-5 w-5" />}
                >
                  Commencer gratuitement
                </AnimatedButton>
                <AnimatedButton
                  href="#avantages"
                  variant="outline"
                  size="lg"
                  icon={<Target className="h-5 w-5" />}
                >
                  Voir les avantages
                </AnimatedButton>
              </AnimatedSection>

              <AnimatedSection animation="fade" delay={400}>
                <p className="text-sm text-muted-foreground">
                  Accès entièrement gratuit • Sans carte bancaire
                </p>
              </AnimatedSection>
            </div>

            {/* Right - Visual Mockup */}
            <div className="flex-1 w-full max-w-2xl">
              <AnimatedSection animation="scale" delay={300}>
                <div className="relative">
                  {/* Glow behind */}
                  <div className="absolute -inset-8 rounded-3xl opacity-40 blur-3xl"
                    style={{
                      background: 'radial-gradient(ellipse at center, hsl(262 83% 55% / 0.3) 0%, hsl(280 65% 45% / 0.15) 50%, transparent 80%)'
                    }}
                  />
                  
                  {/* Main mockup card */}
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-primary/20"
                    style={{
                      background: 'linear-gradient(135deg, hsl(262 83% 30%) 0%, hsl(270 75% 25%) 40%, hsl(280 65% 20%) 100%)',
                      boxShadow: '0 25px 60px rgba(139, 92, 246, 0.3), 0 10px 30px rgba(139, 92, 246, 0.2)'
                    }}>
                    {/* Decorative shapes */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute -top-[20%] -left-[10%] w-[55%] h-[80%] rounded-full bg-white/[0.06] blur-sm" />
                      <div className="absolute -bottom-[15%] -right-[8%] w-[45%] h-[70%] rounded-full bg-white/[0.04] blur-sm" />
                      <div className="absolute top-[10%] left-[60%] w-[30%] h-[30%] opacity-20"
                        style={{
                          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                          backgroundSize: '10px 10px',
                        }}
                      />
                    </div>
                    
                    {/* Dashboard image */}
                    <div className="relative z-10 p-4 md:p-6">
                      <img 
                        src={tableauDeBordImg} 
                        alt="Tableau de bord Nectforma"
                        className="w-full h-auto object-contain rounded-lg"
                        style={{
                          filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3))',
                        }}
                      />
                    </div>

                    {/* Floating badge */}
                    <div className="absolute top-4 right-4 z-20 bg-card/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 border border-border/50">
                      <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">La solution #1 pour les formations</span>
                    </div>

                    {/* Gradient overlay bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[hsl(262_83%_20%_/_0.8)] to-transparent pointer-events-none z-20" />
                  </div>

                  {/* Floating secondary cards */}
                  <div className="absolute -bottom-4 -left-4 md:-left-8 z-30 bg-white/95 dark:bg-card/95 backdrop-blur-sm rounded-xl p-3 shadow-xl border border-primary/10"
                    style={{ animation: 'float-slow 6s ease-in-out infinite' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">+250</p>
                        <p className="text-[10px] text-muted-foreground">établissements</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -top-2 -right-2 md:-right-6 z-30 bg-white/95 dark:bg-card/95 backdrop-blur-sm rounded-xl p-3 shadow-xl border border-primary/10"
                    style={{ animation: 'float-slow-reverse 7s ease-in-out infinite 1s' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-success" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">98%</p>
                        <p className="text-[10px] text-muted-foreground">satisfaction</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </GradientBackground>

      <SectionDivider variant="wave" fillColor="fill-primary" />

      {/* Pourquoi choisir - Avantages Cards */}
       <section id="avantages" className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 section-soft-bg" />
        
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[300px] h-[300px] opacity-[0.08]" style={{
            background: 'radial-gradient(circle, hsl(262 83% 65%) 0%, transparent 70%)',
            top: '10%', right: '5%', filter: 'blur(60px)',
            animation: 'blob-float 18s ease-in-out infinite'
          }} />
          <div className="absolute w-[250px] h-[250px] opacity-[0.06]" style={{
            background: 'radial-gradient(circle, hsl(330 60% 65%) 0%, transparent 70%)',
            bottom: '10%', left: '0%', filter: 'blur(50px)',
            animation: 'blob-float 22s ease-in-out infinite 4s'
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Pourquoi choisir <span className="gradient-text-animated">Nectforma ?</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Digitalisez votre établissement d'enseignement supérieur, organisme de formation, CFA ou université grâce à une <strong className="text-foreground">solution SaaS</strong> complète et simple à utiliser.
            </p>
          </AnimatedSection>

          {/* 2x2 Advantage Cards with illustrations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {advantages.map((advantage, index) => {
              const Icon = advantage.icon;
              return (
                <AnimatedSection key={index} animation="fade-up" delay={index * 100}>
                   <div className="group relative rounded-2xl overflow-hidden border border-primary/10 hover:border-primary/25 transition-all duration-500 hover:shadow-xl card-soft-bg">
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <div style={{
                        position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.06), transparent)',
                        animation: 'shimmer-line 3s ease-in-out infinite'
                      }} />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 p-6 md:p-8">
                      {/* Icon + Text */}
                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center gap-3 mb-3 justify-center sm:justify-start">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Icon className="h-6 w-6 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground">{advantage.title}</h3>
                            <p className="text-sm text-muted-foreground">{advantage.subtitle}</p>
                          </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{advantage.description}</p>
                      </div>

                      {/* Illustration */}
                      <div className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40 relative">
                        <div className="absolute inset-0 rounded-2xl opacity-20 blur-xl"
                          style={{
                            background: 'radial-gradient(circle, hsl(262 83% 55% / 0.4) 0%, transparent 70%)'
                          }}
                        />
                        <img 
                          src={advantage.image} 
                          alt={advantage.title}
                          className="w-full h-full object-contain relative z-10 group-hover:scale-105 transition-transform duration-500"
                          style={{
                            filter: 'drop-shadow(0 4px 12px rgba(139, 92, 246, 0.2))',
                            maskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)',
                            WebkitMaskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Bottom gradient line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      <SectionDivider variant="curve" fillColor="fill-muted/30" />

      {/* Stats + Social Proof Section */}
      <section className="py-16 md:py-24 relative overflow-hidden bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              <span className="gradient-text-animated text-5xl md:text-6xl font-extrabold">+250</span>{' '}
              établissements utilisent déjà <strong>Nectforma</strong>
            </h2>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span className="text-xl font-bold text-foreground">4,9</span>
              <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-muted rounded-md">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <Monitor className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </AnimatedSection>

          {/* Client logos */}
          <AnimatedSection animation="fade-up" delay={200}>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 mb-12">
              {['efl Multimédia', 'CNDE', 'HappyYou'].map((name, i) => (
                <div key={i} className="px-6 py-3 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-lg font-bold text-foreground">{name}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>

          {/* Testimonial Card */}
          <AnimatedSection animation="fade-up" delay={300}>
            <div className="max-w-lg mx-auto">
               <div className="relative p-6 rounded-2xl border border-primary/10 shadow-lg card-soft-bg">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Users className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="font-bold text-foreground mb-1">Jean Dupont</p>
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      "Nectforma a révolutionné la gestion de nos formations. Simple, efficace, entrés complet. Je recommande vivement !"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* CTA Button */}
          <AnimatedSection animation="fade-up" delay={400} className="text-center mt-10">
            <AnimatedButton 
              to="/create-establishment"
              variant="primary"
              size="lg"
              icon={<ArrowRight className="h-5 w-5" />}
            >
              Essayez gratuitement
            </AnimatedButton>
          </AnimatedSection>
        </div>
      </section>

      <SectionDivider variant="wave" flip fillColor="fill-primary/5" />

      {/* Target Audiences */}
       <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 section-soft-bg" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Target className="h-4 w-4 text-primary mr-2" />
              <span className="text-primary font-medium text-sm">Pour tous les professionnels</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              À qui s'adresse <span className="gradient-text-animated">Nectforma ?</span>
            </h2>
          </AnimatedSection>

          <div className="space-y-16">
            {audiences.map((audience, index) => {
              const Icon = audience.icon;
              const isEven = index % 2 === 0;
              return (
                <AnimatedSection 
                  key={index}
                  animation={isEven ? 'fade-right' : 'fade-left'}
                  delay={100}
                  className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}
                >
                  <div className="flex-1">
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                        <Icon className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <h3 className="text-3xl font-bold text-foreground">{audience.title}</h3>
                    </div>
                    <p className="text-xl text-muted-foreground mb-8">{audience.description}</p>
                    <ul className="space-y-4 mb-8">
                      {audience.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-start">
                          <CheckCircle2 className="h-6 w-6 text-success mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-lg text-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1">
                     <div className="p-8 rounded-2xl border border-primary/10 shadow-lg relative overflow-hidden card-soft-bg">
                      <div className="flex mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-lg text-muted-foreground italic mb-4">
                        "{audience.testimonial.text}"
                      </p>
                      <p className="text-foreground font-semibold">{audience.testimonial.author}</p>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      <SectionDivider variant="curve" fillColor="fill-muted/30" />

      {/* Why Choose Us - Grid */}
      <section className="py-16 md:py-24 relative overflow-hidden bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Les avantages <span className="gradient-text-animated">Nectforma</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Plus qu'un simple logiciel, un véritable partenaire pour votre réussite
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChooseUs.map((reason, index) => {
              const Icon = reason.icon;
              return (
                <AnimatedSection key={index} animation="fade-up" delay={index * 80}>
                   <div className="group p-6 rounded-2xl border border-primary/10 hover:border-primary/25 hover:shadow-xl transition-all duration-500 relative overflow-hidden card-soft-bg">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{reason.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{reason.description}</p>
                    
                    {/* Bottom gradient line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, hsl(262 83% 58%) 0%, hsl(280 75% 55%) 40%, hsl(300 65% 50%) 70%, hsl(262 83% 50%) 100%)'
      }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[200%] h-full opacity-[0.08]" style={{
            background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
            animation: 'shimmer-line 8s ease-in-out infinite'
          }} />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <AnimatedSection animation="fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Prêt à simplifier votre gestion ?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-10">
              Testez Nectforma gratuitement pendant 14 jours, sans engagement
            </p>
            <Link 
              to="/create-establishment" 
              className="inline-flex items-center px-8 py-4 bg-background text-primary rounded-xl hover:shadow-2xl transform hover:scale-105 font-bold text-lg transition-all"
            >
              Commencer gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <p className="text-primary-foreground/80 mt-6 text-sm">
              Sans carte bancaire • Support inclus • Données sécurisées
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-foreground py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <NectformaLogo variant="gradient" size="lg" />
              <div>
                <p className="text-muted-foreground text-sm">© 2025 Tous droits réservés</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
              <Link to="/solutions" className="hover:text-primary transition-colors">Solutions</Link>
              <Link to="/fonctionnalites" className="hover:text-primary transition-colors">Fonctionnalités</Link>
              <Link to="/cgu" className="hover:text-primary transition-colors">CGU</Link>
              <Link to="/politique-confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PourquoiNous;
