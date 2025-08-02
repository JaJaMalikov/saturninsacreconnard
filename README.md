# Pantin Animateur

![Pantin Animateur Screenshot](screenshot.png) <!-- Placeholder for a future screenshot -->

## 🚀 Vue d'ensemble

**Pantin Animateur** est une application web interactive conçue pour animer des personnages SVG directement dans votre navigateur. Transformez des illustrations statiques en animations dynamiques grâce à une interface utilisateur intuitive et des outils d'animation essentiels.

## ✨ Fonctionnalités Clés

*   **Animation SVG :** Chargez et manipulez des pantins SVG avec des contrôles précis pour chaque membre.
*   **Timeline Avancée :** Gérez vos animations image par image avec une timeline interactive, permettant l'ajout, la suppression et la navigation fluide entre les frames.
*   **Transformations Globales :** Contrôlez la position, la rotation et l'échelle de l'ensemble du pantin pour des mouvements complexes.
*   **Onion Skinning (Pelure d'Oignon) :** Visualisez les images précédentes et suivantes en semi-transparence pour un ajustement précis des mouvements (désactivé pendant la lecture pour une meilleure visibilité).
*   **Contrôle de la Vitesse :** Ajustez les Frames Per Second (FPS) pour une lecture d'animation personnalisée.
*   **Persistance des Données :** Vos animations sont automatiquement sauvegardées localement dans votre navigateur et rechargées à l'ouverture.
*   **Import/Export JSON :** Sauvegardez et partagez vos animations sous forme de fichiers JSON.
*   **Interface Utilisateur Moderne :** Une interface épurée et professionnelle avec un panneau d'inspecteur escamotable pour une expérience utilisateur optimisée.

## 🛠️ Structure du Projet

Le projet est modulaire et bien organisé :

*   `index.html` : La structure principale de l'application web.
*   `style.css` : Styles CSS pour une interface moderne et réactive.
*   `src/main.js` : Le point d'entrée de l'application, orchestrant le chargement et l'initialisation des modules.
*   `src/svgLoader.js` : Gère le chargement et la préparation des fichiers SVG.
*   `src/timeline.js` : Implémente la logique de la timeline d'animation (gestion des frames, lecture, etc.).
*   `src/interactions.js` : Gère toutes les interactions utilisateur avec le pantin (rotation des membres, déplacement global).
*   `src/ui.js` : Initialise et gère l'interface utilisateur, connectant les éléments HTML aux fonctionnalités JavaScript.
*   `src/onionSkin.js` : Contient la logique spécifique à la fonctionnalité d'onion skinning.

## 🚀 Lancer le Projet

Pour lancer **Pantin Animateur**, il vous suffit d'ouvrir le fichier `index.html` dans n'importe quel navigateur web moderne. Toutes les dépendances sont embarquées, aucune installation supplémentaire n'est requise.

## 💡 Améliorations Futures Possibles

*   **Sélection Multi-Objets :** Permettre la sélection et la manipulation de plusieurs éléments SVG.
*   **Éditeur de Courbes :** Ajouter un éditeur graphique pour affiner les courbes d'animation (interpolation).
*   **Export Vidéo/GIF :** Option d'exporter l'animation finale sous différents formats.

---

Développé avec passion pour l'animation 2D. N'hésitez pas à explorer et à créer !