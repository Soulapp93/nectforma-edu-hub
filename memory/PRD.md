# PRD - Nectforma

## Application Overview
- **Name:** Nectforma - SaaS multi-tenant pour centres de formation
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (BaaS) + Capacitor

## Session 24 - Viewers Natifs Excel + PDF Scroll Continu (2026-04-12)
- **NativeExcelViewer**: Parsing natif SheetJS (xlsx) cote client, remplace Office Online
  - Conservation formatage: couleurs, bordures, gras, italique, fusion cellules, largeurs colonnes
  - Onglets feuilles, numeros lignes, lettres colonnes (A,B,C...)
  - Recherche avec surlignage jaune, barre de statut
- **PDFViewerPro reecrit**: Scroll continu toutes pages (style Edge)
  - Numero de page overlay en bas droite de chaque page
  - Tracking scroll pour mettre a jour la page courante
  - Fix CDN worker pdf.js: cdnjs -> unpkg (version 5.4.296 manquante sur cdnjs)
- **ProductionFileViewer**: Type 'excel' (xls,xlsx,csv) route vers NativeExcelViewer
- Testing: 100% passes (iteration_10)

## All P0 Tasks - DONE
- [x] Audit, tests, RLS, comptes demo, sidebar, mobile
- [x] Zoom E2E, notifications, reminders
- [x] Refactoring + CI
- [x] Dossiers administratifs + Export PDF
- [x] Bug fix Realtime, creation etablissement/formation/upload
- [x] Promotions automatiques
- [x] Preview fichiers universel + tooltip hover
- [x] Chat WhatsApp-like
- [x] Viewers natifs Excel (SheetJS) + PDF scroll continu (Edge-like)

## P1
- [ ] Deploiement production

## P2-P3
- [ ] TypeScript strict
- [ ] Refactoring TranscriptsPanel.tsx
- [ ] N+1 patterns, pagination
