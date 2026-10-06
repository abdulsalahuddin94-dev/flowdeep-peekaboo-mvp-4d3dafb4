import { useCallback, useEffect, useState } from "react";
import { logActivity } from "@/lib/activity-store";

/**
 * Shared Action Tracker register. Single source of truth for every project
 * action — Risk/Issue drawers only read and add their linked actions here.
 */

export type ActionSource = "Risk" | "Issue" | "Meeting" | "General";
/** Responsibility is free text matching the Organization "Responsibility Types" lookup. */
export type ActionResponsibility = string;
export type ActionStatus = "Open" | "In Progress" | "Done" | "Cancelled";

export const ACTION_SOURCES: ActionSource[] = ["Risk", "Issue", "Meeting", "General"];
export const ACTION_STATUSES: ActionStatus[] = ["Open", "In Progress", "Done", "Cancelled"];

export type ActionUpdate = {
  id: string;
  at: string;
  by: string;
  comment: string;
  statusChange?: [ActionStatus, ActionStatus];
};

export type ActionItem = {
  id: string;
  project: string;
  title: string;
  description?: string;
  source: ActionSource;
  /** Risk ID / Issue ID for linked sources. */
  sourceRef?: string;
  /** Meeting record this action came from (Meetings tab). */
  meetingId?: string;
  meetingName?: string;
  meetingDate?: string;
  owner: string;
  responsibility: ActionResponsibility;
  /** ISO date. */
  dueDate: string;
  status: ActionStatus;
  closedDate?: string;
  updates: ActionUpdate[];
};

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Overdue is derived, never stored. */
export function isActionOverdue(a: Pick<ActionItem, "dueDate" | "status">, today = todayIso()) {
  return (a.status === "Open" || a.status === "In Progress") && !!a.dueDate && a.dueDate < today;
}
export function daysOverdue(a: Pick<ActionItem, "dueDate">, today = todayIso()) {
  const d = (Date.parse(today) - Date.parse(a.dueDate)) / 86_400_000;
  return Math.max(0, Math.round(d));
}

const P = "ERP System Upgrade";
const SEED: ActionItem[] = [
  { id: "A-001", project: P, title: "Sign contract with backup vendor", source: "Risk", sourceRef: "R-091", owner: "Sara Al-Rashid", responsibility: "Internal", dueDate: "2026-09-15", status: "In Progress", updates: [{ id: "au1", at: "2026-09-12", by: "Sara Al-Rashid", comment: "Legal review still pending on liability clause." }] },
  { id: "A-002", project: P, title: "Hold weekly SLA review with primary vendor", source: "Risk", sourceRef: "R-091", owner: "Mei Chen", responsibility: "Vendor", dueDate: "2026-10-08", status: "Open", updates: [] },
  { id: "A-003", project: P, title: "Assign data stewards per workstream", source: "Risk", sourceRef: "R-096", owner: "Mei Chen", responsibility: "Internal", dueDate: "2026-09-18", status: "Done", closedDate: "2026-09-18", updates: [{ id: "au1", at: "2026-09-18", by: "Mei Chen", comment: "Stewards confirmed for all 5 workstreams.", statusChange: ["In Progress", "Done"] }] },
  { id: "A-004", project: P, title: "Approve finance blackout exception", source: "Risk", sourceRef: "R-097", owner: "Client Finance Lead", responsibility: "Client", dueDate: "2026-09-25", status: "Open", updates: [] },
  { id: "A-005", project: P, title: "Restore QA environment and share RCA", source: "Issue", sourceRef: "I-044", owner: "Omar Haddad", responsibility: "Vendor", dueDate: "2026-09-22", status: "In Progress", updates: [] },
  { id: "A-006", project: P, title: "Run daily reconciliation stand-up", source: "Issue", sourceRef: "I-052", owner: "John Smith", responsibility: "Internal", dueDate: "2026-10-05", status: "In Progress", updates: [] },
  { id: "A-007", project: P, title: "Provide UAT test users and access", source: "Meeting", meetingId: "M-002", meetingName: "Weekly progress meeting", meetingDate: "2026-09-24", owner: "Client IT Manager", responsibility: "Client", dueDate: "2026-09-28", status: "Open", updates: [] },
  { id: "A-008", project: P, title: "Share updated cutover plan", source: "Meeting", meetingId: "M-002", meetingName: "Weekly progress meeting", meetingDate: "2026-09-24", owner: "Aisha Khoury", responsibility: "Internal", dueDate: "2026-10-02", status: "Open", updates: [] },
  { id: "A-009", project: P, title: "Confirm training room bookings", source: "Meeting", meetingId: "M-001", meetingName: "Steering committee", meetingDate: "2026-09-10", owner: "Aisha Khoury", responsibility: "Internal", dueDate: "2026-09-20", status: "Done", closedDate: "2026-09-19", updates: [] },
  { id: "A-010", project: P, title: "Update project RACI after org change", source: "General", owner: "Aisha Khoury", responsibility: "Internal", dueDate: "2026-10-12", status: "Open", updates: [] },
];

let state: ActionItem[] = SEED;
const listeners = new Set<() => void>();
function set(next: ActionItem[]) { state = next; listeners.forEach((l) => l()); }

function nextId() {
  const n = Math.max(0, ...state.map((a) => Number(a.id.replace(/\D/g, "")) || 0));
  return `A-${String(n + 1).padStart(3, "0")}`;
}

export function useActions() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const addActions = useCallback((items: Omit<ActionItem, "id" | "updates">[]) => {
    let list = state;
    for (const it of items) {
      const id = (() => { const n = Math.max(0, ...list.map((a) => Number(a.id.replace(/\D/g, "")) || 0)); return `A-${String(n + 1).padStart(3, "0")}`; })();
      logActivity({ project: it.project, kind: "Action", ref: id, title: it.title, text: "Action added", by: it.owner });
      list = [{ ...it, id, updates: [], closedDate: it.status === "Done" ? todayIso() : undefined }, ...list];
    }
    set(list);
  }, []);
  const addAction = useCallback((it: Omit<ActionItem, "id" | "updates">) => {
    const id = nextId();
    logActivity({ project: it.project, kind: "Action", ref: id, title: it.title, text: "Action added", by: it.owner });
    set([{ ...it, id, updates: [], closedDate: it.status === "Done" ? todayIso() : undefined }, ...state]);
    return id;
  }, []);
  const updateAction = useCallback((id: string, patch: Partial<ActionItem>) => {
    const a = state.find((x) => x.id === id);
    if (a) logActivity({ project: a.project, kind: "Action", ref: id, title: patch.title ?? a.title, text: "Action details edited", by: a.owner });
    set(state.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);
  const removeAction = useCallback((id: string) => {
    const a = state.find((x) => x.id === id);
    if (a) logActivity({ project: a.project, kind: "Action", ref: id, title: a.title, text: "Action deleted", by: a.owner });
    set(state.filter((a) => a.id !== id));
  }, []);
  const logActionUpdate = useCallback((id: string, input: { comment: string; by: string; status: ActionStatus }) => {
    set(state.map((a) => {
      if (a.id !== id) return a;
      const u: ActionUpdate = { id: `au-${Date.now()}`, at: todayIso(), by: input.by, comment: input.comment, statusChange: input.status !== a.status ? [a.status, input.status] : undefined };
      return { ...a, status: input.status, closedDate: input.status === "Done" ? (a.closedDate ?? todayIso()) : undefined, updates: [u, ...a.updates] };
    }));
  }, []);
  const editActionUpdate = useCallback((id: string, updateId: string, comment: string) => {
    set(state.map((a) => (a.id === id ? { ...a, updates: a.updates.map((u) => (u.id === updateId ? { ...u, comment } : u)) } : a)));
  }, []);
  const removeActionUpdate = useCallback((id: string, updateId: string) => {
    set(state.map((a) => (a.id === id ? { ...a, updates: a.updates.filter((u) => u.id !== updateId) } : a)));
  }, []);
  /** Master-data rename from Organization → Responsibility Types; updates every stored action silently. */
  const renameResponsibility = useCallback((from: string, to: string) => {
    if (!from || from === to) return;
    set(state.map((a) => (a.responsibility === from ? { ...a, responsibility: to } : a)));
  }, []);

  return { actions: state, addAction, addActions, updateAction, removeAction, logActionUpdate, editActionUpdate, removeActionUpdate, renameResponsibility };
}
