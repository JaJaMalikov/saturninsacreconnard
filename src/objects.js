const objects = [];
let selected = null;
let svgRoot, pantinRoot;
let selectionCallbacks = {};

function applyTransform(obj) {
  obj.el.setAttribute('transform',
    `translate(${obj.tx},${obj.ty}) rotate(${obj.rotate}) scale(${obj.scale})`);
}

function select(obj) {
  selected = obj;
  if (selectionCallbacks.onSelect) {
    selectionCallbacks.onSelect(obj);
  }
}

export function getSelectedObject() {
  return selected;
}

export function updateSelectedTransform(key, delta) {
  if (!selected) return;
  if (key === 'scale') {
    selected.scale = Math.min(Math.max(selected.scale + delta, 0.1), 10);
  } else if (key === 'rotate') {
    selected.rotate = ((selected.rotate + delta) % 360 + 360) % 360;
  }
  applyTransform(selected);
  if (selectionCallbacks.onSelect) selectionCallbacks.onSelect(selected);
}

export function attachSelected(flag) {
  if (!selected) return;
  selected.attached = flag;
  if (flag) {
    pantinRoot.appendChild(selected.el);
  } else {
    svgRoot.appendChild(selected.el);
  }
  updateZ(selected.z || 'front');
}

export function updateZ(position) {
  if (!selected) return;
  selected.z = position;
  if (selected.attached) {
    if (position === 'front') {
      pantinRoot.appendChild(selected.el);
    } else {
      pantinRoot.insertBefore(selected.el, pantinRoot.firstChild);
    }
  } else {
    if (position === 'front') {
      svgRoot.appendChild(selected.el);
    } else {
      svgRoot.insertBefore(selected.el, pantinRoot);
    }
  }
}

function createObject(file) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.classList.add('scene-object');
  const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `assets/objets/${file}`);
  img.setAttribute('x', 0);
  img.setAttribute('y', 0);
  img.setAttribute('width', 100);
  img.setAttribute('height', 100);
  g.appendChild(img);
  svgRoot.appendChild(g);

  const obj = { el: g, name: file, tx: 0, ty: 0, scale: 1, rotate: 0, attached: false, z: 'front' };
  objects.push(obj);

  interact(g).draggable({
    listeners: {
      move (event) {
        obj.tx += event.dx;
        obj.ty += event.dy;
        applyTransform(obj);
      }
    }
  });

  g.addEventListener('pointerdown', e => {
    e.stopPropagation();
    select(obj);
  });

  applyTransform(obj);
  return obj;
}

export function initObjects(svgElement, pantinRootGroup, callbacks = {}) {
  svgRoot = svgElement;
  pantinRoot = pantinRootGroup;
  selectionCallbacks = callbacks;

  const selectEl = document.getElementById('object-select');
  const addBtn = document.getElementById('add-object');

  fetch('assets/objets/manifest.json')
    .then(resp => resp.json())
    .then(list => {
      list.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        selectEl.appendChild(opt);
      });
    }).catch(err => console.error('Manifest objets introuvable', err));

  addBtn.addEventListener('click', () => {
    const file = selectEl.value;
    if (!file) return;
    const obj = createObject(file);
    select(obj);
  });

  svgElement.addEventListener('pointerdown', () => {
    select(null);
  });
}

export function exportObjects() {
  return objects.map(o => ({
    name: o.name,
    tx: o.tx,
    ty: o.ty,
    scale: o.scale,
    rotate: o.rotate,
    attached: o.attached,
    z: o.z,
  }));
}

export function importObjects(list = []) {
  list.forEach(data => {
    const obj = createObject(data.name);
    obj.tx = data.tx;
    obj.ty = data.ty;
    obj.scale = data.scale;
    obj.rotate = data.rotate;
    obj.attached = data.attached;
    obj.z = data.z || 'front';
    applyTransform(obj);
    if (obj.attached) {
      pantinRoot.appendChild(obj.el);
    }
    const prev = selected;
    selected = obj;
    updateZ(obj.z);
    selected = prev;
  });
}
