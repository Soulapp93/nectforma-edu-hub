// Professional presentation templates inspired by Canva, Google Slides, etc.

export interface PresentationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  color: string;
  premium?: boolean;
  slides: PresentationSlide[];
}

export interface PresentationSlide {
  id: string;
  elements: PresentationElement[];
  background: string;
  backgroundImage?: string;
}

export interface PresentationElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  src?: string;
  shape?: 'rectangle' | 'circle' | 'rounded' | 'line';
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  fontFamily?: string;
  textAlign?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  opacity?: number;
  rotation?: number;
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: string;
  borderColor?: string;
  borderWidth?: number;
}

const uid = () => Math.random().toString(36).slice(2, 8);

// ═══════════════════════════════════════════
// BUSINESS TEMPLATES
// ═══════════════════════════════════════════

const pitchDeck: PresentationTemplate = {
  id: 'pitch-deck',
  name: 'Pitch Deck Startup',
  description: 'Présentation investisseurs moderne et impactante',
  category: 'Business',
  thumbnail: '🚀',
  color: '#6366f1',
  slides: [
    {
      id: uid(), background: '#0f0f23', elements: [
        { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 540, backgroundColor: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)', shape: 'rectangle' },
        { id: uid(), type: 'shape', x: 600, y: -100, width: 500, height: 500, backgroundColor: '#6366f1', shape: 'circle', opacity: 0.1 },
        { id: uid(), type: 'shape', x: -100, y: 300, width: 300, height: 300, backgroundColor: '#8b5cf6', shape: 'circle', opacity: 0.08 },
        { id: uid(), type: 'text', x: 80, y: 140, width: 500, height: 80, content: 'NomStartup', fontSize: 56, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Inter' },
        { id: uid(), type: 'shape', x: 80, y: 230, width: 60, height: 4, backgroundColor: '#6366f1', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 80, y: 250, width: 500, height: 60, content: 'Révolutionner [industrie] grâce à\n[votre solution innovante]', fontSize: 22, color: '#a5b4fc', lineHeight: 1.4 },
        { id: uid(), type: 'text', x: 80, y: 440, width: 400, height: 30, content: 'Seed Round · Q1 2025 · Confidentiel', fontSize: 14, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 2 },
      ]
    },
    {
      id: uid(), background: '#ffffff', elements: [
        { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 6, backgroundColor: '#6366f1', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 60, y: 40, width: 400, height: 50, content: 'Le Problème', fontSize: 36, fontWeight: 'bold', color: '#1e293b' },
        { id: uid(), type: 'shape', x: 60, y: 110, width: 400, height: 160, backgroundColor: '#fef2f2', shape: 'rounded', borderRadius: 16 },
        { id: uid(), type: 'text', x: 80, y: 125, width: 360, height: 130, content: '🔴 Pain Point 1\n\nLes entreprises perdent X% de leur CA à cause de [problème spécifique]', fontSize: 16, color: '#991b1b' },
        { id: uid(), type: 'shape', x: 500, y: 110, width: 400, height: 160, backgroundColor: '#fef2f2', shape: 'rounded', borderRadius: 16 },
        { id: uid(), type: 'text', x: 520, y: 125, width: 360, height: 130, content: '🔴 Pain Point 2\n\nX millions d\'utilisateurs sont frustrés par [situation actuelle]', fontSize: 16, color: '#991b1b' },
        { id: uid(), type: 'shape', x: 60, y: 290, width: 840, height: 80, backgroundColor: '#f1f5f9', shape: 'rounded', borderRadius: 12 },
        { id: uid(), type: 'text', x: 80, y: 305, width: 800, height: 50, content: '💡 Opportunité de marché estimée à X milliards d\'euros', fontSize: 20, fontWeight: 'bold', color: '#1e40af', textAlign: 'center' },
      ]
    },
    {
      id: uid(), background: '#ffffff', elements: [
        { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 6, backgroundColor: '#6366f1', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 60, y: 40, width: 400, height: 50, content: 'Notre Solution', fontSize: 36, fontWeight: 'bold', color: '#1e293b' },
        { id: uid(), type: 'shape', x: 60, y: 110, width: 260, height: 180, backgroundColor: '#eef2ff', shape: 'rounded', borderRadius: 16 },
        { id: uid(), type: 'text', x: 80, y: 130, width: 220, height: 140, content: '⚡\n\nFonctionnalité 1\nDescription courte', fontSize: 16, color: '#4338ca', textAlign: 'center' },
        { id: uid(), type: 'shape', x: 350, y: 110, width: 260, height: 180, backgroundColor: '#eef2ff', shape: 'rounded', borderRadius: 16 },
        { id: uid(), type: 'text', x: 370, y: 130, width: 220, height: 140, content: '🎯\n\nFonctionnalité 2\nDescription courte', fontSize: 16, color: '#4338ca', textAlign: 'center' },
        { id: uid(), type: 'shape', x: 640, y: 110, width: 260, height: 180, backgroundColor: '#eef2ff', shape: 'rounded', borderRadius: 16 },
        { id: uid(), type: 'text', x: 660, y: 130, width: 220, height: 140, content: '🔒\n\nFonctionnalité 3\nDescription courte', fontSize: 16, color: '#4338ca', textAlign: 'center' },
        { id: uid(), type: 'shape', x: 60, y: 320, width: 840, height: 100, backgroundColor: '#6366f1', shape: 'rounded', borderRadius: 16 },
        { id: uid(), type: 'text', x: 80, y: 340, width: 800, height: 60, content: '→ Résultat : +X% d\'efficacité pour nos clients', fontSize: 22, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
      ]
    },
  ]
};

const corporateReport: PresentationTemplate = {
  id: 'corporate-report',
  name: 'Rapport d\'Entreprise',
  description: 'Rapport annuel élégant et professionnel',
  category: 'Business',
  thumbnail: '📊',
  color: '#0ea5e9',
  slides: [
    {
      id: uid(), background: '#0c4a6e', elements: [
        { id: uid(), type: 'shape', x: 0, y: 0, width: 400, height: 540, backgroundColor: '#075985', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 40, y: 160, width: 320, height: 60, content: 'RAPPORT\nANNUEL', fontSize: 42, fontWeight: 'bold', color: '#ffffff', letterSpacing: 3, textTransform: 'uppercase' },
        { id: uid(), type: 'shape', x: 40, y: 240, width: 80, height: 4, backgroundColor: '#38bdf8', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 40, y: 260, width: 320, height: 30, content: '2025', fontSize: 64, fontWeight: 'bold', color: '#38bdf8' },
        { id: uid(), type: 'text', x: 440, y: 400, width: 480, height: 80, content: 'Nom de l\'entreprise\nBilan et perspectives stratégiques', fontSize: 20, color: '#bae6fd', textAlign: 'right' },
      ]
    },
    {
      id: uid(), background: '#ffffff', elements: [
        { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 4, backgroundColor: '#0ea5e9', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 60, y: 30, width: 500, height: 50, content: 'Indicateurs clés', fontSize: 32, fontWeight: 'bold', color: '#0c4a6e' },
        { id: uid(), type: 'shape', x: 60, y: 100, width: 200, height: 140, backgroundColor: '#f0f9ff', shape: 'rounded', borderRadius: 12 },
        { id: uid(), type: 'text', x: 70, y: 110, width: 180, height: 120, content: '📈\n+32%\nCroissance', fontSize: 18, fontWeight: 'bold', color: '#0369a1', textAlign: 'center' },
        { id: uid(), type: 'shape', x: 280, y: 100, width: 200, height: 140, backgroundColor: '#ecfdf5', shape: 'rounded', borderRadius: 12 },
        { id: uid(), type: 'text', x: 290, y: 110, width: 180, height: 120, content: '💰\n2.4M€\nRevenu', fontSize: 18, fontWeight: 'bold', color: '#047857', textAlign: 'center' },
        { id: uid(), type: 'shape', x: 500, y: 100, width: 200, height: 140, backgroundColor: '#fef3c7', shape: 'rounded', borderRadius: 12 },
        { id: uid(), type: 'text', x: 510, y: 110, width: 180, height: 120, content: '👥\n156\nEmployés', fontSize: 18, fontWeight: 'bold', color: '#92400e', textAlign: 'center' },
        { id: uid(), type: 'shape', x: 720, y: 100, width: 200, height: 140, backgroundColor: '#f3e8ff', shape: 'rounded', borderRadius: 12 },
        { id: uid(), type: 'text', x: 730, y: 110, width: 180, height: 120, content: '⭐\n4.9/5\nSatisfaction', fontSize: 18, fontWeight: 'bold', color: '#7c3aed', textAlign: 'center' },
        { id: uid(), type: 'shape', x: 60, y: 280, width: 840, height: 200, backgroundColor: '#f8fafc', shape: 'rounded', borderRadius: 12 },
        { id: uid(), type: 'text', x: 80, y: 300, width: 800, height: 160, content: 'Faits marquants du trimestre\n\n• Lancement de 3 nouveaux produits\n• Expansion sur 2 nouveaux marchés\n• Certification ISO 9001 obtenue\n• Partenariat stratégique avec [Entreprise]', fontSize: 16, color: '#475569' },
      ]
    },
  ]
};

const proposalTemplate: PresentationTemplate = {
  id: 'proposal',
  name: 'Proposition Commerciale',
  description: 'Offre client structurée et convaincante',
  category: 'Business',
  thumbnail: '💼',
  color: '#059669',
  slides: [
    {
      id: uid(), background: '#ffffff', elements: [
        { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 540, backgroundColor: '#ecfdf5', shape: 'rectangle' },
        { id: uid(), type: 'shape', x: 0, y: 480, width: 960, height: 60, backgroundColor: '#059669', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 60, y: 120, width: 500, height: 40, content: 'PROPOSITION COMMERCIALE', fontSize: 16, fontWeight: 'bold', color: '#059669', letterSpacing: 4, textTransform: 'uppercase' },
        { id: uid(), type: 'text', x: 60, y: 170, width: 600, height: 80, content: 'Projet [Nom du projet]\npour [Nom du client]', fontSize: 36, fontWeight: 'bold', color: '#1e293b' },
        { id: uid(), type: 'shape', x: 60, y: 270, width: 80, height: 4, backgroundColor: '#059669', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 60, y: 300, width: 400, height: 60, content: 'Préparé par [Votre entreprise]\nDate : Mars 2025', fontSize: 18, color: '#64748b' },
        { id: uid(), type: 'text', x: 60, y: 495, width: 840, height: 30, content: 'Document confidentiel — Ne pas diffuser', fontSize: 14, color: '#ffffff', textAlign: 'center' },
      ]
    },
    {
      id: uid(), background: '#ffffff', elements: [
        { id: uid(), type: 'shape', x: 0, y: 0, width: 6, height: 540, backgroundColor: '#059669', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 40, y: 30, width: 400, height: 50, content: 'Notre approche', fontSize: 32, fontWeight: 'bold', color: '#1e293b' },
        { id: uid(), type: 'shape', x: 40, y: 100, width: 880, height: 1, backgroundColor: '#e2e8f0', shape: 'rectangle' },
        { id: uid(), type: 'shape', x: 40, y: 130, width: 60, height: 60, backgroundColor: '#dcfce7', shape: 'circle' },
        { id: uid(), type: 'text', x: 55, y: 143, width: 30, height: 30, content: '1', fontSize: 22, fontWeight: 'bold', color: '#059669', textAlign: 'center' },
        { id: uid(), type: 'text', x: 120, y: 135, width: 800, height: 50, content: 'Audit & Analyse — Compréhension des besoins', fontSize: 18, color: '#1e293b' },
        { id: uid(), type: 'shape', x: 40, y: 220, width: 60, height: 60, backgroundColor: '#dcfce7', shape: 'circle' },
        { id: uid(), type: 'text', x: 55, y: 233, width: 30, height: 30, content: '2', fontSize: 22, fontWeight: 'bold', color: '#059669', textAlign: 'center' },
        { id: uid(), type: 'text', x: 120, y: 225, width: 800, height: 50, content: 'Conception & Développement — Solution sur mesure', fontSize: 18, color: '#1e293b' },
        { id: uid(), type: 'shape', x: 40, y: 310, width: 60, height: 60, backgroundColor: '#dcfce7', shape: 'circle' },
        { id: uid(), type: 'text', x: 55, y: 323, width: 30, height: 30, content: '3', fontSize: 22, fontWeight: 'bold', color: '#059669', textAlign: 'center' },
        { id: uid(), type: 'text', x: 120, y: 315, width: 800, height: 50, content: 'Déploiement & Suivi — Accompagnement continu', fontSize: 18, color: '#1e293b' },
      ]
    },
  ]
};

// ═══════════════════════════════════════════
// EDUCATION TEMPLATES
// ═══════════════════════════════════════════

const courseTemplate: PresentationTemplate = {
  id: 'course',
  name: 'Cours / Formation',
  description: 'Support pédagogique structuré et engageant',
  category: 'Éducation',
  thumbnail: '🎓',
  color: '#7c3aed',
  slides: [
    {
      id: uid(), background: '#7c3aed', elements: [
        { id: uid(), type: 'shape', x: 500, y: -50, width: 600, height: 600, backgroundColor: '#6d28d9', shape: 'circle', opacity: 0.3 },
        { id: uid(), type: 'text', x: 60, y: 60, width: 200, height: 30, content: 'MODULE 01', fontSize: 16, fontWeight: 'bold', color: '#c4b5fd', letterSpacing: 4 },
        { id: uid(), type: 'text', x: 60, y: 120, width: 500, height: 100, content: 'Titre de la\nFormation', fontSize: 52, fontWeight: 'bold', color: '#ffffff' },
        { id: uid(), type: 'shape', x: 60, y: 240, width: 80, height: 4, backgroundColor: '#a78bfa', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 60, y: 270, width: 400, height: 60, content: 'Objectifs : Comprendre, Analyser, Appliquer\nDurée : 2h · Niveau : Intermédiaire', fontSize: 16, color: '#ddd6fe' },
        { id: uid(), type: 'text', x: 60, y: 460, width: 400, height: 30, content: 'Formateur : Prénom Nom', fontSize: 18, color: '#a78bfa' },
      ]
    },
    {
      id: uid(), background: '#ffffff', elements: [
        { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 70, backgroundColor: '#7c3aed', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 40, y: 18, width: 400, height: 35, content: 'Sommaire', fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
        { id: uid(), type: 'shape', x: 40, y: 95, width: 880, height: 80, backgroundColor: '#f5f3ff', shape: 'rounded', borderRadius: 12 },
        { id: uid(), type: 'text', x: 60, y: 110, width: 840, height: 50, content: '01  Introduction et contexte', fontSize: 20, color: '#5b21b6' },
        { id: uid(), type: 'shape', x: 40, y: 190, width: 880, height: 80, backgroundColor: '#f5f3ff', shape: 'rounded', borderRadius: 12 },
        { id: uid(), type: 'text', x: 60, y: 205, width: 840, height: 50, content: '02  Concepts fondamentaux', fontSize: 20, color: '#5b21b6' },
        { id: uid(), type: 'shape', x: 40, y: 285, width: 880, height: 80, backgroundColor: '#f5f3ff', shape: 'rounded', borderRadius: 12 },
        { id: uid(), type: 'text', x: 60, y: 300, width: 840, height: 50, content: '03  Exercices pratiques', fontSize: 20, color: '#5b21b6' },
        { id: uid(), type: 'shape', x: 40, y: 380, width: 880, height: 80, backgroundColor: '#f5f3ff', shape: 'rounded', borderRadius: 12 },
        { id: uid(), type: 'text', x: 60, y: 395, width: 840, height: 50, content: '04  Évaluation et synthèse', fontSize: 20, color: '#5b21b6' },
      ]
    },
    {
      id: uid(), background: '#ffffff', elements: [
        { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 70, backgroundColor: '#7c3aed', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 40, y: 18, width: 400, height: 35, content: '01 — Introduction', fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
        { id: uid(), type: 'text', x: 40, y: 100, width: 880, height: 350, content: 'Point clé à retenir\n\n• Premier concept important avec explication détaillée\n\n• Deuxième concept avec exemples concrets\n\n• Troisième point avec application pratique\n\n\n💡 Astuce : N\'oubliez pas de prendre des notes !', fontSize: 18, color: '#334155' },
      ]
    },
  ]
};

const thesisDefense: PresentationTemplate = {
  id: 'thesis-defense',
  name: 'Soutenance de Mémoire',
  description: 'Présentation académique formelle',
  category: 'Éducation',
  thumbnail: '🎤',
  color: '#1e293b',
  slides: [
    {
      id: uid(), background: '#1e293b', elements: [
        { id: uid(), type: 'shape', x: 0, y: 480, width: 960, height: 60, backgroundColor: '#dc2626', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 80, y: 80, width: 800, height: 80, content: 'Titre du Mémoire de Recherche', fontSize: 38, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
        { id: uid(), type: 'shape', x: 400, y: 175, width: 160, height: 3, backgroundColor: '#dc2626', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 80, y: 200, width: 800, height: 40, content: 'Sous-titre ou domaine de recherche', fontSize: 20, color: '#94a3b8', textAlign: 'center' },
        { id: uid(), type: 'text', x: 80, y: 340, width: 800, height: 80, content: 'Prénom NOM\nMaster [Spécialité] · 2024-2025\nDirecteur de mémoire : Pr. [Nom]', fontSize: 16, color: '#cbd5e1', textAlign: 'center' },
        { id: uid(), type: 'text', x: 80, y: 490, width: 800, height: 30, content: 'Université [Nom] · [Date de soutenance]', fontSize: 14, color: '#ffffff', textAlign: 'center' },
      ]
    },
    {
      id: uid(), background: '#ffffff', elements: [
        { id: uid(), type: 'shape', x: 0, y: 0, width: 8, height: 540, backgroundColor: '#dc2626', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 40, y: 30, width: 400, height: 40, content: 'Plan de soutenance', fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
        { id: uid(), type: 'text', x: 40, y: 90, width: 880, height: 400, content: '1. Contexte et problématique\n\n2. Revue de littérature\n\n3. Méthodologie de recherche\n\n4. Résultats et analyse\n\n5. Discussion\n\n6. Conclusion et perspectives\n\n7. Questions', fontSize: 20, color: '#475569' },
      ]
    },
  ]
};

// ═══════════════════════════════════════════
// MARKETING / CREATIVE TEMPLATES
// ═══════════════════════════════════════════

const productLaunch: PresentationTemplate = {
  id: 'product-launch',
  name: 'Lancement de Produit',
  description: 'Présentation de nouveau produit dynamique',
  category: 'Marketing',
  thumbnail: '🎉',
  color: '#f97316',
  slides: [
    {
      id: uid(), background: '#0f172a', elements: [
        { id: uid(), type: 'shape', x: 600, y: 0, width: 360, height: 540, backgroundColor: '#f97316', shape: 'rectangle', opacity: 0.1 },
        { id: uid(), type: 'text', x: 60, y: 60, width: 200, height: 25, content: 'NOUVEAU', fontSize: 14, fontWeight: 'bold', color: '#f97316', letterSpacing: 6, textTransform: 'uppercase' },
        { id: uid(), type: 'text', x: 60, y: 120, width: 500, height: 120, content: 'Nom du\nProduit', fontSize: 64, fontWeight: 'bold', color: '#ffffff' },
        { id: uid(), type: 'text', x: 60, y: 260, width: 480, height: 60, content: 'La solution qui change tout.\nDisponible dès maintenant.', fontSize: 20, color: '#94a3b8' },
        { id: uid(), type: 'shape', x: 60, y: 360, width: 200, height: 50, backgroundColor: '#f97316', shape: 'rounded', borderRadius: 25 },
        { id: uid(), type: 'text', x: 70, y: 370, width: 180, height: 30, content: 'Découvrir →', fontSize: 18, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
      ]
    },
    {
      id: uid(), background: '#ffffff', elements: [
        { id: uid(), type: 'text', x: 60, y: 30, width: 840, height: 50, content: 'Pourquoi notre produit ?', fontSize: 32, fontWeight: 'bold', color: '#0f172a' },
        { id: uid(), type: 'shape', x: 60, y: 100, width: 270, height: 200, backgroundColor: '#fff7ed', shape: 'rounded', borderRadius: 16 },
        { id: uid(), type: 'text', x: 80, y: 120, width: 230, height: 160, content: '⚡\n\nRapide\nPerformance x10\npar rapport à la\nconcurrence', fontSize: 15, color: '#c2410c', textAlign: 'center' },
        { id: uid(), type: 'shape', x: 345, y: 100, width: 270, height: 200, backgroundColor: '#fff7ed', shape: 'rounded', borderRadius: 16 },
        { id: uid(), type: 'text', x: 365, y: 120, width: 230, height: 160, content: '🛡️\n\nSécurisé\nProtection des\ndonnées de\nniveau militaire', fontSize: 15, color: '#c2410c', textAlign: 'center' },
        { id: uid(), type: 'shape', x: 630, y: 100, width: 270, height: 200, backgroundColor: '#fff7ed', shape: 'rounded', borderRadius: 16 },
        { id: uid(), type: 'text', x: 650, y: 120, width: 230, height: 160, content: '🎨\n\nIntuitif\nInterface pensée\npour tous\nles utilisateurs', fontSize: 15, color: '#c2410c', textAlign: 'center' },
        { id: uid(), type: 'shape', x: 60, y: 340, width: 840, height: 120, backgroundColor: '#f97316', shape: 'rounded', borderRadius: 16 },
        { id: uid(), type: 'text', x: 80, y: 365, width: 800, height: 70, content: '"Le meilleur investissement de l\'année"\n— Magazine Tech · ⭐⭐⭐⭐⭐', fontSize: 20, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
      ]
    },
  ]
};

const socialMediaPlan: PresentationTemplate = {
  id: 'social-media',
  name: 'Stratégie Social Media',
  description: 'Plan marketing réseaux sociaux',
  category: 'Marketing',
  thumbnail: '📱',
  color: '#ec4899',
  slides: [
    {
      id: uid(), background: '#fdf2f8', elements: [
        { id: uid(), type: 'shape', x: 0, y: 0, width: 480, height: 540, backgroundColor: '#ec4899', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 40, y: 160, width: 400, height: 80, content: 'Stratégie\nSocial Media', fontSize: 42, fontWeight: 'bold', color: '#ffffff' },
        { id: uid(), type: 'text', x: 40, y: 260, width: 400, height: 30, content: '2025 · [Votre marque]', fontSize: 18, color: '#fbcfe8' },
        { id: uid(), type: 'text', x: 520, y: 200, width: 400, height: 140, content: '📊 Audit actuel\n🎯 Objectifs\n📅 Calendrier\n💡 Contenus\n📈 KPIs', fontSize: 22, color: '#831843' },
      ]
    },
    {
      id: uid(), background: '#ffffff', elements: [
        { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 5, backgroundColor: '#ec4899', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 60, y: 30, width: 500, height: 50, content: 'Objectifs & KPIs', fontSize: 32, fontWeight: 'bold', color: '#1e293b' },
        { id: uid(), type: 'shape', x: 60, y: 100, width: 420, height: 120, backgroundColor: '#fdf2f8', shape: 'rounded', borderRadius: 12 },
        { id: uid(), type: 'text', x: 80, y: 115, width: 380, height: 90, content: '📈 Notoriété\n+50% de reach en 6 mois\n+10K followers', fontSize: 16, color: '#9d174d' },
        { id: uid(), type: 'shape', x: 500, y: 100, width: 420, height: 120, backgroundColor: '#fdf2f8', shape: 'rounded', borderRadius: 12 },
        { id: uid(), type: 'text', x: 520, y: 115, width: 380, height: 90, content: '💬 Engagement\nTaux > 5%\n+200% de commentaires', fontSize: 16, color: '#9d174d' },
        { id: uid(), type: 'shape', x: 60, y: 240, width: 420, height: 120, backgroundColor: '#fdf2f8', shape: 'rounded', borderRadius: 12 },
        { id: uid(), type: 'text', x: 80, y: 255, width: 380, height: 90, content: '🔗 Trafic\n+30% de clics vers le site\nConversion > 3%', fontSize: 16, color: '#9d174d' },
        { id: uid(), type: 'shape', x: 500, y: 240, width: 420, height: 120, backgroundColor: '#fdf2f8', shape: 'rounded', borderRadius: 12 },
        { id: uid(), type: 'text', x: 520, y: 255, width: 380, height: 90, content: '🛒 Conversion\n+25% de ventes via social\nROI > 300%', fontSize: 16, color: '#9d174d' },
      ]
    },
  ]
};

const creativePortfolio: PresentationTemplate = {
  id: 'creative-portfolio',
  name: 'Portfolio Créatif',
  description: 'Showcase de travaux et projets',
  category: 'Créatif',
  thumbnail: '🎨',
  color: '#f43f5e',
  slides: [
    {
      id: uid(), background: '#18181b', elements: [
        { id: uid(), type: 'text', x: 60, y: 60, width: 300, height: 30, content: 'PORTFOLIO', fontSize: 14, fontWeight: 'bold', color: '#71717a', letterSpacing: 8 },
        { id: uid(), type: 'text', x: 60, y: 140, width: 600, height: 120, content: 'Prénom\nNom', fontSize: 72, fontWeight: 'bold', color: '#ffffff' },
        { id: uid(), type: 'shape', x: 60, y: 280, width: 120, height: 4, backgroundColor: '#f43f5e', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 60, y: 310, width: 500, height: 60, content: 'Designer UI/UX · Directeur Artistique\nwww.votresite.com', fontSize: 18, color: '#a1a1aa' },
      ]
    },
    {
      id: uid(), background: '#18181b', elements: [
        { id: uid(), type: 'text', x: 60, y: 30, width: 300, height: 30, content: '— PROJET 01', fontSize: 14, fontWeight: 'bold', color: '#f43f5e', letterSpacing: 4 },
        { id: uid(), type: 'text', x: 60, y: 70, width: 500, height: 50, content: 'Nom du projet', fontSize: 36, fontWeight: 'bold', color: '#ffffff' },
        { id: uid(), type: 'shape', x: 60, y: 140, width: 840, height: 300, backgroundColor: '#27272a', shape: 'rounded', borderRadius: 16 },
        { id: uid(), type: 'text', x: 100, y: 220, width: 760, height: 80, content: '[ Votre visuel de projet ici ]\nCliquez pour ajouter une image', fontSize: 18, color: '#52525b', textAlign: 'center' },
        { id: uid(), type: 'text', x: 60, y: 460, width: 840, height: 50, content: 'Brief : Description courte du projet, technologies utilisées et résultats obtenus.', fontSize: 16, color: '#71717a' },
      ]
    },
  ]
};

const minimalClean: PresentationTemplate = {
  id: 'minimal-clean',
  name: 'Minimaliste Épuré',
  description: 'Design ultra-clean et moderne',
  category: 'Créatif',
  thumbnail: '✨',
  color: '#1e293b',
  slides: [
    {
      id: uid(), background: '#ffffff', elements: [
        { id: uid(), type: 'text', x: 80, y: 180, width: 800, height: 80, content: 'Titre Principal', fontSize: 56, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' },
        { id: uid(), type: 'shape', x: 430, y: 275, width: 100, height: 3, backgroundColor: '#0f172a', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 80, y: 300, width: 800, height: 40, content: 'Sous-titre descriptif élégant', fontSize: 20, color: '#94a3b8', textAlign: 'center' },
      ]
    },
    {
      id: uid(), background: '#ffffff', elements: [
        { id: uid(), type: 'text', x: 60, y: 40, width: 400, height: 40, content: 'Section', fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
        { id: uid(), type: 'shape', x: 60, y: 85, width: 40, height: 3, backgroundColor: '#0f172a', shape: 'rectangle' },
        { id: uid(), type: 'text', x: 60, y: 120, width: 840, height: 350, content: 'Contenu principal de votre diapositive.\n\nUtilisez ce template pour des présentations sobres et professionnelles qui mettent en valeur votre contenu sans distraction visuelle.\n\n• Point important 1\n• Point important 2\n• Point important 3', fontSize: 18, color: '#475569', lineHeight: 1.6 },
      ]
    },
  ]
};

const gradientModern: PresentationTemplate = {
  id: 'gradient-modern',
  name: 'Gradient Moderne',
  description: 'Design tendance avec dégradés vibrants',
  category: 'Créatif',
  thumbnail: '🌈',
  color: '#8b5cf6',
  slides: [
    {
      id: uid(), background: '#1e1b4b', elements: [
        { id: uid(), type: 'shape', x: -100, y: -100, width: 500, height: 500, backgroundColor: '#7c3aed', shape: 'circle', opacity: 0.3 },
        { id: uid(), type: 'shape', x: 600, y: 200, width: 400, height: 400, backgroundColor: '#ec4899', shape: 'circle', opacity: 0.2 },
        { id: uid(), type: 'shape', x: 300, y: 400, width: 300, height: 300, backgroundColor: '#06b6d4', shape: 'circle', opacity: 0.15 },
        { id: uid(), type: 'text', x: 80, y: 150, width: 800, height: 100, content: 'Titre Accrocheur\nde Présentation', fontSize: 48, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
        { id: uid(), type: 'text', x: 80, y: 280, width: 800, height: 40, content: 'Sous-titre avec une touche de créativité', fontSize: 22, color: '#c4b5fd', textAlign: 'center' },
        { id: uid(), type: 'shape', x: 330, y: 350, width: 300, height: 50, backgroundColor: '#a855f7', shape: 'rounded', borderRadius: 25 },
        { id: uid(), type: 'text', x: 340, y: 360, width: 280, height: 30, content: 'Commencer →', fontSize: 18, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
      ]
    },
    {
      id: uid(), background: '#1e1b4b', elements: [
        { id: uid(), type: 'shape', x: 700, y: -100, width: 400, height: 400, backgroundColor: '#7c3aed', shape: 'circle', opacity: 0.2 },
        { id: uid(), type: 'text', x: 60, y: 30, width: 500, height: 50, content: 'Points clés', fontSize: 36, fontWeight: 'bold', color: '#ffffff' },
        { id: uid(), type: 'shape', x: 60, y: 100, width: 420, height: 150, backgroundColor: '#312e81', shape: 'rounded', borderRadius: 16, borderColor: '#4338ca', borderWidth: 1 },
        { id: uid(), type: 'text', x: 80, y: 120, width: 380, height: 110, content: '01 · Premier Point\n\nDescription concise de votre premier argument avec impact', fontSize: 16, color: '#c4b5fd' },
        { id: uid(), type: 'shape', x: 500, y: 100, width: 420, height: 150, backgroundColor: '#312e81', shape: 'rounded', borderRadius: 16, borderColor: '#4338ca', borderWidth: 1 },
        { id: uid(), type: 'text', x: 520, y: 120, width: 380, height: 110, content: '02 · Deuxième Point\n\nDescription concise de votre deuxième argument percutant', fontSize: 16, color: '#c4b5fd' },
        { id: uid(), type: 'shape', x: 60, y: 270, width: 860, height: 150, backgroundColor: '#312e81', shape: 'rounded', borderRadius: 16, borderColor: '#4338ca', borderWidth: 1 },
        { id: uid(), type: 'text', x: 80, y: 290, width: 820, height: 110, content: '03 · Conclusion Forte\n\nVotre message principal résumé en une phrase impactante qui reste en mémoire.', fontSize: 16, color: '#c4b5fd' },
      ]
    },
  ]
};

// Blank template
const blankTemplate: PresentationTemplate = {
  id: 'blank',
  name: 'Présentation vierge',
  description: 'Commencer de zéro',
  category: 'Basique',
  thumbnail: '📄',
  color: '#64748b',
  slides: [
    { id: uid(), elements: [], background: '#ffffff' }
  ]
};

// ═══════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════

export const presentationTemplates: PresentationTemplate[] = [
  blankTemplate,
  pitchDeck,
  corporateReport,
  proposalTemplate,
  courseTemplate,
  thesisDefense,
  productLaunch,
  socialMediaPlan,
  creativePortfolio,
  minimalClean,
  gradientModern,
];

export const getPresentationCategories = (): string[] => {
  const cats = new Set(presentationTemplates.map(t => t.category));
  return ['Tous', ...Array.from(cats)];
};

export const getPresentationTemplatesByCategory = (category: string): PresentationTemplate[] => {
  if (category === 'Tous') return presentationTemplates;
  return presentationTemplates.filter(t => t.category === category);
};

// Curated free images from Unsplash (direct URLs, no API key needed)
export const curatedImageCollections = {
  'Business': [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop',
  ],
  'Technologie': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
  ],
  'Nature': [
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=300&fit=crop',
  ],
  'Personnes': [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=300&fit=crop',
  ],
  'Architecture': [
    'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1448630360428-65456885c650?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1431576901776-e539bd916ba2?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1486718448742-163732cd1544?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1464082354059-27db6ce50048?w=400&h=300&fit=crop',
  ],
  'Abstrait': [
    'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1604076913837-52ab5f7c1ac4?w=400&h=300&fit=crop',
  ],
};

export const textPresets = [
  { label: 'Titre', fontSize: 48, fontWeight: 'bold' as const, width: 600, height: 80 },
  { label: 'Sous-titre', fontSize: 28, fontWeight: 'normal' as const, width: 500, height: 50 },
  { label: 'Corps de texte', fontSize: 18, fontWeight: 'normal' as const, width: 400, height: 120 },
  { label: 'Légende', fontSize: 14, fontWeight: 'normal' as const, width: 300, height: 30 },
  { label: 'Citation', fontSize: 24, fontWeight: 'normal' as const, fontStyle: 'italic', width: 500, height: 80 },
  { label: 'Titre XL', fontSize: 72, fontWeight: 'bold' as const, width: 800, height: 100 },
];

export const shapePresets = [
  { label: 'Rectangle', shape: 'rectangle' as const, width: 200, height: 150, backgroundColor: '#3b82f6' },
  { label: 'Cercle', shape: 'circle' as const, width: 150, height: 150, backgroundColor: '#8b5cf6' },
  { label: 'Arrondi', shape: 'rounded' as const, width: 200, height: 120, backgroundColor: '#10b981', borderRadius: 20 },
  { label: 'Ligne', shape: 'line' as const, width: 300, height: 4, backgroundColor: '#1e293b' },
  { label: 'Carré', shape: 'rectangle' as const, width: 150, height: 150, backgroundColor: '#f97316' },
  { label: 'Pilule', shape: 'rounded' as const, width: 250, height: 50, backgroundColor: '#ec4899', borderRadius: 25 },
  { label: 'Badge', shape: 'rounded' as const, width: 120, height: 40, backgroundColor: '#059669', borderRadius: 20 },
  { label: 'Bannière', shape: 'rectangle' as const, width: 960, height: 80, backgroundColor: '#1e293b' },
];

export const colorPalettes = [
  { name: 'Professionnel', colors: ['#1e293b', '#334155', '#3b82f6', '#60a5fa', '#f8fafc', '#ffffff'] },
  { name: 'Vibrant', colors: ['#7c3aed', '#ec4899', '#f97316', '#06b6d4', '#10b981', '#f43f5e'] },
  { name: 'Nature', colors: ['#064e3b', '#059669', '#34d399', '#d1fae5', '#fef3c7', '#f59e0b'] },
  { name: 'Monochrome', colors: ['#000000', '#1f2937', '#4b5563', '#9ca3af', '#e5e7eb', '#ffffff'] },
  { name: 'Sunset', colors: ['#7c2d12', '#dc2626', '#f97316', '#facc15', '#fef9c3', '#ffffff'] },
  { name: 'Ocean', colors: ['#0c4a6e', '#0284c7', '#38bdf8', '#bae6fd', '#f0f9ff', '#ffffff'] },
];
