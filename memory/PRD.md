# PRD - Nectforma

## Application Overview
- **Name:** Nectforma - SaaS multi-tenant pour centres de formation
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (BaaS) + Capacitor

## Session 26 - Refonte Viewers Excel + PDF (2026-04-13)
- **Excel -> Office Online**: xls/xlsx routes vers iframe Office Online (meme que doc/ppt)
  - Rendu fidele au format original (couleurs, images, fusions, graphiques)
  - Bouton "Ouvrir dans un nouvel onglet" et "Changer de viewer" (Google Docs fallback)
- **PDF -> Embed natif navigateur**: utilise `<embed type="application/pdf">` avec `#toolbar=1&navpanes=1`
  - Scroll natif Chrome/Edge (fluide, rapide)
  - Toolbar integree: zoom, pages, miniatures, recherche, impression, telechargement
  - Plus de react-pdf ni PDFViewerPro ni PDFThumbnailNav - tout gere par le navigateur
- **Plein ecran 100%**: pour PDF/Office le header disparait completement (class hidden)
  - Echap ou bouton Minimize pour sortir
  - Images: header slide vers le haut avec auto-hide
- **Fix loading overlay**: timeout 2s pour embed PDF car onLoad pas fiable
- Testing: 9/9 passes (iteration_12)

## All Completed
- [x] Audit, tests, RLS, comptes demo, sidebar, mobile
- [x] Zoom E2E, notifications, reminders, refactoring, CI
- [x] Dossiers administratifs + Export PDF
- [x] Bug fixes (Realtime, creation etablissement/formation/upload)
- [x] Promotions automatiques
- [x] Preview fichiers + tooltip + chat WhatsApp-like
- [x] Viewers: Excel Office Online, PDF embed natif, plein ecran 100%

## P1 - [ ] Deploiement production
## P2 - [ ] TypeScript strict, Refactoring TranscriptsPanel, N+1/pagination
