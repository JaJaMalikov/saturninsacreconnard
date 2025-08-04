import { debugLog } from './debug.js';

const NS = 'http://www.w3.org/2000/svg';

export function initObjects(svgElement, pantinRootGroup, memberList, timeline, onFrameChange, onSave, onSelectionChange) {
  debugLog('initObjects called');
  const objectsFront = document.createElementNS(NS, 'g');
  objectsFront.id = 'objects-front';
  const objectsBack = document.createElementNS(NS, 'g');
  objectsBack.id = 'objects-back';
  const parent = pantinRootGroup.parentNode;
  parent.insertBefore(objectsBack, pantinRootGroup);
  parent.insertBefore(objectsFront, pantinRootGroup.nextSibling);

  const objectMap = {};
  let selectedId = null;

  function getSVGCoords(evt) {
    const pt = svgElement.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svgElement.getScreenCTM().inverse());
  }

  let selectionCallback = onSelectionChange;

  function select(id) {
    selectedId = id;
    if (typeof selectionCallback === 'function') selectionCallback(id);
  }

  function applyFrame(frame) {
    const objs = frame.objects || {};
    Object.entries(objs).forEach(([id, obj]) => {
      const el = objectMap[id];
      if (!el) return;
      if (obj.attachedTo) {
        const memberEl = pantinRootGroup.querySelector(`#${obj.attachedTo}`);
        if (memberEl && el.parentNode !== memberEl) memberEl.appendChild(el);
      } else {
        const layerParent = obj.layer === 'back' ? objectsBack : objectsFront;
        if (el.parentNode !== layerParent) layerParent.appendChild(el);
      }
      el.setAttribute('transform', `translate(${obj.tx},${obj.ty}) rotate(${obj.rotate}) scale(${obj.scale})`);
    });
  }

  function setupDrag(el, id) {
    let dragging = false;
    let startPt;
    el.style.cursor = 'move';

    const onMove = e => {
      if (!dragging) return;
      const pt = getSVGCoords(e);
      const obj = timeline.getCurrentFrame().objects[id];
      timeline.updateObject(id, {
        tx: obj.tx + (pt.x - startPt.x),
        ty: obj.ty + (pt.y - startPt.y),
      });
      startPt = pt;
      onFrameChange();
    };

    const endDrag = e => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = 'move';
      svgElement.removeEventListener('pointermove', onMove);
      onSave();
    };

    const onPointerDown = e => {
      e.stopPropagation();
      select(id);
      dragging = true;
      startPt = getSVGCoords(e);
      el.style.cursor = 'grabbing';
      svgElement.addEventListener('pointermove', onMove);
      svgElement.addEventListener('pointerup', endDrag, { once: true });
      svgElement.addEventListener('pointerleave', endDrag, { once: true });
    };

    el.addEventListener('pointerdown', onPointerDown);
  }

  function createDOMForObject(id, src, layer) {
    const img = new Image();
    img.onload = () => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('data-object-id', id);
      const imageEl = document.createElementNS(NS, 'image');
      imageEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', src);
      imageEl.setAttribute('width', img.width);
      imageEl.setAttribute('height', img.height);
      imageEl.setAttribute('x', -img.width / 2);
      imageEl.setAttribute('y', -img.height / 2);
      g.appendChild(imageEl);
      const layerParent = layer === 'back' ? objectsBack : objectsFront;
      layerParent.appendChild(g);
      objectMap[id] = g;
      setupDrag(g, id);
      onFrameChange();
    };
    img.src = src;
  }

  function addObject(src, layer = 'front') {
    const id = `obj-${Date.now()}`;
    timeline.addObject(id, { src, layer });
    createDOMForObject(id, src, layer);
    select(id);
    onSave();
  }

  // load existing objects from timeline
  const initialObjects = timeline.getCurrentFrame().objects;
  Object.entries(initialObjects).forEach(([id, obj]) => {
    createDOMForObject(id, obj.src, obj.layer);
  });

  function deleteSelected() {
    if (!selectedId) return;
    const el = objectMap[selectedId];
    if (el) el.remove();
    timeline.removeObject(selectedId);
    delete objectMap[selectedId];
    select(null);
    onFrameChange();
    onSave();
  }

  function attachSelected(memberId) {
    if (!selectedId) return;
    timeline.updateObject(selectedId, { attachedTo: memberId || null });
    onFrameChange();
    onSave();
  }

  function setLayer(layer) {
    if (!selectedId) return;
    timeline.updateObject(selectedId, { layer });
    onFrameChange();
    onSave();
  }

  svgElement.addEventListener('pointerdown', e => {
    if (e.target === svgElement) {
      select(null);
      onFrameChange();
    }
  });

  return {
    addObject,
    deleteSelected,
    attachSelected,
    setLayer,
    applyFrame,
    getSelectedId: () => selectedId,
    getObjectData: id => timeline.getCurrentFrame().objects[id],
    clearSelection: () => select(null),
    setSelectionCallback: cb => { selectionCallback = cb; },
  };
}
