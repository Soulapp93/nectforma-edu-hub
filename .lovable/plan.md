
Diagnostic confirmé (pourquoi tu vois “Signé électroniquement”)
- Le bug ne vient pas du bouton “Présent/Absent” lui-même.
- La récupération de signature profil dans `attendanceService.toggleStudentPresence()` lit `user_signatures`.
- Or, côté sécurité base de données, la table `user_signatures` n’autorise actuellement que “mon propre user_id”.
- Résultat observé en logs réseau:
  - requête `user_signatures` pour l’admin connecté: retourne la signature
  - requête `user_signatures` pour l’étudiant: retourne `[]`
- Donc quand tu passes un étudiant de absent → présent, `signature_data` reste `null`, et l’UI affiche logiquement “Signé électroniquement”.

Plan de correction
1) Corriger l’accès sécurisé aux signatures (Lovable Cloud / DB)
- Ajouter une policy `SELECT` sur `public.user_signatures` pour les admins de l’établissement (même établissement que la cible).
- Garder les droits d’écriture inchangés (pas d’ouverture excessive).

2) Renforcer la logique de récupération dans `src/services/attendanceService.ts`
- Dans `toggleStudentPresence()` (absent → présent), utiliser une chaîne de fallback robuste:
  1. signature déjà présente sur la ligne `attendance_signatures` de la feuille
  2. dernière signature connue dans `attendance_signatures` (historique étudiant)
  3. signature profil `user_signatures`
- Éviter de réécrire `null` si une signature valide est trouvée dans un fallback précédent.

3) Réparer les données déjà impactées
- Ajouter une migration de “backfill” pour compléter les lignes `attendance_signatures` déjà en `present=true` avec `signature_data=null` quand une signature profil existe.
- Ça corrige immédiatement les feuilles déjà créées, sans attendre de nouveaux toggles.

4) Améliorer le message UI pour éviter la confusion
- Dans:
  - `src/components/administration/EnhancedAttendanceSheetModal.tsx`
  - `src/components/emargement/GeneratedAttendanceSheet.tsx`
- Remplacer le libellé ambigu “Signé électroniquement” quand `present=true && signature_data=null` par un état explicite type:
  - “Présent (signature à compléter)”
- Optionnel: afficher un indicateur “lien de signature envoyé”.

Fichiers concernés
- `supabase/migrations/...` (policy + backfill SQL)
- `src/services/attendanceService.ts`
- `src/components/administration/EnhancedAttendanceSheetModal.tsx`
- `src/components/emargement/GeneratedAttendanceSheet.tsx`

Vérification prévue (E2E)
- Cas 1: étudiant avec signature profil existante → absent → présent => image signature visible.
- Cas 2: étudiant sans signature profil → absent → présent => état “signature à compléter” + envoi lien.
- Cas 3: présent (avec signature) → absent → présent => la même signature est conservée/réaffichée.
