# Sécurisation des Edge Functions — Guide de déploiement

**Date** : 28 avril 2026
**Contexte** : Correction P0 issue de l'audit `AUDIT_APPROFONDI_2026.md` §3.2

## 🎯 Objectif

Avant cette correction, **14 Edge Functions** exposées sans authentification permettaient à n'importe qui possédant l'anon key (publique dans le frontend) d'invoquer des opérations privilégiées. Cette correction :

1. Ajoute un module partagé `supabase/functions/_shared/auth.ts` avec helpers d'auth
2. Sécurise 9 fonctions (les 5 autres sont publiques par design)
3. Documente les étapes de déploiement nécessaires

## ✅ Fonctions sécurisées

### A. Fonctions réservées au SuperAdmin (vérification JWT + rôle)

| Fonction | Helper | Risque évité |
|---|---|---|
| `cleanup-auth-users` | `requireSuperAdmin` | 🔴🔴🔴 Suppression de tous les comptes auth |
| `blog-ai` | `requireSuperAdmin` | 🔴 Coût OpenAI/DALL-E non contrôlé |
| `linkedin-oauth` | `requireSuperAdmin` | 🔴 Vol/détournement du token LinkedIn |

### B. Fonctions appelées par cron uniquement (vérification cron secret)

| Fonction | Helper | Usage |
|---|---|---|
| `manage-attendance-timing` | `requireCronSecret` | Ouverture/fermeture automatique des feuilles |
| `check-expired-attendance-links` | `requireCronSecret` | Nettoyage des liens de signature expirés |
| `process-scheduled-messages` | `requireCronSecret` | Envoi des messages programmés |

### C. Fonctions hybrides (UI admin OU cron)

| Fonction | Helper | Usage |
|---|---|---|
| `generate-attendance-sheets` | `requireAuthOrCron` | Cron + bouton manuel admin |
| `send-notification-emails` | `requireAuthOrCron` | Cron + envoi déclenché par admin |
| `content-autopilot` | `requireAuthOrCron` + check SuperAdmin | Cron + UI blog-admin |

### D. Fonctions publiques par design (PAS de modification)

Ces fonctions doivent rester accessibles sans auth car appelées par des utilisateurs non encore connectés ou des formulaires publics :

- `accept-invitation` (acceptation d'invitation)
- `activate-user-account` (activation du compte avec token)
- `validate-activation-token` (validation pré-connexion)
- `create-establishment` (inscription d'un nouvel établissement — **rate-limited** côté DB via `check_establishment_rate_limit`)
- `send-contact-form` (formulaire de contact public)
- `unsubscribe-newsletter` (lien de désinscription depuis email)

## 🚀 Étapes de déploiement

### Étape 1 — Générer un `CRON_SECRET` aléatoire

```bash
# Sur votre machine locale
openssl rand -base64 48
# Exemple de sortie :
# K3p8XmQYZxVbR2fT9wA7nL4cD5eH6jK1MnOpQrStUvWxYzAbCdEfGhIjKlMnOpQr
```

Conservez cette valeur en lieu sûr (gestionnaire de mots de passe).

### Étape 2 — Configurer le secret côté Supabase

```bash
# Via la CLI Supabase
supabase secrets set CRON_SECRET="votre-secret-genere"

# Ou via le dashboard Supabase :
# Project Settings → Edge Functions → Add new secret
# Name: CRON_SECRET
# Value: <votre-secret-genere>
```

### Étape 3 — Mettre à jour les jobs cron Supabase (`pg_cron`)

Si vous utilisez `pg_cron` pour invoquer ces fonctions, vous devez ajouter le header `x-cron-secret` aux appels.

**Migration SQL à appliquer** (exemple pour `manage-attendance-timing`) :

```sql
-- 1. Trouver les jobs cron existants
SELECT jobid, jobname, schedule, command FROM cron.job;

-- 2. Pour chaque job appelant une Edge Function, le re-créer avec le header x-cron-secret
-- Exemple : remplacer le job existant
SELECT cron.unschedule('manage-attendance-timing-job');

SELECT cron.schedule(
  'manage-attendance-timing-job',
  '*/5 * * * *',  -- toutes les 5 minutes (adapter à votre besoin)
  $$
  SELECT net.http_post(
    url := 'https://dlitdjbmqpsdmhrbluak.supabase.co/functions/v1/manage-attendance-timing',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'x-cron-secret', current_setting('app.settings.cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

> 🔧 **Note** : Le secret doit être stocké en tant que paramètre PostgreSQL pour qu'il soit accessible par `pg_cron`. Configurez-le via :
>
> ```sql
> ALTER DATABASE postgres SET app.settings.cron_secret = 'votre-secret-genere';
> -- Puis recharger la conf
> SELECT pg_reload_conf();
> ```
>
> **Alternative** plus simple : utiliser un déclencheur externe (GitHub Actions, Vercel cron, etc.) qui appelle l'Edge Function avec le bon header.

### Étape 4 — Faire les mêmes modifications pour les 5 jobs cron suivants

Répéter l'étape 3 pour :
- `manage-attendance-timing` (toutes les 5 min)
- `check-expired-attendance-links` (toutes les 30 min)
- `process-scheduled-messages` (toutes les 1 min)
- `generate-attendance-sheets` (toutes les heures, optionnel — déclenché aussi par bouton UI)
- `send-notification-emails` (à la demande — déclenché aussi par UI)

### Étape 5 — Activer `verify_jwt = true` dans `config.toml`

Pour les fonctions qui utilisent maintenant `requireSuperAdmin` ou `requireAuthenticatedUser`, on peut **également** activer `verify_jwt` au niveau Supabase pour bénéficier d'un check additionnel et économiser des cold starts.

> ⚠️ Ne pas activer pour les fonctions hybrides (`requireAuthOrCron`) car cela bloquerait les appels cron sans JWT user.

```toml
# supabase/config.toml — modifications recommandées

# Garder verify_jwt = false pour ces fonctions (ont leur propre check ou sont publiques)
[functions.accept-invitation]
verify_jwt = false
[functions.activate-user-account]
verify_jwt = false
[functions.validate-activation-token]
verify_jwt = false
[functions.create-establishment]
verify_jwt = false
[functions.send-contact-form]
verify_jwt = false
[functions.generate-attendance-sheets]    # hybride (auth OR cron)
verify_jwt = false
[functions.send-notification-emails]       # hybride
verify_jwt = false
[functions.content-autopilot]              # hybride
verify_jwt = false
[functions.manage-attendance-timing]       # cron-only
verify_jwt = false
[functions.check-expired-attendance-links] # cron-only
verify_jwt = false
[functions.process-scheduled-messages]     # cron-only
verify_jwt = false

# Activer verify_jwt = true pour les fonctions SuperAdmin uniquement
# (la vérification interne de SuperAdmin reste, mais on bénéficie du double check)
[functions.cleanup-auth-users]
verify_jwt = true
[functions.blog-ai]
verify_jwt = true
[functions.linkedin-oauth]
verify_jwt = true
```

> 💡 Pour l'instant je n'ai PAS modifié `config.toml` automatiquement. Faites-le après avoir validé que les nouvelles auth checks fonctionnent en preview.

### Étape 6 — Déployer les Edge Functions

```bash
# Déployer toutes les fonctions modifiées
supabase functions deploy cleanup-auth-users
supabase functions deploy blog-ai
supabase functions deploy linkedin-oauth
supabase functions deploy manage-attendance-timing
supabase functions deploy check-expired-attendance-links
supabase functions deploy process-scheduled-messages
supabase functions deploy generate-attendance-sheets
supabase functions deploy send-notification-emails
supabase functions deploy content-autopilot

# Ou en une seule commande (déploie tout)
supabase functions deploy --all
```

### Étape 7 — Tester en production

#### Test 1 : Cron sans secret → 403 attendu

```bash
curl -X POST https://dlitdjbmqpsdmhrbluak.supabase.co/functions/v1/manage-attendance-timing \
  -H "Content-Type: application/json" \
  -d '{}'

# Réponse attendue :
# {"success":false,"error":"Secret cron invalide"}
# Status: 403
```

#### Test 2 : Cron avec secret correct → 200

```bash
curl -X POST https://dlitdjbmqpsdmhrbluak.supabase.co/functions/v1/manage-attendance-timing \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: votre-secret-genere" \
  -d '{}'

# Réponse attendue : 200 + résultats
```

#### Test 3 : `blog-ai` sans token → 401

```bash
curl -X POST https://dlitdjbmqpsdmhrbluak.supabase.co/functions/v1/blog-ai \
  -H "Content-Type: application/json" \
  -d '{"action":"generate-article","payload":{"topic":"test"}}'

# Réponse attendue :
# {"success":false,"error":"Authentification requise"}
# Status: 401
```

#### Test 4 : `blog-ai` avec un token utilisateur non-SuperAdmin → 403

```bash
# Récupérer un JWT d'utilisateur normal puis :
curl -X POST https://dlitdjbmqpsdmhrbluak.supabase.co/functions/v1/blog-ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT-non-superadmin>" \
  -d '{"action":"generate-article","payload":{"topic":"test"}}'

# Réponse attendue :
# {"success":false,"error":"Accès réservé aux super-administrateurs"}
# Status: 403
```

## 📋 Impact côté frontend (aucune action requise)

Le frontend continue d'invoquer les fonctions via `supabase.functions.invoke('nom-fonction', { body: {...} })`. Le SDK Supabase **inclut automatiquement** le JWT de l'utilisateur connecté via le header `Authorization: Bearer <jwt>`.

Aucune modification du code frontend n'est donc nécessaire. Les utilisateurs connectés en tant que SuperAdmin verront `blog-ai`, `linkedin-oauth`, `content-autopilot` continuer de fonctionner normalement. Les non-SuperAdmin recevront 403 et le UI doit gérer ce cas (toast d'erreur).

## 🔄 Rollback

En cas de problème en production :

```bash
# Restaurer une version précédente
supabase functions deploy --no-verify-jwt <fonction>

# Ou retirer les imports auth
git revert <commit-hash>
supabase functions deploy --all
```

## ✅ Checklist de mise en production

- [ ] `CRON_SECRET` généré (48 octets minimum)
- [ ] Secret configuré dans Supabase (`supabase secrets set`)
- [ ] Secret configuré dans PostgreSQL si utilisation de `pg_cron`
- [ ] Tests `curl` 1, 2, 3, 4 passent en preview
- [ ] Edge Functions déployées (`supabase functions deploy --all`)
- [ ] Jobs `pg_cron` mis à jour pour envoyer `x-cron-secret`
- [ ] Vérification que les feuilles d'émargement s'ouvrent toujours automatiquement
- [ ] Vérification que `blog-ai` fonctionne pour le SuperAdmin
- [ ] Vérification que `content-autopilot` (mode `run`) tourne bien
- [ ] (Optionnel) `verify_jwt = true` activé pour `cleanup-auth-users`, `blog-ai`, `linkedin-oauth`

## 📚 Références

- Module shared : `supabase/functions/_shared/auth.ts`
- Audit complet : `AUDIT_APPROFONDI_2026.md` §3.2
- Documentation Supabase Edge Functions : https://supabase.com/docs/guides/functions
- Documentation pg_cron : https://supabase.com/docs/guides/database/extensions/pg_cron
