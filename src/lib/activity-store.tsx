import { useEffect, useState } from "react";

/**
 * Project-level activity log for areas that have no history of their own
 * (schedule, financials, status reports, project details, lessons, baseline).
 * Risk, Issue and Action activity is still derived from their own histories.
 */

export type LoggedKind = "Risk" | "Issue" | "Action" | "Schedule" | "Financials" | "Status Report" | "Project" | "Lessons" | "Baseline";

export type LoggedActivity = {
  id: string;
  project: string;
  kind: LoggedKind;
  ref?: string;
  title: string;
  text: string;
  by: string;
  /** ISO date. */
  at: string;
  change?: string;
};

const P = "ERP System Upgrade";
let state: LoggedActivity[] = [
  { id: "la-1", project: P, kind: "Schedule", ref: "WBS", title: "Data migration", text: "Progress updated", by: "Mei Chen", at: "2026-09-23", change: "40% → 55%" },
  { id: "la-2", project: P, kind: "Financials", ref: "Cost", title: "SAP licensing", text: "Actual cost recorded", by: "Liam Walker", at: "2026-09-22" },
  { id: "la-3", project: P, kind: "Status Report", ref: "Week 38", title: "Weekly status report", text: "Submitted status report", by: "Aisha Khoury", at: "2026-09-21", change: "At Risk" },
  { id: "la-4", project: P, kind: "Schedule", ref: "WBS", title: "UAT", text: "Assignee changed", by: "Aisha Khoury", at: "2026-09-17", change: "Unassigned → Priya Iyer" },
  { id: "la-5", project: P, kind: "Lessons", title: "What Went Well", text: "Early vendor workshops shortened design sign-off.", by: "Aisha Khoury", at: "2026-09-12" },
  { id: "la-6", project: P, kind: "Baseline", title: "Project baseline", text: "Baseline saved and plan locked", by: "Aisha Khoury", at: "2026-08-30" },
  { id: "la-7", project: P, kind: "Project", title: "Project details", text: "Project details edited", by: "Aisha Khoury", at: "2026-08-28", change: "End date" },
];
const listeners = new Set<() => void>();

const today = () => new Date().toISOString().slice(0, 10);

export function logActivity(a: Omit<LoggedActivity, "id" | "at"> & { at?: string }) {
  state = [{ ...a, at: a.at ?? today(), id: `la-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }, ...state];
  listeners.forEach((l) => l());
}

export function useActivityLog() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return state;
}

/**
 * Logs adds, removals and edits by diffing a list between renders, so every
 * code path that mutates it is covered without per-call logging.
 */
export function useLogListChanges<T>(
  list: T[],
  opts: { project: string; kind: LoggedKind; by: string; ref?: string; key: (t: T) => string; label: (t: T) => string; noun: string; ignore?: string[] },
) {
  const [prev, setPrev] = useState(list);
  if (prev !== list) {
    setPrev(list);
    const before = new Map(prev.map((t) => [opts.key(t), t]));
    const after = new Map(list.map((t) => [opts.key(t), t]));
    const base = { project: opts.project, kind: opts.kind, by: opts.by, ref: opts.ref };
    const out: Omit<LoggedActivity, "id" | "at">[] = [];
    {
      after.forEach((t, k) => { if (!before.has(k)) out.push({ ...base, title: opts.label(t), text: `${opts.noun} added` }); });
      before.forEach((t, k) => { if (!after.has(k)) out.push({ ...base, title: opts.label(t), text: `${opts.noun} deleted` }); });
      after.forEach((t, k) => {
        const b = before.get(k);
        if (!b || b === t) return;
        const bo = b as Record<string, unknown>, to = t as Record<string, unknown>;
        const fields = Array.from(new Set([...Object.keys(bo), ...Object.keys(to)]))
          .filter((f) => !(opts.ignore ?? []).includes(f) && JSON.stringify(bo[f]) !== JSON.stringify(to[f]));
        if (!fields.length) return;
        const fmt = (v: unknown) => (v === undefined || v === null || v === "" ? "—" : typeof v === "object" ? "updated" : String(v));
        out.push({
          ...base, title: opts.label(t),
          text: fields.length === 1 ? `${fields[0]} changed` : `${fields.slice(0, 3).join(", ")}${fields.length > 3 ? "…" : ""} changed`,
          change: fields.length === 1 && typeof to[fields[0]] !== "object" ? `${fmt(bo[fields[0]])} → ${fmt(to[fields[0]])}` : undefined,
        });
      });
    }
    // Defer so we never notify other components during this render.
    if (out.length) queueMicrotask(() => out.forEach(logActivity));
  }
}
