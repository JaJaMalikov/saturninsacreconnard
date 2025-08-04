import { debugLog } from './debug.js';
import { memberMapStore } from './memberMapStore.js';

let svgElement = null;
let pantinRoot = null;
let onionLayer = null;
let memberList = [];
let pantinTemplate = null;
const pastGhosts = [];
const futureGhosts = [];
const ns = 'http://www.w3.org/2000/svg';

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
export function initOnionSkin(svg, rootId, members) {
  debugLog("initOnionSkin called.");
  svgElement = svg;
  pantinRoot = svg.querySelector(`#${rootId}`);
  memberList = members || [];

  pantinTemplate = pantinRoot.cloneNode(true);
  stripIds(pantinTemplate);

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
  if (typeof newSettings.enabled === 'boolean') settings.enabled = newSettings.enabled;
  if (typeof newSettings.pastFrames === 'number') {
    settings.pastFrames = Math.max(0, Math.min(10, Math.floor(newSettings.pastFrames)));
  }
  if (typeof newSettings.futureFrames === 'number') {
    settings.futureFrames = Math.max(0, Math.min(10, Math.floor(newSettings.futureFrames)));
  }
}

/**
 * Rend les images fantômes en fonction de l'état actuel de la timeline.
 * @param {Timeline} timeline - La timeline de l'animation.
 * @param {Function} applyFrameToPantin - Une fonction pour appliquer l'état d'une frame à un élément pantin.
 */
export function renderOnionSkins(timeline, applyFrameToPantin) {
  debugLog("renderOnionSkins called. Settings:", settings);
  // Efface les anciens fantômes du calque (les objets restent en cache)
  onionLayer.replaceChildren();

  if (!settings.enabled || !pantinRoot) {
    debugLog("Onion skin not enabled or pantinRoot not found.");
    return;
  }

  const current = timeline.current;
  const frames = timeline.frames;
  adjustGhosts(pastGhosts, settings.pastFrames, 'past');
  adjustGhosts(futureGhosts, settings.futureFrames, 'future');

  // Rend les images passées
  for (let i = 0; i < settings.pastFrames; i++) {
    const frameIndex = current - (i + 1);
    const ghost = pastGhosts[i];
    if (frameIndex >= 0) {
      debugLog("Updating past ghost for frame:", frameIndex);
      applyFrameToPantin(frames[frameIndex], ghost, memberMapStore.get(ghost));
      renderGhostObjects(frameIndex, ghost, 'past', timeline);
      ghost.style.display = '';
      onionLayer.appendChild(ghost);
    } else {
      ghost.style.display = 'none';
    }
  }

  // Rend les images futures
  for (let i = 0; i < settings.futureFrames; i++) {
    const frameIndex = current + (i + 1);
    const ghost = futureGhosts[i];
    if (frameIndex < frames.length) {
      debugLog("Updating future ghost for frame:", frameIndex);
      applyFrameToPantin(frames[frameIndex], ghost, memberMapStore.get(ghost));
      renderGhostObjects(frameIndex, ghost, 'future', timeline);
      ghost.style.display = '';
      onionLayer.appendChild(ghost);
    } else {
      ghost.style.display = 'none';
    }
  }
}

function renderGhostObjects(frameIndex, ghost, type, timeline) {
  ghost.querySelectorAll('.onion-skin-object').forEach(el => el.remove());
  const frame = timeline.frames[frameIndex];
  Object.entries(frame.objects).forEach(([id, obj]) => {
    const base = timeline.objectStore[id];
    if (!base) return;
    const { src, width, height } = base;
    const img = document.createElementNS(ns, 'image');
    img.setAttribute('href', src);
    img.setAttribute('width', width);
    img.setAttribute('height', height);
    img.classList.add('onion-skin-object', 'onion-skin-ghost', `onion-skin-${type}`);
    if (obj.attachedTo) {
      const seg = ghost.querySelector(`#${obj.attachedTo}`);
      if (!seg) return;
      img.setAttribute('transform', `translate(${obj.x},${obj.y}) rotate(${obj.rotate},${width/2},${height/2}) scale(${obj.scale})`);
      if (obj.layer === 'back') seg.insertBefore(img, seg.firstChild);
      else seg.appendChild(img);
    } else {
      const tx = obj.x + frame.transform.tx;
      const ty = obj.y + frame.transform.ty;
      const totalRotate = obj.rotate + frame.transform.rotate;
      const totalScale = obj.scale * frame.transform.scale;
      img.setAttribute('transform', `translate(${tx},${ty}) rotate(${totalRotate},${width/2},${height/2}) scale(${totalScale})`);
      if (obj.layer === 'back') ghost.insertBefore(img, ghost.firstChild);
      else ghost.appendChild(img);
    }
  });
}

function adjustGhosts(arr, count, type) {
  while (arr.length < count) {
    const ghost = pantinTemplate.cloneNode(true);
    const memberMap = {};
    memberList.forEach(id => {
      const el = ghost.querySelector(`#${id}`);
      if (el) memberMap[id] = el;
    });
    memberMapStore.set(ghost, memberMap);
    ghost.classList.add('onion-skin-ghost', `onion-skin-${type}`);
    arr.push(ghost);
  }
}

function stripIds(el) {
  el.removeAttribute('id');
  Array.from(el.children).forEach(stripIds);
}
