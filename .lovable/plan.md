

# Plan : Réorganisation hiérarchique des onglets Administration

## Contexte

Actuellement, chaque onglet (Formations, Cahier de texte, Émargement, Emploi du temps) a sa propre logique de navigation. Le schéma fourni demande une structure unifiée :

```text
Onglet Admin
  └── Liste des Formations (groupées par programme)
        └── Liste des Promotions d'une formation
              └── Données spécifiques (cahier de texte / émargement / emploi du temps)
```

Et lors de la création d'une promotion, le système doit automatiquement créer les ressources associées (cahier de texte, emploi du temps — l'émargement étant déjà lié via `formation_id`).

## Étapes d'implémentation

### 1. Migration base de données

Aucune nouvelle table n'est nécessaire. Les tables `text_books`, `schedules`, et `attendance_sheets` utilisent déjà `formation_id` comme clé étrangère. La création d'une promotion = création d'une nouvelle formation (avec le même titre mais une année académique différente).

### 2. Auto-création des ressources à la création d'une promotion

**Fichier** : `src/services/formationService.ts` — méthode `duplicateFormationForNewYear` et aussi dans `CreateFormationModal.tsx` (lors de la première création).

Après la création de la formation (promotion), ajouter automatiquement :
- **Cahier de texte** : `INSERT INTO text_books` avec `formation_id` et un titre par défaut (ex: "Cahier de texte - {titre formation} {année}")
- **Emploi du temps** : `INSERT INTO schedules` avec `formation_id` et un titre par défaut (ex: "EDT - {titre formation} {année}")
- L'émargement n'a pas besoin de création préalable car les feuilles sont générées à la volée depuis les créneaux

### 3. Réorganisation de l'onglet Cahier de texte (`TextBooksList.tsx`)

Remplacer la vue actuelle par une navigation en 3 niveaux :
1. **Vue Formations** : Afficher les formations groupées par programme (même logique que `FormationsList`)
2. **Vue Promotions** : Cliquer sur un programme → voir ses promotions
3. **Vue Cahier de texte** : Cliquer sur une promotion → voir le cahier de texte existant ou en créer un

### 4. Réorganisation de l'onglet Emploi du temps (`ScheduleManagement.tsx`)

Même principe en 3 niveaux :
1. **Vue Formations** : Programmes groupés par nom
2. **Vue Promotions** : Promotions du programme sélectionné
3. **Vue Emploi du temps** : Sélection automatique de l'emploi du temps de la promotion → affichage du calendrier/créneaux

### 5. Réorganisation de l'onglet Émargement (`AttendanceManagement.tsx`)

La vue actuelle affiche déjà les formations en premier puis les feuilles. Il faut ajouter le niveau intermédiaire :
1. **Vue Formations** : Programmes groupés
2. **Vue Promotions** : Promotions du programme
3. **Vue Feuilles** : Feuilles d'émargement de la promotion sélectionnée

### 6. Composant partagé `FormationPromotionSelector`

Créer un composant réutilisable pour les 4 onglets qui gère :
- L'affichage des programmes sous forme de cartes
- La navigation vers les promotions d'un programme
- Le bouton retour
- La sélection d'une promotion pour accéder aux données

Ce composant sera utilisé par `FormationsList`, `TextBooksList`, `ScheduleManagement` et `AttendanceManagement` pour garantir une UX cohérente.

## Détails techniques

- **Groupement** : `formations` groupées par `title` (programme), chaque groupe contenant les promotions triées par `academic_year`
- **Auto-création** : Appels à `textBookService.createTextBook()` et `scheduleService.createSchedule()` dans `formationService.duplicateFormationForNewYear()` et dans le submit de `CreateFormationModal`
- **Données existantes** : Les formations existantes qui n'ont pas de cahier de texte ou d'emploi du temps verront un bouton "Créer" dans la vue promotion

## Fichiers impactés

| Fichier | Modification |
|---------|-------------|
| `src/components/administration/FormationPromotionSelector.tsx` | **Nouveau** — Composant partagé de navigation Formation → Promotion |
| `src/services/formationService.ts` | Auto-création cahier de texte + emploi du temps |
| `src/components/administration/CreateFormationModal.tsx` | Auto-création des ressources après création |
| `src/components/administration/TextBooksList.tsx` | Navigation hiérarchique Formation → Promotion → Cahier |
| `src/components/administration/ScheduleManagement.tsx` | Navigation hiérarchique Formation → Promotion → EDT |
| `src/components/administration/AttendanceManagement.tsx` | Ajout du niveau intermédiaire Promotion |
| `src/components/administration/FormationsList.tsx` | Utilisation du composant partagé (déjà structuré) |

