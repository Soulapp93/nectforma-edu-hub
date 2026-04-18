# PRD - Nectforma

## Plateforme
ERP Education - Gestion academique (React + Vite + TypeScript + Supabase)

## Session 38 (2026-04-16/18)

### Back Office SaaS (NEW - Major Feature)
- **Route** : `/back-office` (SuperAdmin uniquement)
- **6 modules** avec sidebar sombre navigable :
  1. **Dashboard** : 6 stat cards (Etablissements, Utilisateurs, Etudiants, Tickets, MRR, Articles), derniers etablissements, derniers tickets
  2. **Articles & Social** : Reutilise BlogAdmin existant (redaction, publication, reseaux sociaux)
  3. **CRM** : Liste 5 etablissements avec stats (users, etudiants, formations, date), fiche detaillee (infos, plan, notes), notes CRM (note/appel/email/reunion)
  4. **Analytics** : 8 KPIs, graphique 30 jours (nouveaux users), Top etablissements (barres progression), Utilisation fonctionnalites (emargements, evaluations, releves, diplomes, chat, tickets)
  5. **Support** : Inbox tickets (Ouvert/En cours/Resolu/Ferme), vue conversation avec reponse directe, changement statut
  6. **Abonnements & Revenus** : MRR/ARR/Actifs/Essai, 4 plans (Gratuit/Starter 49EUR/Pro 149EUR/Enterprise 399EUR), creation/modification abonnements par etablissement
- Tables Supabase : `support_tickets`, `support_messages`, `establishment_subscriptions`, `crm_notes`
- RLS SuperAdmin policies sur establishments, users, formations
- Sidebar collapsible + deconnexion
- Testing: iteration_33 (100%, 13/13 tests)

### Carte Etudiant (Sessions precedentes)
- 10 presets, editeur drag&drop, dimensions ISO, photos profil, page verification QR
- Onglet "Carte etudiant" dans profil etudiant

### Rapport Emargement, Audit PV, Validation PV, Diplomes, Signatures
- Tous testes et fonctionnels (iterations 25-32)

## SuperAdmin : superadmin@nectforma-demo.com / SuperAdmin2026!

## P1 - [ ] Deploiement production
## P2 - [ ] Export PDF diplomes
## P2 - [ ] Integration support sidebar (cote etablissement)
## P2 - [ ] Refactoring TranscriptsPanel.tsx
