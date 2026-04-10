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

### Session 11 - Documents Etablissement (2026-04-10)
- Remplacement "Gestion des dossiers etudiants" par "Documents etablissement"
- Gestionnaire de documents complet :
  - Creation de dossiers hierarchiques (sous-dossiers)
  - Upload multiple de fichiers (vers bucket Supabase `establishment-docs`)
  - Telechargement de fichiers
  - Renommage (dossiers + fichiers)
  - Suppression avec confirmation (cascade pour dossiers)
  - Navigation par breadcrumbs
  - Recherche par nom
  - Stats temps reel (dossiers, fichiers, espace utilise)
  - Icones par type de fichier (PDF, Image, Video, Excel, Archive)
- Tables utilisees : `digital_safe_folders`, `digital_safe_files`
- Storage bucket : `establishment-docs` (50 Mo max)

## Task Status

### P0 - TOUS RESOLUS
- [x] Audit, tests, RLS fixes, comptes demo
- [x] Sidebar plate + pages hub + mobile responsive
- [x] Entreprises partenaires, Diplomes, Notes et releves
- [x] Documents etablissement (CRUD complet)

### P1 - A faire
- [ ] Integrer test:rls dans CI GitHub Actions
- [ ] Activer TypeScript strict
- [ ] Decomposer composants monolithiques

### P2-P3
- [ ] Patterns N+1, pagination, chiffrement secrets
- [ ] Structure code, monitoring, Storybook, doc API
