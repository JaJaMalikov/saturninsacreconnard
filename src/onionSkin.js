import { debugLog } from './debug.js';

let svgElement = null;
let pantinRoot = null;
let onionLayer = null;
const pastGhosts = [];
const futureGhosts = [];

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
  debugLog("initOnionSkin called.");
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
  debugLog("updateOnionSkinSettings called with:", newSettings);
  Object.assign(settings, newSettings);
}

/**
 * Rend les images fantômes en fonction de l'état actuel de la timeline.
 * @param {Timeline} timeline - La timeline de l'animation.
 * @param {Function} applyFrameToPantin - Une fonction pour appliquer l'état d'une frame à un élément pantin.
 */
export function renderOnionSkins(timeline, applyFrameToPantin) {
  debugLog("renderOnionSkins called. Settings:", settings);

  if (!settings.enabled || !pantinRoot) {
    onionLayer.replaceChildren();
    pastGhosts.length = 0;
    futureGhosts.length = 0;
    debugLog("Onion skin not enabled or pantinRoot not found.");
    return;
  }

  // Ajuste le nombre de fantômes passés
  while (pastGhosts.length < settings.pastFrames) {
    const ghost = createGhost('past');
    onionLayer.appendChild(ghost);
    pastGhosts.push(ghost);
  }
  while (pastGhosts.length > settings.pastFrames) {
    const ghost = pastGhosts.pop();
    ghost.remove();
  }

  // Ajuste le nombre de fantômes futurs
  while (futureGhosts.length < settings.futureFrames) {
    const ghost = createGhost('future');
    onionLayer.appendChild(ghost);
    futureGhosts.push(ghost);
  }
  while (futureGhosts.length > settings.futureFrames) {
    const ghost = futureGhosts.pop();
    ghost.remove();
  }

  const current = timeline.current;
  const frames = timeline.frames;

  pastGhosts.forEach((ghost, idx) => {
    const frameIndex = current - (idx + 1);
    if (frameIndex >= 0) {
      ghost.style.display = '';
      applyFrameToPantin(frames[frameIndex], ghost);
    } else {
      ghost.style.display = 'none';
    }
  });

  futureGhosts.forEach((ghost, idx) => {
    const frameIndex = current + (idx + 1);
    if (frameIndex < frames.length) {
      ghost.style.display = '';
      applyFrameToPantin(frames[frameIndex], ghost);
    } else {
      ghost.style.display = 'none';
    }
  });
}

/**
 * Crée un élément fantôme.
 * @param {'past' | 'future'} type - Le type de frame fantôme.
 * @returns {SVGElement | null} L'élément fantôme stylisé.
 */
function createGhost(type) {
  if (!pantinRoot) return null;
  const ghost = pantinRoot.cloneNode(true);
  ghost.id = '';
  ghost.classList.add('onion-skin-ghost', `onion-skin-${type}`);
  return ghost;
}
