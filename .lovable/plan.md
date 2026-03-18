

# Plan : Double mode d'émargement (QR Code + Lien unique)

## Résumé

Ajouter un second mode d'émargement par **lien unique par étudiant** dans `CreateAttendanceSessionModal`, en complément du QR Code existant. Le formateur/admin choisit le mode, marque les absents, et seuls les étudiants présents reçoivent un lien personnel dans leur espace Nectforma.

## Étapes

### 1. Migration base de données

Ajouter une table `attendance_student_links` pour stocker les liens uniques par étudiant :

```sql
CREATE TABLE attendance_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_sheet_id UUID REFERENCES attendance_sheets(id) ON DELETE CASCADE NOT NULL,
  student_id UUID NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Avec RLS : seul l'étudiant propriétaire peut lire son lien, les admins/formateurs de l'établissement peuvent insérer.

### 2. Modifier `CreateAttendanceSessionModal.tsx` — Choix du mode

Après sélection du créneau, afficher deux options :
- **QR Code** : comportement actuel (ouvre `QRAttendanceManager`)
- **Lien d'émargement** : ouvre une nouvelle étape de sélection des étudiants

### 3. Nouveau composant `LinkAttendanceSetup.tsx`

Affiché quand le mode "Lien" est choisi. Fonctionnalités :
- Charge la liste des étudiants de la promotion via `user_formation_assignments`
- Tous cochés "Présent" par défaut
- Le formateur/admin peut cocher "Absent" pour certains étudiants
- Si c'est l'admin : bouton pour marquer le formateur absent
- Bouton "Envoyer les liens" qui :
  1. Crée la feuille d'émargement (si pas déjà existante)
  2. Génère un token unique par étudiant présent dans `attendance_student_links`
  3. Crée des notifications in-app pour chaque étudiant avec le lien
  4. Marque les étudiants absents dans `attendance_signatures` avec `present = false`
  5. Ouvre le `QRAttendanceManager` pour le suivi en temps réel

### 4. Page/Composant de signature via lien — `LinkAttendanceSigning.tsx`

Quand un étudiant clique sur la notification/lien dans son espace :
- Valide le token (non expiré, non utilisé, appartient à l'étudiant)
- Affiche les infos de la session (formation, module, date, horaire)
- Récupère la signature enregistrée dans le profil (`user_signatures`)
- Si signature existante : pré-remplit le `SignaturePad`
- L'étudiant signe → insertion dans `attendance_signatures` + marque le lien comme utilisé
- Même logique que le système QR existant

### 5. Intégration dans `QRAttendanceManager.tsx`

Ajouter un bouton "Envoyer les liens d'émargement" dans les actions, visible quand la session est "En cours". Ce bouton ouvre `LinkAttendanceSetup` pour envoyer/renvoyer des liens aux étudiants non encore signés.

### 6. Notifications in-app

Utiliser la table `notifications` existante pour notifier chaque étudiant avec un lien de type :
```
/suivi-emargement?token={unique_token}
```

La page `SuiviEmargement` détectera le paramètre `token` et ouvrira directement la modale de signature.

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| Migration SQL | **Nouveau** — Table `attendance_student_links` + RLS |
| `src/components/emargement/LinkAttendanceSetup.tsx` | **Nouveau** — Sélection étudiants + envoi liens |
| `src/components/emargement/LinkAttendanceSigning.tsx` | **Nouveau** — Signature via lien unique |
| `src/components/emargement/CreateAttendanceSessionModal.tsx` | Ajout choix mode QR/Lien |
| `src/components/emargement/QRAttendanceManager.tsx` | Bouton envoi liens dans actions |
| `src/pages/SuiviEmargement.tsx` | Détection du paramètre token pour signature directe |
| `src/services/attendanceService.ts` | Fonctions de gestion des liens |

## Sécurité

- Chaque lien est un token unique de 64 caractères hex, lié à un seul étudiant
- Le token expire après 24h et ne peut être utilisé qu'une fois
- RLS vérifie que seul l'étudiant propriétaire peut utiliser son token
- La signature est enregistrée avec la même logique que le QR (récupération profil + `SignaturePad`)

