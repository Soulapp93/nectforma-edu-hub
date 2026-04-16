# PRD - Nectforma

## Plateforme
ERP Education - Gestion academique (React + Vite + TypeScript + Supabase)

## Session 38 - Diplomes, PV, Signatures, Email, Performance (2026-04-16)

### Validation PV et Resultats (NEW)
- Bouton **"Valider le PV et les resultats"** remplace l'ancien "Signer & Valider le PV"
- **Validation** : persiste les decisions du jury (upsert transcripts), verrouille la periode (`is_locked=true`)
- **Apres validation** :
  - Banner vert "PV et resultats valides" avec timestamp
  - Decisions deviennent des badges statiques (non modifiables)
  - Saisie des notes verrouille (banner ambre + bouton "PV valide (verrouille)" desactive)
- **"Modifier le PV et resultats"** : deverrouille la periode, re-autorise la saisie des notes
- **Diplomes** : generation bloquee tant que bulletins non publies (warning banner)
- Flux complet : Saisie > Jury > Valider PV > Publier bulletins > Generer diplomes
- Testing: iteration_28 (100%, 13/13 tests)

### Gestion des Diplomes
- **Navigation 3 niveaux** (Formations > Promotions > Etudiants)
- **Editeur Drag & Drop** style Canva : 6 types elements, 12 variables, 4 presets
- Generation par lot pour etudiants admis, apercu live
- Tables: `diploma_templates`, `generated_diplomas` avec RLS
- Testing: iteration_27 (100%, 14/14 tests)

### Signatures Publiques (Phase 3) + Email Brevo
- `SignatureRequestPanel` + page publique `/sign/:token`
- Email auto-envoye + bouton "Renvoyer l'email"
- Testing: iteration_25-26 (100%)

### Fix Performance GradeSheetView
- "Maximum update depth exceeded" corrige via useMemo

## All Completed - [x]
- Supabase Realtime fix, Pre-deployment blockers
- Auto-generation Promotions/Schedules/Textbooks
- File Visualization, Native PDF Fullscreen
- Hub deep-linking, Independent Grading Periods, Module Coefficients
- Drag & Drop Transcript/Diploma Template Editors
- Public Signatures + Email Brevo
- Validation PV et Resultats (verrouillage notes)
- Gestion Diplomes avec flux lie aux notes

## P1 - [ ] Deploiement production
## P2 - [ ] Export PDF diplomes (html2canvas + jspdf)
## P2 - [ ] Refactoring TranscriptsPanel.tsx (>1400 lignes)
## P2 - [ ] Pagination N+1 sur pages hub
