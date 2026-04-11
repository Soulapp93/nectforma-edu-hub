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
- Vue Etudiant/Formateur/Tuteur (`StudentVirtualClasses.tsx`)
- Page `/classes-virtuelles` + route dans App.tsx
- Vue Admin dans Pedagogie > Classes virtuelles

### Session 13 - Integration Zoom E2E (2026-04-11)
- Connexion Zoom Server-to-Server OAuth configuree et testee
- Credentials Zoom sauves dans `zoom_connections` pour l'etablissement demo
- Edge Function `zoom-meeting` reconfiguree avec `verify_jwt: false` (ES256 compat)
- 4 classes virtuelles synchronisees avec de vrais meetings Zoom

### Session 14 - Notifications Automatiques (2026-04-11)
- Notifications in-app (cloche) envoyees aux etudiants + formateurs
- Message complet dans la Messagerie Nectforma (titre, date, horaires, lien Zoom, code d'acces)
- Emails via Brevo envoyes automatiquement a chaque destinataire
- Secret `BREVO_API_KEY` configure dans Supabase
- Les 3 canaux (notification, messagerie, email) declenches automatiquement apres creation d'une classe virtuelle

## Flux complet Classes Virtuelles
1. Admin connecte Zoom (Account ID, Client ID, Client Secret) dans Pedagogie > Integrations
2. Admin cree une classe dans Pedagogie > Classes virtuelles
3. Meeting Zoom cree automatiquement via Edge Function
4. **Notifications envoyees automatiquement** :
   - Notification in-app (cloche) a chaque etudiant/formateur
   - Message dans la Messagerie avec toutes les infos (lien Zoom, code, horaires)
   - Email professionnel via Brevo a chaque destinataire
5. Etudiants/Formateurs voient les classes dans leur sidebar
6. Bouton "Participer" redirige vers Zoom

## Task Status

### P0 - TOUS RESOLUS
- [x] Audit, tests, RLS fixes, comptes demo
- [x] Sidebar plate + pages hub + mobile responsive
- [x] Entreprises partenaires, Diplomes, Notes
- [x] Documents etablissement
- [x] Classes virtuelles + Integration Zoom E2E
- [x] Notifications automatiques (in-app + messagerie + email)

### P1 - A faire
- [ ] Integrer test:rls dans CI GitHub Actions
- [ ] Activer TypeScript strict

### P2-P3
- [ ] Patterns N+1, pagination
- [ ] Structure code, monitoring, Storybook, doc API
- [ ] Refactoring composants monolithiques (VirtualClassesManagement, Notes)
