// src/objects.js
import { debugLog } from './debug.js';

/**
 * Gestion des objets ajoutés à la scène.
 * @param {SVGElement} svgElement
 * @param {SVGElement} pantinRootGroup
 * @param {Timeline} timeline
 * @param {Object} ui - objet retourné par initUI (contient setSelection)
 * @param {string[]} memberList
 * @param {Function} onFrameChange
 * @param {Function} onSave
 */
export function initObjectManager(svgElement, pantinRootGroup, timeline, ui, memberList, onFrameChange, onSave) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const layers = {};
  const objectEls = {};

  function createLayers() {
    ['back', 'front'].forEach(name => {
      let g = svgElement.getElementById(`objects-${name}`);
      if (!g) {
        g = document.createElementNS(svgNS, 'g');
        g.setAttribute('id', `objects-${name}`);
        if (name === 'back') {
          pantinRootGroup.parentNode.insertBefore(g, pantinRootGroup);
        } else {
          pantinRootGroup.parentNode.insertBefore(g, pantinRootGroup.nextSibling);
        }
      }
      layers[name] = g;
    });
  }

  function getSVGCoords(evt) {
    const pt = svgElement.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svgElement.getScreenCTM().inverse());
  }

  function refreshObject(id) {
    const el = objectEls[id];
    const tr = timeline.getObjectTransform(id);
    if (!el || !tr) return;
    el.setAttribute('transform', `translate(${tr.tx},${tr.ty}) rotate(${tr.rotate}) scale(${tr.scale})`);
  }

  function refreshAll() {
    Object.keys(objectEls).forEach(refreshObject);
  }

  function setupDrag(el, id) {
    let dragging = false;
    let startPt;

    const onMove = e => {
      if (!dragging) return;
      const pt = getSVGCoords(e);
      const cur = timeline.getObjectTransform(id);
      timeline.updateObjectTransform(id, {
        tx: cur.tx + (pt.x - startPt.x),
        ty: cur.ty + (pt.y - startPt.y),
      });
      startPt = pt;
      refreshObject(id);
    };

    const endDrag = e => {
      if (!dragging) return;
      dragging = false;
      svgElement.removeEventListener('pointermove', onMove);
      el.releasePointerCapture && el.releasePointerCapture(e.pointerId);
      onSave();
    };

    el.addEventListener('pointerdown', e => {
      e.stopPropagation();
      dragging = true;
      startPt = getSVGCoords(e);
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      svgElement.addEventListener('pointermove', onMove);
      ui.setSelection('object', id, id);
    });
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointerleave', endDrag);
  }

  function attachObject(id, memberId) {
    const def = timeline.objectDefs[id];
    if (!def) return;
    def.attachedTo = memberId || null;
    const el = objectEls[id];
    if (!el) return;
    if (memberId) {
      const memberEl = pantinRootGroup.querySelector(`#${memberId}`);
      if (memberEl) memberEl.appendChild(el);
    } else {
      layers[def.layer || 'front'].appendChild(el);
    }
    onFrameChange();
  }

  function setLayer(id, layer) {
    const def = timeline.objectDefs[id];
    if (!def) return;
    def.layer = layer;
    if (!def.attachedTo) {
      layers[layer].appendChild(objectEls[id]);
    }
    onFrameChange();
  }

  function addObject(def) {
    const id = def.id;
    if (!id || objectEls[id]) return;
    timeline.addObject(id, { src: def.src, attachedTo: null, layer: 'front' });
    const el = document.createElementNS(svgNS, 'image');
    el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', def.src);
    el.setAttribute('width', 100);
    el.setAttribute('height', 100);
    el.setAttribute('data-object-id', id);
    el.style.cursor = 'move';
    layers.front.appendChild(el);
    objectEls[id] = el;
    setupDrag(el, id);
    refreshObject(id);
    ui.setSelection('object', id, id);
    onFrameChange();
    onSave();
  }

  function removeObject(id) {
    const el = objectEls[id];
    if (el) el.remove();
    delete objectEls[id];
    timeline.removeObject(id);
    ui.setSelection('pantin', null, 'Pantin');
    onFrameChange();
    onSave();
  }

  function importExisting() {
    Object.entries(timeline.objectDefs).forEach(([id, def]) => {
      const el = document.createElementNS(svgNS, 'image');
      el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', def.src);
      el.setAttribute('width', 100);
      el.setAttribute('height', 100);
      el.setAttribute('data-object-id', id);
      el.style.cursor = 'move';
      objectEls[id] = el;
      setupDrag(el, id);
      if (def.attachedTo) {
        const memberEl = pantinRootGroup.querySelector(`#${def.attachedTo}`);
        memberEl && memberEl.appendChild(el);
      } else {
        layers[def.layer || 'front'].appendChild(el);
      }
      refreshObject(id);
    });
  }

  createLayers();
  importExisting();

  return { addObject, refreshAll, attachObject, setLayer, removeObject };
}
