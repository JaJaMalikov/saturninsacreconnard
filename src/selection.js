export let currentSelection = { type: 'pantin', id: null, element: null };

export function setSelection(sel) {
  currentSelection = sel;
}

export function getSelection() {
  return currentSelection;
}
