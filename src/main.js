import { loadSVG } from './svgLoader.js';
import { Timeline } from './timeline.js';
import { setupInteractions, setupPantinGlobalInteractions } from './interactions.js';
import { initUI } from './ui.js';

const SVG_URL = 'manu.svg';
const THEATRE_ID = 'theatre';
const PANTIN_ROOT_ID = 'manu_test';
const GRAB_ID = 'torse';

async function main() {
  try {
    const { svgElement, memberList, pivots } = await loadSVG(SVG_URL, THEATRE_ID);
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
      const frame = timeline.getCurrentFrame();
      if (!frame) return;

      const rootGroup = svgElement.querySelector(`#${PANTIN_ROOT_ID}`);
      const { tx, ty, scale, rotate } = frame.transform;
      const grabEl = svgElement.querySelector(`#${GRAB_ID}`);
      const center = grabEl ? { x: grabEl.getBBox().x + grabEl.getBBox().width / 2, y: grabEl.getBBox().y + grabEl.getBBox().height / 2 } : { x: 0, y: 0 };
      
      rootGroup.setAttribute('transform', `translate(${tx},${ty}) rotate(${rotate},${center.x},${center.y}) scale(${scale})`);

      document.getElementById('scale-slider').value = scale;
      document.getElementById('rotate-slider').value = rotate;

      memberList.forEach(id => {
        const el = svgElement.querySelector(`#${id}`);
        if (!el) return;
        const pivot = pivots[id];
        const angle = frame.members[id]?.rotate || 0;
        el.setAttribute('transform', `rotate(${angle},${pivot.x},${pivot.y})`);
      });
    };

    const interactionOptions = {
      rootGroupId: PANTIN_ROOT_ID,
      grabId: GRAB_ID,
      scaleSliderId: 'scale-slider',
      rotateSliderId: 'rotate-slider',
    };

    setupInteractions(svgElement, memberList, pivots, timeline, onFrameChange, onSave);
    setupPantinGlobalInteractions(svgElement, interactionOptions, timeline, onFrameChange, onSave);

    initUI(timeline, onFrameChange, onSave);

  } catch (err) {
    console.error("Erreur d'initialisation:", err);
    alert(`Erreur fatale : ${err.message}`);
  }
}

main();

