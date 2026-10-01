import { useCallback, useEffect, useState } from "react";
import { logActivity } from "@/lib/activity-store";
import {
  risks as seedRisks,
  issues as seedIssues,
  RISK_CATEGORIES,
  type RiskItem,
  type RiskStatus,
  type IssueItem,
  type IssueStatus,
} from "@/lib/mock-data";

/**
 * Shared Risk & Issues register. Lives outside React so the portfolio-wide
 * module and the per-project tab always read and write the same records.
 */

export type RiskUpdate = {
  id: string;
  /** ISO date of the update. */
  at: string;
  by: string;
  comment: string;
  /** Recorded severity/status change, when the update carried one. */
  change?: {
    prob?: [number, number];
    impact?: [number, number];
    score?: [number, number];
    status?: [RiskStatus, RiskStatus];
  };
};

export type RiskRecord = RiskItem & { updates: RiskUpdate[] };

export type IssueUpdate = {
  id: string;
  /** ISO date of the update. */
  at: string;
  by: string;
  comment: string;
  /** Recorded status change, when the update carried one. */
  statusChange?: [IssueStatus, IssueStatus];
};

export type IssueRecord = IssueItem & { updates: IssueUpdate[] };

export type RiskCategory = { id: string; name: string; description: string };

type State = {
  risks: RiskRecord[];
  issues: IssueRecord[];
  categories: RiskCategory[];
};

const today = () => new Date().toISOString().slice(0, 10);

const SEED_UPDATES: Record<string, RiskUpdate[]> = {
  "R-091": [
    { id: "u1", at: "2026-09-19", by: "Sara Al-Rashid", comment: "Vendor delay materialised and QA outage was opened as a linked issue.", change: { status: ["Open", "In Progress"] } },
    { id: "u2", at: "2026-08-18", by: "Sara Al-Rashid", comment: "Backup vendor shortlisted, contract under legal review." },
  ],
  "R-096": [
    { id: "u1", at: "2026-09-18", by: "Mei Chen", comment: "Data stewards assigned to the top 50 exception records.", change: { status: ["Open", "In Progress"] } },
  ],
  "R-098": [
    { id: "u1", at: "2026-09-20", by: "Omar Haddad", comment: "Interface performance breach confirmed during volume test and logged as an issue.", change: { status: ["Open", "In Progress"] } },
  ],
  "R-099": [
    { id: "u1", at: "2026-09-15", by: "Sara Al-Rashid", comment: "Reporting requests moved to phase 2; baseline scope protected.", change: { status: ["In Progress", "Mitigated"] } },
  ],
  "R-100": [
    { id: "u1", at: "2026-09-14", by: "Priya Iyer", comment: "Backup SME onboarded and no further testing impact remains.", change: { status: ["Open", "Mitigated"] } },
  ],
  "R-058": [
    { id: "u1", at: "2026-07-02", by: "Liam Walker", comment: "Forward contracts placed for 80% of the exposure.", change: { prob: [3, 2], score: [6, 4] } },
    { id: "u2", at: "2026-07-20", by: "Liam Walker", comment: "Mitigation plan executed — severity lowered after hedging.", change: { status: ["In Progress", "Mitigated"] } },
  ],
};

const SEED_ISSUE_UPDATES: Record<string, IssueUpdate[]> = {
  "I-044": [
    { id: "iu1", at: "2026-09-20", by: "Mei Chen", comment: "Issue escalated to infrastructure leadership after QA lost a second test window.", statusChange: ["Open", "Escalated"] },
  ],
  "I-051": [
    { id: "iu1", at: "2026-09-21", by: "Omar Haddad", comment: "Escalated with integration partner; throughput retest scheduled after queue tuning.", statusChange: ["In Progress", "Escalated"] },
  ],
  "I-052": [
    { id: "iu1", at: "2026-09-19", by: "Mei Chen", comment: "Daily reconciliation room started with data owners from Finance and Operations.", statusChange: ["Open", "In Progress"] },
  ],
};

let state: State = {
  risks: seedRisks.map((r) => ({ ...r, updates: SEED_UPDATES[r.id] ?? [] })),
  issues: seedIssues.map((i) => ({
    ...i,
    updates: [
      ...(SEED_ISSUE_UPDATES[i.id] ?? []),
      ...(i.status === "Resolved" && i.resolution
        ? [{ id: `${i.id}-u1`, at: i.closureDate ?? i.openDate, by: i.owner, comment: i.resolution, statusChange: ["Open", "Resolved"] as [IssueStatus, IssueStatus] }]
        : []),
    ],
  })),
  categories: RISK_CATEGORIES.map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    description: `${name} related risks`,
  })),
};

const listeners = new Set<() => void>();
function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function nextIssueId() {
  const nums = state.issues.map((i) => Number(i.id.replace(/\D/g, "")) || 0);
  return `I-${String(Math.max(0, ...nums) + 1).padStart(3, "0")}`;
}
function nextRiskId() {
  const nums = state.risks.map((r) => Number(r.id.replace(/\D/g, "")) || 0);
  return `R-${String(Math.max(0, ...nums) + 1).padStart(3, "0")}`;
}

export function useRiskRegister() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const addRisk = useCallback((risk: Omit<RiskRecord, "id" | "updates"> & { id?: string }) => {
    const id = risk.id ?? nextRiskId();
    logActivity({ project: risk.project, kind: "Risk", ref: id, title: risk.title, text: "Risk logged", by: risk.owner });
    set({ risks: [{ ...risk, id, updates: [] }, ...state.risks] });
    return id;
  }, []);

  const updateRisk = useCallback((id: string, patch: Partial<RiskRecord>) => {
    const r = state.risks.find((x) => x.id === id);
    if (r) logActivity({ project: r.project, kind: "Risk", ref: id, title: patch.title ?? r.title, text: "Risk details edited", by: r.owner });
    set({ risks: state.risks.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  }, []);

  const removeRisk = useCallback((id: string) => {
    const r = state.risks.find((x) => x.id === id);
    if (r) logActivity({ project: r.project, kind: "Risk", ref: id, title: r.title, text: "Risk deleted", by: r.owner });
    set({ risks: state.risks.filter((r) => r.id !== id) });
  }, []);

  /** Records a documented status update: free-text comment plus any severity change. */
  const logRiskUpdate = useCallback(
    (id: string, input: { comment: string; by: string; prob?: number; impact?: number; status?: RiskStatus }) => {
      set({
        risks: state.risks.map((r) => {
          if (r.id !== id) return r;
          const prob = input.prob ?? r.prob;
          const impact = input.impact ?? r.impact;
          const status = input.status ?? r.status;
          const score = prob * impact;
          const change: RiskUpdate["change"] = {};
          if (prob !== r.prob) change.prob = [r.prob, prob];
          if (impact !== r.impact) change.impact = [r.impact, impact];
          if (score !== r.score) change.score = [r.score, score];
          if (status !== r.status) change.status = [r.status, status];
          const update: RiskUpdate = {
            id: `u-${Date.now()}`,
            at: today(),
            by: input.by,
            comment: input.comment,
            change: Object.keys(change).length ? change : undefined,
          };
          return { ...r, prob, impact, score, status, updates: [update, ...r.updates] };
        }),
      });
    },
    [],
  );

  /** Edits the comment of a recorded risk update in place. */
  const editRiskUpdate = useCallback((riskId: string, updateId: string, comment: string) => {
    set({
      risks: state.risks.map((r) =>
        r.id === riskId
          ? { ...r, updates: r.updates.map((u) => (u.id === updateId ? { ...u, comment } : u)) }
          : r,
      ),
    });
  }, []);

  /** Removes a recorded risk update from the history. */
  const removeRiskUpdate = useCallback((riskId: string, updateId: string) => {
    set({
      risks: state.risks.map((r) =>
        r.id === riskId ? { ...r, updates: r.updates.filter((u) => u.id !== updateId) } : r,
      ),
    });
  }, []);

  /** Edits the comment of a recorded issue update in place. */
  const editIssueUpdate = useCallback((issueId: string, updateId: string, comment: string) => {
    set({
      issues: state.issues.map((i) =>
        i.id === issueId
          ? { ...i, updates: i.updates.map((u) => (u.id === updateId ? { ...u, comment } : u)) }
          : i,
      ),
    });
  }, []);

  /** Removes a recorded issue update from the history. */
  const removeIssueUpdate = useCallback((issueId: string, updateId: string) => {
    set({
      issues: state.issues.map((i) =>
        i.id === issueId ? { ...i, updates: i.updates.filter((u) => u.id !== updateId) } : i,
      ),
    });
  }, []);

  const addIssue = useCallback((issue: Omit<IssueItem, "id"> & { id?: string }) => {
    const id = issue.id ?? nextIssueId();
    logActivity({ project: issue.project, kind: "Issue", ref: id, title: issue.title, text: "Issue logged", by: issue.owner });
    set({ issues: [{ ...issue, id, updates: [] }, ...state.issues] });
    return id;
  }, []);

  /**
   * Records a documented issue status update: required free-text comment plus
   * the status transition. Closure date is stamped when the issue is resolved.
   */
  const logIssueUpdate = useCallback(
    (id: string, input: { comment: string; by: string; status: IssueStatus; closureDate?: string }) => {
      set({
        issues: state.issues.map((i) => {
          if (i.id !== id) return i;
          const update: IssueUpdate = {
            id: `iu-${Date.now()}`,
            at: today(),
            by: input.by,
            comment: input.comment,
            statusChange: input.status !== i.status ? [i.status, input.status] : undefined,
          };
          return {
            ...i,
            status: input.status,
            closureDate: input.status === "Resolved"
              ? (input.closureDate || i.closureDate || today())
              : undefined,
            updates: [update, ...i.updates],
          };
        }),
      });
    },
    [],
  );

  const updateIssue = useCallback((id: string, patch: Partial<IssueItem>) => {
    const i = state.issues.find((x) => x.id === id);
    if (i) logActivity({ project: i.project, kind: "Issue", ref: id, title: patch.title ?? i.title, text: "Issue details edited", by: i.owner });
    set({ issues: state.issues.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  }, []);

  const removeIssue = useCallback((id: string) => {
    const i = state.issues.find((x) => x.id === id);
    if (i) logActivity({ project: i.project, kind: "Issue", ref: id, title: i.title, text: "Issue deleted", by: i.owner });
    set({ issues: state.issues.filter((i) => i.id !== id) });
  }, []);

  /** The risk has materialised: create a linked issue and record it on the risk. */
  const convertRiskToIssue = useCallback((riskId: string, by: string) => {
    const risk = state.risks.find((r) => r.id === riskId);
    if (!risk) return null;
    const id = nextIssueId();
    const issue: IssueRecord = {
      id,
      project: risk.project,
      title: risk.title,
      priority: risk.score >= 15 ? "Critical" : risk.score >= 9 ? "High" : risk.score >= 4 ? "Medium" : "Low",
      impact: risk.impact,
      owner: risk.owner,
      status: "Open",
      raised: "Today",
      openDate: today(),
      riskId,
      action: risk.mitigation || "",
      updates: [],
    };
    const update: RiskUpdate = {
      id: `u-${Date.now()}`,
      at: today(),
      by,
      comment: "Risk materialised — converted to an issue.",
      change: risk.status === "Open" ? { status: ["Open", "In Progress"] } : undefined,
    };
    set({
      issues: [issue, ...state.issues],
      risks: state.risks.map((r) =>
        r.id === riskId
          ? { ...r, status: (r.status === "Open" ? "In Progress" : r.status) as RiskStatus, updates: [update, ...r.updates] }
          : r,
      ),
    });
    return id;
  }, []);

  const addCategory = useCallback((cat: Omit<RiskCategory, "id">) => {
    const id = `rc-${Date.now()}`;
    set({ categories: [...state.categories, { ...cat, id }] });
  }, []);
  const updateCategory = useCallback((id: string, patch: Partial<RiskCategory>) => {
    set({ categories: state.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  }, []);
  const removeCategory = useCallback((id: string) => {
    set({ categories: state.categories.filter((c) => c.id !== id) });
  }, []);

  return {
    risks: state.risks,
    issues: state.issues,
    categories: state.categories,
    addRisk, updateRisk, removeRisk, logRiskUpdate, editRiskUpdate, removeRiskUpdate,
    addIssue, updateIssue, removeIssue, logIssueUpdate, editIssueUpdate, removeIssueUpdate, convertRiskToIssue,
    addCategory, updateCategory, removeCategory,
  };
}
