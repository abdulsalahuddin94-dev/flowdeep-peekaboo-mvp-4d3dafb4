/**
 * Company-level configurable rules (RAG health, schedule, financial).
 * Values differ per organization, so they live in configuration rather than
 * being hardcoded thresholds in the RAG/health calculations.
 */
export type OrgRules = {
  rag: {
    scheduleAmberPct: number;   // slip % that turns a project Amber
    scheduleRedPct: number;     // slip % that turns a project Red
    costAmberPct: number;       // budget overrun % -> Amber
    costRedPct: number;         // budget overrun % -> Red
    progressAmberPct: number;   // actual vs plan gap -> Amber
    progressRedPct: number;     // actual vs plan gap -> Red
    rollup: "worst" | "weighted";
    scheduleWeight: number;
    costWeight: number;
    scopeWeight: number;
  };
  schedule: {
    lateGraceDays: number;          // days after due date before "Late"
    dueSoonDays: number;            // horizon for "Due soon"
    staleUpdateDays: number;        // no progress update -> "Stale"
    baselineToleranceDays: number;  // drift allowed before change request
    defaultDurationDays: number;
    countWeekends: boolean;
  };
  financial: {
    currency: string;
    budgetWarnPct: number;      // % of budget consumed -> warning
    budgetBreachPct: number;    // % of budget consumed -> breach
    minMarginPct: number;       // minimum acceptable margin
    contingencyPct: number;
    capexThreshold: number;     // spend above this is treated as CapEx
    approvalThreshold: number;  // cost above this needs approval
  };
  risk: {
    /** Probability × Impact score bands. A score at/above the value takes that level. */
    criticalMin: number;
    highMin: number;
    mediumMin: number;
    /** Labels for the 1–5 probability and impact scales. */
    probabilityLabels: string[];
    impactLabels: string[];
  };
};

export const DEFAULT_ORG_RULES: OrgRules = {
  rag: {
    scheduleAmberPct: 5, scheduleRedPct: 10,
    costAmberPct: 5, costRedPct: 10,
    progressAmberPct: 10, progressRedPct: 20,
    rollup: "worst", scheduleWeight: 40, costWeight: 40, scopeWeight: 20,
  },
  schedule: {
    lateGraceDays: 2, dueSoonDays: 7, staleUpdateDays: 7,
    baselineToleranceDays: 3, defaultDurationDays: 5, countWeekends: false,
  },
  financial: {
    currency: "SAR", budgetWarnPct: 85, budgetBreachPct: 100,
    minMarginPct: 15, contingencyPct: 10,
    capexThreshold: 50000, approvalThreshold: 100000,
  },
};

const KEY = "pmo.org-rules.v1";

export function loadOrgRules(): OrgRules {
  if (typeof window === "undefined") return DEFAULT_ORG_RULES;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_ORG_RULES;
    const parsed = JSON.parse(raw) as Partial<OrgRules>;
    return {
      rag: { ...DEFAULT_ORG_RULES.rag, ...(parsed.rag ?? {}) },
      schedule: { ...DEFAULT_ORG_RULES.schedule, ...(parsed.schedule ?? {}) },
      financial: { ...DEFAULT_ORG_RULES.financial, ...(parsed.financial ?? {}) },
    };
  } catch {
    return DEFAULT_ORG_RULES;
  }
}

export function saveOrgRules(rules: OrgRules) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(rules));
}