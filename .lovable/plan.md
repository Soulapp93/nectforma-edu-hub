

## Plan: Refonte de la feuille de notes selon le template PDF

### Résumé

Restructurer la feuille de notes pour correspondre au template PDF fourni : un tableau unique par module avec **Contrôle Continu à gauche** et **Examen (Blanc ou Final) à droite**, navigation par modules via onglets, et possibilité de dupliquer par semestre.

### Structure cible (d'après le PDF)

```text
┌─────────────────────────────────────────────────────────────────────┐
│  [Semestre 1 ▼] [+ Dupliquer semestre]                              │
│  Onglets: [Module 1] [Module 2] [Module 3] ...                      │
├──────────────────────────────┬──────────────────────────────────────┤
│      CONTRÔLE CONTINU        │     EXAMEN BLANC / FINAL ▼          │
├──────┬──────┬───────┬────┬───┼──────┬────┬───────┬─────────────────┤
│Appren│Ctrl1 │Ctrl2  │Moy │Coef│Appré│Notes│Coef│Points│Appréciation│
├──────┼──────┼───────┼────┼───┼──────┼────┼──────┼─────────────────┤
│Dupont│ 12   │ 14    │13.0│ 2 │ Bien │ 15 │ 2  │ 30   │ Très bien  │
│Martin│ 08   │ 10    │09.0│ 2 │Moyen │ 11 │ 2  │ 22   │ Passable   │
├──────┴──────┴───────┴────┴───┴──────┴────┴──────┴─────────────────┤
│ MOYENNE CLASSE: 11.00        │                                     │
└──────────────────────────────┴─────────────────────────────────────┘
```

### Modifications techniques

**Fichier: `src/components/grades/GradeSheetView.tsx`** (réécriture majeure)

1. **Navigation par modules** : Ajouter des onglets (Tabs) pour naviguer entre les modules de la formation, au lieu d'afficher tous les modules sur une seule page.

2. **Sélecteur de semestre/période** : Remplacer le filtre "Toutes les périodes" par un vrai sélecteur de semestre avec possibilité de **dupliquer un semestre** (bouton "Dupliquer ce semestre" qui crée une nouvelle période avec le même jeu d'évaluations).

3. **Tableau unifié CC + Examen** : Un seul tableau avec deux sections côte à côte :
   - **Gauche (CC)** : Colonnes Contrôle 1, Contrôle 2, ..., Moyenne, Coefficient, Appréciation
   - **Droite (Examen)** : Sélecteur "Examen Blanc" / "Examen Final" en en-tête, puis colonnes Notes, Coefficient, Points, Appréciation

4. **Sélecteur type d'examen** : Dropdown dans l'en-tête de la section examen permettant de basculer entre "Examen Blanc" et "Examen Final".

5. **Ligne Moyenne de classe** en bas du tableau.

**Fichier: `src/services/gradesService.ts`**
- Ajouter une fonction `duplicatePeriodWithEvaluations(sourcePeriodId, newPeriodName)` qui crée une nouvelle période et duplique les évaluations associées (sans les notes).

**Fichier: `src/components/grades/CreateEvaluationModal.tsx`**
- Aucune modification majeure, le modal existant est déjà fonctionnel.

### Détails d'implémentation

- Les onglets modules utilisent le composant `Tabs` existant
- Le sélecteur de type d'examen est un état local (`examType: 'examen_blanc' | 'examen_final'`) qui filtre les évaluations affichées dans la partie droite
- La duplication de semestre appelle une fonction service qui insère une nouvelle `evaluation_period` puis duplique toutes les `evaluations` de la période source avec les mêmes paramètres mais la nouvelle `period_id`
- Le tableau reste éditable avec les mêmes inputs et la même logique de sauvegarde

