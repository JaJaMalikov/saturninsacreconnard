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
      ghost.style.display = '';
      const wrapper = document.createElementNS(ns, 'g');
      wrapper.classList.add('onion-skin-wrapper');
      wrapper.appendChild(ghost);
      renderGhostObjects(frames[frameIndex], ghost, timeline, wrapper);
      onionLayer.appendChild(wrapper);
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
      ghost.style.display = '';
      const wrapper = document.createElementNS(ns, 'g');
      wrapper.classList.add('onion-skin-wrapper');
      wrapper.appendChild(ghost);
      renderGhostObjects(frames[frameIndex], ghost, timeline, wrapper);
      onionLayer.appendChild(wrapper);
    } else {
      ghost.style.display = 'none';
    }
  }
}

function renderGhostObjects(frame, ghostRoot, timeline, wrapper) {
  const objects = frame.objects || {};
  Object.keys(objects).forEach(id => {
    const base = timeline.objectStore[id];
    if (!base) return;
    const obj = { ...base, ...objects[id] };
    const img = document.createElementNS(ns, 'image');
    img.setAttribute('href', obj.src);
    img.setAttribute('width', obj.width);
    img.setAttribute('height', obj.height);
    img.classList.add('onion-skin-ghost', 'onion-object');

    let transformStr = '';
    if (obj.attachedTo) {
      const seg = ghostRoot.querySelector(`#${obj.attachedTo}`);
      if (seg) {
        const matrix = seg.getCTM();
        const pt = svgElement.createSVGPoint();
        pt.x = obj.x;
        pt.y = obj.y;
        const g = pt.matrixTransform(matrix);
        const segAngle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI - frame.transform.rotate;
        const totalRotate = obj.rotate + frame.transform.rotate + segAngle;
        const totalScale = obj.scale * frame.transform.scale;
        transformStr = `translate(${g.x},${g.y}) rotate(${totalRotate},${obj.width/2},${obj.height/2}) scale(${totalScale})`;
      }
    } else {
      const totalRotate = obj.rotate + frame.transform.rotate;
      const totalScale = obj.scale * frame.transform.scale;
      const tx = obj.x + frame.transform.tx;
      const ty = obj.y + frame.transform.ty;
      transformStr = `translate(${tx},${ty}) rotate(${totalRotate},${obj.width/2},${obj.height/2}) scale(${totalScale})`;
    }

    if (transformStr) {
      img.setAttribute('transform', transformStr);
      wrapper.appendChild(img);
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
