import { initOnionSkin, renderOnionSkins } from './onionSkin.js';
import { loadSVG } from './svgLoader.js';
import { Timeline } from './timeline.js';
import { setupInteractions, setupPantinGlobalInteractions } from './interactions.js';
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

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const objectsBackGroup = document.createElementNS(SVG_NS, 'g');
    objectsBackGroup.id = 'objects-back';
    pantinRootGroup.parentNode.insertBefore(objectsBackGroup, pantinRootGroup);
    const objectsFrontGroup = document.createElementNS(SVG_NS, 'g');
    objectsFrontGroup.id = 'objects-front';
    pantinRootGroup.parentNode.insertBefore(objectsFrontGroup, pantinRootGroup.nextSibling);
    const objectElements = {};
    let selectedObjectId = null;

    const getSVGCoords = e => {
      const pt = svgElement.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(svgElement.getScreenCTM().inverse());
    };

    function selectObject(id) {
      selectedObjectId = id;
      const frame = timeline.getCurrentFrame();
      const values = id ? frame.objects[id] : frame.transform;
      window.updateInspectorSelection(id ? `Objet ${id}` : 'Pantin', values);
      document.getElementById('object-layer').value = id ? (timeline.objects[id]?.layer || 'front') : 'front';
      document.getElementById('object-attach').value = id ? (timeline.objects[id]?.attachedTo || '') : '';
    }

    pantinRootGroup.addEventListener('pointerdown', () => selectObject(null));
    svgElement.addEventListener('pointerdown', e => {
      if (e.target === svgElement) selectObject(null);
    });

    window.appState = {
      getSelectedObject: () => selectedObjectId,
    };

    function moveObjectToLayer(id) {
      const meta = timeline.objects[id];
      const el = objectElements[id];
      if (!meta || !el) return;
      const parent = meta.layer === 'back' ? objectsBackGroup : objectsFrontGroup;
      parent.appendChild(el);
    }

    function createObjectElement(id) {
      const meta = timeline.objects[id];
      const g = document.createElementNS(SVG_NS, 'g');
      g.dataset.obj = id;
      const img = document.createElementNS(SVG_NS, 'image');
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `assets/objets/${meta.src}`);
      img.setAttribute('width', 100);
      img.setAttribute('height', 100);
      g.appendChild(img);
      g.style.cursor = 'move';
      objectElements[id] = g;
      moveObjectToLayer(id);

      let dragging = false;
      let start;
      g.addEventListener('pointerdown', e => {
        e.stopPropagation();
        selectObject(id);
        dragging = true;
        start = getSVGCoords(e);
        g.setPointerCapture && g.setPointerCapture(e.pointerId);
        svgElement.addEventListener('pointermove', onMove);
        svgElement.addEventListener('pointerup', endDrag, { once: true });
      });

      const onMove = e => {
        if (!dragging) return;
        const pt = getSVGCoords(e);
        const frame = timeline.getCurrentFrame().objects[id];
        timeline.updateObjectTransform(id, { tx: frame.tx + (pt.x - start.x), ty: frame.ty + (pt.y - start.y) });
        start = pt;
        onFrameChange();
      };

      const endDrag = () => {
        dragging = false;
        svgElement.removeEventListener('pointermove', onMove);
        onSave();
      };
    }

    function applyObjects(frame) {
      Object.keys(timeline.objects).forEach(id => {
        const meta = timeline.objects[id];
        const objFrame = frame.objects[id];
        const el = objectElements[id];
        if (!meta || !objFrame || !el) return;
        let m = svgElement.createSVGMatrix();
        m = m.translate(objFrame.tx, objFrame.ty);
        m = m.rotate(objFrame.rotate);
        m = m.scale(objFrame.scale);
        if (meta.attachedTo && memberElements[meta.attachedTo]) {
          m = memberElements[meta.attachedTo].getCTM().multiply(m);
        }
        el.setAttribute('transform', `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`);
      });
    }

    function setupObjectUI() {
      const librarySelect = document.getElementById('object-library');
      const layerSelect = document.getElementById('object-layer');
      const attachSelect = document.getElementById('object-attach');
      const addBtn = document.getElementById('add-object');
      const delBtn = document.getElementById('delete-object');

      fetch('assets/objets/objets.json')
        .then(r => r.json())
        .then(list => {
          list.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o.file;
            opt.textContent = o.id;
            librarySelect.appendChild(opt);
          });
        });

      memberList.forEach(id => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = id;
        attachSelect.appendChild(opt);
      });

      addBtn.addEventListener('click', () => {
        const file = librarySelect.value;
        if (!file) return;
        const id = 'obj' + Date.now();
        timeline.addObject(id, { src: file, layer: layerSelect.value, attachedTo: attachSelect.value || null });
        createObjectElement(id);
        selectObject(id);
        onSave();
        onFrameChange();
      });

      layerSelect.addEventListener('change', () => {
        if (!selectedObjectId) return;
        timeline.updateObjectMeta(selectedObjectId, { layer: layerSelect.value });
        moveObjectToLayer(selectedObjectId);
        onSave();
      });

      attachSelect.addEventListener('change', () => {
        if (!selectedObjectId) return;
        const member = attachSelect.value || null;
        timeline.updateObjectMeta(selectedObjectId, { attachedTo: member });
        onSave();
        onFrameChange();
      });

      delBtn.addEventListener('click', () => {
        if (!selectedObjectId) return;
        timeline.deleteObject(selectedObjectId);
        const el = objectElements[selectedObjectId];
        if (el) el.remove();
        delete objectElements[selectedObjectId];
        selectedObjectId = null;
        selectObject(null);
        onSave();
        onFrameChange();
      });
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
        Object.keys(timeline.objects).forEach(id => createObjectElement(id));
      } catch (e) {
        console.warn("Impossible de charger l'animation sauvegardée:", e);
      }
    }

    const onFrameChange = () => {
      debugLog("onFrameChange triggered. Current frame:", timeline.current);
      const frame = timeline.getCurrentFrame();
      if (!frame) return;

      applyFrameToPantinElement(frame, pantinRootGroup);
      applyObjects(frame);

      const target = selectedObjectId ? frame.objects[selectedObjectId] : frame.transform;
      window.updateInspectorSelection(selectedObjectId ? `Objet ${selectedObjectId}` : 'Pantin', target);

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
    initUI(timeline, onFrameChange, onSave);
    setupObjectUI();
    selectObject(null);

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

