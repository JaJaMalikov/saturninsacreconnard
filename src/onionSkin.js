import { log } from './logger.js';

let svgElement = null;
let pantinRoot = null;
let onionLayer = null;

const settings = {
  enabled: false,
  pastFrames: 1,
  futureFrames: 1,
};

/**
 * Initialise le module OnionSkin.
 * @param {SVGElement} svg - L'élément SVG principal.
 * @param {string} rootId - L'ID du groupe racine du pantin.
 */
export function initOnionSkin(svg, rootId) {
  log("initOnionSkin called.");
  svgElement = svg;
  pantinRoot = svg.querySelector(`#${rootId}`);

  // Crée un calque dédié pour les fantômes afin de garder le DOM propre
  // et de s'assurer qu'ils sont rendus derrière le pantin principal.
  onionLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  onionLayer.id = 'onion-skin-layer';
  svgElement.insertBefore(onionLayer, pantinRoot);
}

/**
 * Met à jour les paramètres de l'onion skin.
 * @param {object} newSettings - Les nouveaux paramètres à appliquer.
 */
export function updateOnionSkinSettings(newSettings) {
  log("updateOnionSkinSettings called with:", newSettings);
  Object.assign(settings, newSettings);
}

/**
 * Rend les images fantômes en fonction de l'état actuel de la timeline.
 * @param {Timeline} timeline - La timeline de l'animation.
 * @param {Function} applyFrameToPantin - Une fonction pour appliquer l'état d'une frame à un élément pantin.
 */
export function renderOnionSkins(timeline, applyFrameToPantin) {
  log("renderOnionSkins called. Settings:", settings);
  // Efface les anciens fantômes
  onionLayer.replaceChildren();

  if (!settings.enabled || !pantinRoot) {
    log("Onion skin not enabled or pantinRoot not found.");
    return;
  }

  const current = timeline.current;
  const frames = timeline.frames;

  // Rend les images passées
  for (let i = 1; i <= settings.pastFrames; i++) {
    const frameIndex = current - i;
    if (frameIndex >= 0) {
      log("Creating past ghost for frame:", frameIndex);
      const ghost = createGhost(frames[frameIndex], 'past', applyFrameToPantin);
      if (ghost) onionLayer.appendChild(ghost);
    }
  }

  // Rend les images futures
  for (let i = 1; i <= settings.futureFrames; i++) {
    const frameIndex = current + i;
    if (frameIndex < frames.length) {
      log("Creating future ghost for frame:", frameIndex);
      const ghost = createGhost(frames[frameIndex], 'future', applyFrameToPantin);
      if (ghost) onionLayer.appendChild(ghost);
    }
  }
}

/**
 * Crée un seul élément fantôme pour une frame donnée.
 * @param {object} frame - Les données de la frame à appliquer.
 * @param {'past' | 'future'} type - Le type de frame fantôme.
 * @param {Function} applyFrameToPantin - La fonction pour appliquer les transformations.
 * @returns {SVGElement | null} L'élément fantôme stylisé.
 */
function createGhost(frame, type, applyFrameToPantin) {
  if (!pantinRoot) return null;
  const ghost = pantinRoot.cloneNode(true);
  ghost.id = ''; // Les clones ne doivent pas avoir le même ID
  ghost.classList.add('onion-skin-ghost', `onion-skin-${type}`);
  
  // Applique les transformations de la frame cible à ce fantôme
  applyFrameToPantin(frame, ghost);

  return ghost;
}
