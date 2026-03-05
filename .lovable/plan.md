

## Diagnostic

Le problème principal : la zone éditable (`word-editable-area`) n'a **aucun padding vertical** (ligne 1096 : `padding: 0 var(--page-padding-x)`). Le texte saisi commence donc à y=0, mais l'overlay `::after` (z-index 1) masque les 96px du haut avec du blanc. Résultat : le texte est tapé derrière la marge blanche et reste invisible.

De plus, l'overlay `::after` a `z-index: 1` et `::before` a `z-index: 2`, ce qui empêche les clics dans certaines zones de la page (même avec `pointer-events: none`, le curseur de saisie ne se positionne pas correctement car le contenu n'est pas aligné avec les zones visibles).

---

## Plan de correction

### 1. Corriger le padding vertical de la zone éditable
**Fichier** : `src/components/workspace/WorkspaceTextEditor.tsx`

- Ligne 1096 : changer `padding: 0 var(--page-padding-x)` en `padding: var(--page-padding-y) var(--page-padding-x)`
- Cela aligne le texte avec la zone visible entre les marges hautes et basses de chaque page simulée

### 2. Ajuster le repeating-gradient de l'overlay `::after`
L'overlay doit tenir compte du fait que le contenu commence maintenant à 96px. Le gradient actuel masque déjà correctement les marges si le padding est correct — aucun changement nécessaire sur le gradient lui-même.

### 3. S'assurer que le contenu initial est un paragraphe vide cliquable
- Dans le `useEffect` d'initialisation (ligne 124-129), si `doc.content?.html` est vide/absent, injecter `<p><br></p>` pour que le curseur se place correctement au premier clic.

---

### Résultat attendu
- Le texte saisi sera visible immédiatement dans la zone blanche de la page
- Le clic n'importe où sur la page positionnera le curseur correctement
- Le comportement multi-pages reste identique (marges hautes/basses simulées par les overlays)

