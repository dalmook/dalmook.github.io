const KEY = "dalbong-playground-v1";
const initial = {
  favorites: [],
  recent: [],
  seen: [],
  played: [],
  filters: {},
  sound: false,
};
export function readState() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      ...initial,
      ...value,
      favorites: Array.isArray(value.favorites) ? value.favorites : [],
      recent: Array.isArray(value.recent) ? value.recent : [],
      seen: Array.isArray(value.seen) ? value.seen : [],
      played: Array.isArray(value.played) ? value.played : [],
    };
  } catch {
    return structuredClone(initial);
  }
}
export const state = readState();
export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
export function visit(id) {
  state.recent = [id, ...state.recent.filter((x) => x !== id)].slice(0, 12);
  state.seen = [...new Set([...state.seen, id])];
  save();
}
