import { EMPLOYMENT_PERCENT, employmentFromFte, requestQuantity, requestAssignees, type ResourceRequest } from "./projects-store";
import { currentUtilization, type Employee } from "./employees-store";

type Priority = ResourceRequest["priority"];
const RANK: Record<Priority, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

/** Full time = 1 FTE, Part time = 0.5 FTE, matching the request's employment. */
export function requestFte(r: ResourceRequest): number {
  return EMPLOYMENT_PERCENT[r.employment ?? employmentFromFte(r.fte)] / 100;
}
const round = (n: number) => Math.round(n * 10) / 10;
const deptOf = (role: string, pool: Employee[]) => pool.find((e) => e.role === role)?.dept ?? "—";

/** Manpower plan per role: demand = all open + fulfilled requests, supply = fulfilled; declined are excluded. */
export function buildManpowerPlan(requests: ResourceRequest[], pool: Employee[]) {
  const map = new Map<string, { demand: number; supply: number; pending: number }>();
  requests.filter((r) => r.status !== "Declined").forEach((r) => {
    const row = map.get(r.role) ?? { demand: 0, supply: 0, pending: 0 };
    row.demand += requestFte(r);
    if (r.status === "Fulfilled") row.supply += requestFte(r); else row.pending += 1;
    map.set(r.role, row);
  });
  return Array.from(map, ([role, v]) => ({
    role, department: deptOf(role, pool), demand: round(v.demand), supply: round(v.supply),
    action: v.pending ? `Fulfill ${v.pending} pending request${v.pending > 1 ? "s" : ""}` : "Capacity covered",
  })).sort((a, b) => (b.demand - b.supply) - (a.demand - a.supply));
}

/** Skill demand per role + seniority from pending requests vs free capacity of employees in that role this month. */
export function buildSkillDemand(requests: ResourceRequest[], pool: Employee[]) {
  const map = new Map<string, { role: string; required: number; priority: Priority; from: string; until: string }>();
  requests.filter((r) => r.status === "Pending").forEach((r) => {
    const key = `${r.role} (${r.skill})`;
    const row = map.get(key);
    if (!row) { map.set(key, { role: r.role, required: requestFte(r), priority: r.priority, from: r.from, until: r.until }); return; }
    row.required += requestFte(r);
    if (RANK[r.priority] > RANK[row.priority]) row.priority = r.priority;
    if (r.from < row.from) row.from = r.from;
    if (r.until > row.until) row.until = r.until;
  });
  return Array.from(map, ([skill, v]) => ({
    skill, department: deptOf(v.role, pool), demand: v.priority,
    available: round(pool.filter((e) => e.role === v.role && e.active !== false).reduce((s, e) => s + Math.max(0, 100 - currentUtilization(e.allocations)) / 100, 0)),
    required: round(v.required), duration: v.from === v.until ? v.from : `${v.from} → ${v.until}`,
  })).sort((a, b) => RANK[b.demand] - RANK[a.demand]);
}
