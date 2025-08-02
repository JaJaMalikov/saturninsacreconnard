import { loadSVG } from './svgLoader.js';
import { Timeline } from './timeline.js';
import { setupInteractions, setupPantinGlobalInteractions } from './interactions.js';
import { initUI } from './ui.js';

// --- Constantes ---
const SVG_URL = 'manu.svg';
const THEATRE_ID = 'theatre';
const PANTIN_ROOT_ID = 'manu_test'; // ID du groupe racine du pantin dans le SVG
const GRAB_ID = 'torse'; // ID de l'élément pour le drag

// --- Chargement et initialisation ---
loadSVG(SVG_URL, THEATRE_ID).then(({ svgElement, memberList, pivots }) => {

  const timeline = new Timeline(memberList);
  const saved = localStorage.getItem('animation');
  if (saved) {
    try { timeline.importJSON(saved); } catch (e) { console.warn(e); }
  }

  function applyFrameToSVG(frame) {
    if (!frame) return;
    memberList.forEach(id => {
      const el = svgElement.querySelector(`#${id}`);
      if (!el) return;
      const pivot = pivots[id];
      const angle = frame[id]?.rotate || 0;
      el.dataset.rotate = angle;
      // On force la transformation de rotation, en ignorant les autres
      el.setAttribute('transform', `rotate(${angle},${pivot.x},${pivot.y})`);
    });
  }

  // --- Setup des interactions ---
  // 1. Interactions sur les membres
  setupInteractions(svgElement, memberList, pivots, timeline);

  // 2. Interactions globales (drag, sliders pour scale/rotate)
  setupPantinGlobalInteractions(svgElement, {
    rootGroupId: PANTIN_ROOT_ID,
    grabId: GRAB_ID,
    scaleSliderId: 'scale-slider',
    rotateSliderId: 'rotate-slider',
  });

  // --- UI et Timeline ---
  initUI(timeline, () => {
    applyFrameToSVG(timeline.getCurrentFrame());
  });

  // Sauvegarde après manipulation
  svgElement.addEventListener('mouseup', () => {
    localStorage.setItem('animation', timeline.exportJSON());
  });
  document.getElementById('scale-slider').addEventListener('input', () => {
    // On pourrait vouloir sauvegarder l'état global du pantin ici
  });
  document.getElementById('rotate-slider').addEventListener('input', () => {
    // On pourrait vouloir sauvegarder l'état global du pantin ici
  });


  // --- Application initiale ---
  applyFrameToSVG(timeline.getCurrentFrame());

  // --- Utilitaire pour la rotation SVG ---
  function setRotation(el, angleDeg, pivot) {
    let base = (el.getAttribute('transform') || '').replace(/rotate\([^)]+\)/, '').trim();
    let rotateStr = `rotate(${angleDeg},${pivot.x},${pivot.y})`;
    el.setAttribute('transform', `${base} ${rotateStr}`.trim());
  }

}).catch(err => {
  console.error("Erreur d'initialisation:", err);
  alert("Erreur fatale : " + err.message);
});

