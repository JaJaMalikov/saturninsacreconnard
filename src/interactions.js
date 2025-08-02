// src/interactions.js

const PANTIN_STATE_KEY = 'pantinGlobalState';

// --- State Management ---
const pantinState = {
  tx: 0, ty: 0,
  scale: 1,
  rotate: 0,
  rootGroup: null,
  svgElement: null,
};

function saveGlobalState() {
  const stateToSave = {
    tx: pantinState.tx,
    ty: pantinState.ty,
    scale: pantinState.scale,
    rotate: pantinState.rotate,
  };
  localStorage.setItem(PANTIN_STATE_KEY, JSON.stringify(stateToSave));
}

function loadGlobalState() {
  const saved = localStorage.getItem(PANTIN_STATE_KEY);
  if (saved) {
    try {
      const loaded = JSON.parse(saved);
      pantinState.tx = loaded.tx || 0;
      pantinState.ty = loaded.ty || 0;
      pantinState.scale = loaded.scale || 1;
      pantinState.rotate = loaded.rotate || 0;
    } catch (e) {
      console.error("Failed to load pantin state:", e);
    }
  }
}

function getGrabCenter() {
  const grabEl = pantinState.rootGroup.querySelector('#torse');
  if (!grabEl) return { x: 0, y: 0 };
  const box = grabEl.getBBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function applyGlobalTransform() {
  if (!pantinState.rootGroup) return;
  const center = getGrabCenter();
  pantinState.rootGroup.setAttribute('transform',
    `translate(${pantinState.tx}, ${pantinState.ty}) ` +
    `rotate(${pantinState.rotate}, ${center.x}, ${center.y}) ` +
    `scale(${pantinState.scale})`
  );
}

// --- Global Interactions (Sliders & Drag) ---
export function setupPantinGlobalInteractions(svgElement, options) {
  const { rootGroupId, grabId, scaleSliderId, rotateSliderId } = options;
  pantinState.svgElement = svgElement;
  pantinState.rootGroup = svgElement.querySelector(`#${rootGroupId}`);
  const grabEl = svgElement.querySelector(`#${grabId}`);
  const scaleSlider = document.getElementById(scaleSliderId);
  const rotateSlider = document.getElementById(rotateSliderId);

  if (!pantinState.rootGroup || !grabEl || !scaleSlider || !rotateSlider) {
    console.error("Missing elements for global interactions.");
    return;
  }

  loadGlobalState();

  scaleSlider.value = pantinState.scale;
  rotateSlider.value = pantinState.rotate;

  scaleSlider.addEventListener('input', e => {
    pantinState.scale = parseFloat(e.target.value);
    applyGlobalTransform();
    saveGlobalState();
  });

  rotateSlider.addEventListener('input', e => {
    pantinState.rotate = parseFloat(e.target.value);
    applyGlobalTransform();
    saveGlobalState();
  });

  let isDragging = false;
  let startPt = { x: 0, y: 0 };

  grabEl.style.cursor = 'move';
  grabEl.addEventListener('mousedown', e => {
    isDragging = true;
    startPt = getSVGCoords(e);
    grabEl.style.cursor = 'grabbing';
    e.preventDefault();
    e.stopPropagation();
  });

  svgElement.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const pt = getSVGCoords(e);
    const dx = (pt.x - startPt.x);
    const dy = (pt.y - startPt.y);
    pantinState.tx += dx;
    pantinState.ty += dy;
    startPt = pt;
    applyGlobalTransform();
  });

  const stopDragging = () => {
    if (!isDragging) return;
    isDragging = false;
    grabEl.style.cursor = 'move';
    saveGlobalState();
  };

  svgElement.addEventListener('mouseup', stopDragging);
  svgElement.addEventListener('mouseleave', stopDragging);

  applyGlobalTransform();
}

// --- Member Rotations (The Correct, Relative-Drag Method with Correct Coordinates) ---
export function setupInteractions(svgElement, memberList, pivots, timeline) {
  memberList.forEach(id => {
    const el = svgElement.querySelector(`#${id}`);
    if (!el || !el.parentNode) return;

    const pivotInParentCoords = pivots[id];
    if (!pivotInParentCoords) return;

    let isRotating = false;
    let currentAngle = 0;
    let startAngle = 0;
    let startVector = { x: 0, y: 0 };

    el.style.cursor = "grab";

    const startRotation = (e) => {
      isRotating = true;
      el.style.cursor = "grabbing";
      e.preventDefault();
      e.stopPropagation();

      const localMousePoint = getLocalMousePoint(e, el.parentNode);

      startAngle = getElementRotation(el);
      startVector = {
        x: localMousePoint.x - pivotInParentCoords.x,
        y: localMousePoint.y - pivotInParentCoords.y,
      };
      
      svgElement.addEventListener('mousemove', processRotation);
      svgElement.addEventListener('mouseup', stopRotation);
      svgElement.addEventListener('mouseleave', stopRotation);
    };

    const processRotation = (e) => {
      if (!isRotating) return;

      const localMousePoint = getLocalMousePoint(e, el.parentNode);

      const currentVector = {
        x: localMousePoint.x - pivotInParentCoords.x,
        y: localMousePoint.y - pivotInParentCoords.y,
      };

      const cross = startVector.x * currentVector.y - startVector.y * currentVector.x;
      const dot = startVector.x * currentVector.x + startVector.y * currentVector.y;
      const deltaAngle = Math.atan2(cross, dot);

      currentAngle = startAngle + deltaAngle * (180 / Math.PI);

      el.dataset.rotate = currentAngle;
      setRotation(el, currentAngle, pivotInParentCoords);
      timeline.updateMember(id, { rotate: currentAngle });
    };

    const stopRotation = () => {
      if (!isRotating) return;
      isRotating = false;
      el.style.cursor = "grab";
      svgElement.removeEventListener('mousemove', processRotation);
      svgElement.removeEventListener('mouseup', stopRotation);
      svgElement.removeEventListener('mouseleave', stopRotation);
    };

    el.addEventListener('mousedown', startRotation);
  });
}

// --- Utility Functions ---

function getSVGCoords(evt) {
  const pt = pantinState.svgElement.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  return pt.matrixTransform(pantinState.svgElement.getScreenCTM().inverse());
}

function getLocalMousePoint(evt, parentElement) {
    const mousePoint = getSVGCoords(evt);
    const toParentLocalMatrix = parentElement.getCTM().inverse();
    return mousePoint.matrixTransform(toParentLocalMatrix);
}

function getElementRotation(el) {
  const transform = el.getAttribute('transform') || '';
  const match = /rotate\(([-\d.]+)/.exec(transform);
  return match ? parseFloat(match[1]) : 0;
}

function setRotation(el, angleDeg, pivot) {
  const base = (el.getAttribute('transform') || '').replace(/rotate\([^)]+\)/, '').trim();
  const rotateStr = `rotate(${angleDeg},${pivot.x},${pivot.y})`;
  el.setAttribute('transform', `${base} ${rotateStr}`.trim());
}
