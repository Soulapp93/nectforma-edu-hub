

## Plan : Amélioration du partage et des paramètres du questionnaire

### Problèmes identifiés

1. **Partage** : La modale de partage actuelle (lignes 836-864) est une simple boîte avec lien public + aperçu. Elle n'utilise PAS le composant `ShareDocumentModal` universel comme les autres outils (tableur, présentation, etc.). Il manque le partage individuel et par classe.

2. **Paramètres non fonctionnels** : Les `Switch` et la couleur du thème mettent à jour la base via `questionnaireService.updateQuestionnaire()`, mais le problème est que le service utilise `const db = supabase as any` et les mises à jour semblent fonctionner côté code. Le vrai problème pourrait être que la couleur du thème n'est **pas appliquée visuellement** dans l'éditeur (aucun style dynamique ne l'utilise), et les paramètres comme `shuffle_questions`, `show_progress_bar` ne sont visibles que sur la page publique, pas dans l'éditeur — ce qui donne l'impression que "rien ne fonctionne".

### Modifications prévues

**1. Remplacer la modale de partage par `ShareDocumentModal` + lien public**

- **Fichier** : `src/components/workspace/WorkspaceQuestionnaireEditor.tsx`
- Remplacer la `Dialog` de partage actuelle (lignes 836-864) par une nouvelle modale qui contient **deux onglets** :
  - **Onglet "Lien public"** : Le lien public existant (`/questionnaire/{token}`), bouton copier, aperçu, avertissement si non publié — identique à l'actuel
  - **Onglet "Collaborateurs"** : Intègre `ShareDocumentModal` pour le partage individuel et par classe (comme tableur, présentation, etc.)
- Utiliser le `doc.id` comme `documentId` pour le partage via `ShareDocumentModal`

**2. Rendre les paramètres visuellement fonctionnels**

- **Fichier** : `src/components/workspace/WorkspaceQuestionnaireEditor.tsx`
- Appliquer la `theme_color` visuellement dans l'éditeur :
  - Le `border-t-4 border-t-primary` de la card description (ligne 653) utilisera `style={{ borderTopColor: questionnaire.theme_color }}` au lieu de la classe Tailwind
  - Les badges et accents de l'éditeur utiliseront `theme_color` dynamiquement
- Ajouter un toast de confirmation après chaque changement de paramètre pour rassurer l'utilisateur
- Ajouter un indicateur visuel de sauvegarde (ex: "✓ Sauvegardé") à côté de chaque Switch après la mise à jour réussie

**3. Appliquer la couleur du thème sur la page publique** (déjà partiellement fait)

- **Fichier** : `src/pages/QuestionnairePublic.tsx`
- Le `borderTopColor` et le bouton submit utilisent déjà `questionnaire.theme_color` — vérifier que c'est bien appliqué partout (sélection de choix, barre de progression, etc.)

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/components/workspace/WorkspaceQuestionnaireEditor.tsx` | Nouvelle modale avec onglets (lien public + ShareDocumentModal), application visuelle de theme_color, toasts de confirmation sur paramètres |
| `src/pages/QuestionnairePublic.tsx` | Application cohérente de theme_color sur tous les éléments interactifs |

