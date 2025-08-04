import { initOnionSkin, renderOnionSkins } from './onionSkin.js';
import { loadSVG } from './svgLoader.js';
import { Timeline } from './timeline.js';
import { setupInteractions, setupPantinGlobalInteractions } from './interactions.js';
import { initUI, setSelection } from './ui.js';
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

    // Containers for scene objects
    const objectsBehind = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    objectsBehind.id = 'objects-behind';
    const objectsFront = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    objectsFront.id = 'objects-front';
    svgElement.insertBefore(objectsBehind, pantinRootGroup);
    svgElement.appendChild(objectsFront);

    const objectElements = {};

    const objectManifest = await fetch('assets/objets/manifest.json')
      .then(r => r.json())
      .catch(() => []);

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

    const renderObjects = frame => {
      // mark all elements unused
      Object.values(objectElements).forEach(el => (el.__used = false));

      frame.objects.forEach(obj => {
        let el = objectElements[obj.id];
        if (!el) {
          el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          el.id = obj.id;
          const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
          img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', obj.src);
          img.setAttribute('width', obj.width || 100);
          img.setAttribute('height', obj.height || 100);
          el.appendChild(img);
          el.style.cursor = 'move';
          el.addEventListener('pointerdown', e => startObjDrag(e, obj.id));
          el.addEventListener('click', e => { e.stopPropagation(); setSelection('object', obj.id); });
          objectElements[obj.id] = el;
        }

        if (obj.attachTo) {
          const parent = pantinRootGroup._memberMap[obj.attachTo];
          if (parent && el.parentNode !== parent) parent.appendChild(el);
        } else {
          const container = obj.layer === 'back' ? objectsBehind : objectsFront;
          if (el.parentNode !== container) container.appendChild(el);
        }

        el.setAttribute('transform', `translate(${obj.x || 0},${obj.y || 0}) rotate(${obj.rotate || 0}) scale(${obj.scale || 1})`);
        el.__used = true;
      });

      // remove unused elements
      Object.entries(objectElements).forEach(([id, el]) => {
        if (!el.__used) {
          el.remove();
          delete objectElements[id];
        }
      });
    };

    let draggingId = null;
    let dragStart;
    const getSVGCoords = evt => {
      const pt = svgElement.createSVGPoint();
      pt.x = evt.clientX;
      pt.y = evt.clientY;
      return pt.matrixTransform(svgElement.getScreenCTM().inverse());
    };

    const onObjMove = e => {
      if (!draggingId) return;
      const pt = getSVGCoords(e);
      const obj = timeline.getCurrentFrame().objects.find(o => o.id === draggingId);
      if (!obj) return;
      const dx = pt.x - dragStart.x;
      const dy = pt.y - dragStart.y;
      obj.x = (obj.x || 0) + dx;
      obj.y = (obj.y || 0) + dy;
      dragStart = pt;
      timeline.updateObject(draggingId, { x: obj.x, y: obj.y });
      renderObjects(timeline.getCurrentFrame());
    };

    const endObjDrag = () => {
      draggingId = null;
      svgElement.removeEventListener('pointermove', onObjMove);
      onSave();
    };

    const startObjDrag = (e, id) => {
      e.stopPropagation();
      draggingId = id;
      dragStart = getSVGCoords(e);
      svgElement.addEventListener('pointermove', onObjMove);
      svgElement.addEventListener('pointerup', endObjDrag, { once: true });
    };

    const addObject = src => {
      const id = `obj_${Date.now()}`;
      const meta = objectManifest.find(o => o.file === src) || {};
      const obj = { id, src: `assets/objets/${src}`, name: meta.name || id, x: 0, y: 0, scale: 1, rotate: 0, layer: 'front', attachTo: '' };
      timeline.addObject(obj);
      renderObjects(timeline.getCurrentFrame());
      return id;
    };

    const deleteObject = id => {
      timeline.deleteObject(id);
      const el = objectElements[id];
      if (el) el.remove();
      delete objectElements[id];
      renderObjects(timeline.getCurrentFrame());
    };

    const setLayer = (id, layer) => {
      timeline.updateObject(id, { layer });
      renderObjects(timeline.getCurrentFrame());
    };

    const attachObject = (id, memberId) => {
      timeline.updateObject(id, { attachTo: memberId || '' });
      renderObjects(timeline.getCurrentFrame());
    };

    const onFrameChange = () => {
      debugLog("onFrameChange triggered. Current frame:", timeline.current);
      const frame = timeline.getCurrentFrame();
      if (!frame) return;

      // Apply to main pantin
      applyFrameToPantinElement(frame, pantinRootGroup);

      renderObjects(frame);

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
    initUI(timeline, onFrameChange, onSave, {
      objectManifest,
      memberList,
      addObject,
      deleteObject,
      setLayer,
      attachObject,
    });
    setSelection('pantin');
    svgElement.addEventListener('click', e => {
      if (e.target === svgElement) setSelection('pantin');
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

