

# Plan : Paramètres pédagogiques & Gestion des semestres

## Contexte

La table `formations` possède déjà une colonne `semesters_count`. La table `evaluation_periods` existe avec `period_type`, `name`, `formation_id`. La table `formation_modules` n'a pas encore de colonne `semester`.

## Etapes

### 1. Migration base de données
- Ajouter une colonne `semester` (integer, nullable) à `formation_modules` pour associer chaque module à un semestre.
- Ajouter une colonne `duration_years` (integer, default 1) à `formations` pour stocker la durée en années (1, 2 ou 3 ans).

### 2. Bouton "Paramètres pédagogiques" dans Gestion de l'établissement
- Ajouter un nouveau composant `PedagogicalSettings` accessible depuis `GestionEtablissement.tsx`.
- Ce composant affichera un panneau de configuration avec :
  - Explication de la logique des semestres selon la durée de la formation.
  - Tableau récapitulatif : 1 an = S1/S2, 2 ans = S1/S2/S3/S4, 3 ans = S1-S6.

### 3. Logique automatique des semestres
- Quand on crée/modifie une formation, on sélectionne la durée en années (1, 2 ou 3).
- Le système calcule automatiquement `semesters_count = durée × 2`.
- Lors de la création, les `evaluation_periods` correspondantes sont auto-créées (Semestre 1, Semestre 2, etc.).

### 4. Mise à jour du formulaire de création de formation (`CreateFormationModal`)
- Ajouter un champ "Durée de la formation" (1 an, 2 ans, 3 ans).
- Les semestres sont calculés automatiquement et affichés.
- Lors de la soumission, créer automatiquement les `evaluation_periods` pour chaque semestre.

### 5. Ajout du sélecteur de semestre dans `ModuleForm`
- Ajouter un champ `<Select>` "Semestre" au formulaire de module.
- Les options sont dynamiques selon la durée de la formation (S1-S2 pour 1 an, S1-S4 pour 2 ans, etc.).
- La valeur est sauvegardée dans `formation_modules.semester`.

### 6. Feuille de notes : boutons semestres
- Dans `GradeSheetView`, les périodes d'évaluation (semestres) sont déjà chargées via `getEvaluationPeriods`.
- Grouper les boutons de période par année : Année 1 (S1, S2), Année 2 (S3, S4), etc.
- Filtrer les modules affichés selon le semestre sélectionné.

## Détails techniques

```text
┌─────────────────────────────────────────┐
│  formations                             │
│  + duration_years (1, 2, 3)             │
│  + semesters_count (auto: years × 2)    │
├─────────────────────────────────────────┤
│  formation_modules                      │
│  + semester (int, nullable)             │
├─────────────────────────────────────────┤
│  evaluation_periods (existant)          │
│  Auto-créés: "Semestre 1", "Semestre 2" │
│  period_type = 'semester'               │
└─────────────────────────────────────────┘
```

**Fichiers modifiés :**
- Migration SQL (ajout `semester` sur `formation_modules`, `duration_years` sur `formations`)
- `src/pages/GestionEtablissement.tsx` (bouton paramètres pédagogiques)
- `src/components/administration/PedagogicalSettings.tsx` (nouveau)
- `src/components/administration/CreateFormationModal.tsx` (champ durée + auto-création semestres)
- `src/components/administration/ModuleForm.tsx` (sélecteur semestre)
- `src/components/grades/GradeSheetView.tsx` (boutons semestres groupés par année)

