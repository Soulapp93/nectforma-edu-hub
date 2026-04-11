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
- Vue Admin dans Pedagogie > Classes virtuelles

### Session 13 - Integration Zoom E2E (2026-04-11)
- Connexion Zoom Server-to-Server OAuth
- Edge Function `zoom-meeting` (verify_jwt: false)
- 4 classes synchronisees avec vrais meetings Zoom

### Session 14 - Notifications Automatiques (2026-04-11)
- 3 canaux a la creation : notification in-app + message messagerie + email Brevo
- Secret `BREVO_API_KEY` configure

### Session 15 - Rappels Automatiques 15 min (2026-04-11)
- Edge Function `virtual-class-reminder` deployee et testee
- Colonne `reminder_sent_at` ajoutee pour idempotence
- pg_cron job `*/5 * * * *` via pg_net pour invocation automatique
- 3 canaux de rappel : notification + messagerie + email avec template specifique (urgence jaune)
- Teste E2E : 4 notifications + 4 emails + 1 message envoyes, idempotent confirme

## Flux complet Classes Virtuelles
1. Admin connecte Zoom dans Pedagogie > Integrations
2. Admin cree une classe > Meeting Zoom cree automatiquement
3. **Notifications creation** : notification + messagerie + email a tous les participants
4. **Rappel automatique 15 min avant** : pg_cron verifie toutes les 5 min, envoie rappel via 3 canaux
5. Etudiants/Formateurs voient la classe et cliquent "Participer" > Zoom

## Task Status

### P0 - TOUS RESOLUS
- [x] Audit, tests, RLS fixes, comptes demo
- [x] Sidebar plate + pages hub + mobile responsive
- [x] Entreprises partenaires, Diplomes, Notes
- [x] Documents etablissement
- [x] Classes virtuelles + Integration Zoom E2E
- [x] Notifications automatiques (creation + rappel 15 min)

### P1 - A faire
- [ ] Integrer test:rls dans CI GitHub Actions
- [ ] Activer TypeScript strict

### P2-P3
- [ ] Patterns N+1, pagination
- [ ] Structure code, monitoring, Storybook, doc API
- [ ] Refactoring composants monolithiques
