import { useSyncExternalStore } from "react";

export type MeetingTypeEntry = { id: string; name: string; active: boolean };
const defaults: MeetingTypeEntry[] = [
  "Progress meeting", "Steering committee", "Workshop", "Client review", "Other",
].map((name, i) => ({ id: `MT-${i + 1}`, name, active: true }));
const storageKey = "pmo.org.meeting-types.v1";
let state = defaults;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
    if (Array.isArray(saved) && saved.every((v) => v && typeof v.id === "string" && typeof v.name === "string" && typeof v.active === "boolean")) state = saved;
  } catch { /* Keep defaults when browser storage is unavailable. */ }
}
function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function snapshot() { return state; }
function serverSnapshot() { return defaults; }
function save(next: MeetingTypeEntry[]) {
  state = next;
  try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Keep the current session usable. */ }
  listeners.forEach((listener) => listener());
}

export function useMeetingTypes() {
  const meetingTypes = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return {
    meetingTypes,
    addMeetingType: (name: string) => save([...state, { id: `MT-${crypto.randomUUID()}`, name: name.trim(), active: true }]),
    updateMeetingType: (id: string, patch: Partial<Pick<MeetingTypeEntry, "name" | "active">>) => save(state.map((v) => v.id === id ? { ...v, ...patch } : v)),
    removeMeetingType: (id: string) => save(state.filter((v) => v.id !== id)),
  };
}