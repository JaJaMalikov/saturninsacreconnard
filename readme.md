**MACRON‑O‑TRON 3000**

**Vue d'ensemble**\
Le **MACRON‑O‑TRON 3000** est une application web interactive permettant de créer et d'animer des marionnettes SVG directement dans votre navigateur. Conçue pour offrir une expérience fluide, elle propose un ensemble d’outils pour la manipulation et l’animation de fichiers vectoriels.

## Fonctionnalités

- **Animation SVG** : Chargement et manipulation de fichiers SVG, avec contrôle précis de chaque segment.
- **Timeline Avancée** : Gestion des images clés (keyframes) via une timeline interactive, supportant l’ajout, la suppression et la navigation entre les frames.
- **Transformations Globales** : Positionnement, rotation et mise à l’échelle de la marionnette dans son ensemble.
- **Onion Skinning** : Affichage en transparence des images précédentes et suivantes pour un ajustement fin.
- **Contrôle de la Vitesse** : Réglage du nombre d’images par seconde (FPS) pour moduler la fluidité.
- **Persistance des Données** : Sauvegarde automatique des projets localement dans le navigateur.
- **Import/Export JSON** : Exportation et importation des animations au format JSON.
- **Interface Moderne** : UI épurée avec panneau d’inspection rétractable.

## Structure du projet

- **index.html** : Point d’entrée de l’interface React (v2).
- **index-legacy.html** : Ancienne interface HTML/JS.
- **style.css** : Feuille de style principale.
- **src/** :
  - `main.js` : Initialisation et orchestration des modules.
  - `svgLoader.js` : Chargement et découpe des éléments SVG.
  - `timeline.js` : Gestion de la timeline et des frames.
  - `interactions.js` : Gestion des interactions utilisateur.
  - `ui.js` : Liaison des éléments HTML et JavaScript.
  - `onionSkin.js` : Logique de l’onion skinning.
- **src-v2/** : Code source de la nouvelle interface (React + Vite).

## Installation et exécution

1. Clonez le dépôt :
   ```bash
   git clone https://.../MACRON-O-TRON-3000.git
   cd MACRON-O-TRON-3000
   ```
2. Lancez un serveur HTTP local (ex. Python) :
   ```bash
   python -m http.server
   ```
3. Pour l'interface classique, ouvrez `http://localhost:8000/index-legacy.html` dans votre navigateur.
4. Pour la version React, installez les dépendances et lancez Vite :
   ```bash
   cd src-v2
   pnpm install
   pnpm run dev
   ```

## Lancement

- Interface classique : `http://localhost:8000/index-legacy.html`
- Interface React (développement) : `cd src-v2 && pnpm run dev`

## 📄 Licence

[The Unlicense](https://unlicense.org/) — libre de droit, libre d’usage, libre d’esprit ✊

---
