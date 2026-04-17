# PRD - Nectforma

## Plateforme
ERP Education - Gestion academique (React + Vite + TypeScript + Supabase)

## Session 38 (2026-04-16/17)

### Carte Etudiant - Editeur Ameliore (UPDATE)
- **10 modeles predefinis** : Classique, Moderne, Premium, Ecologique, Technologique, Minimaliste, Colore, Institutionnel, Sportif, Artistique
- **Format portrait** (320x400/500) comme les cartes reelles
- **Drapeau France** ajoutable en 1 clic (SVG data URI)
- **Modele Institutionnel** : drapeau + REPUBLIQUE FRANCAISE + Liberte Egalite Fraternite
- **Proprietes etendues** pour elements texte : fond de l'element, arrondi, opacite
- **Proprietes etendues** pour rectangles : couleur fond, couleur bordure, epaisseur, arrondi, opacite
- **Proprietes etendues** pour images : arrondi, bordure, couleur bordure
- Testing: iteration_32 (100%, 11/11 tests)

### Carte Etudiant Numerique (Phase 1)
- Onglet "Gestion des cartes etudiantes" dans Administration
- Editeur Drag & Drop recto/verso, 6 elements, variables, QR code
- Generation par lot, page publique /verify-card/:code
- Boutons Google Wallet / Apple Wallet
- Testing: iteration_31 (100%, 13/13 tests)

### Rapport Emargement
- Testing: iteration_30 (100%, 12/12 tests)

### Historique Audit PV
- Testing: iteration_29 (100%, 10/10 tests)

### Validation PV et Resultats
- Testing: iteration_28 (100%, 13/13 tests)

### Gestion des Diplomes
- Testing: iteration_27 (100%, 14/14 tests)

### Signatures Publiques + Email Brevo
- Testing: iterations 25-26 (100%)

## P1 - [ ] Deploiement production
## P2 - [ ] Export PDF diplomes
## P2 - [ ] Refactoring TranscriptsPanel.tsx
## P2 - [ ] Pagination N+1 sur pages hub
