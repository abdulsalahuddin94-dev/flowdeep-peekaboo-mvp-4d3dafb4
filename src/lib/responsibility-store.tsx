import { useCallback, useEffect, useState } from "react";
import type { AttendeeParty } from "@/lib/meeting-store";

/**
 * Central Responsibility Types lookup (Organization Settings → Responsibility Types).
 * Single source of truth for the Responsibility field on actions:
 * Action Tracker, Risk mitigation plan, Issue action plan, and meeting actions.
 * Names are English-only by decision; the app chrome itself stays bilingual.
 */

export type RespParty = "Internal" | "External";

export type ResponsibilityType = {
  /** Stable id — survives renames so action rows keep pointing at the same type. */
  id: string;
  /** English-only display name, stored as text on actions. */
  name: string;
  party: RespParty;
  /** Tone key into RESP_TONE_CLASS — semantic pill styling, never raw hex. */
  tone: string;
};

/** Preset pill tones for the lookup (DS02 pill variants). */
export const RESP_TONES: { value: string; label: string }[] = [
  { value: "accent", label: "Gold" },
  { value: "teal", label: "Teal" },
  { value: "amber", label: "Amber" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "red", label: "Red" },
  { value: "muted", label: "Grey" },
];

export const RESP_TONE_CLASS: Record<string, string> = {
  accent: "border-accent/40 bg-accent/10 text-accent",
  teal: "border-rag-teal/40 bg-rag-teal/10 text-rag-teal",
  amber: "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
  blue: "border-rag-blue/40 bg-rag-blue/10 text-rag-blue",
  green: "border-rag-green/40 bg-rag-green/10 text-rag-green",
  red: "border-rag-red/40 bg-rag-red/10 text-rag-red",
  muted: "border-border bg-muted text-muted-foreground",
};

/** Pill tone for any stored responsibility value, falling back to muted. */
export function respTone(name: string, types: ResponsibilityType[]) {
  const t = types.find((x) => x.name === name);
  return RESP_TONE_CLASS[t?.tone ?? "muted"];
}

const DEFAULTS: ResponsibilityType[] = [
  { id: "RT-001", name: "Internal", party: "Internal", tone: "accent" },
  { id: "RT-002", name: "Client", party: "External", tone: "teal" },
  { id: "RT-003", name: "Vendor", party: "External", tone: "amber" },
];

const STORAGE_KEY = "pmo.org.responsibility-types";

function read(): ResponsibilityType[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as ResponsibilityType[];
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

let state: ResponsibilityType[] | null = null;
const listeners = new Set<() => void>();

function current() {
  if (!state) state = read();
  return state;
}
function persist(next: ResponsibilityType[]) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — keep in-memory only */
  }
  listeners.forEach((l) => l());
}

export function useResponsibilities() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const respTypes = current();

  const addRespType = useCallback((t: Omit<ResponsibilityType, "id">) => {
    const id = `RT-${String(Math.max(0, ...current().map((x) => Number(x.id.replace(/\D/g, "")) || 0)) + 1).padStart(3, "0")}`;
    persist([...current(), { ...t, id }]);
  }, []);
  const updateRespType = useCallback((id: string, patch: Partial<Omit<ResponsibilityType, "id">>) => {
    persist(current().map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);
  const removeRespType = useCallback((id: string) => {
    persist(current().filter((t) => t.id !== id));
  }, []);

  return { respTypes, addRespType, updateRespType, removeRespType };
}

/** Default responsibility for new action rows — first active type, or Internal. */
export function defaultResponsibility(types: ResponsibilityType[], isActive?: (n: string) => boolean) {
  const active = isActive ? types.filter((t) => isActive(t.name)) : types;
  const all = active.length ? active : types;
  return all.find((t) => t.name === "Internal")?.name ?? all[0]?.name ?? "Internal";
}

/* ── Meeting attendee → responsibility mapping ──────────────────────────── */

const PARTY_DEFAULTS: Record<AttendeeParty, string> = {
  Internal: "Internal",
  Client: "Client",
  Vendor: "Vendor",
  Stakeholder: "Client",
  Other: "Client",
};

const PARTY_STORAGE_KEY = "pmo.org.meeting-party-resp";

function readMapping(): Record<AttendeeParty, string> {
  if (typeof window === "undefined") return PARTY_DEFAULTS;
  try {
    const raw = window.localStorage.getItem(PARTY_STORAGE_KEY);
    if (!raw) return PARTY_DEFAULTS;
    return { ...PARTY_DEFAULTS, ...(JSON.parse(raw) as Partial<Record<AttendeeParty, string>>) };
  } catch {
    return PARTY_DEFAULTS;
  }
}

let mappingState: Record<AttendeeParty, string> | null = null;
const mappingListeners = new Set<() => void>();

export function useMeetingPartyResp() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    mappingListeners.add(l);
    return () => { mappingListeners.delete(l); };
  }, []);

  const mapping = mappingState ?? readMapping();
  const setPartyResp = useCallback((party: AttendeeParty, name: string) => {
    mappingState = { ...(mappingState ?? readMapping()), [party]: name };
    try {
      window.localStorage.setItem(PARTY_STORAGE_KEY, JSON.stringify(mappingState));
    } catch {
      /* storage unavailable — keep in-memory only */
    }
    mappingListeners.forEach((l) => l());
  }, []);

  return { mapping, setPartyResp };
}
