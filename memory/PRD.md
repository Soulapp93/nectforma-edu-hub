# PRD - Nectforma

## Plateforme
ERP Education - Gestion academique (React + Vite + TypeScript + Supabase)

## Session 42 (2026-04-21)

### Notifications automatiques pour Travail à faire (DONE - 2026-04-21)
- **`notificationService.notifyTaskCreated(moduleId, taskId, title, dueDate, priority)`** ajoute:
  1. Resolution automatique formation_id depuis le module
  2. Filtre uniquement les users role='Étudiant' assignes a la formation
  3. Insert bulk de notifications in-app (table notifications, type='assignment')
  4. Invoke edge function `send-notification-emails` (type=bulk_notification) pour envoi Brevo
- **Integration** : appel fire-and-forget dans `taskService.create()` (ne bloque jamais la creation).
- **Tests runtime** :
  - 3 etudiants Rh (Alice/Lucas/Emma) ont recu la notification in-app (verifie en DB)
  - Cloche etudiant Alice affiche badge "11" (avec la nouvelle notification)
  - Aucune erreur console
  - Cleanup: TEST_NOTIF task + 3 notifs supprimes

## Session 41 (2026-04-20)

### Refonte des onglets de module (DONE - 2026-04-20)
- **Renommages** des 6 onglets dans `FormationDetail.tsx` (vue principale) et `ModuleDetail.tsx` :
  - Contenu → **Support de cours**
  - Documents → **Ressources pedagogiques**
  - Devoirs → **Evaluations**
  - Corrections → **Correction evaluation**
  - **Nouveau** : **Travail a faire**
  - Groupes (inchange)
- **Grille 8 types d'evaluation** dans `CreateAssignmentModal.tsx` : devoir_maison, controle_continu, devoir_surveille, examen_blanc, examen_final, partiel, rattrapage, autre. Chaque type a icone + couleur + label. Meta centralise dans `/app/src/utils/evaluationTypes.ts`.
- **Badge type** affiche sur chaque card d'evaluation dans `ModuleAssignmentsTab.tsx` (assignment-type-badge-<id>).
- **Migration DB** (20260420020000): CHECK constraint `module_assignments_assignment_type_check` mis a jour avec les 8 nouvelles valeurs. UPDATE legacy: 'devoir'->'devoir_maison', 'evaluation'->'examen_final'. Default='devoir_maison'.
- **Onglet 'Travail a faire'** :
  - Table `module_tasks` (id, module_id, title, description, due_date, priority low/medium/high, attachment_url, attachment_name, created_by) + RLS (SELECT = membres etablissement, ALL = AdminPrincipal/Admin/Formateur).
  - `ModuleTasksTab.tsx` + `CreateTaskModal.tsx` : liste avec bouton 'fait' (localStorage), badge priorite colore, indicateur 'En retard', PJ optionnelle, edit/delete pour le staff.
  - `taskService.ts` : list/create/update/remove.
- **Tests** : iteration_39 (6 tabs OK, CRUD task OK 100%, grille 8 types OK, MAIS submit evaluation bloque par CHECK constraint). Fix migration applique, smoke test post-fix : creation examen_blanc OK, toast 'Evaluation creee avec succes' + badge orange 'Examen blanc' visible.

### Refonte Emploi du temps (DONE - 2026-04-20)
- **Migration DB** (20260420000000): `schedule_slots` enrichi avec `slot_kind`, `event_type`, `event_label`, `event_scope`, `is_cancelled`, `cancellation_reason`, `cancelled_at`, `cancelled_by`, `all_day` + contraintes CHECK + index + FK cancelled_by.
- **AddSlotModal simplifie** : retrait complet du choix Session encadree/autonomie. Form = Module*, Date*/Horaires*, Salle, Formateur, Couleur, Commentaire.
- **AddEventModal (nouveau)** : 10 types (Conges, Etablissement ferme, Jour ferie, Portes ouvertes, Autonomie, Examen blanc, Examen final, Partiels, Rattrapage, Autre). Portee = formation | establishment. Periode Du/Au (iteration sur plage, 1 slot par jour). Switch Journee entiere. Libelle personnalise requis si type=custom.
- **Annulation soft** : `cancelScheduleSlot(id, reason, userId)` + `restoreScheduleSlot(id)`. Badge 'Annule' rouge + banner motif + bouton 'Reactiver' dans EventDetailsModal. Dans le calendrier : pattern raye + opacite 60% + tag ANNULE.
- **Menu split** sur bouton `+` : DropdownMenu avec 'Ajouter un cours' / 'Ajouter un evenement'.
- **Affichage events** : ring blanc + tag 'EVENEMENT' + couleur du type. Events est-scope `establishment` affiches sur tous les plannings (prepare pour affichage multi-formation).
- **Bug fix PGRST201** : tous les `.select('*, users(...)')` sur `schedule_slots` qualifies avec `users!schedule_slots_instructor_id_fkey(...)` (scheduleService.ts, CreateAttendanceSessionModal, BlankAttendanceSlotModal) car 2 FK users existent maintenant (instructor_id + cancelled_by).
- **Tests** : iteration_37 (UI 100%, E2E bloque par PGRST201), iteration_38 (fix valide, 100% UI), test runtime final confirme en DB: cours annule rendu raye + tag ANNULE, 5 jours conges verts avec tag EVENEMENT, custom event non-allday avec horaires 10:00-16:00.

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
