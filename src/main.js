import { initOnionSkin, renderOnionSkins } from './onionSkin.js';
import { loadSVG } from './svgLoader.js';
import { Timeline } from './timeline.js';
import { setupInteractions, setupPantinGlobalInteractions } from './interactions.js';
import { initUI } from './ui.js';
import { debugLog } from './debug.js';
import { setSelection, getSelection } from './selection.js';
import CONFIG from './config.js';

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
    const selectedNameEl = document.getElementById('selected-element-name');

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

    const objectElements = {};
    const objectCenters = {};

    setSelection({ type: 'pantin', id: null, element: pantinRootGroup });
    selectedNameEl.textContent = 'Pantin';

    async function loadObjectElement(src, id) {
      if (src.endsWith('.svg')) {
        const res = await fetch(src);
        const txt = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(txt, 'image/svg+xml');
        const el = doc.documentElement;
        el.setAttribute('id', id);
        return el;
      } else {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        el.setAttribute('href', src);
        el.setAttribute('id', id);
        return el;
      }
    }

    function addObjectToDOM(el, id, def) {
      el.setAttribute('data-object', id);
      if (def.attach) {
        if (def.front) pantinRootGroup.appendChild(el); else pantinRootGroup.insertBefore(el, pantinRootGroup.firstChild);
      } else {
        if (def.front) svgElement.appendChild(el); else svgElement.insertBefore(el, pantinRootGroup);
      }
      const bbox = el.getBBox();
      objectElements[id] = el;
      objectCenters[id] = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
      setupObjectInteraction(el, id);
    }

    async function createObject(id, def) {
      const el = await loadObjectElement(`assets/objets/${def.src}`, id);
      addObjectToDOM(el, id, def);
    }

    function getSVGCoords(evt) {
      const pt = svgElement.createSVGPoint();
      pt.x = evt.clientX;
      pt.y = evt.clientY;
      return pt.matrixTransform(svgElement.getScreenCTM().inverse());
    }

    function setupObjectInteraction(el, id) {
      let dragging = false;
      let startPt;
      el.style.cursor = 'move';
      const onMove = e => {
        if (!dragging) return;
        const pt = getSVGCoords(e);
        const state = timeline.getCurrentFrame().objects[id];
        timeline.updateObject(id, {
          tx: state.tx + (pt.x - startPt.x),
          ty: state.ty + (pt.y - startPt.y),
        });
        startPt = pt;
        onFrameChange();
      };
      const endDrag = e => {
        if (!dragging) return;
        dragging = false;
        svgElement.removeEventListener('pointermove', onMove);
        onSave();
      };
      const onPointerDown = e => {
        e.stopPropagation();
        setSelection({ type: 'object', id, element: el });
        selectedNameEl.textContent = id;
        onFrameChange();
        dragging = true;
        startPt = getSVGCoords(e);
        el.setPointerCapture && el.setPointerCapture(e.pointerId);
        svgElement.addEventListener('pointermove', onMove);
      };
      el.addEventListener('pointerdown', onPointerDown);
      svgElement.addEventListener('pointerup', endDrag);
      svgElement.addEventListener('pointerleave', endDrag);
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
        for (const [id, def] of Object.entries(timeline.objects)) {
          await createObject(id, def);
        }
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

      // Apply to objects
      Object.keys(objectElements).forEach(id => {
        const objState = frame.objects[id];
        if (!objState) return;
        const ctr = objectCenters[id];
        const el = objectElements[id];
        el.setAttribute('transform', `translate(${objState.tx},${objState.ty}) rotate(${objState.rotate},${ctr.x},${ctr.y}) scale(${objState.scale})`);
      });

      const sel = getSelection();
      if (sel.type === 'pantin') {
        scaleValueEl.textContent = frame.transform.scale.toFixed(2);
        rotateValueEl.textContent = Math.round(frame.transform.rotate);
      } else if (sel.type === 'object') {
        const obj = frame.objects[sel.id];
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

    const objectSelect = document.getElementById('object-select');
    const addObjectBtn = document.getElementById('add-object-btn');
    const frontChk = document.getElementById('object-front');
    const attachChk = document.getElementById('object-attach');

    fetch('assets/objets/manifest.json')
      .then(r => r.json())
      .then(list => {
        list.forEach(name => {
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = name;
          objectSelect.appendChild(opt);
        });
      });

    addObjectBtn.addEventListener('click', async () => {
      const file = objectSelect.value;
      if (!file) return;
      const id = `obj_${Date.now()}`;
      const def = { src: file, attach: attachChk.checked, front: frontChk.checked };
      timeline.addObject(id, def);
      await createObject(id, def);
      setSelection({ type: 'object', id, element: objectElements[id] });
      selectedNameEl.textContent = id;
      onFrameChange();
      onSave();
    });

    debugLog("Initializing UI...");
    initUI(timeline, onFrameChange, onSave);

    grabEl?.addEventListener('pointerdown', () => {
      setSelection({ type: 'pantin', id: null, element: pantinRootGroup });
      selectedNameEl.textContent = 'Pantin';
      onFrameChange();
    });

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

