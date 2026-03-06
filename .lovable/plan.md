

## Diagnostic

Le problème est clair : les Edge Functions `validate-activation-token` et `activate-user-account` cherchent l'utilisateur **uniquement dans la table `users`**, mais les tuteurs sont stockés dans la table `tutors`. Quand un tuteur clique sur son lien d'activation :

1. Le token est trouvé dans `user_activation_tokens` (OK)
2. Le `user_id` du token pointe vers un tuteur
3. La requête `SELECT ... FROM users WHERE id = user_id` retourne vide
4. L'erreur "Utilisateur introuvable" / "Token invalide" s'affiche

## Plan de correction

### 1. Modifier `validate-activation-token` (Edge Function)
- Après l'échec de la recherche dans `users`, ajouter un fallback vers la table `tutors`
- Retourner le rôle "Tuteur" dans la réponse si trouvé dans `tutors`

### 2. Modifier `activate-user-account` (Edge Function)
- Même logique de fallback : chercher dans `tutors` si non trouvé dans `users`
- Lors de l'activation, mettre à jour `tutors.is_activated = true` au lieu de `users.status = 'Actif'`

### 3. Modifier `Activation.tsx` (page front)
- Ajouter "Tuteur" dans le mapping `getRoleLabel`
- S'assurer que le submit gère correctement le cas tuteur dans le legacy flow (déjà OK car il appelle `activate-user-account`)

### Fichiers concernés
- `supabase/functions/validate-activation-token/index.ts`
- `supabase/functions/activate-user-account/index.ts`
- `src/pages/Activation.tsx`

