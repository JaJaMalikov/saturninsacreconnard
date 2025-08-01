// src/interactions.js

export function setupInteractions(svgDoc, memberList, pivots, timeline) {
  memberList.forEach(id => {
    const el = svgDoc.getElementById(id);
    if (!el) return;
    const pivot = pivots[id];
    let isRotating = false;
    let startAngle = 0;
    let baseAngle = 0;

    el.style.cursor = "grab";

    el.addEventListener('mousedown', function(e) {
      isRotating = true;
      el.style.cursor = "grabbing";
      const pt = getSVGCoords(svgDoc, e);
      startAngle = Math.atan2(pt.y - pivot.y, pt.x - pivot.x);
      baseAngle = parseFloat(el.dataset.rotate) || 0;
      e.preventDefault();
      e.stopPropagation();
    });

    svgDoc.addEventListener('mousemove', function(e) {
      if (!isRotating) return;
      const pt = getSVGCoords(svgDoc, e);
      let angle = Math.atan2(pt.y - pivot.y, pt.x - pivot.x);
      let deltaDeg = (angle - startAngle) * 180 / Math.PI;
      let newAngle = baseAngle + deltaDeg;
      el.dataset.rotate = newAngle;
      setRotation(el, newAngle, pivot);
      timeline.updateMember(id, { rotate: newAngle });
      // Rien d'autre ne se passe
    });

    svgDoc.addEventListener('mouseup', function() {
      isRotating = false;
      el.style.cursor = "grab";
    });
    svgDoc.addEventListener('mouseleave', function() {
      isRotating = false;
      el.style.cursor = "grab";
    });
  });
}

function getSVGCoords(svgDoc, evt) {
  const pt = svgDoc.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  return svgDoc.documentElement.getScreenCTM()
    ? pt.matrixTransform(svgDoc.documentElement.getScreenCTM().inverse())
    : { x: evt.clientX, y: evt.clientY };
}

function setRotation(el, angleDeg, pivot) {
  let base = (el.getAttribute('transform') || '').replace(/rotate\([^)]+\)/, '').trim();
  let rotateStr = `rotate(${angleDeg},${pivot.x},${pivot.y})`;
  el.setAttribute('transform', `${base} ${rotateStr}`.trim());
}

/**
 * Ajoute la manipulation globale (déplacement, scale et rotation) à un pantin SVG
 * @param {SVGDocument} svgDoc
 * @param {Object} options :
 *    - rootGroupId : id du groupe racine du pantin (ex : "manu_test")
 *    - grabId      : id de l'élément qui sert de point de grab (ex : "torse")
 *    - onChange    : callback quand l'état change
 */
export function setupPantinGlobalInteractions(svgDoc, options) {
  const { rootGroupId, grabId, onChange } = options;
  const rootGroup = svgDoc.getElementById(rootGroupId);
  const grabEl = svgDoc.getElementById(grabId);
  if (!rootGroup || !grabEl) return;

  // Initial state
  if (!rootGroup.dataset.tx) rootGroup.dataset.tx = 0;
  if (!rootGroup.dataset.ty) rootGroup.dataset.ty = 0;
  if (!rootGroup.dataset.scale) rootGroup.dataset.scale = 1;
  if (!rootGroup.dataset.rotate) rootGroup.dataset.rotate = 0;

  // Calcul du point de grab = centre du bounding box de grabId
  function getGrabCenter() {
    const box = grabEl.getBBox();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  // Etat du drag
  let mode = null; // "move"
  let startPt = null;
  let startTransform = {};

  // Ajout de handles visuels (pour le déplacement)
  function createHandle(type, dx, dy, cursor, title) {
    const ns = "http://www.w3.org/2000/svg";
    const c = document.createElementNS(ns, "circle");
    const center = getGrabCenter();
    c.setAttribute("cx", center.x + dx);
    c.setAttribute("cy", center.y + dy);
    c.setAttribute("r", 10);
    c.setAttribute("fill", "#4cf");
    c.setAttribute("opacity", 0.6);
    c.setAttribute("cursor", cursor);
    c.setAttribute("data-handle", type);
    c.setAttribute("title", title);
    c.style.pointerEvents = "all";
    svgDoc.documentElement.appendChild(c);
    return c;
  }

  // Supprime tous les handles avant d'en ajouter
  function removeHandles() {
    svgDoc.querySelectorAll('circle[data-handle]').forEach(h => h.remove());
  }

  // Ajoute le handle de déplacement
  function addHandles() {
    removeHandles();
    // Move handle (au centre du torse), invisible
    const moveHandle = createHandle("move", 0, 0, "move", "Déplacer le pantin");
    moveHandle.setAttribute("opacity", 0);
  }

  addHandles();

  let handleActive = null;

  // Ecouteur de drag sur les handles
  svgDoc.addEventListener('mousedown', function(e) {
    const t = e.target;
    if (!t.hasAttribute('data-handle')) return;
    mode = t.getAttribute('data-handle');
    handleActive = t;
    startPt = getSVGCoords(svgDoc, e);
    // Stock la transform d'origine
    startTransform = {
      tx: parseFloat(rootGroup.dataset.tx) || 0,
      ty: parseFloat(rootGroup.dataset.ty) || 0,
      scale: parseFloat(rootGroup.dataset.scale) || 1,
      rotate: parseFloat(rootGroup.dataset.rotate) || 0
    };
    svgDoc.addEventListener('mousemove', onMove);
    svgDoc.addEventListener('mouseup', onUp);
    svgDoc.addEventListener('mouseleave', onUp);
    e.preventDefault();
    e.stopPropagation();
  });

  function onMove(e) {
    if (!mode) return;
    const pt = getSVGCoords(svgDoc, e);
    const center = getGrabCenter();
    if (mode === "move") {
      const dx = pt.x - startPt.x;
      const dy = pt.y - startPt.y;
      rootGroup.dataset.tx = startTransform.tx + dx;
      rootGroup.dataset.ty = startTransform.ty + dy;
    }
    applyTransform();
  }

  function onUp(e) {
    if (mode) {
      mode = null;
      handleActive = null;
      svgDoc.removeEventListener('mousemove', onMove);
      svgDoc.removeEventListener('mouseup', onUp);
      svgDoc.removeEventListener('mouseleave', onUp);
      if (typeof onChange === "function") onChange();
    }
  }

  function applyTransform() {
    const tx = parseFloat(rootGroup.dataset.tx) || 0;
    const ty = parseFloat(rootGroup.dataset.ty) || 0;
    const scale = parseFloat(rootGroup.dataset.scale) || 1;
    const angle = parseFloat(rootGroup.dataset.rotate) || 0;
    const center = getGrabCenter();
    // Transform = translate + rotate + scale autour du centre du torse
    // Important : l'ordre des transforms est crucial pour du SVG
    let t = `translate(${tx},${ty})`;
    let s = `scale(${scale})`;
    let r = `rotate(${angle},${center.x},${center.y})`;
    rootGroup.setAttribute('transform', `${t} ${r} ${s}`.trim());
    removeHandles();
    addHandles();
  }

  function setScale(val) {
    rootGroup.dataset.scale = val;
    applyTransform();
  }

  function setRotate(val) {
    rootGroup.dataset.rotate = val;
    applyTransform();
  }

  // Utilitaire pour coord écran → SVG
  function getSVGCoords(svgDoc, evt) {
    const pt = svgDoc.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return svgDoc.documentElement.getScreenCTM()
      ? pt.matrixTransform(svgDoc.documentElement.getScreenCTM().inverse())
      : { x: evt.clientX, y: evt.clientY };
  }

  return { setScale, setRotate };
}

