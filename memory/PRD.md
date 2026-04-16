# PRD - Nectforma

## Plateforme
ERP Education - Gestion academique (React + Vite + TypeScript + Supabase)

## Session 38 - Diplomes, Signatures, Email, Performance (2026-04-16)

### Gestion des Diplomes (NEW)
- **Navigation 3 niveaux** : Formations > Promotions > Etudiants (meme pattern que Notes)
- **Editeur Drag & Drop** (`DiplomaTemplateEditor.tsx`) style Canva :
  - Canvas WYSIWYG avec positionnement absolu et redimensionnement
  - 6 types d'elements : Texte, Variable, Image, Ligne, Rectangle, Signature
  - 12 variables dynamiques ({nom_complet}, {formation}, {mention}, {moyenne}, {date_jury}, etc.)
  - 4 modeles predefinis : Classique (dore), Moderne (bleu), Elegant (violet), Minimaliste
  - Panneau proprietes : police, taille, couleur, gras/italique/souligne, alignement, espacement, opacite
  - Fond personnalisable (couleur, bordure: simple/double/ornementale)
  - Calques avec reordonnancement, duplication, verrouillage
  - Orientation paysage/portrait
  - Sauvegarde dans Supabase (`diploma_templates`)
- **Generation par lot** : dialogue de generation pour tous les etudiants admis
- **Apercu avec variables resolues** : preview live du diplome pour chaque etudiant
- **Statistiques** : Etudiants, Admis, Diplomes generes, Delivres
- Service : `diplomaService.ts` avec CRUD, presets, resolution de variables
- Tables Supabase : `diploma_templates`, `generated_diplomas` avec RLS
- Testing: iteration_27 (100%, 14/14 tests)

### Signatures Publiques (Phase 3)
- `SignatureRequestPanel.tsx` dans onglet Bulletin de notes
- `SignPage.tsx` : page publique `/sign/:token` avec canvas signature
- Route publique corrigee dans `App.tsx`
- Types Supabase mis a jour

### Notification Email (Brevo)
- Email auto-envoye a la creation d'une demande de signature
- Bouton "Renvoyer l'email" pour demandes en attente
- Template HTML personnalise Nectforma
- Testing: iteration_26 (100%)

### Fix Performance GradeSheetView
- "Maximum update depth exceeded" corrige via useMemo
- Testing: iteration_25 (95%)

## All Completed - [x]
- Supabase Realtime fix
- Pre-deployment blockers
- Auto-generation Promotions/Schedules/Textbooks
- File Visualization (tooltips, WhatsApp-like chat)
- Native PDF Fullscreen
- Hub deep-linking (formationId URL params)
- Independent Grading Periods (PeriodSelector)
- Module Coefficients
- Drag & Drop Transcript Template Editor
- Public Signatures for Bulletins
- Email notification pour signatures (Brevo)
- GradeSheetView performance fix
- Gestion des Diplomes avec editeur Drag & Drop

## P1 - [ ] Deploiement production
## P2 - [ ] Refactoring TranscriptsPanel.tsx (>1400 lignes)
## P2 - [ ] Pagination N+1 sur pages hub
## P2 - [ ] Export PDF diplomes (html2canvas + jspdf)
