

## Plan: Reproduire exactement le design PCA PREAD pour Nectforma

### Analyse du screenshot de reference

Le design PCA PREAD montre :
- **Sidebar** : Gradient navy profond vers indigo/violet fonce, avec une lueur subtile en haut
- **Menu actif** : Style **outline/bordure** arrondie (pilule) avec un fond semi-transparent et un chevron ">" a droite - PAS un fond solide jaune
- **Menu inactif** : Texte blanc/gris avec icones, espacement genereux
- **Profil utilisateur** : Avatar rond avec nom en gras, statut "En ligne" avec pastille verte, chevron ">" a droite
- **Section support** : Carte "Besoin d'aide ?" avec boutons "Aide" et casque en bas de sidebar
- **Deconnexion** : Tout en bas avec icone
- **Couleur secondaire** : Le screenshot utilise du bleu clair/cyan pour les outlines actifs

### Remplacement de la couleur jaune

Le jaune/or sera remplace par un **bleu ciel/cyan** (`210 90% 60%`) qui s'harmonise avec le navy et correspond au style du screenshot.

### Modifications prevues

#### 1. `src/index.css` - Variables CSS
- Remplacer `--accent: 45 95% 55%` (jaune) par `--accent: 210 90% 60%` (bleu ciel/cyan)
- Ajuster `--accent-foreground` pour le contraste
- Mettre a jour `--sidebar-accent` de la meme maniere

#### 2. `src/components/Sidebar.tsx` - Reproduire le design exact
- **Menu actif** : Passer d'un fond solide jaune a un style **outline** avec bordure blanche/cyan semi-transparente, fond `white/10`, et chevron ">" a droite (exactement comme le screenshot)
- **Profil utilisateur** : Ajouter un chevron ">" a droite du nom, style plus epure
- **Section "Besoin d'aide ?"** : Ajouter une carte en bas de la sidebar avec texte "Besoin d'aide ? Contactez le support" et boutons "Aide" + casque (exactement comme le screenshot)
- **Sous-menus** : Items avec chevron ">" pour les expandables (comme "Mes derniers sejours", "Mon compte" dans le screenshot)
- **Espacement** : Augmenter le padding vertical des items pour correspondre au screenshot

#### 3. Style des elements de menu
```text
┌──────────────────────────┐
│ [icon] Accueil        >  │  ← Menu actif: bordure arrondie, fond semi-transparent
└──────────────────────────┘
  [icon] Mes documents       ← Menu inactif: texte blanc/70, pas de fond
  [icon] Mes derniers     >  ← Expandable: chevron droite
         sejours
```

### Fichiers modifies
- `src/index.css` (couleur accent)
- `src/components/Sidebar.tsx` (design complet de la sidebar)

### Ce qui ne change PAS
- Logo Nectforma (conserve)
- Navigation et routes (conservees)
- Logique metier (conservee)
- Police Plus Jakarta Sans (conservee)

