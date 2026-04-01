

## Plan : Corriger l'erreur de build OOM et la tempête de refresh tokens

### Problème identifié

Le projet ne compile plus (erreur **Out of Memory**) car tous les composants sont importés de manière statique dans `App.tsx` — plus de 40 pages chargées directement. Cela dépasse la mémoire disponible lors du build.

En parallèle, les logs d'authentification montrent une **tempête de refresh tokens** (des dizaines de requêtes `/token` par seconde) qui finit par déclencher un rate limit 429, empêchant la connexion.

---

### Étape 1 — Lazy loading de toutes les pages (résout l'OOM)

Remplacer tous les imports statiques des pages dans `App.tsx` par des imports dynamiques avec `React.lazy()` :

```typescript
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Administration = React.lazy(() => import('./pages/Administration'));
const Formations = React.lazy(() => import('./pages/Formations'));
// ... toutes les 40+ pages
```

Encapsuler les `<Routes>` dans `<React.Suspense>` avec un fallback de chargement.

Cela divise le bundle en dizaines de chunks chargés à la demande au lieu d'un seul monolithe.

**Fichier modifié :** `src/App.tsx`

---

### Étape 2 — Corriger la tempête de refresh tokens

Dans `AuthContext.tsx`, ajouter un **debounce/guard** sur `fetchUserRole` pour éviter les appels multiples simultanés quand `onAuthStateChange` se déclenche en rafale :

- Ajouter un `useRef` pour tracker si un fetch est déjà en cours
- Ignorer les appels redondants quand le même `userId` est déjà en cours de traitement
- Ajouter un délai de 300ms avant de lancer le fetch dans le listener `onAuthStateChange`

**Fichier modifié :** `src/contexts/AuthContext.tsx`

---

### Étape 3 — Optimiser le chunking Vite

Mettre à jour `vite.config.ts` pour augmenter la mémoire Node si nécessaire et améliorer le `manualChunks` pour mieux répartir les modules volumineux.

**Fichier modifié :** `vite.config.ts`

---

### Résultat attendu

- Le build passe sans erreur OOM grâce au code splitting
- La connexion fonctionne sur desktop sans rate limit 429
- Aucune fonctionnalité existante n'est modifiée

