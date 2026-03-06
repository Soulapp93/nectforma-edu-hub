

## Diagnostic

### Problème 1 : Emails de réinitialisation non envoyés

**Cause racine identifiée** dans les logs : l'email `soulsang383@gmail.com` n'existe PAS dans la table `public.users`. C'est un compte SuperAdmin qui n'a d'entrée que dans `platform_user_roles` et `auth.users`. La fonction `reset-password-native` ne cherche que dans `public.users` (ligne 149-154), et si l'utilisateur n'est pas trouvé, elle retourne silencieusement un succès SANS envoyer d'email (ligne 160-167).

De même, les comptes Tuteurs (table `tutors`) ne sont pas recherchés — un tuteur qui demande un reset ne recevrait pas d'email non plus.

**Correction** : Modifier `reset-password-native` pour chercher séquentiellement dans :
1. `public.users` (utilisateurs classiques)
2. `public.tutors` (tuteurs)
3. `auth.users` via `supabaseAdmin.auth.admin.listUsers()` (SuperAdmins sans profil dans les tables métier)

Si trouvé dans `auth.users` uniquement (cas SuperAdmin), utiliser `supabase.auth.admin.generateLink({ type: 'recovery' })` pour générer un vrai lien de reset Supabase Auth natif, car ces comptes n'utilisent pas le système de tokens custom.

### Problème 2 : Remplacement du logo email

Le logo actuel (`email-logo-landing.png`) est un SVG renommé en PNG — il s'affiche mal dans Gmail/Outlook. L'utilisateur fournit `image-728.png` (le petit chapeau de diplômé violet) comme remplacement.

**Correction** :
1. Copier `image-728.png` → `src/assets/email-logo-new.png`
2. Mettre à jour les 10 Edge Functions pour pointer vers le nouveau fichier dans le bucket `email-assets`
3. Comme on ne peut pas uploader directement dans le bucket via le code, on va utiliser le même chemin (`email-logo-landing.png`) mais en s'assurant que le nouveau fichier PNG est bien un vrai PNG

En fait, le plus simple : uploader `image-728.png` dans le bucket sous le même nom `email-logo-landing.png` pour remplacer l'ancien sans modifier aucune Edge Function.

---

## Plan d'implémentation

### 1. Corriger `reset-password-native` — recherche multi-tables
- Après la recherche dans `users`, ajouter une recherche dans `tutors`
- Si toujours pas trouvé, chercher dans `auth.users` via l'API admin
- Pour les tuteurs : utiliser le même flux de tokens custom
- Pour les utilisateurs auth-only (SuperAdmin) : utiliser `supabaseAdmin.auth.admin.generateLink({ type: 'recovery' })` et envoyer l'email via Brevo avec le lien généré

### 2. Remplacer le logo dans le bucket email-assets
- Copier `image-728.png` comme nouvel asset
- Le fichier sera uploadé dans le bucket `email-assets` sous le nom `email-logo-landing.png` pour remplacer l'ancien sans modifier les URLs dans les 10 Edge Functions

### Fichiers modifiés
- `supabase/functions/reset-password-native/index.ts` (ajout recherche tutors + auth.users)
- Upload du nouveau logo dans le bucket `email-assets`

