# PRD - Nectforma

## Plateforme
ERP Education - Gestion academique (React + Vite + TypeScript + Supabase)

## Session 38 (2026-04-16)

### Historique Audit PV (NEW)
- Table `pv_audit_log` (period_id, formation_id, action, performed_by, performer_name, details jsonb, created_at)
- Chaque validation/deverrouillage du PV trace automatiquement dans l'audit log
- Section "Historique des modifications" dans JuryDeliberation avec toggle collapse/expand
- Entrees avec icones (vert=validation, ambre=deverrouillage), nom du performer, timestamp, badges stats
- Tri par date decroissante (plus recent en premier)
- Testing: iteration_29 (100%, 10/10 tests)

### Validation PV et Resultats
- "Valider le PV et les resultats" persiste decisions + verrouille periode
- "Modifier le PV et resultats" deverrouille
- Saisie notes bloquee quand PV valide
- Diplomes bloques tant que bulletins non publies
- Testing: iteration_28 (100%, 13/13 tests)

### Gestion des Diplomes
- Navigation 3 niveaux, Editeur Drag & Drop style Canva
- 6 elements, 12 variables, 4 presets, panneau proprietes complet
- Testing: iteration_27 (100%, 14/14 tests)

### Signatures Publiques + Email Brevo
- SignatureRequestPanel + page /sign/:token + email auto
- Testing: iterations 25-26 (100%)

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
- Historique Audit PV
- Gestion Diplomes avec flux lie aux notes

## P1 - [ ] Deploiement production
## P2 - [ ] Export PDF diplomes (html2canvas + jspdf)
## P2 - [ ] Refactoring TranscriptsPanel.tsx (>1400 lignes)
## P2 - [ ] Pagination N+1 sur pages hub
