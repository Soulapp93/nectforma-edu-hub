# PRD - Nectforma Architecture Audit

## Original Problem Statement
Realiser un audit de l'architecture de cette application (Nectforma - Plateforme de gestion de centres de formation)

## Application Overview
- **Name:** Nectforma
- **Type:** SaaS multi-tenant pour la gestion de centres de formation
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (BaaS) + Capacitor (mobile)
- **Supabase URL:** https://dlitdjbmqpsdmhrbluak.supabase.co

## What's Been Implemented

### Sessions 1-6 (2026-04-09)
- Audit architecture, 105 tests Vitest, 42 tests RLS, fix RLS recursion, comptes demo

### Sessions 7-10 - Sidebar + Mobile + Fonctionnalites (2026-04-10)
- Sidebar aplatie avec pages hub et onglets horizontaux
- Version mobile responsive, Diplomes, Documents etablissement

### Sessions 12-15 - Classes Virtuelles + Zoom + Notifications (2026-04-10/11)
- Integration Zoom E2E, notifications creation + rappel 15 min (in-app + email + messagerie)

### Session 16 - Refactoring + CI (2026-04-11)
- VirtualClassesManagement: 619 -> 138 lignes (7 sous-composants)
- ScheduleManagement: 1489 -> 1088 lignes (2 sous-composants)
- CI test:rls dans GitHub Actions

### Session 17 - Dossiers Administratifs (2026-04-11)
- Module Dossiers administratifs complet (4 onglets, CRUD, export PDF)

### Session 18 - Export PDF + Bug Fix Realtime (2026-04-11)
- Export PDF dossier administratif, fix Supabase Realtime try-catch 9 hooks

### Session 19 - Fix 3 Bugs Critiques Pre-Deploiement (2026-04-12)
- Creation etablissement, creation formation, upload documents (RLS)

### Session 20 - Logique Creation Automatique Promotions (2026-04-12)
- **Nouvelle fonctionnalite majeure**: Creation automatique de promotion lors de la creation de formation
- Chaine automatique: Formation -> Promotion -> Emploi du temps + Cahier de texte
- Service `promotionService.ts` avec `createPromotionWithResources()`
- Composant `PromotionsList.tsx` dans onglet "Gestion des promotions"
- Chaque promotion affiche: formation, annee, nb etudiants, liens vers emploi du temps/cahier/emargement
- Boutons Desactiver/Activer et Supprimer
- DB: Ajout promotion_id dans schedules, text_books, attendance_sheets
- DB: Ajout colonnes title, description dans text_books
- RLS promotions configuree
- Testing: 7/7 tests passes (iteration_6)

## Architecture Promotions
- CreateFormationModal.tsx -> formationService.createFormation() -> promotionService.createPromotionWithResources()
- promotionService.ts: cree promotion + schedule + text_book lies par promotion_id
- PromotionsList.tsx: affiche les promotions avec liens vers ressources
- Pedagogie.tsx: 5 onglets (emplois du temps, cahiers de textes, formations, promotions, classes virtuelles)

## Task Status

### P0 - TOUS RESOLUS
- [x] Audit, tests, RLS, comptes demo
- [x] Sidebar plate + pages hub + mobile responsive
- [x] Classes virtuelles + Zoom E2E + Notifications
- [x] Refactoring + CI
- [x] Dossiers Administratifs + Export PDF
- [x] Bug fix Supabase Realtime
- [x] Creation etablissement, formation, upload docs
- [x] Logique creation automatique promotions

### P1 - A faire
- [ ] Activer TypeScript strict
- [ ] Deploiement production

### P2-P3
- [ ] Refactoring TranscriptsPanel.tsx (>1200 lignes)
- [ ] Patterns N+1, pagination
- [ ] Structure code, monitoring, Storybook, doc API
