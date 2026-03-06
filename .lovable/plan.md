

## Plan en 2 volets

---

### Volet 1 : Remplacement du logo email par le PNG uploadé

**Constat** : Le fichier `email-logo-landing.png` dans le bucket `email-assets` est actuellement un SVG renommé en .png. Le SVG pose des problèmes d'affichage sur Gmail et Outlook (affiche un "?" ou une icône cassée). L'utilisateur fournit un vrai fichier PNG.

**Actions :**
1. Copier `user-uploads://image-726.png` vers `src/assets/email-logo-nectforma.png` puis l'uploader dans le bucket `email-assets` en remplacement de `email-logo-landing.png`
2. Vérifier que les 10 Edge Functions qui référencent `email-logo-landing.png` continuent de pointer vers la même URL (pas de changement de nom nécessaire si on écrase le fichier existant)

**Fichiers concernés** : Upload storage uniquement (aucun code à modifier si le nom du fichier reste identique)

---

### Volet 2 : Audit complet de l'application

L'audit de sécurité a révélé **107 findings** dont **12 critiques (level: error)**. Voici le résumé structuré :

#### A. Sécurité — Problèmes CRITIQUES (priorité immédiate)

| Problème | Table | Risque |
|----------|-------|--------|
| Données personnelles (emails, téléphones) accessibles publiquement | `users`, `tutors` | Fuite de PII |
| Numéros de sécurité sociale et salaires lisibles publiquement | `employees` | Fuite de données sensibles |
| Tokens d'accès réseaux sociaux exposés | `social_media_connections` | Compromission de comptes |
| Données salariales et bulletins de paie lisibles | `contracts`, `payslips` | Fuite financière |
| Emails et tokens d'invitation exposés | `invitations` | Usurpation de comptes |
| Données clients (SIRET, adresses) exposées | `billing_clients` | Fuite commerciale |
| Emails de répondants questionnaires exposés | `questionnaire_responses` | Fuite de PII |
| Vue `tutor_students_view` sans protection | Vue publique | Fuite d'emails étudiants |
| Protection anti-mots de passe compromis désactivée | Auth config | Comptes vulnérables |

**Plan de correction** : Migration SQL pour restreindre les politiques RLS des tables critiques en remplaçant `USING (true)` par des vérifications `auth.uid() IS NOT NULL AND establishment_id = get_current_user_establishment()` ou `is_current_user_admin()`.

#### B. Sécurité — Avertissements (priorité moyenne)

- **7 politiques RLS "always true"** sur INSERT/UPDATE/DELETE : à restreindre aux rôles appropriés
- **Politiques accessibles aux utilisateurs anonymes** sur ~50 tables : les politiques utilisent `TO authenticated` mais le linter détecte un risque théorique. À corriger en s'assurant que toutes les policies ciblent `TO authenticated` explicitement
- **1 extension dans le schéma public** : à déplacer vers `extensions`
- **1 fonction sans search_path fixé** : `handle_updated_at` — ajouter `SET search_path TO 'public'`

#### C. Stabilité et Performance

- **Architecture auth solide** : Context centralisé avec retry, timeout, et gestion propre du montage/démontage
- **React Query bien configuré** : staleTime de 5 min, retry à 1, pas de refetch sur focus
- **Retry et monitoring en place** : `supabaseRetry.ts`, `monitoring.ts`, `monitoredSupabase.ts`
- **Sanitisation HTML** : `dangerouslySetInnerHTML` est utilisé avec `sanitizeHtml()` (DOMPurify) dans la plupart des cas. Exception : `BlogAdmin.tsx` et `EnhancedArticleEditor.tsx` n'utilisent pas de sanitisation — à corriger
- **URLs hardcodées** : 7 Edge Functions utilisent `nectforme.lovable.app` au lieu du domaine custom `nectforma.com` — à unifier

#### D. Scalabilité

- **Multi-tenant via establishment_id** : architecture correcte avec fonctions `SECURITY DEFINER`
- **QueryClient** avec cache de 5 min : bon pour la scalabilité
- **Lazy loading et optimized-image** : en place
- **Pas de problème de limite des 1000 lignes détecté** dans le code actuel

---

### Résumé des actions à implémenter

1. **Upload du logo PNG** dans le bucket email-assets (remplace le SVG actuel)
2. **Migration SQL critique** : Corriger les 12 vulnérabilités RLS (tables employees, payslips, contracts, social_media_connections, billing_clients, invitations, questionnaire_responses, + vue tutor_students_view)
3. **Sanitiser le HTML** dans BlogAdmin.tsx et EnhancedArticleEditor.tsx
4. **Unifier les URLs** : remplacer `nectforme.lovable.app` par `nectforma.com` dans les Edge Functions
5. **Activer la protection anti-mots de passe compromis**
6. **Corriger `handle_updated_at`** : ajouter `SECURITY DEFINER` et `SET search_path`

La priorité absolue est le volet sécurité (point 2) car les données sensibles sont actuellement accessibles sans authentification.

