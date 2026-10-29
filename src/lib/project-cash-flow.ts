import { cashYears, type CashEvent } from "./financial-filters";

type Cost = { b: number; linkKind?: "fixed" | "milestone"; linkRef?: string };
type Revenue = { plan: number; ms: string; date: string; linkKind?: "fixed" | "milestone" };
type Milestone = { name: string; endDate: string };

export function cashDate(raw: string, today: string): string | undefined {
  if (!raw || raw === "—") return undefined;
  const legacy = /^(\d{1,2})\s+([A-Za-z]{3,})$/.exec(raw.trim());
  const date = new Date(legacy ? `${legacy[2]} ${legacy[1]}, ${today.slice(0, 4)} UTC` : raw);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
}

export function projectCashEvents(cost: readonly Cost[], revenue: readonly Revenue[], milestones: readonly Milestone[], today: string): CashEvent[] {
  const finish = (name?: string) => milestones.find((item) => item.name === name)?.endDate;
  const events: CashEvent[] = [];
  for (const item of cost) {
    const due = cashDate((item.linkKind === "milestone" ? finish(item.linkRef) : item.linkRef) ?? "", today);
    if (due) events.push({ due, inflow: 0, outflow: item.b });
  }
  for (const item of revenue) {
    const due = cashDate((item.linkKind === "milestone" ? finish(item.ms) ?? item.date : item.date), today);
    if (due) events.push({ due, inflow: item.plan, outflow: 0 });
  }
  return events;
}

export function projectCashYears(startDate: string, endDate: string, events: readonly CashEvent[], today: string): string[] {
  const start = cashDate(startDate, today);
  const end = cashDate(endDate, today);
  if (!start || !end || end < start) return cashYears(events);
  const first = Number(start.slice(0, 4));
  return Array.from({ length: Number(end.slice(0, 4)) - first + 1 }, (_, index) => String(first + index));
}