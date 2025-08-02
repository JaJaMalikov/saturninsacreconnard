// src/interactions.js

// --- Global State Management ---
const PANTIN_STATE_KEY = 'pantinGlobalState';
const pantinState = {
  tx: 0,
  ty: 0,
  scale: 1,
  rotate: 0,
  rootGroup: null,
  svgElement: null,
};

function saveGlobalState() {
  localStorage.setItem(
    PANTIN_STATE_KEY,
    JSON.stringify({
      tx: pantinState.tx,
      ty: pantinState.ty,
      scale: pantinState.scale,
      rotate: pantinState.rotate,
    })
  );
}

function loadGlobalState() {
  const saved = localStorage.getItem(PANTIN_STATE_KEY);
  if (!saved) return;
  try {
    const { tx = 0, ty = 0, scale = 1, rotate = 0 } = JSON.parse(saved);
    pantinState.tx = tx;
    pantinState.ty = ty;
    pantinState.scale = scale;
    pantinState.rotate = rotate;
  } catch {
    // ignore
  }
}

function getGrabCenter() {
  const el = pantinState.rootGroup.querySelector('#torse');
  const box = el.getBBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function applyGlobalTransform() {
  const center = getGrabCenter();
  pantinState.rootGroup.setAttribute(
    'transform',
    `translate(${pantinState.tx},${pantinState.ty}) ` +
      `rotate(${pantinState.rotate},${center.x},${center.y}) ` +
      `scale(${pantinState.scale})`
  );
}

/** Setup global interactions: drag on torse, scale & rotate sliders. */
export function setupPantinGlobalInteractions(svgElement, options) {
  const { rootGroupId, grabId, scaleSliderId, rotateSliderId } = options;
  pantinState.svgElement = svgElement;
  pantinState.rootGroup = svgElement.querySelector(`#${rootGroupId}`);
  const grabEl = svgElement.querySelector(`#${grabId}`);
  const scaleSlider = document.getElementById(scaleSliderId);
  const rotateSlider = document.getElementById(rotateSliderId);
  if (!pantinState.rootGroup || !grabEl || !scaleSlider || !rotateSlider) return;

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

  let dragging = false;
  let startPt;
  grabEl.style.cursor = 'move';
  grabEl.addEventListener('mousedown', e => {
    dragging = true;
    startPt = getSVGCoords(e);
    grabEl.style.cursor = 'grabbing';
    e.preventDefault();
  });
  svgElement.addEventListener('mousemove', e => {
    if (!dragging) return;
    const pt = getSVGCoords(e);
    pantinState.tx += pt.x - startPt.x;
    pantinState.ty += pt.y - startPt.y;
    startPt = pt;
    applyGlobalTransform();
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    grabEl.style.cursor = 'move';
    saveGlobalState();
  };
  svgElement.addEventListener('mouseup', endDrag);
  svgElement.addEventListener('mouseleave', endDrag);
  applyGlobalTransform();
}

// --- Utilities ---
function getSVGCoords(evt) {
  const pt = pantinState.svgElement.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  return pt.matrixTransform(pantinState.svgElement.getScreenCTM().inverse());
}

function applyRotation(el, angle, pivot) {
  el.setAttribute('transform', `rotate(${angle},${pivot.x},${pivot.y})`);
}

/**
 * Setup individual segment rotations: each segment points toward cursor,
 * respecting global transforms on rootGroup.
 * @param svgElement - the SVG DOM element
 * @param memberList - array of string IDs for segments
 * @param pivots - not used here
 * @param timeline - has updateMember(id, state)
 */
export function setupInteractions(svgElement, memberList, _, timeline) {
  // Anatomical pivot and terminal mappings (IDs of <g> elements)
  const pivotMap = {
    tete: 'cou',
    bras_gauche: 'epaule_gauche',
    avant_bras_gauche: 'coude_gauche',
    bras_droite: 'epaule_droite',
    avant_bras_droite: 'coude_droite',
    jambe_gauche: 'hanche_gauche',
    tibia_gauche: 'genou_gauche',
    jambe_droite: 'hanche_droite',
    tibia_droite: 'genou_droite',
  };
  const terminalMap = {
    avant_bras_droite: 'main_droite',
    avant_bras_gauche: 'main_gauche',
    tibia_droite: 'pied_droite',
    tibia_gauche: 'pied_gauche',
  };

  memberList.forEach(id => {
    const seg = svgElement.getElementById(id);
    if (!seg) return;
    const pivotEl = svgElement.getElementById(pivotMap[id] || id);
    const termEl = svgElement.getElementById(terminalMap[id] || id);

    let rotating = false;
    let baseOri = 0;
    let pivotScreen;
    let pivotLocal;

    seg.style.cursor = 'grab';
    seg.addEventListener('pointerdown', e => {
      e.stopPropagation(); e.preventDefault();
      rotating = true;
      seg.setPointerCapture(e.pointerId);
      seg.style.cursor = 'grabbing';

      // compute pivot in viewBox coords
      const pBox = pivotEl.getBBox();
      pivotLocal = { x: pBox.x + pBox.width / 2, y: pBox.y + pBox.height / 2 };

      // compute pivot screen coords (includes global transform)
      const pPt = svgElement.createSVGPoint();
      pPt.x = pivotLocal.x; pPt.y = pivotLocal.y;
      pivotScreen = pPt.matrixTransform(pivotEl.getScreenCTM());

      // compute terminal screen coords
      const tBox = termEl.getBBox();
      const tPt = svgElement.createSVGPoint();
      tPt.x = tBox.x + tBox.width / 2;
      tPt.y = tBox.y + tBox.height / 2;
      const termScreen = tPt.matrixTransform(termEl.getScreenCTM());

      // initial angle (pivot→terminal)
      baseOri = Math.atan2(
        termScreen.y - pivotScreen.y,
        termScreen.x - pivotScreen.x
      ) * 180 / Math.PI;

      svgElement.addEventListener('pointermove', onMove);
      svgElement.addEventListener('pointerup', onUp, { once: true });
      svgElement.addEventListener('pointerleave', onUp, { once: true });
    });

    function onMove(e) {
      if (!rotating) return;
      // angle pivotScreen→cursor (screen coords)
      const mouseAng = Math.atan2(
        e.clientY - pivotScreen.y,
        e.clientX - pivotScreen.x
      ) * 180 / Math.PI;
      let newAng = ((mouseAng - baseOri + 180) % 360) - 180;
      applyRotation(seg, newAng, pivotLocal);
      seg.dataset.rotate = newAng;
      timeline.updateMember(id, { rotate: newAng });
    }

    function onUp(e) {
      rotating = false;
      seg.style.cursor = 'grab';
      seg.releasePointerCapture && seg.releasePointerCapture(e.pointerId);
      svgElement.removeEventListener('pointermove', onMove);
    }
  });
}

