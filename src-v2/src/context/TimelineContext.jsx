import { createContext, useContext, useEffect, useState } from 'react';
import { loadSVG } from '@legacy/svgLoader.js';
import { Timeline } from '@legacy/timeline.js';
import { initObjects } from '@legacy/objects.js';
import CONFIG from '@legacy/config.js';

const TimelineContext = createContext(null);

export function TimelineProvider({ children }) {
  const [timeline, setTimeline] = useState(null);
  const [objects, setObjects] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(null);
  const [selection, setSelection] = useState('pantin');
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let objectsInstance;
    async function init() {
      const { svgElement, memberList } = await loadSVG(CONFIG.SVG_URL, CONFIG.THEATRE_ID);
      const tl = new Timeline(memberList);
      const attachable = Array.from(new Set([...memberList, 'main_droite', 'main_gauche', 'pied_droite', 'pied_gauche', 'bouche']));

      const onSave = () => {
        localStorage.setItem('animation', tl.exportJSON());
      };

      const onFrameChange = () => {
        setCurrentFrame({ ...tl.getCurrentFrame() });
        objectsInstance?.renderObjects();
      };

      const saved = localStorage.getItem('animation');
      if (saved) {
        try { tl.importJSON(saved); } catch {}
      }

      objectsInstance = initObjects(svgElement, CONFIG.PANTIN_ROOT_ID, tl, attachable, onFrameChange, onSave);
      objectsInstance.onSelect(id => setSelection(id || 'pantin'));

      setTimeline(tl);
      setObjects(objectsInstance);
      onFrameChange();
    }
    init();
  }, []);

  const setFrameIndex = idx => {
    if (!timeline) return;
    timeline.setCurrentFrame(idx);
    setCurrentFrame({ ...timeline.getCurrentFrame() });
    objects?.renderObjects();
  };

  const nextFrame = () => {
    if (!timeline) return;
    timeline.nextFrame();
    setFrameIndex(timeline.current);
  };

  const prevFrame = () => {
    if (!timeline) return;
    timeline.prevFrame();
    setFrameIndex(timeline.current);
  };

  const addFrame = () => {
    if (!timeline) return;
    timeline.addFrame();
    setFrameIndex(timeline.current);
  };

  const deleteFrame = () => {
    if (!timeline || timeline.frames.length <= 1) return;
    timeline.deleteFrame();
    setFrameIndex(timeline.current);
  };

  const play = (fps = 8) => {
    if (!timeline || playing) return;
    setPlaying(true);
    timeline.play((frame, i) => {
      timeline.setCurrentFrame(i);
      setCurrentFrame({ ...frame });
      objects?.renderObjects();
    }, () => {
      setPlaying(false);
    }, fps, { loop: true });
  };

  const stop = () => {
    if (!timeline) return;
    timeline.stop();
    setPlaying(false);
    setCurrentFrame({ ...timeline.getCurrentFrame() });
    objects?.renderObjects();
  };

  const updateSelectionTransform = values => {
    if (!timeline) return;
    if (selection === 'pantin') {
      timeline.updateTransform(values);
    } else {
      timeline.updateObject(selection, values);
    }
    setCurrentFrame({ ...timeline.getCurrentFrame() });
    objects?.renderObjects();
  };

  const value = {
    timeline,
    objects,
    currentFrame,
    selection,
    setSelection,
    playing,
    setFrameIndex,
    nextFrame,
    prevFrame,
    addFrame,
    deleteFrame,
    play,
    stop,
    updateSelectionTransform,
  };

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>;
}

export function useTimeline() {
  return useContext(TimelineContext);
}

