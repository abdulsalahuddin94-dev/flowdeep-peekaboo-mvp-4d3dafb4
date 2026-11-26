import type { Employee } from "@/lib/employees-store";
import type { Meeting } from "@/lib/meeting-store";
import { requestAssignees, type ResourceRequest } from "@/lib/projects-store";

export type EmployeeLinkKind = "task" | "project" | "trip" | "meeting";
export type EmployeeLink = { kind: EmployeeLinkKind; label: string; project?: string; from: string; until: string; timing: "past" | "current" | "future" };

/** Active and not deleted — the only employees resource pickers may offer. */
export const isEmployeeAvailable = (e: Pick<Employee, "active" | "deleted">) => e.active !== false && !e.deleted;

/** Month-only bounds ("YYYY-MM") widen to the whole month so a running month counts as current. */
function day(v: string | undefined, edge: "start" | "end"): string {
  if (!v) return "";
  const d = v.slice(0, 10);
  if (d.length === 7) return edge === "start" ? `${d}-01` : `${d}-31`;
  return d;
}

function timing(from: string, until: string, today: string): EmployeeLink["timing"] {
  if (until && until < today) return "past";
  if (from && from > today) return "future";
  return "current";
}

/** Everything an employee takes part in, classified against today so lifecycle actions can check what is still open. */
export function employeeLinks(e: Employee, requests: ResourceRequest[], meetings: Meeting[], today = new Date().toISOString().slice(0, 10)): EmployeeLink[] {
  const out: EmployeeLink[] = [];
  for (const r of requests) {
    if (r.status !== "Fulfilled" || !requestAssignees(r).includes(e.name)) continue;
    const from = day(r.periodStart ?? r.from, "start"); const until = day(r.periodEnd ?? r.until, "end");
    out.push({ kind: r.task ? "task" : "project", label: r.task ?? r.role, project: r.project, from, until, timing: timing(from, until, today) });
  }
  for (const t of e.trips) {
    const from = day(t.from, "start"); const until = day(t.until, "end");
    out.push({ kind: "trip", label: [t.city, t.country].filter(Boolean).join(", "), ...(t.project ? { project: t.project } : {}), from, until, timing: timing(from, until, today) });
  }
  for (const m of meetings) {
    if (!m.attendees.some((a) => a.id === e.id || (a.party === "Internal" && a.name.trim().toLowerCase() === e.name.trim().toLowerCase()))) continue;
    out.push({ kind: "meeting", label: m.title, project: m.project, from: m.date, until: m.date, timing: timing(m.date, m.date, today) });
  }
  return out;
}

/** Deletion is blocked while anything is still running or upcoming; history alone never blocks. */
export const openLinks = (links: EmployeeLink[]) => links.filter((l) => l.timing !== "past");

/** A finished task whose assignee is no longer active cannot be re-dated until the assignee is restored or replaced. */
export function taskDateBlocked(item: { progress?: number; assignee?: string }, employees: Pick<Employee, "name" | "active" | "deleted">[]): boolean {
  if ((item.progress ?? 0) < 100 || !item.assignee) return false;
  const emp = employees.find((x) => x.name === item.assignee);
  return !!emp && !isEmployeeAvailable(emp);
}
