import React from 'react';
import { useTimeline } from './useTimeline';
import { TimelineControls, InspectorPanel, DataPanel } from './components/UIComponents';

export default function App() {
  const {
    containerRef,
    frameIndex,
    frameCount,
    isPlaying,
    fps,
    loop,
    selectedMember,
    scale,
    rotation,
    goToFrame,
    togglePlay,
    setLoop,
    setFps,
    updateMember,
    addObject,
    timelineRef,
  } = useTimeline('/assets/puppet.svg');

  return (
    <div className="grid grid-cols-4 gap-4 p-4">
      <div className="col-span-3 space-y-4">
        <TimelineControls
          frameIndex={frameIndex}
          frameCount={frameCount}
          isPlaying={isPlaying}
          fps={fps}
          loop={loop}
          onPrev={() => goToFrame(frameIndex - 1)}
          onNext={() => goToFrame(frameIndex + 1)}
          onPlayToggle={togglePlay}
          onLoopToggle={e => setLoop(e.target.checked)}
          onFpsChange={setFps}
          onFrameChange={goToFrame}
        />

        <InspectorPanel
          scale={scale}
          rotation={rotation}
          onScaleChange={v => updateMember(selectedMember, { scale: v })}
          onRotationChange={v => updateMember(selectedMember, { rotate: v })}
          onAddObject={addObject}
        />

        <DataPanel
          onExport={() => timelineRef.current?.exportJSON()}
          onImport={e => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = evt => timelineRef.current?.importJSON(evt.target.result);
              reader.readAsText(file);
            }
          }}
          onReset={() => timelineRef.current?.reset()}
        />
      </div>

      <div
        id="theatre"
        ref={containerRef}
        className="col-span-1 bg-gray-100 rounded-lg overflow-hidden"
        style={{ minHeight: 400 }}
      />
    </div>
  );
}
