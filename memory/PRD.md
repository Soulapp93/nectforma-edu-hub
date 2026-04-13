# PRD - Nectforma

## Application Overview
- **Name:** Nectforma - SaaS multi-tenant pour centres de formation
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (BaaS) + Capacitor

## Session 27 - Refonte Gestion des Promotions (2026-04-13)
- Architecture 2 niveaux: Formations groupees -> Promotions detail
- Vue par defaut: formations avec nb promotions, nb etudiants, badges annees
- Clic formation -> promotions avec 5 boutons raccourcis colores:
  - Participants (bleu) -> /administration?tab=users&formation={id}
  - Emploi du temps (violet) -> tab=schedules
  - Cahier de texte (vert) -> tab=textbooks
  - Emargement (ambre) -> /suivi-emargement-admin
  - Notes (rose) -> /notes-admin
- Toggle vue grille/liste dans les 2 niveaux
- Bouton retour (fleche) entre les niveaux
- Recherche dans les 2 niveaux
- Testing: 8/8 passes (iteration_13)

## All Completed
- [x] Toutes fonctionnalites precedentes
- [x] Gestion promotions par formation avec raccourcis

## P1 - [ ] Deploiement production
## P2 - [ ] TypeScript strict, Refactoring TranscriptsPanel, N+1/pagination
