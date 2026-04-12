# PRD - Nectforma

## Application Overview
- **Name:** Nectforma - SaaS multi-tenant pour centres de formation
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (BaaS) + Capacitor

## Session 23 - Fix Chat Files WhatsApp-like (2026-04-12)
- **Root cause**: chatService.ts envoyait `file_type` mais la colonne DB est `content_type` → erreur PGRST204 silencieuse → attachments jamais sauvegardes
- **Fix**: `file_type` → `content_type` dans uploadAttachment()
- **Ameliorations ChatRoom**:
  - detectType() avec fallback sur extension fichier
  - Images: miniatures inline max-w-300px avec overlay hover (Eye/Download) + nom fichier en gradient
  - PDF: cartes avec icone rouge + nom + taille Ko
  - Autres fichiers: cartes avec icone type + badge extension
  - Tout cliquable → ProductionFileViewer
- Testing: 5/5 passes (iteration_9)
- Note: anciens messages avant fix restent en texte (attachments pas sauvegardes en DB)

## All P0 Tasks - DONE
- [x] Audit, tests, RLS, comptes demo, sidebar, mobile
- [x] Zoom E2E, notifications, reminders
- [x] Refactoring + CI
- [x] Dossiers administratifs + Export PDF
- [x] Bug fix Realtime, creation etablissement/formation/upload
- [x] Promotions automatiques
- [x] Preview fichiers universel + tooltip hover
- [x] Chat WhatsApp-like (images inline, PDF cartes, viewer)

## P1
- [ ] Deploiement production

## P2-P3
- [ ] TypeScript strict
- [ ] Refactoring TranscriptsPanel.tsx
- [ ] N+1 patterns, pagination
