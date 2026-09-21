import { useCallback, useEffect, useState } from "react";
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
    { id: "u1", at: "2026-08-18", by: "Sara Al-Rashid", comment: "Backup vendor shortlisted, contract under legal review.", change: { status: ["Open", "Open"] } },
  ],
  "R-058": [
    { id: "u1", at: "2026-07-02", by: "Liam Walker", comment: "Forward contracts placed for 80% of the exposure.", change: { prob: [3, 2], score: [6, 4] } },
    { id: "u2", at: "2026-07-20", by: "Liam Walker", comment: "Mitigation plan executed — severity lowered after hedging.", change: { status: ["In Progress", "Mitigated"] } },
  ],
};

let state: State = {
  risks: seedRisks.map((r) => ({ ...r, updates: SEED_UPDATES[r.id] ?? [] })),
  issues: seedIssues.map((i) => ({
    ...i,
    updates:
      i.status === "Resolved" && i.resolution
        ? [{ id: `${i.id}-u1`, at: i.closureDate ?? i.openDate, by: i.owner, comment: i.resolution, statusChange: ["Open", "Resolved"] as [IssueStatus, IssueStatus] }]
        : [],
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
    set({ risks: [{ ...risk, id, updates: [] }, ...state.risks] });
    return id;
  }, []);

  const updateRisk = useCallback((id: string, patch: Partial<RiskRecord>) => {
    set({ risks: state.risks.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  }, []);

  const removeRisk = useCallback((id: string) => {
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

  const addIssue = useCallback((issue: Omit<IssueItem, "id"> & { id?: string }) => {
    const id = issue.id ?? nextIssueId();
    set({ issues: [{ ...issue, id, updates: [] }, ...state.issues] });
    return id;
  }, []);

  /**
   * Records a documented issue status update: required free-text comment plus
   * the status transition. Closure date is stamped when the issue is resolved.
   */
  const logIssueUpdate = useCallback(
    (id: string, input: { comment: string; by: string; status: IssueStatus }) => {
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
            closureDate: input.status === "Resolved" ? (i.closureDate ?? today()) : undefined,
            updates: [update, ...i.updates],
          };
        }),
      });
    },
    [],
  );

  const updateIssue = useCallback((id: string, patch: Partial<IssueItem>) => {
    set({ issues: state.issues.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  }, []);

  const removeIssue = useCallback((id: string) => {
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
      priority: risk.score >= 15 ? "High" : risk.score >= 9 ? "Medium" : "Low",
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
      change: { status: [risk.status, "In Progress"] },
    };
    set({
      issues: [issue, ...state.issues],
      risks: state.risks.map((r) =>
        r.id === riskId ? { ...r, status: "In Progress" as RiskStatus, updates: [update, ...r.updates] } : r,
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
    addRisk, updateRisk, removeRisk, logRiskUpdate,
    addIssue, updateIssue, removeIssue, logIssueUpdate, convertRiskToIssue,
    addCategory, updateCategory, removeCategory,
  };
}
