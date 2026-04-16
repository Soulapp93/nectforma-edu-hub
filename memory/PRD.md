# PRD - Nectforma

## Session 36 - Phase 1 Coefficients (2026-04-15)
- **Coefficient modules**: Champ coefficient ajoute dans ModuleForm (creation formation)
  - Input number avec valeur par defaut 1, step 0.5
  - Passe a moduleService.createModule via CreateFormationModal
- **Coefficient evaluations**: Deja existant dans CreateEvaluationModal (input number)
- **Coefficients examens specifiques**: 
  - Colonne coefficient ajoutee dans period_modules (DB)
  - CreatePeriodModal: quand module selectionne pour examen, input ambre "Coeff exam:" apparait
  - Affichage "CC: X" en gris a cote de chaque module pour comparaison
  - examCoefficients state stocke les coefficients exam par module
  - Sauvegarde dans period_modules.coefficient
- Testing: 4/4 passes (iteration_23, 100%)

## Prochaines phases:
- Phase 2: Bulletin modulable drag & drop
- Phase 3: Signatures par lien unique

## All Completed - [x]
## P1 - [ ] Deploiement production
