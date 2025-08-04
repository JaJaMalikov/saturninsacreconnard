const store = new WeakMap();

export function setMemberMap(element, map) {
  store.set(element, map);
}

export function getMemberMap(element) {
  return store.get(element);
}

