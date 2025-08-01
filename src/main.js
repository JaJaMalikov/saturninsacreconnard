// src/main.js

import { loadSVG } from './svgLoader.js';
import { Timeline } from './timeline.js';
import { setupInteractions } from './interactions.js';
import { setupPantinGlobalInteractions } from './interactions.js';
import { initUI } from './ui.js';

// ID du conteneur dans index.html
const OBJ_ID = "pantin";

// Charge le SVG et initialise toute l'app
loadSVG(OBJ_ID).then(({ svgDoc, memberList, pivots }) => {

  // --- 1. Instancie la timeline (1 frame initiale vierge) ---
  const timeline = new Timeline(memberList);
  // Chargement éventuel depuis localStorage
  const saved = localStorage.getItem('animation');
  if (saved) {
    try { timeline.importJSON(saved); } catch (e) { console.warn(e); }
  }

  // --- 2. Fonction : appliquer un frame de timeline au SVG ---
  function applyFrameToSVG(frame) {
    memberList.forEach(id => {
      const el = svgDoc.getElementById(id);
      if (!el) return;
      const pivot = pivots[id];
      const angle = frame[id]?.rotate || 0;
      // MAJ attribut data
      el.dataset.rotate = angle;
      // MAJ transform SVG
      setRotation(el, angle, pivot);
    });
  }
const pantinCtrl = setupPantinGlobalInteractions(svgDoc, {
  rootGroupId: "manu_test",   // ton groupe racine
  grabId: "torse",             // id du torse pour le centre et le handle
  onChange: () => { /* callback pour undo/redo, sauvegarde, etc. */ }
});
  // --- 3. Branche les interactions (rotations) ---
  setupInteractions(svgDoc, memberList, pivots, timeline);
  // Réapplique la frame après chaque modification via interactions
  svgDoc.addEventListener('mouseup', () => {
    applyFrameToSVG(timeline.getCurrentFrame());
    localStorage.setItem('animation', timeline.exportJSON());
  });

  // --- 4. Branche l'UI ---
  initUI(timeline, pantinCtrl, () => {
    applyFrameToSVG(timeline.getCurrentFrame());
  });

  // --- 5. Première application ---
  applyFrameToSVG(timeline.getCurrentFrame());

  // --- Utilitaire pour la rotation SVG ---
  function setRotation(el, angleDeg, pivot) {
    let base = (el.getAttribute('transform') || '').replace(/rotate\([^)]+\)/, '').trim();
    let rotateStr = `rotate(${angleDeg},${pivot.x},${pivot.y})`;
    el.setAttribute('transform', `${base} ${rotateStr}`.trim());
  }

}).catch(err => {
  alert("Erreur SVG : " + err.message);
});

