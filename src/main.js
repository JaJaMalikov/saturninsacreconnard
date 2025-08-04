import { initOnionSkin, renderOnionSkins } from './onionSkin.js';
import { loadSVG } from './svgLoader.js';
import { Timeline } from './timeline.js';
import { setupInteractions, setupPantinGlobalInteractions } from './interactions.js';
import { initUI } from './ui.js';
import { debugLog } from './debug.js';
import CONFIG from './config.js';
import { appState } from './state.js';

const { SVG_URL, THEATRE_ID, PANTIN_ROOT_ID, GRAB_ID } = CONFIG;

async function main() {
  debugLog("main() started");
  try {
    const { svgElement, memberList, pivots } = await loadSVG(SVG_URL, THEATRE_ID);
    debugLog("SVG loaded, Timeline instantiated.");
    const timeline = new Timeline(memberList);

    // Cache frequently accessed DOM elements
    const scaleValueEl = document.getElementById('scale-value');
    const rotateValueEl = document.getElementById('rotate-value');

    // Cache elements for transformations
    const pantinRootGroup = svgElement.querySelector(`#${PANTIN_ROOT_ID}`);
    const grabEl = pantinRootGroup?.querySelector(`#${GRAB_ID}`);
    const grabBox = grabEl ? grabEl.getBBox() : null;
    const grabCenter = grabBox
      ? { x: grabBox.x + grabBox.width / 2, y: grabBox.y + grabBox.height / 2 }
      : { x: 0, y: 0 };

    const memberElements = {};
    memberList.forEach(id => {
      const el = pantinRootGroup?.querySelector(`#${id}`);
      if (el) memberElements[id] = el;
    });
    pantinRootGroup._memberMap = memberElements;

    // Object layers
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const objectsBackGroup = document.createElementNS(SVG_NS, 'g');
    objectsBackGroup.id = 'objects-back';
    pantinRootGroup.insertBefore(objectsBackGroup, pantinRootGroup.firstChild);
    const objectsFrontGroup = document.createElementNS(SVG_NS, 'g');
    objectsFrontGroup.id = 'objects-front';
    pantinRootGroup.appendChild(objectsFrontGroup);
    const objectElements = new Map();

    function renderObjects(frame) {
      frame.objects.forEach(obj => {
        const el = objectElements.get(obj.id);
        if (!el) return;
        let t = '';
        if (obj.attachedTo) {
          const pivot = pivots[obj.attachedTo];
          const ang = frame.members[obj.attachedTo]?.rotate || 0;
          t = `rotate(${ang},${pivot.x},${pivot.y}) translate(${obj.tx},${obj.ty}) rotate(${obj.rotate}) scale(${obj.scale})`;
        } else {
          t = `translate(${obj.tx},${obj.ty}) rotate(${obj.rotate}) scale(${obj.scale})`;
        }
        el.setAttribute('transform', t);
      });
    }

    function selectPantin() {
      appState.selected = { type: 'pantin', id: null };
      document.dispatchEvent(new CustomEvent('selection-changed'));
    }

    function selectObject(id) {
      appState.selected = { type: 'object', id };
      document.dispatchEvent(new CustomEvent('selection-changed'));
    }

    svgElement.addEventListener('pointerdown', () => selectPantin());

    function getSVGCoords(evt) {
      const pt = svgElement.createSVGPoint();
      pt.x = evt.clientX;
      pt.y = evt.clientY;
      return pt.matrixTransform(svgElement.getScreenCTM().inverse());
    }

    function addObject(href, layer = 'front') {
      const id = `obj_${Date.now()}`;
      const g = document.createElementNS(SVG_NS, 'g');
      g.dataset.objId = id;
      const img = document.createElementNS(SVG_NS, 'image');
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', href);
      img.setAttribute('width', 100);
      img.setAttribute('height', 100);
      img.setAttribute('x', -50);
      img.setAttribute('y', -50);
      g.appendChild(img);
      if (layer === 'front') objectsFrontGroup.appendChild(g); else objectsBackGroup.appendChild(g);
      objectElements.set(id, g);

      let dragging = false;
      let startPt;
      const onMove = e => {
        if (!dragging) return;
        const pt = getSVGCoords(e);
        const dx = pt.x - startPt.x;
        const dy = pt.y - startPt.y;
        const frame = timeline.getCurrentFrame();
        const obj = frame.objects.find(o => o.id === id);
        timeline.updateObject(id, { tx: obj.tx + dx, ty: obj.ty + dy });
        startPt = pt;
        renderObjects(frame);
      };
      const endDrag = e => {
        if (!dragging) return;
        dragging = false;
        g.releasePointerCapture && g.releasePointerCapture(e.pointerId);
        svgElement.removeEventListener('pointermove', onMove);
        onSave();
      };
      g.addEventListener('pointerdown', e => {
        e.stopPropagation();
        dragging = true;
        startPt = getSVGCoords(e);
        g.setPointerCapture && g.setPointerCapture(e.pointerId);
        svgElement.addEventListener('pointermove', onMove);
        selectObject(id);
      });
      svgElement.addEventListener('pointerup', endDrag);
      svgElement.addEventListener('pointerleave', endDrag);

      timeline.addObject({ id, href, tx: 0, ty: 0, scale: 1, rotate: 0, attachedTo: null, layer });
      selectObject(id);
      onFrameChange();
      onSave();
    }

    function deleteObject(id) {
      timeline.deleteObject(id);
      const el = objectElements.get(id);
      if (el) el.remove();
      objectElements.delete(id);
      onFrameChange();
      onSave();
    }

    function setLayer(id, layer) {
      timeline.updateObjectAllFrames(id, { layer });
      const el = objectElements.get(id);
      if (el) {
        if (layer === 'front') objectsFrontGroup.appendChild(el); else objectsBackGroup.appendChild(el);
      }
      onFrameChange();
      onSave();
    }

    function attachObject(id, memberId) {
      const old = timeline.getCurrentFrame().objects.find(o => o.id === id);
      if (!old) return;
      const currentAttached = old.attachedTo;
      if (currentAttached) {
        const pivotOld = pivots[currentAttached];
        timeline.frames.forEach(f => {
          const o = f.objects.find(ob => ob.id === id);
          if (o) { o.tx += pivotOld.x; o.ty += pivotOld.y; }
        });
      }
      if (memberId) {
        const pivot = pivots[memberId];
        timeline.frames.forEach(f => {
          const o = f.objects.find(ob => ob.id === id);
          if (o) { o.tx -= pivot.x; o.ty -= pivot.y; o.attachedTo = memberId; }
        });
      } else {
        timeline.updateObjectAllFrames(id, { attachedTo: null });
      }
      onFrameChange();
      onSave();
    }

    // Function to apply a frame to a given SVG element (main pantin or ghost)
    const applyFrameToPantinElement = (targetFrame, targetRootGroup, elementMap = targetRootGroup._memberMap || memberElements) => {
      debugLog("Applying frame to element:", targetRootGroup, "Frame data:", targetFrame);
      const { tx, ty, scale, rotate } = targetFrame.transform;
      targetRootGroup.setAttribute(
        'transform',
        `translate(${tx},${ty}) rotate(${rotate},${grabCenter.x},${grabCenter.y}) scale(${scale})`
      );

      memberList.forEach(id => {
        const el = elementMap[id];
        if (!el) return;
        const pivot = pivots[id];
        const angle = targetFrame.members[id]?.rotate || 0;
        el.setAttribute('transform', `rotate(${angle},${pivot.x},${pivot.y})`);
      });
    };

    const onSave = () => {
      localStorage.setItem('animation', timeline.exportJSON());
      debugLog("Animation sauvegardée.");
    };

    const savedData = localStorage.getItem('animation');
    if (savedData) {
      try {
        timeline.importJSON(savedData);
        debugLog("Animation chargée depuis localStorage.");
      } catch (e) {
        console.warn("Impossible de charger l'animation sauvegardée:", e);
      }
    }

    const onFrameChange = () => {
      debugLog("onFrameChange triggered. Current frame:", timeline.current);
      const frame = timeline.getCurrentFrame();
      if (!frame) return;

      // Apply to main pantin
      applyFrameToPantinElement(frame, pantinRootGroup);
      renderObjects(frame);

      // Update inspector values
      if (appState.selected.type === 'pantin') {
        scaleValueEl.textContent = frame.transform.scale.toFixed(2);
        rotateValueEl.textContent = Math.round(frame.transform.rotate);
      } else {
        const obj = frame.objects.find(o => o.id === appState.selected.id);
        if (obj) {
          scaleValueEl.textContent = obj.scale.toFixed(2);
          rotateValueEl.textContent = Math.round(obj.rotate);
        }
      }

      // Render onion skins
      renderOnionSkins(timeline, applyFrameToPantinElement);
    };

    debugLog("Initializing Onion Skin...");
    initOnionSkin(svgElement, PANTIN_ROOT_ID, memberList);

    const interactionOptions = {
      rootGroupId: PANTIN_ROOT_ID,
      grabId: GRAB_ID,
    };

    debugLog("Setting up member interactions...");
    const teardownMembers = setupInteractions(svgElement, memberList, pivots, timeline, onFrameChange, onSave);
    debugLog("Setting up global pantin interactions...");
    const teardownGlobal = setupPantinGlobalInteractions(svgElement, interactionOptions, timeline, onFrameChange, onSave);

    debugLog("Initializing UI...");
    initUI(timeline, onFrameChange, onSave, { addObject, deleteObject, setLayer, attachObject, selectPantin }, memberList);

    window.addEventListener('beforeunload', () => {
      teardownMembers();
      teardownGlobal();
    });

  } catch (err) {
    console.error("Erreur d'initialisation:", err);
    alert(`Erreur fatale : ${err.message}`);
  }
}

document.addEventListener('DOMContentLoaded', main);

