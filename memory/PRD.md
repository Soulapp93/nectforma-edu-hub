# PRD - Nectforma

## Session 33 - Periodes d'Evaluation Independantes (2026-04-13)
- **Navigation par periodes**: Pills cliquables avec etat actif colore (semestres = primary, examens = ambre)
- **Periodes independantes**: Chaque periode (S1, S2, Examen Blanc) est independante
  - selectedPeriodId state dans Notes.tsx
  - Auto-selection premiere periode, reset au changement de formation
  - Indicateur actif avec icone calendrier sous les onglets
- **4 onglets filtres par periode**: 
  - Saisie des notes: GradeSheetView sync semesterView avec periodId
  - Calcul & Validation: accepte periodId
  - Jury & Deliberation: accepte periodId
  - Bulletin de notes: accepte periodId + periodName
- **Publication flexible**: Dialog avec periodes individuelles, examens, bulletins combines (S1+S2, CC+Examens)
- Testing: 7/7 passes (iteration_20)

## All Completed - [x]
## P1 - [ ] Deploiement production
## P2 - [ ] Fix GradeSheetView perf (Maximum update depth exceeded)
