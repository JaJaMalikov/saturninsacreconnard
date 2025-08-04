// src/interactions.js

import { debugLog } from './debug.js';

/** Setup global interactions: drag on torse, scale & rotate sliders. */
export function setupPantinGlobalInteractions(svgElement, options, timeline, onUpdate, onEnd) {
  debugLog("setupPantinGlobalInteractions called.");
  const { rootGroupId, grabId } = options;
  const rootGroup = svgElement.querySelector(`#${rootGroupId}`);
  const grabEl = svgElement.querySelector(`#${grabId}`);
  debugLog('Grab element:', grabEl); // Ligne de débogage

  if (!rootGroup || !grabEl) {
    console.warn("Missing elements for global pantin interactions.", { pantinRoot: rootGroup, grabEl });
    return () => {};
  }

  let dragging = false;
  let startPt;
  grabEl.style.cursor = 'move';

  const onMove = e => {
    if (!dragging) return;
    debugLog("Global drag: pointermove");
    const pt = getSVGCoords(e);
    const frame = timeline.getCurrentFrame();
    timeline.updateTransform({
      tx: frame.transform.tx + (pt.x - startPt.x),
      ty: frame.transform.ty + (pt.y - startPt.y),
    });
    startPt = pt;
    onUpdate();
  };

  const endDrag = e => {
    if (!dragging) return;
    debugLog("Global drag: pointerup/pointerleave");
    dragging = false;
    grabEl.style.cursor = 'move';
    grabEl.releasePointerCapture && grabEl.releasePointerCapture(e.pointerId);
    svgElement.removeEventListener('pointermove', onMove);
    onEnd();
  };

  const onPointerDown = e => {
    debugLog("Global drag: pointerdown");
    dragging = true;
    startPt = getSVGCoords(e);
    grabEl.style.cursor = 'grabbing';
    grabEl.setPointerCapture(e.pointerId);
    svgElement.addEventListener('pointermove', onMove);
    e.preventDefault();
  };

  grabEl.addEventListener('pointerdown', onPointerDown);
  svgElement.addEventListener('pointerup', endDrag);
  svgElement.addEventListener('pointerleave', endDrag);

  function getSVGCoords(evt) {
    const pt = svgElement.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svgElement.getScreenCTM().inverse());
  }

  return () => {
    grabEl.removeEventListener('pointerdown', onPointerDown);
    svgElement.removeEventListener('pointermove', onMove);
    svgElement.removeEventListener('pointerup', endDrag);
    svgElement.removeEventListener('pointerleave', endDrag);
  };
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
  debugLog("setupInteractions (members) called.");
  // Terminal mappings (IDs of end segments)
  const terminalMap = {
    avant_bras_droite: 'main_droite',
    avant_bras_gauche: 'main_gauche',
    tibia_droite: 'pied_droite',
    tibia_gauche: 'pied_gauche',
  };

  const cleanupFns = [];

  memberList.forEach(id => {
    const seg = svgElement.getElementById(id);
    if (!seg) {
      console.warn(`Segment ${id} not found.`);
      return;
    }
    const termEl = svgElement.getElementById(terminalMap[id] || id);

    let rotating = false;
    let baseOri = 0;
    let pivotScreen;
    const pivotLocal = pivots[id];

    seg.style.cursor = 'grab';

    const onMove = e => {
      if (!rotating) return;
      debugLog(`Member ${id}: pointermove`);
      // angle pivotScreen→cursor (screen coords)
      const mouseAng = Math.atan2(
        e.clientY - pivotScreen.y,
        e.clientX - pivotScreen.x
      ) * 180 / Math.PI;
      let newAng = ((mouseAng - baseOri + 180) % 360) - 180;
      timeline.updateMember(id, { rotate: newAng });
      onUpdate();
    };

    const onUp = e => {
      debugLog(`Member ${id}: pointerup/pointerleave`);
      rotating = false;
      seg.style.cursor = 'grab';
      seg.releasePointerCapture && seg.releasePointerCapture(e.pointerId);
      svgElement.removeEventListener('pointermove', onMove);
      onEnd();
    };

    const onPointerDown = e => {
      debugLog(`Member ${id}: pointerdown`);
      e.stopPropagation(); e.preventDefault();
      rotating = true;
      seg.setPointerCapture(e.pointerId);
      seg.style.cursor = 'grabbing';

      // compute pivot screen coords (includes global transform)
      const pPt = svgElement.createSVGPoint();
      pPt.x = pivotLocal.x; pPt.y = pivotLocal.y;
      pivotScreen = pPt.matrixTransform(seg.parentNode.getScreenCTM());

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
    };

    seg.addEventListener('pointerdown', onPointerDown);
    cleanupFns.push(() => seg.removeEventListener('pointerdown', onPointerDown));
  });

  return () => cleanupFns.forEach(fn => fn());
}

