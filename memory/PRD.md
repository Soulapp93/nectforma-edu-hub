# PRD - Nectforma Architecture Audit

## Original Problem Statement
Realiser un audit de l'architecture de cette application (Nectforma - Plateforme de gestion de centres de formation)

## Application Overview
- **Name:** Nectforma
- **Type:** SaaS multi-tenant pour la gestion de centres de formation
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (BaaS) + Capacitor (mobile)
- **Supabase URL:** https://dlitdjbmqpsdmhrbluak.supabase.co

## What's Been Implemented

### Sessions 1-17 (2026-04-09 to 2026-04-11)
- Audit, tests, RLS, comptes demo, sidebar, mobile, Zoom, notifications, refactoring, CI, dossiers administratifs

### Session 18 - Export PDF + Bug Fix Realtime (2026-04-11)
- Export PDF dossier administratif, fix Supabase Realtime

### Session 19 - Fix 3 Bugs Critiques (2026-04-12)
- Creation etablissement, formation, upload documents (RLS)

### Session 20 - Creation Automatique Promotions (2026-04-12)
- Chaine: Formation -> Promotion -> Emploi du temps + Cahier de texte

### Session 21 - Preview Fichiers Universel (2026-04-12)
- ProductionFileViewer integre dans 5 composants supplementaires
- Fichiers cliquables + bouton Eye partout

### Session 22 - Tooltip Preview au Survol (2026-04-12)
- **FilePreviewTooltip** composant reutilisable
  - Images: miniature preview au survol
  - PDF: icone rouge + badge PDF
  - Autres: icone type + badge extension + "Cliquer pour visualiser"
- Integre dans: EstablishmentDocuments, DossierDetail, ChatRoom, MessageAttachmentsViewer
- Radix Tooltip avec delai 400ms
- Testing: 5/5 tests passes (iteration_8)

## Task Status

### P0 - TOUS RESOLUS
- [x] Toutes fonctionnalites precedentes
- [x] Preview fichiers universel + tooltip au survol

### P1
- [ ] Deploiement production

### P2-P3
- [ ] Activer TypeScript strict
- [ ] Refactoring TranscriptsPanel.tsx
- [ ] Patterns N+1, pagination
