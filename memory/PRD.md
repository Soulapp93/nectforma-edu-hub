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
- Version mobile responsive
- Gestion des entreprises partenaires (CRUD tuteurs)
- Gestion des diplomes (vue jury + publication)
- Documents etablissement (CRUD dossiers/fichiers + Supabase Storage)

### Session 12 - Classes Virtuelles (2026-04-10)
- Table `virtual_classes` creee avec RLS
- Vue Etudiant/Formateur/Tuteur (`StudentVirtualClasses.tsx`)
- Vue Admin dans Pedagogie > Classes virtuelles

### Session 13 - Integration Zoom E2E (2026-04-11)
- Connexion Zoom Server-to-Server OAuth
- Edge Function `zoom-meeting` (verify_jwt: false)
- 4 classes synchronisees avec vrais meetings Zoom

### Session 14 - Notifications Automatiques (2026-04-11)
- 3 canaux a la creation : notification in-app + message messagerie + email Brevo
- Secret `BREVO_API_KEY` configure

### Session 15 - Rappels Automatiques 15 min (2026-04-11)
- Edge Function `virtual-class-reminder` deployee
- pg_cron job `*/5 * * * *` via pg_net
- 3 canaux de rappel : notification + messagerie + email

### Session 16 - Refactoring + CI (2026-04-11)
- VirtualClassesManagement.tsx: 619 -> 138 lignes (7 sous-composants extraits)
  - VirtualClassList, VirtualClassStatusBadge, ZoomSetupModal, ZoomIntegrationPanel
  - IntegrationLogsPanel, VirtualClassDetailModal, CreateVirtualClassModal
- ScheduleManagement.tsx: 1489 -> 1088 lignes (2 sous-composants extraits)
  - ScheduleListView, ScheduleMonthView
- CI: test.yml mis a jour avec job `rls-tests` (pg_cron via pg_net, push main only)
- Testing agent: 8/8 tests passes, 100% frontend

## Architecture composants virtual-classes/
- VirtualClassesManagement.tsx (138 lignes - orchestrateur)
- VirtualClassList.tsx (101 lignes - liste des classes)
- VirtualClassStatusBadge.tsx (22 lignes - badge statut)
- CreateVirtualClassModal.tsx (158 lignes - modal creation)
- ZoomSetupModal.tsx (94 lignes - modal config Zoom)
- ZoomIntegrationPanel.tsx (102 lignes - panneau integrations)
- IntegrationLogsPanel.tsx (43 lignes - journal)
- VirtualClassDetailModal.tsx (93 lignes - detail classe)
- StudentVirtualClasses.tsx (314 lignes - vue etudiant/formateur)

## Task Status

### P0 - TOUS RESOLUS
- [x] Audit, tests, RLS fixes, comptes demo
- [x] Sidebar plate + pages hub + mobile responsive
- [x] Entreprises partenaires, Diplomes, Notes
- [x] Documents etablissement
- [x] Classes virtuelles + Integration Zoom E2E
- [x] Notifications automatiques (creation + rappel 15 min)
- [x] Refactoring composants monolithiques
- [x] CI test:rls dans GitHub Actions

### P1 - A faire
- [ ] Activer TypeScript strict

### P2-P3
- [ ] Patterns N+1, pagination
- [ ] Structure code, monitoring, Storybook, doc API
