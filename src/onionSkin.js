import { debugLog } from './debug.js';
import { memberMapStore } from './memberMapStore.js';

const ns = 'http://www.w3.org/2000/svg';

let svgElement = null;
let pantinRoot = null;
let onionLayer = null;
let memberList = [];
let pantinTemplate = null;
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
export function initOnionSkin(svg, rootId, members) {
  debugLog("initOnionSkin called.");
  svgElement = svg;
  pantinRoot = svg.querySelector(`#${rootId}`);
  memberList = members || [];

  pantinTemplate = pantinRoot.cloneNode(true);

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
  onionLayer.replaceChildren();

  if (!settings.enabled || !pantinRoot) {
    debugLog("Onion skin not enabled or pantinRoot not found.");
    return;
  }

  const current = timeline.current;
  const frames = timeline.frames;
  adjustGhosts(pastGhosts, settings.pastFrames, 'past');
  adjustGhosts(futureGhosts, settings.futureFrames, 'future');

  for (let i = 0; i < settings.pastFrames; i++) {
    const frameIndex = current - (i + 1);
    const ghost = pastGhosts[i];
    if (frameIndex >= 0) {
      const frame = frames[frameIndex];
      applyFrameToPantin(frame, ghost.pantin, memberMapStore.get(ghost.pantin));
      onionLayer.appendChild(ghost.container);
      renderGhostObjects(ghost.pantin, ghost.back, ghost.front, ghost.objects, frame, timeline.objectStore);
    }
  }

  for (let i = 0; i < settings.futureFrames; i++) {
    const frameIndex = current + (i + 1);
    const ghost = futureGhosts[i];
    if (frameIndex < frames.length) {
      const frame = frames[frameIndex];
      applyFrameToPantin(frame, ghost.pantin, memberMapStore.get(ghost.pantin));
      onionLayer.appendChild(ghost.container);
      renderGhostObjects(ghost.pantin, ghost.back, ghost.front, ghost.objects, frame, timeline.objectStore);
    }
  }
}

function adjustGhosts(arr, count, type) {
  while (arr.length < count) {
    const pantin = pantinTemplate.cloneNode(true);
    const memberMap = {};
    memberList.forEach(id => {
      const el = pantin.querySelector(`#${id}`);
      if (el) memberMap[id] = el;
    });
    stripIds(pantin);
    memberMapStore.set(pantin, memberMap);

    const back = document.createElementNS(ns, 'g');
    const front = document.createElementNS(ns, 'g');
    const container = document.createElementNS(ns, 'g');
    container.classList.add('onion-skin-ghost', `onion-skin-${type}`);
    container.appendChild(back);
    container.appendChild(pantin);
    container.appendChild(front);
    arr.push({ container, pantin, back, front, objects: {} });
  }
}

function renderGhostObjects(pantin, backLayer, frontLayer, cache, frame, objectStore) {
  const existing = new Set();
  Object.keys(frame.objects).forEach(id => {
    existing.add(id);
    let el = cache[id];
    const objConst = objectStore[id];
    if (!objConst) return;
    if (!el) {
      el = document.createElementNS(ns, 'image');
      el.setAttribute('href', objConst.src);
      el.setAttribute('width', objConst.width);
      el.setAttribute('height', objConst.height);
      cache[id] = el;
    }
    const obj = { ...objConst, ...frame.objects[id] };
    let transform = '';
    if (obj.attachedTo) {
      const seg = pantin.querySelector(`#${obj.attachedTo}`);
      if (seg) {
        const matrix = seg.getCTM();
        const pt = svgElement.createSVGPoint();
        pt.x = obj.x;
        pt.y = obj.y;
        const g = pt.matrixTransform(matrix);
        const segAngle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI - frame.transform.rotate;
        const totalRotate = obj.rotate + frame.transform.rotate + segAngle;
        const totalScale = obj.scale * frame.transform.scale;
        transform = `translate(${g.x},${g.y}) rotate(${totalRotate},${obj.width/2},${obj.height/2}) scale(${totalScale})`;
      }
    } else {
      const totalRotate = obj.rotate + frame.transform.rotate;
      const totalScale = obj.scale * frame.transform.scale;
      const tx = obj.x + frame.transform.tx;
      const ty = obj.y + frame.transform.ty;
      transform = `translate(${tx},${ty}) rotate(${totalRotate},${obj.width/2},${obj.height/2}) scale(${totalScale})`;
    }
    el.setAttribute('transform', transform);
    (obj.layer === 'front' ? frontLayer : backLayer).appendChild(el);
  });
  Object.keys(cache).forEach(id => {
    if (!existing.has(id)) {
      cache[id].remove();
      delete cache[id];
    }
  });
}

function stripIds(el) {
  el.removeAttribute('id');
  Array.from(el.children).forEach(stripIds);
}
