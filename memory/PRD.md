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
- Sidebar aplatie avec pages hub et onglets horizontaux, mobile responsive

### Sessions 12-15 - Classes Virtuelles + Zoom + Notifications (2026-04-10/11)
- Integration Zoom E2E, notifications creation + rappel 15 min

### Session 16 - Refactoring + CI (2026-04-11)
- VirtualClassesManagement + ScheduleManagement refactored, CI test:rls

### Session 17 - Dossiers Administratifs (2026-04-11)
- Module Dossiers administratifs complet (4 onglets, CRUD, export PDF)

### Session 18 - Export PDF + Bug Fix Realtime (2026-04-11)
- Export PDF dossier administratif, fix Supabase Realtime try-catch 9 hooks

### Session 19 - Fix 3 Bugs Critiques Pre-Deploiement (2026-04-12)
- Creation etablissement, creation formation, upload documents (RLS)

### Session 20 - Logique Creation Automatique Promotions (2026-04-12)
- Chaine: Formation -> Promotion -> Emploi du temps + Cahier de texte
- Composant PromotionsList.tsx, service promotionService.ts

### Session 21 - Preview Fichiers Universel (2026-04-12)
- **ProductionFileViewer integre dans toute l'application**
- Composants modifies:
  1. DossierDetail.tsx: fichiers cliquables + bouton Eye + ProductionFileViewer
  2. EstablishmentDocuments.tsx: fichiers cliquables + bouton Eye + menu Visualiser + ProductionFileViewer
  3. StudentFilesManagement.tsx: remplace window.open par ProductionFileViewer
  4. AbsenceManagement.tsx: remplace window.open par ProductionFileViewer
  5. AbsenceReviewModal.tsx: remplace window.open par ProductionFileViewer
- Deja integre: ChatRoom, MessageAttachmentsViewer, ModuleContentTab, ModuleDocumentsTab, TextBookDetail
- Testing: 3/3 tests passes (iteration_7)

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
- [x] Preview fichiers universel (ProductionFileViewer partout)

### P1 - A faire
- [ ] Deploiement production

### P2-P3
- [ ] Activer TypeScript strict
- [ ] Refactoring TranscriptsPanel.tsx (>1200 lignes)
- [ ] Patterns N+1, pagination
