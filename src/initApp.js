import { initOnionSkin, renderOnionSkins } from './onionSkin.js';
import { loadSVG } from './svgLoader.js';
import { Timeline } from './timeline.js';
import { setupInteractions, setupPantinGlobalInteractions } from './interactions.js';
import { initObjects } from './objects.js';
import { debugLog } from './debug.js';
import CONFIG from './config.js';
import { memberMapStore } from './memberMapStore.js';

const { SVG_URL, THEATRE_ID, PANTIN_ROOT_ID, GRAB_ID } = CONFIG;

export async function initApp() {
  debugLog("main() started");
  try {
    const { svgElement, memberList, pivots } = await loadSVG(SVG_URL, THEATRE_ID);
    debugLog("SVG loaded, Timeline instantiated.");
    const timeline = new Timeline(memberList);
    const attachableMembers = Array.from(new Set([...memberList, 'main_droite', 'main_gauche', 'pied_droite', 'pied_gauche', 'bouche']));

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
    memberMapStore.set(pantinRootGroup, memberElements);

    // Function to apply a frame to a given SVG element (main pantin or ghost)
    const applyFrameToPantinElement = (targetFrame, targetRootGroup, elementMap = memberMapStore.get(targetRootGroup) || memberElements) => {
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

    let objects;
    const scaleValueEl = document.getElementById('scaleValue');
    const rotateValueEl = document.getElementById('rotateValue');

    timeline.on('frameChange', () => {
      const frame = timeline.getCurrentFrame();
      if (!frame) return;

      // Apply to main pantin
      applyFrameToPantinElement(frame, pantinRootGroup);

      // Update inspector values
      scaleValueEl.value = frame.transform.scale.toFixed(2);
      rotateValueEl.value = Math.round(frame.transform.rotate);

      // Render onion skins
      renderOnionSkins(timeline, applyFrameToPantinElement);

      // Render scene objects
      objects && objects.renderObjects();
    });

    // Quand un membre est mis à jour (scale / rotate)…
    timeline.on('memberTransform', () => {
  // On récupère la frame courante et on ré-applique tout
  const frame = timeline.getCurrentFrame();
  if (!frame) return;
  applyFrameToPantinElement(frame, pantinRootGroup);
  renderOnionSkins(timeline, applyFrameToPantinElement);
  objects && objects.renderObjects();
});

// Quand la transformation globale change (translate / scale / rotate)…
timeline.on('transformChange', transform => {
  // On positionne directement le groupe principal
  const { tx, ty, scale, rotate } = transform;
  pantinRootGroup.setAttribute(
    'transform',
    `translate(${tx},${ty}) scale(${scale}) rotate(${rotate})`
  );
  // Ré-affichage des onion skins et objets
  renderOnionSkins(timeline, applyFrameToPantinElement);
  objects && objects.renderObjects();
});


    debugLog("Initializing Onion Skin...");
    initOnionSkin(svgElement, PANTIN_ROOT_ID, memberList);

    const interactionOptions = {
      rootGroupId: PANTIN_ROOT_ID,
      grabId: GRAB_ID,
    };

    const onObjectsUpdate = () => {};
    objects = initObjects(
      svgElement,
      PANTIN_ROOT_ID,
      timeline,
      attachableMembers,
      onObjectsUpdate,
      onSave
    );

    debugLog("Setting up member interactions...");
    const teardownMembers = setupInteractions(svgElement, memberList, pivots, timeline);
    debugLog("Setting up global pantin interactions...");
    const teardownGlobal = setupPantinGlobalInteractions(svgElement, interactionOptions, timeline);
    window.addEventListener('beforeunload', () => {
      teardownMembers();
      teardownGlobal();
    });
  return { timeline, svgElement, pivots, memberList };

  } catch (err) {
    console.error("Erreur d'initialisation:", err);
    throw err;
  }
}
