import { debugLog } from './debug.js';
import { memberMapStore } from './memberMapStore.js';

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
    const ghostObj = pastGhosts[i];
    if (frameIndex >= 0) {
      debugLog("Updating past ghost for frame:", frameIndex);
      applyFrameToPantin(frames[frameIndex], ghostObj.container, memberMapStore.get(ghostObj.container));
      renderGhostObjects(frames[frameIndex], ghostObj, timeline);
      ghostObj.container.style.display = '';
      onionLayer.appendChild(ghostObj.container);
    } else {
      ghostObj.container.style.display = 'none';
    }
  }

  // Rend les images futures
  for (let i = 0; i < settings.futureFrames; i++) {
    const frameIndex = current + (i + 1);
    const ghostObj = futureGhosts[i];
    if (frameIndex < frames.length) {
      debugLog("Updating future ghost for frame:", frameIndex);
      applyFrameToPantin(frames[frameIndex], ghostObj.container, memberMapStore.get(ghostObj.container));
      renderGhostObjects(frames[frameIndex], ghostObj, timeline);
      ghostObj.container.style.display = '';
      onionLayer.appendChild(ghostObj.container);
    } else {
      ghostObj.container.style.display = 'none';
    }
  }
}

function adjustGhosts(arr, count, type) {
  const ns = 'http://www.w3.org/2000/svg';
  while (arr.length < count) {
    const container = document.createElementNS(ns, 'g');
    const backLayer = document.createElementNS(ns, 'g');
    const ghost = pantinTemplate.cloneNode(true);
    const frontLayer = document.createElementNS(ns, 'g');
    const memberMap = {};
    memberList.forEach(id => {
      const el = ghost.querySelector(`#${id}`);
      if (el) memberMap[id] = el;
    });
    stripIds(ghost);
    container.appendChild(backLayer);
    container.appendChild(ghost);
    container.appendChild(frontLayer);
    container.classList.add('onion-skin-ghost', `onion-skin-${type}`);
    memberMapStore.set(container, memberMap);
    arr.push({ container, backLayer, frontLayer });
  }
}

function stripIds(el) {
  el.removeAttribute('id');
  Array.from(el.children).forEach(stripIds);
}

function renderGhostObjects(frame, ghostObj, timeline) {
  const { backLayer, frontLayer, container } = ghostObj;
  backLayer.replaceChildren();
  frontLayer.replaceChildren();
  Object.entries(frame.objects).forEach(([id, obj]) => {
    const base = timeline.objectStore[id];
    if (!base) return;
    const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttribute('href', base.src);
    img.setAttribute('width', base.width);
    img.setAttribute('height', base.height);
    if (obj.attachedTo) {
      const seg = memberMapStore.get(container)[obj.attachedTo];
      if (seg) {
        const matrix = seg.getCTM();
        const pt = svgElement.createSVGPoint();
        pt.x = obj.x;
        pt.y = obj.y;
        const g = pt.matrixTransform(matrix);
        const segAngle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI - frame.transform.rotate;
        const totalRotate = obj.rotate + frame.transform.rotate + segAngle;
        const totalScale = obj.scale * frame.transform.scale;
        img.setAttribute('transform', `translate(${g.x},${g.y}) rotate(${totalRotate},${base.width/2},${base.height/2}) scale(${totalScale})`);
      }
    } else {
      const totalRotate = obj.rotate + frame.transform.rotate;
      const totalScale = obj.scale * frame.transform.scale;
      const tx = obj.x + frame.transform.tx;
      const ty = obj.y + frame.transform.ty;
      img.setAttribute('transform', `translate(${tx},${ty}) rotate(${totalRotate},${base.width/2},${base.height/2}) scale(${totalScale})`);
    }
    (obj.layer === 'front' ? frontLayer : backLayer).appendChild(img);
  });
}
