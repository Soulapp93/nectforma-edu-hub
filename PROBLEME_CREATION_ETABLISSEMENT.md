# Problème: Impossible de créer un compte établissement

## 🔍 Diagnostic

### Erreur identifiée
```
"Erreur création établissement: duplicate key value violates unique constraint 'idx_unique_establishment_group'"
```

### Cause racine
Le trigger `auto_create_establishment_group()` dans la base de données essaie de créer automatiquement un groupe de chat pour chaque nouvel établissement. Cependant, ce trigger ne vérifie pas si un groupe existe déjà avant de tenter l'insertion, ce qui cause une violation de contrainte d'unicité.

### Contrainte concernée
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_establishment_group 
ON public.chat_groups (establishment_id) 
WHERE group_type = 'establishment';
```

Cette contrainte garantit qu'il ne peut y avoir qu'un seul groupe de type 'establishment' par établissement.

## ✅ Solution implémentée

### Migration créée
Fichier: `supabase/migrations/20260408160000_fix_establishment_group_duplicate.sql`

### Changements
La fonction `auto_create_establishment_group()` a été modifiée pour:
1. **Vérifier d'abord** si un groupe existe déjà pour l'établissement
2. **Créer le groupe** seulement s'il n'existe pas
3. **Ne pas échouer** si le groupe existe déjà

### Code corrigé
```sql
CREATE OR REPLACE FUNCTION public.auto_create_establishment_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier si le groupe existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_groups 
    WHERE establishment_id = NEW.id AND group_type = 'establishment'
  ) THEN
    -- Créer le groupe seulement s'il n'existe pas
    INSERT INTO public.chat_groups (establishment_id, name, group_type, description, is_private)
    VALUES (NEW.id, 'Général', 'establishment', 'Groupe de discussion de l''établissement', false);
  END IF;
  
  RETURN NEW;
END;
$$;
```

## 📋 Actions requises

### 1. Appliquer la migration à Supabase

Vous avez plusieurs options:

#### Option A: Via le Dashboard Supabase (Recommandé)
1. Connectez-vous à [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet: `dlitdjbmqpsdmhrbluak`
3. Allez dans **SQL Editor**
4. Copiez-collez le contenu de la migration:
   ```bash
   cat supabase/migrations/20260408160000_fix_establishment_group_duplicate.sql
   ```
5. Exécutez la requête

#### Option B: Via Supabase CLI (Si configuré localement)
```bash
# Depuis le répertoire du projet
supabase db push
```

#### Option C: Via l'API Migration
Si vous avez configuré les migrations automatiques, elles seront appliquées au prochain déploiement.

### 2. Nettoyer les données de test (Optionnel)

Si vous avez des établissements de test créés lors des erreurs précédentes:

```sql
-- Supprimer les établissements de test sans utilisateurs associés
DELETE FROM establishments 
WHERE name LIKE '%Test%' 
AND id NOT IN (SELECT DISTINCT establishment_id FROM users WHERE establishment_id IS NOT NULL);

-- Supprimer les groupes orphelins
DELETE FROM chat_groups 
WHERE establishment_id NOT IN (SELECT id FROM establishments);
```

### 3. Tester la création d'établissement

Après avoir appliqué la migration:

1. Allez sur [l'URL de l'application](https://8080-ipdqsg8mbhsmizobwbbav-ea026bf9.sandbox.novita.ai)
2. Cliquez sur **"Créer un établissement"**
3. Remplissez le formulaire en 2 étapes:
   - **Étape 1**: Informations de l'établissement
   - **Étape 2**: Compte administrateur
4. Soumettez le formulaire

La création devrait maintenant fonctionner correctement!

## 🧪 Test de validation

Vous pouvez tester la fonction Edge directement avec curl:

```bash
curl -X POST "https://dlitdjbmqpsdmhrbluak.supabase.co/functions/v1/create-establishment" \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "establishment": {
      "name": "Mon Centre de Formation",
      "type": "Organisme de formation",
      "email": "contact@moncentre.fr",
      "address": "123 Rue de la Formation, 75001 Paris"
    },
    "admin": {
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "admin@moncentre.fr",
      "password": "SecurePass123!"
    }
  }'
```

Réponse attendue (succès):
```json
{
  "success": true,
  "establishmentId": "...",
  "userId": "...",
  "message": "Compte établissement créé avec succès"
}
```

## 📊 Flux de création d'établissement

```
Utilisateur remplit formulaire
         ↓
Frontend envoie à Supabase Edge Function
         ↓
Edge Function: create-establishment
         ↓
1. Validation des données
2. Rate limiting check
3. Création établissement → TRIGGER auto_create_establishment_group
4. Création compte auth
5. Création profil utilisateur AdminPrincipal
6. Ajout admin au groupe chat
         ↓
Auto-login et redirection /dashboard
```

## 🔧 Maintenance future

### Prévention
- Le fix appliqué rend le système résilient aux duplications
- Les créations futures ne devraient plus échouer sur cette contrainte

### Monitoring
Surveillez les logs Supabase pour:
- Erreurs de création d'établissement
- Violations de contraintes
- Tentatives de création par IP (rate limiting)

### Améliorations possibles
1. **Ajouter un email de bienvenue** après création réussie
2. **Créer un tutoriel de démarrage** pour nouveaux établissements
3. **Ajouter des métriques** de suivi de création d'établissements
