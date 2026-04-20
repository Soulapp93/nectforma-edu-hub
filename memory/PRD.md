# PRD - Nectforma

## Plateforme
ERP Education - Gestion academique (React + Vite + TypeScript + Supabase)

## Session 39 (2026-04-19/20)

### Badges compteur notifications (DONE - 2026-04-20)
- Nouveau hook `useUnreadCounters` (messagerie + groupes + support) avec subscriptions Realtime Supabase
- `TopHeaderBar.tsx` : icones Users (groupes) + MessageSquare (messagerie) + cloche, chacun avec badge dore et data-testid (`header-groupes-link/badge`, `header-messagerie-link/badge`)
- Chaque icone cliquable redirige vers la page correspondante (`/groupes`, `/messagerie`)
- `Sidebar.tsx` : badge dore `support-tickets-badge` sur l'icone MessageSquare a cote d'Aide, incremente quand le support repond
- Auto-reset : ouvrir `/support` ou `/groupes` marque le canal comme vu (via `markChannelSeen` + localStorage)
- Messagerie : lit directement `message_recipients.is_read=false` (pas de localStorage)
- Tests smoke runtime : 4/4 passes (clics OK, badges OK, reset OK)

### Espace d'echange Support Etablissement <-> SuperAdmin (DONE)
- Nouvelle page `/support` (SupportPage.tsx) : liste tickets + vue conversation
- Vue conversation bidirectionnelle : etablissement (droite, icone User) / SuperAdmin (gauche, icone Headphones, label "Support Nectforma")
- Replies : textarea + envoi (Entree = envoyer, Shift+Entree = saut de ligne)
- Bouton "Nouveau ticket" sur la page /support ouvre automatiquement la conversation apres creation
- Ticket ferme -> input masque avec message "Ce ticket est ferme"
- Parsing automatique des pieces jointes inline (depuis description du sidebar form)
- Lien sidebar : icone MessageSquare a cote de "Aide" -> /support
- Testing: iteration_36 (100%, 9/9 scenarios + code review scenario 10)

## Session 38 (2026-04-16/19)

### Support Ameliore - Fichiers & Vocal (UPDATE)
- **Upload fichiers** : bouton trombone dans textarea, upload Supabase Storage, liste fichiers joints avec suppression
- **Saisie vocale** : bouton micro avec Web Speech API (fr-FR), indicateur enregistrement pulse rouge
- **Fichiers joints integres** au ticket via description markdown avec liens
- Testing: iteration_35 (100%, 10/10 tests)

### Support Sidebar + Back Office Design
- Bouton "Aide" sidebar -> formulaire inline -> ticket back office
- Design Back Office identique Nectforma (logo NF dore, sidebar gradient)
- Testing: iteration_34 (100%, 12/12 tests)

### Back Office SaaS (6 modules)
- Dashboard, Articles, CRM, Analytics, Support, Abonnements
- Testing: iteration_33 (100%, 13/13 tests)

### Toutes fonctionnalites precedentes testees et fonctionnelles

## SuperAdmin : superadmin@nectforma-demo.com / SuperAdmin2026!

## P1 - [ ] Deploiement production
## P2 - [ ] Export PDF diplomes
## P2 - [ ] Refactoring TranscriptsPanel.tsx
