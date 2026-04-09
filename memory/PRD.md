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

### Session 1 - Audit (2026-01-30)
- Audit complet de l'architecture : document Markdown detaille (`/app/AUDIT_ARCHITECTURE.md`)
  - Stack technique, structure du code, frontend, backend, DB, securite, performance, qualite, scalabilite, DevOps
  - 13 risques identifies, 12 recommandations P0-P3
  - Matrice de maturite (score global: 3.0/5)

### Session 2 - Implementation corrections (2026-01-30)
- **Infrastructure de tests Vitest** :
  - vitest.config.ts, setup.ts, mocks Supabase reutilisables
  - 6 suites de tests : authContext, userService, formationService, attendanceService, gradesService, supabaseRetry
  - **105 tests unitaires - tous passes**
  - Scripts npm: test, test:watch, test:coverage

- **Headers de securite renforces** (vercel.json) :
  - Content-Security-Policy (CSP) complete
  - Strict-Transport-Security (HSTS)
  - Referrer-Policy
  - Permissions-Policy

- **Bug fix** : Correction de VITE_SUPABASE_ANON_KEY -> VITE_SUPABASE_PUBLISHABLE_KEY dans Index.tsx (formulaire de contact)

- **Console silencer** : consoleSilencer.ts importe dans main.tsx pour supprimer les console.log/debug/info en production

- **CI Pipeline** : .github/workflows/test.yml pour GitHub Actions (tests automatiques sur push/PR)

- **Application en preview** : App mise en service sur le pod avec Vite dev server

## Prioritized Backlog

### P0 - Critique
- [x] Mettre en place des tests automatises (Vitest + Testing Library) - DONE
- [ ] Verifier et corriger les politiques RLS en production (necessite acces DB Supabase)

### P1 - Haute priorite
- [x] Ajouter les headers de securite manquants (CSP, HSTS, etc.) - DONE
- [x] Corriger le bug VITE_SUPABASE_ANON_KEY - DONE
- [ ] Activer TypeScript strict progressivement (strictNullChecks d'abord)
- [ ] Decomposer les composants monolithiques (8 fichiers > 50Ko)

### P2 - Moyenne priorite
- [x] Nettoyer les console.log en production - DONE (consoleSilencer)
- [x] Pipeline CI GitHub Actions - DONE
- [ ] Eliminer les patterns N+1 dans les services
- [ ] Ajouter la pagination sur toutes les listes
- [ ] Chiffrer les secrets en base (Zoom, reseaux sociaux)

### P3 - Basse priorite
- [ ] Reorganiser la structure du code (barrel exports, types/, constants/)
- [ ] Integrer un service de monitoring externe (Sentry, DataDog)
- [ ] Ajouter Storybook pour les composants UI
- [ ] Documenter l'API et les Edge Functions
- [ ] Renommer le package de "vite_react_shadcn_ts" a "nectforma"

## Next Tasks
- Activer strictNullChecks et corriger les erreurs resultantes
- Decomposer WorkspaceSpreadsheetEditor.tsx (2794 lignes)
- Etendre la couverture de tests (scheduleService, messageService, etc.)
