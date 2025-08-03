export let debugEnabled = false;

export function setDebug(flag) {
  debugEnabled = flag;
}

export function debugLog(...args) {
  if (debugEnabled) {
    console.log(...args);
  }
}
