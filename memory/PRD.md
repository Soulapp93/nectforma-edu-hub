# PRD - Nectforma Architecture Audit

## Original Problem Statement
Realiser un audit de l'architecture de cette application (Nectforma - Plateforme de gestion de centres de formation)

## Application Overview
- **Name:** Nectforma
- **Type:** SaaS multi-tenant pour la gestion de centres de formation
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (BaaS) + Capacitor (mobile)
- **Deployment:** Vercel (frontend) + Supabase Cloud (backend)
- **Supabase URL:** https://dlitdjbmqpsdmhrbluak.supabase.co

## What's Been Implemented

### Session 1 - Audit (2026-01-30)
- Audit complet: `/app/AUDIT_ARCHITECTURE.md` (13 risques, 12 recommandations, score 3.0/5)

### Session 2 - Tests & Securite (2026-01-30)
- Vitest: 105 tests unitaires sur 6 suites (tous verts)
- Headers securite: CSP, HSTS, Referrer-Policy, Permissions-Policy
- Console silencer pour production
- CI Pipeline GitHub Actions

### Session 3 - Connexion Supabase & Bug Fixes (2026-04-09)
- **Diagnostic connexion Supabase** : Connexion OK, auth settings verifie
- **Bug fix critique** : Correction `VITE_SUPABASE_ANON_KEY` -> `VITE_SUPABASE_PUBLISHABLE_KEY` (Index.tsx)
- **Bug fix** : Mapping des types d'etablissement (frontend envoyait des labels, DB attend des valeurs specifiques)
- **Root cause identifiee** : 3 triggers en double sur `establishments` qui creent des chat_groups en conflit
  - `on_establishment_created` (migration 20251020)
  - `create_establishment_group_trigger` (migration 20251021)
  - `trigger_auto_create_establishment_group` (migration 20260203)
- **Migration corrective creee** : `20260409000001_fix_duplicate_establishment_triggers.sql`
  - Supprime les triggers en double
  - Rend le trigger restant idempotent (ON CONFLICT DO NOTHING)
  - Etend la contrainte de type pour compatibilite

## ACTION REQUISE PAR L'UTILISATEUR

### Migration a executer dans Supabase Dashboard
1. Aller sur https://supabase.com/dashboard -> SQL Editor
2. Copier-coller le contenu de `/app/supabase/migrations/20260409000001_fix_duplicate_establishment_triggers.sql`
3. Executer la requete
4. Tester la creation d'etablissement

## Prioritized Backlog

### P0 - Critique
- [x] Tests automatises - DONE (105 tests)
- [x] Bug creation etablissement identifie - ROOT CAUSE FOUND
- [ ] **MIGRATION A DEPLOYER** : Fix triggers en double (user action required)
- [ ] Verifier politiques RLS "Allow all" en production

### P1 - Haute priorite
- [x] Headers securite - DONE
- [x] Bug VITE_SUPABASE_ANON_KEY - DONE
- [x] Mapping types etablissement - DONE
- [ ] Activer TypeScript strict
- [ ] Decomposer composants monolithiques

### P2 - Moyenne priorite
- [x] Console silencer - DONE
- [x] CI Pipeline - DONE
- [ ] Patterns N+1
- [ ] Pagination listes
- [ ] Chiffrement secrets en base

## Next Tasks
- User deploie la migration corrective dans Supabase
- Tester le flux complet de creation d'etablissement
- Activer strictNullChecks progressivement
