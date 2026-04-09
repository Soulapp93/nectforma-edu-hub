# PRD - Nectforma Architecture Audit

## Original Problem Statement
Realiser un audit de l'architecture de cette application (Nectforma - Plateforme de gestion de centres de formation)

## Application Overview
- **Name:** Nectforma
- **Type:** SaaS multi-tenant pour la gestion de centres de formation
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (BaaS) + Capacitor (mobile)
- **Supabase URL:** https://dlitdjbmqpsdmhrbluak.supabase.co
- **Region:** eu-west-3

## What's Been Implemented

### Session 1 - Audit complet
- Audit architecture: `/app/AUDIT_ARCHITECTURE.md` (score 3.0/5)

### Session 2 - Tests & Securite
- 105 tests Vitest, headers securite, console silencer, CI GitHub Actions

### Session 3 - Connexion Supabase & DB Fixes
- Fix triggers en double sur establishments (migration executee en prod)
- Fix mapping types etablissement frontend
- Audit RLS: 0 politique "Allow all for development" restante

### Session 4 - Fix RLS Recursion Critique (2026-04-09)
- **Root cause identifiee** : Recursion infinie dans les politiques RLS
  - `user_formation_assignments` -> `attendance_sheets` -> `user_formation_assignments` (boucle)
  - `formations` -> `user_formation_assignments` -> `formations` (boucle)
  - `schedules`/`schedule_slots` impliques dans des boucles similaires
- **7 fonctions SECURITY DEFINER creees** pour casser les boucles :
  - `user_has_formation_assignment()`, `user_is_instructor_for_attendance()`
  - `get_user_formation_ids()`, `get_tutor_student_formation_ids()`
  - `get_establishment_formation_ids()`, `get_formation_user_ids()`
  - `get_instructor_student_ids()`
- **17 politiques RLS corrigees** sur 6 tables :
  - `user_formation_assignments`, `attendance_sheets`, `formations`
  - `schedules`, `schedule_slots`, `users`
- **Migration sauvegardee** : `20260409000002_fix_rls_recursion.sql`
- **Test complet** : Creation etablissement + login + dashboard = SUCCES, 0 erreur 500

## Prioritized Backlog

### P0 - Critique - TOUS RESOLUS
- [x] Tests automatises (105 tests)
- [x] Fix triggers en double
- [x] Audit politiques RLS
- [x] Fix recursion RLS infinie (17 policies, 7 functions)
- [x] Fix creation etablissement

### P1 - Haute priorite
- [x] Headers securite (CSP, HSTS, etc.)
- [x] Bug VITE_SUPABASE_ANON_KEY
- [x] Mapping types etablissement
- [ ] Activer TypeScript strict
- [ ] Decomposer composants monolithiques
- [ ] Fix 22 policies restantes avec ref directes user_formation_assignments (non-recursives mais a securiser)

### P2-P3 - Moyenne/Basse priorite
- [ ] Patterns N+1, pagination, chiffrement secrets
- [ ] Structure code, monitoring externe, Storybook, doc API

## Credentials
- Supabase service_role key: stored in edge functions env
- Supabase Management API: via access token (sbp_...)
