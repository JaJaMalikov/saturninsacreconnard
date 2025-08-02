// src/interactions.js

// --- Global State Management ---
const pantinState = {
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
  if (!el) return { x: 0, y: 0 };
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
export function setupPantinGlobalInteractions(svgElement, options, timeline, onUpdate, onEnd) {
  console.log("setupPantinGlobalInteractions called.");
  const { rootGroupId, grabId } = options;
  pantinState.svgElement = svgElement;
  pantinState.rootGroup = svgElement.querySelector(`#${rootGroupId}`);
  const grabEl = svgElement.querySelector(`#${grabId}`);
  console.log('Grab element:', grabEl); // Ligne de débogage

  if (!pantinState.rootGroup || !grabEl) {
    console.warn("Missing elements for global pantin interactions.", {pantinRoot: pantinState.rootGroup, grabEl});
    return;
  }

  let dragging = false;
  let startPt;
  grabEl.style.cursor = 'move';
  grabEl.addEventListener('mousedown', e => {
    console.log("Global drag: mousedown");
    dragging = true;
    startPt = getSVGCoords(e);
    grabEl.style.cursor = 'grabbing';
    e.preventDefault();
  });

  svgElement.addEventListener('mousemove', e => {
    if (!dragging) return;
    console.log("Global drag: mousemove");
    const pt = getSVGCoords(e);
    const frame = timeline.getCurrentFrame();
    timeline.updateTransform({
      tx: frame.transform.tx + (pt.x - startPt.x),
      ty: frame.transform.ty + (pt.y - startPt.y),
    });
    startPt = pt;
    onUpdate();
  });

  const endDrag = () => {
    if (!dragging) return;
    console.log("Global drag: mouseup/mouseleave");
    dragging = false;
    grabEl.style.cursor = 'move';
    onEnd();
  };
  svgElement.addEventListener('mouseup', endDrag);
  svgElement.addEventListener('mouseleave', endDrag);
}

// --- Utilities ---
function getSVGCoords(evt) {
  const pt = pantinState.svgElement.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  return pt.matrixTransform(pantinState.svgElement.getScreenCTM().inverse());
}

/**
 * Setup individual segment rotations: each segment points toward cursor,
 * respecting global transforms on rootGroup.
 * @param svgElement - the SVG DOM element
 * @param memberList - array of string IDs for segments
 * @param pivots - not used here
 * @param timeline - has updateMember(id, state)
 */
export function setupInteractions(svgElement, memberList, pivots, timeline, onUpdate, onEnd) {
  console.log("setupInteractions (members) called.");
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
    if (!seg) {
      console.warn(`Segment ${id} not found.`);
      return;
    }
    const pivotEl = svgElement.getElementById(pivotMap[id] || id);
    const termEl = svgElement.getElementById(terminalMap[id] || id);

    let rotating = false;
    let baseOri = 0;
    let pivotScreen;
    let pivotLocal;

    seg.style.cursor = 'grab';
    seg.addEventListener('pointerdown', e => {
      console.log(`Member ${id}: pointerdown`);
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
      console.log(`Member ${id}: pointermove`);
      // angle pivotScreen→cursor (screen coords)
      const mouseAng = Math.atan2(
        e.clientY - pivotScreen.y,
        e.clientX - pivotScreen.x
      ) * 180 / Math.PI;
      let newAng = ((mouseAng - baseOri + 180) % 360) - 180;
      timeline.updateMember(id, { rotate: newAng });
      onUpdate();
    }

    function onUp(e) {
      console.log(`Member ${id}: pointerup/pointerleave`);
      rotating = false;
      seg.style.cursor = 'grab';
      seg.releasePointerCapture && seg.releasePointerCapture(e.pointerId);
      svgElement.removeEventListener('pointermove', onMove);
      onEnd();
    }
  });
}

