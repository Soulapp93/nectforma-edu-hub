# PRD - Nectforma

## Plateforme
ERP Education - Gestion academique (React + Vite + TypeScript + Supabase)

## Session 38 - Signatures Publiques, Email, Fix Performance (2026-04-16)
- **Phase 3 Signatures Publiques completee**:
  - `SignatureRequestPanel.tsx` integre dans l'onglet Bulletin de notes
  - `signatureService.ts` : CRUD complet pour table `signature_requests`
  - `SignPage.tsx` : page publique `/sign/:token` avec canvas de signature (dessin souris/tactile)
  - Route `/sign/:token` rendue publique dans `App.tsx` (fix routing)
  - Table Supabase `signature_requests` avec RLS (admin manage, public read/sign par token)
  - Types TypeScript Supabase mis a jour pour `signature_requests`
- **Notification Email automatique (Brevo)**:
  - `emailNotificationService.notifySignatureRequest()` : template HTML personnalise avec couleurs Nectforma
  - Email auto-envoye a la creation d'une demande de signature
  - Bouton "Renvoyer l'email" (icone Mail) pour les demandes en attente
  - Gestion gracieuse des erreurs (fallback toast si email echoue)
  - Dialog mis a jour avec message mentionnant l'envoi automatique par email
- **Fix Performance GradeSheetView.tsx**:
  - Corrige "Maximum update depth exceeded" en stabilisant les references useQuery avec `useMemo`
  - Remplace `= []` inline par `useMemo(() => rawData ?? [], [rawData])` pour modules, periods, students, evaluations, grades
  - Navigation S1/S2 sans warnings
- Testing: iteration_25 (95%), iteration_26 (100%)

## Session 37 - Phase 2 Bulletin Modulable Drag & Drop (2026-04-15)
- **TranscriptTemplateEditor reecrit** avec:
  - Layout split: editeur gauche + apercu live droite
  - 4 onglets: Sections, Colonnes, En-tete, Style
  - **Drag & drop HTML5** pour reorganiser les sections
  - Fleches haut/bas comme alternative au drag
  - **Apercu live**: genere HTML du bulletin en temps reel
  - Colonnes CC et Exam toggleables par checkboxes
  - Couleur personnalisable via color picker + presets
  - En-tete/pied de page configurables (logo, titre, signatures, texte)
  - Bouton Sauvegarder persistant dans Supabase
- **Bouton 'Personnaliser le modele'** ajoute dans TranscriptsPanel
- Testing: 7/7 passes (iteration_24, 100%)

## All Completed - [x]
- Supabase Realtime fix
- Pre-deployment blockers (rate limits, schema, RLS)
- Auto-generation Promotions/Schedules/Textbooks
- File Visualization (FilePreviewTooltip, WhatsApp-like chat previews)
- Native PDF Fullscreen (embed tag)
- Hub deep-linking (formationId via URL params)
- Independent Grading Periods (PeriodSelector)
- Module Coefficients
- Drag & Drop Transcript Template Editor
- Public Signatures for Bulletins (Phase 3)
- Email notification automatique pour signatures (Brevo)
- GradeSheetView performance fix

## P1 - [ ] Deploiement production
## P2 - [ ] Refactoring TranscriptsPanel.tsx (>1400 lignes)
## P2 - [ ] Pagination N+1 sur pages hub
