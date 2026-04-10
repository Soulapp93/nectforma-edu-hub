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
- Vue Etudiant/Formateur/Tuteur (`StudentVirtualClasses.tsx`) :
  - Liste des classes avec statut temps reel (en cours / a venir / terminee)
  - Banniere verte quand une classe est en cours
  - Bouton "Participer" actif uniquement pendant la session (15 min avant -> fin)
  - Bouton "Pas encore commencee" grise pour les classes futures
  - Badge "dans Xh" / "dans X jours" pour les classes a venir
  - Filtre (toutes/en cours/a venir/terminees)
  - Refresh auto toutes les 30s
  - Informations : date, heure, duree, formateur, formation
- Page `/classes-virtuelles` + route dans App.tsx
- Sidebar + MobileDrawerMenu mis a jour pour tous les roles
- Vue Admin fonctionne deja dans Pedagogie > Classes virtuelles (existant)
- 3 classes de test creees (1 en cours, 2 a venir)

## Flux complet
1. Admin cree une classe dans Pedagogie > Classes virtuelles
2. Si Zoom connecte (OAuth), le meeting est cree automatiquement
3. Etudiants/Formateurs voient les classes dans leur sidebar
4. Bouton "Participer" redirige vers Zoom quand la session est active

## Task Status

### P0 - TOUS RESOLUS
- [x] Audit, tests, RLS fixes, comptes demo
- [x] Sidebar plate + pages hub + mobile responsive
- [x] Entreprises partenaires, Diplomes, Notes
- [x] Documents etablissement
- [x] Classes virtuelles (creation admin + vue participant + join Zoom)

### P1 - A faire
- [ ] Integrer test:rls dans CI GitHub Actions
- [ ] Activer TypeScript strict

### P2-P3
- [ ] Patterns N+1, pagination
- [ ] Structure code, monitoring, Storybook, doc API
