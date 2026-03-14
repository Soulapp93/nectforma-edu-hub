

## Plan: Restructurer la page Notes avec navigation par formation

### Objectif
Réorganiser la page Notes & Évaluations pour afficher d'abord la liste des formations (comme la page Émargements), puis au clic sur une formation, afficher les onglets "Feuilles de notes" et "Relevés de notes" avec navigation par modules.

### Modifications

**1. `src/pages/Notes.tsx`** — Réécriture

- Ajouter un état `selectedFormationId` pour gérer la navigation formations → détail
- **Vue liste** : Afficher toutes les formations sous forme de cartes cliquables (même pattern que `AttendanceManagement.tsx`) avec couleur, titre, niveau, dates, statut
- **Vue détail** : Au clic, afficher un bouton "Retour aux formations" + onglets "Feuilles de notes" / "Relevés de notes"
- Passer `formationId` en prop à `GradeSheetView` et `TranscriptsPanel` au lieu de laisser ces composants gérer leur propre sélecteur de formation
- Bouton "Paramètres de notation" accessible depuis la vue liste (admin uniquement)
- Les vues Étudiant et Tuteur restent inchangées

**2. `src/components/grades/GradeSheetView.tsx`** — Modification des props

- Ajouter prop `formationId: string` à l'interface `GradeSheetViewProps`
- Supprimer le sélecteur de formation interne (le `Select` de formation en haut)
- Utiliser directement `props.formationId` au lieu de `selectedFormation` pour toutes les requêtes
- Conserver la navigation par modules (onglets), le sélecteur de période, et le tableau CC + Examen

**3. `src/components/grades/TranscriptsPanel.tsx`** — Modification des props

- Ajouter prop optionnelle `formationId?: string` à l'interface `Props`
- Si `formationId` est fourni, l'utiliser directement au lieu du sélecteur interne
- Masquer le sélecteur de formation quand `formationId` est passé en prop

### Structure de navigation

```text
Notes & Évaluations
├── [Formation BTS GPME]  ──click──►  Feuilles de notes | Relevés de notes
├── [Formation BTS MCO]   ──click──►  Feuilles de notes | Relevés de notes
├── [Formation ...]       ──click──►  ...
└── [⚙ Paramètres]        (admin)
```

### Détails techniques
- Requête formations : admin = toutes, formateur = via `user_formation_assignments`
- Pattern identique à `AttendanceManagement` : état `view` implicite via `selectedFormationId` (null = liste, string = détail)
- Aucun changement de base de données requis

