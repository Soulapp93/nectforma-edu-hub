# Roadmap TypeScript Strict

## État actuel (post-audit mai 2026)

Options activées progressivement :
- `noFallthroughCasesInSwitch: true` ✅ activé
- `noImplicitReturns: true` ✅ activé
- `noImplicitAny: false` — à activer (étape 2)
- `strictNullChecks: false` — à activer (étape 3)
- `strict: false` — objectif final (étape 4)

## Étapes

### Étape 1 — Faite ✅
Activer les options de détection de bugs non-breaking.

### Étape 2 — noImplicitAny
1. Activer `noImplicitAny: true` dans tsconfig.app.json
2. Lancer `npx tsc --noEmit` pour voir les erreurs
3. Remplacer les `as any` par des types explicites, en commençant par :
   - `src/services/` (≈ 200 cas)
   - `src/hooks/` (≈ 80 cas)
4. Utiliser les types auto-générés dans `src/integrations/supabase/types.ts`

### Étape 3 — strictNullChecks
1. Activer `strictNullChecks: true`
2. Ajouter les guards `if (!data) return` manquants
3. Utiliser l'opérateur `?.` et `??` systématiquement

### Étape 4 — strict complet
1. Passer `strict: true` (active strictNullChecks + noImplicitAny + autres)
2. Corriger les dernières erreurs

## Commandes utiles

```bash
# Voir toutes les erreurs TypeScript actuelles
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l

# Erreurs par fichier
npx tsc --noEmit 2>&1 | grep "error TS" | sed 's/(.*$//' | sort | uniq -c | sort -rn | head -20

# Compter les 'as any' restants
grep -rn "as any" src/ --include="*.ts" --include="*.tsx" | wc -l
```
