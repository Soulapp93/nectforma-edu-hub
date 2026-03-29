

## Plan : Gestion des Groupes d'Étudiants par Module

### Contexte

Ajouter un nouvel onglet **"Groupes"** dans chaque module (à côté de Documents) permettant aux formateurs de créer et gérer des groupes d'étudiants, avec création manuelle et aléatoire.

---

### 1. Base de données — 2 nouvelles tables

**`module_groups`** : les groupes créés par module
- `id` (uuid, PK), `module_id` (ref modules), `formation_id`, `name` (text, ex: "Groupe 1"), `created_by` (ref users), `created_at`, `updated_at`

**`module_group_members`** : les étudiants affectés
- `id` (uuid, PK), `group_id` (ref module_groups ON DELETE CASCADE), `student_id` (ref users), `assigned_at`
- Contrainte UNIQUE sur `(group_id, student_id)`

RLS : Admin/Formateur = CRUD complet sur les groupes de leur établissement ; Étudiant = lecture seule de ses groupes.

---

### 2. Service — `moduleGroupService.ts`

- `getModuleGroups(moduleId)` — liste les groupes avec leurs membres
- `createGroup(moduleId, formationId, name)` — crée un groupe
- `deleteGroup(groupId)` — supprime un groupe
- `updateGroupName(groupId, name)` — renomme
- `addMembers(groupId, studentIds)` — ajoute des étudiants
- `removeMember(groupId, studentId)` — retire un étudiant
- `createRandomGroups(moduleId, formationId, numberOfGroups, studentsPerGroup)` — répartition aléatoire avec gestion de l'arrondi (les étudiants restants sont distribués un par un dans les premiers groupes)

---

### 3. Interface — `ModuleGroupsTab.tsx`

**Vue principale :**
- Liste des groupes existants sous forme de cartes avec nom du groupe et avatars/noms des membres
- Bouton **"Créer un groupe"** → Modal avec champ nom + sélection d'étudiants dans la liste de la formation (multi-select avec checkboxes)
- Bouton **"Groupes aléatoires"** → Modal demandant : nombre de groupes + nombre d'étudiants par groupe, avec prévisualisation de la répartition avant validation

**Création aléatoire — Logique :**
- Mélange aléatoire (Fisher-Yates) de la liste des étudiants
- Distribution en N groupes de T étudiants
- Les étudiants restants (modulo) sont ajoutés aux premiers groupes (ex: 13 étudiants, 4 groupes de 3 → 1 groupe de 4 + 3 groupes de 3)
- Prévisualisation avant confirmation
- Possibilité d'ajuster manuellement après création (ajouter/retirer des membres)

**Gestion :**
- Chaque carte de groupe : bouton éditer (renommer), supprimer, ajouter/retirer des membres
- Drag & drop optionnel pour déplacer un étudiant entre groupes (phase 2)

---

### 4. Intégration dans les onglets Module

**Fichiers modifiés :**
- `src/pages/FormationDetail.tsx` — Ajout d'un 5e onglet "Groupes" (icône `Users`) dans la grille des tabs, avec `ModuleGroupsTab`
- `src/components/module/ModuleDetail.tsx` — Même ajout pour la vue module standalone

**Nouveaux fichiers :**
- `src/services/moduleGroupService.ts`
- `src/components/module/ModuleGroupsTab.tsx`
- `src/components/module/CreateGroupModal.tsx` (création manuelle)
- `src/components/module/RandomGroupsModal.tsx` (création aléatoire)

**Migration SQL :**
- Création des tables `module_groups` et `module_group_members` avec RLS

---

### 5. Accès par rôle

- **Admin / Formateur** : Création, modification, suppression de groupes
- **Étudiant** : Consultation seule (voit les groupes auxquels il appartient)
- **Tuteur** : Consultation seule

