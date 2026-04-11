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
- Remplace "Entreprises partenaires" par "Dossiers administratifs" dans Administration
- Schema DB enrichi: users + date_of_birth, gender, address, city, postal_code, country, nationality
- Nouvelle table user_documents avec RLS + bucket Storage user-documents
- Vue 2 colonnes (Etudiants/Formateurs) avec recherche
- Dossier individuel 4 onglets:
  1. Infos civiles (editable par admin)
  2. Pedagogique (formations, releves, modules formateur)
  3. Documents & Contrats (upload, contrats, releves auto)
  4. Historique & Tracabilite (timeline)
- Formulaire creation utilisateur enrichi avec champs civils
- Connecte a transcripts, formations, contracts, user_documents
- Testing: 14/14 tests passes + 2 bugs DB corriges

### Session 18 - Export PDF + Bug Fix Realtime (2026-04-11)
- Export PDF dossier administratif via jsPDF + jspdf-autotable
- Fix Vite allowedHosts pour acces preview
- Fix erreur Supabase Realtime "cannot add postgres_changes callbacks after subscribe()" dans 9 hooks/composants
- Fix query transcripts.semester -> semester_number + evaluation_periods
- Testing: 10/10 tests passes (iteration_3)

## Architecture Dossiers Administratifs
- Administration.tsx -> tabs: users | dossiers
- DossiersAdministratifs.tsx -> 2 colonnes + recherche
- DossierDetail.tsx -> 4 onglets (civil/pedagogique/documents/historique) + Exporter PDF
- dossierService.ts -> requetes Supabase (profil, formations, transcripts, contracts, documents)
- dossierPdfExport.ts -> generation PDF client-side (jsPDF + autotable)

## Task Status

### P0 - TOUS RESOLUS
- [x] Audit, tests, RLS, comptes demo
- [x] Sidebar plate + pages hub + mobile responsive
- [x] Classes virtuelles + Zoom E2E + Notifications
- [x] Refactoring + CI
- [x] Dossiers Administratifs (remplace Entreprises partenaires)
- [x] Export PDF dossiers administratifs
- [x] Bug fix Supabase Realtime channel errors

### P1 - A faire
- [ ] Activer TypeScript strict

### P2-P3
- [ ] Refactoring TranscriptsPanel.tsx (>1200 lignes)
- [ ] Patterns N+1, pagination
- [ ] Structure code, monitoring, Storybook, doc API
