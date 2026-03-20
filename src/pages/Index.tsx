import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, ShieldCheck, Users, GraduationCap, BookText, CalendarDays, 
  ClipboardCheck, Mail, UsersRound, Building2, UserCircle, Briefcase,
  ArrowRight, CheckCircle2, Sparkles, Play, Shield, Zap, Clock, Monitor,
  Send, Phone, MapPin, ChevronDown, Download, Layers,
  BookOpen, PenTool, Lightbulb, Award, Star, FileText, Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import NectformaLogo from '@/components/NectformaLogo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FloatingCTA from '@/components/landing/FloatingCTA';
import ChatWidget from '@/components/landing/ChatWidget';
import FAQSection from '@/components/landing/FAQSection';
import AnimatedSection from '@/components/landing/AnimatedSection';
import AnimatedCounter from '@/components/landing/AnimatedCounter';
import TextReveal from '@/components/landing/TextReveal';
import ParallaxSection from '@/components/landing/ParallaxSection';
import AnimatedFeatureImage from '@/components/landing/AnimatedFeatureImage';

import Hover3DCard from '@/components/landing/Hover3DCard';
import AnimatedButton from '@/components/landing/AnimatedButton';
import SectionDivider from '@/components/landing/SectionDivider';
import GradientBackground from '@/components/landing/GradientBackground';
import LandingHeader from '@/components/landing/LandingHeader';


// Imports des illustrations
import tableauDeBordImg from '@/assets/illustrations/tableau-de-bord.png';
import administrationImg from '@/assets/illustrations/administration.png';
import gestionUtilisateursImg from '@/assets/illustrations/gestion-utilisateurs.png';
import gestionFormations1Img from '@/assets/illustrations/gestion-formations.png';
const gestionFormations2Img = gestionFormations1Img;
import cahiersTextesImg from '@/assets/illustrations/cahiers-textes.png';
const cahierTexteDetailImg = cahiersTextesImg;
import emploisTempsImg from '@/assets/illustrations/emplois-temps.png';
const emploisTempsCalendrierImg = emploisTempsImg;
import emargement1Img from '@/assets/illustrations/emargement.png';
const emargement2Img = emargement1Img;
import messagerie1Img from '@/assets/illustrations/messagerie.png';
const messagerie2Img = messagerie1Img;
import groupesImg from '@/assets/illustrations/groupes.png';
import gestionEtablissementImg from '@/assets/illustrations/gestion-etablissement.png';
import profilImg from '@/assets/illustrations/profils.png';
import espaceTuteursImg from '@/assets/illustrations/espace-tuteurs.png';
import classesVirtuellesImg from '@/assets/illustrations/classes-virtuelles.png';
import espaceTravailImg from '@/assets/illustrations/espace-travail.png';

interface FeatureItem {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  details: string[];
  imagePlaceholder: string;
  images: string[];
}

const Index = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
   
  const features: FeatureItem[] = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      title: 'Tableau de bord',
      subtitle: 'Vue d\'ensemble en temps réel',
      description: 'Accédez à une vue synthétique de votre établissement avec des indicateurs clés : taux de présence, sessions à venir, cahiers de texte à compléter, et statistiques globales.',
      benefits: ['Statistiques de présence en temps réel', 'Alertes sur les cahiers de texte manquants', 'Vue des prochaines sessions'],
      details: [
        'Taux de présence global et par formation',
        'Nombre de sessions planifiées cette semaine',
        'Rappels automatiques pour les entrées manquantes',
        'Filtres par formation et par période'
      ],
      imagePlaceholder: 'dashboard',
      images: [tableauDeBordImg]
    },
    {
      id: 'administration',
      icon: ShieldCheck,
      title: 'Administration',
      subtitle: 'Gestion centralisée complète',
      description: 'Centre de contrôle unifié pour gérer les utilisateurs, formations, cahiers de texte, emplois du temps et feuilles d\'émargement depuis une interface intuitive avec des onglets dédiés.',
      benefits: ['Interface unifiée avec onglets', 'Accès rapide à toutes les fonctions', 'Gestion complète des données'],
      details: [
        'Onglet Utilisateurs : création, import Excel, gestion des rôles',
        'Onglet Formations : modules, participants, instructeurs',
        'Onglet Cahiers de texte : suivi par formation',
        'Onglet Emplois du temps : planning visuel',
        'Onglet Émargements : génération et suivi'
      ],
      imagePlaceholder: 'administration',
      images: [administrationImg]
    },
    {
      id: 'users',
      icon: Users,
      title: 'Gestion des utilisateurs',
      subtitle: 'Apprenants, formateurs, administrateurs',
      description: 'Gérez l\'ensemble des profils de votre établissement. Créez des comptes individuellement ou par import Excel, attribuez les rôles (AdminPrincipal, Admin, Formateur, Étudiant) et suivez leur activité.',
      benefits: ['Import/Export Excel des utilisateurs', 'Attribution des rôles granulaire', 'Invitations par email automatiques'],
      details: [
        'Création rapide avec formulaire complet',
        'Import massif via fichier Excel',
        'Rôles : AdminPrincipal, Admin, Formateur, Étudiant',
        'Envoi automatique d\'invitations par email',
        'Activation/désactivation des comptes',
        'Photo de profil et signature enregistrée'
      ],
      imagePlaceholder: 'users',
      images: [gestionUtilisateursImg]
    },
    {
      id: 'formations',
      icon: GraduationCap,
      title: 'Gestion des formations',
      subtitle: 'Programmes modulaires complets',
      description: 'Créez des formations structurées avec modules personnalisés. Définissez les dates, durées, niveaux et assignez des formateurs et apprenants. Chaque formation dispose de son propre espace.',
      benefits: ['Structure modulaire flexible', 'Assignation formateurs/apprenants', 'Espace dédié par formation'],
      details: [
        'Création de formations avec titre, dates, durée',
        'Niveaux : Débutant, Intermédiaire, Avancé',
        'Modules avec contenus pédagogiques',
        'Devoirs et travaux avec soumissions',
        'Documents partagés par module',
        'Corrections et notations intégrées'
      ],
      imagePlaceholder: 'formations',
      images: [gestionFormations1Img]
    },
    {
      id: 'textbooks',
      icon: BookText,
      title: 'Cahiers de texte',
      subtitle: 'Suivi pédagogique détaillé',
      description: 'Tenez à jour les cahiers de texte de vos formations. Chaque entrée documente : date, horaires, matière abordée, contenu du cours et travail à faire. Pièces jointes supportées.',
      benefits: ['Entrées liées aux créneaux EDT', 'Historique complet des cours', 'Pièces jointes (PDF, images, etc.)'],
      details: [
        'Création automatique depuis l\'emploi du temps',
        'Champs : matière, contenu, travail à faire',
        'Upload de documents de cours',
        'Vue chronologique par formation',
        'Export PDF des cahiers de texte',
        'Alertes pour entrées manquantes'
      ],
      imagePlaceholder: 'textbooks',
      images: [cahiersTextesImg]
    },
    {
      id: 'schedule',
      icon: CalendarDays,
      title: 'Emplois du temps',
      subtitle: 'Planning intelligent et flexible',
      description: 'Planifiez les séances de formation avec un calendrier visuel. Définissez les modules, formateurs, salles et horaires. Génération automatique des feuilles d\'émargement.',
      benefits: ['Vue calendrier interactive', 'Gestion des salles et formateurs', 'Import Excel des plannings'],
      details: [
        'Vues : jour, semaine, mois, liste',
        'Création de créneaux avec module, formateur, salle',
        'Code couleur par formation ou module',
        'Import massif via fichier Excel',
        'Notifications des changements',
        'Lien automatique avec émargements'
      ],
      imagePlaceholder: 'schedule',
      images: [emploisTempsImg]
    },
    {
      id: 'attendance',
      icon: ClipboardCheck,
      title: 'Gestion des émargements',
      subtitle: 'Signatures numériques conformes',
      description: 'Système d\'émargement digital complet : génération automatique des feuilles depuis l\'EDT, signatures électroniques, QR codes dynamiques, et suivi des présences en temps réel.',
      benefits: ['QR Code dynamique sécurisé', 'Signature électronique tactile', 'Conformité réglementaire'],
      details: [
        'Génération auto depuis les créneaux EDT',
        'QR Code unique par session',
        'Signature sur écran tactile ou mobile',
        'Motifs d\'absence configurables',
        'Validation administrative des feuilles',
        'Export PDF des feuilles signées',
        'Envoi de liens de signature par email'
      ],
      imagePlaceholder: 'attendance',
      images: [emargement1Img]
    },
    {
      id: 'messaging',
      icon: Mail,
      title: 'Messagerie interne',
      subtitle: 'Communication professionnelle',
      description: 'Messagerie intégrée type email pour communiquer avec tous les utilisateurs de votre établissement. Envoyez des messages individuels ou groupés avec pièces jointes.',
      benefits: ['Messages avec pièces jointes', 'Envoi individuel ou groupé', 'Boîte de réception organisée'],
      details: [
        'Composition de messages riches',
        'Sélection multiple de destinataires',
        'Pièces jointes (documents, images)',
        'Dossiers : reçus, envoyés, favoris, archives',
        'Recherche dans les messages',
        'Transfert et réponse rapide'
      ],
      imagePlaceholder: 'messaging',
      images: [messagerie1Img]
    },
    {
      id: 'groups',
      icon: UsersRound,
      title: 'Groupes établissement',
      subtitle: 'Discussions collaboratives',
      description: 'Créez des groupes de discussion pour vos formations, équipes ou projets. Chat en temps réel, partage de fichiers et collaboration instantanée entre membres.',
      benefits: ['Groupes par formation automatiques', 'Chat temps réel', 'Partage de fichiers'],
      details: [
        'Groupes automatiques par formation',
        'Groupes personnalisés (équipes, projets)',
        'Messages en temps réel',
        'Partage de documents',
        'Historique des conversations',
        'Notifications de nouveaux messages'
      ],
      imagePlaceholder: 'groups',
      images: [groupesImg]
    },
    {
      id: 'establishment',
      icon: Building2,
      title: 'Gestion du compte établissement',
      subtitle: 'Configuration et paramètres',
      description: 'Configurez les informations de votre établissement : nom, logo, coordonnées, SIRET. Personnalisez l\'apparence et gérez les paramètres globaux de la plateforme.',
      benefits: ['Logo et identité visuelle', 'Informations légales complètes', 'Personnalisation de l\'interface'],
      details: [
        'Nom et type d\'établissement',
        'Logo personnalisé',
        'Adresse et coordonnées',
        'Numéro SIRET',
        'Directeur et contacts',
        'Paramètres de notifications'
      ],
      imagePlaceholder: 'establishment',
      images: [gestionEtablissementImg]
    },
    {
      id: 'profiles',
      icon: UserCircle,
      title: 'Gestion des profils',
      subtitle: 'Compte utilisateur personnel',
      description: 'Chaque utilisateur dispose d\'un espace profil pour gérer ses informations personnelles, sa photo, sa signature enregistrée et ses préférences de notifications.',
      benefits: ['Photo de profil', 'Signature électronique enregistrée', 'Préférences personnelles'],
      details: [
        'Photo de profil personnalisée',
        'Informations de contact',
        'Signature tactile enregistrée',
        'Préférences de notifications',
        'Changement de mot de passe',
        'Historique des connexions'
      ],
      imagePlaceholder: 'profiles',
      images: [profilImg]
    },
    {
      id: 'tutors',
      icon: Briefcase,
      title: 'Espace tuteurs entreprises',
      subtitle: 'Suivi des alternants',
      description: 'Espace dédié aux tuteurs entreprises pour le suivi de leurs alternants. Visualisation des plannings, consultation des présences et communication avec l\'établissement.',
      benefits: ['Vue planning de l\'alternant', 'Suivi des présences', 'Communication directe'],
      details: [
        'Accès au planning de l\'alternant',
        'Consultation des feuilles d\'émargement',
        'Vue des formations en cours',
        'Contact avec l\'établissement',
        'Informations du contrat d\'alternance',
        'Notifications des absences'
      ],
      imagePlaceholder: 'tutors',
      images: [espaceTuteursImg]
    },
    {
      id: 'workspace',
      icon: Layers,
      title: 'Espace de travail',
      subtitle: 'Suite collaborative complète',
      description: 'Un espace de travail intégré avec éditeur de documents, tableur professionnel (150+ formules), présentations style Canva et éditeur visuel. Collaborez en temps réel et partagez vos créations.',
      benefits: ['Éditeur de documents multi-pages', 'Tableur avec 150+ formules', 'Présentations interactives'],
      details: [
        'Éditeur de texte style Word avec pagination',
        'Tableur Excel++ avec XLOOKUP, INDEX, MATCH',
        'Présentations Canva-like avec drag & drop',
        'Éditeur visuel avec 300+ templates',
        'Collaboration en temps réel',
        'Partage avec permissions granulaires',
        'Dossiers et organisation des fichiers'
      ],
      imagePlaceholder: 'workspace',
      images: [espaceTravailImg]
    },
    {
      id: 'virtual-classes',
      icon: Monitor,
      title: 'Classes virtuelles',
      subtitle: 'À venir',
      description: 'Organisez des sessions de formation en ligne avec visioconférence intégrée. Partagez votre écran, interagissez en temps réel avec vos apprenants et enregistrez vos sessions pour les rendre accessibles ultérieurement.',
      benefits: ['Visioconférence intégrée', 'Partage d\'écran', 'Enregistrement des sessions'],
      details: [
        'Création de classes virtuelles planifiées',
        'Visioconférence HD avec audio/vidéo',
        'Partage d\'écran et présentation',
        'Chat en direct pendant les sessions',
        'Enregistrement automatique',
        'Supports pédagogiques partagés',
        'Gestion des participants'
      ],
      imagePlaceholder: 'virtual-classes',
      images: [classesVirtuellesImg]
    }
  ];

  return (
    <div className="min-h-screen landing-gradient-bg overflow-x-hidden relative">
      {/* Global decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-[600px] h-[600px] opacity-[0.07]" style={{
          background: 'radial-gradient(circle, hsl(240 60% 30%) 0%, transparent 70%)',
          top: '-5%', left: '-10%',
          filter: 'blur(80px)',
          animation: 'blob-float 25s ease-in-out infinite'
        }} />
        <div className="absolute w-[500px] h-[500px] opacity-[0.06]" style={{
          background: 'radial-gradient(circle, hsl(245 55% 25%) 0%, transparent 70%)',
          top: '30%', right: '-8%',
          filter: 'blur(80px)',
          animation: 'blob-float 30s ease-in-out infinite 5s'
        }} />
        <div className="absolute w-[400px] h-[400px] opacity-[0.05]" style={{
          background: 'radial-gradient(circle, hsl(240 60% 20%) 0%, transparent 70%)',
          bottom: '10%', left: '20%',
          filter: 'blur(70px)',
          animation: 'blob-float 20s ease-in-out infinite 10s'
        }} />
        <div className="absolute w-[350px] h-[350px] opacity-[0.04]" style={{
          background: 'radial-gradient(circle, hsl(250 60% 25%) 0%, transparent 70%)',
          top: '60%', left: '-5%',
          filter: 'blur(60px)',
          animation: 'blob-float 22s ease-in-out infinite 8s'
        }} />
      </div>

      <LandingHeader />
      {/* Spacer pour compenser le header fixed */}
      <div className="h-14 md:h-16" />

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

          {/* Logo Presentation Section - Light Violet Theme */}
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
                      animation: `pulse-glow ${3 + i * 0.5}s ease-in-out infinite ${i * 0.3}s`
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
                  animation: 'pulse-glow 3s ease-in-out infinite'
                }}
              />
              <div 
                className="absolute w-24 h-24 md:w-40 md:h-40 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 200, 0, 0.15) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                  animation: 'pulse-glow 4s ease-in-out infinite 1.5s'
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
                        ? `radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)`
                        : `radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)`,
                      animation: `float-particle ${Math.random() * 10 + 10}s ease-in-out infinite ${Math.random() * 5}s`
                    }}
                  />
                ))}
              </div>

              {/* Effet de brillance traversante */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 60%)',
                  animation: 'shine-sweep 6s ease-in-out infinite'
                }}
              />
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fade" delay={600} className="flex flex-wrap justify-center gap-6 md:gap-10 text-sm md:text-base text-muted-foreground">
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

      {/* Features Count Section */}
        <section className="py-12 md:py-16 relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, hsl(262 83% 58%) 0%, hsl(280 75% 55%) 40%, hsl(300 65% 50%) 70%, hsl(262 83% 50%) 100%)'
        }}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%27%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
        {/* Shimmer overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[200%] h-full opacity-[0.08]" style={{
            background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
            animation: 'shimmer-line 8s ease-in-out infinite'
          }} />
        </div>
        {/* Floating icons in stats bar */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <BookOpen className="absolute text-white/[0.08] w-12 h-12" style={{ top: '10%', left: '5%', animation: 'float-slow 8s ease-in-out infinite' }} />
          <GraduationCap className="absolute text-white/[0.08] w-10 h-10" style={{ top: '20%', right: '8%', animation: 'float-slow-reverse 9s ease-in-out infinite 2s' }} />
          <Lightbulb className="absolute text-white/[0.06] w-8 h-8" style={{ bottom: '15%', left: '40%', animation: 'drift-horizontal 10s ease-in-out infinite 1s' }} />
          <Star className="absolute text-white/[0.07] w-6 h-6" style={{ top: '30%', left: '70%', animation: 'float-slow 7s ease-in-out infinite 3s' }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-primary-foreground">
            <AnimatedSection animation="fade-up" delay={0}>
              <div className="text-4xl md:text-5xl font-bold mb-2">
                <AnimatedCounter end={14} suffix="" />
              </div>
              <div className="text-primary-foreground/80 text-sm md:text-base">Modules complets</div>
            </AnimatedSection>
            <AnimatedSection animation="fade-up" delay={100}>
              <div className="text-4xl md:text-5xl font-bold mb-2">
                <AnimatedCounter end={100} suffix="%" />
              </div>
              <div className="text-primary-foreground/80 text-sm md:text-base">Dématérialisé</div>
            </AnimatedSection>
            <AnimatedSection animation="fade-up" delay={200}>
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-primary-foreground/80 text-sm md:text-base">Accessible</div>
            </AnimatedSection>
            <AnimatedSection animation="fade-up" delay={300}>
              <div className="text-4xl md:text-5xl font-bold mb-2">∞</div>
              <div className="text-primary-foreground/80 text-sm md:text-base">Utilisateurs</div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <SectionDivider variant="curve" flip fillColor="fill-muted/30" />

      {/* Comment ça marche - Timeline Section */}
       <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 section-soft-bg" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Zap className="h-4 w-4 text-primary mr-2" />
              <span className="text-primary font-medium text-sm">Simple et rapide</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Comment ça <span className="gradient-text-animated">marche ?</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Démarrez en 3 étapes simples et digitalisez votre gestion de formation
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-24 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-primary/30 via-accent/40 to-primary/30" />
            
            {[
              { step: '01', title: 'Créez votre établissement', description: 'Inscrivez-vous gratuitement et configurez votre établissement en quelques clics. Logo, informations, c\'est parti !', icon: Building2 },
              { step: '02', title: 'Configurez vos formations', description: 'Ajoutez vos formations, modules, emplois du temps et invitez vos formateurs et apprenants par email.', icon: GraduationCap },
              { step: '03', title: 'Gérez tout au quotidien', description: 'Émargements, cahiers de texte, messagerie, groupes... Tout est automatisé et centralisé pour vous.', icon: Sparkles },
            ].map((item, i) => (
              <AnimatedSection key={i} animation="fade-up" delay={i * 150}>
                <div className="relative text-center group">
                  {/* Step number circle */}
                  <div className="relative mx-auto mb-6 w-20 h-20">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur-lg" />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-xs font-bold text-primary shadow-md">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
       <section id="fonctionnalites" className="py-16 md:py-24 relative overflow-hidden">
        {/* Soft gradient background for features section */}
        <div className="absolute inset-0 section-soft-bg-alt" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[300px] h-[300px] opacity-[0.08]" style={{
            background: 'radial-gradient(circle, hsl(262 83% 65%) 0%, transparent 70%)',
            top: '10%', right: '5%', filter: 'blur(60px)',
            animation: 'blob-float 18s ease-in-out infinite'
          }} />
          <div className="absolute w-[250px] h-[250px] opacity-[0.06]" style={{
            background: 'radial-gradient(circle, hsl(330 60% 65%) 0%, transparent 70%)',
            top: '40%', left: '0%', filter: 'blur(50px)',
            animation: 'blob-float 22s ease-in-out infinite 4s'
          }} />
        </div>
        {/* Decorative pedagogical background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <BookOpen className="absolute text-primary/[0.04] w-20 h-20 md:w-32 md:h-32" style={{ top: '5%', right: '5%', animation: 'float-slow 12s ease-in-out infinite' }} />
          <GraduationCap className="absolute text-accent/[0.04] w-16 h-16 md:w-24 md:h-24" style={{ top: '20%', left: '3%', animation: 'float-slow-reverse 15s ease-in-out infinite 3s' }} />
          <Lightbulb className="absolute text-warning/[0.05] w-12 h-12 md:w-20 md:h-20" style={{ top: '40%', right: '8%', animation: 'drift-horizontal 13s ease-in-out infinite 2s' }} />
          <Pencil className="absolute text-primary/[0.04] w-14 h-14 md:w-20 md:h-20" style={{ top: '55%', left: '5%', animation: 'float-slow 10s ease-in-out infinite 4s' }} />
          <Star className="absolute text-accent/[0.04] w-10 h-10 md:w-16 md:h-16" style={{ top: '70%', right: '12%', animation: 'float-slow-reverse 11s ease-in-out infinite 1s' }} />
          <Award className="absolute text-primary/[0.03] w-16 h-16 md:w-24 md:h-24" style={{ top: '85%', left: '8%', animation: 'drift-horizontal 16s ease-in-out infinite 5s' }} />
          <FileText className="absolute text-accent/[0.04] w-12 h-12 md:w-18 md:h-18" style={{ top: '30%', left: '90%', animation: 'float-slow 14s ease-in-out infinite 6s' }} />
          
          {/* Decorative geometric shapes */}
          <div className="absolute w-64 h-64 rounded-full border border-primary/[0.03]" style={{ top: '15%', left: '-5%', animation: 'spin-slow 50s linear infinite' }} />
          <div className="absolute w-48 h-48 rounded-full border border-dashed border-accent/[0.03]" style={{ top: '50%', right: '-3%', animation: 'spin-slow 35s linear infinite reverse' }} />
          <div className="absolute w-80 h-80 rounded-full border border-primary/[0.02]" style={{ bottom: '10%', left: '30%', animation: 'spin-slow 60s linear infinite' }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-16 md:mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Clock className="h-4 w-4 text-primary mr-2" />
              <span className="text-primary font-medium text-sm">Gagnez du temps au quotidien</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Toutes les solutions dont vous avez besoin
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Une plateforme complète avec 14 modules puissants pour gérer efficacement votre établissement d'enseignement supérieur, organisme de formation, CFA ou université
            </p>
          </AnimatedSection>

          <div className="space-y-24 md:space-y-32">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isEven = index % 2 === 0;
              
              return (
                <AnimatedSection 
                  key={feature.id}
                  animation={isEven ? 'fade-right' : 'fade-left'}
                  delay={100}
                  className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16`}
                >
                  {/* Content */}
                  <div className="flex-1 max-w-xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                        <Icon className="h-7 w-7 text-primary-foreground" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-primary uppercase tracking-wider">{feature.subtitle}</span>
                        <h3 className="text-2xl md:text-3xl font-bold text-foreground">{feature.title}</h3>
                      </div>
                    </div>
                    
                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      {feature.description}
                    </p>
                    
                    <ul className="space-y-2 mb-6">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center text-foreground">
                          <CheckCircle2 className="h-5 w-5 text-success mr-3 flex-shrink-0" />
                          <span className="text-base md:text-lg font-medium">{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Détails supplémentaires */}
                     <div className="rounded-xl p-4 border border-primary/10 relative overflow-hidden detail-box-bg">
                      {/* Subtle shimmer */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                        <div style={{
                          position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.08), transparent)',
                          animation: 'shimmer-line 6s ease-in-out infinite'
                        }} />
                      </div>
                      <p className="text-sm font-semibold text-foreground mb-3 relative z-10">Fonctionnalités détaillées :</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 relative z-10">
                        {feature.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start text-sm text-muted-foreground">
                            <span className="text-primary mr-2">•</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Images - animated feature illustration */}
                  <div className="flex-1 w-full max-w-2xl">
                    {feature.images && feature.images.length > 0 ? (
                      <AnimatedFeatureImage
                        images={feature.images}
                        title={feature.title}
                        icon={Icon}
                        index={index}
                      />
                    ) : (
                      <div className="relative group">
                        <Hover3DCard intensity={6}>
                          <div className="relative overflow-hidden rounded-2xl shadow-2xl" style={{
                            background: 'linear-gradient(135deg, hsl(262 83% 30%) 0%, hsl(270 75% 25%) 40%, hsl(280 65% 20%) 100%)'
                          }}>
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                              <div className="absolute -top-[20%] -left-[10%] w-[55%] h-[80%] rounded-full bg-white/[0.06] blur-sm" />
                              <div className="absolute -bottom-[15%] -right-[8%] w-[45%] h-[70%] rounded-full bg-white/[0.04] blur-sm" />
                            </div>
                            <div className="relative z-10 flex flex-col items-center justify-center p-16 text-center">
                              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Icon className="h-10 w-10 text-white/80" />
                              </div>
                              <p className="text-white/50 text-sm">Image à venir</p>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 z-30 flex items-end justify-end p-4">
                              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                                <span className="text-xs font-semibold text-white">NF</span>
                                <span className="text-xs text-white/80">Nectforma</span>
                              </div>
                            </div>
                          </div>
                        </Hover3DCard>
                      </div>
                    )}
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, hsl(262 83% 55%) 0%, hsl(270 75% 50%) 30%, hsl(300 65% 48%) 60%, hsl(280 75% 52%) 100%)'
        }}>
        <div className="absolute inset-0 opacity-25" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        {/* Glow orbs in CTA */}
        <div className="absolute w-[300px] h-[300px] opacity-20 rounded-full" style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          top: '-10%', right: '10%', filter: 'blur(50px)'
        }} />
        <div className="absolute w-[200px] h-[200px] opacity-15 rounded-full" style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.4) 0%, transparent 70%)',
          bottom: '-5%', left: '15%', filter: 'blur(40px)'
        }} />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
            Prêt à transformer votre gestion ?
          </h2>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-10">
            Rejoignez les établissements d'enseignement supérieur, organismes de formation, CFA et universités qui ont déjà adopté NECTFORMA
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/create-establishment" 
              className="group inline-flex items-center px-8 py-4 bg-background text-primary rounded-xl hover:shadow-2xl transform hover:scale-105 font-bold text-lg transition-all justify-center"
            >
              Créer mon établissement
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/auth" 
              className="inline-flex items-center px-8 py-4 border-2 border-primary-foreground/30 text-primary-foreground rounded-xl hover:bg-primary-foreground/10 font-semibold text-lg transition-all justify-center"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
       <section className="py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 section-newsletter-bg" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection animation="fade-up">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Mail className="h-4 w-4 text-primary mr-2" />
              <span className="text-primary font-medium text-sm">Newsletter</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Restez informé des <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">dernières actualités</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Recevez nos articles, conseils et actualités sur la formation professionnelle directement dans votre boîte mail.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
                const email = emailInput?.value?.trim();
                if (!email) return;

                try {
                  const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email-brevo`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                      },
                      body: JSON.stringify({
                        to: email,
                        subject: 'Bienvenue dans la newsletter Nectforma !',
                        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;"><div style="text-align:center;margin-bottom:30px;"><div style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#A855F7);padding:12px 20px;border-radius:12px;"><span style="color:white;font-weight:800;font-size:20px;">NF</span></div></div><h1 style="text-align:center;color:#1f2937;font-size:24px;">Bienvenue dans la newsletter Nectforma !</h1><p style="color:#6b7280;text-align:center;font-size:16px;line-height:1.6;">Merci de votre inscription. Vous recevrez désormais nos derniers articles, conseils et actualités sur la formation professionnelle.</p><div style="text-align:center;margin-top:30px;"><a href="https://nectforme.lovable.app/blog" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#A855F7);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Découvrir nos articles</a></div></div>`,
                      }),
                    }
                  );

                  // Save subscriber via a simple insert
                  const { supabase } = await import('@/integrations/supabase/client');
                  await supabase.from('newsletter_subscribers').upsert(
                    { email, is_active: true },
                    { onConflict: 'email' }
                  );

                  if (response.ok) {
                    toast.success('Inscription réussie ! Vérifiez votre boîte mail.');
                    form.reset();
                  } else {
                    toast.success('Inscription enregistrée !');
                    form.reset();
                  }
                } catch (error) {
                  console.error('Newsletter subscription error:', error);
                  toast.error("Erreur lors de l'inscription. Veuillez réessayer.");
                }
              }}
            >
              <input
                type="email"
                required
                placeholder="votre@email.com"
                className="flex-1 px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl hover:shadow-lg font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Send className="h-4 w-4" />
                S'inscrire
              </button>
            </form>
            <p className="text-xs text-muted-foreground mt-4">
              En vous inscrivant, vous acceptez de recevoir nos communications. Désabonnement possible à tout moment.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Contact Section */}
       <section id="contact" className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 section-contact-bg" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Mail className="h-4 w-4 text-primary mr-2" />
              <span className="text-primary font-medium">Contactez-nous</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Une question ? <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Parlons-en</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Notre équipe est à votre disposition pour répondre à toutes vos questions et vous accompagner dans votre projet.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 border border-primary/20">
                <h3 className="text-xl font-bold text-foreground mb-4">Pourquoi nous contacter ?</h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    Démonstration personnalisée
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    Devis sur mesure
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    Questions techniques
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    Partenariats et intégrations
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card rounded-2xl p-8 border border-border shadow-lg">
              <h3 className="text-2xl font-bold text-foreground mb-6">Envoyez-nous un message</h3>
              <form className="space-y-6" onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                
                const formData = new FormData(e.currentTarget);
                const data = {
                  firstName: formData.get('firstName') as string,
                  lastName: formData.get('lastName') as string,
                  email: formData.get('email') as string,
                  subject: formData.get('subject') as string,
                  message: formData.get('message') as string,
                };

                try {
                  const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-form`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                      },
                      body: JSON.stringify(data),
                    }
                  );

                  const result = await response.json();

                  if (response.ok) {
                    toast.success("Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.");
                    (e.target as HTMLFormElement).reset();
                  } else {
                    throw new Error(result.error || "Erreur lors de l'envoi");
                  }
                } catch (error) {
                  console.error('Error sending contact form:', error);
                  toast.error("Erreur lors de l'envoi du message. Veuillez réessayer.");
                } finally {
                  setIsSubmitting(false);
                }
              }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                      Prénom
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                      Nom
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                    Sujet
                  </label>
                  <Select name="subject" required>
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Sélectionnez un sujet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo">Demande de démonstration</SelectItem>
                      <SelectItem value="devis">Demande de devis</SelectItem>
                      <SelectItem value="support">Support technique</SelectItem>
                      <SelectItem value="partenariat">Partenariat</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground resize-none"
                    placeholder="Décrivez votre demande..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:shadow-lg transform hover:scale-[1.02] font-semibold text-lg transition-all flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                  {!isSubmitting && <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-foreground py-12 md:py-16 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <NectformaLogo variant="gradient" size="lg" />
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                La plateforme complète pour digitaliser et automatiser la gestion des établissements d'enseignement supérieur, organismes de formation, CFA et universités.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#fonctionnalites" className="hover:text-primary transition-colors">Solutions</a></li>
                <li><Link to="/fonctionnalites" className="hover:text-primary transition-colors">Fonctionnalités</Link></li>
                <li><Link to="/pourquoi-nous" className="hover:text-primary transition-colors">Pourquoi nous ?</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/cgu" className="hover:text-primary transition-colors">CGU</Link></li>
                <li><Link to="/politique-confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center text-muted-foreground text-sm">
            <p>© 2025 NECTFORMA. Tous droits réservés.</p>
            <p className="mt-2 md:mt-0">Made with ❤️ for formation professionals</p>
          </div>
        </div>
      </footer>

      {/* Floating Elements */}
      <FloatingCTA />
      <ChatWidget />
       
    </div>
  );
};

export default Index;