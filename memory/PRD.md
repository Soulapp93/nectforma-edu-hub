# PRD - Nectforma

## Plateforme
ERP Education - Gestion academique (React + Vite + TypeScript + Supabase)

## Session 38 (2026-04-16/17)

### Carte Etudiant Numerique (NEW)
- Nouvel onglet "Gestion des cartes etudiantes" dans Administration
- Navigation Formations > Etudiants avec stats (Etudiants, Cartes generees, Actives)
- **Editeur Drag & Drop recto/verso** :
  - 6 elements : Texte, Variable, Image, QR Code, Ligne, Rectangle
  - 13 variables dynamiques ({nom}, {prenom}, {formation}, {numero_etudiant}, {qrcode}...)
  - 3 presets : Classique, Moderne Sombre, Universitaire
  - Toggle Recto/Verso, fond personnalisable, panneau proprietes complet
  - Design inspire "Carte Etudiant des Metiers" avec mentions legales
- **Generation par lot** avec numero etudiant auto (PREFIX-YEAR-XXXX)
- **Apercu** avec QR code interactif (react-qr-code)
- **Boutons Wallet** : Ajouter a Google Wallet / Apple Wallet
- **Page publique** `/verify-card/:code` pour verification QR
- Tables: `student_card_templates`, `student_cards` avec RLS
- Testing: iteration_31 (100%, 13/13 tests)

### Rapport Emargement
- Onglet "Rapport emargement" dans Suivi & Emargement
- Navigation > Filtres date > Stats dashboard > Tableau > PDF (jsPDF)
- Testing: iteration_30 (100%, 12/12 tests)

### Historique Audit PV
- Table `pv_audit_log`, trace validation/deverrouillage
- Testing: iteration_29 (100%, 10/10 tests)

### Validation PV et Resultats
- Valider/Modifier PV, verrouillage notes, diplomes lies
- Testing: iteration_28 (100%, 13/13 tests)

### Gestion des Diplomes
- Editeur Drag & Drop Canva, 4 presets, generation par lot
- Testing: iteration_27 (100%, 14/14 tests)

### Signatures Publiques + Email Brevo
- Testing: iterations 25-26 (100%)

### Fix Performance GradeSheetView
- "Maximum update depth exceeded" corrige

## P1 - [ ] Deploiement production
## P2 - [ ] Export PDF diplomes
## P2 - [ ] Refactoring TranscriptsPanel.tsx
## P2 - [ ] Pagination N+1 sur pages hub
