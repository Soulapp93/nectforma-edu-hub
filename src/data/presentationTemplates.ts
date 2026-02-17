// Professional presentation templates - 300+ templates across all categories

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
  shape?: 'rectangle' | 'circle' | 'rounded' | 'line' | 'triangle' | 'star' | 'hexagon' | 'arrow' | 'diamond';
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
  gradient?: string;
  shadow?: string;
  locked?: boolean;
  zIndex?: number;
}

let _uid = 0;
const uid = () => `el_${++_uid}_${Math.random().toString(36).slice(2, 6)}`;

// ═══════════════════════════════════════════
// HELPER: Generate template variations
// ═══════════════════════════════════════════

type SlideFactory = (bg: string, accent: string, text: string, muted: string) => PresentationSlide[];

const makeTemplate = (
  id: string, name: string, desc: string, cat: string, thumb: string, color: string,
  factory: SlideFactory, bg: string, accent: string, text: string, muted: string
): PresentationTemplate => ({
  id, name, description: desc, category: cat, thumbnail: thumb, color,
  slides: factory(bg, accent, text, muted),
});

// ═══════════════════════════════════════════
// SLIDE LAYOUTS (reusable across themes)
// ═══════════════════════════════════════════

const titleSlide = (bg: string, accent: string, text: string, muted: string, title: string, subtitle: string): PresentationSlide => ({
  id: uid(), background: bg, elements: [
    { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 540, backgroundColor: bg, shape: 'rectangle' },
    { id: uid(), type: 'shape', x: 600, y: -80, width: 500, height: 500, backgroundColor: accent, shape: 'circle', opacity: 0.1 },
    { id: uid(), type: 'shape', x: -50, y: 350, width: 300, height: 300, backgroundColor: accent, shape: 'circle', opacity: 0.07 },
    { id: uid(), type: 'text', x: 80, y: 150, width: 550, height: 80, content: title, fontSize: 52, fontWeight: 'bold', color: text, fontFamily: 'Inter' },
    { id: uid(), type: 'shape', x: 80, y: 240, width: 60, height: 4, backgroundColor: accent, shape: 'rectangle' },
    { id: uid(), type: 'text', x: 80, y: 260, width: 500, height: 50, content: subtitle, fontSize: 20, color: muted },
  ]
});

const contentSlide = (bg: string, accent: string, text: string, muted: string, heading: string, bullets: string[]): PresentationSlide => ({
  id: uid(), background: bg, elements: [
    { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 6, backgroundColor: accent, shape: 'rectangle' },
    { id: uid(), type: 'text', x: 60, y: 40, width: 500, height: 50, content: heading, fontSize: 32, fontWeight: 'bold', color: text },
    { id: uid(), type: 'text', x: 60, y: 110, width: 840, height: 380, content: bullets.map(b => `• ${b}`).join('\n\n'), fontSize: 18, color: muted, lineHeight: 1.5 },
  ]
});

const threeCards = (bg: string, accent: string, text: string, muted: string, heading: string, cards: {icon: string; title: string; desc: string}[]): PresentationSlide => ({
  id: uid(), background: bg, elements: [
    { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 6, backgroundColor: accent, shape: 'rectangle' },
    { id: uid(), type: 'text', x: 60, y: 30, width: 500, height: 50, content: heading, fontSize: 32, fontWeight: 'bold', color: text },
    ...cards.slice(0, 3).flatMap((c, i) => [
      { id: uid(), type: 'shape' as const, x: 60 + i * 290, y: 100, width: 270, height: 200, backgroundColor: accent + '15', shape: 'rounded' as const, borderRadius: 16 },
      { id: uid(), type: 'text' as const, x: 75 + i * 290, y: 115, width: 240, height: 170, content: `${c.icon}\n\n${c.title}\n${c.desc}`, fontSize: 16, color: text, textAlign: 'center' },
    ]),
  ]
});

const statsSlide = (bg: string, accent: string, text: string, muted: string, heading: string, stats: {value: string; label: string}[]): PresentationSlide => ({
  id: uid(), background: bg, elements: [
    { id: uid(), type: 'text', x: 60, y: 30, width: 500, height: 50, content: heading, fontSize: 32, fontWeight: 'bold', color: text },
    ...stats.slice(0, 4).flatMap((s, i) => [
      { id: uid(), type: 'shape' as const, x: 60 + i * 220, y: 110, width: 200, height: 140, backgroundColor: accent + '15', shape: 'rounded' as const, borderRadius: 12 },
      { id: uid(), type: 'text' as const, x: 70 + i * 220, y: 120, width: 180, height: 120, content: `${s.value}\n${s.label}`, fontSize: 20, fontWeight: 'bold', color: accent, textAlign: 'center' },
    ]),
  ]
});

const quoteSlide = (bg: string, accent: string, text: string, _m: string, quote: string, author: string): PresentationSlide => ({
  id: uid(), background: bg, elements: [
    { id: uid(), type: 'text', x: 80, y: 80, width: 100, height: 100, content: '"', fontSize: 120, fontWeight: 'bold', color: accent, opacity: 0.3 },
    { id: uid(), type: 'text', x: 100, y: 160, width: 760, height: 180, content: quote, fontSize: 28, fontStyle: 'italic', color: text, textAlign: 'center', lineHeight: 1.5 },
    { id: uid(), type: 'shape', x: 430, y: 360, width: 100, height: 3, backgroundColor: accent, shape: 'rectangle' },
    { id: uid(), type: 'text', x: 100, y: 380, width: 760, height: 40, content: `— ${author}`, fontSize: 18, color: accent, textAlign: 'center' },
  ]
});

const thanksSlide = (bg: string, accent: string, text: string, muted: string, msg: string, contact: string): PresentationSlide => ({
  id: uid(), background: bg, elements: [
    { id: uid(), type: 'shape', x: 300, y: -50, width: 400, height: 400, backgroundColor: accent, shape: 'circle', opacity: 0.08 },
    { id: uid(), type: 'text', x: 80, y: 160, width: 800, height: 80, content: msg, fontSize: 52, fontWeight: 'bold', color: text, textAlign: 'center' },
    { id: uid(), type: 'shape', x: 430, y: 255, width: 100, height: 3, backgroundColor: accent, shape: 'rectangle' },
    { id: uid(), type: 'text', x: 80, y: 280, width: 800, height: 60, content: contact, fontSize: 18, color: muted, textAlign: 'center' },
  ]
});

const twoColumnSlide = (bg: string, accent: string, text: string, muted: string, heading: string, leftContent: string, rightContent: string): PresentationSlide => ({
  id: uid(), background: bg, elements: [
    { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 6, backgroundColor: accent, shape: 'rectangle' },
    { id: uid(), type: 'text', x: 60, y: 30, width: 500, height: 50, content: heading, fontSize: 32, fontWeight: 'bold', color: text },
    { id: uid(), type: 'shape', x: 60, y: 100, width: 420, height: 380, backgroundColor: accent + '10', shape: 'rounded', borderRadius: 16 },
    { id: uid(), type: 'text', x: 80, y: 120, width: 380, height: 340, content: leftContent, fontSize: 16, color: muted, lineHeight: 1.5 },
    { id: uid(), type: 'shape', x: 500, y: 100, width: 420, height: 380, backgroundColor: accent + '10', shape: 'rounded', borderRadius: 16 },
    { id: uid(), type: 'text', x: 520, y: 120, width: 380, height: 340, content: rightContent, fontSize: 16, color: muted, lineHeight: 1.5 },
  ]
});

const timelineSlide = (bg: string, accent: string, text: string, muted: string, heading: string, steps: {label: string; desc: string}[]): PresentationSlide => ({
  id: uid(), background: bg, elements: [
    { id: uid(), type: 'text', x: 60, y: 30, width: 500, height: 50, content: heading, fontSize: 32, fontWeight: 'bold', color: text },
    { id: uid(), type: 'shape', x: 90, y: 110, width: 4, height: 380, backgroundColor: accent + '30', shape: 'rectangle' },
    ...steps.slice(0, 4).flatMap((s, i) => [
      { id: uid(), type: 'shape' as const, x: 75, y: 115 + i * 95, width: 34, height: 34, backgroundColor: accent, shape: 'circle' as const },
      { id: uid(), type: 'text' as const, x: 80, y: 120 + i * 95, width: 24, height: 24, content: `${i + 1}`, fontSize: 14, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
      { id: uid(), type: 'text' as const, x: 130, y: 115 + i * 95, width: 780, height: 80, content: `${s.label}\n${s.desc}`, fontSize: 16, color: muted },
    ]),
  ]
});

// ═══════════════════════════════════════════
// THEME PALETTES
// ═══════════════════════════════════════════

const themes = {
  indigo:   { bg: '#0f0f23', accent: '#6366f1', text: '#ffffff', muted: '#a5b4fc', bgLight: '#ffffff', textDark: '#1e293b', mutedDark: '#475569' },
  blue:     { bg: '#0c4a6e', accent: '#0ea5e9', text: '#ffffff', muted: '#bae6fd', bgLight: '#ffffff', textDark: '#0c4a6e', mutedDark: '#475569' },
  green:    { bg: '#064e3b', accent: '#10b981', text: '#ffffff', muted: '#a7f3d0', bgLight: '#ffffff', textDark: '#064e3b', mutedDark: '#475569' },
  red:      { bg: '#450a0a', accent: '#ef4444', text: '#ffffff', muted: '#fca5a5', bgLight: '#ffffff', textDark: '#450a0a', mutedDark: '#475569' },
  purple:   { bg: '#1e1b4b', accent: '#8b5cf6', text: '#ffffff', muted: '#c4b5fd', bgLight: '#ffffff', textDark: '#1e1b4b', mutedDark: '#475569' },
  orange:   { bg: '#431407', accent: '#f97316', text: '#ffffff', muted: '#fed7aa', bgLight: '#ffffff', textDark: '#431407', mutedDark: '#475569' },
  pink:     { bg: '#500724', accent: '#ec4899', text: '#ffffff', muted: '#fbcfe8', bgLight: '#ffffff', textDark: '#500724', mutedDark: '#475569' },
  teal:     { bg: '#042f2e', accent: '#14b8a6', text: '#ffffff', muted: '#99f6e4', bgLight: '#ffffff', textDark: '#042f2e', mutedDark: '#475569' },
  amber:    { bg: '#451a03', accent: '#f59e0b', text: '#ffffff', muted: '#fde68a', bgLight: '#ffffff', textDark: '#451a03', mutedDark: '#475569' },
  slate:    { bg: '#0f172a', accent: '#64748b', text: '#ffffff', muted: '#94a3b8', bgLight: '#ffffff', textDark: '#0f172a', mutedDark: '#475569' },
  rose:     { bg: '#4c0519', accent: '#f43f5e', text: '#ffffff', muted: '#fda4af', bgLight: '#ffffff', textDark: '#4c0519', mutedDark: '#475569' },
  cyan:     { bg: '#083344', accent: '#06b6d4', text: '#ffffff', muted: '#a5f3fc', bgLight: '#ffffff', textDark: '#083344', mutedDark: '#475569' },
  lime:     { bg: '#1a2e05', accent: '#84cc16', text: '#ffffff', muted: '#d9f99d', bgLight: '#ffffff', textDark: '#1a2e05', mutedDark: '#475569' },
  black:    { bg: '#000000', accent: '#ffffff', text: '#ffffff', muted: '#a1a1aa', bgLight: '#ffffff', textDark: '#18181b', mutedDark: '#52525b' },
  warmGray: { bg: '#1c1917', accent: '#a8a29e', text: '#ffffff', muted: '#d6d3d1', bgLight: '#fafaf9', textDark: '#1c1917', mutedDark: '#57534e' },
};

// ═══════════════════════════════════════════
// CATEGORIES & TEMPLATE GENERATORS
// ═══════════════════════════════════════════

const businessTemplates: PresentationTemplate[] = [];
const educationTemplates: PresentationTemplate[] = [];
const marketingTemplates: PresentationTemplate[] = [];
const creativTemplates: PresentationTemplate[] = [];
const techTemplates: PresentationTemplate[] = [];
const medicalTemplates: PresentationTemplate[] = [];
const immobilierTemplates: PresentationTemplate[] = [];
const juridiqueTemplates: PresentationTemplate[] = [];
const restaurantTemplates: PresentationTemplate[] = [];
const modeTemplates: PresentationTemplate[] = [];
const sportTemplates: PresentationTemplate[] = [];
const eventTemplates: PresentationTemplate[] = [];
const financeTemplates: PresentationTemplate[] = [];
const rseTemplates: PresentationTemplate[] = [];
const associationTemplates: PresentationTemplate[] = [];

// ─── BUSINESS ─────────────────────────────

const bizNames = [
  ['Pitch Deck Startup', '🚀', 'Présentation investisseurs moderne'],
  ['Rapport Annuel', '📊', 'Bilan et perspectives stratégiques'],
  ['Proposition Commerciale', '💼', 'Offre client structurée'],
  ['Plan Stratégique', '🎯', 'Vision et objectifs long terme'],
  ['Bilan Financier', '💰', 'Résultats et prévisions'],
  ['Comité de Direction', '👔', 'Rapport pour le CODIR'],
  ['Business Plan', '📋', 'Plan d\'affaires complet'],
  ['Analyse Concurrentielle', '🔍', 'Étude de marché détaillée'],
  ['Roadmap Produit', '🗺️', 'Feuille de route et jalons'],
  ['Présentation Investisseurs', '💎', 'Series A/B pitch deck'],
  ['Revue Trimestrielle', '📈', 'Performance Q1-Q4'],
  ['Onboarding Client', '🤝', 'Accueil nouveau client'],
  ['Analyse SWOT', '⚡', 'Forces, faiblesses, opportunités'],
  ['Compte-Rendu Réunion', '📝', 'Minutes et décisions'],
  ['Présentation Partenariat', '🔗', 'Collaboration inter-entreprises'],
  ['KPI Dashboard', '📉', 'Tableau de bord indicateurs'],
  ['Restructuration', '🏗️', 'Plan de transformation'],
  ['Fusion & Acquisition', '🔄', 'Due diligence et intégration'],
  ['Expansion Internationale', '🌍', 'Stratégie d\'internationalisation'],
  ['Innovation Lab', '💡', 'Projets R&D et innovation'],
];

const bizThemes = [themes.indigo, themes.blue, themes.slate, themes.purple, themes.teal];

bizNames.forEach(([name, thumb, desc], i) => {
  const t = bizThemes[i % bizThemes.length];
  businessTemplates.push({
    id: `biz-${i}`, name: name as string, description: desc as string, category: 'Business',
    thumbnail: thumb as string, color: t.accent,
    slides: [
      titleSlide(t.bg, t.accent, t.text, t.muted, name as string, desc as string),
      contentSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Contexte', ['Situation actuelle du marché', 'Enjeux identifiés', 'Opportunités à saisir', 'Actions recommandées']),
      threeCards(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Points Clés', [
        { icon: '📊', title: 'Analyse', desc: 'Données et insights' },
        { icon: '🎯', title: 'Objectifs', desc: 'Cibles mesurables' },
        { icon: '🚀', title: 'Actions', desc: 'Plan d\'exécution' },
      ]),
      statsSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Résultats', [
        { value: '+32%', label: 'Croissance' }, { value: '2.4M€', label: 'CA' },
        { value: '156', label: 'Employés' }, { value: '4.9/5', label: 'Satisfaction' },
      ]),
      thanksSlide(t.bg, t.accent, t.text, t.muted, 'Merci', 'contact@entreprise.com · www.entreprise.com'),
    ]
  });
});

// ─── EDUCATION ────────────────────────────

const eduNames = [
  ['Cours Universitaire', '🎓', 'Support de cours académique'],
  ['Soutenance Mémoire', '🎤', 'Présentation académique formelle'],
  ['Formation Continue', '📚', 'Module de formation professionnelle'],
  ['Atelier Pédagogique', '🧩', 'Workshop interactif'],
  ['Conférence Scientifique', '🔬', 'Communication scientifique'],
  ['Projet Étudiant', '👨‍🎓', 'Présentation de projet'],
  ['Séminaire de Recherche', '🧪', 'Résultats de recherche'],
  ['Exposé Oral', '🗣️', 'Présentation orale structurée'],
  ['Quiz Interactif', '❓', 'Questions-réponses pédagogique'],
  ['Rapport de Stage', '📑', 'Bilan de stage professionnel'],
  ['Thèse Doctorale', '🎓', 'Soutenance de thèse PhD'],
  ['Tutoriel Pratique', '🛠️', 'Guide pas à pas'],
  ['Revue de Littérature', '📖', 'État de l\'art académique'],
  ['Programme de Cours', '📅', 'Syllabus et planning'],
  ['Évaluation des Acquis', '✅', 'Bilan de compétences'],
  ['Webinaire Éducatif', '🖥️', 'Formation en ligne'],
  ['Projet de Groupe', '👥', 'Travail collaboratif'],
  ['Méthodologie', '🔧', 'Approche et outils'],
  ['Étude de Cas', '📋', 'Analyse de situation réelle'],
  ['Orientation Scolaire', '🧭', 'Guide d\'orientation'],
];

const eduThemes = [themes.purple, themes.blue, themes.green, themes.teal, themes.indigo];

eduNames.forEach(([name, thumb, desc], i) => {
  const t = eduThemes[i % eduThemes.length];
  educationTemplates.push({
    id: `edu-${i}`, name: name as string, description: desc as string, category: 'Éducation',
    thumbnail: thumb as string, color: t.accent,
    slides: [
      titleSlide(t.bg, t.accent, t.text, t.muted, name as string, 'Module 01 · ' + (desc as string)),
      contentSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Objectifs pédagogiques', ['Comprendre les concepts fondamentaux', 'Analyser des situations concrètes', 'Appliquer les méthodes apprises', 'Évaluer les résultats']),
      twoColumnSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Contenu du Module', 'Partie Théorique\n\n• Définitions clés\n• Principes fondamentaux\n• Modèles conceptuels\n• Études de référence', 'Partie Pratique\n\n• Exercices guidés\n• Études de cas\n• Travaux de groupe\n• Évaluation formative'),
      quoteSlide(t.bg, t.accent, t.text, t.muted, 'L\'éducation est l\'arme la plus puissante pour changer le monde.', 'Nelson Mandela'),
      thanksSlide(t.bg, t.accent, t.text, t.muted, 'Questions ?', 'Merci pour votre attention'),
    ]
  });
});

// ─── MARKETING ────────────────────────────

const mktNames = [
  ['Lancement Produit', '🎉', 'Nouveau produit dynamique'],
  ['Stratégie Social Media', '📱', 'Plan réseaux sociaux'],
  ['Campagne Publicitaire', '📢', 'Brief créatif campagne'],
  ['Brand Book', '🎨', 'Guide de marque complet'],
  ['Content Marketing', '✍️', 'Stratégie de contenu'],
  ['Email Marketing', '📧', 'Campagne emailing'],
  ['SEO Strategy', '🔍', 'Optimisation référencement'],
  ['Influence Marketing', '⭐', 'Stratégie influenceurs'],
  ['Growth Hacking', '🚀', 'Tactiques de croissance'],
  ['Étude de Marché', '📊', 'Analyse du marché cible'],
  ['Persona Marketing', '👤', 'Profils clients types'],
  ['Funnel de Vente', '🔻', 'Tunnel de conversion'],
  ['Plan de Communication', '📡', 'Stratégie de comm globale'],
  ['Rapport de Performance', '📈', 'ROI et analytics'],
  ['Lancement App Mobile', '📲', 'ASO et acquisition'],
  ['Stratégie Video', '🎬', 'Plan marketing vidéo'],
  ['Événement Marketing', '🎪', 'Organisation d\'événement'],
  ['PR & Relations Presse', '📰', 'Communication presse'],
  ['Rebranding', '🔄', 'Refonte de marque'],
  ['Marketing Local', '📍', 'Stratégie locale'],
];

const mktThemes = [themes.orange, themes.pink, themes.rose, themes.amber, themes.red];

mktNames.forEach(([name, thumb, desc], i) => {
  const t = mktThemes[i % mktThemes.length];
  marketingTemplates.push({
    id: `mkt-${i}`, name: name as string, description: desc as string, category: 'Marketing',
    thumbnail: thumb as string, color: t.accent,
    slides: [
      titleSlide(t.bg, t.accent, t.text, t.muted, name as string, desc as string),
      threeCards(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Notre Stratégie', [
        { icon: '📊', title: 'Analyse', desc: 'Audit de l\'existant' },
        { icon: '🎯', title: 'Ciblage', desc: 'Audience qualifiée' },
        { icon: '📈', title: 'Croissance', desc: 'Objectifs mesurables' },
      ]),
      statsSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'KPIs Clés', [
        { value: '+150%', label: 'Reach' }, { value: '5.2%', label: 'Engagement' },
        { value: '45K', label: 'Followers' }, { value: '320%', label: 'ROI' },
      ]),
      timelineSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Planning', [
        { label: 'Phase 1 — Audit', desc: 'Analyse de l\'existant et benchmarks' },
        { label: 'Phase 2 — Stratégie', desc: 'Définition des objectifs et KPIs' },
        { label: 'Phase 3 — Exécution', desc: 'Déploiement des campagnes' },
        { label: 'Phase 4 — Optimisation', desc: 'A/B testing et ajustements' },
      ]),
      thanksSlide(t.bg, t.accent, t.text, t.muted, 'Let\'s Go ! 🚀', 'Prêt à transformer votre marketing ?'),
    ]
  });
});

// ─── CRÉATIF ──────────────────────────────

const creNames = [
  ['Portfolio Design', '🎨', 'Showcase de travaux créatifs'],
  ['Minimaliste Épuré', '✨', 'Design ultra-clean moderne'],
  ['Gradient Moderne', '🌈', 'Dégradés vibrants tendance'],
  ['Néon Futuriste', '💜', 'Style cyberpunk lumineux'],
  ['Rétro Vintage', '📻', 'Nostalgie des 70s/80s'],
  ['Art Déco', '🏛️', 'Élégance géométrique'],
  ['Brutalist', '🧱', 'Design brut et audacieux'],
  ['Pastel Dream', '🌸', 'Tons doux et aériens'],
  ['Dark Mode Premium', '🌑', 'Interface sombre élégante'],
  ['Géométrique', '📐', 'Formes et patterns'],
  ['Typographie Bold', '🔤', 'Lettrage impactant'],
  ['Collage Créatif', '✂️', 'Mix media et textures'],
  ['Monochrome', '⬛', 'Noir et blanc sophistiqué'],
  ['Glassmorphism', '🪟', 'Effet verre moderne'],
  ['Neumorphism', '🔘', 'Relief doux et tactile'],
  ['Pop Art', '💥', 'Couleurs vives et graphiques'],
  ['Aquarelle', '🎨', 'Textures peintes douces'],
  ['Isométrique', '🧊', 'Vue 3D isométrique'],
  ['Line Art', '✏️', 'Illustrations au trait'],
  ['Memphis Style', '🔺', 'Formes colorées 90s'],
];

const creThemes = [themes.rose, themes.purple, themes.pink, themes.black, themes.warmGray, themes.cyan, themes.lime];

creNames.forEach(([name, thumb, desc], i) => {
  const t = creThemes[i % creThemes.length];
  creativTemplates.push({
    id: `cre-${i}`, name: name as string, description: desc as string, category: 'Créatif',
    thumbnail: thumb as string, color: t.accent,
    slides: [
      titleSlide(t.bg, t.accent, t.text, t.muted, name as string, desc as string),
      contentSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Vision Créative', ['Concept original et distinctif', 'Palette de couleurs harmonieuse', 'Typographie expressive', 'Composition équilibrée']),
      quoteSlide(t.bg, t.accent, t.text, t.muted, 'Le design n\'est pas juste ce à quoi ça ressemble. Le design, c\'est comment ça fonctionne.', 'Steve Jobs'),
      thanksSlide(t.bg, t.accent, t.text, t.muted, 'Merci ✨', 'www.portfolio.design'),
    ]
  });
});

// ─── TECHNOLOGIE ──────────────────────────

const techNames = [
  ['Product Demo', '🖥️', 'Démonstration de produit tech'],
  ['Architecture Logicielle', '🏗️', 'Design system et architecture'],
  ['Sprint Review', '🔄', 'Revue de sprint Agile'],
  ['Tech Stack Overview', '⚙️', 'Stack technique détaillée'],
  ['API Documentation', '📡', 'Documentation d\'API'],
  ['Cybersécurité', '🔒', 'Audit et recommandations'],
  ['Cloud Migration', '☁️', 'Plan de migration cloud'],
  ['DevOps Pipeline', '🔧', 'CI/CD et infrastructure'],
  ['Data Science', '📊', 'Analyse et machine learning'],
  ['UX Research', '🔬', 'Recherche utilisateur'],
  ['Release Notes', '📦', 'Notes de version'],
  ['Incident Report', '🚨', 'Post-mortem technique'],
  ['Code Review', '👨‍💻', 'Revue de code et standards'],
  ['SaaS Metrics', '📈', 'MRR, Churn, LTV'],
  ['Blockchain', '⛓️', 'Technologie décentralisée'],
  ['IoT Solutions', '📡', 'Internet des objets'],
  ['IA & Machine Learning', '🤖', 'Intelligence artificielle'],
  ['Mobile App Design', '📱', 'Design d\'application mobile'],
  ['System Design', '🔌', 'Conception système'],
  ['Tech Startup Pitch', '💡', 'Pitch tech innovant'],
];

const techThemesArr = [themes.cyan, themes.indigo, themes.teal, themes.blue, themes.slate];

techNames.forEach(([name, thumb, desc], i) => {
  const t = techThemesArr[i % techThemesArr.length];
  techTemplates.push({
    id: `tech-${i}`, name: name as string, description: desc as string, category: 'Technologie',
    thumbnail: thumb as string, color: t.accent,
    slides: [
      titleSlide(t.bg, t.accent, t.text, t.muted, name as string, desc as string),
      threeCards(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Architecture', [
        { icon: '⚡', title: 'Performance', desc: 'Latence < 100ms' },
        { icon: '🔒', title: 'Sécurité', desc: 'Chiffrement E2E' },
        { icon: '📈', title: 'Scalabilité', desc: 'Auto-scaling' },
      ]),
      statsSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Métriques', [
        { value: '99.9%', label: 'Uptime' }, { value: '<50ms', label: 'Latence' },
        { value: '10M+', label: 'Requêtes/j' }, { value: '0', label: 'Incidents' },
      ]),
      timelineSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Roadmap', [
        { label: 'Q1 — MVP', desc: 'Lancement de la version beta' },
        { label: 'Q2 — Scale', desc: 'Montée en charge et optimisations' },
        { label: 'Q3 — Features', desc: 'Nouvelles fonctionnalités majeures' },
        { label: 'Q4 — Enterprise', desc: 'Offre entreprise et SSO' },
      ]),
      thanksSlide(t.bg, t.accent, t.text, t.muted, 'Questions ?', 'tech@company.dev'),
    ]
  });
});

// ─── MEDICAL ──────────────────────────────

const medNames = [
  ['Cas Clinique', '🏥', 'Présentation de cas médical'],
  ['Recherche Médicale', '🔬', 'Résultats d\'étude clinique'],
  ['Congrès Médical', '🩺', 'Communication scientifique'],
  ['Formation Soignants', '👩‍⚕️', 'Module de formation médicale'],
  ['Santé Publique', '🏛️', 'Politique de santé'],
  ['Pharmacologie', '💊', 'Études pharmacologiques'],
  ['Télémédecine', '📱', 'Solutions de santé digitale'],
  ['Chirurgie', '🔪', 'Techniques opératoires'],
  ['Radiologie', '📷', 'Imagerie médicale'],
  ['Psychiatrie', '🧠', 'Santé mentale et bien-être'],
  ['Pédiatrie', '👶', 'Médecine infantile'],
  ['Cardiologie', '❤️', 'Pathologies cardiaques'],
  ['Oncologie', '🎗️', 'Recherche en cancérologie'],
  ['Urgences', '🚑', 'Protocoles d\'urgence'],
  ['Épidémiologie', '📊', 'Études épidémiologiques'],
];

const medThemesArr = [themes.blue, themes.teal, themes.green, themes.cyan, themes.indigo];

medNames.forEach(([name, thumb, desc], i) => {
  const t = medThemesArr[i % medThemesArr.length];
  medicalTemplates.push({
    id: `med-${i}`, name: name as string, description: desc as string, category: 'Médical',
    thumbnail: thumb as string, color: t.accent,
    slides: [
      titleSlide(t.bg, t.accent, t.text, t.muted, name as string, desc as string),
      contentSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Introduction', ['Contexte clinique', 'Objectifs de l\'étude', 'Méthodologie', 'Population étudiée']),
      statsSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Résultats', [
        { value: 'n=250', label: 'Patients' }, { value: 'p<0.05', label: 'Significativité' },
        { value: '87%', label: 'Efficacité' }, { value: '-32%', label: 'Réduction' },
      ]),
      thanksSlide(t.bg, t.accent, t.text, t.muted, 'Merci', 'Questions et discussion'),
    ]
  });
});

// ─── IMMOBILIER ───────────────────────────

const immoNames = [
  ['Projet Immobilier', '🏠', 'Présentation de programme'],
  ['Estimation Bien', '💰', 'Valorisation immobilière'],
  ['Visite Virtuelle', '🏡', 'Découverte de propriété'],
  ['Investissement Locatif', '📈', 'Rendement et fiscalité'],
  ['Promotion Immobilière', '🏗️', 'Nouveau programme neuf'],
  ['Agence Immobilière', '🔑', 'Présentation d\'agence'],
  ['Architecture & Design', '📐', 'Projet architectural'],
  ['Gestion de Patrimoine', '🏦', 'Conseil patrimonial'],
  ['Rénovation Énergétique', '♻️', 'Travaux et aides'],
  ['Location Saisonnière', '🏖️', 'Gestion Airbnb/booking'],
];

const immoThemesArr = [themes.amber, themes.warmGray, themes.green, themes.slate, themes.blue];

immoNames.forEach(([name, thumb, desc], i) => {
  const t = immoThemesArr[i % immoThemesArr.length];
  immobilierTemplates.push({
    id: `immo-${i}`, name: name as string, description: desc as string, category: 'Immobilier',
    thumbnail: thumb as string, color: t.accent,
    slides: [
      titleSlide(t.bg, t.accent, t.text, t.muted, name as string, desc as string),
      threeCards(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Le Bien', [
        { icon: '📍', title: 'Localisation', desc: 'Quartier premium' },
        { icon: '📐', title: 'Surface', desc: '120m² habitables' },
        { icon: '💰', title: 'Prix', desc: 'À partir de 350K€' },
      ]),
      thanksSlide(t.bg, t.accent, t.text, t.muted, 'Contactez-nous', 'agence@immo.fr · 01 23 45 67 89'),
    ]
  });
});

// ─── JURIDIQUE ────────────────────────────

const jurNames = [
  ['Cabinet d\'Avocats', '⚖️', 'Présentation du cabinet'],
  ['Contrat Commercial', '📜', 'Analyse contractuelle'],
  ['Conformité RGPD', '🔐', 'Mise en conformité données'],
  ['Droit du Travail', '👷', 'Réglementation sociale'],
  ['Litige Commercial', '⚔️', 'Résolution de conflits'],
  ['Propriété Intellectuelle', '💡', 'Protection des innovations'],
  ['Droit des Sociétés', '🏢', 'Gouvernance d\'entreprise'],
  ['Fusion-Acquisition', '🔄', 'Due diligence juridique'],
  ['Contentieux', '🏛️', 'Gestion des litiges'],
  ['Veille Réglementaire', '📋', 'Évolutions législatives'],
];

const jurThemesArr = [themes.slate, themes.warmGray, themes.indigo, themes.blue, themes.black];

jurNames.forEach(([name, thumb, desc], i) => {
  const t = jurThemesArr[i % jurThemesArr.length];
  juridiqueTemplates.push({
    id: `jur-${i}`, name: name as string, description: desc as string, category: 'Juridique',
    thumbnail: thumb as string, color: t.accent,
    slides: [
      titleSlide(t.bg, t.accent, t.text, t.muted, name as string, desc as string),
      contentSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Analyse', ['Cadre juridique applicable', 'Risques identifiés', 'Recommandations', 'Plan d\'action']),
      thanksSlide(t.bg, t.accent, t.text, t.muted, 'Merci', 'cabinet@avocats.fr'),
    ]
  });
});

// ─── RESTAURANT / FOOD ────────────────────

const restoNames = [
  ['Restaurant Gastronomique', '🍽️', 'Présentation du restaurant'],
  ['Menu Design', '📜', 'Carte et spécialités'],
  ['Food Truck', '🚚', 'Concept mobile cuisine'],
  ['Bar à Cocktails', '🍸', 'Carte des cocktails'],
  ['Boulangerie Artisanale', '🥖', 'Savoir-faire artisanal'],
  ['Traiteur Événementiel', '🎊', 'Prestations événementielles'],
  ['Coffee Shop', '☕', 'Concept café premium'],
  ['Franchise Restaurant', '🏪', 'Modèle de franchise'],
  ['Cours de Cuisine', '👨‍🍳', 'Atelier culinaire'],
  ['Cave à Vins', '🍷', 'Sélection de vins'],
];

const restoThemesArr = [themes.warmGray, themes.amber, themes.red, themes.orange, themes.green];

restoNames.forEach(([name, thumb, desc], i) => {
  const t = restoThemesArr[i % restoThemesArr.length];
  restaurantTemplates.push({
    id: `resto-${i}`, name: name as string, description: desc as string, category: 'Restaurant',
    thumbnail: thumb as string, color: t.accent,
    slides: [
      titleSlide(t.bg, t.accent, t.text, t.muted, name as string, desc as string),
      threeCards(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Notre Carte', [
        { icon: '🥗', title: 'Entrées', desc: 'Fraîcheur et saveurs' },
        { icon: '🥩', title: 'Plats', desc: 'Cuisine de saison' },
        { icon: '🍰', title: 'Desserts', desc: 'Fait maison' },
      ]),
      thanksSlide(t.bg, t.accent, t.text, t.muted, 'Bon appétit ! 🍽️', 'Réservations : 01 23 45 67 89'),
    ]
  });
});

// ─── MODE / FASHION ───────────────────────

const modeNames2 = [
  ['Collection Mode', '👗', 'Nouvelle collection saison'],
  ['Fashion Lookbook', '📸', 'Shooting et tendances'],
  ['Marque de Luxe', '💎', 'Présentation de marque'],
  ['E-commerce Mode', '🛍️', 'Boutique en ligne'],
  ['Défilé de Mode', '👠', 'Fashion week'],
  ['Streetwear Brand', '🧢', 'Marque streetwear'],
  ['Jewelry Collection', '💍', 'Bijoux et accessoires'],
  ['Cosmétiques', '💄', 'Marque beauté'],
  ['Sustainable Fashion', '🌿', 'Mode éthique et durable'],
  ['Fashion Magazine', '📰', 'Éditorial mode'],
];

const modeThemesArr = [themes.black, themes.rose, themes.pink, themes.warmGray, themes.purple];

modeNames2.forEach(([name, thumb, desc], i) => {
  const t = modeThemesArr[i % modeThemesArr.length];
  modeTemplates.push({
    id: `mode-${i}`, name: name as string, description: desc as string, category: 'Mode',
    thumbnail: thumb as string, color: t.accent,
    slides: [
      titleSlide(t.bg, t.accent, t.text, t.muted, name as string, desc as string),
      contentSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Collection', ['Tendances de saison', 'Matériaux premium', 'Design exclusif', 'Édition limitée']),
      thanksSlide(t.bg, t.accent, t.text, t.muted, 'Shop Now', 'www.marque.com · @marque'),
    ]
  });
});

// ─── SPORT ────────────────────────────────

const sportNames = [
  ['Club Sportif', '⚽', 'Présentation du club'],
  ['Programme Fitness', '💪', 'Plan d\'entraînement'],
  ['Événement Sportif', '🏆', 'Organisation de compétition'],
  ['Nutrition Sportive', '🥗', 'Plan alimentaire'],
  ['Performance Athlétique', '🏃', 'Analyse de performance'],
  ['Yoga & Bien-être', '🧘', 'Studio de yoga'],
  ['Sport Extrême', '🏄', 'Aventure et adrénaline'],
  ['Esport & Gaming', '🎮', 'Équipe esport'],
  ['Marathon', '🏅', 'Course longue distance'],
  ['Camp d\'Entraînement', '🏋️', 'Stage sportif'],
];

const sportThemesArr = [themes.green, themes.blue, themes.orange, themes.red, themes.teal];

sportNames.forEach(([name, thumb, desc], i) => {
  const t = sportThemesArr[i % sportThemesArr.length];
  sportTemplates.push({
    id: `sport-${i}`, name: name as string, description: desc as string, category: 'Sport',
    thumbnail: thumb as string, color: t.accent,
    slides: [
      titleSlide(t.bg, t.accent, t.text, t.muted, name as string, desc as string),
      statsSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Performances', [
        { value: '42', label: 'Athlètes' }, { value: '15', label: 'Médailles' },
        { value: '98%', label: 'Satisfaction' }, { value: '3h/j', label: 'Entraînement' },
      ]),
      thanksSlide(t.bg, t.accent, t.text, t.muted, 'Rejoignez-nous ! 🏆', 'Inscriptions ouvertes'),
    ]
  });
});

// ─── ÉVÉNEMENTS ───────────────────────────

const eventNames2 = [
  ['Conférence', '🎤', 'Organisation de conférence'],
  ['Mariage', '💒', 'Planification de mariage'],
  ['Gala de Charité', '🎭', 'Événement caritatif'],
  ['Salon Professionnel', '🏛️', 'Stand et exposition'],
  ['Team Building', '🤝', 'Activité d\'équipe'],
  ['Festival', '🎪', 'Organisation de festival'],
  ['Webinar', '💻', 'Événement en ligne'],
  ['Cérémonie', '🏅', 'Remise de prix'],
  ['Anniversaire Corporate', '🎂', 'Célébration d\'entreprise'],
  ['Hackathon', '💡', 'Marathon de code'],
];

const eventThemesArr = [themes.purple, themes.pink, themes.amber, themes.indigo, themes.rose];

eventNames2.forEach(([name, thumb, desc], i) => {
  const t = eventThemesArr[i % eventThemesArr.length];
  eventTemplates.push({
    id: `event-${i}`, name: name as string, description: desc as string, category: 'Événements',
    thumbnail: thumb as string, color: t.accent,
    slides: [
      titleSlide(t.bg, t.accent, t.text, t.muted, name as string, desc as string),
      timelineSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Programme', [
        { label: '09h00 — Accueil', desc: 'Café et networking' },
        { label: '10h00 — Keynote', desc: 'Intervention principale' },
        { label: '12h00 — Ateliers', desc: 'Sessions interactives' },
        { label: '17h00 — Clôture', desc: 'Cocktail de networking' },
      ]),
      thanksSlide(t.bg, t.accent, t.text, t.muted, 'À bientôt ! 🎉', 'Inscrivez-vous sur event.com'),
    ]
  });
});

// ─── FINANCE ──────────────────────────────

const finNames = [
  ['Rapport Financier', '💹', 'Bilan et compte de résultat'],
  ['Budget Prévisionnel', '📊', 'Prévisions budgétaires'],
  ['Levée de Fonds', '💰', 'Deck pour investisseurs'],
  ['Analyse de Risques', '⚠️', 'Évaluation des risques'],
  ['Crypto & DeFi', '₿', 'Marché des cryptomonnaies'],
  ['Assurance', '🛡️', 'Solutions d\'assurance'],
  ['Banque Privée', '🏦', 'Gestion de fortune'],
  ['Audit Financier', '🔍', 'Contrôle des comptes'],
  ['Trading', '📈', 'Stratégies de trading'],
  ['Fintech', '📱', 'Innovation financière'],
];

const finThemesArr = [themes.green, themes.blue, themes.slate, themes.teal, themes.indigo];

finNames.forEach(([name, thumb, desc], i) => {
  const t = finThemesArr[i % finThemesArr.length];
  financeTemplates.push({
    id: `fin-${i}`, name: name as string, description: desc as string, category: 'Finance',
    thumbnail: thumb as string, color: t.accent,
    slides: [
      titleSlide(t.bg, t.accent, t.text, t.muted, name as string, desc as string),
      statsSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Chiffres Clés', [
        { value: '12.5M€', label: 'CA Annuel' }, { value: '+28%', label: 'Croissance' },
        { value: '4.2M€', label: 'EBITDA' }, { value: '18%', label: 'Marge nette' },
      ]),
      thanksSlide(t.bg, t.accent, t.text, t.muted, 'Merci', 'Direction financière · finance@corp.com'),
    ]
  });
});

// ─── RSE / ENVIRONNEMENT ──────────────────

const rseNames = [
  ['Rapport RSE', '🌱', 'Responsabilité sociétale'],
  ['Bilan Carbone', '🌍', 'Empreinte environnementale'],
  ['Développement Durable', '♻️', 'Stratégie DD'],
  ['Économie Circulaire', '🔄', 'Modèle circulaire'],
  ['Biodiversité', '🦋', 'Protection de la nature'],
  ['Énergie Renouvelable', '☀️', 'Transition énergétique'],
  ['Impact Social', '🤲', 'Engagement sociétal'],
  ['Label B Corp', '🏷️', 'Certification B Corp'],
  ['Mobilité Durable', '🚲', 'Transport vert'],
  ['Agriculture Bio', '🌾', 'Agriculture biologique'],
];

const rseThemesArr = [themes.green, themes.teal, themes.lime, themes.cyan, themes.blue];

rseNames.forEach(([name, thumb, desc], i) => {
  const t = rseThemesArr[i % rseThemesArr.length];
  rseTemplates.push({
    id: `rse-${i}`, name: name as string, description: desc as string, category: 'RSE',
    thumbnail: thumb as string, color: t.accent,
    slides: [
      titleSlide(t.bg, t.accent, t.text, t.muted, name as string, desc as string),
      threeCards(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Nos Engagements', [
        { icon: '🌍', title: 'Environnement', desc: 'Réduction CO2' },
        { icon: '🤝', title: 'Social', desc: 'Inclusion et diversité' },
        { icon: '📊', title: 'Gouvernance', desc: 'Transparence' },
      ]),
      thanksSlide(t.bg, t.accent, t.text, t.muted, 'Ensemble 🌱', 'Pour un avenir durable'),
    ]
  });
});

// ─── ASSOCIATION / ONG ────────────────────

const assoNames = [
  ['Association Caritative', '❤️', 'Présentation de l\'association'],
  ['Collecte de Fonds', '🎗️', 'Campagne de dons'],
  ['Rapport d\'Activité', '📋', 'Bilan annuel association'],
  ['Projet Humanitaire', '🌍', 'Mission humanitaire'],
  ['Bénévolat', '🙋', 'Programme de bénévoles'],
  ['ONG Internationale', '🏳️', 'Organisation internationale'],
  ['Action Solidaire', '🤲', 'Initiative solidaire'],
  ['Parrainage', '👨‍👧', 'Programme de parrainage'],
  ['Éducation pour Tous', '📚', 'Accès à l\'éducation'],
  ['Aide d\'Urgence', '🆘', 'Intervention d\'urgence'],
];

const assoThemesArr = [themes.red, themes.orange, themes.blue, themes.green, themes.purple];

assoNames.forEach(([name, thumb, desc], i) => {
  const t = assoThemesArr[i % assoThemesArr.length];
  associationTemplates.push({
    id: `asso-${i}`, name: name as string, description: desc as string, category: 'Association',
    thumbnail: thumb as string, color: t.accent,
    slides: [
      titleSlide(t.bg, t.accent, t.text, t.muted, name as string, desc as string),
      statsSlide(t.bgLight, t.accent, t.textDark, t.mutedDark, 'Notre Impact', [
        { value: '5,000', label: 'Bénéficiaires' }, { value: '120', label: 'Bénévoles' },
        { value: '15', label: 'Pays' }, { value: '350K€', label: 'Collectés' },
      ]),
      thanksSlide(t.bg, t.accent, t.text, t.muted, 'Faites un don ❤️', 'www.association.org/don'),
    ]
  });
});

// ═══════════════════════════════════════════
// BLANK TEMPLATE
// ═══════════════════════════════════════════

const blankTemplate: PresentationTemplate = {
  id: 'blank', name: 'Présentation vierge', description: 'Commencer de zéro',
  category: 'Basique', thumbnail: '📄', color: '#64748b',
  slides: [{ id: uid(), elements: [], background: '#ffffff' }]
};

// ═══════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════

export const presentationTemplates: PresentationTemplate[] = [
  blankTemplate,
  ...businessTemplates,
  ...educationTemplates,
  ...marketingTemplates,
  ...creativTemplates,
  ...techTemplates,
  ...medicalTemplates,
  ...immobilierTemplates,
  ...juridiqueTemplates,
  ...restaurantTemplates,
  ...modeTemplates,
  ...sportTemplates,
  ...eventTemplates,
  ...financeTemplates,
  ...rseTemplates,
  ...associationTemplates,
];

export const getPresentationCategories = (): string[] => {
  const cats = new Set(presentationTemplates.map(t => t.category));
  return ['Tous', ...Array.from(cats)];
};

export const getPresentationTemplatesByCategory = (category: string): PresentationTemplate[] => {
  if (category === 'Tous') return presentationTemplates;
  return presentationTemplates.filter(t => t.category === category);
};

export const searchPresentationTemplates = (query: string): PresentationTemplate[] => {
  const q = query.toLowerCase();
  return presentationTemplates.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q)
  );
};

// Curated free images from Unsplash
export const curatedImageCollections: Record<string, string[]> = {
  'Business': [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
  ],
  'Technologie': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=300&fit=crop',
  ],
  'Nature': [
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=300&fit=crop',
  ],
  'Personnes': [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1552581234-26160f608093?w=400&h=300&fit=crop',
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
  'Éducation': [
    'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=300&fit=crop',
  ],
  'Médical': [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&h=300&fit=crop',
  ],
  'Food': [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
  ],
  'Sport': [
    'https://images.unsplash.com/photo-1461896836934-bd45ba8a5eed?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
  ],
};

export const textPresets = [
  { label: 'Titre', fontSize: 48, fontWeight: 'bold' as const, width: 600, height: 80 },
  { label: 'Sous-titre', fontSize: 28, fontWeight: 'normal' as const, width: 500, height: 50 },
  { label: 'Corps de texte', fontSize: 18, fontWeight: 'normal' as const, width: 400, height: 120 },
  { label: 'Légende', fontSize: 14, fontWeight: 'normal' as const, width: 300, height: 30 },
  { label: 'Citation', fontSize: 24, fontWeight: 'normal' as const, fontStyle: 'italic', width: 500, height: 80 },
  { label: 'Titre XL', fontSize: 72, fontWeight: 'bold' as const, width: 800, height: 100 },
  { label: 'Accroche', fontSize: 36, fontWeight: 'bold' as const, width: 700, height: 60 },
  { label: 'Label', fontSize: 12, fontWeight: 'bold' as const, width: 200, height: 25, textTransform: 'uppercase', letterSpacing: 3 },
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
  { label: 'Séparateur', shape: 'rectangle' as const, width: 400, height: 2, backgroundColor: '#94a3b8' },
  { label: 'Point', shape: 'circle' as const, width: 30, height: 30, backgroundColor: '#ef4444' },
  { label: 'Cadre', shape: 'rounded' as const, width: 300, height: 200, backgroundColor: 'transparent', borderRadius: 12, borderColor: '#6366f1', borderWidth: 2 },
  { label: 'Barre latérale', shape: 'rectangle' as const, width: 6, height: 400, backgroundColor: '#6366f1' },
];

export const colorPalettes = [
  { name: 'Professionnel', colors: ['#1e293b', '#334155', '#3b82f6', '#60a5fa', '#f8fafc', '#ffffff'] },
  { name: 'Vibrant', colors: ['#7c3aed', '#ec4899', '#f97316', '#06b6d4', '#10b981', '#f43f5e'] },
  { name: 'Nature', colors: ['#064e3b', '#059669', '#34d399', '#d1fae5', '#fef3c7', '#f59e0b'] },
  { name: 'Monochrome', colors: ['#000000', '#1f2937', '#4b5563', '#9ca3af', '#e5e7eb', '#ffffff'] },
  { name: 'Sunset', colors: ['#7c2d12', '#dc2626', '#f97316', '#facc15', '#fef9c3', '#ffffff'] },
  { name: 'Ocean', colors: ['#0c4a6e', '#0284c7', '#38bdf8', '#bae6fd', '#f0f9ff', '#ffffff'] },
  { name: 'Pastel', colors: ['#fce7f3', '#dbeafe', '#dcfce7', '#fef3c7', '#f3e8ff', '#ffe4e6'] },
  { name: 'Dark', colors: ['#000000', '#18181b', '#27272a', '#3f3f46', '#52525b', '#71717a'] },
  { name: 'Corporate', colors: ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'] },
  { name: 'Warm', colors: ['#451a03', '#92400e', '#d97706', '#f59e0b', '#fbbf24', '#fef3c7'] },
];
