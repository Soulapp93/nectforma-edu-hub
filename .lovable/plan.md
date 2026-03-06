
Objectif: corriger définitivement le décalage des cartes en vue jour (tuteur + autres interfaces) pour que chaque carte respecte exactement l’heure de début et de fin.

1) Diagnostic précis (pourquoi c’est encore faux)
- La grille horaire est en `rem` via `h-20` (5rem).
- Les cartes sont positionnées en **pixels fixes** avec `HOUR_HEIGHT = 80`.
- Or votre app force `html { font-size: 12px }` sur desktop (`src/index.css`), donc:
  - 1 heure de grille = 5rem = 60px
  - 1 heure de carte = 80px
  - => cartes ~33% trop hautes (exactement ce qu’on voit sur votre capture).
- Le patch précédent (minHeight 60 -> 20) ne corrige pas cette cause racine.
- Le même problème existe aussi dans `src/components/administration/ScheduleDayView.tsx` (même logique en 80px), donc incohérence selon écrans/rôles.

2) Plan de correction (hotfix production, faible risque)
- Corriger `src/components/schedule/DayView.tsx`:
  - Supprimer le calcul vertical en px fixes.
  - Utiliser une échelle unique basée sur la même unité que la grille (`rem`) ou en `%` du conteneur.
  - Aligner les hauteurs de lignes et le calcul `top/height` sur la même constante.
  - Supprimer la distorsion artificielle (`minHeight` trop agressif) qui casse la précision des petits créneaux.
- Corriger `src/components/administration/ScheduleDayView.tsx` de la même manière pour éviter un bug “corrigé ici mais pas ailleurs”.
- Garder les textes compactés pour créneaux courts (si besoin), mais sans changer la hauteur réelle du créneau.

3) Détails techniques (implémentation)
- Remplacer:
  - `HOUR_HEIGHT = 80` (px)
  - `h-20` implicite non synchronisé
- Par une source unique (exemple):
  - `const HOUR_HEIGHT_REM = 5;`
  - `topRem = ((start - base) / 60) * HOUR_HEIGHT_REM`
  - `heightRem = ((end - start) / 60) * HOUR_HEIGHT_REM`
  - styles: `top: ${topRem}rem`, `height: ${heightRem}rem`
- Ou alternative robuste:
  - calculer `top`/`height` en `%` de la plage horaire visible.
- Ajouter garde-fou:
  - si `end <= start`, ne pas casser l’affichage (normalisation + log debug).

4) Vérification ciblée (avant mise en prod)
- Cas réel de votre capture:
  - `08:00 → 14:00` doit commencer exactement sur la ligne 08:00 et finir exactement sur 14:00.
- Cas 30 min:
  - ex. `10:00 → 10:30` doit occuper exactement une demi-case.
- Vérifier sur compte tuteur ET interface administration (même rendu temporel).

5) Fichiers concernés
- `src/components/schedule/DayView.tsx`
- `src/components/administration/ScheduleDayView.tsx`

Résultat attendu:
- Plus de carte “étirée” artificiellement.
- Synchronisation parfaite entre horaires affichés et position visuelle des créneaux.
- Comportement cohérent sur toutes les interfaces/rôles.
