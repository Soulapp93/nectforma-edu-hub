// Professional presentation templates with 10+ slides each
// Designs inspired by Canva/Envato with diverse layouts, gradients, and professional compositions

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
// PROFESSIONAL SLIDE BUILDERS
// ═══════════════════════════════════════════

interface Theme {
  bg: string; bg2: string; accent: string; accent2: string;
  text: string; muted: string; card: string; cardText: string;
  light: string; lightText: string; lightMuted: string;
  gradient: string; gradient2: string;
}

// ═══════════════════════════════════════════
// LAYOUT STYLE A — Classic left-aligned with accent bar
// ═══════════════════════════════════════════

const heroSlideA = (t: Theme, title: string, subtitle: string): PresentationSlide => ({
  id: uid(), background: t.bg, elements: [
    { id: uid(), type: 'shape', x: 500, y: -100, width: 600, height: 700, shape: 'circle', gradient: t.gradient, opacity: 0.15 },
    { id: uid(), type: 'shape', x: -80, y: 380, width: 350, height: 350, shape: 'circle', gradient: t.gradient2, opacity: 0.1 },
    { id: uid(), type: 'shape', x: 0, y: 0, width: 8, height: 540, gradient: t.gradient, shape: 'rectangle' },
    { id: uid(), type: 'text', x: 60, y: 120, width: 600, height: 120, content: title, fontSize: 56, fontWeight: 'bold', color: t.text, fontFamily: 'Plus Jakarta Sans', lineHeight: 1.15, letterSpacing: -1 },
    { id: uid(), type: 'shape', x: 60, y: 260, width: 80, height: 4, gradient: t.gradient, shape: 'rectangle', borderRadius: 2 },
    { id: uid(), type: 'text', x: 60, y: 285, width: 500, height: 60, content: subtitle, fontSize: 20, color: t.muted, fontFamily: 'Plus Jakarta Sans', lineHeight: 1.6 },
    { id: uid(), type: 'shape', x: 60, y: 460, width: 140, height: 36, gradient: t.gradient, shape: 'rounded', borderRadius: 18 },
    { id: uid(), type: 'text', x: 60, y: 466, width: 140, height: 24, content: 'PRÉSENTATION', fontSize: 11, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', letterSpacing: 2, fontFamily: 'Plus Jakarta Sans' },
    ...Array.from({ length: 9 }, (_, i) => ({
      id: uid(), type: 'shape' as const,
      x: 780 + (i % 3) * 20, y: 440 + Math.floor(i / 3) * 20,
      width: 6, height: 6, shape: 'circle' as const, backgroundColor: t.accent, opacity: 0.3,
    })),
  ]
});

// ═══════════════════════════════════════════
// LAYOUT STYLE B — Centered bold with full-width gradient band
// ═══════════════════════════════════════════

const heroSlideB = (t: Theme, title: string, subtitle: string): PresentationSlide => ({
  id: uid(), background: t.light, elements: [
    { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 200, gradient: t.gradient, shape: 'rectangle' },
    { id: uid(), type: 'text', x: 80, y: 50, width: 800, height: 100, content: title, fontSize: 52, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Plus Jakarta Sans', textAlign: 'center', lineHeight: 1.15, letterSpacing: -1 },
    { id: uid(), type: 'text', x: 80, y: 155, width: 800, height: 30, content: 'PRÉSENTATION', fontSize: 12, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', letterSpacing: 4, opacity: 0.7 },
    { id: uid(), type: 'shape', x: 380, y: 230, width: 200, height: 4, backgroundColor: t.accent, shape: 'rectangle', borderRadius: 2 },
    { id: uid(), type: 'text', x: 130, y: 270, width: 700, height: 80, content: subtitle, fontSize: 20, color: t.lightMuted, fontFamily: 'Plus Jakarta Sans', textAlign: 'center', lineHeight: 1.7 },
    { id: uid(), type: 'shape', x: 60, y: 420, width: 840, height: 1, backgroundColor: t.accent + '20', shape: 'rectangle' },
    ...Array.from({ length: 3 }, (_, i) => ({
      id: uid(), type: 'shape' as const, x: 330 + i * 150, y: 440, width: 120, height: 60,
      backgroundColor: t.accent + '10', shape: 'rounded' as const, borderRadius: 12,
    })),
  ]
});

// ═══════════════════════════════════════════
// LAYOUT STYLE C — Split diagonal with image area
// ═══════════════════════════════════════════

const heroSlideC = (t: Theme, title: string, subtitle: string): PresentationSlide => ({
  id: uid(), background: t.bg2, elements: [
    { id: uid(), type: 'shape', x: 480, y: 0, width: 480, height: 540, gradient: t.gradient, shape: 'rectangle', opacity: 0.15 },
    { id: uid(), type: 'shape', x: 520, y: 40, width: 400, height: 460, backgroundColor: t.accent + '12', shape: 'rounded', borderRadius: 30 },
    { id: uid(), type: 'text', x: 560, y: 200, width: 320, height: 50, content: '📷  Votre image', fontSize: 18, color: t.accent, textAlign: 'center', opacity: 0.4 },
    { id: uid(), type: 'shape', x: 60, y: 60, width: 50, height: 50, gradient: t.gradient, shape: 'circle' },
    { id: uid(), type: 'text', x: 60, y: 150, width: 400, height: 120, content: title, fontSize: 48, fontWeight: 'bold', color: t.text, fontFamily: 'Plus Jakarta Sans', lineHeight: 1.15 },
    { id: uid(), type: 'shape', x: 60, y: 285, width: 60, height: 4, gradient: t.gradient, shape: 'rectangle', borderRadius: 2 },
    { id: uid(), type: 'text', x: 60, y: 310, width: 380, height: 70, content: subtitle, fontSize: 17, color: t.muted, fontFamily: 'Plus Jakarta Sans', lineHeight: 1.7 },
    { id: uid(), type: 'shape', x: 60, y: 440, width: 160, height: 44, gradient: t.gradient, shape: 'rounded', borderRadius: 22, shadow: '0 6px 20px rgba(0,0,0,0.2)' },
    { id: uid(), type: 'text', x: 60, y: 450, width: 160, height: 24, content: 'Découvrir →', fontSize: 14, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  ]
});

// ═══════════════════════════════════════════
// LAYOUT STYLE D — Minimalist with large typography
// ═══════════════════════════════════════════

const heroSlideD = (t: Theme, title: string, subtitle: string): PresentationSlide => ({
  id: uid(), background: t.bg, elements: [
    { id: uid(), type: 'shape', x: 0, y: 520, width: 960, height: 20, gradient: t.gradient, shape: 'rectangle' },
    { id: uid(), type: 'text', x: 60, y: 80, width: 840, height: 180, content: title, fontSize: 72, fontWeight: 'bold', color: t.text, fontFamily: 'Plus Jakarta Sans', lineHeight: 1.05, letterSpacing: -2 },
    { id: uid(), type: 'text', x: 60, y: 300, width: 500, height: 60, content: subtitle, fontSize: 20, color: t.muted, fontFamily: 'Plus Jakarta Sans', lineHeight: 1.7 },
    { id: uid(), type: 'shape', x: 800, y: 80, width: 120, height: 120, gradient: t.gradient, shape: 'circle', opacity: 0.2 },
    { id: uid(), type: 'shape', x: 830, y: 110, width: 60, height: 60, gradient: t.gradient, shape: 'circle', opacity: 0.3 },
  ]
});

// ═══════════════════════════════════════════
// LAYOUT STYLE E — Card-based with bottom stripe
// ═══════════════════════════════════════════

const heroSlideE = (t: Theme, title: string, subtitle: string): PresentationSlide => ({
  id: uid(), background: t.light, elements: [
    { id: uid(), type: 'shape', x: 60, y: 40, width: 840, height: 380, gradient: t.gradient, shape: 'rounded', borderRadius: 30 },
    { id: uid(), type: 'text', x: 120, y: 100, width: 720, height: 120, content: title, fontSize: 52, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Plus Jakarta Sans', textAlign: 'center', lineHeight: 1.15 },
    { id: uid(), type: 'shape', x: 400, y: 235, width: 160, height: 3, backgroundColor: '#ffffff', shape: 'rectangle', borderRadius: 2, opacity: 0.5 },
    { id: uid(), type: 'text', x: 150, y: 260, width: 660, height: 60, content: subtitle, fontSize: 18, color: '#ffffff', fontFamily: 'Plus Jakarta Sans', textAlign: 'center', lineHeight: 1.6, opacity: 0.85 },
    { id: uid(), type: 'shape', x: 350, y: 340, width: 260, height: 50, backgroundColor: '#ffffff', shape: 'rounded', borderRadius: 25 },
    { id: uid(), type: 'text', x: 350, y: 352, width: 260, height: 26, content: 'En savoir plus', fontSize: 15, fontWeight: 'bold', color: t.accent, textAlign: 'center' },
    { id: uid(), type: 'text', x: 60, y: 460, width: 840, height: 30, content: 'PRÉSENTATION  ·  STRATÉGIE  ·  RÉSULTATS', fontSize: 11, color: t.lightMuted, textAlign: 'center', letterSpacing: 3 },
  ]
});

// ═══════════════════════════════════════════
// ALTERNATIVE FEATURE CARD SLIDES
// ═══════════════════════════════════════════

const featureCardsSlideB = (t: Theme, heading: string, cards: { num: string; title: string; desc: string }[]): PresentationSlide => ({
  id: uid(), background: t.light, elements: [
    { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 6, gradient: t.gradient, shape: 'rectangle' },
    { id: uid(), type: 'text', x: 60, y: 35, width: 600, height: 45, content: heading, fontSize: 30, fontWeight: 'bold', color: t.lightText, fontFamily: 'Plus Jakarta Sans' },
    ...cards.slice(0, 3).flatMap((c, i) => [
      { id: uid(), type: 'shape' as const, x: 60, y: 100 + i * 140, width: 840, height: 120, backgroundColor: '#ffffff', shape: 'rounded' as const, borderRadius: 16, shadow: '0 2px 12px rgba(0,0,0,0.05)' },
      { id: uid(), type: 'shape' as const, x: 60, y: 100 + i * 140, width: 6, height: 120, gradient: t.gradient, shape: 'rectangle' as const },
      { id: uid(), type: 'text' as const, x: 90, y: 110 + i * 140, width: 50, height: 40, content: c.num, fontSize: 28, fontWeight: 'bold', color: t.accent, fontFamily: 'Plus Jakarta Sans' },
      { id: uid(), type: 'text' as const, x: 150, y: 115 + i * 140, width: 250, height: 30, content: c.title, fontSize: 20, fontWeight: 'bold', color: t.lightText, fontFamily: 'Plus Jakarta Sans' },
      { id: uid(), type: 'text' as const, x: 150, y: 150 + i * 140, width: 720, height: 50, content: c.desc, fontSize: 14, color: t.lightMuted, lineHeight: 1.6 },
    ]),
  ]
});

const featureCardsSlideC = (t: Theme, heading: string, cards: { num: string; title: string; desc: string }[]): PresentationSlide => ({
  id: uid(), background: t.bg, elements: [
    { id: uid(), type: 'text', x: 280, y: 25, width: 400, height: 45, content: heading, fontSize: 30, fontWeight: 'bold', color: t.text, textAlign: 'center', fontFamily: 'Plus Jakarta Sans' },
    { id: uid(), type: 'shape', x: 430, y: 78, width: 100, height: 3, gradient: t.gradient, shape: 'rectangle', borderRadius: 2 },
    ...cards.slice(0, 3).flatMap((c, i) => [
      { id: uid(), type: 'shape' as const, x: 60 + i * 290, y: 110, width: 270, height: 380, backgroundColor: t.card, shape: 'rounded' as const, borderRadius: 24 },
      { id: uid(), type: 'shape' as const, x: 60 + i * 290, y: 110, width: 270, height: 6, gradient: t.gradient, shape: 'rectangle' as const, borderRadius: 3 },
      { id: uid(), type: 'text' as const, x: 90 + i * 290, y: 145, width: 210, height: 60, content: c.num, fontSize: 56, fontWeight: 'bold', color: t.accent, opacity: 0.2 },
      { id: uid(), type: 'text' as const, x: 90 + i * 290, y: 210, width: 210, height: 40, content: c.title, fontSize: 22, fontWeight: 'bold', color: t.cardText, fontFamily: 'Plus Jakarta Sans' },
      { id: uid(), type: 'text' as const, x: 90 + i * 290, y: 270, width: 210, height: 180, content: c.desc, fontSize: 14, color: t.muted, lineHeight: 1.8 },
    ]),
  ]
});

// ═══════════════════════════════════════════
// ALTERNATIVE METRICS SLIDES
// ═══════════════════════════════════════════

const metricsSlideB = (t: Theme, heading: string, stats: { value: string; label: string; sub?: string }[]): PresentationSlide => ({
  id: uid(), background: t.light, elements: [
    { id: uid(), type: 'text', x: 280, y: 30, width: 400, height: 40, content: heading, fontSize: 28, fontWeight: 'bold', color: t.lightText, textAlign: 'center', fontFamily: 'Plus Jakarta Sans' },
    ...stats.slice(0, 4).flatMap((s, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      return [
        { id: uid(), type: 'shape' as const, x: 80 + col * 420, y: 100 + row * 210, width: 380, height: 190, backgroundColor: '#ffffff', shape: 'rounded' as const, borderRadius: 20, shadow: '0 4px 20px rgba(0,0,0,0.06)' },
        { id: uid(), type: 'shape' as const, x: 80 + col * 420, y: 100 + row * 210, width: 380, height: 4, gradient: t.gradient, shape: 'rectangle' as const },
        { id: uid(), type: 'text' as const, x: 100 + col * 420, y: 125 + row * 210, width: 340, height: 65, content: s.value, fontSize: 52, fontWeight: 'bold', color: t.accent, fontFamily: 'Plus Jakarta Sans' },
        { id: uid(), type: 'text' as const, x: 100 + col * 420, y: 200 + row * 210, width: 340, height: 30, content: s.label, fontSize: 16, fontWeight: 'bold', color: t.lightText },
        { id: uid(), type: 'text' as const, x: 100 + col * 420, y: 235 + row * 210, width: 340, height: 25, content: s.sub || '', fontSize: 13, color: t.lightMuted },
      ];
    }),
  ]
});

const metricsSlideC = (t: Theme, heading: string, stats: { value: string; label: string; sub?: string }[]): PresentationSlide => ({
  id: uid(), background: t.bg2, elements: [
    { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 540, gradient: t.gradient, opacity: 0.04, shape: 'rectangle' },
    { id: uid(), type: 'text', x: 60, y: 40, width: 840, height: 40, content: heading, fontSize: 32, fontWeight: 'bold', color: t.text, textAlign: 'center', fontFamily: 'Plus Jakarta Sans' },
    { id: uid(), type: 'shape', x: 60, y: 100, width: 840, height: 2, backgroundColor: t.accent + '20', shape: 'rectangle' },
    ...stats.slice(0, 4).flatMap((s, i) => [
      { id: uid(), type: 'shape' as const, x: 60 + i * 220, y: 130, width: 1, height: 300, backgroundColor: i > 0 ? t.accent + '15' : 'transparent', shape: 'rectangle' as const },
      { id: uid(), type: 'text' as const, x: 70 + i * 220, y: 180, width: 200, height: 80, content: s.value, fontSize: 48, fontWeight: 'bold', color: t.accent, textAlign: 'center', fontFamily: 'Plus Jakarta Sans' },
      { id: uid(), type: 'text' as const, x: 70 + i * 220, y: 275, width: 200, height: 30, content: s.label, fontSize: 16, fontWeight: 'bold', color: t.text, textAlign: 'center' },
      { id: uid(), type: 'text' as const, x: 70 + i * 220, y: 310, width: 200, height: 25, content: s.sub || '', fontSize: 12, color: t.muted, textAlign: 'center' },
    ]),
  ]
});

// ═══════════════════════════════════════════
// ALTERNATIVE PROCESS/TIMELINE SLIDES
// ═══════════════════════════════════════════

const processSlideB = (t: Theme, heading: string, steps: { title: string; desc: string }[]): PresentationSlide => ({
  id: uid(), background: t.light, elements: [
    { id: uid(), type: 'text', x: 60, y: 30, width: 600, height: 40, content: heading, fontSize: 28, fontWeight: 'bold', color: t.lightText, fontFamily: 'Plus Jakarta Sans' },
    ...steps.slice(0, 4).flatMap((s, i) => [
      { id: uid(), type: 'shape' as const, x: 60, y: 95 + i * 108, width: 840, height: 95, backgroundColor: '#ffffff', shape: 'rounded' as const, borderRadius: 16, shadow: '0 2px 8px rgba(0,0,0,0.04)' },
      { id: uid(), type: 'shape' as const, x: 80, y: 110 + i * 108, width: 65, height: 65, gradient: t.gradient, shape: 'circle' as const },
      { id: uid(), type: 'text' as const, x: 80, y: 122 + i * 108, width: 65, height: 40, content: `${i + 1}`, fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
      { id: uid(), type: 'text' as const, x: 170, y: 110 + i * 108, width: 300, height: 30, content: s.title, fontSize: 18, fontWeight: 'bold', color: t.lightText, fontFamily: 'Plus Jakarta Sans' },
      { id: uid(), type: 'text' as const, x: 170, y: 143 + i * 108, width: 700, height: 35, content: s.desc, fontSize: 14, color: t.lightMuted, lineHeight: 1.5 },
    ]),
  ]
});

// ═══════════════════════════════════════════
// ALTERNATIVE CTA SLIDES
// ═══════════════════════════════════════════

const ctaSlideB = (t: Theme, headline: string, sub: string, email: string, website: string): PresentationSlide => ({
  id: uid(), background: t.bg, elements: [
    { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 540, gradient: t.gradient, opacity: 0.08, shape: 'rectangle' },
    { id: uid(), type: 'shape', x: 160, y: 80, width: 640, height: 380, backgroundColor: t.card, shape: 'rounded', borderRadius: 30, shadow: '0 20px 60px rgba(0,0,0,0.3)' },
    { id: uid(), type: 'text', x: 200, y: 130, width: 560, height: 70, content: headline, fontSize: 40, fontWeight: 'bold', color: t.text, textAlign: 'center', fontFamily: 'Plus Jakarta Sans' },
    { id: uid(), type: 'shape', x: 420, y: 215, width: 120, height: 3, gradient: t.gradient, shape: 'rectangle', borderRadius: 2 },
    { id: uid(), type: 'text', x: 230, y: 240, width: 500, height: 40, content: sub, fontSize: 16, color: t.muted, textAlign: 'center' },
    { id: uid(), type: 'shape', x: 330, y: 310, width: 300, height: 52, gradient: t.gradient, shape: 'rounded', borderRadius: 26 },
    { id: uid(), type: 'text', x: 330, y: 322, width: 300, height: 28, content: 'Nous contacter', fontSize: 16, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
    { id: uid(), type: 'text', x: 200, y: 400, width: 560, height: 25, content: `${email}  ·  ${website}`, fontSize: 13, color: t.muted, textAlign: 'center' },
  ]
});

// --- SLIDE 2: Agenda / Table des matières ---
const agendaSlide = (t: Theme, items: string[]): PresentationSlide => ({
  id: uid(), background: t.light, elements: [
    // Side accent bar
    { id: uid(), type: 'shape', x: 0, y: 0, width: 320, height: 540, gradient: t.gradient, shape: 'rectangle' },
    { id: uid(), type: 'text', x: 40, y: 60, width: 240, height: 40, content: 'SOMMAIRE', fontSize: 14, fontWeight: 'bold', color: '#ffffff', letterSpacing: 4, fontFamily: 'Plus Jakarta Sans' },
    { id: uid(), type: 'text', x: 40, y: 110, width: 240, height: 50, content: 'Plan de la\nprésentation', fontSize: 28, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Plus Jakarta Sans', lineHeight: 1.2 },
    // Agenda items
    ...items.slice(0, 6).flatMap((item, i) => [
      { id: uid(), type: 'shape' as const, x: 360, y: 60 + i * 75, width: 560, height: 60, backgroundColor: i % 2 === 0 ? t.card : 'transparent', shape: 'rounded' as const, borderRadius: 12 },
      { id: uid(), type: 'text' as const, x: 380, y: 65 + i * 75, width: 40, height: 50, content: `0${i + 1}`, fontSize: 24, fontWeight: 'bold', color: t.accent, fontFamily: 'Plus Jakarta Sans' },
      { id: uid(), type: 'text' as const, x: 430, y: 72 + i * 75, width: 470, height: 36, content: item, fontSize: 17, color: t.lightText, fontFamily: 'Plus Jakarta Sans' },
    ]),
  ]
});

// --- SLIDE 3: About / Présentation ---
const aboutSlide = (t: Theme, title: string, paragraphs: string[]): PresentationSlide => ({
  id: uid(), background: t.light, elements: [
    // Top accent
    { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 6, gradient: t.gradient, shape: 'rectangle' },
    // Section label
    { id: uid(), type: 'shape', x: 60, y: 40, width: 100, height: 28, gradient: t.gradient, shape: 'rounded', borderRadius: 14 },
    { id: uid(), type: 'text', x: 60, y: 44, width: 100, height: 20, content: 'À PROPOS', fontSize: 10, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 2 },
    // Title
    { id: uid(), type: 'text', x: 60, y: 85, width: 500, height: 50, content: title, fontSize: 36, fontWeight: 'bold', color: t.lightText, fontFamily: 'Plus Jakarta Sans' },
    // Image placeholder
    { id: uid(), type: 'shape', x: 600, y: 85, width: 320, height: 400, backgroundColor: t.accent + '15', shape: 'rounded', borderRadius: 20 },
    { id: uid(), type: 'shape', x: 620, y: 105, width: 280, height: 360, backgroundColor: t.accent + '10', shape: 'rounded', borderRadius: 16 },
    { id: uid(), type: 'text', x: 640, y: 250, width: 240, height: 40, content: '📷  Image', fontSize: 16, color: t.accent, textAlign: 'center', opacity: 0.5 },
    // Text content
    ...paragraphs.slice(0, 3).map((p, i) => ({
      id: uid(), type: 'text' as const, x: 60, y: 155 + i * 90, width: 500, height: 75, content: p,
      fontSize: 15, color: t.lightMuted, fontFamily: 'Plus Jakarta Sans', lineHeight: 1.7,
    })),
  ]
});

// --- SLIDE 4: 3 Feature Cards ---
const featureCardsSlide = (t: Theme, heading: string, cards: { num: string; title: string; desc: string }[]): PresentationSlide => ({
  id: uid(), background: t.bg, elements: [
    // BG decor
    { id: uid(), type: 'shape', x: 700, y: -150, width: 400, height: 400, shape: 'circle', gradient: t.gradient, opacity: 0.08 },
    // Label
    { id: uid(), type: 'shape', x: 60, y: 35, width: 120, height: 28, backgroundColor: t.accent + '25', shape: 'rounded', borderRadius: 14 },
    { id: uid(), type: 'text', x: 60, y: 39, width: 120, height: 20, content: 'SERVICES', fontSize: 10, fontWeight: 'bold', color: t.accent, textAlign: 'center', letterSpacing: 2 },
    // Heading
    { id: uid(), type: 'text', x: 60, y: 80, width: 600, height: 50, content: heading, fontSize: 34, fontWeight: 'bold', color: t.text, fontFamily: 'Plus Jakarta Sans' },
    // Cards
    ...cards.slice(0, 3).flatMap((c, i) => [
      { id: uid(), type: 'shape' as const, x: 60 + i * 290, y: 160, width: 270, height: 320, backgroundColor: t.card, shape: 'rounded' as const, borderRadius: 20, shadow: '0 8px 30px rgba(0,0,0,0.12)' },
      // Number circle
      { id: uid(), type: 'shape' as const, x: 85 + i * 290, y: 185, width: 50, height: 50, gradient: t.gradient, shape: 'circle' as const },
      { id: uid(), type: 'text' as const, x: 85 + i * 290, y: 195, width: 50, height: 30, content: c.num, fontSize: 20, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
      // Card title
      { id: uid(), type: 'text' as const, x: 85 + i * 290, y: 255, width: 220, height: 40, content: c.title, fontSize: 20, fontWeight: 'bold', color: t.cardText, fontFamily: 'Plus Jakarta Sans' },
      // Card desc
      { id: uid(), type: 'text' as const, x: 85 + i * 290, y: 300, width: 220, height: 140, content: c.desc, fontSize: 14, color: t.muted, lineHeight: 1.7, fontFamily: 'Plus Jakarta Sans' },
    ]),
  ]
});

// --- SLIDE 5: Statistics / Metrics ---
const metricsSlide = (t: Theme, heading: string, stats: { value: string; label: string; sub?: string }[]): PresentationSlide => ({
  id: uid(), background: t.bg2, elements: [
    // Decorative shapes
    { id: uid(), type: 'shape', x: -60, y: -60, width: 300, height: 300, shape: 'circle', gradient: t.gradient, opacity: 0.06 },
    { id: uid(), type: 'shape', x: 750, y: 350, width: 250, height: 250, shape: 'circle', gradient: t.gradient2, opacity: 0.06 },
    // Heading
    { id: uid(), type: 'text', x: 60, y: 40, width: 500, height: 40, content: heading, fontSize: 32, fontWeight: 'bold', color: t.text, fontFamily: 'Plus Jakarta Sans' },
    { id: uid(), type: 'shape', x: 60, y: 90, width: 60, height: 4, gradient: t.gradient, shape: 'rectangle', borderRadius: 2 },
    // Stat boxes
    ...stats.slice(0, 4).flatMap((s, i) => [
      { id: uid(), type: 'shape' as const, x: 60 + i * 220, y: 130, width: 200, height: 180, backgroundColor: t.card, shape: 'rounded' as const, borderRadius: 20, shadow: '0 4px 20px rgba(0,0,0,0.08)' },
      // Accent top border on card
      { id: uid(), type: 'shape' as const, x: 80 + i * 220, y: 140, width: 160, height: 3, gradient: t.gradient, shape: 'rectangle' as const, borderRadius: 2 },
      { id: uid(), type: 'text' as const, x: 75 + i * 220, y: 165, width: 190, height: 60, content: s.value, fontSize: 42, fontWeight: 'bold', color: t.accent, textAlign: 'center', fontFamily: 'Plus Jakarta Sans' },
      { id: uid(), type: 'text' as const, x: 75 + i * 220, y: 230, width: 190, height: 30, content: s.label, fontSize: 14, fontWeight: 'bold', color: t.cardText, textAlign: 'center' },
      { id: uid(), type: 'text' as const, x: 75 + i * 220, y: 260, width: 190, height: 30, content: s.sub || '', fontSize: 12, color: t.muted, textAlign: 'center' },
    ]),
    // Bottom descriptive text
    { id: uid(), type: 'text', x: 60, y: 350, width: 840, height: 60, content: 'Ces métriques reflètent notre engagement constant envers l\'excellence et l\'innovation dans chaque projet que nous entreprenons.', fontSize: 15, color: t.muted, lineHeight: 1.7, fontFamily: 'Plus Jakarta Sans' },
  ]
});

// --- SLIDE 6: Two-column content ---
const splitContentSlide = (t: Theme, heading: string, leftTitle: string, leftItems: string[], rightTitle: string, rightItems: string[]): PresentationSlide => ({
  id: uid(), background: t.light, elements: [
    { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 6, gradient: t.gradient, shape: 'rectangle' },
    { id: uid(), type: 'text', x: 60, y: 35, width: 600, height: 45, content: heading, fontSize: 30, fontWeight: 'bold', color: t.lightText, fontFamily: 'Plus Jakarta Sans' },
    // Left column
    { id: uid(), type: 'shape', x: 60, y: 100, width: 420, height: 400, backgroundColor: t.accent + '08', shape: 'rounded', borderRadius: 20 },
    { id: uid(), type: 'shape', x: 60, y: 100, width: 420, height: 4, gradient: t.gradient, shape: 'rectangle', borderRadius: 2 },
    { id: uid(), type: 'text', x: 85, y: 120, width: 370, height: 35, content: leftTitle, fontSize: 20, fontWeight: 'bold', color: t.accent, fontFamily: 'Plus Jakarta Sans' },
    ...leftItems.slice(0, 5).map((item, i) => ({
      id: uid(), type: 'text' as const, x: 85, y: 170 + i * 55, width: 370, height: 45,
      content: `→  ${item}`, fontSize: 14, color: t.lightMuted, lineHeight: 1.6, fontFamily: 'Plus Jakarta Sans',
    })),
    // Right column
    { id: uid(), type: 'shape', x: 500, y: 100, width: 420, height: 400, backgroundColor: t.accent + '08', shape: 'rounded', borderRadius: 20 },
    { id: uid(), type: 'shape', x: 500, y: 100, width: 420, height: 4, gradient: t.gradient, shape: 'rectangle', borderRadius: 2 },
    { id: uid(), type: 'text', x: 525, y: 120, width: 370, height: 35, content: rightTitle, fontSize: 20, fontWeight: 'bold', color: t.accent, fontFamily: 'Plus Jakarta Sans' },
    ...rightItems.slice(0, 5).map((item, i) => ({
      id: uid(), type: 'text' as const, x: 525, y: 170 + i * 55, width: 370, height: 45,
      content: `→  ${item}`, fontSize: 14, color: t.lightMuted, lineHeight: 1.6, fontFamily: 'Plus Jakarta Sans',
    })),
  ]
});

// --- SLIDE 7: Timeline / Process ---
const processSlide = (t: Theme, heading: string, steps: { title: string; desc: string }[]): PresentationSlide => ({
  id: uid(), background: t.bg, elements: [
    { id: uid(), type: 'shape', x: 800, y: -100, width: 300, height: 300, shape: 'circle', gradient: t.gradient, opacity: 0.07 },
    { id: uid(), type: 'text', x: 60, y: 35, width: 500, height: 45, content: heading, fontSize: 30, fontWeight: 'bold', color: t.text, fontFamily: 'Plus Jakarta Sans' },
    // Horizontal line
    { id: uid(), type: 'shape', x: 60, y: 200, width: 840, height: 3, backgroundColor: t.accent + '30', shape: 'rectangle' },
    // Steps
    ...steps.slice(0, 4).flatMap((s, i) => [
      // Circle on line
      { id: uid(), type: 'shape' as const, x: 130 + i * 210, y: 185, width: 30, height: 30, gradient: t.gradient, shape: 'circle' as const },
      { id: uid(), type: 'text' as const, x: 130 + i * 210, y: 191, width: 30, height: 20, content: `${i + 1}`, fontSize: 13, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
      // Title below
      { id: uid(), type: 'text' as const, x: 75 + i * 210, y: 235, width: 140, height: 35, content: s.title, fontSize: 16, fontWeight: 'bold', color: t.text, textAlign: 'center', fontFamily: 'Plus Jakarta Sans' },
      // Desc
      { id: uid(), type: 'text' as const, x: 65 + i * 210, y: 275, width: 160, height: 80, content: s.desc, fontSize: 12, color: t.muted, textAlign: 'center', lineHeight: 1.6 },
    ]),
  ]
});

// --- SLIDE 8: Quote ---
const quoteSlide2 = (t: Theme, quote: string, author: string, role: string): PresentationSlide => ({
  id: uid(), background: t.bg2, elements: [
    // Large decorative quote mark
    { id: uid(), type: 'shape', x: 50, y: 30, width: 120, height: 120, gradient: t.gradient, shape: 'circle', opacity: 0.1 },
    { id: uid(), type: 'text', x: 55, y: 40, width: 120, height: 100, content: '"', fontSize: 140, fontWeight: 'bold', color: t.accent, opacity: 0.25, fontFamily: 'Georgia' },
    // Quote text
    { id: uid(), type: 'text', x: 100, y: 140, width: 760, height: 160, content: quote, fontSize: 28, fontStyle: 'italic', color: t.text, lineHeight: 1.6, fontFamily: 'Plus Jakarta Sans' },
    // Divider
    { id: uid(), type: 'shape', x: 100, y: 330, width: 80, height: 3, gradient: t.gradient, shape: 'rectangle', borderRadius: 2 },
    // Author
    { id: uid(), type: 'text', x: 100, y: 355, width: 400, height: 30, content: author, fontSize: 18, fontWeight: 'bold', color: t.text, fontFamily: 'Plus Jakarta Sans' },
    { id: uid(), type: 'text', x: 100, y: 385, width: 400, height: 25, content: role, fontSize: 14, color: t.muted, fontFamily: 'Plus Jakarta Sans' },
    // Decorative corner dots
    ...Array.from({ length: 6 }, (_, i) => ({
      id: uid(), type: 'shape' as const,
      x: 840 + (i % 3) * 18, y: 440 + Math.floor(i / 3) * 18,
      width: 5, height: 5, shape: 'circle' as const, backgroundColor: t.accent, opacity: 0.2,
    })),
  ]
});

// --- SLIDE 9: Team / Grid ---
const teamSlide = (t: Theme, heading: string, members: { name: string; role: string }[]): PresentationSlide => ({
  id: uid(), background: t.light, elements: [
    { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 6, gradient: t.gradient, shape: 'rectangle' },
    { id: uid(), type: 'shape', x: 60, y: 35, width: 110, height: 28, gradient: t.gradient, shape: 'rounded', borderRadius: 14 },
    { id: uid(), type: 'text', x: 60, y: 39, width: 110, height: 20, content: 'ÉQUIPE', fontSize: 10, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 2 },
    { id: uid(), type: 'text', x: 60, y: 80, width: 500, height: 45, content: heading, fontSize: 30, fontWeight: 'bold', color: t.lightText, fontFamily: 'Plus Jakarta Sans' },
    // Team member cards
    ...members.slice(0, 4).flatMap((m, i) => [
      { id: uid(), type: 'shape' as const, x: 60 + i * 220, y: 150, width: 200, height: 260, backgroundColor: '#ffffff', shape: 'rounded' as const, borderRadius: 20, shadow: '0 4px 20px rgba(0,0,0,0.06)' },
      // Avatar placeholder
      { id: uid(), type: 'shape' as const, x: 110 + i * 220, y: 175, width: 100, height: 100, backgroundColor: t.accent + '15', shape: 'circle' as const },
      { id: uid(), type: 'shape' as const, x: 130 + i * 220, y: 195, width: 60, height: 60, gradient: t.gradient, shape: 'circle' as const, opacity: 0.3 },
      // Name
      { id: uid(), type: 'text' as const, x: 75 + i * 220, y: 295, width: 170, height: 30, content: m.name, fontSize: 16, fontWeight: 'bold', color: t.lightText, textAlign: 'center', fontFamily: 'Plus Jakarta Sans' },
      // Role
      { id: uid(), type: 'text' as const, x: 75 + i * 220, y: 325, width: 170, height: 30, content: m.role, fontSize: 12, color: t.accent, textAlign: 'center' },
      // Social dots
      ...Array.from({ length: 3 }, (_, j) => ({
        id: uid(), type: 'shape' as const,
        x: 135 + i * 220 + j * 25, y: 370,
        width: 20, height: 20, shape: 'circle' as const, backgroundColor: t.accent + '20',
      })),
    ]),
  ]
});

// --- SLIDE 10: Comparison / Before-After ---
const comparisonSlide = (t: Theme, heading: string, leftLabel: string, leftItems: string[], rightLabel: string, rightItems: string[]): PresentationSlide => ({
  id: uid(), background: t.bg, elements: [
    { id: uid(), type: 'text', x: 60, y: 35, width: 500, height: 45, content: heading, fontSize: 30, fontWeight: 'bold', color: t.text, fontFamily: 'Plus Jakarta Sans' },
    // VS circle
    { id: uid(), type: 'shape', x: 445, y: 250, width: 70, height: 70, gradient: t.gradient, shape: 'circle' },
    { id: uid(), type: 'text', x: 445, y: 262, width: 70, height: 30, content: 'VS', fontSize: 18, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
    // Left
    { id: uid(), type: 'shape', x: 60, y: 100, width: 380, height: 400, backgroundColor: t.card, shape: 'rounded', borderRadius: 20 },
    { id: uid(), type: 'text', x: 80, y: 120, width: 340, height: 35, content: leftLabel, fontSize: 22, fontWeight: 'bold', color: '#ef4444', textAlign: 'center', fontFamily: 'Plus Jakarta Sans' },
    { id: uid(), type: 'shape', x: 140, y: 162, width: 220, height: 2, backgroundColor: '#ef4444', shape: 'rectangle', opacity: 0.3 },
    ...leftItems.slice(0, 4).map((item, i) => ({
      id: uid(), type: 'text' as const, x: 90, y: 180 + i * 65, width: 330, height: 50,
      content: `✕  ${item}`, fontSize: 14, color: t.muted, lineHeight: 1.6,
    })),
    // Right
    { id: uid(), type: 'shape', x: 520, y: 100, width: 380, height: 400, backgroundColor: t.card, shape: 'rounded', borderRadius: 20 },
    { id: uid(), type: 'text', x: 540, y: 120, width: 340, height: 35, content: rightLabel, fontSize: 22, fontWeight: 'bold', color: t.accent, textAlign: 'center', fontFamily: 'Plus Jakarta Sans' },
    { id: uid(), type: 'shape', x: 600, y: 162, width: 220, height: 2, gradient: t.gradient, shape: 'rectangle' },
    ...rightItems.slice(0, 4).map((item, i) => ({
      id: uid(), type: 'text' as const, x: 550, y: 180 + i * 65, width: 330, height: 50,
      content: `✓  ${item}`, fontSize: 14, color: t.text, lineHeight: 1.6,
    })),
  ]
});

// --- SLIDE 11: CTA / Contact ---
const ctaSlide = (t: Theme, headline: string, sub: string, email: string, website: string): PresentationSlide => ({
  id: uid(), background: t.bg, elements: [
    // Large gradient bg circle
    { id: uid(), type: 'shape', x: 280, y: -50, width: 400, height: 400, shape: 'circle', gradient: t.gradient, opacity: 0.08 },
    { id: uid(), type: 'shape', x: -100, y: 300, width: 300, height: 300, shape: 'circle', gradient: t.gradient2, opacity: 0.06 },
    { id: uid(), type: 'shape', x: 700, y: 350, width: 350, height: 350, shape: 'circle', gradient: t.gradient, opacity: 0.05 },
    // Headline
    { id: uid(), type: 'text', x: 80, y: 140, width: 800, height: 80, content: headline, fontSize: 48, fontWeight: 'bold', color: t.text, textAlign: 'center', fontFamily: 'Plus Jakarta Sans', letterSpacing: -1 },
    // Divider
    { id: uid(), type: 'shape', x: 430, y: 235, width: 100, height: 4, gradient: t.gradient, shape: 'rectangle', borderRadius: 2 },
    // Sub
    { id: uid(), type: 'text', x: 180, y: 260, width: 600, height: 40, content: sub, fontSize: 18, color: t.muted, textAlign: 'center', fontFamily: 'Plus Jakarta Sans' },
    // CTA button
    { id: uid(), type: 'shape', x: 340, y: 330, width: 280, height: 52, gradient: t.gradient, shape: 'rounded', borderRadius: 26, shadow: '0 8px 25px rgba(0,0,0,0.15)' },
    { id: uid(), type: 'text', x: 340, y: 342, width: 280, height: 28, content: 'Commencer maintenant', fontSize: 16, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', fontFamily: 'Plus Jakarta Sans' },
    // Contact info
    { id: uid(), type: 'text', x: 200, y: 420, width: 560, height: 25, content: `${email}  ·  ${website}`, fontSize: 14, color: t.muted, textAlign: 'center', fontFamily: 'Plus Jakarta Sans' },
    // Social icons row (dots as placeholder)
    ...Array.from({ length: 4 }, (_, i) => ({
      id: uid(), type: 'shape' as const,
      x: 410 + i * 40, y: 470,
      width: 28, height: 28, shape: 'circle' as const, backgroundColor: t.accent + '25',
    })),
  ]
});

// --- SLIDE: Icon grid (4 items) ---
const iconGridSlide = (t: Theme, heading: string, items: { title: string; desc: string }[]): PresentationSlide => ({
  id: uid(), background: t.light, elements: [
    { id: uid(), type: 'shape', x: 0, y: 0, width: 960, height: 6, gradient: t.gradient, shape: 'rectangle' },
    { id: uid(), type: 'text', x: 60, y: 35, width: 500, height: 45, content: heading, fontSize: 30, fontWeight: 'bold', color: t.lightText, fontFamily: 'Plus Jakarta Sans' },
    ...items.slice(0, 4).flatMap((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      return [
        { id: uid(), type: 'shape' as const, x: 60 + col * 450, y: 110 + row * 210, width: 420, height: 190, backgroundColor: '#ffffff', shape: 'rounded' as const, borderRadius: 18, shadow: '0 2px 15px rgba(0,0,0,0.05)' },
        // Icon placeholder
        { id: uid(), type: 'shape' as const, x: 85 + col * 450, y: 135 + row * 210, width: 50, height: 50, gradient: t.gradient, shape: 'rounded' as const, borderRadius: 14 },
        { id: uid(), type: 'text' as const, x: 155 + col * 450, y: 135 + row * 210, width: 300, height: 30, content: item.title, fontSize: 18, fontWeight: 'bold', color: t.lightText, fontFamily: 'Plus Jakarta Sans' },
        { id: uid(), type: 'text' as const, x: 155 + col * 450, y: 170 + row * 210, width: 300, height: 80, content: item.desc, fontSize: 13, color: t.lightMuted, lineHeight: 1.7 },
      ];
    }),
  ]
});

// --- SLIDE: Big number highlight ---
const bigNumberSlide = (t: Theme, number: string, label: string, description: string): PresentationSlide => ({
  id: uid(), background: t.bg, elements: [
    { id: uid(), type: 'shape', x: 200, y: -80, width: 560, height: 560, shape: 'circle', gradient: t.gradient, opacity: 0.06 },
    { id: uid(), type: 'text', x: 80, y: 100, width: 800, height: 130, content: number, fontSize: 120, fontWeight: 'bold', color: t.accent, textAlign: 'center', fontFamily: 'Plus Jakarta Sans', letterSpacing: -3 },
    { id: uid(), type: 'shape', x: 430, y: 240, width: 100, height: 4, gradient: t.gradient, shape: 'rectangle', borderRadius: 2 },
    { id: uid(), type: 'text', x: 180, y: 265, width: 600, height: 40, content: label, fontSize: 28, fontWeight: 'bold', color: t.text, textAlign: 'center', fontFamily: 'Plus Jakarta Sans' },
    { id: uid(), type: 'text', x: 180, y: 320, width: 600, height: 60, content: description, fontSize: 16, color: t.muted, textAlign: 'center', lineHeight: 1.7, fontFamily: 'Plus Jakarta Sans' },
  ]
});

// --- SLIDE: Section divider ---
const sectionDividerSlide = (t: Theme, sectionNum: string, sectionTitle: string): PresentationSlide => ({
  id: uid(), background: t.bg2, elements: [
    // Large accent circle
    { id: uid(), type: 'shape', x: 580, y: -100, width: 500, height: 500, shape: 'circle', gradient: t.gradient, opacity: 0.1 },
    { id: uid(), type: 'shape', x: -80, y: 300, width: 300, height: 300, shape: 'circle', gradient: t.gradient2, opacity: 0.06 },
    // Number
    { id: uid(), type: 'text', x: 60, y: 150, width: 120, height: 80, content: sectionNum, fontSize: 72, fontWeight: 'bold', color: t.accent, fontFamily: 'Plus Jakarta Sans', opacity: 0.4 },
    // Title
    { id: uid(), type: 'text', x: 60, y: 230, width: 600, height: 60, content: sectionTitle, fontSize: 42, fontWeight: 'bold', color: t.text, fontFamily: 'Plus Jakarta Sans' },
    { id: uid(), type: 'shape', x: 60, y: 305, width: 80, height: 4, gradient: t.gradient, shape: 'rectangle', borderRadius: 2 },
  ]
});

// ═══════════════════════════════════════════
// THEME DEFINITIONS - Distinct visual identities
// ═══════════════════════════════════════════

const THEMES: Record<string, Theme> = {
  // Dark elegant tech - deep navy with electric blue
  darkTech: {
    bg: '#0a0e1a', bg2: '#0f1425', accent: '#3b82f6', accent2: '#60a5fa',
    text: '#e8edf5', muted: '#7d8ba5', card: '#151b2e', cardText: '#c8d5e8',
    light: '#f0f4f8', lightText: '#1a2332', lightMuted: '#5a6b80',
    gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', gradient2: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  },
  // Warm corporate - deep brown with gold
  warmCorp: {
    bg: '#1a1410', bg2: '#211a14', accent: '#d4a574', accent2: '#e8c9a0',
    text: '#f5efe8', muted: '#a09080', card: '#2a2118', cardText: '#d4c4b0',
    light: '#faf6f2', lightText: '#2a1f15', lightMuted: '#7a6a55',
    gradient: 'linear-gradient(135deg, #d4a574, #e8967a)', gradient2: 'linear-gradient(135deg, #c68e5e, #d4a574)',
  },
  // Fresh green - nature inspired
  freshGreen: {
    bg: '#0a1a12', bg2: '#0f2018', accent: '#10b981', accent2: '#34d399',
    text: '#e5f5ed', muted: '#6b9a80', card: '#142820', cardText: '#a5d4b8',
    light: '#f0faf5', lightText: '#0f2a1a', lightMuted: '#4a7a5a',
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)', gradient2: 'linear-gradient(135deg, #059669, #10b981)',
  },
  // Vibrant purple - creative energy
  vibrantPurple: {
    bg: '#12081f', bg2: '#1a0e2e', accent: '#a855f7', accent2: '#c084fc',
    text: '#f0e8ff', muted: '#8a6aaf', card: '#1f1035', cardText: '#c8b0e5',
    light: '#f8f5ff', lightText: '#1a0e2e', lightMuted: '#6a5085',
    gradient: 'linear-gradient(135deg, #a855f7, #ec4899)', gradient2: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
  },
  // Sunset orange - warm dynamic
  sunsetOrange: {
    bg: '#1a0e08', bg2: '#221410', accent: '#f97316', accent2: '#fb923c',
    text: '#fef2e8', muted: '#b08060', card: '#2a1810', cardText: '#dab090',
    light: '#fff8f2', lightText: '#2a1508', lightMuted: '#8a6545',
    gradient: 'linear-gradient(135deg, #f97316, #ef4444)', gradient2: 'linear-gradient(135deg, #ea580c, #f97316)',
  },
  // Ocean teal - calm professional
  oceanTeal: {
    bg: '#061820', bg2: '#0a2030', accent: '#14b8a6', accent2: '#2dd4bf',
    text: '#e0f5f0', muted: '#608a82', card: '#0f2a35', cardText: '#98d4c8',
    light: '#f0faf8', lightText: '#082820', lightMuted: '#4a756a',
    gradient: 'linear-gradient(135deg, #14b8a6, #3b82f6)', gradient2: 'linear-gradient(135deg, #0d9488, #14b8a6)',
  },
  // Rose pink - elegant feminine
  rosePink: {
    bg: '#1a080f', bg2: '#220e18', accent: '#ec4899', accent2: '#f472b6',
    text: '#fce8f0', muted: '#a06080', card: '#2a1020', cardText: '#e0a0c0',
    light: '#fef5f8', lightText: '#2a0e18', lightMuted: '#8a4a65',
    gradient: 'linear-gradient(135deg, #ec4899, #a855f7)', gradient2: 'linear-gradient(135deg, #db2777, #ec4899)',
  },
  // Midnight slate - minimal modern
  midnightSlate: {
    bg: '#0f1117', bg2: '#14171f', accent: '#94a3b8', accent2: '#cbd5e1',
    text: '#e2e8f0', muted: '#64748b', card: '#1e2129', cardText: '#94a3b8',
    light: '#f8fafc', lightText: '#0f172a', lightMuted: '#64748b',
    gradient: 'linear-gradient(135deg, #64748b, #94a3b8)', gradient2: 'linear-gradient(135deg, #475569, #64748b)',
  },
  // Electric cyan - futuristic
  electricCyan: {
    bg: '#050e14', bg2: '#08141c', accent: '#06b6d4', accent2: '#22d3ee',
    text: '#e0f7fa', muted: '#508a96', card: '#0c1e28', cardText: '#80d4e4',
    light: '#f0fafe', lightText: '#062028', lightMuted: '#3a7a8a',
    gradient: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', gradient2: 'linear-gradient(135deg, #0891b2, #06b6d4)',
  },
  // Ruby red - bold powerful
  rubyRed: {
    bg: '#1a0808', bg2: '#220e0e', accent: '#ef4444', accent2: '#f87171',
    text: '#fce8e8', muted: '#a06060', card: '#2a1010', cardText: '#e0a0a0',
    light: '#fef5f5', lightText: '#2a0e0e', lightMuted: '#8a4545',
    gradient: 'linear-gradient(135deg, #ef4444, #f97316)', gradient2: 'linear-gradient(135deg, #dc2626, #ef4444)',
  },
  // Lime green - energetic
  limeEnergy: {
    bg: '#0a1408', bg2: '#101c0e', accent: '#84cc16', accent2: '#a3e635',
    text: '#f0f8e5', muted: '#6a9050', card: '#152210', cardText: '#a5cc80',
    light: '#f8fcf2', lightText: '#141e08', lightMuted: '#5a7a38',
    gradient: 'linear-gradient(135deg, #84cc16, #10b981)', gradient2: 'linear-gradient(135deg, #65a30d, #84cc16)',
  },
  // Amber gold - luxury
  amberGold: {
    bg: '#141008', bg2: '#1c160c', accent: '#f59e0b', accent2: '#fbbf24',
    text: '#fef4e0', muted: '#a08840', card: '#221c10', cardText: '#d4b870',
    light: '#fffbf0', lightText: '#1c1408', lightMuted: '#7a6830',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', gradient2: 'linear-gradient(135deg, #d97706, #f59e0b)',
  },
};

// ═══════════════════════════════════════════
// TEMPLATE FACTORY - Generates 10+ slides per template
// ═══════════════════════════════════════════

interface TemplateConfig {
  id: string; name: string; desc: string; cat: string; theme: Theme;
  layoutStyle?: number; // 0-4 for different visual layouts
  heroTitle: string; heroSub: string;
  agendaItems: string[];
  aboutTitle: string; aboutParagraphs: string[];
  featureHeading: string; features: { num: string; title: string; desc: string }[];
  metricsHeading: string; metrics: { value: string; label: string; sub?: string }[];
  splitHeading: string; splitLeft: string; splitLeftItems: string[]; splitRight: string; splitRightItems: string[];
  processHeading: string; processSteps: { title: string; desc: string }[];
  quote: string; quoteAuthor: string; quoteRole: string;
  teamHeading: string; team: { name: string; role: string }[];
  compHeading: string; compLeft: string; compLeftItems: string[]; compRight: string; compRightItems: string[];
  ctaHeadline: string; ctaSub: string; ctaEmail: string; ctaWeb: string;
  // Extra slides
  iconGridHeading?: string; iconGridItems?: { title: string; desc: string }[];
  bigNumber?: string; bigLabel?: string; bigDesc?: string;
  sectionNum?: string; sectionTitle?: string;
}

const heroVariants = [heroSlideA, heroSlideB, heroSlideC, heroSlideD, heroSlideE];
const featureVariants = [featureCardsSlide, featureCardsSlideB, featureCardsSlideC];
const metricsVariants = [metricsSlide, metricsSlideB, metricsSlideC];
const processVariants = [processSlide, processSlideB];
const ctaVariants = [ctaSlide, ctaSlideB];

const buildTemplate = (c: TemplateConfig): PresentationTemplate => {
  const s = c.layoutStyle ?? 0;
  const heroFn = heroVariants[s % heroVariants.length];
  const featureFn = featureVariants[s % featureVariants.length];
  const metricsFn = metricsVariants[s % metricsVariants.length];
  const processFn = processVariants[s % processVariants.length];
  const ctaFn = ctaVariants[s % ctaVariants.length];

  return {
    id: c.id, name: c.name, description: c.desc, category: c.cat,
    thumbnail: c.theme.accent, color: c.theme.accent,
    slides: [
      heroFn(c.theme, c.heroTitle, c.heroSub),
      agendaSlide(c.theme, c.agendaItems),
      aboutSlide(c.theme, c.aboutTitle, c.aboutParagraphs),
      featureFn(c.theme, c.featureHeading, c.features),
      metricsFn(c.theme, c.metricsHeading, c.metrics),
      splitContentSlide(c.theme, c.splitHeading, c.splitLeft, c.splitLeftItems, c.splitRight, c.splitRightItems),
      ...(c.sectionNum ? [sectionDividerSlide(c.theme, c.sectionNum, c.sectionTitle || '')] : []),
      processFn(c.theme, c.processHeading, c.processSteps),
      quoteSlide2(c.theme, c.quote, c.quoteAuthor, c.quoteRole),
      ...(c.iconGridHeading ? [iconGridSlide(c.theme, c.iconGridHeading, c.iconGridItems || [])] : []),
      ...(c.bigNumber ? [bigNumberSlide(c.theme, c.bigNumber, c.bigLabel || '', c.bigDesc || '')] : []),
      teamSlide(c.theme, c.teamHeading, c.team),
      comparisonSlide(c.theme, c.compHeading, c.compLeft, c.compLeftItems, c.compRight, c.compRightItems),
      ctaFn(c.theme, c.ctaHeadline, c.ctaSub, c.ctaEmail, c.ctaWeb),
    ],
  };
};

// ═══════════════════════════════════════════
// ALL TEMPLATES
// ═══════════════════════════════════════════

const allTemplates: PresentationTemplate[] = [];

// ─── BUSINESS (20 templates) ─────────────

const bizConfigs: Omit<TemplateConfig, 'theme'>[] = [
  {
    id: 'biz-0', name: 'Pitch Deck Startup', desc: 'Présentation investisseurs moderne', cat: 'Business',
    heroTitle: 'Pitch Deck\nStartup', heroSub: 'Une solution innovante pour transformer votre industrie et conquérir de nouveaux marchés.',
    agendaItems: ['Vision & Mission', 'Problème identifié', 'Notre solution', 'Modèle économique', 'Traction & Métriques', 'Demande de financement'],
    aboutTitle: 'Notre Vision', aboutParagraphs: ['Nous croyons en un monde où la technologie simplifie la vie quotidienne de chaque individu.', 'Notre plateforme révolutionne la façon dont les entreprises interagissent avec leurs clients.', 'Fondée en 2023, notre startup a déjà conquis plus de 10 000 utilisateurs actifs.'],
    featureHeading: 'Notre Solution', features: [
      { num: '01', title: 'Automatisation', desc: 'Réduisez vos coûts opérationnels de 60% grâce à notre IA propriétaire.' },
      { num: '02', title: 'Analytics', desc: 'Tableau de bord en temps réel avec des insights actionnables.' },
      { num: '03', title: 'Intégration', desc: 'Compatible avec +200 outils du marché en quelques clics.' },
    ],
    metricsHeading: 'Traction', metrics: [
      { value: '10K+', label: 'Utilisateurs', sub: 'actifs mensuels' },
      { value: '350%', label: 'Croissance', sub: 'année sur année' },
      { value: '2.4M€', label: 'ARR', sub: 'revenu récurrent' },
      { value: '4.9/5', label: 'Satisfaction', sub: 'note moyenne' },
    ],
    splitHeading: 'Modèle Économique', splitLeft: 'Revenus', splitLeftItems: ['Abonnements SaaS mensuels', 'Licences enterprise', 'Services professionnels', 'API marketplace'], splitRight: 'Avantages', splitRightItems: ['Revenus récurrents prévisibles', 'Marges élevées (+80%)', 'Faible coût d\'acquisition', 'Fort potentiel d\'upsell'],
    processHeading: 'Roadmap Produit', processSteps: [
      { title: 'Q1 2025', desc: 'MVP & premiers clients early-adopters' },
      { title: 'Q2 2025', desc: 'Lancement public & campagne marketing' },
      { title: 'Q3 2025', desc: 'Expansion internationale' },
      { title: 'Q4 2025', desc: 'Série A & nouvelle verticale' },
    ],
    quote: 'Cette solution a transformé notre façon de travailler. Les gains de productivité sont impressionnants.', quoteAuthor: 'Marie Dupont', quoteRole: 'CEO, TechCorp',
    iconGridHeading: 'Avantages Compétitifs', iconGridItems: [
      { title: 'Technologie propriétaire', desc: 'Notre algorithme breveté offre des performances 10x supérieures.' },
      { title: 'Équipe expérimentée', desc: '15 ans d\'expérience cumulée dans le secteur.' },
      { title: 'Time-to-market', desc: 'Déploiement en 48h vs 3 mois chez la concurrence.' },
      { title: 'Scalabilité prouvée', desc: 'Architecture cloud-native avec auto-scaling.' },
    ],
    bigNumber: '60%', bigLabel: 'Réduction des coûts', bigDesc: 'En moyenne, nos clients réduisent leurs coûts opérationnels de 60% dès la première année.',
    sectionNum: '02', sectionTitle: 'Stratégie & Execution',
    teamHeading: 'L\'Équipe Fondatrice', team: [
      { name: 'Pierre Martin', role: 'CEO & Co-fondateur' },
      { name: 'Sophie Chen', role: 'CTO & Co-fondatrice' },
      { name: 'Lucas Bernard', role: 'COO' },
      { name: 'Emma Petit', role: 'CMO' },
    ],
    compHeading: 'Pourquoi Nous ?', compLeft: 'Solutions traditionnelles', compLeftItems: ['Déploiement en 3-6 mois', 'Coûts élevés d\'intégration', 'Interface complexe', 'Support limité'],
    compRight: 'Notre Solution', compRightItems: ['Déploiement en 48 heures', 'Intégration en 1 clic', 'Interface intuitive', 'Support 24/7 dédié'],
    ctaHeadline: 'Prêts à investir ?', ctaSub: 'Nous recherchons 3M€ pour accélérer notre croissance', ctaEmail: 'invest@startup.com', ctaWeb: 'www.startup.com',
  },
  {
    id: 'biz-1', name: 'Rapport Annuel', desc: 'Bilan et perspectives stratégiques', cat: 'Business',
    heroTitle: 'Rapport\nAnnuel 2025', heroSub: 'Bilan de l\'année écoulée, résultats financiers et perspectives stratégiques pour l\'avenir.',
    agendaItems: ['Message du Président', 'Faits marquants', 'Résultats financiers', 'Innovation & R&D', 'Engagements RSE', 'Perspectives 2026'],
    aboutTitle: 'Message du Président', aboutParagraphs: ['L\'année 2025 a été marquée par une croissance exceptionnelle et des avancées significatives.', 'Notre stratégie d\'innovation continue de porter ses fruits avec le lancement de 3 nouveaux produits.', 'Je tiens à remercier l\'ensemble de nos collaborateurs pour leur engagement remarquable.'],
    featureHeading: 'Faits Marquants', features: [
      { num: '01', title: 'Expansion', desc: 'Ouverture de 5 nouveaux bureaux en Europe et en Asie-Pacifique.' },
      { num: '02', title: 'Innovation', desc: 'Lancement de notre plateforme IA de nouvelle génération.' },
      { num: '03', title: 'Talents', desc: '+200 recrutements dans des postes stratégiques.' },
    ],
    metricsHeading: 'Résultats Financiers', metrics: [
      { value: '45M€', label: 'Chiffre d\'affaires', sub: '+28% vs N-1' },
      { value: '8.2M€', label: 'EBITDA', sub: 'marge de 18%' },
      { value: '12M€', label: 'Investissements', sub: 'R&D et expansion' },
      { value: '1,200', label: 'Collaborateurs', sub: '+20% d\'effectif' },
    ],
    splitHeading: 'Répartition du CA', splitLeft: 'Par segment', splitLeftItems: ['Enterprise (45%)', 'PME (30%)', 'Services (15%)', 'International (10%)'], splitRight: 'Par zone', splitRightItems: ['France (55%)', 'Europe (25%)', 'Amérique du Nord (12%)', 'Asie-Pacifique (8%)'],
    processHeading: 'Jalons de l\'Année', processSteps: [
      { title: 'T1', desc: 'Acquisition stratégique de DataCorp' },
      { title: 'T2', desc: 'Lancement produit V3.0' },
      { title: 'T3', desc: 'Certification ISO 27001' },
      { title: 'T4', desc: 'Record de CA trimestriel' },
    ],
    quote: 'Cette année confirme la pertinence de notre stratégie et la force de notre exécution.', quoteAuthor: 'Jean-Marc Duval', quoteRole: 'Président Directeur Général',
    iconGridHeading: 'Piliers Stratégiques', iconGridItems: [
      { title: 'Innovation continue', desc: '15% du CA investi en R&D pour rester à la pointe.' },
      { title: 'Excellence client', desc: 'NPS de 72, dans le top 10% de notre industrie.' },
      { title: 'Développement durable', desc: '-30% d\'empreinte carbone en 2 ans.' },
      { title: 'Capital humain', desc: 'Certification Great Place to Work obtenue.' },
    ],
    bigNumber: '+28%', bigLabel: 'Croissance du chiffre d\'affaires', bigDesc: 'Une année record qui confirme l\'accélération de notre dynamique commerciale.',
    sectionNum: '03', sectionTitle: 'Perspectives & Ambitions',
    teamHeading: 'Comité de Direction', team: [
      { name: 'Jean-Marc Duval', role: 'PDG' },
      { name: 'Claire Moreau', role: 'Directrice Financière' },
      { name: 'Antoine Roux', role: 'Directeur Commercial' },
      { name: 'Nadia Benmoussa', role: 'Directrice RH' },
    ],
    compHeading: 'Évolution 2024 vs 2025', compLeft: 'Année 2024', compLeftItems: ['CA: 35M€', 'Effectif: 1 000', '3 bureaux', 'Marché national'],
    compRight: 'Année 2025', compRightItems: ['CA: 45M€ (+28%)', 'Effectif: 1 200', '8 bureaux', 'Présence internationale'],
    ctaHeadline: 'Ensemble, visons plus haut', ctaSub: 'Découvrez notre plan stratégique 2026-2028', ctaEmail: 'direction@entreprise.com', ctaWeb: 'www.entreprise.com/rapport',
  },
  {
    id: 'biz-2', name: 'Proposition Commerciale', desc: 'Offre client structurée et persuasive', cat: 'Business',
    heroTitle: 'Proposition\nCommerciale', heroSub: 'Une offre sur-mesure pour répondre à vos défis et accélérer votre transformation digitale.',
    agendaItems: ['Compréhension de vos besoins', 'Notre approche', 'Solution proposée', 'Méthodologie', 'Planning & Budget', 'Prochaines étapes'],
    aboutTitle: 'Votre Contexte', aboutParagraphs: ['Après analyse approfondie de vos enjeux, nous avons identifié les leviers clés de votre transformation.', 'Notre proposition s\'articule autour de 3 axes : efficacité opérationnelle, expérience client et innovation.', 'Nous vous accompagnons de la conception à la mise en œuvre avec une équipe dédiée.'],
    featureHeading: 'Notre Offre', features: [
      { num: '01', title: 'Audit & Conseil', desc: 'Diagnostic complet de votre écosystème et recommandations stratégiques.' },
      { num: '02', title: 'Développement', desc: 'Conception et développement de votre solution sur-mesure.' },
      { num: '03', title: 'Accompagnement', desc: 'Formation, support et évolution continue de la plateforme.' },
    ],
    metricsHeading: 'ROI Estimé', metrics: [
      { value: '-40%', label: 'Coûts opérationnels', sub: 'dès la 1ère année' },
      { value: '+65%', label: 'Productivité', sub: 'gain mesuré' },
      { value: '6 mois', label: 'Payback', sub: 'retour sur invest.' },
      { value: '99.9%', label: 'Disponibilité', sub: 'SLA garanti' },
    ],
    splitHeading: 'Détail de l\'Offre', splitLeft: 'Inclus', splitLeftItems: ['Audit initial complet', 'Développement sur-mesure', 'Tests & recette', 'Formation équipes', 'Support 12 mois'], splitRight: 'Options', splitRightItems: ['Hébergement managé', 'Support premium 24/7', 'Évolutions prioritaires', 'Consulting stratégique', 'Data analytics'],
    processHeading: 'Méthodologie', processSteps: [
      { title: 'Discovery', desc: 'Ateliers de cadrage et spécifications détaillées' },
      { title: 'Design', desc: 'Maquettes, prototypes et validation UX' },
      { title: 'Build', desc: 'Développement agile par sprints de 2 semaines' },
      { title: 'Launch', desc: 'Déploiement, formation et go-live' },
    ],
    quote: 'Leur approche méthodique et leur expertise technique ont fait toute la différence pour notre projet.', quoteAuthor: 'Thomas Lefebvre', quoteRole: 'DSI, Groupe Industria',
    bigNumber: '6', bigLabel: 'mois pour un ROI positif', bigDesc: 'Notre solution s\'autofinance rapidement grâce aux gains d\'efficacité mesurables.',
    sectionNum: '04', sectionTitle: 'Budget & Planning',
    teamHeading: 'Votre Équipe Projet', team: [
      { name: 'Julien Morel', role: 'Chef de projet' },
      { name: 'Lisa Wang', role: 'Lead développeur' },
      { name: 'Marc Durand', role: 'UX Designer' },
      { name: 'Aïcha Diallo', role: 'Consultante métier' },
    ],
    compHeading: 'Notre Différence', compLeft: 'Approche classique', compLeftItems: ['Cahier des charges figé', 'Livraison en fin de projet', 'Coûts imprévus fréquents', 'Résultats incertains'],
    compRight: 'Notre Approche Agile', compRightItems: ['Itérations continues', 'Démos toutes les 2 semaines', 'Budget transparent et fixe', 'ROI mesurable et garanti'],
    ctaHeadline: 'Passons à l\'action', ctaSub: 'Planifions un rendez-vous pour finaliser votre projet', ctaEmail: 'commercial@agence.com', ctaWeb: 'www.agence.com',
  },
];

const bizThemeKeys = ['darkTech', 'warmCorp', 'oceanTeal', 'midnightSlate', 'amberGold'];
bizConfigs.forEach((cfg, i) => {
  allTemplates.push(buildTemplate({ ...cfg, theme: THEMES[bizThemeKeys[i % bizThemeKeys.length]], layoutStyle: i % 5 }));
});

// Generate more business templates programmatically
const moreBizNames: [string, string][] = [
  ['Plan Stratégique', 'Vision et objectifs long terme'],
  ['Bilan Financier', 'Résultats et prévisions financières'],
  ['Comité de Direction', 'Rapport pour le CODIR'],
  ['Business Plan', 'Plan d\'affaires complet'],
  ['Analyse Concurrentielle', 'Étude de marché détaillée'],
  ['Roadmap Produit', 'Feuille de route et jalons'],
  ['Présentation Investisseurs', 'Series A/B pitch deck'],
  ['Revue Trimestrielle', 'Performance Q1-Q4'],
  ['Onboarding Client', 'Accueil nouveau client'],
  ['Analyse SWOT', 'Forces, faiblesses, opportunités'],
  ['KPI Dashboard', 'Tableau de bord indicateurs'],
  ['Restructuration', 'Plan de transformation'],
  ['Fusion & Acquisition', 'Due diligence et intégration'],
  ['Expansion Internationale', 'Stratégie d\'internationalisation'],
  ['Innovation Lab', 'Projets R&D et innovation'],
  ['Partenariat Stratégique', 'Collaboration inter-entreprises'],
  ['Gestion de Projet', 'Méthodologie et suivi'],
];

moreBizNames.forEach(([name, desc], i) => {
  const themeKey = bizThemeKeys[(i + 3) % bizThemeKeys.length];
  const t = THEMES[themeKey];
  allTemplates.push(buildTemplate({
    id: `biz-${i + 3}`, name, desc, cat: 'Business', theme: t, layoutStyle: (i + 3) % 5,
    heroTitle: name.replace(/ /g, '\n'), heroSub: desc + '. Une approche structurée et des résultats concrets.',
    agendaItems: ['Introduction & Contexte', 'Analyse de la situation', 'Stratégie proposée', 'Plan d\'action', 'Ressources nécessaires', 'Conclusion & Prochaines étapes'],
    aboutTitle: 'Contexte & Enjeux', aboutParagraphs: ['Dans un environnement en constante évolution, il est essentiel d\'adapter notre approche.', 'Cette présentation détaille notre analyse et nos recommandations stratégiques.', 'Notre objectif : créer de la valeur durable pour l\'ensemble des parties prenantes.'],
    featureHeading: 'Axes Stratégiques', features: [
      { num: '01', title: 'Analyse', desc: 'Diagnostic approfondi de la situation actuelle et identification des opportunités.' },
      { num: '02', title: 'Stratégie', desc: 'Définition d\'une feuille de route claire et ambitieuse.' },
      { num: '03', title: 'Exécution', desc: 'Mise en œuvre rigoureuse avec des indicateurs de suivi.' },
    ],
    metricsHeading: 'Indicateurs Clés', metrics: [
      { value: '+25%', label: 'Objectif', sub: 'croissance visée' },
      { value: '18M€', label: 'Budget', sub: 'investissement' },
      { value: '95%', label: 'Taux', sub: 'de réussite' },
      { value: '12', label: 'Mois', sub: 'délai projet' },
    ],
    splitHeading: 'Analyse Détaillée', splitLeft: 'Forces', splitLeftItems: ['Position de leader', 'Équipe expérimentée', 'Technologie avancée', 'Base clients solide'], splitRight: 'Opportunités', splitRightItems: ['Nouveaux marchés', 'Partenariats potentiels', 'Innovation produit', 'Digitalisation'],
    processHeading: 'Plan d\'Action', processSteps: [
      { title: 'Phase 1', desc: 'Audit et diagnostic complet' },
      { title: 'Phase 2', desc: 'Élaboration de la stratégie' },
      { title: 'Phase 3', desc: 'Déploiement progressif' },
      { title: 'Phase 4', desc: 'Évaluation et optimisation' },
    ],
    quote: 'La clé du succès réside dans l\'exécution rigoureuse d\'une stratégie bien pensée.', quoteAuthor: 'Direction Générale', quoteRole: 'Comité stratégique',
    sectionNum: '02', sectionTitle: 'Résultats & Perspectives',
    teamHeading: 'Équipe Projet', team: [
      { name: 'Alexandre Martin', role: 'Directeur de projet' },
      { name: 'Camille Dubois', role: 'Analyste senior' },
      { name: 'Youssef Alami', role: 'Expert métier' },
      { name: 'Laura Schmidt', role: 'Coordinatrice' },
    ],
    compHeading: 'Avant / Après', compLeft: 'Situation actuelle', compLeftItems: ['Processus manuels', 'Données fragmentées', 'Réactivité limitée', 'Coûts élevés'],
    compRight: 'Situation cible', compRightItems: ['Automatisation complète', 'Données centralisées', 'Agilité maximale', 'Optimisation des coûts'],
    ctaHeadline: 'Passons à l\'action', ctaSub: 'Ensemble, construisons l\'avenir', ctaEmail: 'contact@entreprise.com', ctaWeb: 'www.entreprise.com',
  }));
});

// ─── EDUCATION (15 templates) ────────────

const eduConfigs: [string, string][] = [
  ['Cours Universitaire', 'Support de cours académique'],
  ['Soutenance de Mémoire', 'Présentation académique formelle'],
  ['Formation Continue', 'Module de formation professionnelle'],
  ['Atelier Pédagogique', 'Workshop interactif'],
  ['Conférence Scientifique', 'Communication scientifique'],
  ['Projet Étudiant', 'Présentation de projet'],
  ['Séminaire de Recherche', 'Résultats de recherche'],
  ['Rapport de Stage', 'Bilan de stage professionnel'],
  ['Thèse Doctorale', 'Soutenance de thèse PhD'],
  ['Programme de Cours', 'Syllabus et planning'],
  ['Webinaire Éducatif', 'Formation en ligne interactive'],
  ['Méthodologie', 'Approche et outils de recherche'],
  ['Étude de Cas', 'Analyse de situation réelle'],
  ['Orientation Scolaire', 'Guide d\'orientation'],
  ['Évaluation des Acquis', 'Bilan de compétences'],
];

const eduThemeKeys = ['vibrantPurple', 'darkTech', 'oceanTeal', 'freshGreen', 'electricCyan'];
eduConfigs.forEach(([name, desc], i) => {
  const t = THEMES[eduThemeKeys[i % eduThemeKeys.length]];
  allTemplates.push(buildTemplate({
    id: `edu-${i}`, name, desc, cat: 'Éducation', theme: t, layoutStyle: i % 5,
    heroTitle: name, heroSub: desc + '. Un contenu structuré pour un apprentissage efficace.',
    agendaItems: ['Objectifs pédagogiques', 'Contexte théorique', 'Concepts fondamentaux', 'Études de cas', 'Exercices pratiques', 'Évaluation & Synthèse'],
    aboutTitle: 'Objectifs du Module', aboutParagraphs: ['Ce module vise à développer les compétences clés nécessaires à la maîtrise du sujet.', 'À l\'issue de cette formation, les participants seront capables d\'appliquer les concepts présentés.', 'L\'approche combine théorie, pratique et retour d\'expérience.'],
    featureHeading: 'Contenu Pédagogique', features: [
      { num: '01', title: 'Théorie', desc: 'Maîtrise des concepts fondamentaux et des cadres de référence.' },
      { num: '02', title: 'Pratique', desc: 'Mise en application à travers des exercices et des cas réels.' },
      { num: '03', title: 'Évaluation', desc: 'Vérification des acquis et certification des compétences.' },
    ],
    metricsHeading: 'Programme en Chiffres', metrics: [
      { value: '12h', label: 'Formation', sub: 'heures totales' },
      { value: '8', label: 'Modules', sub: 'thématiques' },
      { value: '95%', label: 'Réussite', sub: 'taux moyen' },
      { value: '4.8/5', label: 'Évaluation', sub: 'satisfaction' },
    ],
    splitHeading: 'Organisation du Module', splitLeft: 'Partie Théorique', splitLeftItems: ['Définitions et concepts', 'Modèles de référence', 'Études scientifiques', 'Analyse critique'], splitRight: 'Partie Pratique', splitRightItems: ['Travaux dirigés', 'Études de cas', 'Projets de groupe', 'Évaluation formative'],
    processHeading: 'Progression Pédagogique', processSteps: [
      { title: 'Découverte', desc: 'Introduction et mise en contexte' },
      { title: 'Acquisition', desc: 'Apprentissage des concepts clés' },
      { title: 'Application', desc: 'Mise en pratique et exercices' },
      { title: 'Maîtrise', desc: 'Évaluation et certification' },
    ],
    quote: 'L\'éducation est l\'arme la plus puissante qu\'on puisse utiliser pour changer le monde.', quoteAuthor: 'Nelson Mandela', quoteRole: 'Leader et visionnaire',
    iconGridHeading: 'Compétences Développées', iconGridItems: [
      { title: 'Analyse critique', desc: 'Capacité à évaluer et synthétiser des informations complexes.' },
      { title: 'Résolution de problèmes', desc: 'Méthodologie structurée pour aborder des cas concrets.' },
      { title: 'Communication', desc: 'Expression claire et argumentation solide.' },
      { title: 'Travail collaboratif', desc: 'Compétences d\'équipe et gestion de projet.' },
    ],
    sectionNum: '03', sectionTitle: 'Études de Cas',
    teamHeading: 'Équipe Pédagogique', team: [
      { name: 'Pr. Marie Laurent', role: 'Responsable de module' },
      { name: 'Dr. Thomas Petit', role: 'Intervenant expert' },
      { name: 'Sophie Martin', role: 'Assistante pédagogique' },
      { name: 'Karim Benali', role: 'Tuteur' },
    ],
    compHeading: 'Méthode Traditionnelle vs Notre Approche', compLeft: 'Méthode classique', compLeftItems: ['Cours magistral passif', 'Évaluation finale unique', 'Supports papier', 'Peu d\'interaction'],
    compRight: 'Notre Approche', compRightItems: ['Pédagogie active et inversée', 'Évaluation continue', 'Supports numériques interactifs', 'Collaboration et feedback'],
    ctaHeadline: 'Questions ?', ctaSub: 'Merci pour votre attention et votre participation', ctaEmail: 'formation@universite.fr', ctaWeb: 'www.universite.fr',
  }));
});

// ─── MARKETING (15 templates) ────────────

const mktConfigs: [string, string][] = [
  ['Lancement Produit', 'Nouveau produit dynamique'],
  ['Stratégie Social Media', 'Plan réseaux sociaux'],
  ['Campagne Publicitaire', 'Brief créatif campagne'],
  ['Brand Book', 'Guide de marque complet'],
  ['Content Marketing', 'Stratégie de contenu'],
  ['Growth Hacking', 'Tactiques de croissance'],
  ['Étude de Marché', 'Analyse du marché cible'],
  ['Funnel de Vente', 'Tunnel de conversion'],
  ['Plan de Communication', 'Stratégie de comm globale'],
  ['Rapport de Performance', 'ROI et analytics'],
  ['SEO Strategy', 'Optimisation référencement'],
  ['Influence Marketing', 'Stratégie influenceurs'],
  ['Email Marketing', 'Campagne emailing'],
  ['Événement Marketing', 'Organisation d\'événement'],
  ['Rebranding', 'Refonte de marque'],
];

const mktThemeKeys = ['sunsetOrange', 'rosePink', 'vibrantPurple', 'rubyRed', 'amberGold'];
mktConfigs.forEach(([name, desc], i) => {
  const t = THEMES[mktThemeKeys[i % mktThemeKeys.length]];
  allTemplates.push(buildTemplate({
    id: `mkt-${i}`, name, desc, cat: 'Marketing', theme: t, layoutStyle: i % 5,
    heroTitle: name, heroSub: desc + '. Des stratégies percutantes pour maximiser votre impact.',
    agendaItems: ['Analyse de marché', 'Persona & Ciblage', 'Stratégie créative', 'Plan média', 'KPIs & Objectifs', 'Budget & Timeline'],
    aboutTitle: 'Notre Approche', aboutParagraphs: ['Une stratégie marketing data-driven pour des résultats mesurables.', 'Nous combinons créativité, analytics et automatisation pour maximiser votre ROI.', 'Chaque campagne est optimisée en continu grâce à nos outils d\'analyse.'],
    featureHeading: 'Nos Leviers', features: [
      { num: '01', title: 'Acquisition', desc: 'Stratégie multi-canal pour attirer des prospects qualifiés.' },
      { num: '02', title: 'Engagement', desc: 'Contenu personnalisé qui crée de la connexion avec votre audience.' },
      { num: '03', title: 'Conversion', desc: 'Optimisation du tunnel pour maximiser le taux de transformation.' },
    ],
    metricsHeading: 'Résultats Attendus', metrics: [
      { value: '+200%', label: 'Reach', sub: 'portée organique' },
      { value: '5.8%', label: 'Engagement', sub: 'taux moyen' },
      { value: '45K', label: 'Leads', sub: 'générés/mois' },
      { value: '320%', label: 'ROI', sub: 'retour estimé' },
    ],
    splitHeading: 'Stratégie Multi-Canal', splitLeft: 'Organique', splitLeftItems: ['SEO & Content', 'Social media', 'Email nurturing', 'Community mgmt'], splitRight: 'Payant', splitRightItems: ['Google Ads', 'Social Ads', 'Display & retargeting', 'Influenceurs'],
    processHeading: 'Phases de la Campagne', processSteps: [
      { title: 'Audit', desc: 'Analyse concurrentielle et benchmarks' },
      { title: 'Stratégie', desc: 'Définition des objectifs et KPIs' },
      { title: 'Exécution', desc: 'Déploiement des campagnes' },
      { title: 'Optimisation', desc: 'A/B testing et ajustements' },
    ],
    quote: 'Le meilleur marketing ne ressemble pas à du marketing.', quoteAuthor: 'Tom Fishburne', quoteRole: 'Fondateur, Marketoonist',
    bigNumber: '320%', bigLabel: 'ROI moyen de nos campagnes', bigDesc: 'Chaque euro investi génère en moyenne 3,20€ de revenus pour nos clients.',
    sectionNum: '03', sectionTitle: 'Plan d\'Action',
    teamHeading: 'L\'Équipe Créative', team: [
      { name: 'Clara Fontaine', role: 'Directrice artistique' },
      { name: 'Hugo Blanc', role: 'Stratège digital' },
      { name: 'Léa Kim', role: 'Social media manager' },
      { name: 'Romain Fabre', role: 'Growth hacker' },
    ],
    compHeading: 'Notre Différence', compLeft: 'Marketing traditionnel', compLeftItems: ['Campagnes ponctuelles', 'Mesure approximative', 'Message générique', 'Budget rigide'],
    compRight: 'Notre Approche', compRightItems: ['Stratégie continue', 'Analytics en temps réel', 'Hyper-personnalisation', 'Budget flexible et optimisé'],
    ctaHeadline: 'Let\'s Go !', ctaSub: 'Prêt à transformer votre marketing ?', ctaEmail: 'hello@agence.com', ctaWeb: 'www.agence-marketing.com',
  }));
});

// ─── TECHNOLOGIE (15 templates) ──────────

const techConfigs: [string, string][] = [
  ['Product Demo', 'Démonstration de produit tech'],
  ['Architecture Logicielle', 'Design system et architecture'],
  ['Sprint Review', 'Revue de sprint Agile'],
  ['Tech Stack Overview', 'Stack technique détaillée'],
  ['Cybersécurité', 'Audit et recommandations'],
  ['Cloud Migration', 'Plan de migration cloud'],
  ['DevOps Pipeline', 'CI/CD et infrastructure'],
  ['Data Science', 'Analyse et machine learning'],
  ['UX Research', 'Recherche utilisateur'],
  ['IA & Machine Learning', 'Intelligence artificielle'],
  ['Mobile App Design', 'Design d\'application mobile'],
  ['System Design', 'Conception système'],
  ['Tech Startup Pitch', 'Pitch tech innovant'],
  ['API Documentation', 'Documentation d\'API'],
  ['SaaS Metrics', 'MRR, Churn, LTV'],
];

const techThemeKeys2 = ['electricCyan', 'darkTech', 'oceanTeal', 'midnightSlate', 'vibrantPurple'];
techConfigs.forEach(([name, desc], i) => {
  const t = THEMES[techThemeKeys2[i % techThemeKeys2.length]];
  allTemplates.push(buildTemplate({
    id: `tech-${i}`, name, desc, cat: 'Technologie', theme: t, layoutStyle: i % 5,
    heroTitle: name, heroSub: desc + '. Innovation, performance et fiabilité au service de votre business.',
    agendaItems: ['Vue d\'ensemble', 'Architecture technique', 'Fonctionnalités clés', 'Performance & Scalabilité', 'Sécurité', 'Roadmap technique'],
    aboutTitle: 'Vue d\'Ensemble', aboutParagraphs: ['Une solution technologique de pointe conçue pour répondre aux défis les plus complexes.', 'Notre architecture cloud-native garantit performance, sécurité et évolutivité.', 'Construite avec les meilleures pratiques de l\'industrie et des technologies éprouvées.'],
    featureHeading: 'Architecture', features: [
      { num: '01', title: 'Performance', desc: 'Latence < 50ms, architecture distribuée avec auto-scaling horizontal.' },
      { num: '02', title: 'Sécurité', desc: 'Chiffrement E2E, conformité RGPD/SOC2, audits réguliers.' },
      { num: '03', title: 'Scalabilité', desc: 'Microservices containerisés avec orchestration Kubernetes.' },
    ],
    metricsHeading: 'Métriques Techniques', metrics: [
      { value: '99.99%', label: 'Uptime', sub: 'SLA garanti' },
      { value: '<50ms', label: 'Latence', sub: 'P95 response' },
      { value: '10M+', label: 'Requêtes/j', sub: 'en production' },
      { value: '0', label: 'Incidents', sub: 'critiques ce mois' },
    ],
    splitHeading: 'Stack Technique', splitLeft: 'Backend', splitLeftItems: ['Node.js / TypeScript', 'PostgreSQL / Redis', 'Docker / Kubernetes', 'GraphQL API'], splitRight: 'Frontend', splitRightItems: ['React / Next.js', 'TypeScript strict', 'Tailwind CSS', 'Tests E2E (Playwright)'],
    processHeading: 'Roadmap Technique', processSteps: [
      { title: 'Q1 — MVP', desc: 'Architecture de base et core features' },
      { title: 'Q2 — Scale', desc: 'Optimisation et montée en charge' },
      { title: 'Q3 — Features', desc: 'Nouvelles fonctionnalités avancées' },
      { title: 'Q4 — Enterprise', desc: 'SSO, audit logs, SLA premium' },
    ],
    quote: 'La meilleure architecture est celle qui évolue avec les besoins du business sans compromis sur la qualité.', quoteAuthor: 'Martin Fowler', quoteRole: 'Chief Scientist, ThoughtWorks',
    iconGridHeading: 'Principes d\'Architecture', iconGridItems: [
      { title: 'Microservices', desc: 'Services indépendants et déployables individuellement.' },
      { title: 'Event-driven', desc: 'Communication asynchrone via message queues.' },
      { title: 'Infrastructure as Code', desc: 'Environnements reproductibles et versionnés.' },
      { title: 'Observabilité', desc: 'Monitoring, logging et tracing centralisés.' },
    ],
    sectionNum: '03', sectionTitle: 'Sécurité & Conformité',
    teamHeading: 'Équipe Technique', team: [
      { name: 'David Chen', role: 'Lead Architect' },
      { name: 'Sarah Müller', role: 'Backend Lead' },
      { name: 'Kevin Park', role: 'DevOps Engineer' },
      { name: 'Ana Silva', role: 'QA Lead' },
    ],
    compHeading: 'Avantage Technique', compLeft: 'Monolithe legacy', compLeftItems: ['Déploiements risqués', 'Scaling vertical limité', 'Couplage fort', 'Tests difficiles'],
    compRight: 'Notre Architecture', compRightItems: ['Déploiements continus', 'Scaling horizontal infini', 'Services découplés', 'Tests automatisés 100%'],
    ctaHeadline: 'Ready to Ship ?', ctaSub: 'Découvrez notre documentation technique complète', ctaEmail: 'tech@company.dev', ctaWeb: 'docs.company.dev',
  }));
});

// ─── CRÉATIF (10 templates) ──────────────

const creConfigs: [string, string][] = [
  ['Portfolio Design', 'Showcase de travaux créatifs'],
  ['Minimaliste Épuré', 'Design ultra-clean moderne'],
  ['Néon Futuriste', 'Style cyberpunk lumineux'],
  ['Art Déco Luxe', 'Élégance géométrique premium'],
  ['Dark Mode Premium', 'Interface sombre élégante'],
  ['Glassmorphism', 'Effet verre moderne et tendance'],
  ['Gradient Moderne', 'Dégradés vibrants tendance'],
  ['Pop Art Bold', 'Couleurs vives et graphiques'],
  ['Monochrome Chic', 'Noir et blanc sophistiqué'],
  ['Pastel Dream', 'Tons doux et aériens'],
];

const creThemeKeys = ['midnightSlate', 'freshGreen', 'vibrantPurple', 'amberGold', 'darkTech', 'electricCyan', 'rosePink', 'rubyRed', 'warmCorp', 'oceanTeal'];
creConfigs.forEach(([name, desc], i) => {
  const t = THEMES[creThemeKeys[i % creThemeKeys.length]];
  allTemplates.push(buildTemplate({
    id: `cre-${i}`, name, desc, cat: 'Créatif', theme: t, layoutStyle: i % 5,
    heroTitle: name, heroSub: desc + '. Un design qui raconte votre histoire avec impact.',
    agendaItems: ['Vision créative', 'Identité visuelle', 'Projets sélectionnés', 'Processus créatif', 'Résultats & Impact', 'Contact & Collaboration'],
    aboutTitle: 'Vision Créative', aboutParagraphs: ['Chaque projet est une opportunité de repousser les limites du design et de l\'innovation.', 'Notre approche mêle esthétique raffinée, fonctionnalité et storytelling émotionnel.', 'Nous créons des expériences visuelles mémorables qui connectent les marques à leur audience.'],
    featureHeading: 'Notre Savoir-Faire', features: [
      { num: '01', title: 'Direction Artistique', desc: 'Univers visuels uniques et cohérents qui reflètent l\'ADN de chaque marque.' },
      { num: '02', title: 'Design System', desc: 'Systèmes de design évolutifs et maintenables à grande échelle.' },
      { num: '03', title: 'Motion Design', desc: 'Animations et transitions qui donnent vie aux interfaces.' },
    ],
    metricsHeading: 'Portfolio en Chiffres', metrics: [
      { value: '200+', label: 'Projets', sub: 'réalisés' },
      { value: '50+', label: 'Clients', sub: 'satisfaits' },
      { value: '15', label: 'Awards', sub: 'design' },
      { value: '8 ans', label: 'Expérience', sub: 'dans le domaine' },
    ],
    splitHeading: 'Compétences', splitLeft: 'Design', splitLeftItems: ['Branding & Identity', 'UI/UX Design', 'Print & Editorial', 'Packaging'], splitRight: 'Digital', splitRightItems: ['Web Design', 'Motion Graphics', 'Social Media', '3D & Illustration'],
    processHeading: 'Processus Créatif', processSteps: [
      { title: 'Brief', desc: 'Compréhension profonde du projet et des objectifs' },
      { title: 'Concept', desc: 'Exploration créative et moodboards' },
      { title: 'Design', desc: 'Création et itérations avec le client' },
      { title: 'Livraison', desc: 'Assets finaux et guidelines' },
    ],
    quote: 'Le design n\'est pas juste ce à quoi ça ressemble. Le design, c\'est comment ça fonctionne.', quoteAuthor: 'Steve Jobs', quoteRole: 'Co-fondateur, Apple',
    bigNumber: '15', bigLabel: 'Awards de design remportés', bigDesc: 'Reconnu par les plus grandes instances créatives internationales.',
    sectionNum: '04', sectionTitle: 'Projets Sélectionnés',
    teamHeading: 'L\'Équipe Créative', team: [
      { name: 'Alice Moreau', role: 'Directrice créative' },
      { name: 'Maxime Roy', role: 'UI/UX Designer' },
      { name: 'Zoé Laurent', role: 'Motion Designer' },
      { name: 'Nathan Petit', role: 'Illustrateur' },
    ],
    compHeading: 'Notre Différence', compLeft: 'Design générique', compLeftItems: ['Templates prédéfinis', 'Pas de recherche', 'Livraison unique', 'Style impersonnel'],
    compRight: 'Notre Approche', compRightItems: ['Création sur-mesure', 'Recherche approfondie', 'Itérations illimitées', 'Identité unique'],
    ctaHeadline: 'Créons ensemble', ctaSub: 'Votre prochain projet mérite un design exceptionnel', ctaEmail: 'hello@studio.design', ctaWeb: 'www.studio.design',
  }));
});

// ─── MÉDICAL (10 templates) ──────────────

const medConfigs: [string, string][] = [
  ['Cas Clinique', 'Présentation de cas médical'],
  ['Recherche Médicale', 'Résultats d\'étude clinique'],
  ['Congrès Médical', 'Communication scientifique'],
  ['Formation Soignants', 'Module de formation médicale'],
  ['Santé Publique', 'Politique de santé'],
  ['Télémédecine', 'Solutions de santé digitale'],
  ['Pharmacologie', 'Études pharmacologiques'],
  ['Cardiologie', 'Pathologies cardiaques'],
  ['Oncologie', 'Recherche en cancérologie'],
  ['Épidémiologie', 'Études épidémiologiques'],
];

const medThemeKeys2 = ['oceanTeal', 'darkTech', 'freshGreen', 'electricCyan', 'midnightSlate'];
medConfigs.forEach(([name, desc], i) => {
  const t = THEMES[medThemeKeys2[i % medThemeKeys2.length]];
  allTemplates.push(buildTemplate({
    id: `med-${i}`, name, desc, cat: 'Médical', theme: t, layoutStyle: i % 5,
    heroTitle: name, heroSub: desc + '. Rigueur scientifique et présentation claire des résultats.',
    agendaItems: ['Introduction', 'Méthodologie', 'Résultats principaux', 'Discussion', 'Conclusion', 'Références'],
    aboutTitle: 'Introduction', aboutParagraphs: ['Cette étude s\'inscrit dans un contexte de recherche active sur les innovations thérapeutiques.', 'L\'objectif est de présenter les résultats de notre protocole et d\'en discuter les implications cliniques.', 'La méthodologie rigoureuse utilisée garantit la fiabilité et la reproductibilité des résultats.'],
    featureHeading: 'Points Clés de l\'Étude', features: [
      { num: '01', title: 'Population', desc: 'Étude prospective multicentrique portant sur 500 patients.' },
      { num: '02', title: 'Protocole', desc: 'Essai randomisé en double aveugle vs placebo sur 24 mois.' },
      { num: '03', title: 'Endpoints', desc: 'Critères primaires et secondaires clairement définis.' },
    ],
    metricsHeading: 'Résultats Principaux', metrics: [
      { value: 'n=500', label: 'Patients', sub: 'inclus dans l\'étude' },
      { value: 'p<0.001', label: 'Significativité', sub: 'statistique' },
      { value: '87%', label: 'Efficacité', sub: 'critère principal' },
      { value: '-42%', label: 'Réduction', sub: 'des événements' },
    ],
    splitHeading: 'Méthodologie', splitLeft: 'Design', splitLeftItems: ['Essai randomisé', 'Double aveugle', 'Multicentrique', 'ITT et per-protocole'], splitRight: 'Analyse', splitRightItems: ['Test de Kaplan-Meier', 'Régression de Cox', 'Analyse en sous-groupes', 'Sensibilité'],
    processHeading: 'Déroulement de l\'Étude', processSteps: [
      { title: 'Screening', desc: 'Sélection et randomisation des patients' },
      { title: 'Traitement', desc: 'Administration du protocole thérapeutique' },
      { title: 'Suivi', desc: 'Monitoring clinique et biologique' },
      { title: 'Analyse', desc: 'Traitement statistique des données' },
    ],
    quote: 'Les résultats de cette étude ouvrent de nouvelles perspectives thérapeutiques prometteuses.', quoteAuthor: 'Pr. Jean Leclerc', quoteRole: 'Chef de service, CHU de Paris',
    iconGridHeading: 'Implications Cliniques', iconGridItems: [
      { title: 'Nouveau standard', desc: 'Ces résultats pourraient modifier les guidelines de prise en charge.' },
      { title: 'Tolérance', desc: 'Profil de sécurité favorable avec peu d\'effets secondaires.' },
      { title: 'Qualité de vie', desc: 'Amélioration significative des scores de qualité de vie.' },
      { title: 'Coût-efficacité', desc: 'Ratio favorable comparé aux alternatives existantes.' },
    ],
    sectionNum: '04', sectionTitle: 'Discussion & Limites',
    teamHeading: 'Investigateurs Principaux', team: [
      { name: 'Pr. Jean Leclerc', role: 'Investigateur principal' },
      { name: 'Dr. Isabelle Martin', role: 'Co-investigatrice' },
      { name: 'Dr. Ahmed Hassan', role: 'Biostatisticien' },
      { name: 'Dr. Claire Dumont', role: 'Coordinatrice' },
    ],
    compHeading: 'Comparaison des Traitements', compLeft: 'Traitement standard', compLeftItems: ['Efficacité: 65%', 'Effets secondaires fréquents', 'Administration quotidienne', 'Coût élevé'],
    compRight: 'Nouveau traitement', compRightItems: ['Efficacité: 87%', 'Bonne tolérance', 'Administration hebdomadaire', 'Coût comparable'],
    ctaHeadline: 'Merci', ctaSub: 'Questions et discussion', ctaEmail: 'recherche@chu.fr', ctaWeb: 'clinicaltrials.gov',
  }));
});

// ─── AUTRES CATÉGORIES (templates condensés) ─────

const otherCategories: { cat: string; items: [string, string][]; themes: string[] }[] = [
  {
    cat: 'Immobilier', themes: ['warmCorp', 'amberGold', 'freshGreen', 'midnightSlate', 'oceanTeal'],
    items: [
      ['Projet Immobilier', 'Présentation de programme neuf'],
      ['Investissement Locatif', 'Rendement et fiscalité'],
      ['Promotion Immobilière', 'Nouveau programme immobilier'],
      ['Agence Immobilière', 'Présentation d\'agence'],
      ['Architecture & Design', 'Projet architectural'],
      ['Gestion de Patrimoine', 'Conseil patrimonial immobilier'],
      ['Rénovation Énergétique', 'Travaux et aides disponibles'],
    ],
  },
  {
    cat: 'Juridique', themes: ['midnightSlate', 'darkTech', 'warmCorp', 'oceanTeal', 'amberGold'],
    items: [
      ['Cabinet d\'Avocats', 'Présentation du cabinet'],
      ['Conformité RGPD', 'Mise en conformité données'],
      ['Droit du Travail', 'Réglementation sociale'],
      ['Propriété Intellectuelle', 'Protection des innovations'],
      ['Droit des Sociétés', 'Gouvernance d\'entreprise'],
      ['Contentieux', 'Gestion des litiges commerciaux'],
      ['Veille Réglementaire', 'Évolutions législatives'],
    ],
  },
  {
    cat: 'Restaurant', themes: ['warmCorp', 'sunsetOrange', 'rubyRed', 'amberGold', 'freshGreen'],
    items: [
      ['Restaurant Gastronomique', 'Présentation du restaurant'],
      ['Menu Design', 'Carte et spécialités culinaires'],
      ['Food Truck', 'Concept mobile de cuisine'],
      ['Coffee Shop', 'Concept café premium'],
      ['Traiteur Événementiel', 'Prestations événementielles'],
      ['Cave à Vins', 'Sélection de vins et accords'],
    ],
  },
  {
    cat: 'Mode', themes: ['rosePink', 'midnightSlate', 'vibrantPurple', 'warmCorp', 'amberGold'],
    items: [
      ['Collection Mode', 'Nouvelle collection saison'],
      ['Fashion Lookbook', 'Shooting et tendances'],
      ['Marque de Luxe', 'Présentation de marque premium'],
      ['Sustainable Fashion', 'Mode éthique et durable'],
      ['Cosmétiques', 'Marque beauté et soins'],
      ['Jewelry Collection', 'Bijoux et accessoires'],
    ],
  },
  {
    cat: 'Sport', themes: ['freshGreen', 'darkTech', 'sunsetOrange', 'rubyRed', 'electricCyan'],
    items: [
      ['Club Sportif', 'Présentation du club'],
      ['Programme Fitness', 'Plan d\'entraînement'],
      ['Événement Sportif', 'Organisation de compétition'],
      ['Performance Athlétique', 'Analyse de performance'],
      ['Esport & Gaming', 'Équipe esport professionnelle'],
      ['Yoga & Bien-être', 'Studio de yoga et wellness'],
    ],
  },
  {
    cat: 'Événements', themes: ['vibrantPurple', 'rosePink', 'amberGold', 'sunsetOrange', 'electricCyan'],
    items: [
      ['Conférence', 'Organisation de conférence'],
      ['Gala de Charité', 'Événement caritatif premium'],
      ['Salon Professionnel', 'Stand et exposition'],
      ['Team Building', 'Activité d\'équipe'],
      ['Festival', 'Organisation de festival'],
      ['Hackathon', 'Marathon de code créatif'],
    ],
  },
  {
    cat: 'Finance', themes: ['darkTech', 'freshGreen', 'midnightSlate', 'oceanTeal', 'amberGold'],
    items: [
      ['Rapport Financier', 'Bilan et compte de résultat'],
      ['Levée de Fonds', 'Deck pour investisseurs'],
      ['Crypto & DeFi', 'Marché des cryptomonnaies'],
      ['Banque Privée', 'Gestion de fortune premium'],
      ['Audit Financier', 'Contrôle des comptes'],
      ['Fintech', 'Innovation financière'],
    ],
  },
  {
    cat: 'RSE', themes: ['freshGreen', 'oceanTeal', 'limeEnergy', 'electricCyan', 'darkTech'],
    items: [
      ['Rapport RSE', 'Responsabilité sociétale'],
      ['Bilan Carbone', 'Empreinte environnementale'],
      ['Développement Durable', 'Stratégie développement durable'],
      ['Économie Circulaire', 'Modèle circulaire innovant'],
      ['Énergie Renouvelable', 'Transition énergétique'],
      ['Impact Social', 'Engagement sociétal mesurable'],
    ],
  },
  {
    cat: 'Association', themes: ['rubyRed', 'sunsetOrange', 'darkTech', 'freshGreen', 'vibrantPurple'],
    items: [
      ['Association Caritative', 'Présentation de l\'association'],
      ['Collecte de Fonds', 'Campagne de dons'],
      ['Projet Humanitaire', 'Mission humanitaire terrain'],
      ['ONG Internationale', 'Organisation internationale'],
      ['Bénévolat', 'Programme de bénévoles'],
      ['Aide d\'Urgence', 'Intervention d\'urgence'],
    ],
  },
];

otherCategories.forEach(({ cat, items, themes: themeKeys }) => {
  items.forEach(([name, desc], i) => {
    const t = THEMES[themeKeys[i % themeKeys.length]];
    allTemplates.push(buildTemplate({
      id: `${cat.toLowerCase().replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a').replace(/[ùû]/g, 'u').replace(/[^a-z]/g, '')}-${i}`,
      name, desc, cat, theme: t, layoutStyle: i % 5,
      heroTitle: name, heroSub: `${desc}. Une présentation professionnelle et impactante.`,
      agendaItems: ['Présentation générale', 'Contexte & Enjeux', 'Notre proposition', 'Détails et chiffres', 'Équipe & Ressources', 'Conclusion'],
      aboutTitle: 'Présentation', aboutParagraphs: [
        `${name} — une présentation complète pour communiquer efficacement sur votre projet.`,
        'Notre approche combine expertise sectorielle et design professionnel pour un maximum d\'impact.',
        'Chaque slide est conçu pour captiver votre audience et transmettre vos messages clés.',
      ],
      featureHeading: 'Points Forts', features: [
        { num: '01', title: 'Expertise', desc: 'Des années d\'expérience dans le secteur pour une vision éclairée.' },
        { num: '02', title: 'Qualité', desc: 'Des standards élevés à chaque étape du processus.' },
        { num: '03', title: 'Résultats', desc: 'Des résultats mesurables et un impact concret.' },
      ],
      metricsHeading: 'En Chiffres', metrics: [
        { value: '100+', label: 'Projets', sub: 'réalisés' },
        { value: '98%', label: 'Satisfaction', sub: 'client' },
        { value: '15', label: 'Années', sub: 'd\'expérience' },
        { value: '50+', label: 'Experts', sub: 'dans l\'équipe' },
      ],
      splitHeading: 'Notre Approche', splitLeft: 'Valeurs', splitLeftItems: ['Excellence', 'Innovation', 'Engagement', 'Transparence'], splitRight: 'Méthodes', splitRightItems: ['Analyse approfondie', 'Co-construction', 'Suivi continu', 'Amélioration permanente'],
      processHeading: 'Notre Processus', processSteps: [
        { title: 'Écoute', desc: 'Compréhension de vos besoins et objectifs' },
        { title: 'Proposition', desc: 'Solution personnalisée et adaptée' },
        { title: 'Réalisation', desc: 'Mise en œuvre avec suivi régulier' },
        { title: 'Bilan', desc: 'Évaluation et perspectives' },
      ],
      quote: 'L\'excellence est un art que l\'on n\'atteint que par l\'exercice constant.', quoteAuthor: 'Aristote', quoteRole: 'Philosophe',
      bigNumber: '98%', bigLabel: 'Taux de satisfaction client', bigDesc: 'La confiance de nos clients est notre plus grande fierté.',
      sectionNum: '03', sectionTitle: 'Détails & Résultats',
      teamHeading: 'Notre Équipe', team: [
        { name: 'Marie Laurent', role: 'Directrice' },
        { name: 'Thomas Bernard', role: 'Expert sénior' },
        { name: 'Léa Martin', role: 'Coordinatrice' },
        { name: 'Hugo Petit', role: 'Analyste' },
      ],
      compHeading: 'Notre Différence', compLeft: 'Approche standard', compLeftItems: ['Service générique', 'Communication limitée', 'Suivi minimal', 'Résultats incertains'],
      compRight: 'Notre Approche', compRightItems: ['Service personnalisé', 'Communication proactive', 'Suivi dédié', 'Résultats garantis'],
      ctaHeadline: 'Merci', ctaSub: 'Prêts à démarrer ensemble ?', ctaEmail: 'contact@company.com', ctaWeb: 'www.company.com',
    }));
  });
});

// ═══════════════════════════════════════════
// BLANK TEMPLATE
// ═══════════════════════════════════════════

const blankTemplate: PresentationTemplate = {
  id: 'blank', name: 'Présentation vierge', description: 'Commencer de zéro',
  category: 'Basique', thumbnail: '#64748b', color: '#64748b',
  slides: [{ id: uid(), elements: [], background: '#ffffff' }]
};

// ═══════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════

export const presentationTemplates: PresentationTemplate[] = [
  blankTemplate,
  ...allTemplates,
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
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=300&fit=crop',
  ],
  'Personnes': [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=300&fit=crop',
  ],
  'Architecture': [
    'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1448630360428-65456885c650?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1431576901776-e539bd916ba2?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1486718448742-163732cd1544?w=400&h=300&fit=crop',
  ],
  'Abstrait': [
    'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=300&fit=crop',
  ],
  'Éducation': [
    'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
  ],
  'Médical': [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&h=300&fit=crop',
  ],
  'Food': [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
  ],
  'Sport': [
    'https://images.unsplash.com/photo-1461896836934-bd45ba8a5eed?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
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
];

export const colorPalettes = [
  { name: 'Professionnel', colors: ['#1e293b', '#334155', '#3b82f6', '#60a5fa', '#e2e8f0', '#ffffff'] },
  { name: 'Vibrant', colors: ['#7c3aed', '#a855f7', '#ec4899', '#f43f5e', '#fb923c', '#fbbf24'] },
  { name: 'Nature', colors: ['#064e3b', '#059669', '#10b981', '#34d399', '#6ee7b7', '#d1fae5'] },
  { name: 'Coucher de soleil', colors: ['#7c2d12', '#ea580c', '#f97316', '#fb923c', '#fde68a', '#fefce8'] },
  { name: 'Océan', colors: ['#0c4a6e', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#e0f2fe'] },
  { name: 'Monochrome', colors: ['#000000', '#27272a', '#52525b', '#a1a1aa', '#d4d4d8', '#ffffff'] },
  { name: 'Pastel', colors: ['#fce7f3', '#ddd6fe', '#bfdbfe', '#a7f3d0', '#fef08a', '#fed7aa'] },
  { name: 'Luxe', colors: ['#1c1917', '#292524', '#d4a574', '#e8c9a0', '#f5efe8', '#ffffff'] },
];
