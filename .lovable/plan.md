

## Plan : Gestion des Dossiers Étudiants & Archives

### Vue d'ensemble

Deux nouvelles fonctionnalités majeures :
1. **Dossiers Étudiants** — Un espace centralisé par étudiant regroupant tous ses documents (certificats, diplômes, bulletins, contrats, conventions de stage, etc.)
2. **Archives** — Un module d'archivage des promotions terminées, organisé par catégorie (formations, promotions, dossiers, cahiers de texte, émargement, emplois du temps)

---

### 1. Dossiers Étudiants

**Base de données** — 2 nouvelles tables :

- `student_documents` : stocke les métadonnées des documents étudiants
  - `id`, `student_id` (ref users), `establishment_id`, `promotion_id` (nullable), `document_type` (enum : certificat_scolarite, certificat_inscription, diplome, bulletin_notes, contrat, convention_stage, attestation, autre), `title`, `description`, `file_url`, `file_name`, `academic_year`, `status` (draft, validated, archived), `validated_by`, `validated_at`, `created_at`, `updated_at`

- `student_document_types` : table de configuration pour types personnalisés par établissement (optionnel, extensibilité)

**Interface** — Nouvel onglet dans Administration :
- Ajout de l'onglet **"Dossiers étudiants"** dans la sidebar Administration (`?tab=student-files`)
- Page `StudentFilesManagement.tsx` avec :
  - Sélecteur Formation → Promotion (via `FormationPromotionSelector`)
  - Liste des étudiants avec bouton "Voir dossier"
  - Modal/Page de dossier individuel avec onglets par type de document
  - Upload de documents (certificats, contrats, conventions…)
  - Génération automatique de certificats de scolarité (PDF)
  - Statut de validation (brouillon → validé)

**Accès étudiant** :
- L'étudiant voit son propre dossier dans son espace (onglet "Mon dossier" dans `/compte` ou page dédiée)
- Lecture seule des documents validés par l'administration

**Stockage** : Bucket existant `module-files` ou nouveau bucket `student-documents` avec RLS par establishment_id + student_id

---

### 2. Module Archives

**Base de données** — 2 nouvelles tables :

- `promotion_archives` : enregistre l'archivage d'une promotion
  - `id`, `promotion_id`, `formation_id`, `establishment_id`, `archived_by`, `archived_at`, `academic_year`, `status` (active, archived), `archive_metadata` (JSONB : stats, nombre étudiants, etc.)

- `archive_snapshots` : snapshots des données archivées par module
  - `id`, `archive_id` (ref promotion_archives), `module_type` (formation, promotion, dossier_etudiant, cahier_texte, emargement, emploi_temps, notes), `snapshot_data` (JSONB), `created_at`

**Interface** — Nouvelle page et entrée navigation :

- Nouvel onglet **"Archives"** dans la sidebar admin (`/administration?tab=archives`)
- Page `ArchivesManagement.tsx` avec :
  - Vue par année académique → Liste des promotions terminées
  - Bouton "Archiver la promotion" qui snapshote toutes les données
  - Navigation par catégorie : Formations, Dossiers étudiants, Cahiers de texte, Émargement, Emplois du temps, Notes
  - Consultation en lecture seule des données archivées
  - Recherche et filtres (année, formation, étudiant)
  - Export PDF/Excel des archives

**Processus d'archivage** :
- Quand une promotion est terminée → bouton "Archiver"
- Le système copie les données pertinentes en JSONB dans `archive_snapshots`
- Les données originales restent intactes mais la promotion est marquée "archived"
- Les archives sont consultables à tout moment mais non modifiables

---

### 3. Modifications de la navigation

- **Sidebar.tsx** et **MobileDrawerMenu.tsx** : Ajout dans les sous-items Administration :
  - `{ name: 'Dossiers étudiants', href: '/administration?tab=student-files', icon: FolderOpen }`
  - `{ name: 'Archives', href: '/administration?tab=archives', icon: Archive }`
- **Administration.tsx** : Ajout des tabs `student-files` et `archives`

---

### 4. Fichiers à créer/modifier

**Nouveaux fichiers :**
- `src/components/administration/StudentFilesManagement.tsx`
- `src/components/administration/StudentFileModal.tsx`
- `src/components/administration/StudentDossierView.tsx`
- `src/components/administration/ArchivesManagement.tsx`
- `src/components/administration/ArchiveDetailView.tsx`
- `src/services/studentDocumentService.ts`
- `src/services/archiveService.ts`

**Fichiers modifiés :**
- `src/pages/Administration.tsx` — ajout des 2 nouveaux onglets
- `src/components/Sidebar.tsx` — ajout navigation
- `src/components/MobileDrawerMenu.tsx` — ajout navigation

**Migrations SQL :**
- Création tables `student_documents`, `promotion_archives`, `archive_snapshots`
- Bucket storage `student-documents`
- Politiques RLS appropriées (admin establishment + étudiant propre dossier)

---

### 5. Sécurité & RLS

- `student_documents` : Admin de l'établissement = CRUD complet ; Étudiant = SELECT sur ses propres documents
- `promotion_archives` / `archive_snapshots` : Admin uniquement, filtré par establishment_id via `get_current_user_establishment()`
- Fonctions SECURITY DEFINER pour éviter la récursion RLS

