import { useEffect, useRef, useState } from 'react';
import { loadSVG } from './svgLoader';
import { Timeline } from './timeline';
import { initOnionSkin, renderOnionSkins } from './onionSkin';
import CONFIG from './config.js';

/**
 * Hook centralisant le chargement du SVG, la timeline et les interactions.
 */
export function useTimeline() {
  const containerRef = useRef(null);
  const timelineRef  = useRef(null);

  // États UI
  const [frameIndex, setFrameIndex]         = useState(0);
  const [frameCount, setFrameCount]         = useState(1);
  const [isPlaying, setIsPlaying]           = useState(false);
  const [fps, setFps]                       = useState(8);
  const [loop, setLoop]                     = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [scale, setScale]                   = useState(1);
  const [rotation, setRotation]             = useState(0);
  const [onionSettings, setOnionSettings]   = useState({ before: 2, after: 2 });
  const [objects, setObjects]               = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { SVG_URL, THEATRE_ID, PANTIN_ROOT_ID } = CONFIG;
      if (!containerRef.current) return;
      containerRef.current.id = THEATRE_ID;

      // Charger et injecter le SVG
      const { svgElement, memberList } = await loadSVG(SVG_URL, THEATRE_ID);
      if (!mounted) return;
      const svgRoot = svgElement;

      // Initialiser l'onion skin pour que renderOnionSkins cible un layer existant
      initOnionSkin(svgRoot, PANTIN_ROOT_ID, memberList);

      // Instancier la Timeline
      const timeline = new Timeline(memberList);
      timelineRef.current = timeline;
      setFrameCount(timeline.getFrameCount());
      setFps(timeline.getFps());
      setLoop(timeline.getLoop());

      // Brancher les events
      timeline.on('frameChange', idx => {
        setFrameIndex(idx);
        const frame = timeline.getCurrentFrame();
        if (frame) {
          // Appliquer la frame principale
          const rootGroup = svgRoot.querySelector(`#${PANTIN_ROOT_ID}`);
          rootGroup?.setAttribute(
            'transform',
            `translate(${frame.transform.tx},${frame.transform.ty}) ` +
            `rotate(${frame.transform.rotate},0,0) scale(${frame.transform.scale})`
          );
          // Onion skins
          renderOnionSkins(timeline, (f, root) => {
            const { tx, ty, scale, rotate } = f.transform;
            root.setAttribute(
              'transform',
              `translate(${tx},${ty}) rotate(${rotate},0,0) scale(${scale})`
            );
          });
        }
      });
      timeline.on('playToggle', setIsPlaying);
      timeline.on('fpsChange', setFps);
      timeline.on('loopChange', setLoop);
      timeline.on('memberSelect', setSelectedMember);
      timeline.on('memberTransform', ({ scale, rotate }) => { setScale(scale); setRotation(rotate); });
      timeline.on('onionSettingsChange', setOnionSettings);
      timeline.on('objectsChange', setObjects);

      // Rendu initial
      timeline.emit('frameChange', 0);
    })();
    return () => { mounted = false; };
  }, []);

  // Actions exposées
  const goToFrame      = idx => timelineRef.current?.goToFrame(idx);
  const togglePlay     = () => timelineRef.current?.togglePlay();
  const setLoopAction  = v => timelineRef.current?.setLoop(v);
  const setFpsAction   = v => timelineRef.current?.setFps(v);
  const updateMember   = (id, v) => timelineRef.current?.updateMember(id, v);
  const updateTransform= v => timelineRef.current?.updateTransform(v);
  const setOnion       = s => timelineRef.current?.setOnionSettings(s);
  const addObject      = () => timelineRef.current?.addObject();
  const selectObject   = id=> timelineRef.current?.selectObject(id);

  return {
    containerRef,
    frameIndex,
    frameCount,
    isPlaying,
    fps,
    loop,
    selectedMember,
    scale,
    rotation,
    onionSettings,
    objects,
    goToFrame,
    togglePlay,
    setLoop: setLoopAction,
    setFps: setFpsAction,
    updateMember,
    updateTransform,
    setOnion,
    addObject,
    selectObject,
    timelineRef,
  };
}

