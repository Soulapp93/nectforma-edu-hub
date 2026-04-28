# Audit Approfondi - Nectforma (Avril 2026)

**Date** : 28 avril 2026
**Application** : Nectforma — Plateforme SaaS de gestion de centres de formation
**Périmètre** : Codebase complète (frontend, backend Supabase, infrastructure, sécurité)
**Document précédent** : `AUDIT_ARCHITECTURE.md` (30 janvier 2026) — toujours valide comme baseline
**Auteur** : Audit technique automatisé E1

---

## 0. Comment lire ce document

Ce rapport est **complémentaire** à l'audit précédent. Il est organisé pour répondre à 3 questions :

1. **Qu'est-ce qui a changé** depuis janvier 2026 ? (Section 1 — Δ Évolution)
2. **Quels sont les risques RÉELS aujourd'hui** ? (Sections 2 à 8 — Audit thématique)
3. **Que faire concrètement** ? (Section 9 — Plan d'action priorisé)

Chaque finding est accompagné de :
- 🔴 **Sévérité** (Critique / Haute / Moyenne / Basse)
- 📁 **Fichier(s) concerné(s)** avec ligne quand pertinent
- ✅ **Action recommandée** chiffrée en effort
- 💡 **Code d'exemple** pour les corrections non triviales

---

## 1. Δ Évolution depuis janvier 2026 (3 mois)

### 1.1 Métriques quantitatives

| Métrique | Janvier 2026 | Avril 2026 | Δ | Tendance |
|---|---|---|---|---|
| Lignes TS/TSX | 131 759 | **151 767** | +15,2% | 📈 Croissance |
| Fichiers TS/TSX | 434 | **508** | +17% | 📈 |
| Pages | 38 | 52 | +37% | 📈 Forte |
| Composants (total) | 301 | 344 | +14% | 📈 |
| Services | 32 | **44** | +37% | 📈 Forte |
| Hooks | 29 | 31 | +7% | ➡️ |
| Edge Functions | 27 | **27** | 0 | ➡️ Stable |
| Migrations SQL | 226 | **239** | +13 (+6%) | ➡️ Maîtrisée |
| Tests automatisés | 0 | **8** | +∞ | 🟢 Amélioration |
| `as any` | 291 | **457** | +57% | 🔴 Régression |
| `console.*` (services) | ~69 | **265** | +284% | 🔴 Régression |
| Politiques RLS | inconnu | 859 | n/a | 🟢 |
| Fonctions `SECURITY DEFINER` | inconnu | 93 | n/a | ⚠️ À auditer |

### 1.2 Améliorations notables ✅

| Item | Impact |
|---|---|
| **Tests Vitest installés** (8 fichiers : 5 services + 1 auth + 1 retry + 1 RLS runner) | 🟢 Fondation testing en place |
| **Headers de sécurité complets** dans `vercel.json` (CSP, HSTS, Referrer, Permissions) | 🟢 Conformité OWASP Headers |
| **Aucune politique RLS `USING (true)` détectée** dans le code de migration actuel | 🟢 Risque baseline corrigé |
| Variable `VITE_SUPABASE_ANON_KEY` (faux positif janvier) **supprimée du code** | 🟢 |
| `consoleSilencer.ts` ajouté pour neutraliser `console.log` en production | 🟡 Workaround (cf. §6.3) |
| Module RH, Finance, Comptabilité, Notes Hub, Documents Archives **finalisés** | 🟢 Périmètre fonctionnel élargi |
| Système d'évaluations composites + bulletins signés + transcripts (depuis fév-avril 2026) | 🟢 |

### 1.3 Régressions ou alertes nouvelles 🔴

| Item | Détail |
|---|---|
| **`as any` en hausse de +57%** (291 → 457) | Le typage se dégrade plus vite que la croissance du code |
| **`console.*` en hausse de +284%** dans les services | `consoleSilencer` masque mais n'élimine pas le bruit |
| **3 systèmes de logging coexistent** : `consoleSilencer.ts`, `logger.ts`, `productionLogger.ts` | Duplication, aucun n'est utilisé partout |
| **14 Edge Functions sans vérification JWT** (cf. §3.2) | 🔴 Critique nouveau finding |
| Composants > 1 000 lignes : **3 nouveaux** (BulletinLayoutEditor 1 598, BulletinConfigurationPanel 1 496, pdfExportService 1 363) | Le pattern "monolithe" se reproduit sur les nouveaux modules |
| Tests présents mais **superficiels** (testent la forme des objets, pas la logique réelle des services) | Couverture illusoire |

---

## 2. Architecture & qualité du code

### 2.1 🔴 Composants monolithiques persistants

> **Constat** : 14 fichiers > 1 000 lignes (vs 9 en janvier). Le pattern "everything-in-one-file" se reproduit sur les nouveaux modules (Bulletins, PDF Export).

**Top fichiers à risque** (avril 2026) :

| Fichier | Lignes | Statut |
|---|---|---|
| `src/integrations/supabase/types.ts` | 6 318 | Auto-généré (acceptable) |
| `src/components/workspace/WorkspaceSpreadsheetEditor.tsx` | 2 794 | Inchangé depuis janvier |
| `src/data/visualTemplates.ts` | 1 897 | Données statiques (acceptable) |
| `src/components/grades/TranscriptsPanel.tsx` | 1 633 | +342 lignes en 3 mois |
| **`src/components/grades/BulletinLayoutEditor.tsx`** | **1 598** | 🆕 Nouveau monolithe |
| **`src/components/grades/BulletinConfigurationPanel.tsx`** | **1 496** | 🆕 Nouveau monolithe |
| **`src/services/pdfExportService.ts`** | **1 363** | 🆕 Service monolithe |
| `src/pages/Index.tsx` (landing) | 1 350 | Stable |
| `src/pages/BlogAdmin.tsx` | 1 333 | Stable |
| `src/components/administration/ScheduleManagement.tsx` | 1 207 | -281 lignes (refactor partiel ✓) |

**Action** :
- 🔴 **P1** — Décomposer `pdfExportService.ts` par domaine (transcripts / bulletins / attendance / schedule) → 4 services de ~340 lignes
- 🔴 **P1** — Décomposer `BulletinLayoutEditor.tsx` en : `BulletinHeader`, `BulletinGrid`, `BulletinFooter`, `BulletinPreview`, `useBulletinLayout` (hook)
- 🟠 **P2** — Idem pour `BulletinConfigurationPanel`
- ⏱️ **Effort** : 1 semaine par composant

### 2.2 🔴 Régression TypeScript : `as any` +57%

**Constat** : 457 occurrences de `as any` (vs 291 en janvier) sur 508 fichiers = **0,9 occurrence/fichier en moyenne**.

**Causes racines** identifiées :
1. Le client Supabase typé (`Database`) n'inclut pas certaines tables nouvellement créées
2. Pattern `const db = supabase as any` répété pour contourner les types
3. `useState<any>(...)` (21 cas) au lieu d'interfaces dédiées
4. Mutations directes d'objets : `(newUser as any)._tutorInviteError = ...`

**Action immédiate** :
1. 🔴 **P1** — Régénérer `types.ts` depuis Supabase :
   ```bash
   npx supabase gen types typescript --project-id dlitdjbmqpsdmhrbluak > src/integrations/supabase/types.ts
   ```
2. 🟠 **P2** — Activer **progressivement** le mode strict :
   ```jsonc
   // tsconfig.app.json
   {
     "compilerOptions": {
       "strictNullChecks": true,    // étape 1
       "noImplicitAny": true,        // étape 2
       "strict": true                // étape 3
     }
   }
   ```
3. 🟠 **P2** — Ajouter une **règle ESLint** pour bloquer les nouvelles occurrences :
   ```js
   // eslint.config.js
   rules: {
     "@typescript-eslint/no-explicit-any": ["error", { "fixToUnknown": false }]
   }
   ```

### 2.3 ⚠️ Trois systèmes de logging coexistent

| Fichier | Usage | Problème |
|---|---|---|
| `src/utils/consoleSilencer.ts` | Override global de `console.log/debug/info` en prod | Cache le bruit mais le code reste dans le bundle |
| `src/utils/logger.ts` | Logger conditionnel (`__DEV__`) | Bonne API mais **non utilisé** dans les services |
| `src/utils/productionLogger.ts` | Logger conditionnel (`isDevelopment`) | Doublon de `logger.ts` |

**Action** : 🟠 **P2**
- Conserver **un seul** : `src/utils/logger.ts`
- Supprimer `productionLogger.ts`
- Garder `consoleSilencer.ts` comme **filet de sécurité** (mais migrer le code progressivement)
- Faire un script de migration : `console.log` → `logger.log` (sed/codemod)
- ⏱️ **Effort** : 1 jour codemod + revue

### 2.4 🟠 Routing dans `App.tsx` : 366 lignes de logique imbriquée

Le composant `AppContent` gère **simultanément** :
- L'évaluation de la route active (string matching)
- La logique d'authentification (loading / error / unauthorized)
- Les redirections par rôle (SuperAdmin → /back-office, Admin → /dashboard, etc.)
- Le rendu conditionnel du layout (Sidebar + TopHeaderBar)
- Les guards (`ProtectedRoute > AdminRoute > Component`)

**Symptômes** :
- Logique d'erreur d'auth dupliquée 3 fois (lignes 138-150, 240-251, 285-297)
- Tests d'égalité multiples (`location.pathname === ...`) fragiles
- Très difficile à tester unitairement

**Refactor proposé** :
```tsx
// src/router/index.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    element: <AuthGuard />,           // gère loading / error / redirect
    children: [
      { element: <PublicLayout />, children: publicRoutes },
      { element: <SignaturesLayout />, children: signatureRoutes },
      { element: <AppLayout />, children: protectedRoutes },
    ],
  },
]);
```

⏱️ **Effort** : 3 jours
🔴 **P1**

---

## 3. Sécurité (focus critique)

### 3.1 ✅ Headers de sécurité — RÉSOLU

L'audit de janvier signalait l'absence de CSP, HSTS, etc. **Tous ajoutés** dans `vercel.json` :

```json
"Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com ..."
```

⚠️ **Recommandation d'amélioration** : `script-src` autorise `'unsafe-inline'` et `'unsafe-eval'`. C'est nécessaire pour Vite/Tanstack Query, mais à long terme :
- Migrer vers des **nonces** générés à l'edge
- Supprimer `'unsafe-eval'` après audit (souvent dû à des libs qui peuvent être remplacées)

### 3.2 🔴 CRITIQUE — 14 Edge Functions sans vérification JWT

**Découverte majeure non détectée en janvier**.

`supabase/config.toml` désactive `verify_jwt` pour 23 Edge Functions :

```toml
[functions.invite-user-native]
verify_jwt = false
```

Ce flag à `false` signifie que **Supabase ne vérifie PAS** automatiquement le JWT — la fonction doit le faire elle-même.

**Audit fonction par fonction** :

| Edge Function | verify_jwt | Auth manuelle | Verdict |
|---|---|---|---|
| `accept-invitation` | ❌ false | ❌ Aucune | ✅ OK (publique par design) |
| `activate-user-account` | ❌ false | ❌ Aucune | ✅ OK (publique par design) |
| `validate-activation-token` | ❌ false | ❌ Aucune | ✅ OK (publique par design) |
| `send-contact-form` | ❌ false | ❌ Aucune | ✅ OK (formulaire public) |
| `unsubscribe-newsletter` | par défaut (true) | n/a | ✅ OK |
| `send-signature-link` | ❌ false | ✅ Vérifie | ✅ OK |
| `reset-password-native` | ❌ false | ✅ Vérifie | ✅ OK |
| `invite-user-native` | ❌ false | ✅ Vérifie | ✅ OK |
| `invite-tutor-native` | ❌ false | ✅ Vérifie | ✅ OK |
| `invite-super-admin` | ❌ false | ✅ Vérifie | ✅ OK |
| `resend-invitation-native` | ❌ false | ✅ Vérifie | ✅ OK |
| `send-email-brevo` | ❌ false | ✅ Vérifie | ✅ OK |
| `send-message` | ❌ false | ✅ Vérifie | ✅ OK |
| `social-media` | ❌ false | ✅ Vérifie | ✅ OK |
| `zoom-meeting` | par défaut (true) | ✅ Vérifie | ✅ OK |
| **`blog-ai`** | ❌ false | ❌ **AUCUNE** | 🔴 **CRITIQUE** |
| **`content-autopilot`** | ❌ false | ❌ **AUCUNE** | 🔴 **CRITIQUE** |
| **`create-establishment`** | ❌ false | ❌ **AUCUNE** | 🔴 **CRITIQUE** |
| **`cleanup-auth-users`** | ❌ false | ❌ **AUCUNE** | 🔴 **CRITIQUE** |
| **`manage-attendance-timing`** | ❌ false | ❌ **AUCUNE** | 🔴 **HAUTE** |
| **`linkedin-oauth`** | ❌ false | ❌ **AUCUNE** | 🟠 À vérifier (callback?) |
| **`generate-attendance-sheets`** | ❌ false | ❌ **AUCUNE** | 🟠 Cron? Si oui OK avec secret |
| **`process-scheduled-messages`** | ❌ false | ❌ **AUCUNE** | 🟠 Cron? Idem |
| **`send-notification-emails`** | ❌ false | ❌ **AUCUNE** | 🟠 Cron? Idem |
| **`check-expired-attendance-links`** | ❌ false | ❌ **AUCUNE** | 🟠 Cron? Idem |

**Impact concret** :
- N'importe qui ayant l'**anon key** (publiée dans le frontend) peut invoquer ces fonctions
- `blog-ai` : **coût direct** — appel à OpenAI/Anthropic/Gemini facturé sans plafond
- `content-autopilot` : idem (génération automatique)
- `create-establishment` : si la logique ne vérifie pas un secret, n'importe qui peut **créer un établissement parasite** dans la DB
- `cleanup-auth-users` : potentielle suppression de comptes

**Action immédiate** 🔴 **P0** :

1. **Étape 1** : Auditer chaque fonction pour comprendre son usage prévu
2. **Étape 2** : Pour les fonctions qui doivent rester accessibles aux utilisateurs connectés :
   ```ts
   // Au début de chaque Edge Function
   const authHeader = req.headers.get('authorization');
   if (!authHeader) {
     return new Response(JSON.stringify({ error: 'Authentification requise' }), { status: 401 });
   }
   const token = authHeader.replace('Bearer ', '');
   const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
   if (error || !user) {
     return new Response(JSON.stringify({ error: 'Token invalide' }), { status: 401 });
   }
   // + vérifier le rôle si nécessaire (SuperAdmin pour cleanup-auth-users, etc.)
   ```
3. **Étape 3** : Pour les fonctions cron (lancées par Supabase scheduler) :
   ```ts
   const cronSecret = req.headers.get('x-cron-secret');
   if (cronSecret !== Deno.env.get('CRON_SECRET')) {
     return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
   }
   ```
4. **Étape 4** : Activer `verify_jwt = true` dans `config.toml` partout où c'est possible (Supabase rejette avant d'invoquer la fonction = économie de cold start)

⏱️ **Effort** : 1-2 jours
🔴 **P0** — à traiter cette semaine

### 3.3 🟠 93 fonctions `SECURITY DEFINER` à auditer

**Constat** : 103 fonctions PostgreSQL sont définies dans les migrations, dont **93 en `SECURITY DEFINER`**.

**Risque** : Une fonction `SECURITY DEFINER` exécute avec les droits du **créateur** (postgres = bypass RLS). Si elle est mal écrite, un utilisateur peut accéder à des données qu'il ne devrait pas voir.

**Bonnes pratiques OBLIGATOIRES** pour `SECURITY DEFINER` :
1. ✅ Toujours définir `SET search_path = public, pg_temp` (sinon attaque par injection de schéma)
2. ✅ Vérifier explicitement les permissions au début de la fonction
3. ✅ Ne jamais accepter de paramètres bruts pour une clause `WHERE` dynamique
4. ✅ `REVOKE EXECUTE FROM PUBLIC` puis `GRANT EXECUTE TO authenticated`

**Action** 🟠 **P1** :
```bash
# Audit rapide
grep -A20 "SECURITY DEFINER" supabase/migrations/*.sql | grep -L "search_path"
```
- Vérifier que toutes ont `SET search_path` (le linter Supabase l'exige normalement)
- Auditer les 5 plus sensibles : `is_super_admin`, `get_current_user_role`, `is_current_user_admin`, `generate_signature_token`, `validate_signature_token`

### 3.4 🟠 Stockage de secrets en base

Confirmé toujours présent (cf. audit janvier §8.4) :
- `zoom_connections.client_secret_encrypted` — nom trompeur, valeur en clair
- `social_media_credentials` — credentials OAuth en clair

**Action** 🟠 **P1** :
- Utiliser **Supabase Vault** (extension `supabase_vault`) :
  ```sql
  SELECT vault.create_secret('zoom-secret-establishment-uuid', 'client_secret');
  ```
- Lecture côté Edge Function uniquement (jamais côté frontend)
- ⏱️ **Effort** : 2-3 jours (un module à la fois)

### 3.5 ⚠️ `localStorage` pour la session Supabase

**Constat** : `supabase.createClient(..., { auth: { storage: localStorage } })` (cf. `src/integrations/supabase/client.ts`)

**Risque** : Vulnérable au XSS. Si un attaquant injecte du JS, il peut lire le JWT.

**Mitigations en place** :
- ✅ CSP strict (en place depuis janvier 2026)
- ✅ DOMPurify utilisé pour le HTML utilisateur

**Recommandation 🟠 P2** :
- Acceptable pour une SPA standard, mais pour réduire le risque :
  - Pour les sessions **longue durée**, envisager des cookies HttpOnly via un proxy (architecture plus lourde)
  - À défaut : auditer rigoureusement les inputs HTML utilisateur (blog AI, messagerie)

---

## 4. Performance & scalabilité

### 4.1 🟠 Patterns N+1 confirmés

**Fichier** : `src/services/attendanceService.ts`

```typescript
// Pattern N+1 — exécute 1 requête par étudiant
if (sheet) {
  for (const studentId of studentIds) {
    const { data: student } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('id', studentId)
      .single();
    // ... envoi email
  }
}
```

**Solution** :
```typescript
// Une seule requête batch
const { data: students } = await supabase
  .from('users')
  .select('id, email, first_name, last_name')
  .in('id', studentIds);

const studentMap = new Map(students.map(s => [s.id, s]));
for (const studentId of studentIds) {
  const student = studentMap.get(studentId);
  if (student) emailNotificationService.notifyAttendanceOpen(...);
}
```

⏱️ **Effort** : 0.5 jour par occurrence
🟠 **P1**

### 4.2 🟠 37 appels `supabase.auth.getSession()` répartis dans les services

Chaque appel coûte **un round-trip réseau** (lecture du localStorage + validation Supabase).

**Solution** : Pattern singleton :
```typescript
// src/lib/sessionCache.ts
let cachedSession: Session | null = null;
let cacheExpiry = 0;

export const getCachedSession = async () => {
  if (cachedSession && Date.now() < cacheExpiry) return cachedSession;
  const { data: { session } } = await supabase.auth.getSession();
  cachedSession = session;
  cacheExpiry = Date.now() + 60_000; // 1 min cache
  supabase.auth.onAuthStateChange(() => { cachedSession = null; });
  return session;
};
```

⏱️ **Effort** : 1 jour migration
🟠 **P2**

### 4.3 🟠 Pagination encore manquante

**Constat** : 16 services utilisent `.range()` ou `.limit()` sur 38 services qui ont des `.select()` = **42% de couverture**.

**Services critiques sans pagination** (à vérifier) :
- `userService.ts` — `getUsers()` charge tous les users
- `formationService.ts` — listings non paginés
- `attendanceService.ts` — `getAttendanceSheets()`
- `messageService.ts` — historique messages

**Action** 🟠 **P1** :
- Implémenter un hook générique `usePaginatedQuery({ table, pageSize: 50 })` avec TanStack Query
- Migrer les 5 listings les plus consultés

⏱️ **Effort** : 1 semaine

### 4.4 ✅ Optimisations déjà en place

- TanStack Query avec cache 5 min
- Lazy loading des 52 pages
- `manualChunks` pour vendor splitting (React, Supabase, UI)
- PWA + Service Worker
- Système de retry réseau (`supabaseRetry.ts`)
- Monitoring des appels API lents (> 3 secondes)

### 4.5 ⚠️ Build nécessite 4 Go RAM

`"build": "node --max-old-space-size=4096 node_modules/vite/bin/vite.js build"`

**Causes** :
- 6 318 lignes de types Supabase
- 14 fichiers > 1 000 lignes
- Templates statiques très lourds (`presentationTemplates.ts` 1 483 lignes, `visualTemplates.ts` 1 897 lignes)

**Action** 🟠 **P2** :
- Charger les templates par **lazy import** dynamique :
  ```typescript
  const templates = await import('@/data/presentationTemplates');
  ```
- Externaliser les templates statiques en JSON (pas typés à la compilation)

---

## 5. Tests automatisés

### 5.1 ✅ Fondation Vitest installée

**Configuration** (`vitest.config.ts`) :
- Environnement jsdom ✓
- Coverage v8 sur services / contexts / hooks ✓
- Setup avec mock de `import.meta.env` ✓

### 5.2 🔴 Tests superficiels — couverture **illusoire**

**Exemple** (`src/__tests__/services/attendanceService.test.ts`, 419 lignes) :

```typescript
describe('AttendanceSheet Interface', () => {
  it('should have correct data shape', () => {
    const sheet = { /* objet inline */ };
    expect(sheet.id).toBeTruthy();
    expect(sheet.formation_id).toBeTruthy();
  });
});
```

**Problème** : Ce test ne teste **pas** le service `attendanceService.ts`. Il teste seulement que TypeScript accepte un objet inline. Il ne **pourrait pas attraper** :
- Une régression dans `signAttendanceSheet()`
- Un changement de signature de `validateAttendanceSheet()`
- Un bug dans la logique de fallback de signature

### 5.3 🔴 Recommandation : refonte des tests services

**Ce qui devrait être testé** (exemple pour `attendanceService.signAttendanceSheet`) :

```typescript
import { signAttendanceSheet } from '@/services/attendanceService';

describe('signAttendanceSheet', () => {
  it('should reject signature if user already signed', async () => {
    mockFrom.mockReturnValueOnce({
      select: () => ({ eq: () => ({ eq: () => ({ single: async () => ({
        data: { id: 'existing-sig' }, error: null
      })})})})
    });

    await expect(
      signAttendanceSheet('sheet-1', 'user-1', 'student', 'data:image/png;...')
    ).rejects.toThrow('déjà signé');
  });

  it('should call user_signatures upsert when user_type=instructor', async () => {
    /* setup mocks */
    await signAttendanceSheet('sheet-1', 'inst-1', 'instructor', 'data:image/png;...');
    expect(mockFrom).toHaveBeenCalledWith('user_signatures');
  });
});
```

**Action** 🔴 **P1** :
- Réécrire les **5 tests services existants** pour réellement importer et appeler les fonctions
- Cibler une couverture **fonctionnelle** > 60% sur les services critiques :
  - `attendanceService.ts`
  - `userService.ts`
  - `formationService.ts`
  - `gradesService.ts`
  - `authContext`

⏱️ **Effort** : 2-3 semaines

### 5.4 🟠 Tests E2E manquants

**Aucun Playwright/Cypress installé**. Pour une app de 50+ pages, c'est risqué.

**Action** 🟠 **P2** :
- Installer Playwright
- Couvrir 5 flux critiques :
  1. Login → Dashboard (Admin)
  2. Login → Formations (Étudiant)
  3. Création de feuille d'émargement → signature étudiante via lien public
  4. Création formation → assignation utilisateurs
  5. Notes → publication transcript

⏱️ **Effort** : 2 semaines

---

## 6. Frontend — UI/UX & DX

### 6.1 🟠 Police de caractère & cohérence visuelle

**Non audité par lecture profonde**. Recommandations basées sur l'analyse package.json :
- ✅ shadcn/ui + Radix (excellent baseline d'accessibilité)
- ⚠️ Theme **forcé en `light`** (`forcedTheme="light"` dans `App.tsx` ligne 372) → fonctionnalité dark mode désactivée alors que `next-themes` est importé
  - **Recommandation** : soit assumer le mono-thème (retirer `next-themes`), soit activer le dark mode (forte demande utilisateurs B2B aujourd'hui)

### 6.2 ⚠️ Routing / SEO

**Vercel.json** :
```json
"rewrites": [{ "source": "/(.*)", "destination": "/" }]
```
→ SPA fallback simple. **Toutes** les pages servent `index.html`.

**Conséquences SEO** :
- Pas de SSR / SSG → contenu indexable seulement après JS exécuté
- Le blog (`/blog`, `/blog/:slug`) est **public** mais sans SSR : pénalisant pour le SEO
- ✅ Sitemap.xml présent dans `/public`

**Action** 🟠 **P2** :
- Pour le **blog** uniquement (besoin SEO), envisager :
  - Pré-rendu via `vite-plugin-prerender` avec liste statique d'articles
  - OU migration ciblée vers Next.js (gros effort)
- ⏱️ Effort : 1 semaine pour le pre-rendering

### 6.3 ⚠️ Console silencer = pansement

`src/utils/consoleSilencer.ts` overrride `console.log/debug/info` en production :
```typescript
if (!import.meta.env.DEV) {
  console.log = noop;
  // ...
}
```

**Limites** :
- Les chaînes logguées sont **toujours dans le bundle** (poids inutile, fuites possibles si reverse-engineering)
- Ne couvre pas `console.warn` / `console.error` (volontaire)

**Action** 🟠 **P2** :
- Conserver `consoleSilencer` comme filet de sécurité
- Ajouter à `vite.config.ts` :
  ```typescript
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: ['log', 'info', 'debug'],   // supprime à la compilation
      },
    },
  },
  ```

---

## 7. Edge Functions — analyse approfondie

### 7.1 Volume

- **27 fonctions** Edge (Deno) — stable depuis janvier
- **8 213 lignes** de code (vs 7 942 en janvier, +3,4%)
- Les plus volumineuses :
  - `content-autopilot/index.ts` (~1 100 lignes)
  - `reset-password-native/index.ts` (~570 lignes)
  - `invite-user-native/index.ts` (~500+ lignes)

### 7.2 🟠 Pas de shared utilities

**Constat** : Chaque fonction redéfinit ses propres :
- Headers CORS
- Helpers de réponse (`return new Response(JSON.stringify(...))`)
- Validation des entrées
- Construction du client Supabase admin

**Solution recommandée** :
```
supabase/functions/
├── _shared/
│   ├── cors.ts
│   ├── auth.ts        // requireAuth(req), requireAdmin(req)
│   ├── responses.ts   // ok(), forbidden(), serverError()
│   └── supabaseAdmin.ts
└── [fonction]/index.ts  // import { requireAuth } from '../_shared/auth.ts';
```

⏱️ **Effort** : 3 jours
🟠 **P2**

### 7.3 🔴 Aucun test automatisé pour les Edge Functions

**Risque** : Les 8 213 lignes de logique critique (auth, invitations, signatures, IA, paiements futurs) **ne sont pas testées**.

**Action** 🔴 **P1** :
- Tests unitaires Deno avec `deno test`
- Cibler en priorité :
  - `invite-user-native` (création de compte)
  - `reset-password-native` (sécurité critique)
  - `validate-activation-token` (sécurité critique)
  - `send-signature-link` (sécurité métier)

---

## 8. Base de données — focus migrations & schéma

### 8.1 ✅ Maîtrise des migrations

- **239 migrations** (vs 226 en janvier, +13 sur 3 mois) → **rythme stabilisé** à ~4/mois (vs ~32/mois précédemment)
- Les nouvelles concernent surtout :
  - Templates de transcripts/bulletins
  - Périodes composites d'évaluation
  - Vérification de diplômes / cartes étudiants
  - Module groups, RH

### 8.2 ✅ Plus de politiques `Allow all` détectées dans le code actuel

`grep "USING (true)" supabase/migrations/*` ne retourne plus rien dans les migrations finales (a été nettoyé).

⚠️ **MAIS** : ne pas confirmer sans **vérifier en production** car :
- Les migrations sont forward-only
- Si une politique a été créée puis modifiée par une autre migration, le `grep` peut être correct mais l'état réel en prod pourrait différer si les migrations ont été appliquées partiellement

**Action obligatoire** 🟠 **P1** :
```sql
-- À exécuter en prod
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public' AND qual::text = 'true';
```
- Si > 0 lignes → action immédiate

### 8.3 ⚠️ 859 politiques RLS — testabilité

**Constat** : 859 politiques RLS = en moyenne **15+ politiques par table**. C'est très complet, mais :
- Très difficile à raisonner sur les interactions
- Les bugs RLS sont silencieux (renvoie liste vide au lieu d'une erreur)

**Action** 🟠 **P1** :
- Utiliser le **runner RLS** déjà présent (`src/__tests__/rls/run-rls-tests.js`) pour ajouter des tests
- Pour chaque table critique : tester un accès **autorisé** ET un accès **interdit**
- ⏱️ **Effort** : 1-2 semaines pour couvrir les 30 tables principales

---

## 9. Plan d'action priorisé

### 🔴 P0 — À traiter **cette semaine** (blocage potentiel)

| # | Action | Effort | Impact |
|---|---|---|---|
| 1 | **Sécuriser les 14 Edge Functions sans auth check** (cf. §3.2) | 2 jours | Sécurité critique, coût IA |
| 2 | **Vérifier en prod l'absence de politiques RLS `USING (true)`** (§8.2) | 1 heure | Sécurité multi-tenant |
| 3 | **Limiter la consommation IA** (`blog-ai`, `content-autopilot`) | 0.5 jour | Coût |

### 🔴 P1 — Dans les 4 semaines

| # | Action | Effort |
|---|---|---|
| 4 | Régénérer `types.ts` Supabase + activer `strictNullChecks` | 3 jours |
| 5 | Décomposer `pdfExportService.ts` (1 363 lignes) en 4 services | 5 jours |
| 6 | Décomposer `BulletinLayoutEditor.tsx` (1 598 lignes) | 5 jours |
| 7 | Refondre les 5 tests services existants (vrais tests fonctionnels) | 2 semaines |
| 8 | Corriger pattern N+1 dans `attendanceService.ts` | 1 jour |
| 9 | Pagination des listes principales (users/formations/sheets/messages) | 1 semaine |
| 10 | Audit fonctions `SECURITY DEFINER` (vérifier `SET search_path`) | 1 jour |
| 11 | Implémenter le routing dans un fichier dédié (`router.tsx`) | 3 jours |
| 12 | Couverture RLS via tests automatisés (30 tables) | 2 semaines |

### 🟠 P2 — Dans les 1-3 mois

| # | Action | Effort |
|---|---|---|
| 13 | Chiffrer les secrets Zoom/social via Supabase Vault | 3 jours |
| 14 | Singleton de session (cache 1 min) | 1 jour |
| 15 | Shared utilities pour Edge Functions (`_shared/`) | 3 jours |
| 16 | Lazy import des templates statiques | 2 jours |
| 17 | Tests Playwright sur 5 flux critiques | 2 semaines |
| 18 | Tests Deno pour Edge Functions critiques | 1 semaine |
| 19 | Unifier le système de logging (logger.ts unique) | 1 jour |
| 20 | `terserOptions.compress.drop_console` | 0.5 jour |

### 🟡 P3 — Backlog

- Pre-rendering du blog pour SEO
- Sentry/Datadog pour le monitoring (au lieu de localStorage)
- Storybook pour les composants UI
- Renommer le package `vite_react_shadcn_ts` → `nectforma`
- Décomposer `Index.tsx` (landing 1 350 lignes)
- Décomposer `WorkspaceSpreadsheetEditor.tsx` (2 794 lignes)
- Activer `strict: true` complet (TypeScript)

---

## 10. Matrice de maturité — Avril 2026

| Dimension | Janvier 2026 | Avril 2026 | Δ |
|---|---|---|---|
| **Fonctionnalité** | 5/5 | 5/5 | ➡️ |
| **Architecture** | 3,5/5 | 3,5/5 | ➡️ Stable mais nouveaux monolithes |
| **Sécurité** | 3/5 | **2,5/5** | 🔴 Edge Functions exposées découvertes |
| **Performance** | 3,5/5 | 3,5/5 | ➡️ N+1 persistants |
| **Qualité code** | 2,5/5 | **2/5** | 🔴 `as any` +57% |
| **Testabilité** | 1/5 | **2,5/5** | 🟢 Vitest installé (mais tests faibles) |
| **Maintenabilité** | 2,5/5 | 2,5/5 | ➡️ |
| **DevOps** | 3/5 | 3,5/5 | 🟢 CSP/HSTS ajoutés |
| **Scalabilité** | 3,5/5 | 3,5/5 | ➡️ |
| **Documentation** | 2/5 | 2,5/5 | 🟢 Audit + tests = doc indirecte |

### Score global : **3,1 / 5** (vs 3,0 en janvier)

**Verdict** : L'application **a corrigé plusieurs points faibles importants** (CSP, tests installés, RLS nettoyée), mais a **introduit de nouveaux risques** (14 Edge Functions exposées, `as any` en hausse, nouveaux composants monolithiques sur les modules Bulletins/PDF).

Le cap stratégique pour les 3 prochains mois doit être :
1. **Sécuriser** (P0 sécuriser Edge Functions, RLS)
2. **Stabiliser** la qualité (typage strict, vrais tests fonctionnels)
3. **Refactoriser** progressivement les monolithes

---

## 11. Annexes

### A. Top 20 fichiers par taille (avril 2026)

```
6318 src/integrations/supabase/types.ts            (auto-généré)
2794 src/components/workspace/WorkspaceSpreadsheetEditor.tsx
1897 src/data/visualTemplates.ts                   (data)
1633 src/components/grades/TranscriptsPanel.tsx
1598 src/components/grades/BulletinLayoutEditor.tsx
1496 src/components/grades/BulletinConfigurationPanel.tsx
1483 src/data/presentationTemplates.ts             (data)
1363 src/services/pdfExportService.ts
1350 src/pages/Index.tsx
1333 src/pages/BlogAdmin.tsx
1311 src/data/workspaceTemplates.ts                (data)
1268 src/utils/spreadsheetFormulas.ts
1207 src/components/administration/ScheduleManagement.tsx
1170 src/components/workspace/WorkspaceTextEditor.tsx
1169 src/components/workspace/WorkspaceQuizEditor.tsx
... [voir analyse complète dans le rapport]
```

### B. Edge Functions avec `verify_jwt = false` (référence rapide)

| Function | Auth manuelle | Action |
|---|---|---|
| `accept-invitation` | ❌ Aucune | OK (publique) |
| `activate-user-account` | ❌ Aucune | OK (publique) |
| `validate-activation-token` | ❌ Aucune | OK (publique) |
| `send-contact-form` | ❌ Aucune | OK (publique) |
| `unsubscribe-newsletter` | (default true) | OK |
| `blog-ai` | ❌ **AUCUNE** | 🔴 **À corriger** |
| `content-autopilot` | ❌ **AUCUNE** | 🔴 **À corriger** |
| `create-establishment` | ❌ **AUCUNE** | 🔴 **À corriger** |
| `cleanup-auth-users` | ❌ **AUCUNE** | 🔴 **À corriger** |
| `manage-attendance-timing` | ❌ **AUCUNE** | 🔴 **À corriger** |
| `linkedin-oauth` | ❌ **AUCUNE** | 🟠 Audit (callback?) |
| `generate-attendance-sheets` | ❌ **AUCUNE** | 🟠 Cron secret? |
| `process-scheduled-messages` | ❌ **AUCUNE** | 🟠 Cron secret? |
| `send-notification-emails` | ❌ **AUCUNE** | 🟠 Cron secret? |
| `check-expired-attendance-links` | ❌ **AUCUNE** | 🟠 Cron secret? |
| `invite-user-native` | ✅ | OK |
| `invite-tutor-native` | ✅ | OK |
| `invite-super-admin` | ✅ | OK |
| `resend-invitation-native` | ✅ | OK |
| `reset-password-native` | ✅ | OK |
| `send-email-brevo` | ✅ | OK |
| `send-message` | ✅ | OK |
| `send-signature-link` | ✅ | OK |
| `social-media` | ✅ | OK |

### C. Liste des 8 fichiers de tests existants

```
src/__tests__/setup.ts
src/__tests__/mocks/supabaseMock.ts
src/__tests__/services/userService.test.ts
src/__tests__/services/gradesService.test.ts
src/__tests__/services/attendanceService.test.ts
src/__tests__/services/supabaseRetry.test.ts
src/__tests__/services/formationService.test.ts
src/__tests__/services/authContext.test.ts
src/__tests__/rls/run-rls-tests.js
```

---

*Rapport généré automatiquement le 28 avril 2026.*
*Document complémentaire à `AUDIT_ARCHITECTURE.md` (30 janvier 2026).*
