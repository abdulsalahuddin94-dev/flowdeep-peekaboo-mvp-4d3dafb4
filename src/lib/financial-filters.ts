export function matchesProjectTypes(selected: readonly string[], projectType: string): boolean {
  return selected.length === 0 || selected.includes(projectType);
}

export type CashEvent = { due: string; inflow: number; outflow: number };

export function cashYears(events: readonly CashEvent[]): string[] {
  const years = events.map((event) => Number(event.due.slice(0, 4)));
  if (years.length === 0) return [];
  const first = Math.min(...years);
  return Array.from({ length: Math.max(...years) - first + 1 }, (_, index) => String(first + index));
}

export function cashYearNavigation(years: readonly string[], selected: string) {
  const year = years.includes(selected) ? selected : years[0];
  const index = year === undefined ? -1 : years.indexOf(year);
  return { year, previous: index > 0 ? years[index - 1] : undefined, next: index >= 0 ? years[index + 1] : undefined };
}

export function cashSeries(events: readonly CashEvent[], mode: "monthly" | "yearly", year: string, today: string) {
  const years = cashYears(events);
  const buckets = new Map<string, { key: string; Inflow: number; Outflow: number }>();
  for (const value of years) {
    const keys = mode === "yearly" ? [value] : Array.from({ length: 12 }, (_, index) => `${value}-${String(index + 1).padStart(2, "0")}`);
    for (const key of keys) buckets.set(key, { key, Inflow: 0, Outflow: 0 });
  }
  for (const event of events) {
    const bucket = buckets.get(event.due.slice(0, mode === "monthly" ? 7 : 4));
    if (bucket) { bucket.Inflow += event.inflow; bucket.Outflow += event.outflow; }
  }
  let cumulative = 0;
  return Array.from(buckets.values()).map((bucket) => {
    const net = bucket.Inflow - bucket.Outflow;
    cumulative += net;
    const label = mode === "yearly" ? `FY${bucket.key}` : new Date(`${bucket.key}-01T00:00:00Z`).toLocaleString("en", { month: "short", timeZone: "UTC" });
    const forecast = bucket.key > today.slice(0, mode === "monthly" ? 7 : 4);
    return { key: bucket.key, label: forecast ? `${label}*` : label, Inflow: +bucket.Inflow.toFixed(2), Outflow: +(-bucket.Outflow).toFixed(2), Net: +net.toFixed(2), Cumulative: +cumulative.toFixed(2) };
  }).filter((bucket) => mode === "yearly" || bucket.key.startsWith(`${year}-`));
}