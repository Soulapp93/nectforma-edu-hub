# PRD - Nectforma

## Application Overview
- **Name:** Nectforma - SaaS multi-tenant pour centres de formation
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (BaaS) + Capacitor

## Session 28 - Raccourcis Promotions Directs + Modal Participants (2026-04-13)
- **Modal Participants**: Popup avec liste etudiants (avatar initiales, nom, email, phone)
  - Appelle formationService.getFormationStudents() via RPC
  - Style: header violet, cards etudiants, bouton Fermer
- **Navigation directe**: Les boutons raccourcis passent formationId dans l'URL
  - Emploi du temps: ?tab=schedules&formationId=xxx -> auto-selection formation
  - Cahier de texte: ?tab=textbooks&formationId=xxx -> auto-selection formation
  - Emargement: /suivi-emargement-admin?formationId=xxx
  - Notes: /notes-admin?formationId=xxx
- **ScheduleManagement + TextBooksList**: useEffect lit searchParams.get('formationId') au montage et appelle handlePromotionSelect()
- **Toutes formations affichees**: fetch allFormations + merge avec promotions
- Testing: 5/5 passes (iteration_15)

## All Completed
- [x] Toutes fonctionnalites precedentes
- [x] Raccourcis promotions directs + modal participants + toutes formations

## P1 - [ ] Deploiement production
## P2 - [ ] TypeScript strict, Refactoring TranscriptsPanel, N+1/pagination
