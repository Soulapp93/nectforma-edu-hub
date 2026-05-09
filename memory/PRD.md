# PRD - Application Nectforma (Audit Complet)

## Original Problem Statement
"Analyse mon application et l'architecture et un audit complet de l'application."

## Core Product Requirements
- Strict data isolation per evaluation period
- Curriculum: Formations → Matières (modules plats, sans couche UE)
- Configurable transcripts (Simple, Combined, BTS Blanc) listant les modules à plat
- BTS Blanc periods distinguish "Écrit" / "Oral" subjects (via period_modules.exam_part)
- Strict adherence to user's minimalist Black & White PDF mockups for all transcripts
- Dynamic data: real establishment, student numbers, logos populated from DB

## User Language
French (toujours répondre en français)

## Architecture
- Frontend: React + Vite + TypeScript + Tailwind
- Backend: Supabase (PostgreSQL + Edge Functions Deno)
- Auth: Supabase Auth

## Key DB Schema
- `formation_modules`: {id, formation_id, title, coefficient, order_index, semester}
- `period_modules`: {id, period_id, module_id, coefficient, exam_part}
- `teaching_units`: existe encore en DB (dormante après rollback UE → modules plats)

## Implemented (CHANGELOG)

### 2026-02 - Rollback UE → Modules plats
- ✅ Suppression de la couche UE dans toute l'UI (DB conservée dormante)
- ✅ Nouveau composant `MatieresPanel` pour la gestion plate des matières
- ✅ `CreateFormationModal` : retrait création UE par défaut, info card "Matières"
- ✅ `EditFormationModal` : utilise `MatieresPanel` (CRUD matières plat)
- ✅ `FormationDetail` : liste de matières linéaire (Accordion direct, sans UE header)
- ✅ `CreatePeriodModal` : sélection plate de modules
- ✅ `GradeSheetView` : sidebar plate avec liste de matières
- ✅ `SimpleBulletinTemplate` : colonne "MATIERES", suppression des sections UE
- ✅ `CombinedBulletinRenderer` : suppression des sections UE intermédiaires + fix `referenceNumber is not defined`
- ✅ `BtsBlancBulletinTemplate` : inchangé (n'utilisait pas UE)

### 2026-02 - Bulletins finalization (avant rollback)
- ✅ 3 templates bulletins (Simple, BTS Blanc, Combined) en N&B minimaliste pixel-perfect
- ✅ Données dynamiques (logos, établissement, student numbers/CE/INE) intégrées
- ✅ BTS Blanc : catégories Écrit/Oral via `period_modules.exam_part`
- ✅ Footer Simple : `MOYENNE GENERALE` étendu sur 2 cols, totalCoef en cellule encadrée
- ✅ Footer BTS Blanc : ligne unique `TOTAL` (span 2) + `totalCoef` + `totalPoints` + `DECISION`
- ✅ Footer Combiné : ligne unique `MOYENNE GENERALE COMBINEE` (span 2) + valeurs encadrées

### 2026-02-08 - DayView redesign + Modal event-aware
- ✅ Refonte complète de `DayView.tsx` (header stats, cartes catégorisées Cours/Autonomie/Événement)
- ✅ Événements affichent "Toute la journée" (rail temps), badge dédié, plus de Formateur/Salle/Formation factices
- ✅ `EventDetailsModal` rendu compatible avec les 2 conventions (slotKind + isEvent flag) — masque correctement Formateur/Salle/Formation pour events et affiche "Toute la journée"
- ✅ Affichage du label de type d'événement (ex: "ÉTABLISSEMENT FERMÉ") dans le modal
- ✅ Fix mapping `ScheduleManagement.tsx::renderDayView()` (n'utilisait pas `slot.slot_kind === 'event'` → tous les events affichaient instructor/room factices)
- ✅ Refonte timeline finale : événements en cartes pleine largeur colorées (sans rail d'heures), cours dans une timeline avec heures adaptatives (basées sur les heures réelles, pas de range fixe 8-19)

### 2026-02-09 - Publication des notes Formateur → Étudiant
- ✅ Sidebar : "Notes" → "Saisie des notes" pour Formateur, "Notes et relevés" pour Étudiant
- ✅ Notes.tsx : Formateur restreint aux onglets "Saisie des notes" + "Calcul & Validation" (Jury, Bulletin, Config réservés admin)
- ✅ Bouton "Publier les notes" dans GradeSheetView : set `evaluations.is_published = true` pour les évaluations du module sélectionné
- ✅ Bouton "Dépublier" (réversible) pour retirer la visibilité côté étudiant
- ✅ Pill de statut : "Publiées (visibles par les étudiants)" / "Publication partielle" / "Brouillon — non visible par les étudiants"
- ✅ `StudentGradesView` filtrait déjà sur `is_published = true` (ligne 28) → boucle complète opérationnelle
- ✅ `getStudentTranscripts` filtre déjà sur `is_published = true` → publication des relevés via TranscriptsPanel admin déjà fonctionnelle
- ✅ Service : `publishEvaluations(ids[])` et `unpublishEvaluations(ids[])` ajoutés à gradesService.ts

## Backlog / ROADMAP

### P1 — Next
- Upload/personnalisation des signatures (Sprint E config)
- Vérifier policies RLS (`20260429120000_secure_rls_drop_legacy_allow_all.sql`)
- Drop éventuel de la table `teaching_units` (P2 — actuellement dormante)

### P2 — Future
- Pont bulletin → diplôme (auto-génération si "admis")
- Refactor `pdfExportService.ts` (1363 lignes) et `TranscriptsPanel.tsx` (~1300 lignes)
- Support PWA offline pour saisie de notes
- Corriger pattern N+1 dans `attendanceService.ts`
- Warning ESBuild `optimizeDeps` sur `StudentCardView.tsx:136:16`
- Cleanup composants UE dormants (`UEManagerPanel.tsx`, options `group_by_teaching_unit` dans `BulletinConfigModal`, UI UE dans `GradingSettingsPanel`)

## Key Files
- `/app/src/components/administration/MatieresPanel.tsx` (nouveau)
- `/app/src/components/administration/CreateFormationModal.tsx`
- `/app/src/components/administration/EditFormationModal.tsx`
- `/app/src/pages/FormationDetail.tsx`
- `/app/src/components/grades/CreatePeriodModal.tsx`
- `/app/src/components/grades/GradeSheetView.tsx`
- `/app/src/components/grades/SimpleBulletinTemplate.tsx`
- `/app/src/components/grades/BtsBlancBulletinTemplate.tsx`
- `/app/src/components/grades/CombinedBulletinRenderer.tsx`
- `/app/src/components/grades/TranscriptsPanel.tsx`

## Test Credentials
Cf. `/app/memory/test_credentials.md`

## Integrations
- Supabase only (PostgreSQL, Auth, Edge Functions)
