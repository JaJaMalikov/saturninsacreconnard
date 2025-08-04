import { initOnionSkin, renderOnionSkins } from './onionSkin.js';
import { loadSVG } from './svgLoader.js';
import { Timeline } from './timeline.js';
import { setupInteractions, setupPantinGlobalInteractions, setupObjectInteractions } from './interactions.js';
import { initUI } from './ui.js';
import { debugLog } from './debug.js';
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
    const pantinControls = document.getElementById('pantin-controls');
    const objectControls = document.getElementById('object-controls');
    const objectParentSelect = document.getElementById('object-parent');
    const sendBackBtn = document.getElementById('send-back');
    const bringFrontBtn = document.getElementById('bring-front');
    const deleteObjectBtn = document.getElementById('delete-object');
    const objectSelect = document.getElementById('object-select');
    const objectAddBtn = document.getElementById('object-add-btn');

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

    // Layers and storage for scene objects
    const objectsBackGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    objectsBackGroup.id = 'objects-back';
    pantinRootGroup.parentNode.insertBefore(objectsBackGroup, pantinRootGroup);
    const objectsFrontGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    objectsFrontGroup.id = 'objects-front';
    pantinRootGroup.parentNode.insertBefore(objectsFrontGroup, pantinRootGroup.nextSibling);

    const objectElements = {};
    let selection = { type: 'pantin', id: null };

    const refreshParentOptions = () => {
      objectParentSelect.innerHTML = '<option value="">Scène</option>';
      memberList.forEach(id => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = id;
        objectParentSelect.appendChild(opt);
      });
    };
    refreshParentOptions();

    const updateSelectionUI = () => {
      if (selection.type === 'pantin') {
        selectedNameEl.textContent = 'Pantin';
        pantinControls.style.display = 'block';
        objectControls.style.display = 'none';
      } else {
        const obj = timeline.objects.find(o => o.id === selection.id);
        selectedNameEl.textContent = obj?.name || 'Objet';
        pantinControls.style.display = 'block';
        objectControls.style.display = 'block';
        objectParentSelect.value = obj?.parent || '';
      }
    };

    const updateSelectionValues = frame => {
      if (selection.type === 'pantin') {
        scaleValueEl.textContent = frame.transform.scale.toFixed(2);
        rotateValueEl.textContent = Math.round(frame.transform.rotate);
      } else {
        const st = frame.objects[selection.id];
        if (st) {
          scaleValueEl.textContent = st.scale.toFixed(2);
          rotateValueEl.textContent = Math.round(st.rotate);
        }
      }
    };

    const selectObject = id => {
      selection = { type: 'object', id };
      Object.entries(objectElements).forEach(([oid, el]) => {
        el.classList.toggle('selected-object', oid === id);
      });
      updateSelectionUI();
      updateSelectionValues(timeline.getCurrentFrame());
    };

    const selectPantin = () => {
      selection = { type: 'pantin', id: null };
      Object.values(objectElements).forEach(el => el.classList.remove('selected-object'));
      updateSelectionUI();
      updateSelectionValues(timeline.getCurrentFrame());
    };
    selectPantin();

    svgElement.addEventListener('click', e => {
      if (e.target.classList.contains('scene-object')) return;
      selectPantin();
    });

    const renderObject = obj => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      el.setAttribute('href', obj.src);
      el.setAttribute('width', 100);
      el.setAttribute('height', 100);
      el.id = obj.id;
      el.classList.add('scene-object');
      const parentEl = obj.parent
        ? pantinRootGroup.querySelector(`#${obj.parent}`)
        : (obj.front ? objectsFrontGroup : objectsBackGroup);
      if (obj.front) parentEl.appendChild(el); else parentEl.insertBefore(el, parentEl.firstChild);
      const box = el.getBBox();
      obj.cx = box.x + box.width / 2;
      obj.cy = box.y + box.height / 2;
      objectElements[obj.id] = el;
      setupObjectInteractions(el, obj.id, timeline, onFrameChange, onSave, selectObject);
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

    // Render objects if any were saved
    timeline.objects.forEach(renderObject);

    const onFrameChange = () => {
      debugLog("onFrameChange triggered. Current frame:", timeline.current);
      const frame = timeline.getCurrentFrame();
      if (!frame) return;

      // Apply to main pantin
      applyFrameToPantinElement(frame, pantinRootGroup);

      // Apply to objects
      timeline.objects.forEach(obj => {
        const el = objectElements[obj.id];
        if (!el) return;
        const st = frame.objects[obj.id];
        if (!st) return;
        el.setAttribute(
          'transform',
          `translate(${st.tx},${st.ty}) rotate(${st.rotate},${obj.cx},${obj.cy}) scale(${st.scale})`
        );
      });

      updateSelectionValues(frame);

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
    initUI(timeline, onFrameChange, onSave, { getSelection: () => selection });

    // Load available objects
    fetch('assets/objets/manifest.json')
      .then(r => r.json())
      .then(data => {
        Object.entries(data).forEach(([name, path]) => {
          const opt = document.createElement('option');
          opt.value = path;
          opt.textContent = name;
          objectSelect.appendChild(opt);
        });
      })
      .catch(err => console.error('Manifest objets manquant', err));

    objectAddBtn.addEventListener('click', () => {
      const src = objectSelect.value;
      if (!src) return;
      const id = `obj-${Date.now()}`;
      const name = src.split('/').pop();
      const obj = { id, name, src, parent: null, front: true };
      timeline.addObject(obj);
      renderObject(obj);
      selectObject(id);
      onSave();
    });

    deleteObjectBtn.addEventListener('click', () => {
      if (selection.type !== 'object') return;
      const id = selection.id;
      const el = objectElements[id];
      el && el.parentNode && el.parentNode.removeChild(el);
      delete objectElements[id];
      timeline.removeObject(id);
      selectPantin();
      onSave();
    });

    objectParentSelect.addEventListener('change', () => {
      if (selection.type !== 'object') return;
      const obj = timeline.objects.find(o => o.id === selection.id);
      obj.parent = objectParentSelect.value || null;
      const el = objectElements[obj.id];
      if (el) {
        const parentEl = obj.parent
          ? pantinRootGroup.querySelector(`#${obj.parent}`)
          : (obj.front ? objectsFrontGroup : objectsBackGroup);
        if (obj.front) parentEl.appendChild(el); else parentEl.insertBefore(el, parentEl.firstChild);
      }
      onSave();
    });

    bringFrontBtn.addEventListener('click', () => {
      if (selection.type !== 'object') return;
      const obj = timeline.objects.find(o => o.id === selection.id);
      obj.front = true;
      const el = objectElements[obj.id];
      const parentEl = obj.parent
        ? pantinRootGroup.querySelector(`#${obj.parent}`)
        : objectsFrontGroup;
      parentEl.appendChild(el);
      onSave();
    });

    sendBackBtn.addEventListener('click', () => {
      if (selection.type !== 'object') return;
      const obj = timeline.objects.find(o => o.id === selection.id);
      obj.front = false;
      const el = objectElements[obj.id];
      const parentEl = obj.parent
        ? pantinRootGroup.querySelector(`#${obj.parent}`)
        : objectsBackGroup;
      parentEl.insertBefore(el, parentEl.firstChild);
      onSave();
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

