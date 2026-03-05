

## Plan: Gestion de l'absence du formateur dans le système d'émargement

### Problème identifié

Actuellement, dans `QRAttendanceManager.tsx` (ligne 83), la condition pour envoyer la feuille à l'administration exige la signature du formateur :

```text
canSendToAdmin = signedStudents === totalStudents && instructorSigned && totalStudents > 0
```

Cela bloque totalement le flux quand le formateur est absent. De plus, dans la modale de validation admin (`EnhancedAttendanceSheetModal`), il n'existe pas de bouton pour marquer le formateur absent.

---

### Modifications prévues

**1. QRAttendanceManager.tsx — Ajouter un bouton "Marquer le formateur absent"**

- Ajouter un état `instructorAbsent` synchronisé avec le champ `instructor_absent` de la feuille en base
- Ajouter un bouton dans la section "Signature formateur" permettant de marquer le formateur absent (met à jour `instructor_absent = true` en base)
- Modifier la condition `canSendToAdmin` : autoriser l'envoi si le formateur est marqué absent OU s'il a signé :
  ```text
  canSendToAdmin = signedStudents === totalStudents && (instructorSigned || instructorAbsent) && totalStudents > 0
  ```
- Masquer le bouton "Signer en tant que formateur" quand le formateur est marqué absent
- Afficher un badge "Formateur absent" au lieu de "En attente" quand applicable

**2. EnhancedAttendanceSheetModal.tsx — Ajouter un toggle de présence du formateur**

- Ajouter un bouton toggle dans la section signatures, à côté du nom du formateur, permettant de basculer entre "Présent" et "Absent" (similaire au toggle des étudiants)
- Ce toggle met à jour `instructor_absent` sur la table `attendance_sheets`
- Quand le formateur est marqué absent, la zone de signature affiche "ABSENT" en rouge (déjà géré par le code existant via `isInstructorAbsent`)

**3. Aucune migration nécessaire** — Le champ `instructor_absent` existe déjà dans la table `attendance_sheets`.

---

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/components/emargement/QRAttendanceManager.tsx` | Bouton "Marquer formateur absent", condition `canSendToAdmin` assouplie |
| `src/components/administration/EnhancedAttendanceSheetModal.tsx` | Toggle présence/absence du formateur avant validation |

