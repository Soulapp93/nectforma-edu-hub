# PRD - Nectforma

## Plateforme
ERP Education - Gestion academique (React + Vite + TypeScript + Supabase)

## Session 46 (2026-04-26)

### Bulletin avancé v2 — Colonnes dynamiques + Vue unifiée + Bibliothèque modèles (DONE - 2026-04-26)

**A. Colonnes dynamiques selon évaluations existantes** (`TranscriptsPanel.tsx`):
- Détection des `evaluation_type` réellement créés pour la période active.
- Filtrage automatique des colonnes du bulletin : si seuls des CC sont créés → seule la colonne CC s'affiche (DS, Examen, Oral, TP cachés). Les colonnes structurelles (Matière, Coef, Moyenne, Statut, Appréciation, Rang, custom_*) restent toujours visibles.

**B. Bibliothèque de modèles préconfigurés** (`bulletinPresets.ts` + `BulletinTemplateLibrary.tsx`):
- 6 presets : BTS (CC + Examen Blanc), Master (ECTS + mention), BAC PRO (compétences + oral), Semestre simple, Trimestre, Personnalisé (vide).
- Cards visuelles avec mini-aperçu du tableau et badge catégorie. Bouton "Utiliser ce modèle" applique : couleurs, polices, header/body/footer elements, columns config, table style.
- Auto-switch sur l'onglet "Mise en page" après application.

**C. Mise en page unifiée** (`BulletinLayoutEditor.tsx`):
- Suppression des onglets séparés "En-tête / Corps du bulletin / Pied de page".
- Remplacement par 3 onglets globaux : `Mise en page complète` (vue unifiée empilée), `Tableau de notes`, `Aperçu live (données réelles)`.
- Vue unifiée : les 3 zones (header / body / footer) sont rendues empilées verticalement avec un label cliquable par zone, le placeholder "Tableau de notes" entre header et body, et un sélecteur "Zone active" en haut à droite pour cibler les insertions.
- Drag/resize/select fonctionnent sur les 3 zones simultanément (zone détectée au mousedown via recherche de l'élément). PropertiesPanel piloté par un `selected` global (cherche dans les 3 zones).

**D. Live preview avec données réelles** :
- Tab `Aperçu live` réutilise `FullPreview` existant (rendu temps réel de l'état).
- Toutes les modifications (preset, drag-drop, couleurs, colonnes) reflétées instantanément sans sauvegarder.
- L'enregistrement propage vers le bulletin via `transcript-template`/`transcript-template-render`/`grading-rules-transcripts` invalidations.

### Bug Fix - Bulletin vide "Aucune note saisie" (DONE - 2026-04-26)
- **Cause racine** : la query `formation-modules-transcripts` sélectionnait `competency_block_id` — colonne **inexistante** dans `formation_modules`. La requête échouait avec un 400, retournant silencieusement `[]`. Conséquence : `allModules.length === 0` → `currentBulletin.modules = []` → toutes les lignes du bulletin sautées.
- **Fix** :
  - `TranscriptsPanel.tsx` : retiré `competency_block_id` du SELECT, ajouté `console.error` en cas d'erreur Supabase, idem pour la query `competency_blocks` (table inexistante) avec `retry: false` pour éviter les retries inutiles.
  - `BulletinConfigurationPanel.tsx` : ajout de l'invalidation `['grading-rules-transcripts', formationId]` (nom de query utilisé par TranscriptsPanel) en plus de `['grading-rules-config', formationId]` → la configuration appliquée se propage immédiatement au bulletin sans rafraîchissement.
- **Validation** : Bernard Lucas / Semestre 1 affiche maintenant les vraies notes (seo 9.00 Ajourné, digital 12.50 Validé, refer 13.00 Validé), Moyenne générale 11.50, Mention passable, Décision Admis. Bulletin composite "BTS Final Test 2026" rend les 2 blocs séparés (Semestre 1 + Semestre 2) avec total + décision.

### Bulletin composite — Configuration complète multi-blocs (DONE - 2026-04-26)
- **Migration DB** (20260426140000_composite_config.sql) : ajout colonne `composite_config` JSONB sur `evaluation_periods`. Stocke `{ blocks: [...], total: {...} }`.
- **Service** (`gradesService.ts`) : nouveaux types `CompositeBulletinConfig`, `CompositeBlockConfig`, `CompositeTotalConfig`. Champ `composite_config` ajouté à `EvaluationPeriod`.
- **Modale enrichie** (`CreateCompositePeriodModal.tsx`, refonte complète) : 3 étapes en une seule modale.
  - Étape 1 : nom + sélection des périodes
  - Étape 2 : par bloc -> mode rendu (Bloc séparé / Fusion ligne), titre custom, choix colonnes (15 colonnes regroupées Base/Notes/Calculs/Annotations), réordonnancement (haut/bas)
  - Étape 3 : Total/décision avec libellé custom, 4 modes de calcul (somme points, moyenne moyennes, moyenne pondérée, formule personnalisée), seuil + libellés ADMIS/NON ADMIS personnalisables
- **Renderer dédié** (`CompositeBulletinRenderer.tsx`, nouveau) : rend N blocs séparés (chacun avec son titre + colonnes choisies) + un mode "Fusion" qui combine plusieurs périodes en colonnes côte-à-côte. Affiche total final + décision colorée (vert/rouge).
- **Intégration** (`TranscriptsPanel.tsx`) : calcul auto des moyennes par période et par module (CC/DS/Exam/Oral/TP), moyenne de classe, points = moyenne × coef, status, appréciation. Total calculé selon la formule choisie. Branche conditionnelle dans le rendu : si `composite_config` présent -> `<CompositeBulletinRenderer />` ; sinon templates classiques.
- **Validation runtime** : modale ouvre 3 étapes OK, création composite OK, bulletin rendu avec 2 blocs séparés + ligne TOTAL + NON ADMIS, signataires affichés, aucune erreur console.

### Bug Fix - Crash "Cannot access 'periods' before initialization" (DONE - 2026-04-26)
- **Fichier** : `/app/src/components/grades/GradeSheetView.tsx`
- **Cause** : `isPeriodLocked` (useMemo) était défini AVANT le useMemo `periods` qu'il référence -> Temporal Dead Zone
- **Fix** : Déplacement du bloc `isPeriodLocked` après la déclaration `const periods = useMemo(...)`
- **Validation** : Login admin -> /notes-admin -> clic formation -> page détail rend correctement (matières, périodes, onglets), aucune erreur console PageError/TDZ.


## Session 45 (2026-04-25)

### Refonte Notes & Bulletins (DONE - 2026-04-25)
- **Migration DB** (20260425000000) :
  - Nouvelle table `bulletin_signatures` (period_id, signature_type IN pedagogue/jury/stamp, name, title, signature_image) + RLS staff/select all establishment members + UNIQUE(period_id, signature_type)
  - `formation_modules.semester` rendu nullable (les modules ne sont plus rattaches a un semestre)
- **CreatePeriodModal** : `needsModules: true` pour TOUS les types (Semestre, Trimestre, Examen, Rattrapage, Custom). Plus seulement les examens.
- **ModuleForm.tsx** : suppression du selecteur Semestre lors de la creation/edition des modules de formation.
- **SignaturesCachetTab.tsx** (nouveau composant) :
  - 3 cards (Responsable Pedagogique bleu, President du Jury violet, Cachet de l'Etablissement rouge) avec preview + bouton "Configurer/Modifier"
  - Section "Apercu sur le bulletin" avec rendu temps reel des 3 signatures
  - Editor par card : champs Nom + Titre, tabs **Dessiner** (canvas avec mouse/touch + bouton Effacer) ou **Importer** (upload image PNG transparent)
  - Sauvegarde via upsert (UNIQUE constraint)
- **Notes.tsx** : 
  - Bouton **Configuration bulletin** (renomme depuis "Configuration") - regroupe toutes les configs/personnalisations
  - Nouveau bouton **Signatures & Cachet** (data-testid=`signatures-cachet-btn`) - desactive si pas de periode selectionnee
  - Suppression de l'ancien `SignatureRequestPanel` (remplace par `SignaturesCachetTab` dans un Dialog)
- **Tests runtime** : 3 boutons OK, dialog Signatures avec 3 cards + apercu bulletin OK, Editor canvas OK, Modal Periode avec selection modules pour Semestre OK.

## Session 44 (2026-04-21)

### Gestion des diplomes enrichie (DONE - 2026-04-21)
Aligne sur Gestion des cartes etudiantes + plus de fonctionnalites.

**Migration DB** (20260421000000_diploma_verification.sql) :
- `generated_diplomas.diploma_number` (unique) + `verification_code` (unique)
- RPC publique `verify_diploma_by_code(p_code text)` (SECURITY DEFINER) pour lookup sans auth

**Service (`diplomaService.ts`)** :
- `DiplomaElement.type` etend avec `'qr_code' | 'stamp' | 'signature_image'`
- `DiplomaElement.face` = recto | verso
- `DiplomaTemplateData` etend : `format` (A4L/A4P/A3L/custom), `hasVerso`, `backgroundColorVerso`, `watermark {enabled, text, opacity, size, color, angle}`
- `FORMAT_DIMENSIONS` constante (A4 595×842, A4L 842×595, A3L 1191×842)
- 10 presets de templates varies (Classique, Moderne, Elegant dore, Prestige violet, Minimaliste, Corporate bleu, Portrait academique, A3 Ceremonie, Biface officiel, Vert nature)
- `generateVerificationCode()` + `verifyByCode(code)` + resolve `{code_verification}`

**Editeur (`DiplomaTemplateEditor.tsx`)** :
- Toggle Recto/Verso (data-testid=`toggle-verso`, `face-recto`, `face-verso`)
- Select format (A4L/A4P/A3L/custom) data-testid=`format-select`
- 9 boutons d'ajout : Texte, Variable, Image, Ligne, Rectangle, Signature, QR Code, Signature img, Tampon
- Panneau "Fond" avec toggle filigrane + personnalisation (texte, couleur, opacite, taille, angle)
- Canvas filtre par face active + badge indicateur RECTO/VERSO
- Calques filtres par face

**Renderer partage (`DiplomaRenderer.tsx`)** + helper PDF `pdfExport.ts` (html2canvas + jsPDF)

**Management (`DiplomaManagement.tsx`)** :
- Apercu recto + verso (si active) avec `DiplomaRenderer`
- Bouton "Telecharger PDF" (data-testid=`download-pdf-btn`) qui capture recto+verso en multi-pages A4
- Generation masse : chaque `generated_diploma` recoit automatiquement `diploma_number` + `verification_code`
- QR code "Code de verification" genere un QR renvoyant vers `/verify-diploma/{code}`

**Page publique** : `/verify-diploma/:code` (`VerifyDiplomaPage.tsx`) — carte de verification publique avec bandeau vert + toutes les infos + date de verification.

**Tests runtime** :
- Editeur ouvert : canvas=1, toggle-verso=1, format-select=1, add-qr_code=1, add-stamp=1, add-signature_image=1 ✅
- Vue management : 3 etudiants admis, stats OK, boutons "Creer un modele" / "Generer les diplomes" / "Modifier" / "Apercu" visibles ✅
- Page publique `/verify-diploma/DIP-2026-TEST123456` : bandeau "Diplome authentique" + toutes les infos (Alice Dubois, Rh, BAC+1, 2026-2027, Nectforma Demo) ✅

## Session 43 (2026-04-21)

### Gestion fichiers joints des Evaluations ameliorees (DONE - 2026-04-21)
- **Bug fix FileUpload** : le bouton X de retrait n'avait pas `type="button"` → pouvait declencher un submit premature du formulaire. Ajout du type="button".
- **Feedback utilisateur** : dans CreateAssignmentModal, remplacement des `alert()` par des toasts. Messages explicites quand un upload echoue (ex: "2 fichier(s) n'ont pas pu etre ajoutes. 3 fichier(s) ont ete ajoutes avec succes").
- **Gestion fichiers en edition** : le modal de modification d'une evaluation liste maintenant les fichiers deja associes (avec nom + lien cliquable + corbeille pour supprimer), ET permet d'en ajouter de nouveaux. Avant: aucune gestion de fichier en edition.
- **Indicateur visuel** : `"✓ X nouveau(x) fichier(s) sera(ont) ajoute(s)"` apparait en vert quand l'utilisateur selectionne des fichiers (plus explicite que l'ancien "X fichier(s) selectionne(s)").
- **data-testid** ajoutes: `assignment-files-section`, `selected-files-indicator`, `remove-existing-file-<id>`.

**Tests runtime** :
- Creation TEST_MULTI_FICHIER avec 2 fichiers → DB: 2 rows assignment_files ✅
- Ouverture modal Details → fichiers visibles avec boutons "Voir" et "Telecharger" ✅
- Edition: affichage "Fichiers deja associes" + suppression d'un fichier + ajout d'un nouveau → DB: doc2 + doc3 (doc1 supprime) ✅
- Toast "Fichier supprime" ✅
- Cleanup test data OK

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
