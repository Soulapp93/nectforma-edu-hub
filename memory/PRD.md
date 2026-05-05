# PRD - Application Nectforma (Audit Complet)

## Original Problem Statement
"Analyse mon application et l'architecture et un audit complet de l'application."

## Core Product Requirements
- Strict data isolation per evaluation period
- Hierarchical curriculum: Formations → Unités d'Enseignement (UE) → Matières (formation_modules)
- Configurable transcripts (Simple, Combined, BTS Blanc) grouped by UE, matching French standards
- BTS Blanc periods distinguish "Écrit" / "Oral" subjects
- Strict adherence to user's minimalist Black & White PDF mockups for all transcripts
- Dynamic data: real establishment, student numbers, logos populated from DB

## User Language
French (toujours répondre en français)

## Architecture
- Frontend: React + Vite + TypeScript + Tailwind
- Backend: Supabase (PostgreSQL + Edge Functions Deno)
- Auth: Supabase Auth

## Key DB Schema
- `teaching_units`: {id, formation_id, title, coefficient, order_index}
- `formation_modules`: {id, teaching_unit_id, formation_id, title, coefficient}
- `period_modules`: {id, period_id, module_id, coefficient, exam_part}

## Implemented (CHANGELOG)

### 2026-02 - Bulletins finalization
- ✅ Architecture UE déployée partout (Formations, Notes, Bulletins)
- ✅ 3 templates bulletins (Simple, BTS Blanc, Combined) en N&B minimaliste pixel-perfect
- ✅ Données dynamiques (logos, établissement, student numbers/CE/INE) intégrées
- ✅ BTS Blanc : catégories Écrit/Oral via `period_modules.exam_part`
- ✅ Footer Simple : `MOYENNE GENERALE` étendu sur 2 cols (UE+FORMATEUR), totalCoef en cellule encadrée
- ✅ Footer BTS Blanc : ligne unique `TOTAL` (span 2) + `totalCoef` + `totalPoints` + `DECISION` (suppression "TOTAL NOTES")
- ✅ Footer Combiné : ligne unique `MOYENNE GENERALE COMBINEE` (span 2) + valeurs encadrées (avg, mention, règle, décision)

## Backlog / ROADMAP

### P0 — In progress
*(Aucun en cours)*

### P1 — Next
- Upload/personnalisation des signatures (Sprint E config)
- Vérifier policies RLS (`20260429120000_secure_rls_drop_legacy_allow_all.sql`)

### P2 — Future
- Pont bulletin → diplôme (auto-génération si "admis")
- Refactor `pdfExportService.ts` (1363 lignes) et `TranscriptsPanel.tsx` (~1300 lignes)
- Support PWA offline pour saisie de notes
- Corriger pattern N+1 dans `attendanceService.ts`
- Warning ESBuild `optimizeDeps` sur `StudentCardView.tsx:136:16`

## Key Files
- `/app/src/components/grades/SimpleBulletinTemplate.tsx`
- `/app/src/components/grades/BtsBlancBulletinTemplate.tsx`
- `/app/src/components/grades/CombinedBulletinRenderer.tsx`
- `/app/src/components/grades/TranscriptsPanel.tsx`
- `/app/src/components/grades/CreatePeriodModal.tsx`
- `/app/src/components/grades/GradeSheetView.tsx`
- `/app/src/pages/FormationDetail.tsx`
- `/app/src/components/administration/EditFormationModal.tsx`
- `/app/src/components/administration/CreateFormationModal.tsx`

## Test Credentials
Cf. `/app/memory/test_credentials.md`

## Integrations
- Supabase only (PostgreSQL, Auth, Edge Functions)
