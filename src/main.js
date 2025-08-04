import { initOnionSkin, renderOnionSkins } from './onionSkin.js';
import { loadSVG } from './svgLoader.js';
import { Timeline } from './timeline.js';
import { setupInteractions, setupPantinGlobalInteractions } from './interactions.js';
import { initUI } from './ui.js';
import { debugLog } from './debug.js';
import CONFIG from './config.js';

const { SVG_URL, THEATRE_ID, PANTIN_ROOT_ID, GRAB_ID, OBJECT_ASSETS } = CONFIG;

async function main() {
  debugLog("main() started");
  try {
    const { svgElement, memberList, pivots } = await loadSVG(SVG_URL, THEATRE_ID);
    debugLog("SVG loaded, Timeline instantiated.");
    const timeline = new Timeline(memberList);

    // Cache frequently accessed DOM elements
    const scaleValueEl = document.getElementById('scale-value');
    const rotateValueEl = document.getElementById('rotate-value');
    const selectedElementNameEl = document.getElementById('selected-element-name');
    const objectSelectEl = document.getElementById('object-select');
    const addObjectBtn = document.getElementById('add-object');
    const deleteObjectBtn = document.getElementById('delete-object');
    const layerSelectEl = document.getElementById('layer-select');
    const attachSelectEl = document.getElementById('attach-select');

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

    // Populate object asset list and attachment options
    OBJECT_ASSETS.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      objectSelectEl.appendChild(opt);
    });
    attachSelectEl.appendChild(new Option('Aucun', ''));
    memberList.forEach(id => attachSelectEl.appendChild(new Option(id, id)));

    const objectsBehindGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    objectsBehindGroup.id = 'objects-behind';
    pantinRootGroup.parentNode.insertBefore(objectsBehindGroup, pantinRootGroup);

    const objectsFrontGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    objectsFrontGroup.id = 'objects-front';
    pantinRootGroup.parentNode.insertBefore(objectsFrontGroup, pantinRootGroup.nextSibling);

    const objectElements = {};
    let objectIdCounter = 0;

    const state = { selection: { type: 'pantin', id: null } };

    const svgPoint = svgElement.createSVGPoint();
    function getSVGCoords(evt) {
      svgPoint.x = evt.clientX;
      svgPoint.y = evt.clientY;
      return svgPoint.matrixTransform(svgElement.getScreenCTM().inverse());
    }

    function applyObjects(frame) {
      const objs = frame.objects || {};
      Object.entries(objs).forEach(([id, obj]) => {
        let el = objectElements[id];
        if (!el) {
          el = document.createElementNS('http://www.w3.org/2000/svg', 'image');
          el.setAttribute('href', `assets/objets/${obj.src}`);
          el.setAttribute('width', 100);
          el.setAttribute('height', 100);
          el.style.cursor = 'move';
          setupObjectDrag(el, id);
          objectElements[id] = el;
        }
        const parent = obj.attachTo
          ? memberElements[obj.attachTo]
          : (obj.front ? objectsFrontGroup : objectsBehindGroup);
        if (el.parentNode !== parent) parent.appendChild(el);
        el.setAttribute('transform', `translate(${obj.tx},${obj.ty}) rotate(${obj.rotate},50,50) scale(${obj.scale})`);
      });

      Object.keys(objectElements).forEach(id => {
        if (!(id in objs)) {
          objectElements[id].remove();
          delete objectElements[id];
        }
      });
    }

    function selectPantin() {
      state.selection = { type: 'pantin', id: null };
      selectedElementNameEl.textContent = 'Pantin';
      layerSelectEl.disabled = true;
      attachSelectEl.disabled = true;
      deleteObjectBtn.disabled = true;
      onFrameChange();
    }

    function selectObject(id) {
      state.selection = { type: 'object', id };
      selectedElementNameEl.textContent = id;
      layerSelectEl.disabled = false;
      attachSelectEl.disabled = false;
      deleteObjectBtn.disabled = false;
      onFrameChange();
    }

    function setupObjectDrag(el, id) {
      let dragging = false;
      let startPt;
      el.addEventListener('pointerdown', e => {
        dragging = true;
        startPt = getSVGCoords(e);
        selectObject(id);
        el.setPointerCapture(e.pointerId);
        e.stopPropagation();
      });
      svgElement.addEventListener('pointermove', e => {
        if (!dragging) return;
        const pt = getSVGCoords(e);
        const dx = pt.x - startPt.x;
        const dy = pt.y - startPt.y;
        const frame = timeline.getCurrentFrame();
        const obj = frame.objects[id];
        obj.tx += dx;
        obj.ty += dy;
        startPt = pt;
        applyObjects(frame);
      });
      svgElement.addEventListener('pointerup', e => {
        if (!dragging) return;
        dragging = false;
        el.releasePointerCapture(e.pointerId);
        onSave();
      });
    }

    function addObject(asset) {
      const id = `obj${++objectIdCounter}`;
      timeline.addObject(id, { src: asset, tx: 0, ty: 0, scale: 1, rotate: 0, front: false, attachTo: null });
      applyObjects(timeline.getCurrentFrame());
      selectObject(id);
      onSave();
    }

    function removeObject(id) {
      timeline.deleteObject(id);
      if (objectElements[id]) {
        objectElements[id].remove();
        delete objectElements[id];
      }
      selectPantin();
      onSave();
    }

    function setObjectLayer(id, front) {
      timeline.updateObject(id, { front });
      applyObjects(timeline.getCurrentFrame());
      onSave();
    }

    function attachObject(id, memberId) {
      timeline.updateObject(id, { attachTo: memberId || null });
      applyObjects(timeline.getCurrentFrame());
      onSave();
    }

    const onUpdateTransform = (key, delta) => {
      const frame = timeline.getCurrentFrame();
      if (state.selection.type === 'pantin') {
        const currentValue = frame.transform[key];
        let newValue = currentValue + delta;
        if (key === 'scale') {
          newValue = Math.min(Math.max(newValue, 0.1), 10);
        } else if (key === 'rotate') {
          newValue = ((newValue % 360) + 360) % 360;
        }
        timeline.updateTransform({ [key]: newValue });
      } else {
        const obj = frame.objects[state.selection.id];
        if (!obj) return;
        const currentValue = obj[key];
        let newValue = currentValue + delta;
        if (key === 'scale') {
          newValue = Math.min(Math.max(newValue, 0.1), 10);
        } else if (key === 'rotate') {
          newValue = ((newValue % 360) + 360) % 360;
        }
        timeline.updateObject(state.selection.id, { [key]: newValue });
      }
    };

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

    // Ajuste le compteur d'objets existants
    const initialObjs = timeline.getCurrentFrame().objects || {};
    const maxExisting = Object.keys(initialObjs).reduce((m, id) => {
      const n = parseInt(id.replace('obj', ''));
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    objectIdCounter = maxExisting;

    const onFrameChange = () => {
      debugLog("onFrameChange triggered. Current frame:", timeline.current);
      const frame = timeline.getCurrentFrame();
      if (!frame) return;

      // Apply to main pantin
      applyFrameToPantinElement(frame, pantinRootGroup);

      // Apply objects
      applyObjects(frame);

      // Update inspector values based on selection
      if (state.selection.type === 'pantin') {
        scaleValueEl.textContent = frame.transform.scale.toFixed(2);
        rotateValueEl.textContent = Math.round(frame.transform.rotate);
      } else {
        const obj = frame.objects[state.selection.id];
        if (obj) {
          scaleValueEl.textContent = obj.scale.toFixed(2);
          rotateValueEl.textContent = Math.round(obj.rotate);
          layerSelectEl.value = obj.front ? 'front' : 'back';
          attachSelectEl.value = obj.attachTo || '';
        }
      }

      // Render onion skins
      renderOnionSkins(timeline, applyFrameToPantinElement);
    };

    // Bind UI controls for objects
    addObjectBtn.addEventListener('click', () => {
      const asset = objectSelectEl.value;
      if (asset) addObject(asset);
    });

    deleteObjectBtn.addEventListener('click', () => {
      if (state.selection.type === 'object') {
        removeObject(state.selection.id);
      }
    });

    layerSelectEl.addEventListener('change', () => {
      if (state.selection.type === 'object') {
        setObjectLayer(state.selection.id, layerSelectEl.value === 'front');
      }
    });

    attachSelectEl.addEventListener('change', () => {
      if (state.selection.type === 'object') {
        attachObject(state.selection.id, attachSelectEl.value || null);
      }
    });

    debugLog("Initializing Onion Skin...");
    initOnionSkin(svgElement, PANTIN_ROOT_ID, memberList);

    selectPantin();

    const interactionOptions = {
      rootGroupId: PANTIN_ROOT_ID,
      grabId: GRAB_ID,
    };

    debugLog("Setting up member interactions...");
    const teardownMembers = setupInteractions(svgElement, memberList, pivots, timeline, onFrameChange, onSave);
    debugLog("Setting up global pantin interactions...");
    const teardownGlobal = setupPantinGlobalInteractions(svgElement, interactionOptions, timeline, onFrameChange, onSave);

    debugLog("Initializing UI...");
    initUI(timeline, onFrameChange, onSave, onUpdateTransform);

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

