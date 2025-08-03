export const DEBUG = false;
export const log = (...args) => { if (DEBUG) console.log(...args); };
export const warn = (...args) => { if (DEBUG) console.warn(...args); };
