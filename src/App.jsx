import React from 'react';
import { useTimeline } from './useTimeline';
import { TimelineControls, InspectorPanel, DataPanel } from './components/UIComponents';

export default function App() {
  const {
    containerRef, timelineRef,
    frameIndex, frameCount, isPlaying, fps, loop,
    selectedMember, scale, rotation, onionSettings, objects,
    goToFrame, togglePlay, setLoop, setFps,
    updateMember, setOnion, addObject, selectObject
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
          selectedMember={selectedMember}
          scale={scale}
          rotation={rotation}
          onionSettings={onionSettings}
          onScaleChange={v => updateMember(selectedMember, { scale: v })}
          onRotationChange={v => updateMember(selectedMember, { rotate: v })}
          onOnionSettingsChange={setOnion}
          onAddObject={addObject}
          onSelectObject={selectObject}
          objects={objects}
        />

        <DataPanel
          onExport={() => timelineRef.current.exportJSON()}
          onImport={e => timelineRef.current.importJSON(e.target.files[0])}
          onReset={() => timelineRef.current.reset()}
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
