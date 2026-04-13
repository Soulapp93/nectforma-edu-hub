# PRD - Nectforma

## Application Overview
- **Name:** Nectforma - SaaS multi-tenant pour centres de formation
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (BaaS) + Capacitor

## Session 29 - Raccourcis Promotions Direct au Contenu (2026-04-13)
- Les 5 boutons raccourcis redirigent maintenant DIRECTEMENT vers le contenu:
  - Participants: modal popup avec liste etudiants
  - Emploi du temps: ?tab=schedules&formationId=xxx -> auto-selection
  - Cahier de texte: ?tab=textbooks&formationId=xxx -> auto-selection
  - Emargement: /suivi-emargement-admin?formationId=xxx -> auto-selection
  - Notes: /notes-admin?formationId=xxx -> auto-selection avec 4 onglets
- Composants modifies: AttendanceManagement, Notes, ScheduleManagement, TextBooksList
- Toutes formations affichees (meme sans promotions)
- Testing: 4/4 passes (iteration_16)

## All Completed - [x]
## P1 - [ ] Deploiement production
## P2 - [ ] TypeScript strict, Refactoring TranscriptsPanel, N+1/pagination
