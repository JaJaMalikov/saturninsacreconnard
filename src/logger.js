let debugEnabled = false;

export function setDebug(enabled) {
  debugEnabled = !!enabled;
}

export function debugLog(...args) {
  if (debugEnabled) {
    console.log(...args);
  }
}
