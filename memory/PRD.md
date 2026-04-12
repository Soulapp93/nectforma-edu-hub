# PRD - Nectforma

## Application Overview
- **Name:** Nectforma - SaaS multi-tenant pour centres de formation
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (BaaS) + Capacitor

## Session 25 - Fix Viewers Excel + PDF (2026-04-12)
- **NativeExcelViewer reecrit**: sheet_to_html() de SheetJS pour rendu natif
  - Conserve structure, fusions, donnees telles quelles
  - Onglets feuilles style Excel (fond gris, actif blanc, bordure verte)
  - Barre de statut verte (#217346) comme Excel
  - Recherche avec surlignage orange
  - CSS Calibri, bordures fines, table responsive
- **PDFThumbnailNav simplifie**: Plus de Document par vignette (causait lag extreme)
  - Vignettes numerotees simples, fond sombre, selection bleue
  - Navigation par clic fonctionne
- **ProductionFileViewer fixes**:
  - Plein ecran CSS (toggle state) au lieu API native (ne fonctionne pas en iframe)
  - Navigation PDF toujours visible (removed hidden sm:flex)
  - Bouton X ferme le plein ecran au lieu de quitter
- Testing: 12/12 passes (iteration_11)

## All Completed Tasks
- [x] Audit, tests, RLS, comptes demo, sidebar, mobile
- [x] Zoom E2E, notifications, reminders
- [x] Refactoring + CI
- [x] Dossiers administratifs + Export PDF
- [x] Bug fix Realtime, creation etablissement/formation/upload
- [x] Promotions automatiques
- [x] Preview fichiers universel + tooltip hover
- [x] Chat WhatsApp-like
- [x] Viewers natifs Excel + PDF scroll continu
- [x] Fix viewers Excel (sheet_to_html) + PDF (navigation, fullscreen, thumbnails)

## P1
- [ ] Deploiement production

## P2-P3
- [ ] TypeScript strict
- [ ] Refactoring TranscriptsPanel.tsx
- [ ] N+1 patterns, pagination
