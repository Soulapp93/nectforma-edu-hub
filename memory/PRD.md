# PRD - Nectforma

## Application Overview
- **Name:** Nectforma - SaaS multi-tenant pour centres de formation
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (BaaS) + Capacitor

## Session 30 - Gestion des Notes et Releves (2026-04-13)
- Navigation par periodes: pills groupees par type (semestres vert, examens ambre, separateur)
- Etat vide avec CTA "Creer une periode" si aucune periode
- CreatePeriodModal: types semestre/trimestre/examen_blanc/examen_final/partiels/rattrapage/custom
- 4 onglets: Saisie des notes (GradeSheetView), Calcul & Validation, Jury & Deliberation, Bulletin de notes
- Auto-selection formation depuis URL (formationId param)
- Testing: 6/6 passes (iteration_17)

## All Completed
- [x] Toutes fonctionnalites precedentes
- [x] Gestion notes: periodes, navigation, 4 onglets

## P1 - [ ] Deploiement production
## P2 - [ ] Fix GradeSheetView perf, TypeScript strict, Refactoring TranscriptsPanel
