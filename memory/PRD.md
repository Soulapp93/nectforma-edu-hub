# PRD - Nectforma

## Session 34 - PeriodSelector dans tous les onglets (2026-04-15)
- **PeriodSelector** composant reutilisable: pills semestres (primary), examens (ambre), autres (bleu)
- Integre dans CalculValidation et JuryDeliberation (en plus de Notes.tsx parent)
- Chaque onglet a son propre localPeriodId synchronise avec le parent
- Titre dynamique inclut le nom de la periode selectionnee
- Fix doublons: standardise period_type 'semester' -> 'semestre', supprime doublons DB
- Testing: 5/5 passes (iteration_21) - navigation par periode dans les 4 onglets

## All Completed - [x]
## P1 - [ ] Deploiement production
