# PRD - Nectforma

## Plateforme
ERP Education - Gestion academique (React + Vite + TypeScript + Supabase)

## Session 49 (2026-05-02)

### Feature : Periodes combinees / Bulletin combine empile (DONE - 2026-05-02)
**Besoin** : permettre aux ecoles de combiner 2+ periodes existantes en un bulletin unique qui empile chaque bulletin source verticalement, plus une section finale "Synthese" avec moyenne agregee selon une regle configurable. La periode combinee reste independante (pill propre, propre `bulletin_configurations`, publiable).

**Architecture** :
- Migration `20260502000000_combined_periods.sql` (appliquee en prod via Management API HTTP 201) :
  - Reactive les colonnes `is_composite` (bool), `combined_period_ids` (uuid[]), `composite_config` (jsonb) sur `evaluation_periods`
  - CHECK constraint `evaluation_periods_combined_consistency` (is_composite XOR combined_period_ids IS NULL)
  - Index `idx_evaluation_periods_is_composite` + RPC `get_combined_source_periods(combined_period_id)` SECURITY DEFINER
- Service `combinedPeriodService.ts` :
  - `createCombinedPeriod` / `updateCombinedPeriod` / `getCombinedSourcePeriods` (avec fallback direct query si RPC indispo)
  - `aggregateCombinedAverage(perPeriodAvg, config)` : 3 regles (`simple_average`, `weighted_average`, `weighted_by_coefficient`)
- Service `bulletinClientCalculator.ts` (~190 lignes) : mirror client-side de l'Edge Function `compute-bulletin` (computeStudentPeriodBulletin pour 1 etudiant x 1 periode). Permet le calcul pour le bulletin combine sans dependre de l'Edge Function deployee.

**UI** :
- Nouveau composant `CreateCombinedPeriodModal.tsx` (~250 lignes) : nom + dates + multi-select des periodes sources (cochables) + dropdown 3 regles + inputs poids (visibles en mode "weighted_average") + label custom + recap automatique
- Nouveau composant `CombinedBulletinRenderer.tsx` (~330 lignes) :
  - Pour chaque periode source : resolveConfig + load evals/grades + computeStudentPeriodBulletin -> rendu OfficialBulletinTemplate avec sa propre config (couleurs, police, signatures masquees)
  - Bandeau header "Bulletin combine" avec gradient
  - Section finale `combined-final-section` : tableau recap par periode (moyenne + poids) + tfoot moyenne combinee + grid mention/decision + signatures + mentions legales
- `Notes.tsx` : nouveau bouton `create-combined-period-btn` (disabled si <2 periodes simples), period pills purple/violet pour combines, edit pencil ouvre la bonne modal selon `is_composite`
- `TranscriptsPanel.tsx` : detection `isCombinedPeriod`, banner explicatif `combined-period-notice` au-dessus du tableau, "Voir le bulletin -> + badge violet" dans la liste, route le clic Voir vers `CombinedBulletinRenderer`

**Cas d'usage** :
- Ecole BTS cree "Annee complete" qui combine S1 + S2 en moyenne simple -> S1=10 + S2=10 -> 10
- Universite cree "Bulletin annuel pondere" 40% S1 + 60% S2
- BTS final cree "Recapitulatif final" qui combine S1 + S2 + Examen blanc avec coefficients module

**Validation testing agent (iteration_41)** : 100% success rate, tous les data-testid testes (combined-period-modal, combined-source-{id}, combined-weight-{id}, combined-rule-select, combined-period-submit, combined-period-notice, combined-bulletin, combined-source-bulletin-{i}, combined-final-section). POST /rest/v1/evaluation_periods retourne 201 -> CHECK constraint OK. Migration SQL bien appliquee.

**Cleanup** : periode test "TEST_Combined_Annuel" supprimee de la DB apres validation.

## Session 48 (2026-05-01)

### Sprint B — Edge Function `compute-bulletin` (DONE - 2026-05-01)
- **Edge Function** `/app/supabase/functions/compute-bulletin/index.ts` (~470 lignes) :
  - Auth via `requireAuthenticatedUser` (staff = full access dans son etablissement, etudiant = uniquement son propre bulletin)
  - Resolution config via RPC `resolve_bulletin_config(period_id)` (cascade etablissement -> formation -> periode)
  - Determination des periodes sources selon `sources_config.period_scope` (`current` / `all_up_to_current` / `custom`)
  - Calcul par etudiant x module : grouper notes par evaluation_type (normalisees /20), combiner via `combination_mode` (weighted_average / max / min / replacement) avec `type_weights`
  - Eliminatoire : seuil `eliminatory_note_threshold` marque le module
  - Moyenne generale : `weighted_by_module_coefficient` / `weighted_by_ects` / `average_of_teaching_units`
  - Compensation : `compensation_allowed` + `compensation_scope` (all / teaching_unit_only / none)
  - Decisions : admis/non-admis selon seuil + eliminatoire + compensation
  - Mentions : tri haut->bas des seuils, premiere mention atteinte gagne
  - Stats classe : moyennes min/max/avg par module + moyenne generale + rang
  - **Cas BTS blanc** : config periode "BTS blanc" avec `period_scope=custom`, `custom_period_ids=[id_semestre_1]`, `combination_mode=weighted_average`, `type_weights={controle_continu:0.6, examen_blanc:0.4}` -> agrege automatiquement les CC du S1 + notes BTS blanc selon les ponderations
- **Service client** `/app/src/services/bulletinComputeService.ts` : wrapper `computeBulletins()` qui appelle l'edge function via `supabase.functions.invoke`
- **Integration TranscriptsPanel.tsx** : nouvel `useQuery('computed-bulletins')` qui appelle l'edge function + fallback gracieux client si non deployee. Le tableau d'etudiants ET la modal du bulletin utilisent les valeurs server-side quand disponibles (`general_average`, `mention`, `decision`, `admitted`, `class_general_average`, `class_rank`, `appreciation` par module)
- **Deploiement requis cote prod** : `supabase functions deploy compute-bulletin` (l'environnement preview tombe sur le fallback client tant que la fonction n'est pas deployee)

### Sprint C — Drag-and-drop colonnes + apercu live (DONE - 2026-05-01)
- `BulletinConfigModal.tsx` onglet Structure refondu :
  - Zone "Colonnes affichees" avec drag-and-drop HTML5 natif (draggable + dataTransfer + drop) -> reordering instantane
  - Zone "Colonnes disponibles" avec boutons d'ajout en pointilles
  - Apercu de l'en-tete du tableau en bas : rendu live avec la couleur primaire de la config
  - data-testid `selected-columns-zone`, `selected-column-{key}`, `add-column-{key}`, `remove-column-{key}`

### Sprint D — Watermark + apercu Design live (DONE - 2026-05-01)
- Onglet Design enrichi :
  - Input texte du filigrane revele uniquement quand le switch est ON (data-testid `watermark-text-input`)
  - Zone `design-preview` avec rendu temps reel : titre, badges ADMIS/NON ADMIS/Accent dans les couleurs configurees, filigrane en transparence/rotation, police active

### Nettoyage code legacy (DONE - 2026-05-01)
- **Supprime** : `BulletinConfigurationPanel.tsx` (1496 lignes orphelines), `CompositeBulletinRenderer.tsx` (mort apres deprecation des periodes composites)
- **Purge** dans `TranscriptsPanel.tsx` : tous les useMemo `compositeBlocks` / `compositeTotal` (~120 lignes), branche JSX composite (~50 lignes), import `CompositeBulletinRenderer` -> 1425 -> ~1230 lignes
- Bug TDZ corrige dans `OfficialBulletinTemplate.tsx` : `INK_ = primaryColor || INK_` etait auto-reference, remplace par `|| INK` (constante de fichier)

### Validation testing agent (iteration_40 - 2026-05-01)
- 95% success rate, tous les flows critiques OK :
  - Smoke /home/login/notes-admin
  - Tableau bulletins (colonnes Moyenne/Mention/Decision peuplees correctement : Bernard 10.50 Passable Admis, Dubois 13.00 Assez bien Admis, Petit 14.00 Bien Admis)
  - Modal "Voir" : OfficialBulletinTemplate rendu avec donnees
  - Modal Configuration : 6 onglets accessibles, drag-and-drop colonnes + 5 selected + 6 add OK, apercu Design avec switch filigrane qui revele watermark input
  - Aucune reference cassee aux composants supprimes (grep 0 hit)
  - Edge Function compute-bulletin non deployee dans le preview -> fallback client confirme fonctionnel

## Reste a faire (P1/P2)

### P1
- Onglet 7 "Apercu live" : preview complete du bulletin pendant qu'on edite la config
- Sprint E "Signatures avancees" : upload images signatures + cachet directement dans la modal (actuellement reste sur les signatories existants)
- 5 templates systeme supplementaires (CFA, Master, Licence pro, Ecole de commerce, Ingenieur)
- Pont transcript -> diplome : auto-generation diplome quand decision = "admis"

### P2
- Refactor `BulletinLayoutEditor.tsx` (1598 lignes) et `pdfExportService.ts` (1363 lignes)
- Application des fixes RLS production (`supabase/migrations/20260429120000_secure_rls_drop_legacy_allow_all.sql` -> `supabase db push`)
- N+1 query dans `attendanceService.ts`
- A11y : ajouter `<VisuallyHidden><DialogTitle/></VisuallyHidden>` dans les Dialog sans titre (warning Radix)
- PWA offline pour la saisie des notes

## Session 47 (2026-04-28 / 2026-04-29 / 2026-04-30)

### Audit approfondi de l'application (DONE - 2026-04-28)
- **Document** : `AUDIT_APPROFONDI_2026.md` (complémentaire à `AUDIT_ARCHITECTURE.md` de janvier 2026)
- **Métriques actualisées** : 151 767 lignes TS/TSX (+15%), 52 pages, 44 services, 239 migrations, 859 politiques RLS, 8 fichiers de tests
- **Findings P0 critiques** identifiés :
  - 14 Edge Functions exposées sans vérification d'auth (sur 23 avec `verify_jwt = false`)
  - Régression typage TypeScript : `as any` +57% (291 → 457)
  - 3 nouveaux composants monolithes (BulletinLayoutEditor 1598L, BulletinConfigurationPanel 1496L, pdfExportService 1363L)
- **Améliorations détectées depuis janvier 2026** :
  - CSP, HSTS, Permissions-Policy ajoutés à `vercel.json`
  - Vitest installé + 8 fichiers de tests
  - Aucune politique RLS `USING (true)` dans les migrations actuelles
- Score de maturité global : **3.1/5** (vs 3.0 en janvier)

### P0 — Sécurisation des 14 Edge Functions exposées (DONE - 2026-04-28)
- **Module shared créé** : `supabase/functions/_shared/auth.ts` avec helpers `requireAuthenticatedUser`, `requireSuperAdmin`, `requireEstablishmentAdmin`, `requireCronSecret`, `requireAuthOrCron`, `authErrorResponse`, `createSupabaseAdmin`
- **9 Edge Functions sécurisées** :
  - **SuperAdmin only** : `cleanup-auth-users` (suppression de comptes), `blog-ai` (coût IA), `linkedin-oauth` (token OAuth)
  - **Cron only** : `manage-attendance-timing`, `check-expired-attendance-links`, `process-scheduled-messages`
  - **Auth user OR cron** : `generate-attendance-sheets`, `send-notification-emails`, `content-autopilot` (avec check SuperAdmin pour les calls UI)
- **5 fonctions identifiées comme légitimement publiques** (pas de modification) : `accept-invitation`, `activate-user-account`, `validate-activation-token`, `create-establishment` (rate-limited DB-side), `send-contact-form`
- **Guide de déploiement complet** : `SECURITY_DEPLOYMENT_GUIDE.md` avec étapes pour générer/configurer `CRON_SECRET`, mettre à jour `pg_cron`, tester avec curl, checklist mise en production
- **Validation syntaxe** : toutes les fonctions modifiées ont braces/parens équilibrés ✓
- **À FAIRE côté production** :
  1. Générer `CRON_SECRET` (`openssl rand -base64 48`)
  2. `supabase secrets set CRON_SECRET=...`
  3. Mettre à jour les jobs `pg_cron` pour envoyer le header `x-cron-secret`
  4. Déployer les fonctions modifiées (`supabase functions deploy --all`)
  5. Tester les flux critiques (signature étudiante, génération feuilles, blog AI, etc.)

### P0 #2 — Audit RLS approfondi (DONE - 2026-04-29)
- **Méthodologie** : parsing automatique des 239 migrations SQL pour détecter les politiques `USING (true)` créées vs droppées
- **Découverte** : **30 politiques `USING (true)` probablement encore actives** en production sur des tables critiques (formations, attendance_sheets, schedules, etc.)
- **4 tables CRITIQUES sans aucune autre politique restrictive** : `formations`, `formation_modules`, `schedules`, `schedule_slots` → blocage si DROP simple
- **Livrables** :
  - `scripts/audit-rls-policies.sql` — script SQL d'audit READ-ONLY à exécuter en production (5 sections : USING(true), Allow all, tables sans restriction, RLS désactivé, récap général)
  - `supabase/migrations/20260429120000_secure_rls_drop_legacy_allow_all.sql` — migration idempotente qui (1) crée des politiques restrictives sur les 4 tables critiques basées sur `establishment_id` + RPC `is_current_user_admin()` (2) DROP IF EXISTS sur les 25 politiques "Allow all for development"
  - `RLS_AUDIT_REPORT.md` — rapport détaillé avec impact par table, procédure de déploiement, plan de rollback
- **À FAIRE côté production** :
  1. Exécuter `scripts/audit-rls-policies.sql` dans Supabase SQL Editor pour confirmer l'état réel
  2. Tester la migration en staging si dispo
  3. Pousser : `supabase db push` (ou via Dashboard)
  4. Re-exécuter le script d'audit pour vérifier 0 politique "Allow all"
  5. Tester les flux : login, formations, émargement, signature, EDT

### Setup environnement de développement (DONE - 2026-04-29)
- `npm install --legacy-peer-deps` (1043 packages installés à la racine `/app`)
- Création du `.env` racine avec `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`
- Application accessible : https://audit-complete-12.preview.emergentagent.com

### Bug ESBuild scan-deps sur StudentCardView.tsx (DONE - 2026-04-29)
- **Symptôme** : "Unterminated regular expression" au scan d'esbuild → tous les pre-bundles deps en 504 → page blanche
- **Cause racine** : combinaison d'un `</div>` orphelin + apostrophes dans le texte JSX (`CARTE D'ETUDIANT`, `l'etablissement`) qui perturbaient le scanner d'esbuild dans certaines conditions
- **Fix** : refactor du composant pour extraire toutes les chaînes en constantes (objet `L` au début du fichier), suppression du `</div>` orphelin
- **État** : Vite démarre proprement (`ready in 246ms`), 0 erreur ESBuild, screenshot landing OK


### Système de configuration flexible des bulletins (DONE - 2026-05-01)
**Objectif** : permettre à chaque école (BTS, Licence, CFA…) de configurer ses propres règles de bulletin avec hiérarchie établissement → formation → période + cas BTS blanc natif.

**Architecture** :
- **Migration** `20260501000000_bulletin_configurations.sql` : nouvelle table `bulletin_configurations` avec 7 blocs JSONB (sources, calculs, layout, design, texts, signatures, decisions) + fonction `resolve_bulletin_config(period_id)` qui merge en cascade (template → établissement → formation → période) + RLS complet + seed de 2 templates système ("BTS France" et "Licence universitaire ECTS")
- **Types** `src/types/bulletinConfig.ts` : toutes les interfaces (SourcesConfig, CalculationRules, LayoutConfig, DesignConfig, TextConfig, SignaturesConfig, DecisionRules) + `DEFAULT_CONFIG` fallback
- **Service** `src/services/bulletinConfigService.ts` : `resolveConfigForPeriod(periodId)`, `upsertConfig(scope, patch)`, `cloneTemplateToScope`, `pickAppreciationForGrade`, `pickMentionForAverage`, `pickDecisionForAverage`

**UI de configuration** :
- Nouveau composant `src/components/grades/BulletinConfigModal.tsx` (~550 lignes) — modal 6 onglets :
  1. 🎯 **Sources** : choix des types d'évaluations inclus + poids + mode combinaison (weighted_average / replacement / max / min) + portée périodes (current / all_up_to_current / custom)
  2. 🧮 **Calculs** : moyenne module + moyenne générale + compensation + seuil rattrapage auto + note éliminatoire + barème + décimales
  3. 📋 **Structure** : sections affichées (10 sections cochables) + colonnes du tableau (11 colonnes, ordre = ordre de sélection) + regroupement UE
  4. 🎨 **Design** : 4 color pickers + police (6 choix) + format (A4/A3/Letter) + orientation + filigrane + QR code
  5. ✍️ **Textes** : titre principal + mentions légales + éditeur de tranches d'appréciation (add/edit/delete) + seuil admission + labels ADMIS/NON ADMIS + mentions (Passable/AB/B/TB)
  6. ✒️ **Signatures** : éditeur de signataires (rôle, ordre, obligatoire) + cachet on/off
- **Raccourci templates** : bouton pour appliquer instantanément un template système (BTS France / Licence) qui pré-remplit tous les onglets

**Intégration** :
- Onglet **⚙ Configuration** ajouté dans `Notes.tsx` (à côté de Bulletin, admin uniquement) — son clic ouvre automatiquement le modal puis revient à "Bulletin"
- `TranscriptsPanel.tsx` charge la config résolue via `resolveConfigForPeriod` dans un `useQuery` et la passe au `OfficialBulletinTemplate` en tant que props (title, couleurs, police, appréciations, décisions)
- `OfficialBulletinTemplate.tsx` étendu avec props config-aware : `mainTitle`, `legalNotice`, `decisionLabel`, `primaryColor`, `accentColor`, `successColor`, `errorColor`, `fontFamily`, `sectionsEnabled` → rendu adapté dynamiquement (sections masquables : `header`, `legal_notice`)

**Cas BTS blanc** : l'admin école BTS peut créer une config pour la période "BTS blanc" qui combine CC (60%) + BTS blanc (40%) en moyenne pondérée, avec titre personnalisé "BULLETIN BTS BLANC — Simulation" — la config est appliquée automatiquement quand l'étudiant consulte son bulletin de cette période.

**Reste à faire (itérations suivantes)** :
- Edge Function `compute-bulletin` pour centraliser les calculs serveur-side (actuellement calculs côté client)
- Uploads de signatures/cachet (actuellement en base64 via signatories existants)
- Onglet 7 "Aperçu live" avec preview en temps réel dans le modal
- 5 autres templates système (CFA, École de commerce, Master, etc.)
- Drag-drop pour réordonner les colonnes du tableau (actuellement ordre = ordre de sélection)


### Nettoyage composite + fix bug runtime (DONE - 2026-04-30)
- **`CreateCompositePeriodModal.tsx`** supprimé (496 lignes, orphelin après refactor précédent)
- **Bug runtime corrigé** : `setState` dans `queryFn` du `useQuery` de CreatePeriodModal → refactoré en pattern `useQuery + useEffect` propre
- **Bug `Pencil is not defined`** : import manquant dans Notes.tsx après restauration git → ajouté à l'import lucide-react
- **Logique `isComposite` neutralisée** :
  - `GradeSheetView.tsx` : `isComposite` forcé à `false`, `activePeriodIds` simplifié à `[periodId]`
  - `TranscriptsPanel.tsx` : 4 `useMemo` simplifiés, `currentCompositePeriod = null`, `compositeConfig = null` → branche `CompositeBulletinRenderer` inactive, badges UI "★ Bulletin combiné" retirés
- Sécurité : périodes composites existantes en DB rendues comme des périodes normales (pas de crash)

### Redesign bulletin — format officiel école supérieure française (DONE - 2026-04-30)
- **Nouveau composant** `OfficialBulletinTemplate.tsx` (~380 lignes) conforme aux standards français :
  - **En-tête** : logo + nom + adresse établissement (gauche) | BULLETIN DE NOTES + Semestre X + Année (droite)
  - **Identité étudiant** 2 colonnes : Nom/prénom + Matricule + Né(e) le | Formation + Niveau + Année
  - **Corps** : tableau 4 colonnes (Matière/Module avec formateurs en italique | Moyenne /20 | Coef. | Appréciation) + ligne total MOYENNE GÉNÉRALE
  - **Pied** 3 colonnes : Assiduité (absences/retards/justifiées) | Décision (ADMIS/NON ADMIS en grand, vert/rouge) | Appréciation générale
  - **Signatures & cachet** : grid adaptatif 1-4 colonnes
  - Style Times New Roman, bordures noires, structure sobre format officiel
- **3 queries ajoutées** dans TranscriptsPanel : `module-instructors-for-bulletin`, `student-extras-for-bulletin` (DOB + matricule), `absence-stats-for-bulletin`
- **Bloc de rendu monolithique (~395 lignes)** remplacé par `<OfficialBulletinTemplate data={...} />`
- TranscriptsPanel.tsx : 1696 → **1351 lignes** (-345 lignes, -20%)
- Compilation OK, 0 erreur Vite, HMR fonctionnel



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
ndu raye + tag ANNULE, 5 jours conges verts avec tag EVENEMENT, custom event non-allday avec horaires 10:00-16:00.

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
