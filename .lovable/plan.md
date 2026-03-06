

## Problème identifié

Les tuteurs ne voient **aucune correction** de leurs apprentis dans l'onglet "Corrections" des modules. 

**Cause racine** : dans `ModuleCorrectionsTab.tsx` (ligne 41), seuls les rôles `Formateur` et `Admin` sont considérés comme pouvant voir les corrections. Le rôle `Tuteur` n'est pas géré — il tombe dans un "no man's land" (ni étudiant, ni admin/formateur), donc rien ne s'affiche.

Même problème dans `ModuleAssignmentsTab.tsx` : les tuteurs ne voient pas les soumissions/corrections de leurs apprentis.

---

## Plan de correction

### 1. `ModuleCorrectionsTab.tsx` — Ajouter la vue tuteur

- Détecter `isTuteur = userRole === 'Tuteur'`
- Récupérer l'ID de l'apprenti du tuteur via `tutor_student_assignments`
- Filtrer les soumissions pour ne montrer que celles de l'apprenti (comme la vue étudiant, mais avec l'ID de l'apprenti au lieu de `userId`)
- Afficher les corrections publiées en lecture seule (même UI que la vue étudiant)

### 2. `ModuleAssignmentsTab.tsx` — Ajouter la vue tuteur

- Détecter `isTuteur`
- Récupérer l'ID de l'apprenti
- Montrer les devoirs avec le statut de soumission de l'apprenti (lecture seule, pas de bouton "Rendre mon devoir")
- Permettre de voir les corrections publiées via le bouton "Voir correction"

### 3. Vérification RLS

- Les tables `assignment_submissions` et `assignment_corrections` utilisent `can_access_module()` qui gère déjà les tuteurs (via `tutor_student_assignments`). Pas de modification RLS nécessaire.

### Fichiers modifiés
- `src/components/module/ModuleCorrectionsTab.tsx`
- `src/components/module/ModuleAssignmentsTab.tsx`

