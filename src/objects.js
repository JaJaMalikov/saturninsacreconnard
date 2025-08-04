import { debugLog } from './debug.js';

export function initObjects(svgElement, pantinRootId, timeline, memberList, onUpdate, onSave) {
  debugLog('initObjects called');
  const ns = 'http://www.w3.org/2000/svg';
  const pantinRoot = svgElement.getElementById(pantinRootId);
  const frontLayer = document.createElementNS(ns, 'g');
  frontLayer.id = 'objects-front';
  const backLayer = document.createElementNS(ns, 'g');
  backLayer.id = 'objects-back';
  pantinRoot.parentNode.insertBefore(backLayer, pantinRoot);
  pantinRoot.parentNode.insertBefore(frontLayer, pantinRoot.nextSibling);

  let selectedId = null;
  let selectCallback = null;

  function selectObject(id) {
    selectedId = id;
    document.querySelectorAll('.scene-object').forEach(el => el.classList.remove('selected'));
    const el = svgElement.getElementById(id);
    if (el) el.classList.add('selected');
    if (selectCallback) selectCallback(id);
  }

  function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.random() * 256;
      }
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0,4).join('')}-${hex.slice(4,6).join('')}-${hex.slice(6,8).join('')}-${hex.slice(8,10).join('')}-${hex.slice(10,16).join('')}`;
  }

  async function addObject(src, layer = 'front') {
    const baseName = src.split('/').pop().replace(/\.[^.]+$/, '');
    const safeName = baseName.replace(/[^a-z0-9]+/gi, '_');
    const id = `${safeName}-${generateId()}`;
    const path = `assets/objets/${src}`;

    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to fetch ${path}`);
        const svgText = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgContent = doc.querySelector('svg');

        if (!svgContent) throw new Error('No SVG content found in file');

        const objectGroup = document.createElementNS(ns, 'g');
        objectGroup.id = id;
        objectGroup.classList.add('scene-object');

        // Append all children from the loaded SVG into our new group
        while (svgContent.firstChild) {
            objectGroup.appendChild(svgContent.firstChild);
        }

        const bbox = objectGroup.getBBox();
        const width = bbox.width;
        const height = bbox.height;

        (layer === 'front' ? frontLayer : backLayer).appendChild(objectGroup);
        setupInteract(objectGroup, id);

        timeline.addObject(id, { x: 0, y: 0, scale: 1, rotate: 0, layer, attachedTo: null, src: path, width, height });
        selectObject(id);
        onUpdate();
        onSave();
        return id;
    } catch (error) {
        console.error('Error adding object:', error);
        return null;
    }
  }

  function removeObject(id) {
    timeline.removeObject(id);
    const el = svgElement.getElementById(id);
    if (el) el.remove();
    if (selectedId === id) selectedId = null;
    onUpdate();
    onSave();
  }

  function setLayer(id, layer) {
    timeline.updateObject(id, { layer });
    const el = svgElement.getElementById(id);
    if (!el) return;
    const obj = timeline.getObject(id);
    if (obj && !obj.attachedTo) {
      (layer === 'front' ? frontLayer : backLayer).appendChild(el);
    }
    onUpdate();
    onSave();
  }

  function attach(id, memberId) {
    const frame = timeline.getCurrentFrame();
    const objData = timeline.getObject(id);
    if (!objData) return;

    const el = svgElement.getElementById(id);
    if (!el) return;

    // --- 1. Get object's current world transform properties ---
    const worldMatrix = el.getCTM();
    const worldPos = { x: worldMatrix.e, y: worldMatrix.f };
    const worldRot = Math.atan2(worldMatrix.b, worldMatrix.a) * (180 / Math.PI);
    const worldScale = Math.sqrt(worldMatrix.a * worldMatrix.a + worldMatrix.b * worldMatrix.b);

    let newX, newY, newRotate, newScale;

    // --- 2. Attach to a new parent ---
    if (memberId) {
        const newParent = pantinRoot.querySelector(`#${memberId}`);
        if (newParent) {
            const parentMatrix = newParent.getCTM();
            const parentInverseMatrix = parentMatrix.inverse();

            // Get parent's properties
            const parentRot = Math.atan2(parentMatrix.b, parentMatrix.a) * (180 / Math.PI);
            const parentScale = Math.sqrt(parentMatrix.a * parentMatrix.a + parentMatrix.b * parentMatrix.b);

            // To keep the object visually in the same place, we calculate its new local
            // transform relative to the new parent.
            const localMatrix = parentInverseMatrix.multiply(worldMatrix);

            // Decompose the new local matrix to get the timeline values
            newX = localMatrix.e;
            newY = localMatrix.f;
            newRotate = Math.atan2(localMatrix.b, localMatrix.a) * (180 / Math.PI);
            newScale = Math.sqrt(localMatrix.a * localMatrix.a + localMatrix.b * localMatrix.b);

        } else {
             // If parent not found, treat as a detach
            memberId = null;
        }
    }

    // --- 3. Detach from parent ---
    if (!memberId) {
        // When detaching, the object's new local transform is its old world transform.
        newX = worldPos.x;
        newY = worldPos.y;
        newRotate = worldRot;
        newScale = worldScale;
    }

    // --- 4. Update timeline ---
    timeline.updateObject(id, {
        attachedTo: memberId,
        x: newX,
        y: newY,
        rotate: newRotate,
        scale: newScale,
    });

    onUpdate();
    onSave();
}

  function setupInteract(el, id) {
    const pointers = new Map();
    let dragStart = null;
    let gestureStart = null;

    const distance = (p1, p2) => Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
    const angle = (p1, p2) => Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX) * 180 / Math.PI;

    const onPointerDown = e => {
      selectObject(id);
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, e);
      if (pointers.size === 1) {
        const frame = timeline.getCurrentFrame();
        const obj = frame.objects[id];
        dragStart = { x: e.clientX, y: e.clientY, objX: obj.x, objY: obj.y };
      } else if (pointers.size === 2) {
        const [p1, p2] = Array.from(pointers.values());
        const frame = timeline.getCurrentFrame();
        const obj = frame.objects[id];
        gestureStart = {
          dist: distance(p1, p2),
          ang: angle(p1, p2),
          scale: obj.scale,
          rotate: obj.rotate,
        };
        dragStart = null;
      }
    };

    const onPointerMove = e => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, e);
      const frame = timeline.getCurrentFrame();
      const obj = frame.objects[id];
      if (pointers.size === 1 && dragStart) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        if (obj.attachedTo) {
          const seg = pantinRoot.querySelector(`#${obj.attachedTo}`);
          if (seg) {
            const inv = seg.getCTM().inverse();
            const pt = svgElement.createSVGPoint();
            pt.x = dx;
            pt.y = dy;
            // We need to transform the delta by the inverse of the parent CTM,
            // but only the rotational/scale part, not the translation.
            const parentMatrix = seg.getCTM();
            const invMatrix = parentMatrix.inverse();
            invMatrix.e = 0;
            invMatrix.f = 0;
            const local = pt.matrixTransform(invMatrix);
            timeline.updateObject(id, { x: dragStart.objX + local.x, y: dragStart.objY + local.y });
          } else {
            // Fallback if parent is not found
            timeline.updateObject(id, { x: dragStart.objX + dx, y: dragStart.objY + dy });
          }
        } else {
          timeline.updateObject(id, { x: dragStart.objX + dx, y: dragStart.objY + dy });
        }
        onUpdate();
      } else if (pointers.size >= 2 && gestureStart) {
        const [p1, p2] = Array.from(pointers.values());
        const dist = distance(p1, p2);
        const ang = angle(p1, p2);
        const scale = gestureStart.scale * (dist / gestureStart.dist);
        const rotate = gestureStart.rotate + (ang - gestureStart.ang);
        timeline.updateObject(id, { scale, rotate });
        onUpdate();
      }
    };

    const onPointerUp = e => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      el.releasePointerCapture(e.pointerId);
      if (pointers.size === 0) {
        dragStart = null;
        gestureStart = null;
        onSave();
      } else if (pointers.size === 1) {
        const p = Array.from(pointers.values())[0];
        const frame = timeline.getCurrentFrame();
        const obj = frame.objects[id];
        dragStart = { x: p.clientX, y: p.clientY, objX: obj.x, objY: obj.y };
        gestureStart = null;
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('pointerleave', onPointerUp);
  }

  function renderObjects() {
    const currentFrame = timeline.getCurrentFrame();
    const existing = new Set();
    Object.keys(currentFrame.objects).forEach(id => {
      existing.add(id);
      let el = svgElement.getElementById(id);
      const obj = timeline.getObject(id);
      if (!obj) return;
      if (!el) {
        // This part is now mainly for re-creating objects on timeline import
        el = document.createElementNS(ns, 'g');
        el.id = id;
        el.classList.add('scene-object');
        // Note: The actual SVG content will be missing here.
        // A full implementation would require re-fetching the SVG content.
        (obj.layer === 'front' ? frontLayer : backLayer).appendChild(el);
        setupInteract(el, id);
      }

      if (obj.attachedTo) {
        const seg = pantinRoot.querySelector(`#${obj.attachedTo}`);
        if (seg && el.parentNode !== seg) {
          seg.appendChild(el);
        }
        el.setAttribute('transform', `translate(${obj.x},${obj.y}) rotate(${obj.rotate}) scale(${obj.scale})`);
      } else {
        const parent = obj.layer === 'front' ? frontLayer : backLayer;
        if (el.parentNode !== parent) parent.appendChild(el);
        const totalRotate = obj.rotate + currentFrame.transform.rotate;
        const totalScale = obj.scale * currentFrame.transform.scale;
        const tx = obj.x + currentFrame.transform.tx;
        const ty = obj.y + currentFrame.transform.ty;
        el.setAttribute('transform', `translate(${tx},${ty}) rotate(${totalRotate}) scale(${totalScale})`);
      }

      if (selectedId === id) el.classList.add('selected');
      else el.classList.remove('selected');
    });
    [frontLayer, backLayer, pantinRoot].forEach(layer => {
      layer.querySelectorAll('.scene-object').forEach(el => {
        if (!existing.has(el.id)) el.remove();
      });
    });
  }

  function onSelect(cb) {
    selectCallback = cb;
  }

  return {
    addObject,
    removeObject,
    setLayer,
    attach,
    renderObjects,
    getSelectedId: () => selectedId,
    selectObject,
    onSelect,
    memberList,
  };
}
