// Templates data for all document types

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'text' | 'spreadsheet' | 'presentation' | 'visual' | 'whiteboard' | 'questionnaire' | 'quiz';
  thumbnail: string; // emoji or icon
  color: string;
  content: any;
}

// ========== TEXT TEMPLATES ==========
const textTemplates: DocumentTemplate[] = [
  {
    id: 'text-blank', name: 'Document vierge', description: 'Commencer de zéro', category: 'Basique',
    type: 'text', thumbnail: '📄', color: '#3b82f6',
    content: { html: '' }
  },
  {
    id: 'text-cv-modern', name: 'CV Moderne', description: 'Curriculum vitae professionnel', category: 'Professionnel',
    type: 'text', thumbnail: '👤', color: '#8b5cf6',
    content: { html: `<h1 style="color:#2563eb;margin-bottom:4px">Prénom NOM</h1><p style="color:#6b7280;font-size:16px;margin-bottom:16px">Titre du poste · Ville, France · email@exemple.com · 06 XX XX XX XX</p><hr/><h2 style="color:#2563eb">Expériences professionnelles</h2><h3>Poste occupé — <em>Entreprise</em></h3><p style="color:#6b7280;font-size:13px">Janvier 2023 - Présent</p><ul><li>Réalisation clé n°1 avec résultats mesurables</li><li>Responsabilité principale et impact</li><li>Compétence technique utilisée</li></ul><h3>Poste précédent — <em>Entreprise</em></h3><p style="color:#6b7280;font-size:13px">Mars 2020 - Décembre 2022</p><ul><li>Mission accomplie avec succès</li><li>Collaboration inter-équipes</li></ul><hr/><h2 style="color:#2563eb">Formation</h2><h3>Diplôme — <em>Établissement</em></h3><p style="color:#6b7280;font-size:13px">2017 - 2020</p><hr/><h2 style="color:#2563eb">Compétences</h2><p><strong>Techniques :</strong> Compétence 1, Compétence 2, Compétence 3</p><p><strong>Langues :</strong> Français (natif), Anglais (courant)</p><p><strong>Soft skills :</strong> Leadership, Communication, Gestion de projet</p>` }
  },
  {
    id: 'text-cv-creative', name: 'CV Créatif', description: 'Design moderne et coloré', category: 'Professionnel',
    type: 'text', thumbnail: '🎨', color: '#ec4899',
    content: { html: `<div style="border-left:4px solid #ec4899;padding-left:20px"><h1 style="color:#ec4899;font-size:32px;margin-bottom:0">Prénom NOM</h1><p style="color:#9ca3af;font-size:18px;letter-spacing:2px;text-transform:uppercase">Designer · Créatif · Innovateur</p></div><br/><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px"><span style="background:#fce7f3;color:#ec4899;padding:4px 12px;border-radius:20px;font-size:13px">📍 Paris</span><span style="background:#fce7f3;color:#ec4899;padding:4px 12px;border-radius:20px;font-size:13px">📧 email@exemple.com</span><span style="background:#fce7f3;color:#ec4899;padding:4px 12px;border-radius:20px;font-size:13px">📱 06 XX XX XX XX</span></div><h2 style="color:#ec4899;border-bottom:2px solid #fce7f3;padding-bottom:8px">À propos</h2><p>Professionnel passionné avec X ans d'expérience dans [domaine]. Spécialisé dans [spécialité] avec une approche créative et orientée résultats.</p><h2 style="color:#ec4899;border-bottom:2px solid #fce7f3;padding-bottom:8px">Parcours</h2><h3>🔹 Poste — Entreprise <span style="color:#9ca3af;font-size:13px">| 2023 - Présent</span></h3><p>Description du poste et réalisations clés</p><h3>🔹 Poste — Entreprise <span style="color:#9ca3af;font-size:13px">| 2020 - 2023</span></h3><p>Description du poste et réalisations clés</p><h2 style="color:#ec4899;border-bottom:2px solid #fce7f3;padding-bottom:8px">Compétences</h2><p>⭐ Compétence 1 · ⭐ Compétence 2 · ⭐ Compétence 3 · ⭐ Compétence 4</p>` }
  },
  {
    id: 'text-lettre-motivation', name: 'Lettre de motivation', description: 'Candidature professionnelle', category: 'Professionnel',
    type: 'text', thumbnail: '✉️', color: '#059669',
    content: { html: `<p style="text-align:right">Prénom NOM<br/>Adresse<br/>Code postal, Ville<br/>Tél : 06 XX XX XX XX<br/>email@exemple.com</p><br/><p style="text-align:right">Ville, le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p><br/><p>Madame, Monsieur,</p><br/><p>Actuellement [situation actuelle], je me permets de vous adresser ma candidature pour le poste de [intitulé du poste] au sein de votre entreprise [nom de l'entreprise].</p><br/><p>Fort(e) d'une expérience de [X] années dans [domaine], j'ai développé des compétences solides en [compétence 1], [compétence 2] et [compétence 3]. Mon parcours m'a permis de [réalisation concrète].</p><br/><p>Votre entreprise m'attire particulièrement car [raison spécifique liée à l'entreprise]. Je suis convaincu(e) que mon profil correspond à vos attentes et que je saurai apporter une réelle valeur ajoutée à votre équipe.</p><br/><p>Je me tiens à votre disposition pour un entretien au cours duquel je pourrai vous exposer plus en détail mes motivations.</p><br/><p>Dans l'attente de votre réponse, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p><br/><p style="text-align:right;font-style:italic">Prénom NOM</p>` }
  },
  {
    id: 'text-rapport', name: 'Rapport professionnel', description: 'Rapport structuré avec sommaire', category: 'Professionnel',
    type: 'text', thumbnail: '📊', color: '#0ea5e9',
    content: { html: `<div style="text-align:center;padding:60px 0"><h1 style="font-size:36px;color:#1e293b">RAPPORT</h1><h2 style="color:#64748b;font-weight:normal;font-size:22px">[Titre du rapport]</h2><br/><p style="color:#94a3b8">Rédigé par : [Nom de l'auteur]</p><p style="color:#94a3b8">Date : ${new Date().toLocaleDateString('fr-FR')}</p><p style="color:#94a3b8">Destinataire : [Nom du destinataire]</p></div><hr/><h2>Sommaire</h2><ol><li>Introduction</li><li>Contexte et objectifs</li><li>Méthodologie</li><li>Résultats et analyse</li><li>Recommandations</li><li>Conclusion</li></ol><hr/><h2>1. Introduction</h2><p>Ce rapport présente [sujet du rapport]. Il a été réalisé dans le cadre de [contexte].</p><h2>2. Contexte et objectifs</h2><p>L'objectif principal de cette étude est de [objectif]. Les objectifs secondaires incluent :</p><ul><li>Objectif secondaire 1</li><li>Objectif secondaire 2</li></ul><h2>3. Méthodologie</h2><p>La méthodologie employée repose sur [description de la méthodologie].</p><h2>4. Résultats et analyse</h2><p>Les principaux résultats montrent que [résultats clés].</p><h2>5. Recommandations</h2><ol><li>Recommandation 1</li><li>Recommandation 2</li><li>Recommandation 3</li></ol><h2>6. Conclusion</h2><p>En conclusion, [synthèse finale].</p>` }
  },
  {
    id: 'text-compte-rendu', name: 'Compte-rendu de réunion', description: 'PV de réunion détaillé', category: 'Professionnel',
    type: 'text', thumbnail: '📝', color: '#f59e0b',
    content: { html: `<h1 style="color:#1e293b">Compte-rendu de réunion</h1><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:6px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:bold;width:30%">Date</td><td style="padding:6px 12px;border:1px solid #e2e8f0">${new Date().toLocaleDateString('fr-FR')}</td></tr><tr><td style="padding:6px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:bold">Heure</td><td style="padding:6px 12px;border:1px solid #e2e8f0">10h00 - 11h30</td></tr><tr><td style="padding:6px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:bold">Lieu</td><td style="padding:6px 12px;border:1px solid #e2e8f0">Salle de réunion / Visioconférence</td></tr><tr><td style="padding:6px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:bold">Participants</td><td style="padding:6px 12px;border:1px solid #e2e8f0">Nom 1, Nom 2, Nom 3</td></tr><tr><td style="padding:6px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:bold">Absents excusés</td><td style="padding:6px 12px;border:1px solid #e2e8f0">Nom 4</td></tr><tr><td style="padding:6px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:bold">Rédacteur</td><td style="padding:6px 12px;border:1px solid #e2e8f0">[Votre nom]</td></tr></table><h2>Ordre du jour</h2><ol><li>Point 1</li><li>Point 2</li><li>Point 3</li></ol><h2>Discussions</h2><h3>1. Point 1</h3><p>[Résumé des échanges]</p><h3>2. Point 2</h3><p>[Résumé des échanges]</p><h2>Décisions prises</h2><ul><li>✅ Décision 1</li><li>✅ Décision 2</li></ul><h2>Actions à mener</h2><table style="width:100%;border-collapse:collapse"><tr style="background:#f8fafc"><th style="padding:8px;border:1px solid #e2e8f0;text-align:left">Action</th><th style="padding:8px;border:1px solid #e2e8f0;text-align:left">Responsable</th><th style="padding:8px;border:1px solid #e2e8f0;text-align:left">Échéance</th></tr><tr><td style="padding:8px;border:1px solid #e2e8f0">Action 1</td><td style="padding:8px;border:1px solid #e2e8f0">Nom</td><td style="padding:8px;border:1px solid #e2e8f0">Date</td></tr><tr><td style="padding:8px;border:1px solid #e2e8f0">Action 2</td><td style="padding:8px;border:1px solid #e2e8f0">Nom</td><td style="padding:8px;border:1px solid #e2e8f0">Date</td></tr></table><br/><p><strong>Prochaine réunion :</strong> [Date et heure]</p>` }
  },
  {
    id: 'text-contrat', name: 'Contrat simple', description: 'Modèle de contrat de base', category: 'Juridique',
    type: 'text', thumbnail: '⚖️', color: '#6366f1',
    content: { html: `<div style="text-align:center"><h1 style="font-size:28px">CONTRAT DE [TYPE]</h1><p style="color:#6b7280">N° [Référence]</p></div><hr/><h2>ENTRE LES SOUSSIGNÉS</h2><p><strong>D'une part :</strong><br/>[Raison sociale / Nom], [forme juridique], au capital de [montant] €, immatriculée au RCS de [ville] sous le n° [numéro], dont le siège social est situé [adresse], représentée par [Nom du représentant], en qualité de [fonction].<br/>Ci-après dénommé(e) « le Prestataire »</p><p><strong>D'autre part :</strong><br/>[Nom du client / entreprise], [adresse].<br/>Ci-après dénommé(e) « le Client »</p><hr/><h2>ARTICLE 1 — OBJET</h2><p>Le présent contrat a pour objet de définir les conditions dans lesquelles [description de l'objet du contrat].</p><h2>ARTICLE 2 — DURÉE</h2><p>Le présent contrat est conclu pour une durée de [durée], à compter du [date de début].</p><h2>ARTICLE 3 — OBLIGATIONS DES PARTIES</h2><h3>3.1 Obligations du Prestataire</h3><ul><li>[Obligation 1]</li><li>[Obligation 2]</li></ul><h3>3.2 Obligations du Client</h3><ul><li>[Obligation 1]</li><li>[Obligation 2]</li></ul><h2>ARTICLE 4 — CONDITIONS FINANCIÈRES</h2><p>Le prix convenu est de [montant] € HT, soit [montant] € TTC.</p><h2>ARTICLE 5 — RÉSILIATION</h2><p>Chaque partie peut résilier le contrat moyennant un préavis de [durée].</p><br/><p>Fait en deux exemplaires originaux, à [Ville], le [Date].</p><br/><table style="width:100%"><tr><td style="width:50%;padding:20px;vertical-align:top"><p><strong>Le Prestataire</strong></p><br/><p style="color:#94a3b8">[Signature]</p></td><td style="width:50%;padding:20px;vertical-align:top"><p><strong>Le Client</strong></p><br/><p style="color:#94a3b8">[Signature]</p></td></tr></table>` }
  },
  {
    id: 'text-facture', name: 'Facture', description: 'Modèle de facture professionnelle', category: 'Comptabilité',
    type: 'text', thumbnail: '🧾', color: '#10b981',
    content: { html: `<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><h1 style="color:#10b981;margin-bottom:4px">FACTURE</h1><p style="color:#6b7280">N° FAC-${new Date().getFullYear()}-001</p><p style="color:#6b7280">Date : ${new Date().toLocaleDateString('fr-FR')}</p></div><div style="text-align:right"><h3>[Votre entreprise]</h3><p style="color:#6b7280;font-size:13px">Adresse<br/>Code postal, Ville<br/>SIRET : XXX XXX XXX XXXXX<br/>TVA : FR XX XXXXXXXXX</p></div></div><hr/><div style="display:flex;justify-content:space-between;margin:20px 0"><div style="background:#f0fdf4;padding:16px;border-radius:8px;flex:1;margin-right:16px"><h3 style="margin:0 0 8px;color:#10b981">Émetteur</h3><p style="margin:0;font-size:14px">[Votre nom]<br/>[Adresse]<br/>[Email]<br/>[Téléphone]</p></div><div style="background:#f8fafc;padding:16px;border-radius:8px;flex:1"><h3 style="margin:0 0 8px;color:#475569">Client</h3><p style="margin:0;font-size:14px">[Nom du client]<br/>[Adresse du client]<br/>[Email du client]</p></div></div><table style="width:100%;border-collapse:collapse;margin:20px 0"><tr style="background:#10b981;color:white"><th style="padding:10px;text-align:left">Description</th><th style="padding:10px;text-align:center;width:80px">Qté</th><th style="padding:10px;text-align:right;width:120px">Prix unit. HT</th><th style="padding:10px;text-align:right;width:120px">Total HT</th></tr><tr><td style="padding:10px;border-bottom:1px solid #e2e8f0">Prestation / Produit 1</td><td style="padding:10px;text-align:center;border-bottom:1px solid #e2e8f0">1</td><td style="padding:10px;text-align:right;border-bottom:1px solid #e2e8f0">500,00 €</td><td style="padding:10px;text-align:right;border-bottom:1px solid #e2e8f0">500,00 €</td></tr><tr><td style="padding:10px;border-bottom:1px solid #e2e8f0">Prestation / Produit 2</td><td style="padding:10px;text-align:center;border-bottom:1px solid #e2e8f0">2</td><td style="padding:10px;text-align:right;border-bottom:1px solid #e2e8f0">250,00 €</td><td style="padding:10px;text-align:right;border-bottom:1px solid #e2e8f0">500,00 €</td></tr></table><div style="text-align:right;margin-top:16px"><p>Total HT : <strong>1 000,00 €</strong></p><p>TVA (20%) : <strong>200,00 €</strong></p><p style="font-size:20px;color:#10b981">Total TTC : <strong>1 200,00 €</strong></p></div><hr/><p style="color:#6b7280;font-size:12px">Conditions de paiement : Paiement à 30 jours. En cas de retard, pénalité de 3 fois le taux d'intérêt légal. Indemnité forfaitaire de recouvrement : 40 €.</p>` }
  },
  {
    id: 'text-devis', name: 'Devis', description: 'Proposition commerciale', category: 'Comptabilité',
    type: 'text', thumbnail: '💰', color: '#f59e0b',
    content: { html: `<div style="display:flex;justify-content:space-between"><div><h1 style="color:#f59e0b">DEVIS</h1><p style="color:#6b7280">N° DEV-${new Date().getFullYear()}-001</p><p style="color:#6b7280">Date : ${new Date().toLocaleDateString('fr-FR')}</p><p style="color:#6b7280">Validité : 30 jours</p></div><div style="text-align:right"><h3>[Votre entreprise]</h3><p style="font-size:13px;color:#6b7280">[Adresse]<br/>[Tél] · [Email]</p></div></div><hr/><h2>Destinataire</h2><p>[Nom du client]<br/>[Adresse]</p><hr/><h2>Détail de la prestation</h2><table style="width:100%;border-collapse:collapse"><tr style="background:#fef3c7"><th style="padding:10px;text-align:left">Description</th><th style="padding:10px;text-align:center;width:80px">Qté</th><th style="padding:10px;text-align:right;width:120px">Prix unit.</th><th style="padding:10px;text-align:right;width:120px">Total</th></tr><tr><td style="padding:10px;border-bottom:1px solid #e2e8f0">Prestation 1</td><td style="padding:10px;text-align:center;border-bottom:1px solid #e2e8f0">1</td><td style="padding:10px;text-align:right;border-bottom:1px solid #e2e8f0">800 €</td><td style="padding:10px;text-align:right;border-bottom:1px solid #e2e8f0">800 €</td></tr></table><div style="text-align:right;margin:16px 0"><p style="font-size:20px"><strong>Total : 800,00 € HT</strong></p></div><hr/><p style="font-size:13px;color:#6b7280">Bon pour accord - Date et signature du client :</p><br/><br/>` }
  },
  {
    id: 'text-note-info', name: 'Note d\'information', description: 'Communication interne', category: 'Communication',
    type: 'text', thumbnail: '📢', color: '#6366f1',
    content: { html: `<div style="text-align:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:30px;border-radius:12px;margin-bottom:20px"><h1 style="color:white;margin:0">NOTE D'INFORMATION</h1><p style="color:rgba(255,255,255,0.8);margin:8px 0 0">[Titre de la note]</p></div><table style="width:100%;margin:16px 0"><tr><td style="padding:4px 0"><strong>De :</strong> [Émetteur]</td><td style="padding:4px 0"><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</td></tr><tr><td style="padding:4px 0"><strong>À :</strong> [Destinataires]</td><td style="padding:4px 0"><strong>Réf :</strong> NI-${new Date().getFullYear()}-001</td></tr></table><hr/><h2>Objet</h2><p>[Description de l'objet de la note]</p><h2>Contenu</h2><p>[Corps de la note avec les informations importantes]</p><h2>Actions attendues</h2><ul><li>Action 1 à mener avant le [date]</li><li>Action 2 à mener avant le [date]</li></ul><br/><p style="color:#6b7280;font-style:italic">Pour toute question, merci de contacter [nom] à l'adresse [email].</p>` }
  },
  {
    id: 'text-procedure', name: 'Procédure', description: 'Guide étape par étape', category: 'Documentation',
    type: 'text', thumbnail: '📋', color: '#0ea5e9',
    content: { html: `<h1 style="color:#0ea5e9">PROCÉDURE</h1><h2 style="color:#475569">[Titre de la procédure]</h2><table style="width:100%;margin:16px 0;border-collapse:collapse"><tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f0f9ff;width:30%"><strong>Réf :</strong></td><td style="padding:8px;border:1px solid #e2e8f0">PROC-001</td></tr><tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f0f9ff"><strong>Version :</strong></td><td style="padding:8px;border:1px solid #e2e8f0">1.0</td></tr><tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f0f9ff"><strong>Date :</strong></td><td style="padding:8px;border:1px solid #e2e8f0">${new Date().toLocaleDateString('fr-FR')}</td></tr><tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f0f9ff"><strong>Auteur :</strong></td><td style="padding:8px;border:1px solid #e2e8f0">[Nom]</td></tr></table><h2>1. Objectif</h2><p>Cette procédure décrit [objectif].</p><h2>2. Périmètre</h2><p>Applicable à [périmètre d'application].</p><h2>3. Étapes</h2><h3>Étape 1 : [Titre]</h3><p>📌 [Description détaillée]</p><h3>Étape 2 : [Titre]</h3><p>📌 [Description détaillée]</p><h3>Étape 3 : [Titre]</h3><p>📌 [Description détaillée]</p><h2>4. Points d'attention</h2><blockquote>⚠️ [Point de vigilance important]</blockquote>` }
  },
  {
    id: 'text-newsletter', name: 'Newsletter', description: 'Email d\'actualités', category: 'Communication',
    type: 'text', thumbnail: '📰', color: '#dc2626',
    content: { html: `<div style="text-align:center;padding:40px;background:linear-gradient(135deg,#dc2626,#f97316);border-radius:12px;margin-bottom:20px"><h1 style="color:white;margin:0;font-size:32px">📬 Newsletter</h1><p style="color:rgba(255,255,255,0.9);font-size:16px">[Nom de votre entreprise] — ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p></div><h2>🔥 À la une</h2><p>[Article principal — résumé accrocheur]</p><hr/><h2>📢 Actualités</h2><h3>[Actualité 1]</h3><p>[Résumé court]</p><h3>[Actualité 2]</h3><p>[Résumé court]</p><hr/><h2>💡 Le conseil du mois</h2><blockquote style="background:#fef2f2;padding:16px;border-radius:8px;border-left:4px solid #dc2626">[Conseil ou astuce utile pour vos lecteurs]</blockquote><hr/><h2>📅 Événements à venir</h2><ul><li><strong>[Date]</strong> — [Événement 1]</li><li><strong>[Date]</strong> — [Événement 2]</li></ul><br/><div style="text-align:center;padding:20px;background:#f8fafc;border-radius:8px"><p>Suivez-nous sur nos réseaux sociaux !</p><p style="color:#6b7280;font-size:13px">Pour vous désabonner, cliquez ici.</p></div>` }
  },
];

// ========== SPREADSHEET TEMPLATES ==========
const spreadsheetTemplates: DocumentTemplate[] = [
  {
    id: 'sheet-blank', name: 'Feuille vierge', description: 'Tableur vide', category: 'Basique',
    type: 'spreadsheet', thumbnail: '📊', color: '#22c55e',
    content: { cells: {}, numRows: 50, numCols: 26 }
  },
  {
    id: 'sheet-budget', name: 'Budget mensuel', description: 'Suivi de budget personnel ou entreprise', category: 'Finance',
    type: 'spreadsheet', thumbnail: '💰', color: '#10b981',
    content: {
      cells: {
        'A1': { value: 'BUDGET MENSUEL', bold: true, bgColor: '#dcfce7', textColor: '#166534' },
        'B1': { value: '', bgColor: '#dcfce7' }, 'C1': { value: '', bgColor: '#dcfce7' },
        'A3': { value: 'REVENUS', bold: true, bgColor: '#f0fdf4', textColor: '#166534' },
        'B3': { value: 'Montant', bold: true, bgColor: '#f0fdf4' },
        'C3': { value: 'Notes', bold: true, bgColor: '#f0fdf4' },
        'A4': { value: 'Salaire' }, 'B4': { value: '3000' },
        'A5': { value: 'Revenus secondaires' }, 'B5': { value: '500' },
        'A6': { value: 'Autres' }, 'B6': { value: '0' },
        'A7': { value: 'TOTAL REVENUS', bold: true }, 'B7': { formula: '=SUM(B4:B6)', value: '', bold: true },
        'A9': { value: 'DÉPENSES', bold: true, bgColor: '#fef2f2', textColor: '#991b1b' },
        'B9': { value: 'Montant', bold: true, bgColor: '#fef2f2' },
        'C9': { value: 'Catégorie', bold: true, bgColor: '#fef2f2' },
        'A10': { value: 'Loyer' }, 'B10': { value: '800' }, 'C10': { value: 'Logement' },
        'A11': { value: 'Électricité/Gaz' }, 'B11': { value: '120' }, 'C11': { value: 'Logement' },
        'A12': { value: 'Alimentation' }, 'B12': { value: '400' }, 'C12': { value: 'Quotidien' },
        'A13': { value: 'Transport' }, 'B13': { value: '75' }, 'C13': { value: 'Déplacement' },
        'A14': { value: 'Assurances' }, 'B14': { value: '150' }, 'C14': { value: 'Obligatoire' },
        'A15': { value: 'Téléphone/Internet' }, 'B15': { value: '60' }, 'C15': { value: 'Communication' },
        'A16': { value: 'Loisirs' }, 'B16': { value: '200' }, 'C16': { value: 'Personnel' },
        'A17': { value: 'Épargne' }, 'B17': { value: '300' }, 'C17': { value: 'Épargne' },
        'A18': { value: 'Divers' }, 'B18': { value: '100' },
        'A19': { value: 'TOTAL DÉPENSES', bold: true }, 'B19': { formula: '=SUM(B10:B18)', value: '', bold: true },
        'A21': { value: 'SOLDE', bold: true, bgColor: '#dbeafe', textColor: '#1e40af' },
        'B21': { formula: '=B7-B19', value: '', bold: true, bgColor: '#dbeafe', textColor: '#1e40af' },
      },
      numRows: 30, numCols: 10
    }
  },
  {
    id: 'sheet-suivi-notes', name: 'Suivi des notes', description: 'Relevé de notes par étudiant', category: 'Éducation',
    type: 'spreadsheet', thumbnail: '🎓', color: '#6366f1',
    content: {
      cells: {
        'A1': { value: 'SUIVI DES NOTES', bold: true, bgColor: '#e0e7ff', textColor: '#3730a3' },
        'A3': { value: 'Étudiant', bold: true, bgColor: '#f1f5f9' },
        'B3': { value: 'Matière 1', bold: true, bgColor: '#f1f5f9' },
        'C3': { value: 'Matière 2', bold: true, bgColor: '#f1f5f9' },
        'D3': { value: 'Matière 3', bold: true, bgColor: '#f1f5f9' },
        'E3': { value: 'Matière 4', bold: true, bgColor: '#f1f5f9' },
        'F3': { value: 'Moyenne', bold: true, bgColor: '#dbeafe', textColor: '#1e40af' },
        'A4': { value: 'Étudiant 1' }, 'B4': { value: '15' }, 'C4': { value: '12' }, 'D4': { value: '14' }, 'E4': { value: '16' },
        'F4': { formula: '=AVERAGE(B4:E4)', value: '' },
        'A5': { value: 'Étudiant 2' }, 'B5': { value: '13' }, 'C5': { value: '17' }, 'D5': { value: '11' }, 'E5': { value: '14' },
        'F5': { formula: '=AVERAGE(B5:E5)', value: '' },
        'A6': { value: 'Étudiant 3' }, 'B6': { value: '18' }, 'C6': { value: '15' }, 'D6': { value: '16' }, 'E6': { value: '19' },
        'F6': { formula: '=AVERAGE(B6:E6)', value: '' },
        'A8': { value: 'Moyenne classe', bold: true }, 
        'B8': { formula: '=AVERAGE(B4:B6)', value: '', bold: true },
        'C8': { formula: '=AVERAGE(C4:C6)', value: '', bold: true },
        'D8': { formula: '=AVERAGE(D4:D6)', value: '', bold: true },
        'E8': { formula: '=AVERAGE(E4:E6)', value: '', bold: true },
      },
      numRows: 30, numCols: 10
    }
  },
  {
    id: 'sheet-planning', name: 'Planning hebdomadaire', description: 'Organisation de la semaine', category: 'Organisation',
    type: 'spreadsheet', thumbnail: '📅', color: '#0ea5e9',
    content: {
      cells: {
        'A1': { value: 'PLANNING HEBDOMADAIRE', bold: true, bgColor: '#dbeafe', textColor: '#1e40af' },
        'A3': { value: 'Horaire', bold: true, bgColor: '#f1f5f9' },
        'B3': { value: 'Lundi', bold: true, bgColor: '#dbeafe' },
        'C3': { value: 'Mardi', bold: true, bgColor: '#dcfce7' },
        'D3': { value: 'Mercredi', bold: true, bgColor: '#fef3c7' },
        'E3': { value: 'Jeudi', bold: true, bgColor: '#fce7f3' },
        'F3': { value: 'Vendredi', bold: true, bgColor: '#e0e7ff' },
        'A4': { value: '08:00 - 09:00', bgColor: '#f8fafc' },
        'A5': { value: '09:00 - 10:00', bgColor: '#f8fafc' },
        'A6': { value: '10:00 - 11:00', bgColor: '#f8fafc' },
        'A7': { value: '11:00 - 12:00', bgColor: '#f8fafc' },
        'A8': { value: '12:00 - 13:00', bgColor: '#fef3c7' }, 'B8': { value: 'Pause déjeuner', bgColor: '#fef3c7' },
        'A9': { value: '13:00 - 14:00', bgColor: '#f8fafc' },
        'A10': { value: '14:00 - 15:00', bgColor: '#f8fafc' },
        'A11': { value: '15:00 - 16:00', bgColor: '#f8fafc' },
        'A12': { value: '16:00 - 17:00', bgColor: '#f8fafc' },
        'A13': { value: '17:00 - 18:00', bgColor: '#f8fafc' },
      },
      numRows: 20, numCols: 7
    }
  },
  {
    id: 'sheet-inventaire', name: 'Inventaire', description: 'Gestion de stock', category: 'Gestion',
    type: 'spreadsheet', thumbnail: '📦', color: '#f59e0b',
    content: {
      cells: {
        'A1': { value: 'INVENTAIRE', bold: true, bgColor: '#fef3c7', textColor: '#92400e' },
        'A3': { value: 'Référence', bold: true, bgColor: '#f1f5f9' },
        'B3': { value: 'Désignation', bold: true, bgColor: '#f1f5f9' },
        'C3': { value: 'Catégorie', bold: true, bgColor: '#f1f5f9' },
        'D3': { value: 'Qté en stock', bold: true, bgColor: '#f1f5f9' },
        'E3': { value: 'Prix unitaire', bold: true, bgColor: '#f1f5f9' },
        'F3': { value: 'Valeur totale', bold: true, bgColor: '#fef3c7' },
        'A4': { value: 'REF-001' }, 'B4': { value: 'Produit A' }, 'C4': { value: 'Catégorie 1' },
        'D4': { value: '150' }, 'E4': { value: '25' }, 'F4': { formula: '=D4*E4', value: '' },
        'A5': { value: 'REF-002' }, 'B5': { value: 'Produit B' }, 'C5': { value: 'Catégorie 1' },
        'D5': { value: '80' }, 'E5': { value: '42' }, 'F5': { formula: '=D5*E5', value: '' },
        'A6': { value: 'REF-003' }, 'B6': { value: 'Produit C' }, 'C6': { value: 'Catégorie 2' },
        'D6': { value: '200' }, 'E6': { value: '15' }, 'F6': { formula: '=D6*E6', value: '' },
        'A8': { value: 'TOTAL', bold: true },
        'D8': { formula: '=SUM(D4:D6)', value: '', bold: true },
        'F8': { formula: '=SUM(F4:F6)', value: '', bold: true, bgColor: '#fef3c7' },
      },
      numRows: 30, numCols: 10
    }
  },
  {
    id: 'sheet-facturation', name: 'Suivi de facturation', description: 'Suivi des factures émises', category: 'Finance',
    type: 'spreadsheet', thumbnail: '🧾', color: '#10b981',
    content: {
      cells: {
        'A1': { value: 'SUIVI FACTURATION', bold: true, bgColor: '#dcfce7', textColor: '#166534' },
        'A3': { value: 'N° Facture', bold: true, bgColor: '#f1f5f9' },
        'B3': { value: 'Client', bold: true, bgColor: '#f1f5f9' },
        'C3': { value: 'Date', bold: true, bgColor: '#f1f5f9' },
        'D3': { value: 'Montant HT', bold: true, bgColor: '#f1f5f9' },
        'E3': { value: 'TVA', bold: true, bgColor: '#f1f5f9' },
        'F3': { value: 'TTC', bold: true, bgColor: '#f1f5f9' },
        'G3': { value: 'Statut', bold: true, bgColor: '#f1f5f9' },
        'A4': { value: 'FAC-001' }, 'B4': { value: 'Client A' }, 'C4': { value: '01/01/2025' },
        'D4': { value: '1000' }, 'E4': { formula: '=D4*0.2', value: '' }, 'F4': { formula: '=D4+E4', value: '' },
        'G4': { value: 'Payée', bgColor: '#dcfce7', textColor: '#166534' },
        'A5': { value: 'FAC-002' }, 'B5': { value: 'Client B' }, 'C5': { value: '15/01/2025' },
        'D5': { value: '2500' }, 'E5': { formula: '=D5*0.2', value: '' }, 'F5': { formula: '=D5+E5', value: '' },
        'G5': { value: 'En attente', bgColor: '#fef3c7', textColor: '#92400e' },
      },
      numRows: 30, numCols: 10
    }
  },
  {
    id: 'sheet-suivi-projet', name: 'Suivi de projet', description: 'Tâches, responsables, échéances', category: 'Gestion',
    type: 'spreadsheet', thumbnail: '🎯', color: '#8b5cf6',
    content: {
      cells: {
        'A1': { value: 'SUIVI DE PROJET', bold: true, bgColor: '#f3e8ff', textColor: '#6b21a8' },
        'A3': { value: 'Tâche', bold: true, bgColor: '#f1f5f9' },
        'B3': { value: 'Responsable', bold: true, bgColor: '#f1f5f9' },
        'C3': { value: 'Priorité', bold: true, bgColor: '#f1f5f9' },
        'D3': { value: 'Statut', bold: true, bgColor: '#f1f5f9' },
        'E3': { value: 'Début', bold: true, bgColor: '#f1f5f9' },
        'F3': { value: 'Échéance', bold: true, bgColor: '#f1f5f9' },
        'G3': { value: '% Avancement', bold: true, bgColor: '#f1f5f9' },
        'A4': { value: 'Tâche 1' }, 'B4': { value: 'Nom' }, 'C4': { value: 'Haute', bgColor: '#fef2f2', textColor: '#dc2626' },
        'D4': { value: 'En cours', bgColor: '#dbeafe' }, 'E4': { value: '01/02' }, 'F4': { value: '15/02' }, 'G4': { value: '60' },
        'A5': { value: 'Tâche 2' }, 'B5': { value: 'Nom' }, 'C5': { value: 'Moyenne', bgColor: '#fef3c7', textColor: '#f59e0b' },
        'D5': { value: 'À faire', bgColor: '#f1f5f9' }, 'E5': { value: '10/02' }, 'F5': { value: '28/02' }, 'G5': { value: '0' },
        'A6': { value: 'Tâche 3' }, 'B6': { value: 'Nom' }, 'C6': { value: 'Basse', bgColor: '#dcfce7', textColor: '#16a34a' },
        'D6': { value: 'Terminée', bgColor: '#dcfce7' }, 'E6': { value: '01/01' }, 'F6': { value: '20/01' }, 'G6': { value: '100' },
      },
      numRows: 30, numCols: 10
    }
  },
  {
    id: 'sheet-contacts', name: 'Répertoire contacts', description: 'Base de données de contacts', category: 'CRM',
    type: 'spreadsheet', thumbnail: '📇', color: '#06b6d4',
    content: {
      cells: {
        'A1': { value: 'RÉPERTOIRE CONTACTS', bold: true, bgColor: '#cffafe', textColor: '#0e7490' },
        'A3': { value: 'Nom', bold: true, bgColor: '#f1f5f9' },
        'B3': { value: 'Prénom', bold: true, bgColor: '#f1f5f9' },
        'C3': { value: 'Email', bold: true, bgColor: '#f1f5f9' },
        'D3': { value: 'Téléphone', bold: true, bgColor: '#f1f5f9' },
        'E3': { value: 'Entreprise', bold: true, bgColor: '#f1f5f9' },
        'F3': { value: 'Ville', bold: true, bgColor: '#f1f5f9' },
      },
      numRows: 50, numCols: 10
    }
  },
];

// ========== PRESENTATION TEMPLATES ==========
const presentationTemplates: DocumentTemplate[] = [
  {
    id: 'pres-blank', name: 'Présentation vierge', description: 'Diapositive vide', category: 'Basique',
    type: 'presentation', thumbnail: '📽️', color: '#f59e0b',
    content: { slides: [{ id: '1', elements: [], background: '#ffffff' }] }
  },
  {
    id: 'pres-pitch', name: 'Pitch Deck', description: 'Présentation startup/projet', category: 'Business',
    type: 'presentation', thumbnail: '🚀', color: '#3b82f6',
    content: { slides: [
      { id: '1', elements: [
        { id: 't1', type: 'shape', x: 0, y: 0, width: 960, height: 540, backgroundColor: '#1e40af', shape: 'rectangle' },
        { id: 't2', type: 'text', x: 80, y: 120, width: 800, height: 80, content: 'Nom du Projet', fontSize: 56, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
        { id: 't3', type: 'text', x: 80, y: 220, width: 800, height: 40, content: 'Tagline — La solution qui change tout', fontSize: 24, color: '#93c5fd', textAlign: 'center' },
        { id: 't4', type: 'text', x: 300, y: 400, width: 360, height: 30, content: 'Prénom NOM · Date', fontSize: 18, color: '#bfdbfe', textAlign: 'center' },
      ], background: '#1e40af' },
      { id: '2', elements: [
        { id: 'p1', type: 'text', x: 60, y: 30, width: 840, height: 50, content: '🎯 Le Problème', fontSize: 36, fontWeight: 'bold', color: '#1e293b' },
        { id: 'p2', type: 'text', x: 60, y: 100, width: 840, height: 120, content: '• 80% des entreprises font face à [problème]\n• Le coût moyen est de [X]€ par an\n• Aucune solution existante ne résout efficacement ce défi', fontSize: 22, color: '#475569' },
        { id: 'p3', type: 'shape', x: 60, y: 260, width: 380, height: 200, backgroundColor: '#fee2e2', shape: 'rounded' },
        { id: 'p4', type: 'text', x: 80, y: 280, width: 340, height: 160, content: '💔 Impact\n\nPerte de temps\nCoûts élevés\nInsatisfaction', fontSize: 18, color: '#991b1b' },
      ], background: '#ffffff' },
      { id: '3', elements: [
        { id: 's1', type: 'text', x: 60, y: 30, width: 840, height: 50, content: '💡 Notre Solution', fontSize: 36, fontWeight: 'bold', color: '#1e293b' },
        { id: 's2', type: 'text', x: 60, y: 100, width: 840, height: 80, content: '[Nom du produit] est une plateforme qui [description claire de la solution en une phrase].', fontSize: 22, color: '#475569' },
        { id: 's3', type: 'shape', x: 60, y: 210, width: 260, height: 140, backgroundColor: '#dbeafe', shape: 'rounded' },
        { id: 's4', type: 'text', x: 80, y: 230, width: 220, height: 100, content: '⚡ Rapide\nDéploiement en 5 min', fontSize: 16, color: '#1e40af', textAlign: 'center' },
        { id: 's5', type: 'shape', x: 350, y: 210, width: 260, height: 140, backgroundColor: '#dcfce7', shape: 'rounded' },
        { id: 's6', type: 'text', x: 370, y: 230, width: 220, height: 100, content: '💰 Économique\n-50% de coûts', fontSize: 16, color: '#166534', textAlign: 'center' },
        { id: 's7', type: 'shape', x: 640, y: 210, width: 260, height: 140, backgroundColor: '#f3e8ff', shape: 'rounded' },
        { id: 's8', type: 'text', x: 660, y: 230, width: 220, height: 100, content: '🔒 Sécurisé\nConforme RGPD', fontSize: 16, color: '#6b21a8', textAlign: 'center' },
      ], background: '#ffffff' },
      { id: '4', elements: [
        { id: 'c1', type: 'shape', x: 0, y: 0, width: 960, height: 540, backgroundColor: '#0f172a', shape: 'rectangle' },
        { id: 'c2', type: 'text', x: 80, y: 160, width: 800, height: 60, content: 'Merci !', fontSize: 48, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
        { id: 'c3', type: 'text', x: 80, y: 240, width: 800, height: 40, content: 'Questions ? Contactez-nous à email@exemple.com', fontSize: 20, color: '#94a3b8', textAlign: 'center' },
      ], background: '#0f172a' },
    ] }
  },
  {
    id: 'pres-formation', name: 'Support de formation', description: 'Cours structuré', category: 'Éducation',
    type: 'presentation', thumbnail: '🎓', color: '#8b5cf6',
    content: { slides: [
      { id: '1', elements: [
        { id: 'f1', type: 'shape', x: 0, y: 0, width: 960, height: 540, backgroundColor: '#7c3aed', shape: 'rectangle' },
        { id: 'f2', type: 'text', x: 60, y: 100, width: 840, height: 80, content: 'Titre de la Formation', fontSize: 48, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
        { id: 'f3', type: 'text', x: 60, y: 200, width: 840, height: 40, content: 'Module 1 — Introduction', fontSize: 24, color: '#c4b5fd', textAlign: 'center' },
        { id: 'f4', type: 'text', x: 60, y: 420, width: 840, height: 30, content: 'Formateur : [Nom] · Durée : 2h · Date : [Date]', fontSize: 16, color: '#ddd6fe', textAlign: 'center' },
      ], background: '#7c3aed' },
      { id: '2', elements: [
        { id: 'o1', type: 'text', x: 60, y: 30, width: 840, height: 50, content: '📋 Objectifs du module', fontSize: 32, fontWeight: 'bold', color: '#1e293b' },
        { id: 'o2', type: 'shape', x: 60, y: 100, width: 400, height: 50, backgroundColor: '#f3e8ff', shape: 'rounded' },
        { id: 'o3', type: 'text', x: 80, y: 110, width: 360, height: 30, content: '✅ Objectif 1 : Comprendre [concept]', fontSize: 18, color: '#6b21a8' },
        { id: 'o4', type: 'shape', x: 60, y: 165, width: 400, height: 50, backgroundColor: '#f3e8ff', shape: 'rounded' },
        { id: 'o5', type: 'text', x: 80, y: 175, width: 360, height: 30, content: '✅ Objectif 2 : Maîtriser [technique]', fontSize: 18, color: '#6b21a8' },
        { id: 'o6', type: 'shape', x: 60, y: 230, width: 400, height: 50, backgroundColor: '#f3e8ff', shape: 'rounded' },
        { id: 'o7', type: 'text', x: 80, y: 240, width: 360, height: 30, content: '✅ Objectif 3 : Appliquer [méthode]', fontSize: 18, color: '#6b21a8' },
      ], background: '#ffffff' },
      { id: '3', elements: [
        { id: 'c1', type: 'text', x: 60, y: 30, width: 840, height: 50, content: '📖 Contenu', fontSize: 32, fontWeight: 'bold', color: '#1e293b' },
        { id: 'c2', type: 'text', x: 60, y: 100, width: 840, height: 350, content: '1. Définition et concepts clés\n\n2. Exemples pratiques\n\n3. Étude de cas\n\n4. Exercice pratique\n\n5. Questions & Réponses', fontSize: 22, color: '#475569' },
      ], background: '#ffffff' },
    ] }
  },
  {
    id: 'pres-rapport-trim', name: 'Rapport trimestriel', description: 'Bilan et résultats', category: 'Business',
    type: 'presentation', thumbnail: '📈', color: '#10b981',
    content: { slides: [
      { id: '1', elements: [
        { id: 'r1', type: 'shape', x: 0, y: 0, width: 480, height: 540, backgroundColor: '#059669', shape: 'rectangle' },
        { id: 'r2', type: 'text', x: 40, y: 180, width: 400, height: 80, content: 'Rapport\nTrimestriel', fontSize: 44, fontWeight: 'bold', color: '#ffffff' },
        { id: 'r3', type: 'text', x: 40, y: 280, width: 400, height: 30, content: 'Q1 2025', fontSize: 24, color: '#a7f3d0' },
        { id: 'r4', type: 'text', x: 520, y: 240, width: 400, height: 60, content: '[Nom de l\'entreprise]\nRésultats et perspectives', fontSize: 22, color: '#475569', textAlign: 'center' },
      ], background: '#ffffff' },
      { id: '2', elements: [
        { id: 'k1', type: 'text', x: 60, y: 30, width: 840, height: 50, content: 'Chiffres clés', fontSize: 32, fontWeight: 'bold', color: '#1e293b' },
        { id: 'k2', type: 'shape', x: 60, y: 100, width: 200, height: 150, backgroundColor: '#dcfce7', shape: 'rounded' },
        { id: 'k3', type: 'text', x: 80, y: 120, width: 160, height: 110, content: '📈\n+25%\nCroissance', fontSize: 18, color: '#166534', textAlign: 'center' },
        { id: 'k4', type: 'shape', x: 290, y: 100, width: 200, height: 150, backgroundColor: '#dbeafe', shape: 'rounded' },
        { id: 'k5', type: 'text', x: 310, y: 120, width: 160, height: 110, content: '💰\n1.2M€\nCA', fontSize: 18, color: '#1e40af', textAlign: 'center' },
        { id: 'k6', type: 'shape', x: 520, y: 100, width: 200, height: 150, backgroundColor: '#fef3c7', shape: 'rounded' },
        { id: 'k7', type: 'text', x: 540, y: 120, width: 160, height: 110, content: '👥\n50\nClients', fontSize: 18, color: '#92400e', textAlign: 'center' },
        { id: 'k8', type: 'shape', x: 750, y: 100, width: 200, height: 150, backgroundColor: '#f3e8ff', shape: 'rounded' },
        { id: 'k9', type: 'text', x: 770, y: 120, width: 160, height: 110, content: '⭐\n4.8/5\nSatisfaction', fontSize: 18, color: '#6b21a8', textAlign: 'center' },
      ], background: '#ffffff' },
    ] }
  },
  {
    id: 'pres-soutenance', name: 'Soutenance', description: 'Soutenance de stage ou mémoire', category: 'Éducation',
    type: 'presentation', thumbnail: '🎤', color: '#dc2626',
    content: { slides: [
      { id: '1', elements: [
        { id: 's1', type: 'shape', x: 0, y: 0, width: 960, height: 540, backgroundColor: '#1e293b', shape: 'rectangle' },
        { id: 's2', type: 'text', x: 60, y: 80, width: 840, height: 70, content: 'Titre du Mémoire / Stage', fontSize: 40, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
        { id: 's3', type: 'shape', x: 380, y: 170, width: 200, height: 4, backgroundColor: '#ef4444', shape: 'rectangle' },
        { id: 's4', type: 'text', x: 60, y: 200, width: 840, height: 40, content: 'Sous-titre ou spécialité', fontSize: 22, color: '#94a3b8', textAlign: 'center' },
        { id: 's5', type: 'text', x: 60, y: 340, width: 840, height: 80, content: 'Prénom NOM\nFormation · Année 2024-2025\nTuteur : [Nom du tuteur]', fontSize: 18, color: '#cbd5e1', textAlign: 'center' },
      ], background: '#1e293b' },
      { id: '2', elements: [
        { id: 'p1', type: 'text', x: 60, y: 30, width: 840, height: 50, content: 'Plan de la présentation', fontSize: 32, fontWeight: 'bold', color: '#1e293b' },
        { id: 'p2', type: 'text', x: 80, y: 100, width: 800, height: 350, content: '1. Contexte et entreprise d\'accueil\n\n2. Missions et objectifs\n\n3. Méthodologie\n\n4. Réalisations\n\n5. Bilan et perspectives\n\n6. Questions', fontSize: 22, color: '#475569' },
      ], background: '#ffffff' },
    ] }
  },
  {
    id: 'pres-team', name: 'Présentation d\'équipe', description: 'Présenter les membres', category: 'RH',
    type: 'presentation', thumbnail: '👥', color: '#06b6d4',
    content: { slides: [
      { id: '1', elements: [
        { id: 'e1', type: 'shape', x: 0, y: 0, width: 960, height: 540, backgroundColor: '#0891b2', shape: 'rectangle' },
        { id: 'e2', type: 'text', x: 80, y: 200, width: 800, height: 60, content: 'Notre Équipe', fontSize: 48, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
        { id: 'e3', type: 'text', x: 80, y: 280, width: 800, height: 30, content: 'Les talents qui font la différence', fontSize: 22, color: '#a5f3fc', textAlign: 'center' },
      ], background: '#0891b2' },
      { id: '2', elements: [
        { id: 'm1', type: 'text', x: 60, y: 30, width: 840, height: 40, content: 'Les membres', fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
        { id: 'm2', type: 'shape', x: 60, y: 90, width: 200, height: 250, backgroundColor: '#f0f9ff', shape: 'rounded' },
        { id: 'm3', type: 'text', x: 80, y: 160, width: 160, height: 160, content: '👤\nPrénom NOM\nPoste\n📧 email', fontSize: 14, color: '#0e7490', textAlign: 'center' },
        { id: 'm4', type: 'shape', x: 290, y: 90, width: 200, height: 250, backgroundColor: '#f0f9ff', shape: 'rounded' },
        { id: 'm5', type: 'text', x: 310, y: 160, width: 160, height: 160, content: '👤\nPrénom NOM\nPoste\n📧 email', fontSize: 14, color: '#0e7490', textAlign: 'center' },
        { id: 'm6', type: 'shape', x: 520, y: 90, width: 200, height: 250, backgroundColor: '#f0f9ff', shape: 'rounded' },
        { id: 'm7', type: 'text', x: 540, y: 160, width: 160, height: 160, content: '👤\nPrénom NOM\nPoste\n📧 email', fontSize: 14, color: '#0e7490', textAlign: 'center' },
      ], background: '#ffffff' },
    ] }
  },
];

// ========== VISUAL TEMPLATES ==========
const visualTemplates: DocumentTemplate[] = [
  {
    id: 'visual-blank', name: 'Canvas vierge', description: 'Design libre', category: 'Basique',
    type: 'visual', thumbnail: '🎨', color: '#ec4899',
    content: { width: 1080, height: 1080, background: '#ffffff', elements: [] }
  },
  {
    id: 'visual-post-insta', name: 'Post Instagram', description: 'Post carré pour Instagram', category: 'Réseaux sociaux',
    type: 'visual', thumbnail: '📸', color: '#e11d48',
    content: {
      width: 1080, height: 1080, background: '#1e293b',
      elements: [
        { id: 'bg', type: 'rectangle', x: 0, y: 0, width: 1080, height: 1080, backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', opacity: 1, zIndex: 0 },
        { id: 'card', type: 'rectangle', x: 80, y: 200, width: 920, height: 500, backgroundColor: '#ffffff', borderRadius: 24, opacity: 0.95, zIndex: 1 },
        { id: 'title', type: 'text', x: 140, y: 280, width: 800, height: 100, content: 'Titre accrocheur\npour Instagram', fontSize: 56, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', zIndex: 2 },
        { id: 'sub', type: 'text', x: 140, y: 420, width: 800, height: 60, content: 'Sous-titre avec une information clé', fontSize: 28, color: '#6b7280', textAlign: 'center', zIndex: 2 },
        { id: 'tag', type: 'text', x: 140, y: 520, width: 800, height: 40, content: '@votrecompte', fontSize: 22, color: '#8b5cf6', textAlign: 'center', zIndex: 2 },
        { id: 'emoji', type: 'text', x: 440, y: 60, width: 200, height: 120, content: '✨', fontSize: 96, textAlign: 'center', zIndex: 2 },
      ]
    }
  },
  {
    id: 'visual-story-insta', name: 'Story Instagram', description: 'Format vertical 9:16', category: 'Réseaux sociaux',
    type: 'visual', thumbnail: '📱', color: '#f97316',
    content: {
      width: 1080, height: 1920, background: '#0f172a',
      elements: [
        { id: 'topbar', type: 'rectangle', x: 0, y: 0, width: 1080, height: 200, backgroundColor: '#7c3aed', opacity: 1, zIndex: 0 },
        { id: 'toptext', type: 'text', x: 60, y: 80, width: 960, height: 60, content: '🔥 NOUVEAU', fontSize: 42, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', zIndex: 1 },
        { id: 'main', type: 'text', x: 80, y: 600, width: 920, height: 200, content: 'Votre message\nprincipal ici', fontSize: 64, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', zIndex: 1 },
        { id: 'desc', type: 'text', x: 120, y: 880, width: 840, height: 100, content: 'Description complémentaire avec détails', fontSize: 28, color: '#94a3b8', textAlign: 'center', zIndex: 1 },
        { id: 'cta', type: 'rectangle', x: 280, y: 1400, width: 520, height: 80, backgroundColor: '#7c3aed', borderRadius: 40, zIndex: 1 },
        { id: 'ctatext', type: 'text', x: 300, y: 1415, width: 480, height: 50, content: 'Swipe up ↑', fontSize: 28, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', zIndex: 2 },
      ]
    }
  },
  {
    id: 'visual-post-linkedin', name: 'Post LinkedIn', description: 'Post professionnel', category: 'Réseaux sociaux',
    type: 'visual', thumbnail: '💼', color: '#0077b5',
    content: {
      width: 1200, height: 627, background: '#ffffff',
      elements: [
        { id: 'sidebar', type: 'rectangle', x: 0, y: 0, width: 8, height: 627, backgroundColor: '#0077b5', zIndex: 0 },
        { id: 'title', type: 'text', x: 60, y: 60, width: 1080, height: 80, content: 'Titre professionnel percutant', fontSize: 42, fontWeight: 'bold', color: '#1e293b', zIndex: 1 },
        { id: 'body', type: 'text', x: 60, y: 170, width: 700, height: 200, content: '💡 Point clé n°1\n\n📊 Point clé n°2\n\n🎯 Point clé n°3', fontSize: 24, color: '#475569', zIndex: 1 },
        { id: 'statbox', type: 'rectangle', x: 800, y: 170, width: 340, height: 280, backgroundColor: '#f0f9ff', borderRadius: 16, zIndex: 1 },
        { id: 'stat', type: 'text', x: 820, y: 220, width: 300, height: 200, content: '📈\n+75%\nde résultat', fontSize: 32, fontWeight: 'bold', color: '#0077b5', textAlign: 'center', zIndex: 2 },
        { id: 'author', type: 'text', x: 60, y: 540, width: 600, height: 40, content: '👤 Votre Nom · Titre · #hashtag', fontSize: 18, color: '#94a3b8', zIndex: 1 },
      ]
    }
  },
  {
    id: 'visual-banniere-linkedin', name: 'Bannière LinkedIn', description: 'Photo de couverture', category: 'Réseaux sociaux',
    type: 'visual', thumbnail: '🖼️', color: '#0077b5',
    content: {
      width: 1584, height: 396, background: '#0f172a',
      elements: [
        { id: 'accent', type: 'rectangle', x: 0, y: 346, width: 1584, height: 50, backgroundColor: '#3b82f6', zIndex: 0 },
        { id: 'title', type: 'text', x: 100, y: 100, width: 900, height: 70, content: 'Prénom NOM', fontSize: 56, fontWeight: 'bold', color: '#ffffff', zIndex: 1 },
        { id: 'sub', type: 'text', x: 100, y: 180, width: 900, height: 40, content: 'Votre titre professionnel · Expert en [domaine]', fontSize: 24, color: '#94a3b8', zIndex: 1 },
        { id: 'tags', type: 'text', x: 100, y: 260, width: 900, height: 30, content: '🎯 Spécialité 1  ·  💡 Spécialité 2  ·  🚀 Spécialité 3', fontSize: 18, color: '#60a5fa', zIndex: 1 },
      ]
    }
  },
  {
    id: 'visual-youtube', name: 'Miniature YouTube', description: 'Thumbnail 16:9', category: 'Réseaux sociaux',
    type: 'visual', thumbnail: '▶️', color: '#dc2626',
    content: {
      width: 1280, height: 720, background: '#000000',
      elements: [
        { id: 'bg', type: 'rectangle', x: 0, y: 0, width: 1280, height: 720, backgroundColor: '#1e293b', zIndex: 0 },
        { id: 'title', type: 'text', x: 60, y: 180, width: 700, height: 200, content: 'TITRE\nACCROCHEUR', fontSize: 72, fontWeight: 'bold', color: '#ffffff', zIndex: 2 },
        { id: 'accent', type: 'rectangle', x: 60, y: 420, width: 300, height: 60, backgroundColor: '#dc2626', borderRadius: 8, zIndex: 1 },
        { id: 'sub', type: 'text', x: 80, y: 432, width: 260, height: 36, content: 'SOUS-TITRE', fontSize: 24, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', zIndex: 2 },
        { id: 'emoji', type: 'text', x: 900, y: 100, width: 300, height: 300, content: '🔥', fontSize: 200, textAlign: 'center', zIndex: 2 },
      ]
    }
  },
  {
    id: 'visual-flyer', name: 'Flyer A4', description: 'Affiche promotionnelle', category: 'Print',
    type: 'visual', thumbnail: '📃', color: '#8b5cf6',
    content: {
      width: 794, height: 1123, background: '#ffffff',
      elements: [
        { id: 'header', type: 'rectangle', x: 0, y: 0, width: 794, height: 300, backgroundColor: '#7c3aed', zIndex: 0 },
        { id: 'headertext', type: 'text', x: 60, y: 60, width: 674, height: 100, content: 'ÉVÉNEMENT\nSPÉCIAL', fontSize: 56, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', zIndex: 1 },
        { id: 'date', type: 'text', x: 60, y: 200, width: 674, height: 40, content: '📅 Samedi 15 Mars 2025 · 14h-18h', fontSize: 22, color: '#c4b5fd', textAlign: 'center', zIndex: 1 },
        { id: 'body', type: 'text', x: 80, y: 360, width: 634, height: 400, content: '✨ Point fort 1\nDescription courte\n\n🎯 Point fort 2\nDescription courte\n\n🎉 Point fort 3\nDescription courte', fontSize: 22, color: '#1e293b', zIndex: 1 },
        { id: 'cta', type: 'rectangle', x: 197, y: 850, width: 400, height: 70, backgroundColor: '#7c3aed', borderRadius: 35, zIndex: 1 },
        { id: 'ctatext', type: 'text', x: 217, y: 862, width: 360, height: 46, content: 'S\'inscrire maintenant', fontSize: 24, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', zIndex: 2 },
        { id: 'footer', type: 'text', x: 80, y: 1050, width: 634, height: 30, content: '📍 Adresse · 📧 email@exemple.com · 📱 06 XX XX XX XX', fontSize: 14, color: '#94a3b8', textAlign: 'center', zIndex: 1 },
      ]
    }
  },
  {
    id: 'visual-carte-visite', name: 'Carte de visite', description: 'Format standard', category: 'Print',
    type: 'visual', thumbnail: '💳', color: '#0ea5e9',
    content: {
      width: 1050, height: 600, background: '#ffffff',
      elements: [
        { id: 'sidebar', type: 'rectangle', x: 0, y: 0, width: 12, height: 600, backgroundColor: '#0ea5e9', zIndex: 0 },
        { id: 'name', type: 'text', x: 80, y: 120, width: 500, height: 60, content: 'Prénom NOM', fontSize: 38, fontWeight: 'bold', color: '#1e293b', zIndex: 1 },
        { id: 'title', type: 'text', x: 80, y: 190, width: 500, height: 30, content: 'Directeur · Consultant · Expert', fontSize: 18, color: '#0ea5e9', zIndex: 1 },
        { id: 'divider', type: 'rectangle', x: 80, y: 240, width: 100, height: 3, backgroundColor: '#0ea5e9', zIndex: 1 },
        { id: 'info', type: 'text', x: 80, y: 280, width: 500, height: 200, content: '📧 email@exemple.com\n📱 +33 6 XX XX XX XX\n🌐 www.votresite.com\n📍 Paris, France', fontSize: 16, color: '#64748b', zIndex: 1 },
        { id: 'logo', type: 'text', x: 750, y: 220, width: 200, height: 160, content: '🏢', fontSize: 100, textAlign: 'center', zIndex: 1 },
      ]
    }
  },
  {
    id: 'visual-quote', name: 'Citation inspirante', description: 'Visuel avec citation', category: 'Réseaux sociaux',
    type: 'visual', thumbnail: '💬', color: '#f59e0b',
    content: {
      width: 1080, height: 1080, background: '#fef3c7',
      elements: [
        { id: 'deco1', type: 'text', x: 80, y: 120, width: 200, height: 200, content: '"', fontSize: 200, color: '#f59e0b', opacity: 0.3, zIndex: 0 },
        { id: 'quote', type: 'text', x: 120, y: 320, width: 840, height: 250, content: 'La seule façon de faire\ndu bon travail, c\'est\nd\'aimer ce que vous faites.', fontSize: 48, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', zIndex: 1 },
        { id: 'author', type: 'text', x: 120, y: 620, width: 840, height: 40, content: '— Steve Jobs', fontSize: 24, color: '#92400e', textAlign: 'center', zIndex: 1 },
        { id: 'line', type: 'rectangle', x: 440, y: 580, width: 200, height: 3, backgroundColor: '#f59e0b', zIndex: 1 },
      ]
    }
  },
  {
    id: 'visual-promo', name: 'Promotion / Soldes', description: 'Offre commerciale', category: 'Marketing',
    type: 'visual', thumbnail: '🏷️', color: '#dc2626',
    content: {
      width: 1080, height: 1080, background: '#dc2626',
      elements: [
        { id: 'badge', type: 'circle', x: 290, y: 80, width: 500, height: 500, backgroundColor: '#ffffff', zIndex: 1 },
        { id: 'percent', type: 'text', x: 310, y: 150, width: 460, height: 300, content: '-50%', fontSize: 120, fontWeight: 'bold', color: '#dc2626', textAlign: 'center', zIndex: 2 },
        { id: 'sub', type: 'text', x: 310, y: 400, width: 460, height: 60, content: 'sur tout le site', fontSize: 28, color: '#991b1b', textAlign: 'center', zIndex: 2 },
        { id: 'title', type: 'text', x: 80, y: 640, width: 920, height: 80, content: 'SOLDES D\'ÉTÉ', fontSize: 64, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', zIndex: 1 },
        { id: 'dates', type: 'text', x: 80, y: 750, width: 920, height: 40, content: 'Du 25 juin au 22 juillet', fontSize: 24, color: '#fecaca', textAlign: 'center', zIndex: 1 },
        { id: 'cta', type: 'rectangle', x: 300, y: 860, width: 480, height: 70, backgroundColor: '#ffffff', borderRadius: 35, zIndex: 1 },
        { id: 'ctatext', type: 'text', x: 320, y: 874, width: 440, height: 42, content: 'J\'EN PROFITE →', fontSize: 26, fontWeight: 'bold', color: '#dc2626', textAlign: 'center', zIndex: 2 },
      ]
    }
  },
];

// ========== WHITEBOARD TEMPLATES ==========
const whiteboardTemplates: DocumentTemplate[] = [
  {
    id: 'wb-blank', name: 'Tableau blanc vierge', description: 'Canvas libre infini', category: 'Basique',
    type: 'whiteboard', thumbnail: '🖊️', color: '#06b6d4',
    content: { elements: [], background: '#ffffff', gridVisible: true }
  },
  {
    id: 'wb-blank-dark', name: 'Tableau noir', description: 'Canvas sombre pour craies', category: 'Basique',
    type: 'whiteboard', thumbnail: '🖤', color: '#1e293b',
    content: { elements: [], background: '#1e293b', gridVisible: false }
  },
  {
    id: 'wb-blank-dotted', name: 'Grille à points', description: 'Canvas avec grille pointillée', category: 'Basique',
    type: 'whiteboard', thumbnail: '⬜', color: '#94a3b8',
    content: { elements: [], background: '#f8fafc', gridVisible: true }
  },
  {
    id: 'wb-brainstorming', name: 'Brainstorming', description: 'Séance de remue-méninges', category: 'Créativité',
    type: 'whiteboard', thumbnail: '💡', color: '#f59e0b',
    content: {
      elements: [
        { id: 'title', type: 'text', x: 350, y: 30, width: 400, height: 50, content: '💡 BRAINSTORMING', fontSize: 32, fontWeight: 'bold', color: '#f59e0b', textAlign: 'center' },
        { id: 'topic', type: 'text', x: 400, y: 90, width: 300, height: 30, content: 'Sujet principal ici', fontSize: 18, color: '#64748b', textAlign: 'center' },
        { id: 's1', type: 'sticky', x: 100, y: 180, width: 180, height: 150, content: 'Idée 1', stickyColor: '#fef3c7' },
        { id: 's2', type: 'sticky', x: 320, y: 180, width: 180, height: 150, content: 'Idée 2', stickyColor: '#dbeafe' },
        { id: 's3', type: 'sticky', x: 540, y: 180, width: 180, height: 150, content: 'Idée 3', stickyColor: '#dcfce7' },
        { id: 's4', type: 'sticky', x: 760, y: 180, width: 180, height: 150, content: 'Idée 4', stickyColor: '#fce7f3' },
        { id: 's5', type: 'sticky', x: 100, y: 370, width: 180, height: 150, content: 'Idée 5', stickyColor: '#f3e8ff' },
        { id: 's6', type: 'sticky', x: 320, y: 370, width: 180, height: 150, content: 'Idée 6', stickyColor: '#fed7aa' },
        { id: 's7', type: 'sticky', x: 540, y: 370, width: 180, height: 150, content: 'Idée 7', stickyColor: '#fef3c7' },
        { id: 's8', type: 'sticky', x: 760, y: 370, width: 180, height: 150, content: 'Idée 8', stickyColor: '#dbeafe' },
      ],
      background: '#ffffff', gridVisible: false
    }
  },
  {
    id: 'wb-mindmap', name: 'Carte mentale', description: 'Mind map structurée', category: 'Créativité',
    type: 'whiteboard', thumbnail: '🧠', color: '#8b5cf6',
    content: {
      elements: [
        { id: 'center', type: 'circle', x: 400, y: 250, width: 200, height: 200, backgroundColor: '#8b5cf6', borderRadius: 100 },
        { id: 'centertext', type: 'text', x: 420, y: 320, width: 160, height: 40, content: 'THÈME CENTRAL', fontSize: 14, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
        { id: 'b1', type: 'rectangle', x: 100, y: 80, width: 160, height: 60, backgroundColor: '#ddd6fe', borderRadius: 12 },
        { id: 'b1t', type: 'text', x: 110, y: 95, width: 140, height: 30, content: 'Branche 1', fontSize: 14, color: '#6d28d9', textAlign: 'center' },
        { id: 'b2', type: 'rectangle', x: 700, y: 80, width: 160, height: 60, backgroundColor: '#dbeafe', borderRadius: 12 },
        { id: 'b2t', type: 'text', x: 710, y: 95, width: 140, height: 30, content: 'Branche 2', fontSize: 14, color: '#2563eb', textAlign: 'center' },
        { id: 'b3', type: 'rectangle', x: 100, y: 420, width: 160, height: 60, backgroundColor: '#dcfce7', borderRadius: 12 },
        { id: 'b3t', type: 'text', x: 110, y: 435, width: 140, height: 30, content: 'Branche 3', fontSize: 14, color: '#16a34a', textAlign: 'center' },
        { id: 'b4', type: 'rectangle', x: 700, y: 420, width: 160, height: 60, backgroundColor: '#fef3c7', borderRadius: 12 },
        { id: 'b4t', type: 'text', x: 710, y: 435, width: 140, height: 30, content: 'Branche 4', fontSize: 14, color: '#d97706', textAlign: 'center' },
      ],
      background: '#ffffff', gridVisible: false
    }
  },
  {
    id: 'wb-kanban', name: 'Kanban Board', description: 'Tableau de gestion de tâches', category: 'Organisation',
    type: 'whiteboard', thumbnail: '📋', color: '#0ea5e9',
    content: {
      elements: [
        { id: 'h1', type: 'rectangle', x: 30, y: 20, width: 280, height: 50, backgroundColor: '#dbeafe', borderRadius: 8 },
        { id: 'h1t', type: 'text', x: 40, y: 30, width: 260, height: 30, content: '📥 À faire', fontSize: 18, fontWeight: 'bold', color: '#1e40af', textAlign: 'center' },
        { id: 'h2', type: 'rectangle', x: 340, y: 20, width: 280, height: 50, backgroundColor: '#fef3c7', borderRadius: 8 },
        { id: 'h2t', type: 'text', x: 350, y: 30, width: 260, height: 30, content: '🔄 En cours', fontSize: 18, fontWeight: 'bold', color: '#92400e', textAlign: 'center' },
        { id: 'h3', type: 'rectangle', x: 650, y: 20, width: 280, height: 50, backgroundColor: '#dcfce7', borderRadius: 8 },
        { id: 'h3t', type: 'text', x: 660, y: 30, width: 260, height: 30, content: '✅ Terminé', fontSize: 18, fontWeight: 'bold', color: '#166534', textAlign: 'center' },
        { id: 't1', type: 'sticky', x: 50, y: 90, width: 240, height: 100, content: 'Tâche 1\nDescription courte', stickyColor: '#dbeafe' },
        { id: 't2', type: 'sticky', x: 50, y: 210, width: 240, height: 100, content: 'Tâche 2\nDescription courte', stickyColor: '#dbeafe' },
        { id: 't3', type: 'sticky', x: 360, y: 90, width: 240, height: 100, content: 'Tâche 3\nEn progression', stickyColor: '#fef3c7' },
        { id: 't4', type: 'sticky', x: 670, y: 90, width: 240, height: 100, content: 'Tâche 4\nComplétée ✓', stickyColor: '#dcfce7' },
      ],
      background: '#ffffff', gridVisible: false
    }
  },
  {
    id: 'wb-swot', name: 'Analyse SWOT', description: 'Forces, Faiblesses, Opportunités, Menaces', category: 'Organisation',
    type: 'whiteboard', thumbnail: '📊', color: '#10b981',
    content: {
      elements: [
        { id: 'title', type: 'text', x: 300, y: 10, width: 400, height: 40, content: 'ANALYSE SWOT', fontSize: 28, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
        { id: 'r1', type: 'rectangle', x: 50, y: 70, width: 420, height: 250, backgroundColor: '#dcfce7', borderRadius: 12 },
        { id: 'r1t', type: 'text', x: 70, y: 85, width: 380, height: 30, content: '💪 FORCES (Strengths)', fontSize: 18, fontWeight: 'bold', color: '#166534' },
        { id: 'r1c', type: 'text', x: 70, y: 120, width: 380, height: 180, content: '• Force 1\n• Force 2\n• Force 3', fontSize: 14, color: '#166534' },
        { id: 'r2', type: 'rectangle', x: 500, y: 70, width: 420, height: 250, backgroundColor: '#fef3c7', borderRadius: 12 },
        { id: 'r2t', type: 'text', x: 520, y: 85, width: 380, height: 30, content: '⚠️ FAIBLESSES (Weaknesses)', fontSize: 18, fontWeight: 'bold', color: '#92400e' },
        { id: 'r2c', type: 'text', x: 520, y: 120, width: 380, height: 180, content: '• Faiblesse 1\n• Faiblesse 2\n• Faiblesse 3', fontSize: 14, color: '#92400e' },
        { id: 'r3', type: 'rectangle', x: 50, y: 340, width: 420, height: 250, backgroundColor: '#dbeafe', borderRadius: 12 },
        { id: 'r3t', type: 'text', x: 70, y: 355, width: 380, height: 30, content: '🚀 OPPORTUNITÉS (Opportunities)', fontSize: 18, fontWeight: 'bold', color: '#1e40af' },
        { id: 'r3c', type: 'text', x: 70, y: 390, width: 380, height: 180, content: '• Opportunité 1\n• Opportunité 2\n• Opportunité 3', fontSize: 14, color: '#1e40af' },
        { id: 'r4', type: 'rectangle', x: 500, y: 340, width: 420, height: 250, backgroundColor: '#fce7f3', borderRadius: 12 },
        { id: 'r4t', type: 'text', x: 520, y: 355, width: 380, height: 30, content: '🔥 MENACES (Threats)', fontSize: 18, fontWeight: 'bold', color: '#9d174d' },
        { id: 'r4c', type: 'text', x: 520, y: 390, width: 380, height: 180, content: '• Menace 1\n• Menace 2\n• Menace 3', fontSize: 14, color: '#9d174d' },
      ],
      background: '#ffffff', gridVisible: false
    }
  },
  {
    id: 'wb-retrospective', name: 'Rétrospective', description: 'Start / Stop / Continue', category: 'Organisation',
    type: 'whiteboard', thumbnail: '🔄', color: '#6366f1',
    content: {
      elements: [
        { id: 'title', type: 'text', x: 250, y: 10, width: 500, height: 40, content: '🔄 RÉTROSPECTIVE', fontSize: 28, fontWeight: 'bold', color: '#4f46e5', textAlign: 'center' },
        { id: 'c1', type: 'rectangle', x: 30, y: 70, width: 290, height: 450, backgroundColor: '#dcfce7', borderRadius: 12 },
        { id: 'c1t', type: 'text', x: 50, y: 85, width: 250, height: 30, content: '▶️ START', fontSize: 20, fontWeight: 'bold', color: '#166534', textAlign: 'center' },
        { id: 'c1s1', type: 'sticky', x: 55, y: 130, width: 240, height: 80, content: 'Commencer à...', stickyColor: '#bbf7d0' },
        { id: 'c1s2', type: 'sticky', x: 55, y: 225, width: 240, height: 80, content: 'Nouvelle idée...', stickyColor: '#bbf7d0' },
        { id: 'c2', type: 'rectangle', x: 345, y: 70, width: 290, height: 450, backgroundColor: '#fee2e2', borderRadius: 12 },
        { id: 'c2t', type: 'text', x: 365, y: 85, width: 250, height: 30, content: '⏹️ STOP', fontSize: 20, fontWeight: 'bold', color: '#991b1b', textAlign: 'center' },
        { id: 'c2s1', type: 'sticky', x: 370, y: 130, width: 240, height: 80, content: 'Arrêter de...', stickyColor: '#fecaca' },
        { id: 'c2s2', type: 'sticky', x: 370, y: 225, width: 240, height: 80, content: 'Ne plus faire...', stickyColor: '#fecaca' },
        { id: 'c3', type: 'rectangle', x: 660, y: 70, width: 290, height: 450, backgroundColor: '#dbeafe', borderRadius: 12 },
        { id: 'c3t', type: 'text', x: 680, y: 85, width: 250, height: 30, content: '🔁 CONTINUE', fontSize: 20, fontWeight: 'bold', color: '#1e40af', textAlign: 'center' },
        { id: 'c3s1', type: 'sticky', x: 685, y: 130, width: 240, height: 80, content: 'Continuer à...', stickyColor: '#bfdbfe' },
        { id: 'c3s2', type: 'sticky', x: 685, y: 225, width: 240, height: 80, content: 'Garder cette habitude', stickyColor: '#bfdbfe' },
      ],
      background: '#ffffff', gridVisible: false
    }
  },
  {
    id: 'wb-wireframe', name: 'Wireframe App', description: 'Maquette d\'application mobile', category: 'Design',
    type: 'whiteboard', thumbnail: '📱', color: '#64748b',
    content: {
      elements: [
        { id: 'title', type: 'text', x: 300, y: 10, width: 400, height: 40, content: '📱 WIREFRAME — App Mobile', fontSize: 22, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
        { id: 'phone1', type: 'rectangle', x: 100, y: 70, width: 240, height: 420, backgroundColor: '#f1f5f9', borderRadius: 24, borderColor: '#cbd5e1', borderWidth: 2 },
        { id: 'p1header', type: 'rectangle', x: 100, y: 70, width: 240, height: 50, backgroundColor: '#e2e8f0', borderRadius: 0 },
        { id: 'p1htxt', type: 'text', x: 120, y: 82, width: 200, height: 26, content: 'Écran d\'accueil', fontSize: 14, fontWeight: 'bold', color: '#475569', textAlign: 'center' },
        { id: 'p1btn1', type: 'rectangle', x: 120, y: 140, width: 200, height: 40, backgroundColor: '#dbeafe', borderRadius: 8 },
        { id: 'p1btn1t', type: 'text', x: 130, y: 148, width: 180, height: 24, content: 'Bouton CTA', fontSize: 13, color: '#1e40af', textAlign: 'center' },
        { id: 'p1card', type: 'rectangle', x: 120, y: 200, width: 200, height: 120, backgroundColor: '#ffffff', borderRadius: 8, borderColor: '#e2e8f0', borderWidth: 1 },
        { id: 'p1cardt', type: 'text', x: 130, y: 210, width: 180, height: 20, content: 'Carte de contenu', fontSize: 12, color: '#64748b' },
        { id: 'phone2', type: 'rectangle', x: 400, y: 70, width: 240, height: 420, backgroundColor: '#f1f5f9', borderRadius: 24, borderColor: '#cbd5e1', borderWidth: 2 },
        { id: 'p2header', type: 'rectangle', x: 400, y: 70, width: 240, height: 50, backgroundColor: '#e2e8f0', borderRadius: 0 },
        { id: 'p2htxt', type: 'text', x: 420, y: 82, width: 200, height: 26, content: 'Écran détail', fontSize: 14, fontWeight: 'bold', color: '#475569', textAlign: 'center' },
        { id: 'phone3', type: 'rectangle', x: 700, y: 70, width: 240, height: 420, backgroundColor: '#f1f5f9', borderRadius: 24, borderColor: '#cbd5e1', borderWidth: 2 },
        { id: 'p3header', type: 'rectangle', x: 700, y: 70, width: 240, height: 50, backgroundColor: '#e2e8f0', borderRadius: 0 },
        { id: 'p3htxt', type: 'text', x: 720, y: 82, width: 200, height: 26, content: 'Écran profil', fontSize: 14, fontWeight: 'bold', color: '#475569', textAlign: 'center' },
        { id: 'label', type: 'text', x: 300, y: 510, width: 400, height: 30, content: 'Ajoutez des éléments pour compléter votre maquette', fontSize: 13, color: '#94a3b8', textAlign: 'center' },
      ],
      background: '#ffffff', gridVisible: true
    }
  },
  {
    id: 'wb-flowchart', name: 'Diagramme de flux', description: 'Flowchart avec décisions', category: 'Design',
    type: 'whiteboard', thumbnail: '🔀', color: '#ec4899',
    content: {
      elements: [
        { id: 'title', type: 'text', x: 300, y: 10, width: 400, height: 40, content: '🔀 DIAGRAMME DE FLUX', fontSize: 22, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
        { id: 'start', type: 'circle', x: 430, y: 70, width: 120, height: 60, backgroundColor: '#dcfce7', borderRadius: 30 },
        { id: 'startt', type: 'text', x: 445, y: 85, width: 90, height: 30, content: 'Début', fontSize: 14, fontWeight: 'bold', color: '#166534', textAlign: 'center' },
        { id: 'step1', type: 'rectangle', x: 400, y: 170, width: 180, height: 60, backgroundColor: '#dbeafe', borderRadius: 8 },
        { id: 'step1t', type: 'text', x: 410, y: 185, width: 160, height: 30, content: 'Étape 1', fontSize: 14, color: '#1e40af', textAlign: 'center' },
        { id: 'decision', type: 'diamond', x: 420, y: 280, width: 140, height: 100, backgroundColor: '#fef3c7', borderRadius: 0 },
        { id: 'dect', type: 'text', x: 435, y: 310, width: 110, height: 30, content: 'Condition ?', fontSize: 12, color: '#92400e', textAlign: 'center' },
        { id: 'yes', type: 'rectangle', x: 250, y: 430, width: 150, height: 60, backgroundColor: '#dcfce7', borderRadius: 8 },
        { id: 'yest', type: 'text', x: 260, y: 445, width: 130, height: 30, content: 'Oui → Action A', fontSize: 13, color: '#166534', textAlign: 'center' },
        { id: 'no', type: 'rectangle', x: 580, y: 430, width: 150, height: 60, backgroundColor: '#fee2e2', borderRadius: 8 },
        { id: 'not', type: 'text', x: 590, y: 445, width: 130, height: 30, content: 'Non → Action B', fontSize: 13, color: '#991b1b', textAlign: 'center' },
        { id: 'end', type: 'circle', x: 430, y: 550, width: 120, height: 60, backgroundColor: '#fee2e2', borderRadius: 30 },
        { id: 'endt', type: 'text', x: 445, y: 565, width: 90, height: 30, content: 'Fin', fontSize: 14, fontWeight: 'bold', color: '#991b1b', textAlign: 'center' },
      ],
      background: '#ffffff', gridVisible: true
    }
  },
  {
    id: 'wb-user-journey', name: 'Parcours utilisateur', description: 'User journey map', category: 'Design',
    type: 'whiteboard', thumbnail: '🗺️', color: '#14b8a6',
    content: {
      elements: [
        { id: 'title', type: 'text', x: 200, y: 10, width: 600, height: 40, content: '🗺️ PARCOURS UTILISATEUR', fontSize: 24, fontWeight: 'bold', color: '#0f766e', textAlign: 'center' },
        { id: 'phase1h', type: 'rectangle', x: 30, y: 70, width: 180, height: 40, backgroundColor: '#ccfbf1', borderRadius: 8 },
        { id: 'phase1t', type: 'text', x: 40, y: 78, width: 160, height: 24, content: '1. Découverte', fontSize: 14, fontWeight: 'bold', color: '#0f766e', textAlign: 'center' },
        { id: 'phase2h', type: 'rectangle', x: 230, y: 70, width: 180, height: 40, backgroundColor: '#dbeafe', borderRadius: 8 },
        { id: 'phase2t', type: 'text', x: 240, y: 78, width: 160, height: 24, content: '2. Évaluation', fontSize: 14, fontWeight: 'bold', color: '#1e40af', textAlign: 'center' },
        { id: 'phase3h', type: 'rectangle', x: 430, y: 70, width: 180, height: 40, backgroundColor: '#fef3c7', borderRadius: 8 },
        { id: 'phase3t', type: 'text', x: 440, y: 78, width: 160, height: 24, content: '3. Achat', fontSize: 14, fontWeight: 'bold', color: '#92400e', textAlign: 'center' },
        { id: 'phase4h', type: 'rectangle', x: 630, y: 70, width: 180, height: 40, backgroundColor: '#dcfce7', borderRadius: 8 },
        { id: 'phase4t', type: 'text', x: 640, y: 78, width: 160, height: 24, content: '4. Fidélisation', fontSize: 14, fontWeight: 'bold', color: '#166534', textAlign: 'center' },
        { id: 'act1', type: 'sticky', x: 40, y: 130, width: 160, height: 80, content: 'Action utilisateur', stickyColor: '#ccfbf1' },
        { id: 'act2', type: 'sticky', x: 240, y: 130, width: 160, height: 80, content: 'Action utilisateur', stickyColor: '#dbeafe' },
        { id: 'act3', type: 'sticky', x: 440, y: 130, width: 160, height: 80, content: 'Action utilisateur', stickyColor: '#fef3c7' },
        { id: 'act4', type: 'sticky', x: 640, y: 130, width: 160, height: 80, content: 'Action utilisateur', stickyColor: '#dcfce7' },
        { id: 'em1', type: 'text', x: 40, y: 230, width: 160, height: 30, content: '😊 Satisfait', fontSize: 14, color: '#166534', textAlign: 'center' },
        { id: 'em2', type: 'text', x: 240, y: 230, width: 160, height: 30, content: '🤔 Hésitant', fontSize: 14, color: '#92400e', textAlign: 'center' },
        { id: 'em3', type: 'text', x: 440, y: 230, width: 160, height: 30, content: '😰 Stressé', fontSize: 14, color: '#991b1b', textAlign: 'center' },
        { id: 'em4', type: 'text', x: 640, y: 230, width: 160, height: 30, content: '🎉 Ravi', fontSize: 14, color: '#166534', textAlign: 'center' },
      ],
      background: '#ffffff', gridVisible: false
    }
  },
  {
    id: 'wb-planning', name: 'Planning hebdomadaire', description: 'Semaine en colonnes', category: 'Organisation',
    type: 'whiteboard', thumbnail: '📅', color: '#3b82f6',
    content: {
      elements: [
        { id: 'title', type: 'text', x: 250, y: 10, width: 500, height: 40, content: '📅 PLANNING HEBDOMADAIRE', fontSize: 24, fontWeight: 'bold', color: '#1e40af', textAlign: 'center' },
        { id: 'd1h', type: 'rectangle', x: 20, y: 65, width: 130, height: 35, backgroundColor: '#1e40af', borderRadius: 6 },
        { id: 'd1t', type: 'text', x: 25, y: 72, width: 120, height: 20, content: 'Lundi', fontSize: 13, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
        { id: 'd2h', type: 'rectangle', x: 160, y: 65, width: 130, height: 35, backgroundColor: '#2563eb', borderRadius: 6 },
        { id: 'd2t', type: 'text', x: 165, y: 72, width: 120, height: 20, content: 'Mardi', fontSize: 13, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
        { id: 'd3h', type: 'rectangle', x: 300, y: 65, width: 130, height: 35, backgroundColor: '#3b82f6', borderRadius: 6 },
        { id: 'd3t', type: 'text', x: 305, y: 72, width: 120, height: 20, content: 'Mercredi', fontSize: 13, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
        { id: 'd4h', type: 'rectangle', x: 440, y: 65, width: 130, height: 35, backgroundColor: '#60a5fa', borderRadius: 6 },
        { id: 'd4t', type: 'text', x: 445, y: 72, width: 120, height: 20, content: 'Jeudi', fontSize: 13, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
        { id: 'd5h', type: 'rectangle', x: 580, y: 65, width: 130, height: 35, backgroundColor: '#93c5fd', borderRadius: 6 },
        { id: 'd5t', type: 'text', x: 585, y: 72, width: 120, height: 20, content: 'Vendredi', fontSize: 13, fontWeight: 'bold', color: '#1e40af', textAlign: 'center' },
        { id: 's1', type: 'sticky', x: 25, y: 115, width: 120, height: 70, content: 'Tâche', stickyColor: '#dbeafe' },
        { id: 's2', type: 'sticky', x: 165, y: 115, width: 120, height: 70, content: 'Tâche', stickyColor: '#dbeafe' },
        { id: 's3', type: 'sticky', x: 305, y: 115, width: 120, height: 70, content: 'Tâche', stickyColor: '#dbeafe' },
        { id: 's4', type: 'sticky', x: 445, y: 115, width: 120, height: 70, content: 'Tâche', stickyColor: '#dbeafe' },
        { id: 's5', type: 'sticky', x: 585, y: 115, width: 120, height: 70, content: 'Tâche', stickyColor: '#dbeafe' },
      ],
      background: '#f8fafc', gridVisible: false
    }
  },
  {
    id: 'wb-meeting-notes', name: 'Notes de réunion', description: 'Prise de notes collaborative', category: 'Pédagogie',
    type: 'whiteboard', thumbnail: '📝', color: '#f97316',
    content: {
      elements: [
        { id: 'title', type: 'text', x: 250, y: 15, width: 500, height: 40, content: '📝 NOTES DE RÉUNION', fontSize: 24, fontWeight: 'bold', color: '#c2410c', textAlign: 'center' },
        { id: 'date', type: 'text', x: 350, y: 55, width: 300, height: 24, content: 'Date : __ / __ / ____', fontSize: 14, color: '#9ca3af', textAlign: 'center' },
        { id: 'obj', type: 'rectangle', x: 40, y: 100, width: 430, height: 200, backgroundColor: '#fff7ed', borderRadius: 12 },
        { id: 'objt', type: 'text', x: 55, y: 112, width: 400, height: 24, content: '🎯 Objectifs', fontSize: 18, fontWeight: 'bold', color: '#c2410c' },
        { id: 'objc', type: 'text', x: 55, y: 145, width: 400, height: 140, content: '1. \n2. \n3. ', fontSize: 14, color: '#78350f' },
        { id: 'act', type: 'rectangle', x: 500, y: 100, width: 430, height: 200, backgroundColor: '#f0fdf4', borderRadius: 12 },
        { id: 'actt', type: 'text', x: 515, y: 112, width: 400, height: 24, content: '✅ Actions à mener', fontSize: 18, fontWeight: 'bold', color: '#166534' },
        { id: 'actc', type: 'text', x: 515, y: 145, width: 400, height: 140, content: '• Action — Responsable — Deadline\n• \n• ', fontSize: 14, color: '#166534' },
        { id: 'notes', type: 'rectangle', x: 40, y: 330, width: 890, height: 220, backgroundColor: '#fffbeb', borderRadius: 12 },
        { id: 'notest', type: 'text', x: 55, y: 342, width: 400, height: 24, content: '📋 Notes', fontSize: 18, fontWeight: 'bold', color: '#92400e' },
        { id: 'notesc', type: 'text', x: 55, y: 375, width: 860, height: 160, content: 'Écrivez vos notes ici...', fontSize: 14, color: '#78350f' },
      ],
      background: '#ffffff', gridVisible: false
    }
  },
  {
    id: 'wb-lesson-plan', name: 'Plan de cours', description: 'Structure pédagogique', category: 'Pédagogie',
    type: 'whiteboard', thumbnail: '🎓', color: '#7c3aed',
    content: {
      elements: [
        { id: 'title', type: 'text', x: 200, y: 10, width: 600, height: 40, content: '🎓 PLAN DE COURS', fontSize: 26, fontWeight: 'bold', color: '#5b21b6', textAlign: 'center' },
        { id: 'info', type: 'text', x: 300, y: 50, width: 400, height: 24, content: 'Matière : __________ | Classe : __________', fontSize: 14, color: '#a78bfa', textAlign: 'center' },
        { id: 'obj', type: 'rectangle', x: 40, y: 90, width: 290, height: 180, backgroundColor: '#f5f3ff', borderRadius: 12 },
        { id: 'objt', type: 'text', x: 55, y: 102, width: 260, height: 24, content: '🎯 Objectifs', fontSize: 16, fontWeight: 'bold', color: '#5b21b6' },
        { id: 'objc', type: 'text', x: 55, y: 132, width: 260, height: 120, content: '• Objectif 1\n• Objectif 2\n• Objectif 3', fontSize: 13, color: '#6d28d9' },
        { id: 'intro', type: 'rectangle', x: 350, y: 90, width: 290, height: 180, backgroundColor: '#dbeafe', borderRadius: 12 },
        { id: 'introt', type: 'text', x: 365, y: 102, width: 260, height: 24, content: '📖 Introduction (10 min)', fontSize: 16, fontWeight: 'bold', color: '#1e40af' },
        { id: 'dev', type: 'rectangle', x: 660, y: 90, width: 290, height: 180, backgroundColor: '#dcfce7', borderRadius: 12 },
        { id: 'devt', type: 'text', x: 675, y: 102, width: 260, height: 24, content: '📚 Développement (30 min)', fontSize: 16, fontWeight: 'bold', color: '#166534' },
        { id: 'activ', type: 'rectangle', x: 40, y: 290, width: 440, height: 180, backgroundColor: '#fef3c7', borderRadius: 12 },
        { id: 'activt', type: 'text', x: 55, y: 302, width: 410, height: 24, content: '✏️ Activités pratiques (15 min)', fontSize: 16, fontWeight: 'bold', color: '#92400e' },
        { id: 'eval', type: 'rectangle', x: 510, y: 290, width: 440, height: 180, backgroundColor: '#fce7f3', borderRadius: 12 },
        { id: 'evalt', type: 'text', x: 525, y: 302, width: 410, height: 24, content: '📊 Évaluation & Conclusion (5 min)', fontSize: 16, fontWeight: 'bold', color: '#9d174d' },
      ],
      background: '#ffffff', gridVisible: false
    }
  },
];

// Combine all templates
export const ALL_TEMPLATES: DocumentTemplate[] = [
  ...textTemplates,
  ...spreadsheetTemplates,
  ...presentationTemplates,
  ...visualTemplates,
  ...whiteboardTemplates,
];

export const getTemplatesByType = (type: DocumentTemplate['type']): DocumentTemplate[] => {
  return ALL_TEMPLATES.filter(t => t.type === type);
};

export const getTemplateCategories = (type: DocumentTemplate['type']): string[] => {
  const templates = getTemplatesByType(type);
  return [...new Set(templates.map(t => t.category))];
};
