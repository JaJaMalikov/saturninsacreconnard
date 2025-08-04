import { useContext, useEffect } from 'react';
import { AnimContext } from '../AnimContext';
import CONFIG from '../../../src/config.js';
import { loadSVG } from '../../../src/svgLoader.js';
import { Timeline } from '../../../src/timeline.js';
import { setupInteractions, setupPantinGlobalInteractions } from '../../../src/interactions.js';
import { initObjects } from '../../../src/objects.js';
import { memberMapStore } from '../../../src/memberMapStore.js';

export default function Theatre() {
  const { setTimeline, setObjects, setFrameIndex, setRefresh, setSelection } = useContext(AnimContext);

  useEffect(() => {
    let teardownMembers = null;
    let teardownGlobal = null;
    let objectsManager = null;
    let tl = null;
    async function init() {
      const { svgElement, memberList, pivots } = await loadSVG(CONFIG.SVG_URL, CONFIG.THEATRE_ID);
      tl = new Timeline(memberList);
      const pantinRootGroup = svgElement.querySelector(`#${CONFIG.PANTIN_ROOT_ID}`);
      const grabEl = pantinRootGroup?.querySelector(`#${CONFIG.GRAB_ID}`);
      const grabBox = grabEl ? grabEl.getBBox() : null;
      const grabCenter = grabBox ? { x: grabBox.x + grabBox.width / 2, y: grabBox.y + grabBox.height / 2 } : { x: 0, y: 0 };

      const memberElements = {};
      memberList.forEach(id => {
        const el = pantinRootGroup?.querySelector(`#${id}`);
        if (el) memberElements[id] = el;
      });
      memberMapStore.set(pantinRootGroup, memberElements);

      const applyFrame = frame => {
        const { tx, ty, scale, rotate } = frame.transform;
        pantinRootGroup.setAttribute(
          'transform',
          `translate(${tx},${ty}) rotate(${rotate},${grabCenter.x},${grabCenter.y}) scale(${scale})`
        );
        memberList.forEach(id => {
          const el = memberElements[id];
          if (!el) return;
          const pivot = pivots[id];
          const angle = frame.members[id]?.rotate || 0;
          el.setAttribute('transform', `rotate(${angle},${pivot.x},${pivot.y})`);
        });
        objectsManager && objectsManager.renderObjects();
      };

      const onFrameChange = () => {
        applyFrame(tl.getCurrentFrame());
        setFrameIndex(tl.current);
      };

      const onSave = () => {
        localStorage.setItem('animation', tl.exportJSON());
      };

      objectsManager = initObjects(
        svgElement,
        CONFIG.PANTIN_ROOT_ID,
        tl,
        [...memberList, 'main_droite', 'main_gauche', 'pied_droite', 'pied_gauche', 'bouche'],
        onFrameChange,
        onSave
      );
      objectsManager.onSelect(id => setSelection(id || 'pantin'));
      teardownMembers = setupInteractions(svgElement, memberList, pivots, tl, onFrameChange, onSave);
      teardownGlobal = setupPantinGlobalInteractions(
        svgElement,
        { rootGroupId: CONFIG.PANTIN_ROOT_ID, grabId: CONFIG.GRAB_ID },
        tl,
        onFrameChange,
        onSave
      );

      const saved = localStorage.getItem('animation');
      if (saved) {
        try {
          tl.importJSON(saved);
        } catch (e) {
          console.warn('Failed to load animation', e);
        }
      }

      setTimeline(tl);
      setObjects(objectsManager);
      setRefresh(() => onFrameChange);
      onFrameChange();
    }
    init();

    return () => {
      teardownMembers && teardownMembers();
      teardownGlobal && teardownGlobal();
    };
  }, [setTimeline, setObjects, setFrameIndex, setRefresh, setSelection]);

  return <div id="theatre" style={{ width: '100%', height: '100%' }} />;
}
