import { initOnionSkin, renderOnionSkins } from './onionSkin.js';
import { loadSVG } from './svgLoader.js';
import { Timeline } from './timeline.js';
import { setupInteractions, setupPantinGlobalInteractions } from './interactions.js';
import { initUI } from './ui.js';

const SVG_URL = 'assets/pantins/manu_f.svg';
const THEATRE_ID = 'theatre';
const PANTIN_ROOT_ID = 'manu_test';
const GRAB_ID = 'torse';

async function main() {
  console.log("main() started");
  try {
    const { svgElement, memberList, pivots } = await loadSVG(SVG_URL, THEATRE_ID);
    console.log("SVG loaded, Timeline instantiated.");
    const timeline = new Timeline(memberList);

    const onSave = () => {
      localStorage.setItem('animation', timeline.exportJSON());
      console.log("Animation sauvegardée.");
    };

    const savedData = localStorage.getItem('animation');
    if (savedData) {
      try {
        timeline.importJSON(savedData);
        console.log("Animation chargée depuis localStorage.");
      } catch (e) {
        console.warn("Impossible de charger l'animation sauvegardée:", e);
      }
    }

    const onFrameChange = () => {
      console.log("onFrameChange triggered. Current frame:", timeline.current);
      const frame = timeline.getCurrentFrame();
      if (!frame) return;

      // Function to apply a frame to a given SVG element (main pantin or ghost)
      const applyFrameToPantinElement = (targetFrame, targetRootGroup) => {
        console.log("Applying frame to element:", targetRootGroup, "Frame data:", targetFrame);
        const { tx, ty, scale, rotate } = targetFrame.transform;
        const grabEl = targetRootGroup.querySelector(`#${GRAB_ID}`); // Grab element is relative to the rootGroup
        const center = grabEl ? { x: grabEl.getBBox().x + grabEl.getBBox().width / 2, y: grabEl.getBBox().y + grabEl.getBBox().height / 2 } : { x: 0, y: 0 };
        
        targetRootGroup.setAttribute('transform', `translate(${tx},${ty}) rotate(${rotate},${center.x},${center.y}) scale(${scale})`);

        memberList.forEach(id => {
          const el = targetRootGroup.querySelector(`#${id}`);
          if (!el) return;
          const pivot = pivots[id];
          const angle = targetFrame.members[id]?.rotate || 0;
          el.setAttribute('transform', `rotate(${angle},${pivot.x},${pivot.y})`);
        });
      };

      // Apply to main pantin
      applyFrameToPantinElement(frame, svgElement.querySelector(`#${PANTIN_ROOT_ID}`));

      // Update inspector values
      document.getElementById('scale-value').textContent = frame.transform.scale.toFixed(2);
      document.getElementById('rotate-value').textContent = Math.round(frame.transform.rotate);

      // Render onion skins
      renderOnionSkins(timeline, (ghostFrame, ghostElement) => applyFrameToPantinElement(ghostFrame, ghostElement));
    };

    initOnionSkin(svgElement, PANTIN_ROOT_ID);

    console.log("Initializing Onion Skin...");
    initOnionSkin(svgElement, PANTIN_ROOT_ID);

    const interactionOptions = {
      rootGroupId: PANTIN_ROOT_ID,
      grabId: GRAB_ID,
    };

    console.log("Setting up member interactions...");
    setupInteractions(svgElement, memberList, pivots, timeline, onFrameChange, onSave);
    console.log("Setting up global pantin interactions...");
    setupPantinGlobalInteractions(svgElement, interactionOptions, timeline, onFrameChange, onSave);

    console.log("Initializing UI...");
    initUI(timeline, onFrameChange, onSave);

  } catch (err) {
    console.error("Erreur d'initialisation:", err);
    alert(`Erreur fatale : ${err.message}`);
  }
}

document.addEventListener('DOMContentLoaded', main);

