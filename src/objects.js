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

  function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const bytes = (typeof crypto !== 'undefined' && crypto.getRandomValues)
      ? crypto.getRandomValues(new Uint8Array(16))
      : Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
  }

  function selectObject(id) {
    selectedId = id;
    document.querySelectorAll('.scene-object').forEach(el => el.classList.remove('selected'));
    const el = svgElement.getElementById(id);
    if (el) el.classList.add('selected');
    if (selectCallback) selectCallback(id);
  }

  function addObject(src, layer = 'front') {
    return new Promise(resolve => {
      const id = generateUUID();
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
    if (memberId) {
      const seg = pantinRoot.querySelector(`#${memberId}`);
      if (seg) {
        const inv = seg.getCTM().inverse();
        const pt = svgElement.createSVGPoint();
        pt.x = obj.x;
        pt.y = obj.y;
        const local = pt.matrixTransform(inv);
        obj.x = local.x;
        obj.y = local.y;
      }
    } else if (obj.attachedTo) {
      const seg = pantinRoot.querySelector(`#${obj.attachedTo}`);
      if (seg) {
        const matrix = seg.getCTM();
        const pt = svgElement.createSVGPoint();
        pt.x = obj.x;
        pt.y = obj.y;
        const g = pt.matrixTransform(matrix);
        obj.x = g.x;
        obj.y = g.y;
      }
    }
    timeline.updateObject(id, { attachedTo: memberId || null, x: obj.x, y: obj.y });
    onUpdate();
    onSave();
  }

  function setupInteract(el, id) {
    if (!window.interact) return;
    const interactable = window.interact(el);
    try {
      interactable.draggable({
        listeners: {
          move(event) {
            const frame = timeline.getCurrentFrame();
            const obj = frame.objects[id];
            if (obj.attachedTo) {
              const seg = pantinRoot.querySelector(`#${obj.attachedTo}`);
              if (!seg) return;
              const inv = seg.getCTM().inverse();
              const pt = svgElement.createSVGPoint();
              pt.x = event.dx;
              pt.y = event.dy;
              const local = pt.matrixTransform(inv);
              timeline.updateObject(id, { x: obj.x + local.x, y: obj.y + local.y });
            } else {
              timeline.updateObject(id, { x: obj.x + event.dx, y: obj.y + event.dy });
            }
            onUpdate();
          },
          end: onSave,
        },
        modifiers: [],
      });
      interactable.gesturable({
        listeners: {
          move(event) {
            const frame = timeline.getCurrentFrame();
            const obj = frame.objects[id];
            const scale = obj.scale * (1 + event.ds);
            const rotate = obj.rotate + event.da;
            timeline.updateObject(id, { scale, rotate });
            onUpdate();
          },
          end: onSave,
        },
        modifiers: [],
      });
    } catch (err) {
      console.warn('interact.js setup failed', err);
    }
    el.addEventListener('click', () => selectObject(id));
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
          const matrix = seg.getCTM();
          const pt = svgElement.createSVGPoint();
          pt.x = obj.x;
          pt.y = obj.y;
          const g = pt.matrixTransform(matrix);
          const segAngle = currentFrame.members[obj.attachedTo]?.rotate || 0;
          const totalRotate = obj.rotate + currentFrame.transform.rotate + segAngle;
          const totalScale = obj.scale * currentFrame.transform.scale;
          el.setAttribute('transform', `translate(${g.x},${g.y}) rotate(${totalRotate}) scale(${totalScale})`);
        }
      } else {
        const totalRotate = obj.rotate + currentFrame.transform.rotate;
        const totalScale = obj.scale * currentFrame.transform.scale;
        el.setAttribute('transform', `translate(${obj.x + currentFrame.transform.tx},${obj.y + currentFrame.transform.ty}) rotate(${totalRotate}) scale(${totalScale})`);
      }
      if (selectedId === id) el.classList.add('selected');
      else el.classList.remove('selected');
    });
    document.querySelectorAll('.scene-object').forEach(el => {
      if (!existing.has(el.id)) el.remove();
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
