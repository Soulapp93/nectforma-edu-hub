# PRD - Nectforma

## Application Overview
- **Name:** Nectforma - SaaS multi-tenant pour centres de formation
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (BaaS) + Capacitor

## Session 31 - Gestion Notes Phase 2 + 3 (2026-04-13)
- **Phase 2 - Configuration** (deja existante, validee):
  - Blocs/Sections: creer UE, assigner modules
  - Regles: seuils validation, compensation, mentions, credits
  - Combinaisons: fusionner semestres (S1+S2=Bulletin Annee 1)
- **Phase 3 - Publication amelioree**:
  - Dialog refait avec 3 sections:
    1. Periodes individuelles (pills cliquables S1, S2, S3...)
    2. Examens (Examen Blanc, Examen Final - bordure ambre)
    3. Bulletins combines (S1+S2 Annee 1, Tous semestres, CC+Examens Complet)
  - Semestres deja publies marques avec check vert
  - Disposition bulletin: Par UE/Section, Par Bloc, Par Semestre
- Testing: 6/6 passes (iteration_18)

## All Completed - [x]
## P1 - [ ] Deploiement production
## P2 - [ ] Fix GradeSheetView perf, TypeScript strict
