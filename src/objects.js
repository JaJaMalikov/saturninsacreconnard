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

  function addObject(src, layer = 'front') {
    const id = `obj-${Date.now()}`;
    timeline.addObject(id, { x: 0, y: 0, scale: 1, rotate: 0, layer, attachedTo: null, src: `assets/objets/${src}` });
    const img = document.createElementNS(ns, 'image');
    img.setAttribute('href', `assets/objets/${src}`);
    img.setAttribute('width', 100);
    img.setAttribute('height', 100);
    img.id = id;
    img.classList.add('scene-object');
    (layer === 'front' ? frontLayer : backLayer).appendChild(img);
    setupInteract(img, id);
    selectObject(id);
    onUpdate();
    onSave();
    return id;
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
    window.interact(el).draggable({
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
    }).gesturable({
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
    });
    el.addEventListener('click', () => selectObject(id));
  }

  function renderObjects() {
    const frame = timeline.getCurrentFrame();
    const existing = new Set();
    Object.entries(frame.objects).forEach(([id, obj]) => {
      existing.add(id);
      let el = svgElement.getElementById(id);
      if (!el) {
        el = document.createElementNS(ns, 'image');
        el.setAttribute('href', obj.src);
        el.setAttribute('width', 100);
        el.setAttribute('height', 100);
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
          const frame = timeline.getCurrentFrame();
          const segAngle = frame.members[obj.attachedTo]?.rotate || 0;
          const totalRotate = obj.rotate + frame.transform.rotate + segAngle;
          const totalScale = obj.scale * frame.transform.scale;
          el.setAttribute('transform', `translate(${g.x},${g.y}) rotate(${totalRotate}) scale(${totalScale})`);
        }
      } else {
        const frame = timeline.getCurrentFrame();
        const totalRotate = obj.rotate + frame.transform.rotate;
        const totalScale = obj.scale * frame.transform.scale;
        el.setAttribute('transform', `translate(${obj.x + frame.transform.tx},${obj.y + frame.transform.ty}) rotate(${totalRotate}) scale(${totalScale})`);
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
