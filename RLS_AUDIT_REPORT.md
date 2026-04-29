# Audit RLS — Politiques résiduelles "Allow all for development"

**Date** : 29 avril 2026
**Contexte** : Action P0 #2 issue de `AUDIT_APPROFONDI_2026.md` §3.2
**Status** : ⚠️ Corrections **préparées** mais **non encore appliquées en production**

## 🔍 Méthodologie

J'ai parsé l'ensemble des 239 migrations SQL pour :
1. Lister toutes les politiques `USING (true)` créées
2. Lister toutes les politiques droppées (`DROP POLICY ...`)
3. Calculer la différence = politiques **probablement encore actives**

## 🚨 Résultat : 30 politiques permissives résiduelles

Sur 66 politiques `USING (true)` créées au fil du temps, **30 n'ont jamais été supprimées**. Sur ces 30 :

- **5 sont légitimes par design** :
  - `blog_categories` / `blog_tags` — "Public read" (le blog est public ✓)
  - `quiz_participants` / `quizzes` — Quiz publics par lien ✓
  - `published_transcripts` — À auditer (le nom suggère une restriction admin mais le SQL est `USING (true)`)

- **25 sont des reliques "Allow all for development"** sur des tables critiques :

### Impact potentiel — accès cross-tenant

| Table | Risque | Restriction existante ? |
|---|---|---|
| `establishments` | 🔴 Liste de tous les établissements | ✓ 2 autres politiques restrictives présentes |
| `formations` | 🔴🔴 **Aucune autre restriction** | ❌ AUCUNE |
| `formation_modules` | 🔴🔴 **Aucune autre restriction** | ❌ AUCUNE |
| `schedules` | 🔴🔴 **Aucune autre restriction** | ❌ AUCUNE |
| `schedule_slots` | 🔴🔴 **Aucune autre restriction** | ❌ AUCUNE |
| `student_formations` | 🔴 Inscriptions inter-tenant | ✓ 3 politiques restrictives |
| `module_instructors` | 🟠 Visibles cross-tenant | ✓ 2 politiques restrictives |
| `module_assignments` | 🟠 Devoirs cross-tenant | ✓ 2 politiques restrictives |
| `module_contents` | 🟠 Cours cross-tenant | ✓ 3 politiques restrictives |
| `module_documents` | 🟠 Docs cross-tenant | ✓ 3 politiques restrictives |
| `assignment_files` | 🟠 Fichiers cross-tenant | ✓ 2 politiques restrictives |
| `assignment_submissions` | 🟠 Rendus cross-tenant | ✓ 5 politiques restrictives |
| `assignment_corrections` | 🟠 Notes cross-tenant | ✓ 3 politiques restrictives |
| `submission_files` | 🟠 Fichiers de rendus cross-tenant | ✓ 3 politiques restrictives |
| `attendance_sheets` | 🔴 **Émargement preuve légale** | ✓ 3 politiques restrictives |
| `attendance_signatures` | 🔴 **Signatures preuve légale** | ✓ 4 politiques restrictives |
| `text_books` | 🟠 Cahiers de texte | ✓ 1 politique restrictive |
| `text_book_entries` | 🟠 Entrées cahiers | ✓ 1 politique restrictive |
| `text_book_entry_files` | 🟠 Fichiers cahiers | ✓ 2 politiques restrictives |
| `user_formation_assignments` | 🟠 Inscriptions | ✓ 2 politiques restrictives |
| `user_signatures` | 🟠 Signatures profil | ✓ 6 politiques restrictives |
| `virtual_classes` | 🟠 Classes virtuelles | ✓ 7 politiques restrictives |

> 💡 **Comment lire ce tableau** :
> - **Lorsqu'il existe d'autres politiques restrictives** : la politique `Allow all` est **OR** avec elles → elle annule TOUTES les restrictions ! Le risque est donc **toujours réel** même si la table a 7 autres politiques.
> - PostgreSQL applique RLS avec un OR entre toutes les politiques `permissive`. Une seule politique `USING (true)` rend tout le reste inutile.

### 4 tables CRITIQUES sans aucune autre politique

Pour ces 4 tables, supprimer simplement la politique `Allow all` **bloquerait tout accès** :

- `formations`
- `formation_modules`
- `schedules`
- `schedule_slots`

→ La migration de correction crée d'abord des politiques restrictives basées sur `establishment_id` AVANT de drop.

## 📦 Livrables fournis

### 1. Script d'audit (read-only) — `scripts/audit-rls-policies.sql`

À exécuter dans le SQL Editor Supabase pour confirmer l'état RÉEL en production. Le parsing des migrations peut avoir manqué des cas edge (DROP avec syntaxe non standard, politiques modifiées en GUI, etc.).

**Sections** :
1. Toutes les politiques `USING (true)` actives
2. Toutes les politiques nommées "development" / "allow all"
3. Tables sans politique restrictive (multi-tenant à risque)
4. Tables avec RLS désactivé (danger absolu)
5. Récapitulatif général (compteurs)

### 2. Migration de correction — `supabase/migrations/20260429120000_secure_rls_drop_legacy_allow_all.sql`

**Structure** :
- **Étape 1** : crée des politiques restrictives sur `formations`, `formation_modules`, `schedules`, `schedule_slots` (avec `establishment_id` filter + RPC `is_current_user_admin()`)
- **Étape 2** : `DROP POLICY IF EXISTS` sur les 25 politiques "Allow all"
- **Idempotente** (peut être ré-exécutée sans erreur)

### 3. Helper RPC réutilisés (déjà existants en DB)

La migration s'appuie sur les RPC `SECURITY DEFINER` existants :
- `is_super_admin()` — vérifie le rôle SuperAdmin
- `get_current_user_establishment()` — retourne l'`establishment_id` de l'user courant
- `is_current_user_admin()` — vérifie Admin OU AdminPrincipal

⚠️ Ces RPC sont en `SECURITY DEFINER` et doivent toutes avoir `SET search_path = public, pg_temp` (cf. P1 #10 dans l'audit). À auditer séparément.

## 🚀 Procédure de déploiement (production)

### Étape 1 — Confirmation en SQL Editor Supabase

```sql
-- Coller le contenu de scripts/audit-rls-policies.sql et exécuter
-- Vérifier :
-- - Section 2 : compter les lignes "Allow all" / "development"
-- - Si > 0, la migration est bien nécessaire
```

### Étape 2 — Tester en environnement de staging

Si vous avez un projet Supabase de staging :

```bash
supabase db push --project-ref <staging-project-id>
```

Tester ensuite :
- Connexion admin → `/dashboard` charge les formations ✓
- Connexion étudiant → `/formations` charge sa formation ✓
- Création/affichage d'une feuille d'émargement ✓
- Signature étudiante via lien public ✓
- Affichage de l'emploi du temps ✓

### Étape 3 — Application en production

```bash
# Ou via Supabase Dashboard → Database → Migrations → Push
supabase db push --project-ref dlitdjbmqpsdmhrbluak
```

### Étape 4 — Vérification post-déploiement

Réexécuter `scripts/audit-rls-policies.sql`. Section 2 doit retourner **0 ligne**.

## 🔄 Plan de rollback

Si la migration casse des flux en production :

```sql
-- Re-créer les politiques permissives (mode dégradé temporaire)
CREATE POLICY "rollback_allow_all_temp" ON public.formations FOR ALL USING (true);
CREATE POLICY "rollback_allow_all_temp" ON public.formation_modules FOR ALL USING (true);
-- etc. pour chaque table impactée
```

Puis investiguer pourquoi les politiques restrictives ne fonctionnent pas (souvent : RPC helpers non déployés, ou cache PostgREST à invalider).

## 📊 Score de sécurité après application

| Dimension | Avant | Après |
|---|---|---|
| Politiques `Allow all` actives | 25 | **0** |
| Tables critiques sans restriction | 4 | **0** |
| Tables avec ≥ 1 politique restrictive | ~22 / 26 | **26 / 26** |
| Risque cross-tenant | 🔴🔴 Élevé | 🟢 Maîtrisé |

## 📚 Références

- `AUDIT_APPROFONDI_2026.md` §3.2 — Constat initial (politiques RLS)
- `SECURITY_DEPLOYMENT_GUIDE.md` — Sécurisation Edge Functions (P0 #1)
- Documentation Supabase RLS : https://supabase.com/docs/guides/auth/row-level-security
