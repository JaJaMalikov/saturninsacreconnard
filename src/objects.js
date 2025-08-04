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

  function addObject(src, layer = 'front') {
    return new Promise(resolve => {
      const baseName = src.split('/').pop().replace(/\.[^.]+$/, '');
      const safeName = baseName.replace(/[^a-z0-9]+/gi, '_');
      const id = `${safeName}-${generateId()}`;
      const path = `assets/objets/${src}`;
      const img = document.createElementNS(ns, 'image');
      img.setAttribute('href', path);
      img.id = id;
      img.classList.add('scene-object');
      (layer === 'front' ? frontLayer : backLayer).appendChild(img);
      setupInteract(img, id);

      const temp = new Image();
      temp.onload = () => {
        const width = temp.naturalWidth || 100;
        const height = temp.naturalHeight || 100;
        img.setAttribute('width', width);
        img.setAttribute('height', height);
        timeline.addObject(id, { x: 0, y: 0, scale: 1, rotate: 0, layer, attachedTo: null, src: path, width, height });
        selectObject(id);
        onUpdate();
        onSave();
        resolve(id);
      };
      temp.onerror = () => {
        const width = 100;
        const height = 100;
        img.setAttribute('width', width);
        img.setAttribute('height', height);
        timeline.addObject(id, { x: 0, y: 0, scale: 1, rotate: 0, layer, attachedTo: null, src: path, width, height });
        selectObject(id);
        onUpdate();
        onSave();
        resolve(id);
      };
      temp.src = path;
    });
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
    (layer === 'front' ? frontLayer : backLayer).appendChild(el);
    onUpdate();
    onSave();
  }

  function attach(id, memberId) {
    const frame = timeline.getCurrentFrame();
    const obj = frame.objects[id];
    if (!obj) return;
    const el = svgElement.getElementById(id);

    // build matrix representing current global transform of the object
    let m = svgElement.createSVGMatrix();
    m = m.translate(obj.x, obj.y);
    m = m.translate(obj.width / 2, obj.height / 2);
    m = m.rotate(obj.rotate);
    m = m.scale(obj.scale);
    m = m.translate(-obj.width / 2, -obj.height / 2);

    if (obj.attachedTo) {
      const prevSeg = pantinRoot.querySelector(`#${obj.attachedTo}`);
      if (prevSeg) {
        m = prevSeg.getCTM().multiply(m);
      }
    } else {
      let frameMatrix = svgElement.createSVGMatrix();
      frameMatrix = frameMatrix.translate(frame.transform.tx, frame.transform.ty);
      frameMatrix = frameMatrix.rotate(frame.transform.rotate);
      frameMatrix = frameMatrix.scale(frame.transform.scale);
      m = frameMatrix.multiply(m);
    }

    if (memberId) {
      const seg = pantinRoot.querySelector(`#${memberId}`);
      if (!seg) return;
      const local = seg.getCTM().inverse().multiply(m);
      const scale = Math.sqrt(local.a * local.a + local.b * local.b);
      const rotate = Math.atan2(local.b, local.a) * 180 / Math.PI;
      const x = local.e;
      const y = local.f;
      timeline.updateObject(id, { attachedTo: memberId, x, y, scale, rotate });
      if (el) seg.appendChild(el);
    } else {
      let frameMatrix = svgElement.createSVGMatrix();
      frameMatrix = frameMatrix.translate(frame.transform.tx, frame.transform.ty);
      frameMatrix = frameMatrix.rotate(frame.transform.rotate);
      frameMatrix = frameMatrix.scale(frame.transform.scale);
      const local = frameMatrix.inverse().multiply(m);
      const scale = Math.sqrt(local.a * local.a + local.b * local.b);
      const rotate = Math.atan2(local.b, local.a) * 180 / Math.PI;
      const x = local.e;
      const y = local.f;
      timeline.updateObject(id, { attachedTo: null, x, y, scale, rotate });
      if (el) {
        const parent = obj.layer === 'front' ? frontLayer : backLayer;
        parent.appendChild(el);
      }
    }
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
        const p = pointers.get(e.pointerId);
        const dx = p.clientX - dragStart.x;
        const dy = p.clientY - dragStart.y;
        if (obj.attachedTo) {
          const seg = pantinRoot.querySelector(`#${obj.attachedTo}`);
          if (!seg) return;
          const inv = seg.getCTM().inverse();
          const pt = svgElement.createSVGPoint();
          pt.x = dx;
          pt.y = dy;
          const local = pt.matrixTransform(inv);
          timeline.updateObject(id, { x: dragStart.objX + local.x, y: dragStart.objY + local.y });
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
        el = document.createElementNS(ns, 'image');
        el.setAttribute('href', obj.src);
        el.setAttribute('width', obj.width);
        el.setAttribute('height', obj.height);
        el.id = id;
        el.classList.add('scene-object');
        (obj.layer === 'front' ? frontLayer : backLayer).appendChild(el);
        setupInteract(el, id);
      }
      if (obj.attachedTo) {
        const seg = pantinRoot.querySelector(`#${obj.attachedTo}`);
        if (seg) {
          if (el.parentNode !== seg) seg.appendChild(el);
          el.setAttribute('transform', `translate(${obj.x},${obj.y}) rotate(${obj.rotate},${obj.width/2},${obj.height/2}) scale(${obj.scale})`);
        }
      } else {
        const parent = obj.layer === 'front' ? frontLayer : backLayer;
        if (el.parentNode !== parent) parent.appendChild(el);
        const totalRotate = obj.rotate + currentFrame.transform.rotate;
        const totalScale = obj.scale * currentFrame.transform.scale;
        const tx = obj.x + currentFrame.transform.tx;
        const ty = obj.y + currentFrame.transform.ty;
        el.setAttribute('transform', `translate(${tx},${ty}) rotate(${totalRotate},${obj.width/2},${obj.height/2}) scale(${totalScale})`);
      }
      if (selectedId === id) el.classList.add('selected');
      else el.classList.remove('selected');
    });
    [frontLayer, backLayer].forEach(layer => {
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
