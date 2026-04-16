# PRD - Nectforma

## Plateforme
ERP Education - Gestion academique (React + Vite + TypeScript + Supabase)

## Session 38 (2026-04-16)

### Rapport Emargement (NEW)
- Nouvel onglet "Rapport emargement" dans Suivi & Emargement hub
- Navigation 3 niveaux : Formations > Etudiants > Rapport detaille
- **Filtres par date** (debut/fin) avec compteur de seances
- **Tableau de bord** : Taux de presence, Presences, Absences, Retards, Justifiees
- **Tableau recapitulatif** : #, Date, Session, Horaires, Statut (Present/Absent/Retard), Justification, Salle
- **Generation PDF** via jsPDF + jspdf-autotable : en-tete etablissement, infos etudiant/formation, stats colorees, tableau complet
- Testing: iteration_30 (100%, 12/12 tests)

### Historique Audit PV
- Table `pv_audit_log`, trace validation/deverrouillage avec performer et timestamp
- Section "Historique des modifications" dans JuryDeliberation avec toggle
- Testing: iteration_29 (100%, 10/10 tests)

### Validation PV et Resultats
- "Valider le PV et les resultats" + "Modifier le PV et resultats"
- Saisie notes verrouillee quand PV valide, diplomes bloques si bulletins non publies
- Testing: iteration_28 (100%, 13/13 tests)

### Gestion des Diplomes
- Navigation 3 niveaux, Editeur Drag & Drop style Canva, 4 presets
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
- Validation PV et Resultats (verrouillage notes) + Audit log
- Gestion Diplomes avec flux lie aux notes
- Rapport Emargement avec generation PDF

## P1 - [ ] Deploiement production
## P2 - [ ] Export PDF diplomes (html2canvas + jspdf)
## P2 - [ ] Refactoring TranscriptsPanel.tsx (>1400 lignes)
## P2 - [ ] Pagination N+1 sur pages hub
