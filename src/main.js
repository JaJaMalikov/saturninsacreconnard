import { initOnionSkin, renderOnionSkins } from './onionSkin.js';
import { loadSVG } from './svgLoader.js';
import { Timeline } from './timeline.js';
import { setupInteractions, setupPantinGlobalInteractions } from './interactions.js';
import { initUI } from './ui.js';
import { debugLog } from './debug.js';
import CONFIG from './config.js';
import {
  initObjects,
  getSelectedObject,
  attachSelected,
  updateZ,
  exportObjects,
  importObjects
} from './objects.js';

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
    const objectControls = document.getElementById('object-controls');
    const attachCheckbox = document.getElementById('attach-object');
    const frontBtn = document.getElementById('object-front');
    const backBtn = document.getElementById('object-back');

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

    const updateSelectionUI = obj => {
      if (obj) {
        selectedNameEl.textContent = obj.name;
        scaleValueEl.textContent = obj.scale.toFixed(2);
        rotateValueEl.textContent = Math.round(obj.rotate);
        objectControls.hidden = false;
        attachCheckbox.checked = obj.attached;
      } else {
        selectedNameEl.textContent = 'Pantin';
        const frame = timeline.getCurrentFrame();
        scaleValueEl.textContent = frame.transform.scale.toFixed(2);
        rotateValueEl.textContent = Math.round(frame.transform.rotate);
        objectControls.hidden = true;
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
      localStorage.setItem('objects', JSON.stringify(exportObjects()));
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

      // Update inspector values if pantin selected
      if (!getSelectedObject()) {
        scaleValueEl.textContent = frame.transform.scale.toFixed(2);
        rotateValueEl.textContent = Math.round(frame.transform.rotate);
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
    initUI(timeline, onFrameChange, onSave);
    initObjects(svgElement, pantinRootGroup, { onSelect: updateSelectionUI });

    const savedObjects = localStorage.getItem('objects');
    if (savedObjects) {
      try {
        importObjects(JSON.parse(savedObjects));
      } catch (e) {
        console.warn('Impossible de charger les objets sauvegardés:', e);
      }
    }

    attachCheckbox.addEventListener('change', e => {
      attachSelected(e.target.checked);
      onSave();
    });
    frontBtn.addEventListener('click', () => {
      updateZ('front');
      onSave();
    });
    backBtn.addEventListener('click', () => {
      updateZ('back');
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

