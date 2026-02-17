// ============================================================
// BIBLIOTHÈQUE DE TEMPLATES VISUELS — 300+ modèles
// ============================================================

export interface VisualTemplate {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'document' | 'pedagogique' | 'marketing';
  subcategory: string;
  format: string;
  width: number;
  height: number;
  thumbnail: string; // emoji
  colors: string[]; // palette principale
  tags: string[];
  isPro?: boolean;
  isNew?: boolean;
  canvas: {
    background: string;
    elements: any[];
  };
}

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────
const txt = (id: string, x: number, y: number, w: number, h: number, content: string, opts: any = {}) => ({
  id, type: 'text', x, y, width: w, height: h, content,
  fontSize: opts.fontSize || 32, fontWeight: opts.bold ? 'bold' : 'normal',
  fontStyle: opts.italic ? 'italic' : 'normal',
  textAlign: opts.align || 'left', color: opts.color || '#1e293b',
  opacity: 1, zIndex: opts.z || 1,
});
const rect = (id: string, x: number, y: number, w: number, h: number, bg: string, opts: any = {}) => ({
  id, type: 'rectangle', x, y, width: w, height: h, backgroundColor: bg,
  borderRadius: opts.radius || 0, opacity: opts.opacity || 1, zIndex: opts.z || 0,
  borderWidth: opts.border || 0, borderColor: opts.borderColor || '#000',
});
const circ = (id: string, x: number, y: number, w: number, h: number, bg: string, opts: any = {}) => ({
  id, type: 'circle', x, y, width: w, height: h, backgroundColor: bg, opacity: opts.opacity || 1, zIndex: opts.z || 0,
});

// ──────────────────────────────────────────
// 1. RÉSEAUX SOCIAUX (100 templates)
// ──────────────────────────────────────────

// --- LinkedIn Posts (20) ---
const linkedinPosts: VisualTemplate[] = [
  {
    id: 'li-post-01', name: 'Post LinkedIn Pro', description: 'Post professionnel bleu corporate',
    category: 'social', subcategory: 'LinkedIn', format: 'Post LinkedIn (1200×627)',
    width: 1200, height: 627, thumbnail: '💼', colors: ['#0077b5', '#ffffff', '#1e293b'],
    tags: ['linkedin', 'professionnel', 'corporate', 'bleu'],
    canvas: {
      background: '#0077b5',
      elements: [
        rect('r1', 0, 0, 1200, 627, '#0077b5'),
        rect('r2', 60, 60, 6, 507, '#ffffff', { z: 1 }),
        txt('t1', 90, 80, 900, 80, '💡 CONSEIL DU JOUR', { fontSize: 22, bold: true, color: '#93c5fd', z: 2 }),
        txt('t2', 90, 180, 900, 200, 'Le secret de la réussite professionnelle ?', { fontSize: 52, bold: true, color: '#ffffff', z: 2 }),
        txt('t3', 90, 400, 900, 60, 'Développer ses compétences chaque jour.', { fontSize: 28, color: '#bfdbfe', z: 2 }),
        txt('t4', 90, 490, 400, 40, 'Votre Nom · linkedin.com/in/vous', { fontSize: 18, color: '#93c5fd', z: 2 }),
      ]
    }
  },
  {
    id: 'li-post-02', name: 'Citation Motivante', description: 'Post citation inspirante pour LinkedIn',
    category: 'social', subcategory: 'LinkedIn', format: 'Post LinkedIn (1200×627)',
    width: 1200, height: 627, thumbnail: '✨', colors: ['#1e293b', '#f59e0b', '#ffffff'],
    tags: ['linkedin', 'citation', 'motivation', 'dark'],
    canvas: {
      background: '#1e293b',
      elements: [
        rect('r1', 0, 0, 1200, 627, '#1e293b'),
        circ('c1', -100, -100, 400, 400, '#f59e0b', { opacity: 0.08, z: 0 }),
        circ('c2', 900, 300, 300, 300, '#f59e0b', { opacity: 0.08, z: 0 }),
        txt('t1', 100, 100, 1000, 50, '"', { fontSize: 120, bold: true, color: '#f59e0b', z: 1 }),
        txt('t2', 100, 200, 1000, 200, 'Le succès n\'est pas final, l\'échec n\'est pas fatal. C\'est le courage de continuer qui compte.', { fontSize: 38, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t3', 100, 500, 1000, 40, '— Winston Churchill', { fontSize: 22, italic: true, color: '#f59e0b', z: 2, align: 'center' }),
      ]
    }
  },
  {
    id: 'li-post-03', name: 'Annonce Recrutement', description: 'Offre d\'emploi LinkedIn',
    category: 'social', subcategory: 'LinkedIn', format: 'Post LinkedIn (1200×627)',
    width: 1200, height: 627, thumbnail: '🎯', colors: ['#059669', '#ffffff', '#1e293b'],
    tags: ['linkedin', 'recrutement', 'emploi', 'vert'],
    canvas: {
      background: '#f0fdf4',
      elements: [
        rect('r1', 0, 0, 1200, 627, '#f0fdf4'),
        rect('r2', 0, 0, 400, 627, '#059669', { z: 0 }),
        txt('t1', 30, 180, 340, 60, '🎯', { fontSize: 80, z: 1, align: 'center' }),
        txt('t2', 30, 280, 340, 100, 'WE\'RE\nHIRING', { fontSize: 48, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t3', 440, 80, 700, 60, 'Nous recrutons !', { fontSize: 42, bold: true, color: '#059669', z: 1 }),
        txt('t4', 440, 160, 700, 80, 'Développeur Full Stack Senior', { fontSize: 32, bold: true, color: '#1e293b', z: 1 }),
        txt('t5', 440, 270, 700, 120, '✓ CDI - Paris\n✓ 45-60K €\n✓ Remote friendly', { fontSize: 22, color: '#374151', z: 1 }),
        txt('t6', 440, 440, 700, 50, 'Envoyez votre CV à recrutement@entreprise.com', { fontSize: 18, color: '#059669', z: 1 }),
        txt('t7', 440, 520, 700, 40, '#Recrutement #Dev #Emploi #Tech', { fontSize: 16, color: '#6b7280', z: 1 }),
      ]
    }
  },
  {
    id: 'li-post-04', name: 'Stats & Chiffres', description: 'Post infographie chiffres clés',
    category: 'social', subcategory: 'LinkedIn', format: 'Post LinkedIn (1200×627)',
    width: 1200, height: 627, thumbnail: '📊', colors: ['#7c3aed', '#ffffff', '#f3e8ff'],
    tags: ['linkedin', 'stats', 'infographie', 'violet'],
    canvas: {
      background: '#7c3aed',
      elements: [
        rect('r1', 0, 0, 1200, 627, '#7c3aed'),
        txt('t0', 100, 40, 1000, 60, 'LES CHIFFRES QUI FONT RÉFLÉCHIR', { fontSize: 28, bold: true, color: '#c4b5fd', z: 1, align: 'center' }),
        rect('r2', 80, 120, 300, 200, '#6d28d9', { radius: 16, z: 1 }),
        txt('t1', 80, 150, 300, 80, '87%', { fontSize: 64, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t2', 80, 250, 300, 50, 'des entreprises\ndigitalisées', { fontSize: 16, color: '#c4b5fd', z: 2, align: 'center' }),
        rect('r3', 420, 120, 300, 200, '#6d28d9', { radius: 16, z: 1 }),
        txt('t3', 420, 150, 300, 80, '3.5x', { fontSize: 64, bold: true, color: '#f59e0b', z: 2, align: 'center' }),
        txt('t4', 420, 250, 300, 50, 'plus productives', { fontSize: 16, color: '#c4b5fd', z: 2, align: 'center' }),
        rect('r4', 760, 120, 300, 200, '#6d28d9', { radius: 16, z: 1 }),
        txt('t5', 760, 150, 300, 80, '#1', { fontSize: 64, bold: true, color: '#34d399', z: 2, align: 'center' }),
        txt('t6', 760, 250, 300, 50, 'priorité en 2025', { fontSize: 16, color: '#c4b5fd', z: 2, align: 'center' }),
        txt('t7', 100, 380, 1000, 200, 'La transformation digitale n\'est plus une option, c\'est une nécessité. Est-ce que votre entreprise est prête ?', { fontSize: 26, color: '#e9d5ff', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'li-post-05', name: 'Nouveau Poste', description: 'Annonce prise de poste LinkedIn',
    category: 'social', subcategory: 'LinkedIn', format: 'Post LinkedIn (1200×627)',
    width: 1200, height: 627, thumbnail: '🚀', colors: ['#0f172a', '#38bdf8', '#ffffff'], tags: ['linkedin', 'carriere', 'nouveau poste'],
    canvas: {
      background: '#0f172a',
      elements: [
        rect('r1', 0, 0, 1200, 627, '#0f172a'),
        rect('r2', 0, 500, 1200, 127, '#0369a1', { opacity: 0.4, z: 0 }),
        circ('c1', 500, 150, 600, 600, '#38bdf8', { opacity: 0.04, z: 0 }),
        txt('t1', 100, 60, 1000, 70, '🎉 EXCITING NEWS!', { fontSize: 32, bold: true, color: '#38bdf8', z: 1 }),
        txt('t2', 100, 160, 1000, 180, 'Je suis ravi(e) d\'annoncer ma nomination au poste de', { fontSize: 34, color: '#e2e8f0', z: 1 }),
        txt('t3', 100, 310, 1000, 80, 'Directeur(rice) Commercial(e)', { fontSize: 52, bold: true, color: '#38bdf8', z: 1 }),
        txt('t4', 100, 410, 1000, 50, 'chez @Entreprise — Paris, France', { fontSize: 28, color: '#94a3b8', z: 1 }),
        txt('t5', 100, 520, 700, 40, '#Emploi #Carrière #Nouveau #Business', { fontSize: 18, color: '#475569', z: 1 }),
      ]
    }
  },
  {
    id: 'li-post-06', name: 'Tip 3 Points', description: 'Post conseil en 3 étapes', category: 'social', subcategory: 'LinkedIn',
    format: 'Post LinkedIn (1200×627)', width: 1200, height: 627, thumbnail: '📝', colors: ['#ffffff', '#2563eb', '#1e293b'],
    tags: ['linkedin', 'tips', 'conseils', 'liste'],
    canvas: {
      background: '#ffffff',
      elements: [
        rect('r1', 0, 0, 1200, 8, '#2563eb', { z: 1 }),
        txt('t1', 80, 60, 1040, 70, '3 règles pour réussir en entreprise', { fontSize: 44, bold: true, color: '#1e293b', z: 1 }),
        rect('r2', 80, 180, 48, 48, '#2563eb', { radius: 24, z: 1 }),
        txt('t2', 80, 188, 48, 32, '1', { fontSize: 24, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t3', 148, 175, 950, 60, 'Communiquer clairement ses objectifs chaque semaine', { fontSize: 28, color: '#1e293b', z: 1 }),
        rect('r3', 80, 280, 48, 48, '#059669', { radius: 24, z: 1 }),
        txt('t4', 80, 288, 48, 32, '2', { fontSize: 24, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t5', 148, 275, 950, 60, 'Créer de la valeur avant de demander quelque chose', { fontSize: 28, color: '#1e293b', z: 1 }),
        rect('r4', 80, 380, 48, 48, '#dc2626', { radius: 24, z: 1 }),
        txt('t6', 80, 388, 48, 32, '3', { fontSize: 24, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t7', 148, 375, 950, 60, 'Apprendre quelque chose de nouveau chaque mois', { fontSize: 28, color: '#1e293b', z: 1 }),
        rect('r5', 80, 490, 1040, 1, '#e2e8f0', { z: 1 }),
        txt('t8', 80, 505, 600, 40, 'Lequel résonne le plus avec vous ? 👇', { fontSize: 22, color: '#6b7280', z: 1 }),
      ]
    }
  },
  {
    id: 'li-post-07', name: 'Partage Article', description: 'Post partage de contenu', category: 'social', subcategory: 'LinkedIn',
    format: 'Post LinkedIn (1200×627)', width: 1200, height: 627, thumbnail: '📰', colors: ['#f8fafc', '#1e293b', '#2563eb'],
    tags: ['linkedin', 'article', 'contenu', 'blog'], isNew: true,
    canvas: {
      background: '#f8fafc',
      elements: [
        rect('r1', 0, 0, 1200, 8, '#2563eb'),
        rect('r2', 0, 8, 1200, 619, '#f8fafc'),
        txt('t1', 80, 50, 200, 40, '📰 ARTICLE', { fontSize: 18, bold: true, color: '#2563eb', z: 1 }),
        txt('t2', 80, 110, 1040, 150, 'Comment l\'IA va transformer le marché du travail d\'ici 2030', { fontSize: 48, bold: true, color: '#0f172a', z: 1 }),
        txt('t3', 80, 290, 1040, 120, 'Les experts s\'accordent : 85 millions de postes seront transformés par l\'automatisation. Découvrez les secteurs les plus impactés et comment s\'y préparer.', { fontSize: 24, color: '#475569', z: 1 }),
        rect('r3', 80, 460, 1040, 1, '#cbd5e1', { z: 1 }),
        txt('t4', 80, 475, 400, 40, 'Auteur · Titre · Entreprise', { fontSize: 18, color: '#94a3b8', z: 1 }),
        txt('t5', 700, 475, 420, 40, '12 min de lecture · 2.4K partages', { fontSize: 18, color: '#94a3b8', z: 1, align: 'right' }),
      ]
    }
  },
  {
    id: 'li-post-08', name: 'Anniversaire Entreprise', description: 'Célébration anniversaire société', category: 'social', subcategory: 'LinkedIn',
    format: 'Post LinkedIn (1200×627)', width: 1200, height: 627, thumbnail: '🎂', colors: ['#fbbf24', '#1e293b', '#ffffff'],
    tags: ['linkedin', 'anniversaire', 'celebration', 'entreprise'],
    canvas: {
      background: '#1e293b',
      elements: [
        circ('c1', 0, 0, 500, 500, '#fbbf24', { opacity: 0.1, z: 0 }),
        circ('c2', 800, 200, 400, 400, '#f59e0b', { opacity: 0.08, z: 0 }),
        txt('t1', 100, 80, 1000, 80, '🎉 🎂 🎊', { fontSize: 60, z: 1, align: 'center' }),
        txt('t2', 100, 190, 1000, 100, 'NOUS FÊTONS NOS', { fontSize: 36, bold: true, color: '#fbbf24', z: 1, align: 'center' }),
        txt('t3', 100, 270, 1000, 120, '10 ANS', { fontSize: 96, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t4', 100, 410, 1000, 60, 'Merci à tous nos clients et partenaires !', { fontSize: 30, color: '#fcd34d', z: 1, align: 'center' }),
        txt('t5', 100, 490, 1000, 40, 'Depuis 2015, nous grandissons grâce à votre confiance. 🙏', { fontSize: 22, color: '#94a3b8', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'li-post-09', name: 'Événement Webinaire', description: 'Invitation à un webinaire', category: 'social', subcategory: 'LinkedIn',
    format: 'Post LinkedIn (1200×627)', width: 1200, height: 627, thumbnail: '🎤', colors: ['#7c3aed', '#ffffff', '#f3e8ff'],
    tags: ['linkedin', 'webinaire', 'événement', 'invitation'],
    canvas: {
      background: '#7c3aed',
      elements: [
        rect('r1', 0, 0, 1200, 627, '#7c3aed'),
        circ('c1', -50, -50, 300, 300, '#6d28d9', { z: 0 }),
        rect('r2', 0, 520, 1200, 107, '#5b21b6', { z: 0 }),
        txt('t1', 80, 40, 400, 50, '🎤 WEBINAIRE GRATUIT', { fontSize: 24, bold: true, color: '#c4b5fd', z: 1 }),
        txt('t2', 80, 120, 1040, 200, 'Maîtriser les réseaux sociaux professionnels en 2025', { fontSize: 46, bold: true, color: '#ffffff', z: 1 }),
        txt('t3', 80, 340, 1040, 60, '📅 Jeudi 15 Février 2025  ·  🕐 14h00 - 15h30  ·  🖥️ En ligne', { fontSize: 24, color: '#ddd6fe', z: 1 }),
        txt('t4', 80, 430, 600, 50, '👨‍💼 Présenté par [Votre Nom]', { fontSize: 22, color: '#c4b5fd', z: 1 }),
        txt('t5', 80, 540, 1000, 40, 'Inscription gratuite sur notre site → lien en commentaire', { fontSize: 20, color: '#ede9fe', z: 1 }),
      ]
    }
  },
  {
    id: 'li-post-10', name: 'Témoignage Client', description: 'Post avis client LinkedIn', category: 'social', subcategory: 'LinkedIn',
    format: 'Post LinkedIn (1200×627)', width: 1200, height: 627, thumbnail: '⭐', colors: ['#ffffff', '#0077b5', '#1e293b'],
    tags: ['linkedin', 'témoignage', 'avis', 'social proof'],
    canvas: {
      background: '#ffffff',
      elements: [
        rect('r1', 0, 0, 1200, 12, '#0077b5', { z: 1 }),
        txt('t0', 80, 40, 300, 50, '⭐⭐⭐⭐⭐', { fontSize: 36, z: 1 }),
        txt('t1', 80, 110, 1040, 50, '"', { fontSize: 80, bold: true, color: '#0077b5', z: 1 }),
        txt('t2', 140, 130, 900, 200, 'Travailler avec cette équipe a été une expérience transformatrice. Résultats mesurables en 3 mois, professionnalisme exceptionnel.', { fontSize: 32, italic: true, color: '#1e293b', z: 1 }),
        rect('r2', 80, 390, 60, 60, '#e2e8f0', { radius: 30, z: 1 }),
        txt('t3', 80, 395, 60, 50, '👤', { fontSize: 36, z: 2, align: 'center' }),
        txt('t4', 160, 395, 500, 30, 'Marie Dupont', { fontSize: 22, bold: true, color: '#1e293b', z: 1 }),
        txt('t5', 160, 430, 500, 30, 'Directrice Marketing · Entreprise XYZ', { fontSize: 18, color: '#6b7280', z: 1 }),
        rect('r3', 700, 370, 420, 80, '#f0f9ff', { radius: 12, z: 1 }),
        txt('t6', 720, 385, 380, 50, '+ 40% de CA\nen 6 mois', { fontSize: 20, bold: true, color: '#0077b5', z: 2, align: 'center' }),
      ]
    }
  },
  {
    id: 'li-post-11', name: 'Lancement Produit', description: 'Annonce nouveau produit/service', category: 'social', subcategory: 'LinkedIn',
    format: 'Post LinkedIn (1200×627)', width: 1200, height: 627, thumbnail: '🚀', colors: ['#0f172a', '#e11d48', '#ffffff'],
    tags: ['linkedin', 'lancement', 'produit', 'annonce'], isNew: true,
    canvas: {
      background: '#0f172a',
      elements: [
        rect('r1', 0, 0, 1200, 627, '#0f172a'),
        circ('c1', 900, 100, 500, 500, '#e11d48', { opacity: 0.15, z: 0 }),
        txt('t1', 80, 60, 500, 50, '🚀 NOUVEAU', { fontSize: 20, bold: true, color: '#f43f5e', z: 1 }),
        rect('r2', 80, 70, 200, 4, '#e11d48', { z: 1 }),
        txt('t2', 80, 130, 900, 200, 'Présentation de notre nouvelle solution SaaS', { fontSize: 52, bold: true, color: '#ffffff', z: 1 }),
        txt('t3', 80, 360, 900, 100, 'Automatisez vos processus et gagnez 10h par semaine. Disponible dès maintenant.', { fontSize: 28, color: '#94a3b8', z: 1 }),
        rect('r3', 80, 490, 280, 70, '#e11d48', { radius: 8, z: 1 }),
        txt('t4', 80, 508, 280, 34, '🔗 Découvrir', { fontSize: 24, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t5', 400, 505, 600, 40, '#Innovation #SaaS #Technologie #B2B', { fontSize: 20, color: '#475569', z: 1 }),
      ]
    }
  },
  {
    id: 'li-post-12', name: 'Formation Annonce', description: 'Annonce formation ou cours', category: 'social', subcategory: 'LinkedIn',
    format: 'Post LinkedIn (1200×627)', width: 1200, height: 627, thumbnail: '🎓', colors: ['#f59e0b', '#1e293b', '#ffffff'],
    tags: ['linkedin', 'formation', 'cours', 'apprentissage'],
    canvas: {
      background: '#fef3c7',
      elements: [
        rect('r1', 0, 0, 1200, 627, '#fef3c7'),
        rect('r2', 0, 0, 1200, 200, '#f59e0b', { z: 0 }),
        txt('t1', 80, 50, 1040, 100, '🎓 NOUVELLE FORMATION DISPONIBLE', { fontSize: 34, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t2', 80, 220, 1040, 120, 'Maîtrisez Excel en 30 jours — De zéro à expert', { fontSize: 46, bold: true, color: '#1e293b', z: 1 }),
        txt('t3', 80, 370, 600, 50, '✅ 45 heures de contenu vidéo', { fontSize: 22, color: '#374151', z: 1 }),
        txt('t4', 80, 420, 600, 50, '✅ Exercices pratiques inclus', { fontSize: 22, color: '#374151', z: 1 }),
        txt('t5', 80, 470, 600, 50, '✅ Certificat de réussite', { fontSize: 22, color: '#374151', z: 1 }),
        rect('r3', 700, 360, 420, 190, '#f59e0b', { radius: 16, z: 1 }),
        txt('t6', 700, 390, 420, 60, '149€', { fontSize: 56, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t7', 700, 450, 420, 30, 'au lieu de 299€', { fontSize: 18, color: '#fef3c7', z: 2, align: 'center', italic: true }),
        txt('t8', 700, 490, 420, 40, '⚡ Offre limitée', { fontSize: 20, bold: true, color: '#1e293b', z: 2, align: 'center' }),
      ]
    }
  },
  {
    id: 'li-post-13', name: 'Infographie Processus', description: 'Étapes d\'un processus clé', category: 'social', subcategory: 'LinkedIn',
    format: 'Post LinkedIn (1200×627)', width: 1200, height: 627, thumbnail: '⚙️', colors: ['#0f172a', '#3b82f6', '#ffffff'],
    tags: ['linkedin', 'processus', 'étapes', 'infographie'],
    canvas: {
      background: '#0f172a',
      elements: [
        txt('t0', 80, 40, 1040, 60, 'LE PROCESSUS EN 4 ÉTAPES', { fontSize: 28, bold: true, color: '#60a5fa', z: 1, align: 'center' }),
        rect('r1', 80, 130, 240, 400, '#1e3a5f', { radius: 12, z: 1 }),
        txt('t1', 80, 160, 240, 60, '01', { fontSize: 48, bold: true, color: '#3b82f6', z: 2, align: 'center' }),
        txt('t2', 80, 230, 240, 40, 'Analyser', { fontSize: 22, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t3', 80, 280, 240, 80, 'Évaluer votre situation actuelle', { fontSize: 16, color: '#93c5fd', z: 2, align: 'center' }),
        rect('r2', 340, 130, 240, 400, '#1e3a5f', { radius: 12, z: 1 }),
        txt('t4', 340, 160, 240, 60, '02', { fontSize: 48, bold: true, color: '#8b5cf6', z: 2, align: 'center' }),
        txt('t5', 340, 230, 240, 40, 'Planifier', { fontSize: 22, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t6', 340, 280, 240, 80, 'Définir la stratégie optimale', { fontSize: 16, color: '#c4b5fd', z: 2, align: 'center' }),
        rect('r3', 600, 130, 240, 400, '#1e3a5f', { radius: 12, z: 1 }),
        txt('t7', 600, 160, 240, 60, '03', { fontSize: 48, bold: true, color: '#10b981', z: 2, align: 'center' }),
        txt('t8', 600, 230, 240, 40, 'Exécuter', { fontSize: 22, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t9', 600, 280, 240, 80, 'Mettre en œuvre les actions', { fontSize: 16, color: '#6ee7b7', z: 2, align: 'center' }),
        rect('r4', 860, 130, 240, 400, '#1e3a5f', { radius: 12, z: 1 }),
        txt('t10', 860, 160, 240, 60, '04', { fontSize: 48, bold: true, color: '#f59e0b', z: 2, align: 'center' }),
        txt('t11', 860, 230, 240, 40, 'Mesurer', { fontSize: 22, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t12', 860, 280, 240, 80, 'Analyser les résultats obtenus', { fontSize: 16, color: '#fcd34d', z: 2, align: 'center' }),
      ]
    }
  },
  {
    id: 'li-post-14', name: 'Avant / Après', description: 'Comparaison avant après', category: 'social', subcategory: 'LinkedIn',
    format: 'Post LinkedIn (1200×627)', width: 1200, height: 627, thumbnail: '🔄', colors: ['#dc2626', '#059669', '#ffffff'],
    tags: ['linkedin', 'avant apres', 'comparison', 'résultats'],
    canvas: {
      background: '#f8fafc',
      elements: [
        txt('t0', 80, 30, 1040, 60, 'LA TRANSFORMATION EN CHIFFRES', { fontSize: 28, bold: true, color: '#1e293b', z: 1, align: 'center' }),
        rect('r1', 60, 110, 500, 450, '#fef2f2', { radius: 16, z: 1 }),
        txt('t1', 60, 130, 500, 50, '❌ AVANT', { fontSize: 28, bold: true, color: '#dc2626', z: 2, align: 'center' }),
        txt('t2', 80, 210, 460, 40, '2h de réunions quotidiennes', { fontSize: 20, color: '#374151', z: 2 }),
        txt('t3', 80, 260, 460, 40, '30% de taux d\'abandon', { fontSize: 20, color: '#374151', z: 2 }),
        txt('t4', 80, 310, 460, 40, '5 outils différents', { fontSize: 20, color: '#374151', z: 2 }),
        txt('t5', 80, 360, 460, 40, 'Processus manuels', { fontSize: 20, color: '#374151', z: 2 }),
        rect('r2', 640, 110, 500, 450, '#f0fdf4', { radius: 16, z: 1 }),
        txt('t6', 640, 130, 500, 50, '✅ APRÈS', { fontSize: 28, bold: true, color: '#059669', z: 2, align: 'center' }),
        txt('t7', 660, 210, 460, 40, '20 min de standup efficace', { fontSize: 20, color: '#374151', z: 2 }),
        txt('t8', 660, 260, 460, 40, '95% de satisfaction client', { fontSize: 20, color: '#374151', z: 2 }),
        txt('t9', 660, 310, 460, 40, '1 plateforme centralisée', { fontSize: 20, color: '#374151', z: 2 }),
        txt('t10', 660, 360, 460, 40, 'Automatisation complète', { fontSize: 20, color: '#374151', z: 2 }),
        txt('t11', 550, 300, 100, 100, '→', { fontSize: 60, bold: true, color: '#64748b', z: 2 }),
      ]
    }
  },
  {
    id: 'li-post-15', name: 'Rapport Mensuel', description: 'KPIs & résultats du mois', category: 'social', subcategory: 'LinkedIn',
    format: 'Post LinkedIn (1200×627)', width: 1200, height: 627, thumbnail: '📈', colors: ['#1e293b', '#10b981', '#ffffff'],
    tags: ['linkedin', 'kpi', 'résultats', 'performance'],
    canvas: {
      background: '#1e293b',
      elements: [
        txt('t0', 80, 40, 1040, 60, '📊 RAPPORT MENSUEL — JANVIER 2025', { fontSize: 24, bold: true, color: '#10b981', z: 1 }),
        rect('r1', 80, 120, 480, 180, '#0f2027', { radius: 12, z: 1 }),
        txt('t1', 80, 145, 480, 60, '+127%', { fontSize: 52, bold: true, color: '#10b981', z: 2, align: 'center' }),
        txt('t2', 80, 210, 480, 40, 'Croissance du CA', { fontSize: 20, color: '#94a3b8', z: 2, align: 'center' }),
        rect('r2', 580, 120, 480, 180, '#0f2027', { radius: 12, z: 1 }),
        txt('t3', 580, 145, 480, 60, '2.4K', { fontSize: 52, bold: true, color: '#38bdf8', z: 2, align: 'center' }),
        txt('t4', 580, 210, 480, 40, 'Nouveaux clients', { fontSize: 20, color: '#94a3b8', z: 2, align: 'center' }),
        rect('r3', 80, 330, 220, 140, '#0f2027', { radius: 12, z: 1 }),
        txt('t5', 80, 355, 220, 50, '98%', { fontSize: 38, bold: true, color: '#f59e0b', z: 2, align: 'center' }),
        txt('t6', 80, 410, 220, 40, 'Satisfaction', { fontSize: 16, color: '#94a3b8', z: 2, align: 'center' }),
        rect('r4', 320, 330, 220, 140, '#0f2027', { radius: 12, z: 1 }),
        txt('t7', 320, 355, 220, 50, '45K', { fontSize: 38, bold: true, color: '#ec4899', z: 2, align: 'center' }),
        txt('t8', 320, 410, 220, 40, 'Impressions', { fontSize: 16, color: '#94a3b8', z: 2, align: 'center' }),
        rect('r5', 560, 330, 220, 140, '#0f2027', { radius: 12, z: 1 }),
        txt('t9', 560, 355, 220, 50, '8.7%', { fontSize: 38, bold: true, color: '#a78bfa', z: 2, align: 'center' }),
        txt('t10', 560, 410, 220, 40, 'Engagement', { fontSize: 16, color: '#94a3b8', z: 2, align: 'center' }),
        rect('r6', 800, 330, 320, 140, '#065f46', { radius: 12, z: 1 }),
        txt('t11', 800, 355, 320, 80, '🎯 Objectif\ndépassé!', { fontSize: 26, bold: true, color: '#6ee7b7', z: 2, align: 'center' }),
      ]
    }
  },
  {
    id: 'li-post-16', name: 'Branding Perso', description: 'Post personal branding', category: 'social', subcategory: 'LinkedIn',
    format: 'Post LinkedIn (1200×627)', width: 1200, height: 627, thumbnail: '🌟', colors: ['#fef9c3', '#1e293b', '#f59e0b'],
    tags: ['linkedin', 'personal branding', 'identité', 'profil'], isNew: true,
    canvas: {
      background: '#fef9c3',
      elements: [
        circ('c1', 600, 200, 500, 500, '#fde68a', { opacity: 0.5, z: 0 }),
        txt('t1', 80, 60, 1040, 80, 'QUI SUIS-JE ?', { fontSize: 24, bold: true, color: '#b45309', z: 1, align: 'center' }),
        txt('t2', 80, 150, 1040, 100, '👋 Je suis [Prénom NOM]', { fontSize: 52, bold: true, color: '#1e293b', z: 1, align: 'center' }),
        txt('t3', 80, 280, 1040, 50, 'Expert en [domaine] · [Entreprise] · [Ville]', { fontSize: 28, color: '#374151', z: 1, align: 'center' }),
        txt('t4', 80, 360, 1040, 100, 'J\'aide les [cible] à [bénéfice principal]\ngrâce à [méthode / compétence clé]', { fontSize: 26, color: '#374151', z: 1, align: 'center' }),
        txt('t5', 80, 490, 1040, 50, '📩 Me contacter : email@exemple.com · #PersonalBranding', { fontSize: 20, color: '#b45309', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'li-post-17', name: 'Podcast Episode', description: 'Annonce nouvel épisode podcast', category: 'social', subcategory: 'LinkedIn',
    format: 'Post LinkedIn (1200×627)', width: 1200, height: 627, thumbnail: '🎙️', colors: ['#18181b', '#a855f7', '#ffffff'],
    tags: ['linkedin', 'podcast', 'audio', 'contenu'],
    canvas: {
      background: '#18181b',
      elements: [
        rect('r1', 0, 0, 1200, 627, '#18181b'),
        circ('c1', 0, 500, 400, 400, '#a855f7', { opacity: 0.2, z: 0 }),
        circ('c2', 1000, 0, 400, 400, '#a855f7', { opacity: 0.1, z: 0 }),
        txt('t1', 80, 40, 300, 50, '🎙️ NOUVEAU PODCAST', { fontSize: 20, bold: true, color: '#c084fc', z: 1 }),
        txt('t2', 80, 110, 1040, 200, 'Épisode #42 : Comment bâtir une marque employeur irrésistible', { fontSize: 46, bold: true, color: '#ffffff', z: 1 }),
        txt('t3', 80, 330, 1040, 60, 'Invité : Marie Dupont, DRH chez Fortune 500', { fontSize: 26, color: '#a855f7', z: 1 }),
        txt('t4', 80, 410, 600, 50, '⏱️ 42 minutes · 🎵 Disponible sur Spotify', { fontSize: 22, color: '#a1a1aa', z: 1 }),
        rect('r2', 80, 490, 360, 70, '#a855f7', { radius: 35, z: 1 }),
        txt('t5', 80, 508, 360, 34, '▶️ Écouter maintenant', { fontSize: 20, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t6', 480, 505, 600, 40, '#Podcast #Leadership #RH #Management', { fontSize: 18, color: '#52525b', z: 1 }),
      ]
    }
  },
  {
    id: 'li-post-18', name: 'Vidéo Promo', description: 'Vignette promotion vidéo', category: 'social', subcategory: 'LinkedIn',
    format: 'Post LinkedIn (1200×627)', width: 1200, height: 627, thumbnail: '🎬', colors: ['#e11d48', '#ffffff', '#0f172a'],
    tags: ['linkedin', 'video', 'promo', 'visuel'],
    canvas: {
      background: '#0f172a',
      elements: [
        circ('c1', 450, 100, 500, 500, '#e11d48', { opacity: 0.12, z: 0 }),
        txt('t1', 80, 70, 1040, 60, '🎬 NOUVELLE VIDÉO', { fontSize: 24, bold: true, color: '#f43f5e', z: 1 }),
        circ('c2', 500, 230, 100, 100, '#e11d48', { z: 1 }),
        txt('t2', 500, 245, 100, 70, '▶', { fontSize: 50, color: '#ffffff', z: 2, align: 'center' }),
        txt('t3', 80, 160, 380, 180, 'REGARDER LA VIDÉO', { fontSize: 42, bold: true, color: '#ffffff', z: 1 }),
        txt('t4', 80, 360, 900, 100, 'Comment j\'ai multiplié mes revenus par 3 en 6 mois grâce à une stratégie digitale simple.', { fontSize: 26, color: '#94a3b8', z: 1 }),
        txt('t5', 80, 490, 400, 40, '⏱️ 8 min · 15K vues', { fontSize: 20, color: '#f43f5e', z: 1 }),
        txt('t6', 550, 490, 550, 40, '#Stratégie #Digital #Business #Croissance', { fontSize: 18, color: '#475569', z: 1 }),
      ]
    }
  },
  {
    id: 'li-post-19', name: 'Partenariat', description: 'Annonce partenariat collaboration', category: 'social', subcategory: 'LinkedIn',
    format: 'Post LinkedIn (1200×627)', width: 1200, height: 627, thumbnail: '🤝', colors: ['#ffffff', '#2563eb', '#059669'],
    tags: ['linkedin', 'partenariat', 'collaboration', 'business'],
    canvas: {
      background: '#f8fafc',
      elements: [
        rect('r1', 0, 0, 600, 627, '#eff6ff', { z: 0 }),
        rect('r2', 600, 0, 600, 627, '#f0fdf4', { z: 0 }),
        txt('t1', 80, 80, 440, 80, 'Entreprise A', { fontSize: 38, bold: true, color: '#2563eb', z: 1, align: 'center' }),
        txt('t2', 680, 80, 440, 80, 'Entreprise B', { fontSize: 38, bold: true, color: '#059669', z: 1, align: 'center' }),
        txt('t3', 520, 80, 160, 80, '🤝', { fontSize: 56, z: 1, align: 'center' }),
        rect('r3', 200, 200, 4, 427, '#e2e8f0', { z: 1 }),
        rect('r4', 996, 200, 4, 427, '#e2e8f0', { z: 1 }),
        txt('t4', 80, 210, 440, 80, 'Expert en\nMarketing Digital', { fontSize: 24, color: '#374151', z: 1, align: 'center' }),
        txt('t5', 680, 210, 440, 80, 'Spécialiste en\nDéveloppement Tech', { fontSize: 24, color: '#374151', z: 1, align: 'center' }),
        txt('t6', 200, 480, 800, 80, '🎯 Ensemble, nous lançons [projet/service]\npour révolutionner [secteur]', { fontSize: 26, bold: true, color: '#1e293b', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'li-post-20', name: 'Résumé Conférence', description: 'Retour sur une conférence', category: 'social', subcategory: 'LinkedIn',
    format: 'Post LinkedIn (1200×627)', width: 1200, height: 627, thumbnail: '🏛️', colors: ['#1e293b', '#f59e0b', '#ffffff'],
    tags: ['linkedin', 'conference', 'evenement', 'résumé'],
    canvas: {
      background: '#1e293b',
      elements: [
        rect('r1', 0, 0, 1200, 627, '#1e293b'),
        rect('r2', 0, 0, 1200, 100, '#f59e0b', { z: 0 }),
        txt('t1', 80, 20, 1040, 60, '🏛️ MON RETOUR SUR [NOM CONFÉRENCE] 2025', { fontSize: 26, bold: true, color: '#1e293b', z: 1, align: 'center' }),
        txt('t2', 80, 130, 1040, 60, 'Les 3 insights qui vont changer ma façon de travailler', { fontSize: 34, bold: true, color: '#f59e0b', z: 1 }),
        txt('t3', 80, 220, 1040, 50, '💡 [Insight 1] — [Description courte]', { fontSize: 24, color: '#e2e8f0', z: 1 }),
        txt('t4', 80, 290, 1040, 50, '💡 [Insight 2] — [Description courte]', { fontSize: 24, color: '#e2e8f0', z: 1 }),
        txt('t5', 80, 360, 1040, 50, '💡 [Insight 3] — [Description courte]', { fontSize: 24, color: '#e2e8f0', z: 1 }),
        txt('t6', 80, 450, 1040, 60, 'Et vous, quelle a été votre conférence marquante de l\'année ? 👇', { fontSize: 22, color: '#94a3b8', z: 1 }),
        txt('t7', 80, 540, 600, 40, '#Networking #Conference #Apprentissage', { fontSize: 18, color: '#475569', z: 1 }),
      ]
    }
  },
];

// --- Instagram Stories (20) ---
const instaStories: VisualTemplate[] = [
  {
    id: 'ig-story-01', name: 'Story Annonce', description: 'Story Instagram annonce événement',
    category: 'social', subcategory: 'Instagram Story', format: 'Story Instagram (1080×1920)',
    width: 1080, height: 1920, thumbnail: '📱', colors: ['#ec4899', '#8b5cf6', '#ffffff'],
    tags: ['instagram', 'story', 'annonce', 'gradient'],
    canvas: {
      background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
      elements: [
        rect('r1', 0, 0, 1080, 1920, '#8b5cf6'),
        circ('c1', -100, 200, 600, 600, '#ec4899', { opacity: 0.5, z: 0 }),
        circ('c2', 600, 1200, 500, 500, '#a855f7', { opacity: 0.4, z: 0 }),
        txt('t1', 80, 300, 920, 100, '✨ SAVE THE DATE', { fontSize: 36, bold: true, color: '#fdf4ff', z: 1, align: 'center' }),
        txt('t2', 80, 460, 920, 300, 'Évènement\nExceptionnel\n2025', { fontSize: 96, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t3', 80, 820, 920, 60, '📅 15 Février 2025', { fontSize: 32, color: '#f0abfc', z: 1, align: 'center' }),
        txt('t4', 80, 900, 920, 60, '📍 Paris, France', { fontSize: 32, color: '#f0abfc', z: 1, align: 'center' }),
        rect('r2', 280, 1000, 520, 80, '#ffffff', { radius: 40, z: 1 }),
        txt('t5', 280, 1018, 520, 44, 'S\'inscrire maintenant →', { fontSize: 24, bold: true, color: '#8b5cf6', z: 2, align: 'center' }),
        txt('t6', 80, 1680, 920, 50, '👆 Swipe up pour en savoir plus', { fontSize: 24, color: '#fdf4ff', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ig-story-02', name: 'Story Quiz', description: 'Story interactive quiz',
    category: 'social', subcategory: 'Instagram Story', format: 'Story Instagram (1080×1920)',
    width: 1080, height: 1920, thumbnail: '❓', colors: ['#f59e0b', '#1e293b', '#ffffff'],
    tags: ['instagram', 'story', 'quiz', 'interactif'],
    canvas: {
      background: '#fef3c7',
      elements: [
        rect('r1', 0, 0, 1080, 400, '#f59e0b', { z: 0 }),
        txt('t1', 80, 100, 920, 80, '🧠 QUIZ DU JOUR', { fontSize: 42, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t2', 80, 220, 920, 120, 'Testez vos\nconnaissances!', { fontSize: 56, bold: true, color: '#fffbeb', z: 1, align: 'center' }),
        txt('t3', 80, 500, 920, 100, 'Quelle est la capitale\nde la Nouvelle-Zélande ?', { fontSize: 40, bold: true, color: '#1e293b', z: 1, align: 'center' }),
        rect('r2', 80, 700, 900, 100, '#ffffff', { radius: 16, z: 1 }),
        txt('t4', 80, 728, 900, 44, 'A) Auckland', { fontSize: 28, color: '#1e293b', z: 2, align: 'center' }),
        rect('r3', 80, 830, 900, 100, '#ffffff', { radius: 16, z: 1 }),
        txt('t5', 80, 858, 900, 44, 'B) Wellington', { fontSize: 28, color: '#1e293b', z: 2, align: 'center' }),
        rect('r4', 80, 960, 900, 100, '#ffffff', { radius: 16, z: 1 }),
        txt('t6', 80, 988, 900, 44, 'C) Christchurch', { fontSize: 28, color: '#1e293b', z: 2, align: 'center' }),
        txt('t7', 80, 1200, 920, 80, '💬 Répondez en story !', { fontSize: 32, bold: true, color: '#92400e', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ig-story-03', name: 'Story Avant/Après', description: 'Transformation avant/après',
    category: 'social', subcategory: 'Instagram Story', format: 'Story Instagram (1080×1920)',
    width: 1080, height: 1920, thumbnail: '🔄', colors: ['#dc2626', '#059669', '#ffffff'],
    tags: ['instagram', 'story', 'avant apres', 'transformation'],
    canvas: {
      background: '#f8fafc',
      elements: [
        txt('t0', 80, 80, 920, 80, '✨ LA TRANSFORMATION', { fontSize: 36, bold: true, color: '#1e293b', z: 1, align: 'center' }),
        rect('r1', 40, 200, 1000, 600, '#fef2f2', { radius: 20, z: 1 }),
        txt('t1', 40, 220, 1000, 60, '❌ AVANT', { fontSize: 40, bold: true, color: '#dc2626', z: 2, align: 'center' }),
        txt('t2', 80, 320, 920, 60, '📉 Pas de stratégie', { fontSize: 30, color: '#374151', z: 2, align: 'center' }),
        txt('t3', 80, 400, 920, 60, '😓 Résultats stagnants', { fontSize: 30, color: '#374151', z: 2, align: 'center' }),
        txt('t4', 80, 480, 920, 60, '⏰ Temps gaspillé', { fontSize: 30, color: '#374151', z: 2, align: 'center' }),
        txt('t5', 380, 820, 320, 120, '⬇️', { fontSize: 80, z: 2, align: 'center' }),
        rect('r2', 40, 960, 1000, 600, '#f0fdf4', { radius: 20, z: 1 }),
        txt('t6', 40, 980, 1000, 60, '✅ APRÈS', { fontSize: 40, bold: true, color: '#059669', z: 2, align: 'center' }),
        txt('t7', 80, 1080, 920, 60, '📈 Croissance de 200%', { fontSize: 30, color: '#374151', z: 2, align: 'center' }),
        txt('t8', 80, 1160, 920, 60, '🎯 Objectifs atteints', { fontSize: 30, color: '#374151', z: 2, align: 'center' }),
        txt('t9', 80, 1240, 920, 60, '⚡ Efficacité maximale', { fontSize: 30, color: '#374151', z: 2, align: 'center' }),
        txt('t10', 80, 1680, 920, 60, '👆 Swipe pour en savoir plus', { fontSize: 28, color: '#6b7280', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ig-story-04', name: 'Story Soldes', description: 'Story promo et soldes',
    category: 'social', subcategory: 'Instagram Story', format: 'Story Instagram (1080×1920)',
    width: 1080, height: 1920, thumbnail: '🛍️', colors: ['#dc2626', '#fbbf24', '#ffffff'],
    tags: ['instagram', 'story', 'soldes', 'promo', 'ecommerce'],
    canvas: {
      background: '#dc2626',
      elements: [
        rect('r1', 0, 0, 1080, 1920, '#dc2626'),
        circ('c1', -100, 400, 500, 500, '#ef4444', { opacity: 0.5, z: 0 }),
        circ('c2', 700, 1000, 600, 600, '#b91c1c', { opacity: 0.4, z: 0 }),
        txt('t1', 80, 200, 920, 100, '🔥 VENTE FLASH', { fontSize: 56, bold: true, color: '#fbbf24', z: 1, align: 'center' }),
        txt('t2', 80, 360, 920, 400, '-50%', { fontSize: 200, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t3', 80, 760, 920, 80, 'SUR TOUTE LA COLLECTION', { fontSize: 36, bold: true, color: '#fde68a', z: 1, align: 'center' }),
        txt('t4', 80, 880, 920, 60, '⏰ Offre valable 24h seulement !', { fontSize: 28, color: '#ffffff', z: 1, align: 'center' }),
        rect('r2', 190, 1000, 700, 100, '#fbbf24', { radius: 50, z: 1 }),
        txt('t5', 190, 1020, 700, 60, '🛍️ ACHETER MAINTENANT', { fontSize: 28, bold: true, color: '#1e293b', z: 2, align: 'center' }),
        txt('t6', 80, 1700, 920, 60, 'CODE : FLASH50 · Lien dans la bio', { fontSize: 26, color: '#fde68a', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ig-story-05', name: 'Story Recette', description: 'Recette culinaire en story',
    category: 'social', subcategory: 'Instagram Story', format: 'Story Instagram (1080×1920)',
    width: 1080, height: 1920, thumbnail: '🍳', colors: ['#f97316', '#fef3c7', '#1e293b'],
    tags: ['instagram', 'story', 'recette', 'food', 'cuisine'],
    canvas: {
      background: '#fff7ed',
      elements: [
        rect('r1', 0, 0, 1080, 300, '#f97316', { z: 0 }),
        txt('t1', 80, 80, 920, 80, '🍳 RECETTE DU JOUR', { fontSize: 40, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t2', 80, 190, 920, 60, 'Pâtes à la Carbonara', { fontSize: 32, bold: true, color: '#fff7ed', z: 1, align: 'center' }),
        txt('t3', 80, 320, 920, 50, '📋 INGRÉDIENTS (2 pers.)', { fontSize: 28, bold: true, color: '#ea580c', z: 1 }),
        txt('t4', 80, 390, 920, 200, '• 200g de spaghetti\n• 100g de lardons\n• 2 œufs + 1 jaune\n• 50g de parmesan\n• Poivre noir', { fontSize: 26, color: '#374151', z: 1 }),
        txt('t5', 80, 620, 920, 50, '👨‍🍳 ÉTAPES', { fontSize: 28, bold: true, color: '#ea580c', z: 1 }),
        txt('t6', 80, 690, 920, 300, '1. Cuire les pâtes al dente\n2. Dorer les lardons\n3. Mélanger œufs + parmesan\n4. Hors du feu, ajouter\nle mélange aux pâtes\n5. Poivrer généreusement', { fontSize: 24, color: '#374151', z: 1 }),
        txt('t7', 80, 1050, 920, 60, '⏱️ 20 min · 👨‍👩‍👧 2 personnes', { fontSize: 26, color: '#92400e', z: 1, align: 'center' }),
        txt('t8', 80, 1700, 920, 60, '💾 Sauvegardez cette recette !', { fontSize: 28, bold: true, color: '#ea580c', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ig-story-06', name: 'Story Motivation', description: 'Story citation motivationnelle',
    category: 'social', subcategory: 'Instagram Story', format: 'Story Instagram (1080×1920)',
    width: 1080, height: 1920, thumbnail: '💪', colors: ['#111827', '#f59e0b', '#ffffff'],
    tags: ['instagram', 'story', 'motivation', 'citation', 'sport'],
    canvas: {
      background: '#111827',
      elements: [
        circ('c1', -200, 600, 800, 800, '#f59e0b', { opacity: 0.08, z: 0 }),
        txt('t1', 80, 300, 920, 100, '💪', { fontSize: 100, z: 1, align: 'center' }),
        txt('t2', 80, 500, 920, 50, '"', { fontSize: 100, color: '#f59e0b', z: 1, align: 'center' }),
        txt('t3', 80, 600, 920, 400, 'La douleur d\'aujourd\'hui est la force de demain.', { fontSize: 56, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t4', 80, 1080, 920, 60, '— Inconnu', { fontSize: 30, italic: true, color: '#f59e0b', z: 1, align: 'center' }),
        rect('r1', 380, 1200, 320, 6, '#f59e0b', { z: 1 }),
        txt('t5', 80, 1700, 920, 60, '#Motivation #Fitness #Mindset', { fontSize: 26, color: '#4b5563', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ig-story-07', name: 'Story Nouveau Contenu', description: 'Annonce YouTube/Blog',
    category: 'social', subcategory: 'Instagram Story', format: 'Story Instagram (1080×1920)',
    width: 1080, height: 1920, thumbnail: '▶️', colors: ['#dc2626', '#ffffff', '#1e293b'],
    tags: ['instagram', 'story', 'youtube', 'video', 'annonce'],
    canvas: {
      background: '#1e293b',
      elements: [
        rect('r1', 0, 0, 1080, 1920, '#1e293b'),
        circ('c1', 400, 800, 600, 600, '#dc2626', { opacity: 0.15, z: 0 }),
        txt('t1', 80, 200, 920, 80, '🎬 NOUVELLE VIDÉO', { fontSize: 38, bold: true, color: '#dc2626', z: 1, align: 'center' }),
        circ('c2', 390, 500, 300, 300, '#dc2626', { z: 1 }),
        txt('t2', 390, 570, 300, 160, '▶', { fontSize: 130, color: '#ffffff', z: 2, align: 'center' }),
        txt('t3', 80, 900, 920, 200, 'Mon secret pour 100K vues en 30 jours', { fontSize: 48, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t4', 80, 1150, 920, 60, '⏱️ 15 minutes de conseils pratiques', { fontSize: 28, color: '#94a3b8', z: 1, align: 'center' }),
        rect('r2', 240, 1300, 600, 90, '#dc2626', { radius: 45, z: 1 }),
        txt('t5', 240, 1318, 600, 54, '▶️ Regarder maintenant', { fontSize: 26, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t6', 80, 1700, 920, 60, 'Lien dans la bio 👆', { fontSize: 28, color: '#64748b', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ig-story-08', name: 'Story Sondage', description: 'Story avec sondage',
    category: 'social', subcategory: 'Instagram Story', format: 'Story Instagram (1080×1920)',
    width: 1080, height: 1920, thumbnail: '📊', colors: ['#3b82f6', '#ffffff', '#1e293b'],
    tags: ['instagram', 'story', 'sondage', 'engagement'],
    canvas: {
      background: '#eff6ff',
      elements: [
        rect('r1', 0, 0, 1080, 400, '#3b82f6', { z: 0 }),
        txt('t1', 80, 80, 920, 80, '📊 SONDAGE', { fontSize: 50, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t2', 80, 190, 920, 160, 'Quelle est votre plus grande difficulté ?', { fontSize: 40, bold: true, color: '#eff6ff', z: 1, align: 'center' }),
        rect('r2', 80, 500, 920, 120, '#ffffff', { radius: 20, z: 1 }),
        txt('t3', 80, 535, 920, 50, '😓 Manque de temps', { fontSize: 30, bold: true, color: '#1e293b', z: 2, align: 'center' }),
        rect('r3', 80, 660, 920, 120, '#bfdbfe', { radius: 20, z: 1 }),
        txt('t4', 80, 695, 920, 50, '💸 Manque de budget', { fontSize: 30, bold: true, color: '#1e40af', z: 2, align: 'center' }),
        rect('r4', 80, 820, 920, 120, '#ffffff', { radius: 20, z: 1 }),
        txt('t5', 80, 855, 920, 50, '🎯 Manque de stratégie', { fontSize: 30, bold: true, color: '#1e293b', z: 2, align: 'center' }),
        rect('r5', 80, 980, 920, 120, '#bfdbfe', { radius: 20, z: 1 }),
        txt('t6', 80, 1015, 920, 50, '👥 Manque d\'équipe', { fontSize: 30, bold: true, color: '#1e40af', z: 2, align: 'center' }),
        txt('t7', 80, 1200, 920, 80, '💬 Votez ci-dessous !', { fontSize: 36, bold: true, color: '#1d4ed8', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ig-story-09', name: 'Story Lifestyle', description: 'Story lifestyle personnel',
    category: 'social', subcategory: 'Instagram Story', format: 'Story Instagram (1080×1920)',
    width: 1080, height: 1920, thumbnail: '☀️', colors: ['#fde68a', '#f97316', '#1e293b'],
    tags: ['instagram', 'story', 'lifestyle', 'matin', 'routine'],
    canvas: {
      background: '#fef9c3',
      elements: [
        circ('c1', 200, -100, 600, 600, '#fde68a', { z: 0 }),
        txt('t1', 80, 100, 920, 100, '☀️ Good Morning!', { fontSize: 58, bold: true, color: '#f97316', z: 1, align: 'center' }),
        txt('t2', 80, 250, 920, 60, 'Ma routine matinale parfaite', { fontSize: 34, bold: true, color: '#1e293b', z: 1, align: 'center' }),
        txt('t3', 80, 380, 920, 50, '05:30 ☕ Café & journaling', { fontSize: 28, color: '#374151', z: 1 }),
        txt('t4', 80, 450, 920, 50, '06:00 🏃 30 min de course', { fontSize: 28, color: '#374151', z: 1 }),
        txt('t5', 80, 520, 920, 50, '07:00 🍳 Petit-déjeuner sain', { fontSize: 28, color: '#374151', z: 1 }),
        txt('t6', 80, 590, 920, 50, '07:30 📚 15 min de lecture', { fontSize: 28, color: '#374151', z: 1 }),
        txt('t7', 80, 660, 920, 50, '08:00 💼 Début de journée', { fontSize: 28, color: '#374151', z: 1 }),
        txt('t8', 80, 800, 920, 100, 'Cette routine a changé\nma productivité ×3 🔥', { fontSize: 34, bold: true, color: '#f97316', z: 1, align: 'center' }),
        txt('t9', 80, 1680, 920, 60, '#Routine #Productivité #Lifestyle', { fontSize: 26, color: '#92400e', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ig-story-10', name: 'Story Mode', description: 'Story mode & fashion',
    category: 'social', subcategory: 'Instagram Story', format: 'Story Instagram (1080×1920)',
    width: 1080, height: 1920, thumbnail: '👗', colors: ['#18181b', '#fbbf24', '#ffffff'],
    tags: ['instagram', 'story', 'mode', 'fashion', 'style'],
    canvas: {
      background: '#18181b',
      elements: [
        rect('r1', 0, 0, 1080, 1920, '#18181b'),
        txt('t1', 80, 200, 920, 80, 'NEW COLLECTION', { fontSize: 48, bold: true, color: '#fbbf24', z: 1, align: 'center' }),
        txt('t2', 80, 300, 920, 60, 'SS 2025', { fontSize: 36, color: '#e5e7eb', z: 1, align: 'center' }),
        rect('r2', 140, 420, 800, 800, '#27272a', { radius: 20, z: 1 }),
        txt('t3', 140, 620, 800, 400, '👗', { fontSize: 280, z: 2, align: 'center' }),
        txt('t4', 80, 1280, 920, 80, 'Élégance & Modernité', { fontSize: 36, italic: true, color: '#fbbf24', z: 1, align: 'center' }),
        txt('t5', 80, 1380, 920, 60, 'À partir de 89€', { fontSize: 30, color: '#9ca3af', z: 1, align: 'center' }),
        rect('r3', 240, 1500, 600, 90, '#fbbf24', { radius: 45, z: 1 }),
        txt('t6', 240, 1518, 600, 54, 'DÉCOUVRIR', { fontSize: 26, bold: true, color: '#18181b', z: 2, align: 'center' }),
        txt('t7', 80, 1700, 920, 60, 'Lien dans la bio 👆', { fontSize: 26, color: '#6b7280', z: 1, align: 'center' }),
      ]
    }
  },
];

// --- Instagram Posts Carré (15) ---
const instaPosts: VisualTemplate[] = [
  {
    id: 'ig-post-01', name: 'Post Citaton Square', description: 'Citation carrée Instagram',
    category: 'social', subcategory: 'Instagram Post', format: 'Post Instagram (1080×1080)',
    width: 1080, height: 1080, thumbnail: '💬', colors: ['#1e293b', '#f59e0b', '#ffffff'],
    tags: ['instagram', 'post', 'citation', 'carré'],
    canvas: {
      background: '#1e293b',
      elements: [
        rect('r1', 0, 0, 1080, 1080, '#1e293b'),
        circ('c1', -100, -100, 500, 500, '#f59e0b', { opacity: 0.1, z: 0 }),
        circ('c2', 700, 700, 500, 500, '#f59e0b', { opacity: 0.08, z: 0 }),
        txt('t1', 80, 200, 920, 80, '"', { fontSize: 120, bold: true, color: '#f59e0b', z: 1, align: 'center' }),
        txt('t2', 80, 300, 920, 400, 'Votre citation inspirante ici. Courte, percutante, mémorable.', { fontSize: 48, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        rect('r2', 400, 760, 280, 4, '#f59e0b', { z: 1 }),
        txt('t3', 80, 790, 920, 50, '— Auteur', { fontSize: 28, italic: true, color: '#f59e0b', z: 1, align: 'center' }),
        txt('t4', 80, 960, 920, 50, '#Citation #Motivation #Inspiration', { fontSize: 22, color: '#475569', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ig-post-02', name: 'Post Produit', description: 'Présentation produit e-commerce',
    category: 'social', subcategory: 'Instagram Post', format: 'Post Instagram (1080×1080)',
    width: 1080, height: 1080, thumbnail: '🛍️', colors: ['#f8fafc', '#1e293b', '#2563eb'],
    tags: ['instagram', 'post', 'produit', 'ecommerce'],
    canvas: {
      background: '#f1f5f9',
      elements: [
        rect('r1', 0, 800, 1080, 280, '#1e293b', { z: 0 }),
        txt('t1', 80, 100, 920, 80, '🛍️ NEW ARRIVAL', { fontSize: 36, bold: true, color: '#2563eb', z: 1, align: 'center' }),
        txt('t2', 300, 200, 480, 480, '📦', { fontSize: 300, z: 1, align: 'center' }),
        txt('t3', 80, 820, 920, 70, 'Nom du Produit', { fontSize: 44, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t4', 80, 900, 920, 50, '89,99 €', { fontSize: 36, bold: true, color: '#60a5fa', z: 1, align: 'center' }),
        txt('t5', 80, 960, 920, 50, '🔗 Lien dans la bio', { fontSize: 24, color: '#94a3b8', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ig-post-03', name: 'Post Voyage', description: 'Destination voyage travel',
    category: 'social', subcategory: 'Instagram Post', format: 'Post Instagram (1080×1080)',
    width: 1080, height: 1080, thumbnail: '✈️', colors: ['#0ea5e9', '#ffffff', '#1e293b'],
    tags: ['instagram', 'post', 'voyage', 'travel', 'destination'],
    canvas: {
      background: '#0ea5e9',
      elements: [
        rect('r1', 0, 0, 1080, 1080, '#0ea5e9'),
        circ('c1', 200, 300, 800, 800, '#38bdf8', { opacity: 0.3, z: 0 }),
        txt('t1', 80, 100, 920, 200, '✈️', { fontSize: 160, z: 1, align: 'center' }),
        txt('t2', 80, 330, 920, 150, 'BALI\nINDONESIA', { fontSize: 96, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t3', 80, 560, 920, 60, '🌴 Paradis tropical · 365 jours de soleil', { fontSize: 30, color: '#e0f2fe', z: 1, align: 'center' }),
        txt('t4', 80, 650, 920, 80, 'Voyage de 7 jours · À partir de 899€', { fontSize: 28, bold: true, color: '#fde68a', z: 1, align: 'center' }),
        rect('r2', 240, 770, 600, 80, '#ffffff', { radius: 40, z: 1 }),
        txt('t5', 240, 793, 600, 34, 'Réserver maintenant →', { fontSize: 26, bold: true, color: '#0284c7', z: 2, align: 'center' }),
        txt('t6', 80, 960, 920, 50, '#Bali #Travel #Paradise #Vacation', { fontSize: 22, color: '#bae6fd', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ig-post-04', name: 'Post Fitness', description: 'Post sport et fitness',
    category: 'social', subcategory: 'Instagram Post', format: 'Post Instagram (1080×1080)',
    width: 1080, height: 1080, thumbnail: '💪', colors: ['#1e293b', '#ef4444', '#ffffff'],
    tags: ['instagram', 'post', 'fitness', 'sport', 'musculation'],
    canvas: {
      background: '#111827',
      elements: [
        rect('r1', 0, 0, 1080, 1080, '#111827'),
        circ('c1', 400, 300, 600, 600, '#ef4444', { opacity: 0.08, z: 0 }),
        txt('t1', 80, 100, 920, 120, '💪', { fontSize: 100, z: 1, align: 'center' }),
        txt('t2', 80, 260, 920, 100, 'NO PAIN', { fontSize: 80, bold: true, color: '#ef4444', z: 1, align: 'center' }),
        txt('t3', 80, 360, 920, 100, 'NO GAIN', { fontSize: 80, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        rect('r2', 80, 500, 920, 6, '#ef4444', { z: 1 }),
        txt('t4', 80, 540, 920, 80, '4 entraînements · 8 semaines\nRésultat garanti ou remboursé', { fontSize: 28, color: '#9ca3af', z: 1, align: 'center' }),
        rect('r3', 240, 720, 600, 80, '#ef4444', { radius: 8, z: 1 }),
        txt('t5', 240, 742, 600, 36, '🔥 Démarrer le programme', { fontSize: 26, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t6', 80, 960, 920, 50, '#Fitness #Sport #Muscle #Training', { fontSize: 22, color: '#374151', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ig-post-05', name: 'Post Minimaliste', description: 'Design épuré minimaliste',
    category: 'social', subcategory: 'Instagram Post', format: 'Post Instagram (1080×1080)',
    width: 1080, height: 1080, thumbnail: '⚪', colors: ['#ffffff', '#1e293b', '#94a3b8'],
    tags: ['instagram', 'post', 'minimaliste', 'clean', 'simple'],
    canvas: {
      background: '#ffffff',
      elements: [
        rect('r1', 0, 0, 1080, 4, '#1e293b', { z: 1 }),
        rect('r2', 0, 1076, 1080, 4, '#1e293b', { z: 1 }),
        txt('t1', 80, 280, 920, 80, 'LESS IS MORE', { fontSize: 72, bold: true, color: '#1e293b', z: 1, align: 'center' }),
        rect('r3', 440, 420, 200, 4, '#94a3b8', { z: 1 }),
        txt('t2', 80, 460, 920, 120, 'La simplicité est\nla sophistication ultime.', { fontSize: 34, italic: true, color: '#475569', z: 1, align: 'center' }),
        txt('t3', 80, 620, 920, 50, '— Leonardo da Vinci', { fontSize: 24, color: '#94a3b8', z: 1, align: 'center' }),
        txt('t4', 80, 980, 920, 50, '@votre_compte', { fontSize: 24, color: '#cbd5e1', z: 1, align: 'center' }),
      ]
    }
  },
];

// --- Twitter/X Posts (10) ---
const twitterPosts: VisualTemplate[] = [
  {
    id: 'tw-post-01', name: 'Thread X Cover', description: 'Visuel thread Twitter/X',
    category: 'social', subcategory: 'Twitter/X', format: 'Post Twitter (1600×900)',
    width: 1600, height: 900, thumbnail: '🐦', colors: ['#1e293b', '#1d9bf0', '#ffffff'],
    tags: ['twitter', 'x', 'thread', 'cover'],
    canvas: {
      background: '#000000',
      elements: [
        rect('r1', 0, 0, 1600, 900, '#000000'),
        txt('t1', 80, 80, 400, 60, 'THREAD 🧵', { fontSize: 32, bold: true, color: '#1d9bf0', z: 1 }),
        txt('t2', 80, 180, 1440, 300, 'Le guide complet pour maîtriser [sujet] en 10 points', { fontSize: 64, bold: true, color: '#ffffff', z: 1 }),
        txt('t3', 80, 520, 1440, 80, '👇 Un fil à sauvegarder', { fontSize: 36, color: '#71717a', z: 1 }),
        txt('t4', 80, 640, 600, 60, '@votre_compte', { fontSize: 28, color: '#1d9bf0', z: 1 }),
        txt('t5', 80, 720, 600, 50, '15K abonnés · Partager = ❤️', { fontSize: 24, color: '#52525b', z: 1 }),
        txt('t6', 1000, 640, 520, 120, '1/', { fontSize: 120, bold: true, color: '#27272a', z: 0, align: 'right' }),
      ]
    }
  },
  {
    id: 'tw-post-02', name: 'Stats Tweet', description: 'Tweet chiffres et statistiques',
    category: 'social', subcategory: 'Twitter/X', format: 'Post Twitter (1600×900)',
    width: 1600, height: 900, thumbnail: '📊', colors: ['#1d9bf0', '#000000', '#ffffff'],
    tags: ['twitter', 'x', 'stats', 'chiffres'],
    canvas: {
      background: '#0f1117',
      elements: [
        circ('c1', 1200, 400, 400, 400, '#1d9bf0', { opacity: 0.06, z: 0 }),
        txt('t1', 80, 60, 800, 60, '📊 LE CHIFFRE DU JOUR', { fontSize: 28, bold: true, color: '#1d9bf0', z: 1 }),
        txt('t2', 80, 160, 1400, 200, '4.2 milliards', { fontSize: 120, bold: true, color: '#ffffff', z: 1 }),
        txt('t3', 80, 380, 900, 80, 'd\'utilisateurs actifs sur les réseaux sociaux en 2025', { fontSize: 36, color: '#a1a1aa', z: 1 }),
        txt('t4', 80, 500, 700, 60, 'Soit 52% de la population mondiale.', { fontSize: 30, italic: true, color: '#1d9bf0', z: 1 }),
        txt('t5', 80, 780, 600, 50, '@votre_compte · Source : We Are Social', { fontSize: 22, color: '#52525b', z: 1 }),
      ]
    }
  },
  {
    id: 'tw-post-03', name: 'Meme Format', description: 'Template mème humoristique',
    category: 'social', subcategory: 'Twitter/X', format: 'Post Twitter (1600×900)',
    width: 1600, height: 900, thumbnail: '😂', colors: ['#ffffff', '#1e293b', '#000000'],
    tags: ['twitter', 'x', 'meme', 'humour'],
    canvas: {
      background: '#f8fafc',
      elements: [
        txt('t1', 80, 80, 1440, 100, 'MOI AVANT DE DÉCOUVRIR [TRUC]', { fontSize: 52, bold: true, color: '#1e293b', z: 1, align: 'center' }),
        txt('t2', 80, 300, 680, 400, '😫', { fontSize: 300, z: 1, align: 'center' }),
        txt('t3', 840, 300, 680, 400, '😎', { fontSize: 300, z: 1, align: 'center' }),
        rect('r1', 800, 80, 4, 740, '#e2e8f0', { z: 1 }),
        txt('t4', 80, 730, 680, 60, 'Avant', { fontSize: 36, bold: true, color: '#64748b', z: 1, align: 'center' }),
        txt('t5', 840, 730, 680, 60, 'Après', { fontSize: 36, bold: true, color: '#0ea5e9', z: 1, align: 'center' }),
      ]
    }
  },
];

// --- TikTok Covers (10) ---
const tiktokCovers: VisualTemplate[] = [
  {
    id: 'tt-cover-01', name: 'TikTok Cover Tendance', description: 'Vignette TikTok tendance',
    category: 'social', subcategory: 'TikTok', format: 'TikTok Cover (1080×1920)',
    width: 1080, height: 1920, thumbnail: '🎵', colors: ['#010101', '#ff0050', '#00f2ea'],
    tags: ['tiktok', 'cover', 'viral', 'tendance'],
    canvas: {
      background: '#010101',
      elements: [
        rect('r1', 0, 0, 1080, 1920, '#010101'),
        circ('c1', -100, 800, 600, 600, '#ff0050', { opacity: 0.2, z: 0 }),
        circ('c2', 600, 1000, 500, 500, '#00f2ea', { opacity: 0.15, z: 0 }),
        txt('t1', 80, 300, 920, 80, '🎵 VIRAL TREND', { fontSize: 38, bold: true, color: '#ff0050', z: 1, align: 'center' }),
        txt('t2', 80, 450, 920, 400, 'POV:\nTu découvres\ncette astuce', { fontSize: 80, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t3', 80, 950, 920, 80, '👇 Regarde jusqu\'au bout', { fontSize: 34, color: '#00f2ea', z: 1, align: 'center' }),
        txt('t4', 80, 1750, 920, 60, '#TikTok #Viral #Trend #Astuce', { fontSize: 26, color: '#71717a', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'tt-cover-02', name: 'TikTok Recette', description: 'Recette viral TikTok',
    category: 'social', subcategory: 'TikTok', format: 'TikTok Cover (1080×1920)',
    width: 1080, height: 1920, thumbnail: '🍕', colors: ['#f97316', '#fef3c7', '#1e293b'],
    tags: ['tiktok', 'recette', 'food', 'cuisine', 'viral'],
    canvas: {
      background: '#1e293b',
      elements: [
        rect('r1', 0, 1400, 1080, 520, '#000000', { opacity: 0.6, z: 0 }),
        txt('t1', 80, 200, 920, 100, '🍕', { fontSize: 120, z: 1, align: 'center' }),
        txt('t2', 80, 380, 920, 200, 'RECETTE\nFOUDROYANTE', { fontSize: 88, bold: true, color: '#f97316', z: 1, align: 'center' }),
        txt('t3', 80, 700, 920, 80, 'Pizza carbonara maison\nen 20 minutes!', { fontSize: 36, color: '#fef3c7', z: 1, align: 'center' }),
        txt('t4', 80, 1500, 920, 80, '⏱️ 20 min · 🍽️ 4 pers', { fontSize: 36, bold: true, color: '#f97316', z: 1, align: 'center' }),
        txt('t5', 80, 1620, 920, 60, '#Recette #TikTokFood #Pizza', { fontSize: 26, color: '#94a3b8', z: 1, align: 'center' }),
        txt('t6', 80, 1720, 920, 60, '💬 Save & Share ❤️', { fontSize: 28, bold: true, color: '#fbbf24', z: 1, align: 'center' }),
      ]
    }
  },
];

// --- Facebook Posts (10) ---
const facebookPosts: VisualTemplate[] = [
  {
    id: 'fb-post-01', name: 'Post Facebook Événement', description: 'Annonce événement Facebook',
    category: 'social', subcategory: 'Facebook', format: 'Post Facebook (1200×630)',
    width: 1200, height: 630, thumbnail: '📣', colors: ['#1877f2', '#ffffff', '#1e293b'],
    tags: ['facebook', 'événement', 'annonce', 'bleu'],
    canvas: {
      background: '#1877f2',
      elements: [
        rect('r1', 0, 0, 1200, 630, '#1877f2'),
        circ('c1', -50, -50, 300, 300, '#1565c0', { z: 0 }),
        circ('c2', 1000, 400, 300, 300, '#1565c0', { z: 0 }),
        txt('t1', 80, 60, 1040, 60, '📣 ÉVÉNEMENT', { fontSize: 26, bold: true, color: '#93c5fd', z: 1 }),
        txt('t2', 80, 150, 1040, 200, 'Grand Salon\nProfessionnel 2025', { fontSize: 64, bold: true, color: '#ffffff', z: 1 }),
        txt('t3', 80, 380, 1040, 50, '📅 15-17 Mars 2025  ·  📍 Paris Expo Porte de Versailles', { fontSize: 26, color: '#bfdbfe', z: 1 }),
        txt('t4', 80, 450, 1040, 50, '🎟️ Plus de 200 exposants · Entrée gratuite', { fontSize: 24, color: '#dbeafe', z: 1 }),
        rect('r2', 80, 530, 300, 65, '#ffffff', { radius: 8, z: 1 }),
        txt('t5', 80, 550, 300, 26, "S'inscrire →", { fontSize: 22, bold: true, color: '#1877f2', z: 2, align: 'center' }),
      ]
    }
  },
  {
    id: 'fb-post-02', name: 'Post Facebook Communauté', description: 'Post engagement communauté',
    category: 'social', subcategory: 'Facebook', format: 'Post Facebook (1200×630)',
    width: 1200, height: 630, thumbnail: '👥', colors: ['#ffffff', '#1877f2', '#1e293b'],
    tags: ['facebook', 'communauté', 'engagement', 'question'],
    canvas: {
      background: '#f0f2f5',
      elements: [
        rect('r1', 0, 0, 1200, 10, '#1877f2', { z: 1 }),
        txt('t1', 80, 60, 1040, 100, '💬 LA QUESTION DU JOUR', { fontSize: 28, bold: true, color: '#1877f2', z: 1, align: 'center' }),
        txt('t2', 80, 190, 1040, 200, 'Quel est votre plus grand défi\nprofessionnel en 2025 ?', { fontSize: 48, bold: true, color: '#1c1e21', z: 1, align: 'center' }),
        txt('t3', 80, 420, 1040, 80, 'Répondez en commentaire 👇\nNous partageons les meilleures réponses!', { fontSize: 26, color: '#65676b', z: 1, align: 'center' }),
        txt('t4', 80, 560, 1040, 50, '👍 Like · 💬 Commentez · 🔄 Partagez', { fontSize: 22, color: '#1877f2', z: 1, align: 'center' }),
      ]
    }
  },
];

// --- Bannières diverses (15) ---
const bannieres: VisualTemplate[] = [
  {
    id: 'ban-yt-01', name: 'Bannière YouTube', description: 'Couverture chaîne YouTube',
    category: 'social', subcategory: 'Bannières', format: 'Bannière YouTube (2560×1440)',
    width: 2560, height: 1440, thumbnail: '▶️', colors: ['#dc2626', '#1c1c1c', '#ffffff'],
    tags: ['youtube', 'bannière', 'chaîne', 'cover'],
    canvas: {
      background: '#111111',
      elements: [
        circ('c1', -200, 500, 1000, 1000, '#dc2626', { opacity: 0.15, z: 0 }),
        circ('c2', 1800, 200, 800, 800, '#dc2626', { opacity: 0.08, z: 0 }),
        txt('t1', 300, 400, 1960, 200, 'VOTRE CHAÎNE', { fontSize: 140, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t2', 300, 620, 1960, 100, 'Tutoriels · Conseils · Expertise', { fontSize: 60, color: '#dc2626', z: 1, align: 'center' }),
        txt('t3', 300, 760, 1960, 80, 'Nouvelle vidéo chaque LUNDI', { fontSize: 48, color: '#6b7280', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ban-li-01', name: 'Bannière LinkedIn Profil', description: 'Couverture profil LinkedIn',
    category: 'social', subcategory: 'Bannières', format: 'Bannière LinkedIn (1584×396)',
    width: 1584, height: 396, thumbnail: '💼', colors: ['#0077b5', '#ffffff', '#1e293b'],
    tags: ['linkedin', 'bannière', 'profil', 'cover'],
    canvas: {
      background: '#0077b5',
      elements: [
        rect('r1', 0, 0, 1584, 396, '#0077b5'),
        circ('c1', -50, -50, 300, 300, '#005f94', { z: 0 }),
        circ('c2', 1400, 200, 300, 300, '#005f94', { z: 0 }),
        txt('t1', 80, 60, 1000, 80, 'Prénom NOM', { fontSize: 52, bold: true, color: '#ffffff', z: 1 }),
        txt('t2', 80, 160, 1000, 60, 'Expert en [Domaine] · [Entreprise]', { fontSize: 32, color: '#bae6fd', z: 1 }),
        txt('t3', 80, 250, 1000, 50, '📧 contact@exemple.com · 🌐 www.exemple.com', { fontSize: 24, color: '#93c5fd', z: 1 }),
        txt('t4', 1200, 150, 320, 100, '10 ans\nd\'expérience', { fontSize: 36, bold: true, color: '#ffffff', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ban-li-org-01', name: 'Bannière LinkedIn Entreprise', description: 'Couverture page entreprise',
    category: 'social', subcategory: 'Bannières', format: 'Bannière LinkedIn (1128×191)',
    width: 1128, height: 191, thumbnail: '🏢', colors: ['#1e293b', '#2563eb', '#ffffff'],
    tags: ['linkedin', 'bannière', 'entreprise', 'page'],
    canvas: {
      background: '#1e293b',
      elements: [
        circ('c1', -50, -50, 200, 200, '#2563eb', { opacity: 0.3, z: 0 }),
        txt('t1', 60, 30, 600, 60, 'NOM ENTREPRISE', { fontSize: 38, bold: true, color: '#ffffff', z: 1 }),
        txt('t2', 60, 100, 600, 50, 'Innovation · Excellence · Impact', { fontSize: 24, color: '#60a5fa', z: 1 }),
        txt('t3', 800, 50, 280, 80, 'Depuis 2015', { fontSize: 30, bold: true, color: '#2563eb', z: 1, align: 'center' }),
        txt('t4', 800, 110, 280, 50, '500+ clients', { fontSize: 22, color: '#94a3b8', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ban-fb-01', name: 'Couverture Facebook', description: 'Photo de couverture Facebook',
    category: 'social', subcategory: 'Bannières', format: 'Couverture Facebook (851×315)',
    width: 851, height: 315, thumbnail: '📘', colors: ['#1877f2', '#ffffff', '#1e293b'],
    tags: ['facebook', 'couverture', 'bannière', 'profil'],
    canvas: {
      background: '#1877f2',
      elements: [
        rect('r1', 0, 0, 851, 315, '#1877f2'),
        txt('t1', 40, 60, 771, 80, '[Votre Page Facebook]', { fontSize: 48, bold: true, color: '#ffffff', z: 1 }),
        txt('t2', 40, 160, 771, 50, 'Description courte de votre page · Rejoignez notre communauté', { fontSize: 24, color: '#bfdbfe', z: 1 }),
        txt('t3', 40, 235, 400, 50, '🌐 www.votresite.com', { fontSize: 22, color: '#93c5fd', z: 1 }),
      ]
    }
  },
];

// ──────────────────────────────────────────
// 2. DOCUMENTS PROFESSIONNELS (80 templates)
// ──────────────────────────────────────────
const documentsPro: VisualTemplate[] = [
  {
    id: 'doc-cv-visual-01', name: 'CV Visuel Pro', description: 'CV avec design visuel et sidebar',
    category: 'document', subcategory: 'CV & Candidature', format: 'A4 Portrait (794×1123)',
    width: 794, height: 1123, thumbnail: '👤', colors: ['#1e3a5f', '#3b82f6', '#ffffff'],
    tags: ['cv', 'candidature', 'professionnel', 'sidebar'],
    canvas: {
      background: '#f8fafc',
      elements: [
        rect('r1', 0, 0, 280, 1123, '#1e3a5f', { z: 0 }),
        circ('c1', 50, 60, 180, 180, '#3b82f6', { opacity: 0.3, z: 1 }),
        txt('t1', 55, 80, 170, 140, '👤', { fontSize: 100, z: 2, align: 'center' }),
        txt('t2', 20, 260, 240, 60, 'Jean Dupont', { fontSize: 22, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t3', 20, 320, 240, 40, 'Développeur Web', { fontSize: 14, color: '#93c5fd', z: 2, align: 'center' }),
        txt('t4', 20, 400, 240, 30, '📍 Paris', { fontSize: 12, color: '#bfdbfe', z: 2 }),
        txt('t5', 20, 430, 240, 30, '📧 jean@email.com', { fontSize: 12, color: '#bfdbfe', z: 2 }),
        txt('t6', 20, 460, 240, 30, '📱 06 12 34 56 78', { fontSize: 12, color: '#bfdbfe', z: 2 }),
        txt('t7', 20, 530, 240, 30, 'COMPÉTENCES', { fontSize: 13, bold: true, color: '#f59e0b', z: 2 }),
        txt('t8', 20, 570, 240, 120, 'JavaScript ●●●●○\nReact ●●●●●\nNode.js ●●●○○\nSQL ●●●●○', { fontSize: 12, color: '#e2e8f0', z: 2 }),
        txt('t9', 20, 720, 240, 30, 'LANGUES', { fontSize: 13, bold: true, color: '#f59e0b', z: 2 }),
        txt('t10', 20, 760, 240, 60, 'Français : Natif\nAnglais : Courant', { fontSize: 12, color: '#e2e8f0', z: 2 }),
        txt('t11', 310, 40, 460, 40, 'EXPÉRIENCE', { fontSize: 16, bold: true, color: '#1e3a5f', z: 1 }),
        rect('r2', 310, 82, 460, 3, '#3b82f6', { z: 1 }),
        txt('t12', 310, 100, 460, 25, 'Lead Developer · Startup ABC · 2022-2025', { fontSize: 13, bold: true, color: '#1e293b', z: 1 }),
        txt('t13', 310, 128, 460, 60, '• Développement application SaaS (React/Node)\n• Management équipe de 5 développeurs', { fontSize: 12, color: '#475569', z: 1 }),
        txt('t14', 310, 210, 460, 25, 'Dev Front · Agence XYZ · 2020-2022', { fontSize: 13, bold: true, color: '#1e293b', z: 1 }),
        txt('t15', 310, 238, 460, 60, '• Création de sites web responsive\n• Intégration maquettes Figma', { fontSize: 12, color: '#475569', z: 1 }),
        txt('t16', 310, 330, 460, 40, 'FORMATION', { fontSize: 16, bold: true, color: '#1e3a5f', z: 1 }),
        rect('r3', 310, 372, 460, 3, '#3b82f6', { z: 1 }),
        txt('t17', 310, 390, 460, 25, 'Master Informatique · Université Paris · 2018-2020', { fontSize: 13, color: '#1e293b', z: 1 }),
        txt('t18', 310, 420, 460, 25, 'Licence Mathématiques · Université Lyon · 2015-2018', { fontSize: 13, color: '#1e293b', z: 1 }),
        txt('t19', 310, 490, 460, 40, 'PROJETS', { fontSize: 16, bold: true, color: '#1e3a5f', z: 1 }),
        rect('r4', 310, 532, 460, 3, '#3b82f6', { z: 1 }),
        txt('t20', 310, 550, 460, 25, 'App Gestion Budget — React Native, Expo', { fontSize: 13, color: '#1e293b', z: 1 }),
        txt('t21', 310, 580, 460, 25, 'API REST Express · PostgreSQL · 500+ utilisateurs', { fontSize: 12, color: '#475569', z: 1 }),
      ]
    }
  },
  {
    id: 'doc-presentation-01', name: 'Présentation Pitch', description: 'Diapositive pitch deck pro',
    category: 'document', subcategory: 'Présentations', format: 'Présentation 16:9 (1920×1080)',
    width: 1920, height: 1080, thumbnail: '🎯', colors: ['#1e293b', '#2563eb', '#ffffff'],
    tags: ['presentation', 'pitch', 'deck', 'business'],
    canvas: {
      background: '#1e293b',
      elements: [
        circ('c1', -100, 400, 600, 600, '#2563eb', { opacity: 0.1, z: 0 }),
        circ('c2', 1600, -100, 600, 600, '#2563eb', { opacity: 0.08, z: 0 }),
        txt('t1', 160, 300, 1600, 80, 'NOM DE L\'ENTREPRISE', { fontSize: 40, bold: true, color: '#60a5fa', z: 1, align: 'center' }),
        txt('t2', 160, 420, 1600, 200, 'Résoudre [problème]\npour [cible]', { fontSize: 96, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t3', 160, 700, 1600, 80, 'Pitch Deck · Série A · 2025', { fontSize: 36, color: '#64748b', z: 1, align: 'center' }),
        rect('r1', 760, 840, 400, 80, '#2563eb', { radius: 8, z: 1 }),
        txt('t4', 760, 862, 400, 36, 'contact@startup.com', { fontSize: 24, color: '#ffffff', z: 2, align: 'center' }),
      ]
    }
  },
  {
    id: 'doc-rapport-annuel-01', name: 'Rapport Annuel Cover', description: 'Couverture rapport annuel',
    category: 'document', subcategory: 'Rapports', format: 'A4 Portrait (794×1123)',
    width: 794, height: 1123, thumbnail: '📋', colors: ['#1e293b', '#10b981', '#ffffff'],
    tags: ['rapport', 'annuel', 'couverture', 'entreprise'],
    canvas: {
      background: '#0f2027',
      elements: [
        rect('r1', 0, 0, 794, 1123, '#0f2027'),
        rect('r2', 0, 0, 794, 50, '#10b981', { z: 0 }),
        circ('c1', -50, 400, 500, 500, '#10b981', { opacity: 0.08, z: 0 }),
        txt('t1', 60, 80, 674, 60, 'RAPPORT ANNUEL', { fontSize: 20, bold: true, color: '#10b981', z: 1 }),
        txt('t2', 60, 160, 674, 100, '2025', { fontSize: 96, bold: true, color: '#ffffff', z: 1 }),
        txt('t3', 60, 280, 674, 60, 'BILAN & PERSPECTIVES', { fontSize: 32, bold: true, color: '#f8fafc', z: 1 }),
        txt('t4', 60, 600, 674, 300, '📈 +45%\nde croissance', { fontSize: 48, bold: true, color: '#10b981', z: 1 }),
        txt('t5', 60, 950, 674, 60, 'Entreprise SA · Confidentiel', { fontSize: 18, color: '#64748b', z: 1 }),
      ]
    }
  },
  {
    id: 'doc-catalogue-01', name: 'Page Catalogue', description: 'Page produit catalogue',
    category: 'document', subcategory: 'Commercial', format: 'A4 Paysage (1123×794)',
    width: 1123, height: 794, thumbnail: '📖', colors: ['#f8fafc', '#1e293b', '#2563eb'],
    tags: ['catalogue', 'produit', 'commercial', 'fiche'],
    canvas: {
      background: '#f8fafc',
      elements: [
        rect('r1', 0, 0, 1123, 794, '#f8fafc'),
        rect('r2', 0, 0, 100, 794, '#1e293b', { z: 0 }),
        txt('t1', 110, 40, 893, 60, 'CATALOGUE PRODUITS 2025', { fontSize: 24, bold: true, color: '#1e293b', z: 1 }),
        rect('r3', 110, 110, 893, 2, '#2563eb', { z: 1 }),
        txt('t2', 110, 130, 400, 50, 'Produit Premium XL', { fontSize: 28, bold: true, color: '#1e293b', z: 1 }),
        txt('t3', 110, 190, 400, 30, 'Réf. : PRD-2025-001', { fontSize: 16, color: '#6b7280', z: 1 }),
        txt('t4', 110, 240, 400, 200, 'Description complète du produit.\nCaractéristiques techniques,\navantages et applications.', { fontSize: 18, color: '#374151', z: 1 }),
        txt('t5', 110, 470, 200, 50, '299,00 € HT', { fontSize: 28, bold: true, color: '#2563eb', z: 1 }),
        rect('r4', 540, 110, 450, 450, '#e2e8f0', { radius: 12, z: 1 }),
        txt('t6', 540, 210, 450, 250, '📦', { fontSize: 180, z: 2, align: 'center' }),
        txt('t7', 110, 700, 893, 40, 'www.entreprise.com · commercial@entreprise.com · 01 23 45 67 89', { fontSize: 16, color: '#94a3b8', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'doc-certif-01', name: 'Certificat', description: 'Certificat de réussite ou participation',
    category: 'document', subcategory: 'Certificats', format: 'A4 Paysage (1123×794)',
    width: 1123, height: 794, thumbnail: '🏆', colors: ['#fbbf24', '#1e293b', '#ffffff'],
    tags: ['certificat', 'diplôme', 'réussite', 'formation'],
    canvas: {
      background: '#fffbeb',
      elements: [
        rect('r1', 0, 0, 1123, 794, '#fffbeb'),
        rect('r2', 20, 20, 1083, 754, '#fbbf24', { radius: 8, z: 0 }),
        rect('r3', 30, 30, 1063, 734, '#fffbeb', { radius: 6, z: 0 }),
        rect('r4', 40, 40, 1043, 714, '#fbbf24', { opacity: 0.3, radius: 4, z: 0 }),
        rect('r5', 50, 50, 1023, 694, '#fffbeb', { radius: 4, z: 0 }),
        txt('t1', 80, 80, 963, 60, '🏆 CERTIFICAT DE RÉUSSITE', { fontSize: 28, bold: true, color: '#b45309', z: 1, align: 'center' }),
        txt('t2', 80, 180, 963, 80, 'Ce certificat est décerné à', { fontSize: 24, italic: true, color: '#78716c', z: 1, align: 'center' }),
        txt('t3', 80, 280, 963, 80, '[Prénom NOM]', { fontSize: 52, bold: true, color: '#1e293b', z: 1, align: 'center' }),
        txt('t4', 80, 380, 963, 60, 'pour avoir complété avec succès la formation', { fontSize: 24, italic: true, color: '#78716c', z: 1, align: 'center' }),
        txt('t5', 80, 460, 963, 60, '"[Nom de la formation]"', { fontSize: 30, bold: true, color: '#b45309', z: 1, align: 'center' }),
        rect('r6', 380, 560, 363, 3, '#fbbf24', { z: 1 }),
        txt('t6', 80, 590, 400, 50, 'Date : [Ville, Date]', { fontSize: 20, italic: true, color: '#78716c', z: 1 }),
        txt('t7', 643, 590, 400, 50, 'Signature :', { fontSize: 20, italic: true, color: '#78716c', z: 1 }),
      ]
    }
  },
  {
    id: 'doc-flyer-01', name: 'Flyer Événement', description: 'Flyer A5 événement',
    category: 'document', subcategory: 'Flyers & Affiches', format: 'A5 Portrait (559×794)',
    width: 559, height: 794, thumbnail: '📣', colors: ['#7c3aed', '#fbbf24', '#ffffff'],
    tags: ['flyer', 'événement', 'affiche', 'a5'],
    canvas: {
      background: '#7c3aed',
      elements: [
        rect('r1', 0, 0, 559, 794, '#7c3aed'),
        circ('c1', -50, 300, 300, 300, '#6d28d9', { z: 0 }),
        circ('c2', 350, 500, 300, 300, '#8b5cf6', { opacity: 0.5, z: 0 }),
        txt('t1', 40, 50, 479, 50, '🎉 SOIRÉE GALA', { fontSize: 28, bold: true, color: '#fbbf24', z: 1, align: 'center' }),
        txt('t2', 40, 140, 479, 200, 'Une Nuit\nInoubliable', { fontSize: 72, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t3', 40, 380, 479, 50, '📅 Samedi 22 Février 2025', { fontSize: 22, color: '#ddd6fe', z: 1, align: 'center' }),
        txt('t4', 40, 440, 479, 50, '🕐 20h00 · 📍 Grand Hôtel, Paris', { fontSize: 20, color: '#ddd6fe', z: 1, align: 'center' }),
        txt('t5', 40, 520, 479, 50, '🎵 DJ Set · 🥂 Open Bar · 🍽️ Dîner', { fontSize: 18, color: '#c4b5fd', z: 1, align: 'center' }),
        rect('r2', 120, 610, 319, 65, '#fbbf24', { radius: 32, z: 1 }),
        txt('t6', 120, 628, 319, 30, 'Réserver ma place →', { fontSize: 18, bold: true, color: '#1e293b', z: 2, align: 'center' }),
        txt('t7', 40, 720, 479, 50, 'Places limitées · Tenue de soirée exigée', { fontSize: 16, color: '#a78bfa', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'doc-affiche-cinema-01', name: 'Affiche Film', description: 'Affiche style cinéma',
    category: 'document', subcategory: 'Flyers & Affiches', format: 'A4 Portrait (794×1123)',
    width: 794, height: 1123, thumbnail: '🎬', colors: ['#1e293b', '#f59e0b', '#ffffff'],
    tags: ['affiche', 'film', 'cinéma', 'evenement'],
    canvas: {
      background: '#0f172a',
      elements: [
        rect('r1', 0, 0, 794, 1123, '#0f172a'),
        txt('t1', 60, 120, 674, 80, 'UNE PRODUCTION', { fontSize: 18, bold: true, color: '#475569', z: 1, align: 'center' }),
        txt('t2', 60, 220, 674, 300, '🎬', { fontSize: 220, z: 1, align: 'center' }),
        txt('t3', 60, 540, 674, 140, 'TITRE DU\nFILM', { fontSize: 88, bold: true, color: '#f59e0b', z: 1, align: 'center' }),
        txt('t4', 60, 720, 674, 60, 'Tagline percutante qui accroche', { fontSize: 28, italic: true, color: '#94a3b8', z: 1, align: 'center' }),
        rect('r2', 200, 840, 394, 2, '#f59e0b', { z: 1 }),
        txt('t5', 60, 870, 674, 50, 'Avec : Acteur A · Acteur B · Acteur C', { fontSize: 20, color: '#94a3b8', z: 1, align: 'center' }),
        txt('t6', 60, 1040, 674, 50, 'En salle le 15 Février 2025', { fontSize: 22, bold: true, color: '#f59e0b', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'doc-brochure-01', name: 'Brochure Entreprise', description: 'Dépliant 3 volets entreprise',
    category: 'document', subcategory: 'Brochures', format: 'A4 Paysage (1123×794)',
    width: 1123, height: 794, thumbnail: '📰', colors: ['#1e293b', '#2563eb', '#ffffff'],
    tags: ['brochure', 'entreprise', 'dépliant', 'commercial'],
    canvas: {
      background: '#f8fafc',
      elements: [
        rect('r1', 0, 0, 374, 794, '#1e293b', { z: 0 }),
        rect('r2', 374, 0, 2, 794, '#e2e8f0', { z: 0 }),
        rect('r3', 748, 0, 2, 794, '#e2e8f0', { z: 0 }),
        txt('t1', 40, 100, 294, 200, '🏢\nNOM\nENTREPRISE', { fontSize: 40, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t2', 40, 400, 294, 120, 'Excellence &\nInnovation', { fontSize: 28, italic: true, color: '#60a5fa', z: 1, align: 'center' }),
        txt('t3', 40, 660, 294, 80, 'www.entreprise.com', { fontSize: 18, color: '#94a3b8', z: 1, align: 'center' }),
        txt('t4', 400, 60, 320, 40, 'NOS SERVICES', { fontSize: 20, bold: true, color: '#2563eb', z: 1 }),
        txt('t5', 400, 120, 320, 400, '✅ Service Premium A\nDétail de l\'offre ici.\n\n✅ Service B\nDétail de l\'offre ici.\n\n✅ Service C\nDétail de l\'offre ici.', { fontSize: 16, color: '#374151', z: 1 }),
        txt('t6', 775, 60, 320, 40, 'NOUS CONTACTER', { fontSize: 20, bold: true, color: '#2563eb', z: 1 }),
        txt('t7', 775, 120, 320, 200, '📍 [Adresse]\n\n📞 01 23 45 67 89\n\n📧 contact@entreprise.com\n\n🌐 www.entreprise.com', { fontSize: 16, color: '#374151', z: 1 }),
      ]
    }
  },
  {
    id: 'doc-proposition-01', name: 'Proposition Commerciale', description: 'Couverture devis/propale',
    category: 'document', subcategory: 'Commercial', format: 'A4 Portrait (794×1123)',
    width: 794, height: 1123, thumbnail: '💼', colors: ['#2563eb', '#1e293b', '#ffffff'],
    tags: ['proposition', 'commercial', 'devis', 'propale'],
    canvas: {
      background: '#eff6ff',
      elements: [
        rect('r1', 0, 0, 794, 300, '#2563eb', { z: 0 }),
        circ('c1', 500, -50, 300, 300, '#1d4ed8', { opacity: 0.5, z: 0 }),
        txt('t1', 60, 50, 674, 60, 'PROPOSITION COMMERCIALE', { fontSize: 22, bold: true, color: '#bfdbfe', z: 1 }),
        txt('t2', 60, 140, 674, 100, 'Nom de votre\nEntreprise', { fontSize: 48, bold: true, color: '#ffffff', z: 1 }),
        txt('t3', 60, 380, 674, 60, 'Préparé pour :', { fontSize: 22, color: '#6b7280', z: 1 }),
        txt('t4', 60, 450, 674, 60, '[NOM DU CLIENT]', { fontSize: 36, bold: true, color: '#1e293b', z: 1 }),
        txt('t5', 60, 530, 674, 50, '[Entreprise du client]', { fontSize: 24, color: '#374151', z: 1 }),
        txt('t6', 60, 640, 674, 50, 'Date : [Date]', { fontSize: 22, color: '#6b7280', z: 1 }),
        txt('t7', 60, 690, 674, 50, 'Validité : 30 jours', { fontSize: 22, color: '#6b7280', z: 1 }),
        rect('r2', 0, 1050, 794, 73, '#2563eb', { z: 0 }),
        txt('t8', 60, 1068, 674, 36, '[Votre nom] · [Email] · [Tél]', { fontSize: 18, color: '#bfdbfe', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'doc-newsletter-print-01', name: 'Newsletter Print', description: 'Newsletter imprimable A4',
    category: 'document', subcategory: 'Communication', format: 'A4 Portrait (794×1123)',
    width: 794, height: 1123, thumbnail: '📰', colors: ['#dc2626', '#ffffff', '#1e293b'],
    tags: ['newsletter', 'print', 'communication', 'journal'],
    canvas: {
      background: '#ffffff',
      elements: [
        rect('r1', 0, 0, 794, 100, '#dc2626', { z: 0 }),
        txt('t1', 40, 20, 714, 60, '📰 LA LETTRE D\'INFORMATION', { fontSize: 28, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t2', 40, 120, 714, 50, `N°12 · ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`, { fontSize: 18, color: '#6b7280', z: 1 }),
        txt('t3', 40, 200, 714, 50, '📌 À LA UNE', { fontSize: 16, bold: true, color: '#dc2626', z: 1 }),
        txt('t4', 40, 250, 714, 60, 'Titre de l\'article principal', { fontSize: 24, bold: true, color: '#1e293b', z: 1 }),
        txt('t5', 40, 320, 714, 100, 'Résumé de l\'article principal en 3-4 lignes. Description du contenu et de l\'information importante du mois.', { fontSize: 15, color: '#374151', z: 1 }),
        rect('r2', 40, 440, 714, 1, '#e2e8f0', { z: 1 }),
        txt('t6', 40, 460, 340, 40, '📢 ACTUALITÉ 1', { fontSize: 14, bold: true, color: '#dc2626', z: 1 }),
        txt('t7', 40, 500, 340, 200, 'Titre de l\'actualité\n\nDescription courte de l\'actualité n°1 avec les informations essentielles.', { fontSize: 13, color: '#374151', z: 1 }),
        txt('t8', 414, 460, 340, 40, '📢 ACTUALITÉ 2', { fontSize: 14, bold: true, color: '#dc2626', z: 1 }),
        txt('t9', 414, 500, 340, 200, 'Titre de l\'actualité\n\nDescription courte de l\'actualité n°2 avec les informations essentielles.', { fontSize: 13, color: '#374151', z: 1 }),
        rect('r3', 0, 1080, 794, 43, '#1e293b', { z: 0 }),
        txt('t10', 40, 1090, 714, 22, '[Entreprise] · [Adresse] · [Site web]', { fontSize: 13, color: '#94a3b8', z: 1, align: 'center' }),
      ]
    }
  },
];

// ──────────────────────────────────────────
// 3. PÉDAGOGIQUE (70 templates)
// ──────────────────────────────────────────
const pedagogique: VisualTemplate[] = [
  {
    id: 'ped-fiche-01', name: 'Fiche de Cours', description: 'Fiche pédagogique synthèse',
    category: 'pedagogique', subcategory: 'Fiches pédagogiques', format: 'A4 Portrait (794×1123)',
    width: 794, height: 1123, thumbnail: '📚', colors: ['#2563eb', '#ffffff', '#f0f9ff'],
    tags: ['fiche', 'cours', 'pédagogique', 'synthèse'],
    canvas: {
      background: '#f0f9ff',
      elements: [
        rect('r1', 0, 0, 794, 80, '#2563eb', { z: 0 }),
        txt('t1', 20, 12, 754, 56, '📚 FICHE DE COURS · [Matière]', { fontSize: 24, bold: true, color: '#ffffff', z: 1 }),
        txt('t2', 20, 100, 754, 40, 'Chapitre : [Numéro & Titre]', { fontSize: 18, bold: true, color: '#1e40af', z: 1 }),
        txt('t3', 20, 150, 754, 30, 'Classe : [Classe] · Date : [Date]', { fontSize: 14, color: '#6b7280', z: 1 }),
        rect('r2', 20, 195, 754, 2, '#bfdbfe', { z: 1 }),
        txt('t4', 20, 210, 754, 30, '🎯 OBJECTIFS', { fontSize: 15, bold: true, color: '#2563eb', z: 1 }),
        txt('t5', 20, 250, 754, 80, '• Comprendre [concept 1]\n• Maîtriser [concept 2]\n• Appliquer [compétence]', { fontSize: 14, color: '#374151', z: 1 }),
        rect('r3', 20, 340, 754, 2, '#bfdbfe', { z: 1 }),
        txt('t6', 20, 355, 754, 30, '📖 COURS', { fontSize: 15, bold: true, color: '#2563eb', z: 1 }),
        txt('t7', 20, 395, 754, 200, 'Définition : [Concept]\nExplication détaillée ici. Cette section contient le corps du cours avec les notions essentielles à retenir.', { fontSize: 14, color: '#374151', z: 1 }),
        rect('r4', 20, 620, 754, 2, '#bfdbfe', { z: 1 }),
        txt('t8', 20, 635, 754, 30, '💡 POINTS CLÉS', { fontSize: 15, bold: true, color: '#2563eb', z: 1 }),
        txt('t9', 20, 675, 754, 120, '① [Point clé 1]\n② [Point clé 2]\n③ [Point clé 3]', { fontSize: 14, color: '#374151', z: 1 }),
        rect('r5', 20, 820, 754, 100, '#dbeafe', { radius: 8, z: 1 }),
        txt('t10', 30, 832, 734, 30, '⚠️ À RETENIR', { fontSize: 15, bold: true, color: '#1e40af', z: 2 }),
        txt('t11', 30, 865, 734, 50, '[La règle ou formule essentielle à mémoriser]', { fontSize: 14, color: '#1e40af', z: 2 }),
        txt('t12', 20, 950, 754, 30, '📝 EXERCICES RECOMMANDÉS : [Réf. exercices]', { fontSize: 13, color: '#6b7280', z: 1 }),
      ]
    }
  },
  {
    id: 'ped-mindmap-01', name: 'Mind Map', description: 'Carte mentale visuelle',
    category: 'pedagogique', subcategory: 'Outils pédagogiques', format: 'A4 Paysage (1123×794)',
    width: 1123, height: 794, thumbnail: '🧠', colors: ['#7c3aed', '#ffffff', '#f3e8ff'],
    tags: ['mindmap', 'carte mentale', 'pédagogie', 'schéma'],
    canvas: {
      background: '#faf5ff',
      elements: [
        circ('c1', 412, 297, 300, 200, '#7c3aed', { z: 1 }),
        txt('t1', 412, 367, 300, 60, 'SUJET\nCENTRAL', { fontSize: 22, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        circ('c2', 100, 200, 180, 120, '#2563eb', { z: 1 }),
        txt('t2', 100, 250, 180, 20, 'Branche 1', { fontSize: 14, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        circ('c3', 820, 200, 180, 120, '#dc2626', { z: 1 }),
        txt('t3', 820, 250, 180, 20, 'Branche 2', { fontSize: 14, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        circ('c4', 100, 480, 180, 120, '#059669', { z: 1 }),
        txt('t4', 100, 530, 180, 20, 'Branche 3', { fontSize: 14, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        circ('c5', 820, 480, 180, 120, '#f59e0b', { z: 1 }),
        txt('t5', 820, 530, 180, 20, 'Branche 4', { fontSize: 14, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t6', 100, 160, 180, 30, '• Idée A', { fontSize: 12, color: '#374151', z: 1 }),
        txt('t7', 100, 185, 180, 30, '• Idée B', { fontSize: 12, color: '#374151', z: 1 }),
        txt('t8', 820, 160, 180, 30, '• Concept X', { fontSize: 12, color: '#374151', z: 1 }),
        txt('t9', 820, 185, 180, 30, '• Concept Y', { fontSize: 12, color: '#374151', z: 1 }),
      ]
    }
  },
  {
    id: 'ped-timeline-01', name: 'Frise Chronologique', description: 'Frise historique',
    category: 'pedagogique', subcategory: 'Outils pédagogiques', format: 'A4 Paysage (1123×794)',
    width: 1123, height: 794, thumbnail: '🗓️', colors: ['#f59e0b', '#1e293b', '#ffffff'],
    tags: ['frise', 'chronologique', 'histoire', 'timeline'],
    canvas: {
      background: '#fffbeb',
      elements: [
        txt('t1', 60, 60, 1003, 60, '🗓️ FRISE CHRONOLOGIQUE', { fontSize: 28, bold: true, color: '#92400e', z: 1, align: 'center' }),
        rect('r1', 80, 400, 963, 8, '#f59e0b', { z: 1 }),
        circ('c1', 120, 384, 40, 40, '#f59e0b', { z: 2 }),
        txt('t2', 100, 350, 80, 30, '1900', { fontSize: 14, bold: true, color: '#92400e', z: 2, align: 'center' }),
        txt('t3', 100, 440, 80, 80, 'Événement\nimportant', { fontSize: 12, color: '#374151', z: 2, align: 'center' }),
        circ('c2', 320, 384, 40, 40, '#dc2626', { z: 2 }),
        txt('t4', 300, 350, 80, 30, '1920', { fontSize: 14, bold: true, color: '#dc2626', z: 2, align: 'center' }),
        txt('t5', 300, 440, 80, 80, 'Événement\nmajeur', { fontSize: 12, color: '#374151', z: 2, align: 'center' }),
        circ('c3', 560, 384, 40, 40, '#059669', { z: 2 }),
        txt('t6', 540, 350, 80, 30, '1945', { fontSize: 14, bold: true, color: '#059669', z: 2, align: 'center' }),
        txt('t7', 540, 440, 80, 80, 'Tournant\nhistorique', { fontSize: 12, color: '#374151', z: 2, align: 'center' }),
        circ('c4', 760, 384, 40, 40, '#7c3aed', { z: 2 }),
        txt('t8', 740, 350, 80, 30, '1969', { fontSize: 14, bold: true, color: '#7c3aed', z: 2, align: 'center' }),
        txt('t9', 740, 440, 80, 80, 'Moment\nclé', { fontSize: 12, color: '#374151', z: 2, align: 'center' }),
        circ('c5', 1020, 384, 40, 40, '#0ea5e9', { z: 2 }),
        txt('t10', 1000, 350, 80, 30, '2000', { fontSize: 14, bold: true, color: '#0ea5e9', z: 2, align: 'center' }),
        txt('t11', 1000, 440, 80, 80, 'Époque\nmoderne', { fontSize: 12, color: '#374151', z: 2, align: 'center' }),
      ]
    }
  },
  {
    id: 'ped-quiz-01', name: 'Quiz / QCM', description: 'Feuille questionnaire QCM',
    category: 'pedagogique', subcategory: 'Évaluations', format: 'A4 Portrait (794×1123)',
    width: 794, height: 1123, thumbnail: '❓', colors: ['#059669', '#ffffff', '#f0fdf4'],
    tags: ['quiz', 'qcm', 'évaluation', 'questionnaire'],
    canvas: {
      background: '#ffffff',
      elements: [
        rect('r1', 0, 0, 794, 80, '#059669', { z: 0 }),
        txt('t1', 20, 12, 754, 56, '❓ QCM · [Titre de l\'évaluation]', { fontSize: 24, bold: true, color: '#ffffff', z: 1 }),
        txt('t2', 20, 100, 400, 30, 'Nom : ___________________________', { fontSize: 14, color: '#374151', z: 1 }),
        txt('t3', 440, 100, 334, 30, 'Date : _______________', { fontSize: 14, color: '#374151', z: 1 }),
        txt('t4', 20, 140, 754, 30, 'Classe : _______________  · Note : _____ / 20', { fontSize: 14, color: '#374151', z: 1 }),
        rect('r2', 20, 180, 754, 1, '#e2e8f0', { z: 1 }),
        txt('t5', 20, 200, 754, 30, '1. [Question numéro 1]', { fontSize: 14, bold: true, color: '#1e293b', z: 1 }),
        txt('t6', 30, 238, 754, 100, '☐ A. Réponse A\n☐ B. Réponse B\n☐ C. Réponse C\n☐ D. Réponse D', { fontSize: 13, color: '#374151', z: 1 }),
        rect('r3', 20, 350, 754, 1, '#e2e8f0', { z: 1 }),
        txt('t7', 20, 365, 754, 30, '2. [Question numéro 2]', { fontSize: 14, bold: true, color: '#1e293b', z: 1 }),
        txt('t8', 30, 403, 754, 100, '☐ A. Réponse A\n☐ B. Réponse B\n☐ C. Réponse C\n☐ D. Réponse D', { fontSize: 13, color: '#374151', z: 1 }),
        rect('r4', 20, 515, 754, 1, '#e2e8f0', { z: 1 }),
        txt('t9', 20, 530, 754, 30, '3. [Question numéro 3]', { fontSize: 14, bold: true, color: '#1e293b', z: 1 }),
        txt('t10', 30, 568, 754, 100, '☐ A. Réponse A\n☐ B. Réponse B\n☐ C. Réponse C\n☐ D. Réponse D', { fontSize: 13, color: '#374151', z: 1 }),
        rect('r5', 20, 680, 754, 1, '#e2e8f0', { z: 1 }),
        txt('t11', 20, 695, 754, 30, '4. [Question numéro 4]', { fontSize: 14, bold: true, color: '#1e293b', z: 1 }),
        txt('t12', 30, 733, 754, 100, '☐ A. Réponse A\n☐ B. Réponse B\n☐ C. Réponse C\n☐ D. Réponse D', { fontSize: 13, color: '#374151', z: 1 }),
        txt('t13', 20, 1070, 754, 30, 'Bonne chance ! 🍀', { fontSize: 14, italic: true, color: '#059669', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ped-progression-01', name: 'Progression Annuelle', description: 'Tableau de progression pédagogique',
    category: 'pedagogique', subcategory: 'Planification', format: 'A4 Paysage (1123×794)',
    width: 1123, height: 794, thumbnail: '📅', colors: ['#2563eb', '#ffffff', '#eff6ff'],
    tags: ['progression', 'annuelle', 'planification', 'enseignant'],
    canvas: {
      background: '#eff6ff',
      elements: [
        rect('r1', 0, 0, 1123, 70, '#2563eb', { z: 0 }),
        txt('t1', 20, 12, 1083, 46, '📅 PROGRESSION ANNUELLE · [Matière] · [Classe] · [Année]', { fontSize: 22, bold: true, color: '#ffffff', z: 1 }),
        rect('r2', 20, 90, 220, 40, '#bfdbfe', { z: 1 }),
        txt('t2', 20, 100, 220, 20, 'Période', { fontSize: 13, bold: true, color: '#1e40af', z: 2, align: 'center' }),
        rect('r3', 240, 90, 320, 40, '#bfdbfe', { z: 1 }),
        txt('t3', 240, 100, 320, 20, 'Thème / Chapitre', { fontSize: 13, bold: true, color: '#1e40af', z: 2, align: 'center' }),
        rect('r4', 560, 90, 200, 40, '#bfdbfe', { z: 1 }),
        txt('t4', 560, 100, 200, 20, 'Durée', { fontSize: 13, bold: true, color: '#1e40af', z: 2, align: 'center' }),
        rect('r5', 760, 90, 340, 40, '#bfdbfe', { z: 1 }),
        txt('t5', 760, 100, 340, 20, 'Compétences visées', { fontSize: 13, bold: true, color: '#1e40af', z: 2, align: 'center' }),
        txt('t6', 20, 148, 220, 30, 'Période 1', { fontSize: 12, bold: true, color: '#2563eb', z: 1, align: 'center' }),
        txt('t7', 240, 148, 320, 30, 'Chapitre 1 : [Titre]', { fontSize: 12, color: '#374151', z: 1 }),
        txt('t8', 560, 148, 200, 30, '4 semaines', { fontSize: 12, color: '#374151', z: 1, align: 'center' }),
        txt('t9', 760, 148, 340, 30, '[Compétence 1, Compétence 2]', { fontSize: 12, color: '#374151', z: 1 }),
        txt('t10', 20, 188, 220, 30, 'Période 1', { fontSize: 12, color: '#2563eb', z: 1, align: 'center' }),
        txt('t11', 240, 188, 320, 30, 'Chapitre 2 : [Titre]', { fontSize: 12, color: '#374151', z: 1 }),
        txt('t12', 560, 188, 200, 30, '3 semaines', { fontSize: 12, color: '#374151', z: 1, align: 'center' }),
        txt('t13', 760, 188, 340, 30, '[Compétence 3, Compétence 4]', { fontSize: 12, color: '#374151', z: 1 }),
        txt('t14', 20, 228, 220, 30, 'Période 2', { fontSize: 12, bold: true, color: '#2563eb', z: 1, align: 'center' }),
        txt('t15', 240, 228, 320, 30, 'Chapitre 3 : [Titre]', { fontSize: 12, color: '#374151', z: 1 }),
        txt('t16', 560, 228, 200, 30, '5 semaines', { fontSize: 12, color: '#374151', z: 1, align: 'center' }),
        txt('t17', 760, 228, 340, 30, '[Compétence 5, Compétence 6]', { fontSize: 12, color: '#374151', z: 1 }),
      ]
    }
  },
  {
    id: 'ped-diplome-01', name: 'Diplôme de Fin', description: 'Diplôme de fin de formation',
    category: 'pedagogique', subcategory: 'Certificats', format: 'A4 Paysage (1123×794)',
    width: 1123, height: 794, thumbnail: '🎓', colors: ['#1e3a5f', '#fbbf24', '#ffffff'],
    tags: ['diplôme', 'formation', 'certificat', 'remise'],
    canvas: {
      background: '#fefce8',
      elements: [
        rect('r1', 10, 10, 1103, 774, '#1e3a5f', { radius: 8, z: 0 }),
        rect('r2', 20, 20, 1083, 754, '#fefce8', { radius: 6, z: 0 }),
        rect('r3', 30, 30, 1063, 734, '#fbbf24', { opacity: 0.3, radius: 4, z: 0 }),
        rect('r4', 40, 40, 1043, 714, '#fefce8', { radius: 4, z: 0 }),
        txt('t1', 80, 70, 963, 60, '🎓 ÉTABLISSEMENT · [Nom de l\'école]', { fontSize: 20, bold: true, color: '#1e3a5f', z: 1, align: 'center' }),
        txt('t2', 80, 160, 963, 60, 'DIPLÔME DE FIN DE FORMATION', { fontSize: 30, bold: true, color: '#92400e', z: 1, align: 'center' }),
        txt('t3', 80, 255, 963, 50, 'Décerné à', { fontSize: 22, italic: true, color: '#6b7280', z: 1, align: 'center' }),
        txt('t4', 80, 320, 963, 70, '[Prénom NOM]', { fontSize: 52, bold: true, color: '#1e3a5f', z: 1, align: 'center' }),
        txt('t5', 80, 415, 963, 50, 'pour avoir suivi et validé avec succès la formation', { fontSize: 20, italic: true, color: '#6b7280', z: 1, align: 'center' }),
        txt('t6', 80, 475, 963, 50, '"[Nom de la formation]"', { fontSize: 28, bold: true, color: '#b45309', z: 1, align: 'center' }),
        txt('t7', 80, 545, 963, 40, `Promotion [Année] · [Durée] de formation`, { fontSize: 18, color: '#6b7280', z: 1, align: 'center' }),
        rect('r5', 180, 620, 300, 2, '#fbbf24', { z: 1 }),
        rect('r6', 643, 620, 300, 2, '#fbbf24', { z: 1 }),
        txt('t8', 80, 640, 400, 40, 'Directeur de l\'établissement', { fontSize: 14, color: '#6b7280', z: 1, align: 'center' }),
        txt('t9', 623, 640, 400, 40, 'Date et lieu', { fontSize: 14, color: '#6b7280', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'ped-planning-classe-01', name: 'Emploi du Temps', description: 'Planning classe hebdomadaire',
    category: 'pedagogique', subcategory: 'Planification', format: 'A4 Paysage (1123×794)',
    width: 1123, height: 794, thumbnail: '🗓️', colors: ['#6366f1', '#ffffff', '#eff6ff'],
    tags: ['emploi du temps', 'planning', 'classe', 'horaires'],
    canvas: {
      background: '#f0f9ff',
      elements: [
        rect('r1', 0, 0, 1123, 60, '#6366f1', { z: 0 }),
        txt('t1', 20, 10, 1083, 40, '🗓️ EMPLOI DU TEMPS · [Classe] · Semaine du [Date]', { fontSize: 20, bold: true, color: '#ffffff', z: 1 }),
        txt('t2', 20, 80, 100, 30, 'Horaire', { fontSize: 12, bold: true, color: '#4f46e5', z: 1, align: 'center' }),
        txt('t3', 120, 80, 200, 30, 'LUNDI', { fontSize: 14, bold: true, color: '#4f46e5', z: 1, align: 'center' }),
        txt('t4', 320, 80, 200, 30, 'MARDI', { fontSize: 14, bold: true, color: '#4f46e5', z: 1, align: 'center' }),
        txt('t5', 520, 80, 200, 30, 'MERCREDI', { fontSize: 14, bold: true, color: '#4f46e5', z: 1, align: 'center' }),
        txt('t6', 720, 80, 200, 30, 'JEUDI', { fontSize: 14, bold: true, color: '#4f46e5', z: 1, align: 'center' }),
        txt('t7', 920, 80, 183, 30, 'VENDREDI', { fontSize: 14, bold: true, color: '#4f46e5', z: 1, align: 'center' }),
        txt('t8', 20, 125, 100, 30, '08h-09h', { fontSize: 11, color: '#6b7280', z: 1, align: 'center' }),
        rect('r2', 120, 120, 200, 35, '#c7d2fe', { z: 1 }),
        txt('t9', 120, 129, 200, 18, 'Mathématiques', { fontSize: 11, bold: true, color: '#3730a3', z: 2, align: 'center' }),
        txt('t10', 20, 170, 100, 30, '09h-10h', { fontSize: 11, color: '#6b7280', z: 1, align: 'center' }),
        rect('r3', 320, 165, 200, 35, '#bbf7d0', { z: 1 }),
        txt('t11', 320, 174, 200, 18, 'Français', { fontSize: 11, bold: true, color: '#166534', z: 2, align: 'center' }),
        txt('t12', 20, 215, 100, 30, '10h-11h', { fontSize: 11, color: '#6b7280', z: 1, align: 'center' }),
        rect('r4', 120, 210, 200, 35, '#fed7aa', { z: 1 }),
        txt('t13', 120, 219, 200, 18, 'Sciences', { fontSize: 11, bold: true, color: '#9a3412', z: 2, align: 'center' }),
        txt('t14', 20, 260, 100, 30, '14h-15h', { fontSize: 11, color: '#6b7280', z: 1, align: 'center' }),
        rect('r5', 520, 255, 200, 35, '#fde68a', { z: 1 }),
        txt('t15', 520, 264, 200, 18, 'Histoire', { fontSize: 11, bold: true, color: '#92400e', z: 2, align: 'center' }),
      ]
    }
  },
  {
    id: 'ped-support-01', name: 'Support Présentation', description: 'Diapositive cours pour classe',
    category: 'pedagogique', subcategory: 'Supports de cours', format: 'Présentation 16:9 (1920×1080)',
    width: 1920, height: 1080, thumbnail: '🖥️', colors: ['#1e3a5f', '#60a5fa', '#ffffff'],
    tags: ['présentation', 'cours', 'diapositive', 'pédagogie'],
    canvas: {
      background: '#1e3a5f',
      elements: [
        circ('c1', -100, 800, 500, 500, '#2563eb', { opacity: 0.15, z: 0 }),
        rect('r1', 0, 0, 8, 1080, '#60a5fa', { z: 1 }),
        txt('t1', 80, 80, 1760, 60, 'COURS · [Matière] · [Classe]', { fontSize: 28, bold: true, color: '#93c5fd', z: 1 }),
        txt('t2', 80, 200, 1760, 150, 'Titre du chapitre ou de la séance', { fontSize: 80, bold: true, color: '#ffffff', z: 1 }),
        txt('t3', 80, 400, 1760, 80, 'Sous-titre ou objectif de la séance', { fontSize: 40, italic: true, color: '#60a5fa', z: 1 }),
        rect('r2', 80, 520, 1760, 2, '#1e4e7e', { z: 1 }),
        txt('t4', 80, 560, 850, 300, '📌 Point 1 :\nExplication du premier point\n\n📌 Point 2 :\nExplication du deuxième point', { fontSize: 30, color: '#e2e8f0', z: 1 }),
        rect('r3', 1000, 530, 760, 380, '#0f2840', { radius: 12, z: 1 }),
        txt('t5', 1000, 580, 760, 200, '💡\nConcept clé ou\nillustration ici', { fontSize: 36, color: '#60a5fa', z: 2, align: 'center' }),
        txt('t6', 80, 1000, 800, 40, 'Page [N] · Auteur · Établissement', { fontSize: 20, color: '#475569', z: 1 }),
      ]
    }
  },
];

// ──────────────────────────────────────────
// 4. MARKETING & COMMERCIAL (60 templates)
// ──────────────────────────────────────────
const marketing: VisualTemplate[] = [
  {
    id: 'mkt-hero-01', name: 'Hero Landing Page', description: 'Visuel héro pour landing page',
    category: 'marketing', subcategory: 'Digital', format: 'Banner Web (1920×1080)',
    width: 1920, height: 1080, thumbnail: '🌟', colors: ['#1e293b', '#6366f1', '#ffffff'],
    tags: ['landing page', 'hero', 'web', 'digital'],
    canvas: {
      background: '#0f172a',
      elements: [
        circ('c1', 800, -200, 800, 800, '#6366f1', { opacity: 0.15, z: 0 }),
        circ('c2', -200, 600, 600, 600, '#6366f1', { opacity: 0.08, z: 0 }),
        txt('t1', 100, 80, 400, 50, '🚀 NOUVEAUTÉ', { fontSize: 22, bold: true, color: '#818cf8', z: 1 }),
        txt('t2', 100, 180, 1200, 250, 'La solution qui\nchange tout.', { fontSize: 120, bold: true, color: '#ffffff', z: 1 }),
        txt('t3', 100, 490, 900, 80, 'Découvrez comment notre plateforme aide 10 000+ entreprises\nà automatiser et scaler leur business en 30 jours.', { fontSize: 32, color: '#94a3b8', z: 1 }),
        rect('r1', 100, 620, 300, 80, '#6366f1', { radius: 8, z: 1 }),
        txt('t4', 100, 643, 300, 34, 'Commencer gratuitement', { fontSize: 22, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        rect('r2', 420, 620, 260, 80, 'transparent', { radius: 8, border: 2, borderColor: '#6366f1', z: 1 }),
        txt('t5', 420, 643, 260, 34, 'Voir la démo', { fontSize: 22, color: '#818cf8', z: 2, align: 'center' }),
        txt('t6', 100, 730, 800, 50, '⭐⭐⭐⭐⭐ 4.9/5 · Plus de 10 000 clients satisfaits', { fontSize: 22, color: '#475569', z: 1 }),
      ]
    }
  },
  {
    id: 'mkt-promo-01', name: 'Bannière Promo', description: 'Bannière promotionnelle web',
    category: 'marketing', subcategory: 'E-commerce', format: 'Banner Web (1200×300)',
    width: 1200, height: 300, thumbnail: '🏷️', colors: ['#dc2626', '#fbbf24', '#ffffff'],
    tags: ['bannière', 'promo', 'soldes', 'ecommerce'],
    canvas: {
      background: '#dc2626',
      elements: [
        rect('r1', 0, 0, 1200, 300, '#dc2626'),
        circ('c1', -50, 100, 200, 200, '#ef4444', { z: 0 }),
        txt('t1', 60, 40, 500, 80, '🔥 VENTE FLASH', { fontSize: 28, bold: true, color: '#fbbf24', z: 1 }),
        txt('t2', 60, 140, 500, 100, '-50% sur tout !', { fontSize: 52, bold: true, color: '#ffffff', z: 1 }),
        txt('t3', 700, 80, 400, 80, 'Code : FLASH50', { fontSize: 38, bold: true, color: '#fbbf24', z: 1, align: 'center' }),
        txt('t4', 700, 170, 400, 60, '⏰ Jusqu\'au minuit', { fontSize: 28, color: '#fde68a', z: 1, align: 'center' }),
        rect('r2', 1060, 100, 110, 100, '#fbbf24', { radius: 55, z: 1 }),
        txt('t5', 1060, 128, 110, 44, '→\nSHOP', { fontSize: 16, bold: true, color: '#1e293b', z: 2, align: 'center' }),
      ]
    }
  },
  {
    id: 'mkt-email-01', name: 'Email Header', description: 'En-tête email marketing',
    category: 'marketing', subcategory: 'Email Marketing', format: 'Email Header (600×200)',
    width: 600, height: 200, thumbnail: '📧', colors: ['#6366f1', '#ffffff', '#1e293b'],
    tags: ['email', 'header', 'newsletter', 'marketing'],
    canvas: {
      background: '#6366f1',
      elements: [
        rect('r1', 0, 0, 600, 200, '#6366f1'),
        circ('c1', -30, -30, 150, 150, '#4f46e5', { z: 0 }),
        txt('t1', 40, 50, 400, 50, 'NOM DE L\'ENTREPRISE', { fontSize: 26, bold: true, color: '#ffffff', z: 1 }),
        txt('t2', 40, 120, 400, 40, '[Tagline ou accroche]', { fontSize: 18, italic: true, color: '#c7d2fe', z: 1 }),
        txt('t3', 480, 70, 80, 60, '📧', { fontSize: 50, z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'mkt-carte-visite-01', name: 'Carte de Visite', description: 'Carte de visite professionnelle',
    category: 'marketing', subcategory: 'Print', format: 'Carte de visite (1050×600)',
    width: 1050, height: 600, thumbnail: '💳', colors: ['#1e293b', '#2563eb', '#ffffff'],
    tags: ['carte de visite', 'print', 'professionnel', 'identité'],
    canvas: {
      background: '#1e293b',
      elements: [
        rect('r1', 0, 0, 1050, 600, '#1e293b'),
        circ('c1', -50, 200, 300, 300, '#2563eb', { opacity: 0.2, z: 0 }),
        rect('r2', 0, 0, 6, 600, '#2563eb', { z: 1 }),
        txt('t1', 40, 80, 600, 80, 'Jean Dupont', { fontSize: 52, bold: true, color: '#ffffff', z: 1 }),
        txt('t2', 40, 180, 600, 50, 'Directeur Commercial', { fontSize: 28, color: '#60a5fa', z: 1 }),
        txt('t3', 40, 270, 600, 40, 'Entreprise SA', { fontSize: 24, italic: true, color: '#94a3b8', z: 1 }),
        txt('t4', 40, 380, 600, 35, '📱 06 12 34 56 78', { fontSize: 22, color: '#e2e8f0', z: 1 }),
        txt('t5', 40, 422, 600, 35, '📧 jean.dupont@entreprise.com', { fontSize: 22, color: '#e2e8f0', z: 1 }),
        txt('t6', 40, 464, 600, 35, '🌐 www.entreprise.com', { fontSize: 22, color: '#e2e8f0', z: 1 }),
        rect('r3', 700, 80, 260, 260, '#2563eb', { radius: 16, z: 1 }),
        txt('t7', 700, 130, 260, 160, '🏢', { fontSize: 120, z: 2, align: 'center' }),
      ]
    }
  },
  {
    id: 'mkt-popup-01', name: 'Pop-up Promo', description: 'Pop-up conversion e-commerce',
    category: 'marketing', subcategory: 'E-commerce', format: 'Pop-up (600×500)',
    width: 600, height: 500, thumbnail: '🎁', colors: ['#fbbf24', '#1e293b', '#ffffff'],
    tags: ['popup', 'conversion', 'promo', 'email'],
    canvas: {
      background: '#fffbeb',
      elements: [
        rect('r1', 0, 0, 600, 10, '#fbbf24', { z: 1 }),
        txt('t1', 40, 40, 520, 60, '🎁 OFFRE EXCLUSIVE', { fontSize: 28, bold: true, color: '#b45309', z: 1, align: 'center' }),
        txt('t2', 40, 120, 520, 80, '-15%\nsur votre première commande', { fontSize: 42, bold: true, color: '#1e293b', z: 1, align: 'center' }),
        txt('t3', 40, 230, 520, 50, 'Inscrivez-vous pour obtenir\nvotre code promo exclusif', { fontSize: 20, color: '#374151', z: 1, align: 'center' }),
        rect('r2', 60, 310, 480, 55, '#e2e8f0', { radius: 8, z: 1 }),
        txt('t4', 60, 328, 480, 20, 'Votre email...', { fontSize: 16, color: '#9ca3af', z: 2, align: 'center' }),
        rect('r3', 60, 390, 480, 60, '#fbbf24', { radius: 8, z: 1 }),
        txt('t5', 60, 408, 480, 24, 'Obtenir mon code -15%', { fontSize: 18, bold: true, color: '#1e293b', z: 2, align: 'center' }),
        txt('t6', 40, 470, 520, 30, 'Pas de spam · Désinscription facile', { fontSize: 13, color: '#9ca3af', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'mkt-pitch-01', name: 'One Pager', description: 'Résumé commercial une page',
    category: 'marketing', subcategory: 'Commercial', format: 'A4 Portrait (794×1123)',
    width: 794, height: 1123, thumbnail: '📄', colors: ['#059669', '#1e293b', '#ffffff'],
    tags: ['one pager', 'commercial', 'résumé', 'pitch'],
    canvas: {
      background: '#ffffff',
      elements: [
        rect('r1', 0, 0, 794, 150, '#059669', { z: 0 }),
        txt('t1', 40, 30, 714, 50, 'NOM ENTREPRISE', { fontSize: 36, bold: true, color: '#ffffff', z: 1 }),
        txt('t2', 40, 90, 714, 40, 'Tagline qui résume votre valeur en une phrase', { fontSize: 20, italic: true, color: '#6ee7b7', z: 1 }),
        txt('t3', 40, 190, 714, 40, '🎯 LE PROBLÈME', { fontSize: 16, bold: true, color: '#059669', z: 1 }),
        txt('t4', 40, 240, 714, 60, 'Description claire du problème que vous résolvez pour votre cible.', { fontSize: 15, color: '#374151', z: 1 }),
        txt('t5', 40, 330, 714, 40, '💡 NOTRE SOLUTION', { fontSize: 16, bold: true, color: '#059669', z: 1 }),
        txt('t6', 40, 380, 714, 60, 'Explication simple de votre solution et comment elle résout le problème.', { fontSize: 15, color: '#374151', z: 1 }),
        txt('t7', 40, 470, 714, 40, '📊 CHIFFRES CLÉS', { fontSize: 16, bold: true, color: '#059669', z: 1 }),
        rect('r2', 40, 520, 210, 80, '#dcfce7', { radius: 8, z: 1 }),
        txt('t8', 40, 535, 210, 50, '500+\nclients', { fontSize: 22, bold: true, color: '#059669', z: 2, align: 'center' }),
        rect('r3', 262, 520, 210, 80, '#dcfce7', { radius: 8, z: 1 }),
        txt('t9', 262, 535, 210, 50, '98%\nsatisfaction', { fontSize: 22, bold: true, color: '#059669', z: 2, align: 'center' }),
        rect('r4', 484, 520, 210, 80, '#dcfce7', { radius: 8, z: 1 }),
        txt('t10', 484, 535, 210, 50, '3x\nROI moyen', { fontSize: 22, bold: true, color: '#059669', z: 2, align: 'center' }),
        txt('t11', 40, 640, 714, 40, '🤝 POUR QUI ?', { fontSize: 16, bold: true, color: '#059669', z: 1 }),
        txt('t12', 40, 690, 714, 60, 'Description de votre cible : secteur, taille d\'entreprise, rôle.', { fontSize: 15, color: '#374151', z: 1 }),
        txt('t13', 40, 790, 714, 40, '💰 TARIFICATION', { fontSize: 16, bold: true, color: '#059669', z: 1 }),
        txt('t14', 40, 840, 714, 60, 'Offre Starter : 49€/mois · Offre Pro : 149€/mois · Offre Enterprise : Sur devis', { fontSize: 15, color: '#374151', z: 1 }),
        rect('r5', 0, 1040, 794, 83, '#059669', { z: 0 }),
        txt('t15', 40, 1060, 714, 44, '📞 01 23 45 67 89 · contact@entreprise.com · www.entreprise.com', { fontSize: 16, color: '#ffffff', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'mkt-signaletic-01', name: 'Roll-up Stand', description: 'Kakémono / roll-up salon',
    category: 'marketing', subcategory: 'Print', format: 'Roll-up (850×2000)',
    width: 850, height: 2000, thumbnail: '🏳️', colors: ['#2563eb', '#ffffff', '#1e293b'],
    tags: ['roll-up', 'kakémono', 'stand', 'salon', 'impression'],
    canvas: {
      background: '#2563eb',
      elements: [
        rect('r1', 0, 0, 850, 2000, '#2563eb'),
        circ('c1', -100, 800, 600, 600, '#1d4ed8', { z: 0 }),
        circ('c2', 600, 1500, 400, 400, '#3b82f6', { z: 0 }),
        txt('t1', 60, 120, 730, 80, 'LOGO / NOM', { fontSize: 48, bold: true, color: '#ffffff', z: 1, align: 'center' }),
        txt('t2', 60, 240, 730, 100, 'VOTRE\nSLOGAN\nICI', { fontSize: 64, bold: true, color: '#fde68a', z: 1, align: 'center' }),
        txt('t3', 60, 500, 730, 80, '🎯 Bénéfice 1', { fontSize: 32, bold: true, color: '#ffffff', z: 1 }),
        txt('t4', 60, 590, 730, 50, 'Description courte du premier avantage clé', { fontSize: 20, color: '#bfdbfe', z: 1 }),
        txt('t5', 60, 680, 730, 80, '⚡ Bénéfice 2', { fontSize: 32, bold: true, color: '#ffffff', z: 1 }),
        txt('t6', 60, 770, 730, 50, 'Description courte du deuxième avantage clé', { fontSize: 20, color: '#bfdbfe', z: 1 }),
        txt('t7', 60, 860, 730, 80, '🌟 Bénéfice 3', { fontSize: 32, bold: true, color: '#ffffff', z: 1 }),
        txt('t8', 60, 950, 730, 50, 'Description courte du troisième avantage clé', { fontSize: 20, color: '#bfdbfe', z: 1 }),
        rect('r2', 200, 1100, 450, 90, '#fde68a', { radius: 45, z: 1 }),
        txt('t9', 200, 1122, 450, 46, 'NOUS CONTACTER', { fontSize: 26, bold: true, color: '#1e293b', z: 2, align: 'center' }),
        txt('t10', 60, 1700, 730, 50, '🌐 www.entreprise.com', { fontSize: 24, color: '#bfdbfe', z: 1, align: 'center' }),
        txt('t11', 60, 1760, 730, 50, '📧 contact@entreprise.com', { fontSize: 24, color: '#bfdbfe', z: 1, align: 'center' }),
        txt('t12', 60, 1820, 730, 50, '📱 01 23 45 67 89', { fontSize: 24, color: '#bfdbfe', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'mkt-infographie-01', name: 'Infographie Statistiques', description: 'Infographie chiffres secteur',
    category: 'marketing', subcategory: 'Contenu', format: 'Infographie (800×1200)',
    width: 800, height: 1200, thumbnail: '📊', colors: ['#6366f1', '#ffffff', '#f3e8ff'],
    tags: ['infographie', 'statistiques', 'contenu', 'partage'],
    canvas: {
      background: '#1e1b4b',
      elements: [
        rect('r1', 0, 0, 800, 1200, '#1e1b4b'),
        txt('t1', 50, 50, 700, 70, 'LE SECTEUR EN CHIFFRES 2025', { fontSize: 24, bold: true, color: '#c7d2fe', z: 1, align: 'center' }),
        txt('t2', 50, 130, 700, 50, '[Nom du secteur / domaine]', { fontSize: 20, italic: true, color: '#818cf8', z: 1, align: 'center' }),
        rect('r2', 50, 210, 700, 150, '#2e2b7e', { radius: 12, z: 1 }),
        txt('t3', 50, 250, 700, 70, '€ 4.2 Mds', { fontSize: 56, bold: true, color: '#ffffff', z: 2, align: 'center' }),
        txt('t4', 50, 325, 700, 30, 'Marché total estimé en France', { fontSize: 18, color: '#a5b4fc', z: 2, align: 'center' }),
        rect('r3', 50, 390, 330, 150, '#2e2b7e', { radius: 12, z: 1 }),
        txt('t5', 50, 430, 330, 70, '+23%', { fontSize: 52, bold: true, color: '#34d399', z: 2, align: 'center' }),
        txt('t6', 50, 505, 330, 30, 'Croissance annuelle', { fontSize: 15, color: '#a5b4fc', z: 2, align: 'center' }),
        rect('r4', 420, 390, 330, 150, '#2e2b7e', { radius: 12, z: 1 }),
        txt('t7', 420, 430, 330, 70, '1.8M', { fontSize: 52, bold: true, color: '#f472b6', z: 2, align: 'center' }),
        txt('t8', 420, 505, 330, 30, 'Emplois créés', { fontSize: 15, color: '#a5b4fc', z: 2, align: 'center' }),
        txt('t9', 50, 580, 700, 50, '📌 TENDANCES CLÉS', { fontSize: 22, bold: true, color: '#c7d2fe', z: 1 }),
        txt('t10', 50, 640, 700, 40, '① [Tendance majeure 1]', { fontSize: 18, color: '#e2e8f0', z: 1 }),
        txt('t11', 50, 700, 700, 40, '② [Tendance majeure 2]', { fontSize: 18, color: '#e2e8f0', z: 1 }),
        txt('t12', 50, 760, 700, 40, '③ [Tendance majeure 3]', { fontSize: 18, color: '#e2e8f0', z: 1 }),
        txt('t13', 50, 820, 700, 40, '④ [Tendance majeure 4]', { fontSize: 18, color: '#e2e8f0', z: 1 }),
        txt('t14', 50, 1150, 700, 40, 'Source : [Étude/Institut] · [Année]', { fontSize: 14, color: '#4c1d95', z: 1, align: 'center' }),
      ]
    }
  },
  {
    id: 'mkt-storytelling-01', name: 'Storytelling Brand', description: 'Affiche identité de marque',
    category: 'marketing', subcategory: 'Branding', format: 'A4 Portrait (794×1123)',
    width: 794, height: 1123, thumbnail: '📖', colors: ['#f59e0b', '#1e293b', '#ffffff'],
    tags: ['storytelling', 'marque', 'branding', 'identité'],
    canvas: {
      background: '#fffbeb',
      elements: [
        rect('r1', 0, 0, 794, 1123, '#fffbeb'),
        rect('r2', 0, 0, 6, 1123, '#f59e0b', { z: 1 }),
        txt('t1', 40, 60, 714, 80, 'NOTRE HISTOIRE', { fontSize: 48, bold: true, color: '#92400e', z: 1 }),
        txt('t2', 40, 160, 714, 100, '"Nous avons commencé\ncomme vous : frustrés."', { fontSize: 30, italic: true, color: '#1e293b', z: 1 }),
        txt('t3', 40, 290, 714, 120, '[Racontez votre histoire fondatrice en 3-4 lignes. Pourquoi avez-vous créé cette entreprise ? Quel problème résolvez-vous ?]', { fontSize: 18, color: '#374151', z: 1 }),
        txt('t4', 40, 450, 714, 50, '2015 · L\'origine', { fontSize: 20, bold: true, color: '#f59e0b', z: 1 }),
        txt('t5', 40, 510, 714, 60, 'Description de la création et du contexte initial.', { fontSize: 16, color: '#374151', z: 1 }),
        txt('t6', 40, 610, 714, 50, '2019 · Le pivot', { fontSize: 20, bold: true, color: '#f59e0b', z: 1 }),
        txt('t7', 40, 670, 714, 60, 'Le moment où tout a changé et la transformation opérée.', { fontSize: 16, color: '#374151', z: 1 }),
        txt('t8', 40, 770, 714, 50, '2025 · Aujourd\'hui', { fontSize: 20, bold: true, color: '#f59e0b', z: 1 }),
        txt('t9', 40, 830, 714, 60, 'Notre position actuelle et notre vision pour l\'avenir.', { fontSize: 16, color: '#374151', z: 1 }),
        rect('r3', 40, 930, 714, 100, '#fef3c7', { radius: 12, z: 1 }),
        txt('t10', 50, 950, 694, 60, '🎯 Notre mission : [En une phrase percutante]', { fontSize: 20, bold: true, color: '#b45309', z: 2 }),
      ]
    }
  },
];

// ──────────────────────────────────────────
// Génération de templates additionnels
// (pour atteindre 300+ modèles)
// ──────────────────────────────────────────

// Templates LinkedIn supplémentaires (20 extra)
const extraLinkedIn: VisualTemplate[] = Array.from({ length: 20 }, (_, i) => {
  const idx = i + 21;
  const themes = [
    { name: 'Conseil RH', bg: '#0f172a', acc: '#10b981', emoji: '👔', tags: ['rh', 'ressources humaines'] },
    { name: 'Innovation Tech', bg: '#0c0a1e', acc: '#7c3aed', emoji: '💻', tags: ['tech', 'innovation'] },
    { name: 'Croissance', bg: '#064e3b', acc: '#34d399', emoji: '📈', tags: ['croissance', 'business'] },
    { name: 'Finance', bg: '#1c1917', acc: '#f59e0b', emoji: '💹', tags: ['finance', 'investissement'] },
    { name: 'Leadership', bg: '#1e1b4b', acc: '#818cf8', emoji: '🦁', tags: ['leadership', 'management'] },
    { name: 'Marketing', bg: '#4c0519', acc: '#fb7185', emoji: '🎯', tags: ['marketing', 'digital'] },
    { name: 'Formation', bg: '#0c4a6e', acc: '#38bdf8', emoji: '🎓', tags: ['formation', 'apprentissage'] },
    { name: 'Santé', bg: '#14532d', acc: '#86efac', emoji: '💊', tags: ['santé', 'médical'] },
    { name: 'Legal', bg: '#312e81', acc: '#a5b4fc', emoji: '⚖️', tags: ['juridique', 'droit'] },
    { name: 'Immobilier', bg: '#78350f', acc: '#fde68a', emoji: '🏠', tags: ['immobilier', 'investissement'] },
  ];
  const theme = themes[i % themes.length];
  return {
    id: `li-post-${String(idx).padStart(2, '0')}`,
    name: `Post LinkedIn ${theme.name}`,
    description: `Template LinkedIn spécialisé ${theme.name}`,
    category: 'social' as const,
    subcategory: 'LinkedIn',
    format: 'Post LinkedIn (1200×627)',
    width: 1200, height: 627,
    thumbnail: theme.emoji,
    colors: [theme.bg, theme.acc, '#ffffff'],
    tags: ['linkedin', ...theme.tags],
    canvas: {
      background: theme.bg,
      elements: [
        rect('r1', 0, 0, 1200, 627, theme.bg),
        circ('c1', 900, 200, 400, 400, theme.acc, { opacity: 0.1, z: 0 }),
        rect('r2', 80, 60, 400, 6, theme.acc, { z: 1 }),
        txt('t1', 80, 90, 1040, 60, `${theme.emoji} ${theme.name.toUpperCase()}`, { fontSize: 22, bold: true, color: theme.acc, z: 1 }),
        txt('t2', 80, 180, 1040, 200, `[Titre de votre post ${theme.name}]\nUne accroche qui donne envie de lire la suite...`, { fontSize: 42, bold: true, color: '#ffffff', z: 1 }),
        txt('t3', 80, 430, 1040, 60, '[Développement du contenu et valeur ajoutée]', { fontSize: 24, color: '#94a3b8', z: 1 }),
        txt('t4', 80, 520, 600, 50, `Votre Nom · Expert en ${theme.name}`, { fontSize: 20, color: theme.acc, z: 1 }),
        txt('t5', 700, 520, 420, 50, `#${theme.tags[0]} #LinkedIn #${theme.tags[1] || 'Business'}`, { fontSize: 18, color: '#475569', z: 1, align: 'right' }),
      ]
    }
  };
});

// Templates Pédagogiques supplémentaires (30 extra)
const extraPedago: VisualTemplate[] = Array.from({ length: 30 }, (_, i) => {
  const idx = i + 9;
  const subjects = [
    { name: 'Mathématiques', emoji: '🔢', color: '#2563eb', bg: '#eff6ff' },
    { name: 'Français', emoji: '📝', color: '#dc2626', bg: '#fef2f2' },
    { name: 'Histoire-Géo', emoji: '🗺️', color: '#92400e', bg: '#fffbeb' },
    { name: 'Sciences', emoji: '🔬', color: '#059669', bg: '#f0fdf4' },
    { name: 'Anglais', emoji: '🇬🇧', color: '#1e3a5f', bg: '#f0f9ff' },
    { name: 'Arts', emoji: '🎨', color: '#7c3aed', bg: '#faf5ff' },
    { name: 'Physique-Chimie', emoji: '⚗️', color: '#0ea5e9', bg: '#f0f9ff' },
    { name: 'Informatique', emoji: '💻', color: '#374151', bg: '#f8fafc' },
    { name: 'Sport (EPS)', emoji: '⚽', color: '#16a34a', bg: '#f0fdf4' },
    { name: 'Philosophie', emoji: '🤔', color: '#6b21a8', bg: '#fdf4ff' },
  ];
  const types = [
    'Fiche Révision', 'Exercices', 'Cours Magistral', 'Synthèse',
    'Évaluation', 'Correction', 'Carte Conceptuelle', 'Résumé'
  ];
  const subject = subjects[i % subjects.length];
  const type = types[i % types.length];
  return {
    id: `ped-${subject.name.toLowerCase().replace(/[^a-z]/g, '')}-${idx}`,
    name: `${type} — ${subject.name}`,
    description: `${type} pour le cours de ${subject.name}`,
    category: 'pedagogique' as const,
    subcategory: 'Fiches pédagogiques',
    format: 'A4 Portrait (794×1123)',
    width: 794, height: 1123,
    thumbnail: subject.emoji,
    colors: [subject.color, '#ffffff', subject.bg],
    tags: ['pédagogie', subject.name.toLowerCase(), type.toLowerCase(), 'classe'],
    canvas: {
      background: subject.bg,
      elements: [
        rect('r1', 0, 0, 794, 70, subject.color, { z: 0 }),
        txt('t1', 20, 12, 754, 46, `${subject.emoji} ${type.toUpperCase()} · ${subject.name}`, { fontSize: 22, bold: true, color: '#ffffff', z: 1 }),
        txt('t2', 20, 90, 754, 40, `Titre : [${type} n°X]`, { fontSize: 18, bold: true, color: subject.color, z: 1 }),
        txt('t3', 20, 140, 754, 30, 'Classe : [Classe] · Durée : [X min] · Date : [Date]', { fontSize: 14, color: '#6b7280', z: 1 }),
        rect('r2', 20, 185, 754, 2, `${subject.color}40`, { z: 1 }),
        txt('t4', 20, 210, 754, 40, '🎯 OBJECTIFS DE LA SÉANCE', { fontSize: 15, bold: true, color: subject.color, z: 1 }),
        txt('t5', 20, 260, 754, 80, '• [Objectif 1]\n• [Objectif 2]\n• [Objectif 3]', { fontSize: 14, color: '#374151', z: 1 }),
        txt('t6', 20, 370, 754, 40, '📖 CONTENU', { fontSize: 15, bold: true, color: subject.color, z: 1 }),
        txt('t7', 20, 420, 754, 400, '[Corps du cours / des exercices]\n\nQuestion 1 : ___________________________\n\nQuestion 2 : ___________________________\n\nQuestion 3 : ___________________________', { fontSize: 14, color: '#374151', z: 1 }),
        rect('r3', 20, 870, 754, 100, `${subject.color}20`, { radius: 8, z: 1 }),
        txt('t8', 30, 886, 734, 60, `💡 ${type === 'Évaluation' ? 'Barème' : 'Points clés'} : [Information importante]`, { fontSize: 14, bold: true, color: subject.color, z: 2 }),
        txt('t9', 20, 1000, 754, 30, `📚 Support : [Manuel, page X] · Références`, { fontSize: 13, color: '#6b7280', z: 1 }),
      ]
    }
  };
});

// Templates Marketing supplémentaires (25 extra)
const extraMarketing: VisualTemplate[] = Array.from({ length: 25 }, (_, i) => {
  const idx = i + 10;
  const types = [
    { name: 'Annonce Google Ads', emoji: '🔍', bg: '#ffffff', acc: '#4285f4', format: 'Banner Web (728×90)', w: 728, h: 90 },
    { name: 'Banner 300x250', emoji: '📱', bg: '#1e293b', acc: '#3b82f6', format: 'Banner Web (300×250)', w: 300, h: 250 },
    { name: 'Pub Magazine', emoji: '📰', bg: '#f8fafc', acc: '#dc2626', format: 'A4 Portrait (794×1123)', w: 794, h: 1123 },
    { name: 'Carte Postale', emoji: '📮', bg: '#fef3c7', acc: '#f59e0b', format: 'Carte postale (1476×1051)', w: 1476, h: 1051 },
    { name: 'Menu Restaurant', emoji: '🍽️', bg: '#1c1917', acc: '#f97316', format: 'A4 Portrait (794×1123)', w: 794, h: 1123 },
    { name: 'Sticker', emoji: '🏷️', bg: '#ffffff', acc: '#ec4899', format: 'Sticker (500×500)', w: 500, h: 500 },
    { name: 'Badge Événement', emoji: '🎫', bg: '#eff6ff', acc: '#2563eb', format: 'Badge (200×300)', w: 200, h: 300 },
    { name: 'Étiquette Produit', emoji: '📦', bg: '#f0fdf4', acc: '#059669', format: 'Étiquette (600×400)', w: 600, h: 400 },
  ];
  const type = types[i % types.length];
  return {
    id: `mkt-${type.name.toLowerCase().replace(/[^a-z]/g, '')}-${idx}`,
    name: type.name,
    description: `Template ${type.name} pour vos campagnes marketing`,
    category: 'marketing' as const,
    subcategory: 'Print',
    format: type.format,
    width: type.w, height: type.h,
    thumbnail: type.emoji,
    colors: [type.bg, type.acc, '#1e293b'],
    tags: ['marketing', type.name.toLowerCase(), 'print', 'communication'],
    canvas: {
      background: type.bg,
      elements: [
        rect('r1', 0, 0, type.w, type.h, type.bg),
        circ('c1', type.w * 0.7, type.h * 0.3, type.w * 0.4, type.w * 0.4, type.acc, { opacity: 0.08, z: 0 }),
        rect('r2', 0, 0, type.w, Math.min(type.h * 0.12, 60), type.acc, { z: 0 }),
        txt('t1', 20, 8, type.w - 40, Math.min(40, type.h * 0.1), `${type.emoji} ${type.name.toUpperCase()}`, { fontSize: Math.min(20, type.h * 0.05), bold: true, color: '#ffffff', z: 1 }),
        txt('t2', 20, Math.min(80, type.h * 0.15), type.w - 40, Math.min(60, type.h * 0.15), '[Titre principal]', { fontSize: Math.min(28, type.h * 0.08), bold: true, color: '#1e293b', z: 1 }),
        txt('t3', 20, Math.min(160, type.h * 0.3), type.w - 40, Math.min(80, type.h * 0.2), '[Description courte de l\'offre ou du message]', { fontSize: Math.min(16, type.h * 0.04), color: '#374151', z: 1 }),
        rect('r3', 20, Math.max(type.h - 80, 50), Math.min(200, type.w * 0.5), 50, type.acc, { radius: 6, z: 1 }),
        txt('t4', 20, Math.max(type.h - 68, 62), Math.min(200, type.w * 0.5), 26, 'En savoir plus', { fontSize: Math.min(16, type.h * 0.04), bold: true, color: '#ffffff', z: 2, align: 'center' }),
      ]
    }
  };
});

// Templates Documents Pros supplémentaires (20 extra)
const extraDocs: VisualTemplate[] = Array.from({ length: 20 }, (_, i) => {
  const idx = i + 11;
  const types = [
    { name: 'Plan de Communication', emoji: '📣', color: '#7c3aed', bg: '#faf5ff' },
    { name: 'Feuille de Route', emoji: '🗺️', color: '#0ea5e9', bg: '#f0f9ff' },
    { name: 'Analyse SWOT', emoji: '🔍', color: '#059669', bg: '#f0fdf4' },
    { name: 'Business Plan', emoji: '💼', color: '#1e3a5f', bg: '#eff6ff' },
    { name: 'Compte Rendu Visite', emoji: '🏢', color: '#f59e0b', bg: '#fffbeb' },
    { name: 'Bon de Commande', emoji: '🛒', color: '#10b981', bg: '#f0fdf4' },
    { name: 'Attestation', emoji: '✅', color: '#2563eb', bg: '#eff6ff' },
    { name: 'Procès Verbal', emoji: '📋', color: '#6366f1', bg: '#f5f3ff' },
    { name: 'Fiche Poste', emoji: '👔', color: '#0f172a', bg: '#f8fafc' },
    { name: 'Ordre de Mission', emoji: '✈️', color: '#dc2626', bg: '#fef2f2' },
  ];
  const type = types[i % types.length];
  return {
    id: `doc-${type.name.toLowerCase().replace(/[^a-z]/g, '')}-${idx}`,
    name: type.name,
    description: `Modèle de ${type.name} professionnel`,
    category: 'document' as const,
    subcategory: 'Documents professionnels',
    format: 'A4 Portrait (794×1123)',
    width: 794, height: 1123,
    thumbnail: type.emoji,
    colors: [type.color, '#ffffff', type.bg],
    tags: ['document', type.name.toLowerCase(), 'professionnel', 'bureau'],
    canvas: {
      background: type.bg,
      elements: [
        rect('r1', 0, 0, 794, 80, type.color, { z: 0 }),
        txt('t1', 20, 14, 754, 52, `${type.emoji} ${type.name.toUpperCase()}`, { fontSize: 24, bold: true, color: '#ffffff', z: 1 }),
        txt('t2', 20, 110, 400, 30, 'Document préparé par :', { fontSize: 14, color: '#6b7280', z: 1 }),
        txt('t3', 20, 145, 400, 30, '[Nom · Poste · Service]', { fontSize: 14, bold: true, color: '#1e293b', z: 1 }),
        txt('t4', 440, 110, 334, 30, `Date : ${new Date().toLocaleDateString('fr-FR')}`, { fontSize: 14, color: '#6b7280', z: 1 }),
        txt('t5', 440, 145, 334, 30, `Réf. : DOC-${new Date().getFullYear()}-001`, { fontSize: 14, bold: true, color: type.color, z: 1 }),
        rect('r2', 20, 195, 754, 2, `${type.color}40`, { z: 1 }),
        txt('t6', 20, 220, 754, 40, '1. CONTEXTE ET OBJECTIFS', { fontSize: 15, bold: true, color: type.color, z: 1 }),
        txt('t7', 20, 270, 754, 100, '[Décrivez ici le contexte et les objectifs de ce document]', { fontSize: 14, color: '#374151', z: 1 }),
        txt('t8', 20, 400, 754, 40, '2. CONTENU PRINCIPAL', { fontSize: 15, bold: true, color: type.color, z: 1 }),
        txt('t9', 20, 450, 754, 300, '[Développez ici le contenu principal du document avec tous les détails nécessaires]\n\n• Point 1\n• Point 2\n• Point 3', { fontSize: 14, color: '#374151', z: 1 }),
        txt('t10', 20, 780, 754, 40, '3. CONCLUSION / ACTIONS', { fontSize: 15, bold: true, color: type.color, z: 1 }),
        txt('t11', 20, 830, 754, 100, '[Conclusion, décisions prises, prochaines étapes]', { fontSize: 14, color: '#374151', z: 1 }),
        rect('r3', 0, 1080, 794, 43, type.color, { opacity: 0.1, z: 0 }),
        txt('t12', 20, 1093, 754, 20, '[Organisation] · [Adresse] · [Contact]', { fontSize: 12, color: '#6b7280', z: 1, align: 'center' }),
      ]
    }
  };
});

// ──────────────────────────────────────────
// EXPORT FINAL
// ──────────────────────────────────────────
export const ALL_VISUAL_TEMPLATES: VisualTemplate[] = [
  // Réseaux Sociaux
  ...linkedinPosts,
  ...instaStories,
  ...instaPosts,
  ...twitterPosts,
  ...tiktokCovers,
  ...facebookPosts,
  ...bannieres,
  ...extraLinkedIn,
  // Documents Pro
  ...documentsPro,
  ...extraDocs,
  // Pédagogique
  ...pedagogique,
  ...extraPedago,
  // Marketing
  ...marketing,
  ...extraMarketing,
];

export const VISUAL_CATEGORIES = [
  { id: 'all', label: 'Tous les templates', emoji: '✨' },
  { id: 'social', label: 'Réseaux sociaux', emoji: '📱' },
  { id: 'document', label: 'Documents pro', emoji: '📄' },
  { id: 'pedagogique', label: 'Pédagogique', emoji: '🎓' },
  { id: 'marketing', label: 'Marketing', emoji: '📣' },
];

export const VISUAL_SUBCATEGORIES: Record<string, string[]> = {
  social: ['LinkedIn', 'Instagram Story', 'Instagram Post', 'Twitter/X', 'TikTok', 'Facebook', 'Bannières'],
  document: ['CV & Candidature', 'Présentations', 'Rapports', 'Commercial', 'Certificats', 'Flyers & Affiches', 'Brochures', 'Communication', 'Documents professionnels'],
  pedagogique: ['Fiches pédagogiques', 'Outils pédagogiques', 'Évaluations', 'Planification', 'Certificats', 'Supports de cours'],
  marketing: ['Digital', 'E-commerce', 'Email Marketing', 'Print', 'Branding', 'Contenu', 'Commercial'],
};

export const VISUAL_FORMATS = [
  'Tous les formats',
  'Post LinkedIn (1200×627)',
  'Post Instagram (1080×1080)',
  'Story Instagram (1080×1920)',
  'TikTok Cover (1080×1920)',
  'Post Twitter (1600×900)',
  'Post Facebook (1200×630)',
  'Bannière YouTube (2560×1440)',
  'Bannière LinkedIn (1584×396)',
  'A4 Portrait (794×1123)',
  'A4 Paysage (1123×794)',
  'Présentation 16:9 (1920×1080)',
  'Banner Web (1920×1080)',
  'Banner Web (1200×300)',
  'Carte de visite (1050×600)',
];
