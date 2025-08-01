# Pantin Animateur

Ce projet permet d'animer un pantin SVG directement dans le navigateur. Il est compose d'un fichier HTML minimal et de plusieurs modules JavaScript.

## Fonctionnement general

1. **index.html** contient un conteneur `#pantin` dans lequel `svgLoader.js` insère le fichier `manu.svg` puis charge le script principal `src/main.js`.
2. **svgLoader.js** importe le SVG, reparent certains elements pour obtenir une structure coherente et calcule les points pivots utilises pour les rotations.
3. **timeline.js** gere une liste de *frames*. Chaque frame enregistre la rotation de chaque membre du pantin. Il est possible d'ajouter, supprimer ou lire les frames.
4. **interactions.js** permet de faire tourner chaque membre à la souris et gère le déplacement du pantin. La rotation et la mise à l'échelle se font désormais via des sliders dans l'UI.
5. **ui.js** affiche une interface avec boutons (lecture, ajout de frame, import/export) ainsi que deux sliders pour la rotation et l'échelle. Toutes ces actions sont synchronisées avec la timeline.

Lors du chargement, `main.js` instancie la timeline, branche les interactions et applique la frame courante sur le SVG. L'etat de l'animation est sauvegarde automatiquement dans `localStorage` apres chaque modification et recharge au demarrage si present.

## Ameliorations apportees

- Lecture de l'animation a partir de la frame courante plutot que depuis le debut.
- Sauvegarde automatique de la timeline dans `localStorage` et rechargement a l'ouverture de la page.

## Lancer le projet

Ouvrez simplement `index.html` dans un navigateur moderne. Toutes les dependances sont embarquees.

