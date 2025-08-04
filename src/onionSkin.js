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
  memberList.forEach(id => {
    const el = pantinTemplate.querySelector(`#${id}`);
    if (el) el.setAttribute('data-member-id', id);
  });
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
      const data = memberMapStore.get(ghost.pantin);
      applyFrameToPantin(frames[frameIndex], ghost.pantin, data);
      renderGhostObjects(ghost, frames[frameIndex], timeline);
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
      const data = memberMapStore.get(ghost.pantin);
      applyFrameToPantin(frames[frameIndex], ghost.pantin, data);
      renderGhostObjects(ghost, frames[frameIndex], timeline);
      ghost.style.display = '';
      onionLayer.appendChild(ghost);
    } else {
      ghost.style.display = 'none';
    }
  }
}

function renderGhostObjects(container, frame, timeline) {
  // Clear previous ghost objects
  container.back.replaceChildren();
  container.front.replaceChildren();
  container.pantin.querySelectorAll('.ghost-object').forEach(el => el.remove());

  Object.entries(frame.objects).forEach(([id, obj]) => {
    const stored = timeline.objectStore[id];
    if (!stored) return;
    const { src, width, height } = stored;
    const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttribute('href', src);
    img.setAttribute('width', width);
    img.setAttribute('height', height);
    img.classList.add('ghost-object');
    if (obj.attachedTo) {
      const seg = container.pantin.querySelector(`[data-member-id="${obj.attachedTo}"]`);
      if (seg) {
        img.setAttribute('transform', `translate(${obj.x},${obj.y}) rotate(${obj.rotate},${width/2},${height/2}) scale(${obj.scale})`);
        if (obj.layer === 'front') seg.appendChild(img);
        else seg.insertBefore(img, seg.firstChild);
      }
    } else {
      const totalRotate = obj.rotate + frame.transform.rotate;
      const totalScale = obj.scale * frame.transform.scale;
      const tx = obj.x + frame.transform.tx;
      const ty = obj.y + frame.transform.ty;
      img.setAttribute('transform', `translate(${tx},${ty}) rotate(${totalRotate},${width/2},${height/2}) scale(${totalScale})`);
      (obj.layer === 'front' ? container.front : container.back).appendChild(img);
    }
  });
}

function adjustGhosts(arr, count, type) {
  while (arr.length < count) {
    const container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const back = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    back.classList.add('ghost-objects-back');
    const pantin = pantinTemplate.cloneNode(true);
    const front = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    front.classList.add('ghost-objects-front');
    container.appendChild(back);
    container.appendChild(pantin);
    container.appendChild(front);

    const memberMap = {};
    memberList.forEach(id => {
      const el = pantin.querySelector(`[data-member-id="${id}"]`);
      if (el) memberMap[id] = el;
    });
    memberMapStore.set(pantin, memberMap);

    container.pantin = pantin;
    container.back = back;
    container.front = front;
    container.classList.add('onion-skin-ghost', `onion-skin-${type}`);
    arr.push(container);
  }
}

function stripIds(el) {
  el.removeAttribute('id');
  Array.from(el.children).forEach(stripIds);
}
