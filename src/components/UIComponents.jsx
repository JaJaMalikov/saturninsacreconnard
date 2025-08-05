import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

// Timeline controls: play, pause, next, prev, loop, FPS, slider
export function TimelineControls({
  frameIndex,
  frameCount,
  isPlaying,
  fps,
  loop,
  onPrev,
  onNext,
  onPlayToggle,
  onLoopToggle,
  onFpsChange,
  onFrameChange
}) {
  return (
    <Card className="p-4 space-y-2">
      <CardContent>
        <div className="flex items-center justify-between">
          <Button onClick={onPrev}>Prev</Button>
          <Button onClick={onPlayToggle}>{isPlaying ? 'Stop' : 'Play'}</Button>
          <Button onClick={onNext}>Next</Button>
        </div>
        <div className="flex items-center space-x-4">
          <label>
            Loop
            <input type="checkbox" checked={loop} onChange={onLoopToggle} className="ml-1" />
          </label>
          <label className="flex items-center">
            FPS
            <Slider
              className="ml-2 w-24"
              min={1}
              max={60}
              value={fps}
              onValueChange={onFpsChange}
            />
          </label>
        </div>
        <Slider
          min={0}
          max={frameCount - 1}
          value={frameIndex}
          onValueChange={onFrameChange}
        />
        <div className="text-sm text-center">
          Frame {frameIndex + 1} / {frameCount}
        </div>
      </CardContent>
    </Card>
  );
}

// Inspector panel: member scale, rotation, object management, onion skin settings
export function InspectorPanel({
  selectedMember,
  scale,
  rotation,
  onionSettings,
  onScaleChange,
  onRotationChange,
  onOnionSettingsChange,
  onAddObject,
  onSelectObject,
  objects
}) {
  return (
    <Card className="p-4 space-y-4">
      <CardContent>
        <h3 className="text-xl font-semibold">Inspector</h3>
        <div className="text-sm mb-2">Selected: {selectedMember || 'none'}</div>
        <div>
          <label className="block mb-1">Scale</label>
          <Slider
            min={0.1}
            max={3}
            step={0.01}
            value={scale}
            onValueChange={onScaleChange}
          />
        </div>
        <div>
          <label className="block mb-1">Rotation</label>
          <Slider
            min={-180}
            max={180}
            value={rotation}
            onValueChange={onRotationChange}
          />
        </div>
        <div>
          <h4 className="font-medium">Onion Skin</h4>
          <div className="flex items-center space-x-2">
            <label>Before</label>
            <input
              type="number"
              value={onionSettings.before}
              onChange={e => onOnionSettingsChange({ ...onionSettings, before: Number(e.target.value) })}
              className="w-16 border rounded p-1"
            />
            <label>After</label>
            <input
              type="number"
              value={onionSettings.after}
              onChange={e => onOnionSettingsChange({ ...onionSettings, after: Number(e.target.value) })}
              className="w-16 border rounded p-1"
            />
          </div>
        </div>
        <div>
          <h4 className="font-medium">Objects</h4>
          <Button onClick={onAddObject}>Add Object</Button>
          <ul className="mt-2 space-y-1">
            {objects.map(obj => (
              <li key={obj.id}>
                <Button variant={obj.selected ? 'default' : 'secondary'} onClick={() => onSelectObject(obj.id)}>
                  {obj.name || obj.id}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Import/Export panel
export function DataPanel({ onExport, onImport, onReset }) {
  const fileInputRef = React.useRef();
  return (
    <Card className="p-4 space-y-2">
      <CardContent>
        <h3 className="text-xl font-semibold">Data</h3>
        <div className="flex space-x-2">
          <Button onClick={onExport}>Export JSON</Button>
          <Button onClick={() => fileInputRef.current.click()}>Import JSON</Button>
          <Button variant="destructive" onClick={onReset}>Reset</Button>
        </div>
        <input
          type="file"
          accept="application/json"
          ref={fileInputRef}
          onChange={onImport}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
