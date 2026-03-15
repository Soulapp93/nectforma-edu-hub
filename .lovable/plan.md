

## Plan: Système de relevés de notes personnalisables par formation

### Objectif
Permettre à chaque établissement de créer et personnaliser ses propres modèles de bulletin (relevé de notes) par formation, en exploitant la table `transcript_templates` déjà existante en base.

### Architecture

```text
Formation sélectionnée
├── Feuilles de notes
├── Relevés de notes
│   ├── Bouton ⚙ "Configurer le modèle" (par formation)
│   │   └── Ouvre un éditeur de template
│   └── Affichage du bulletin selon le template configuré
```

### Modifications

**1. Nouveau composant `src/components/grades/TranscriptTemplateEditor.tsx`**

Éditeur de modèle de bulletin accessible depuis l'onglet "Relevés de notes" via un bouton ⚙. Il permet de configurer :

- **Sections du bulletin** (catégories) : L'établissement peut créer/réordonner des catégories (ex: "MATIÈRES GÉNÉRALES", "MATIÈRES PROFESSIONNELLES", "ORAUX") et y affecter des modules par drag ou sélection. Cela se stocke dans `columns_config` sous forme de JSON `{ sections: [{ id, title, moduleIds: [] }] }`.
- **En-tête** (`header_config`) : Choix d'afficher ou non le logo, le titre personnalisé du bulletin, les infos de session, un sous-titre.
- **Colonnes visibles** : Choix des colonnes à afficher dans la section CC (Moyenne Stagiaire, Moyenne Classe, Appréciations) et Examen (Notes, Coef, Points, Appréciation). Stocké dans `columns_config.visibleColumns`.
- **Pied de page** (`footer_config`) : Texte personnalisé, signature, mention d'assiduité.
- **Style** (`style_config`) : Couleur principale du tableau (au lieu du bleu par défaut).
- **Nom du modèle** et possibilité d'en avoir un par formation via `grading_rules.transcript_template_id`.

**2. Modification de `src/components/grades/TranscriptsPanel.tsx`**

- Ajouter un bouton ⚙ "Configurer le modèle" à côté des contrôles (visible admin uniquement)
- Charger le `transcript_template` associé à la formation (via `grading_rules.transcript_template_id` ou template par défaut de l'établissement)
- Remplacer l'affichage statique par un rendu dynamique basé sur le template :
  - Les modules sont regroupés par **sections personnalisées** au lieu du groupement par UE uniquement
  - Les colonnes affichées suivent la config du template
  - Les couleurs et en-tête/pied de page suivent la config

**3. Modification de `src/services/gradesService.ts`**

Ajouter les fonctions CRUD pour les templates :
- `getTranscriptTemplate(formationId)` — récupère le template lié via grading_rules ou le défaut
- `upsertTranscriptTemplate(template)` — crée ou met à jour un template
- `getEstablishmentTemplates(establishmentId)` — liste les templates de l'établissement

**4. Modification de `src/pages/Notes.tsx`**

- Déplacer le bouton "Paramètres" global vers un bouton ⚙ par formation (dans la vue détail de chaque formation, à côté des onglets), afin que chaque formation ait ses propres paramètres.

### Structure JSON du template (stockée dans `transcript_templates`)

```json
{
  "columns_config": {
    "sections": [
      { "id": "s1", "title": "MATIÈRES GÉNÉRALES", "moduleIds": ["mod-1", "mod-2"] },
      { "id": "s2", "title": "MATIÈRES PROFESSIONNELLES", "moduleIds": ["mod-3", "mod-4"] },
      { "id": "s3", "title": "ORAUX", "moduleIds": ["mod-5"] }
    ],
    "ccColumns": ["moyenne_stagiaire", "moyenne_classe", "appreciation"],
    "examColumns": ["notes", "coefficient", "points", "appreciation"],
    "showExamSection": true
  },
  "header_config": {
    "title": "Bulletin de Formation",
    "showLogo": true,
    "showSession": true,
    "subtitle": ""
  },
  "footer_config": {
    "showAssiduity": true,
    "customText": "",
    "showSignature": true
  },
  "style_config": {
    "primaryColor": "#3b82f6",
    "fontFamily": "Segoe UI"
  }
}
```

### Détails techniques

- La table `transcript_templates` existe déjà avec tous les champs nécessaires (`columns_config`, `header_config`, `footer_config`, `style_config`, `establishment_id`). Aucune migration requise.
- Le lien formation → template passe par `grading_rules.transcript_template_id` (FK existante).
- Le rendu du bulletin dans `TranscriptsPanel` devient dynamique : si un template existe, les modules sont groupés par sections du template ; sinon, fallback sur le groupement par UE actuel.
- L'éditeur de template s'ouvre dans un Dialog/Sheet depuis la vue relevés.

