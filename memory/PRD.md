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
- Audit architecture complet (score 3.0/5)
- 105 tests Vitest + 42 tests RLS integration
- Fix triggers, RLS recursion, cross-tenant vulnerability
- 7 comptes demo crees et documentes

### Session 7 - Comptes demo sur page login (2026-04-09)
- Section "Comptes demo" depliable sur /auth avec auto-connexion

### Session 8 - Sidebar par categories (2026-04-10)
- Sidebar avec categories depliables (admin uniquement)
- Navigation plate pour Formateur/Etudiant/Tuteur

### Session 9 - Sidebar plate + pages hub avec onglets (2026-04-10)
- Sidebar aplatie : plus de sous-menus depliables
- Chaque categorie admin = lien direct vers sa page hub avec tab bar horizontale
- Pages hub creees :
  - `/administration` : Gestion des utilisateurs | Entreprises partenaires
  - `/pedagogie` : Emplois du temps | Cahiers de textes | Formations | Promotions | Classe virtuelle
  - `/suivi-emargement-admin` : Gestion des emargements | Gestion des absences
  - `/notes-admin` : Notes et releves | Gestion des diplomes
  - `/communication` : Messagerie | Groupe etablissements
  - `/documents-archives` : Dossiers etudiants | Archives
- Sidebar et pages hub = admin uniquement
- Formateur/Etudiant/Tuteur gardent navigation plate classique

## Task Status

### P0 - TOUS RESOLUS
- [x] Audit, tests, RLS fixes, comptes demo
- [x] Sidebar plate avec pages hub admin

### P1 - A faire
- [ ] Integrer test:rls dans CI GitHub Actions
- [ ] Activer TypeScript strict
- [ ] Decomposer composants monolithiques

### P2-P3
- [ ] Patterns N+1, pagination, chiffrement secrets
- [ ] Structure code, monitoring, Storybook, doc API
