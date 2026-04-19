# PRD - Nectforma

## Plateforme
ERP Education - Gestion academique (React + Vite + TypeScript + Supabase)

## Session 38 (2026-04-16/19)

### Support Sidebar + Back Office Design (UPDATE)
- **Bouton "Aide" sidebar** connecte au back office :
  - Formulaire inline : Sujet + Message + Envoyer
  - Ticket cree dans `support_tickets` avec establishment_id + created_by
  - Animation succes "Demande envoyee!" avec auto-fermeture 2s
- **Design Back Office** mis a jour pour correspondre a Nectforma :
  - Sidebar sombre gradient (hsl(240,60%,8%))
  - Logo NF dore avec "Nectforma / Back Office"
  - Point dore sur item actif
  - Reduire / Deconnexion en bas
- **Flux complet verifie** : Admin envoie ticket -> Back Office recoit -> SuperAdmin repond -> Statut change (Ouvert -> En cours -> Resolu)
- Testing: iteration_34 (100%, 12/12 tests)

### Back Office SaaS (6 modules)
- Dashboard, Articles & Social, CRM, Analytics, Support, Abonnements
- Testing: iteration_33 (100%, 13/13 tests)

### Toutes les fonctionnalites precedentes testees et fonctionnelles
- Carte Etudiant, Rapport Emargement, Audit PV, Diplomes, Signatures, Email

## SuperAdmin : superadmin@nectforma-demo.com / SuperAdmin2026!

## P1 - [ ] Deploiement production
## P2 - [ ] Export PDF diplomes
## P2 - [ ] Refactoring TranscriptsPanel.tsx
