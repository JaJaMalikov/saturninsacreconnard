import React, { createContext, useContext, useMemo, useState } from 'react';
import { Timeline } from '../../src/timeline.js';

const AnimationContext = createContext(null);

export function AnimationProvider({ children }) {
  const [timeline] = useState(() => new Timeline([]));
  const [currentFrame, setCurrentFrame] = useState(0);
  const value = useMemo(
    () => ({ timeline, currentFrame, setCurrentFrame }),
    [timeline, currentFrame]
  );

  return <AnimationContext.Provider value={value}>{children}</AnimationContext.Provider>;
}

export function useAnimation() {
  const ctx = useContext(AnimationContext);
  if (!ctx) throw new Error('useAnimation must be used within AnimationProvider');
  return ctx;
}
