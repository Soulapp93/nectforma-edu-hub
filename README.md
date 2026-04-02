# NECTFORMA - Plateforme de gestion éducative

Plateforme tout-en-un de gestion de centres de formation (formations, émargements, emploi du temps, messagerie, notes, finance, RH).

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite
- **UI** : Tailwind CSS + Shadcn/UI
- **Backend** : Supabase (PostgreSQL + Auth + Edge Functions)
- **Mobile** : Capacitor (iOS / Android)
- **Déploiement** : nectforma.com

## Démarrage local

```sh
# 1. Cloner le repo
git clone https://github.com/Soulapp93/NECTFORMA-PROJET-APP.git
cd NECTFORMA-PROJET-APP

# 2. Installer les dépendances
npm install --legacy-peer-deps

# 3. Configurer les variables d'environnement
cp .env.example .env
# Remplir les valeurs dans .env

# 4. Lancer le serveur de développement
npm run dev
# → http://localhost:8080
```

## Variables d'environnement

Copier `.env.example` en `.env` et renseigner :

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé anon publique Supabase |
| `VITE_SUPABASE_PROJECT_ID` | ID du projet Supabase |
| `VITE_GA_MEASUREMENT_ID` | ID Google Analytics (optionnel) |

## Build production

```sh
npm run build
# Les fichiers sont générés dans dist/
```

## Déploiement

Le site est déployé sur **nectforma.com** via Netlify.
Tout push sur la branche `main` déclenche un déploiement automatique.
