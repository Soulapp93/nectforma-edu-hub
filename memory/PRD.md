# PRD - Nectforma Architecture Audit

## Original Problem Statement
Realiser un audit de l'architecture de cette application (Nectforma - Plateforme de gestion de centres de formation)

## Application Overview
- **Name:** Nectforma
- **Type:** SaaS multi-tenant pour la gestion de centres de formation
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (BaaS) + Capacitor (mobile)
- **Deployment:** Vercel (frontend) + Supabase Cloud (backend)
- **Size:** ~131,759 lines of TS/TSX, 434 files, 301 components, 38 pages, 32 services, 27 Edge Functions, 226 migrations

## User Personas
- SuperAdmin: Gestion globale multi-tenant, blog admin
- AdminPrincipal: Gestion complete d'un etablissement
- Admin: Administration courante, dashboard, finance
- Formateur: Gestion formations, modules, emargement
- Etudiant: Consultation formations, notes, emargement (signature)
- Tuteur: Suivi des apprentis (vue restreinte)

## What's Been Implemented
- [2026-01-30] Audit complet de l'architecture : document Markdown detaille (`/app/AUDIT_ARCHITECTURE.md`)
  - Analyse de la stack technique
  - Evaluation de la structure du code
  - Audit de securite (auth, RLS, headers, secrets)
  - Audit de performance (build, requetes, monitoring)
  - Audit de qualite du code (TypeScript, tests, patterns)
  - Audit de scalabilite et DevOps
  - Matrice des risques (13 risques identifies)
  - 12 recommandations prioritaires (P0 a P3)
  - Matrice de maturite (score global: 3.0/5)

- [2026-01-30] Infrastructure de tests mise en place
  - Vitest + Testing Library + jsdom installe et configure
  - vitest.config.ts avec alias @ et coverage v8
  - 6 suites de tests : authContext, userService, formationService, attendanceService, gradesService, supabaseRetry
  - 105 tests unitaires passes avec succes
  - Mocks Supabase reutilisables dans src/__tests__/mocks/

- [2026-01-30] Headers de securite renforces dans vercel.json
  - Ajout Strict-Transport-Security (HSTS)
  - Ajout Referrer-Policy
  - Ajout Permissions-Policy (camera, microphone, geolocation bloquees)
  - Ajout Content-Security-Policy (CSP) complete

## Prioritized Backlog

### P0 - Critique
- [x] Mettre en place des tests automatises (Vitest + Testing Library) - DONE
- [ ] Verifier et corriger les politiques RLS en production (necessite acces DB Supabase)

### P1 - Haute priorite
- [x] Ajouter les headers de securite manquants (CSP, HSTS, etc.) - DONE
- [ ] Activer TypeScript strict progressivement
- [ ] Decomposer les composants monolithiques (8 fichiers > 50Ko)

### P2 - Moyenne priorite
- [ ] Eliminer les patterns N+1 dans les services
- [ ] Ajouter la pagination sur toutes les listes
- [ ] Nettoyer les console.log en production
- [ ] Chiffrer les secrets en base (Zoom, reseaux sociaux)

### P3 - Basse priorite
- [ ] Reorganiser la structure du code (barrel exports, types/, constants/)
- [ ] Integrer un service de monitoring externe (Sentry, DataDog)
- [ ] Ajouter Storybook pour les composants UI
- [ ] Documenter l'API et les Edge Functions

## Next Tasks
- Etendre la couverture de tests (scheduleService, messageService, etc.)
- Activer strictNullChecks et corriger les erreurs resultantes
- Decomposer WorkspaceSpreadsheetEditor.tsx (2794 lignes)
