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
- Version mobile responsive, Entreprises partenaires, Diplomes, Documents etablissement

### Sessions 12-15 - Classes Virtuelles + Zoom + Notifications (2026-04-10/11)
- Integration Zoom E2E, notifications creation + rappel 15 min (in-app + email + messagerie)

### Session 16 - Refactoring + CI (2026-04-11)
- VirtualClassesManagement: 619 -> 138 lignes (7 sous-composants)
- ScheduleManagement: 1489 -> 1088 lignes (2 sous-composants)
- CI test:rls dans GitHub Actions

### Session 17 - Dossiers Administratifs (2026-04-11)
- Remplace "Entreprises partenaires" par "Dossiers administratifs"
- Schema DB enrichi, table user_documents, bucket Storage
- Vue 2 colonnes, dossier 4 onglets, formulaire enrichi

### Session 18 - Export PDF + Bug Fix Realtime (2026-04-11)
- Export PDF dossier administratif via jsPDF + jspdf-autotable
- Fix Vite allowedHosts, Supabase Realtime try-catch dans 9 hooks
- Fix query transcripts.semester -> semester_number

### Session 19 - Fix 3 Bugs Critiques Pre-Deploiement (2026-04-12)
- **Creation etablissement**: Nettoyage rate limit + meilleur message d'erreur frontend
- **Creation formation**: Ajout colonne semesters_count en DB + null check establishment + champs explicites
- **Upload documents**: Ajout politiques RLS sur buckets establishment-docs et user-documents (INSERT/SELECT/UPDATE/DELETE)
- **Bonus**: Ajout colonne description dans text_books
- Testing: 6/6 tests passes (iteration_5), 3/3 bugs critiques corriges

## Task Status

### P0 - TOUS RESOLUS
- [x] Audit, tests, RLS, comptes demo
- [x] Sidebar plate + pages hub + mobile responsive
- [x] Classes virtuelles + Zoom E2E + Notifications
- [x] Refactoring + CI
- [x] Dossiers Administratifs + Export PDF
- [x] Bug fix Supabase Realtime channel errors
- [x] Creation etablissement fonctionnelle
- [x] Creation formation fonctionnelle
- [x] Upload documents fonctionnel (RLS corrige)

### P1 - A faire
- [ ] Activer TypeScript strict
- [ ] Deploiement production

### P2-P3
- [ ] Refactoring TranscriptsPanel.tsx (>1200 lignes)
- [ ] Patterns N+1, pagination
- [ ] Structure code, monitoring, Storybook, doc API
