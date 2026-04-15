# PRD - Nectforma

## Session 35 - Selection Modules pour Examens (2026-04-15)
- **CreatePeriodModal reecrit**: Pour types Examen Blanc/Final, Partiels, Rattrapage:
  - Liste tous les modules de la formation groupes par semestre
  - Checkboxes individuelles par module
  - Boutons "Tout" / "Aucun" pour selection rapide
  - Clic sur titre semestre pour selectionner/deselectionner tout le semestre
  - Recherche de modules
  - Badge compteur (X/Y modules selectionnes)
  - Bouton "Creer" desactive si aucun module selectionne
  - Toast affiche le nombre de modules
- **DB**: Table `period_modules` creee (period_id, module_id, UNIQUE) avec RLS
- Pour types Semestre/Trimestre: pas de selection modules (comportement inchange)
- Testing: 6/6 passes (iteration_22)

## All Completed - [x]
## P1 - [ ] Deploiement production
## P2 - [ ] Fix GradeSheetView perf (Maximum update depth exceeded)
