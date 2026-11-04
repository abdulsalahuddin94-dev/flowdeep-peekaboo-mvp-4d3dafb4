import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** One dated piece of work for the employee: a task inside a project milestone. */
export type WorkEntry = { project: string; milestone: string; task: string; from: string; until: string };
export type CalendarLeave = { from: string; until: string; label: string };
/** Allocation span — supplies each project's share shown next to its name. */
export type WorkAllocation = { project: string; percent: number; from: string; until: string };

const chipColors = ["bg-accent/40 text-foreground", "bg-rag-blue/40 text-foreground", "bg-rag-green/40 text-foreground", "bg-rag-amber/40 text-foreground", "bg-accent-secondary/40 text-foreground"];

const L = {
  en: { monthly: "Monthly", yearly: "Yearly", title: "Work calendar", leave: "Leave", weekend: "Weekend", milestone: "Milestone", task: "Task", project: "Project", empty: "No project work in this period", more: "more" },
  ar: { monthly: "شهري", yearly: "سنوي", title: "تقويم العمل", leave: "إجازة", weekend: "عطلة نهاية الأسبوع", milestone: "المرحلة", task: "المهمة", project: "المشروع", empty: "لا يوجد عمل على المشاريع في هذه الفترة", more: "أخرى" },
};
const l = L.en;
const weekDays = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function Detail({ items }: { items: WorkEntry[] }) {
  return <div className="w-64 space-y-2 whitespace-normal text-start">
    {items.map((e, i) => <div key={i} className="space-y-0.5">
      <div className="font-semibold">{e.project}</div>
      <div><span className="opacity-70">{l.milestone}: </span>{e.milestone}</div>
      <div><span className="opacity-70">{l.task}: </span>{e.task}</div>
    </div>)}
  </div>;
}

export function EmployeeWorkCalendar({ entries, leave, year, years, onYearChange }: { entries: WorkEntry[]; leave: CalendarLeave[]; year: string; years: string[]; onYearChange: (y: string) => void }) {
  const [view, setView] = useState<"monthly" | "yearly">("monthly");
  const [month, setMonth] = useState(9);
  const projects = useMemo(() => Array.from(new Set(entries.map((e) => e.project))), [entries]);
  const color = (p: string) => chipColors[Math.max(0, projects.indexOf(p)) % chipColors.length];
  const y = Number(year);
  const minYear = Number(years[0]); const maxYear = Number(years[years.length - 1]);

  const step = (dir: 1 | -1) => {
    if (view === "yearly") { const n = y + dir; if (n >= minYear && n <= maxYear) onYearChange(String(n)); return; }
    let m = month + dir; let ny = y;
    if (m < 0) { m = 11; ny -= 1; } if (m > 11) { m = 0; ny += 1; }
    if (ny < minYear || ny > maxYear) return;
    setMonth(m); if (ny !== y) onYearChange(String(ny));
  };
  const prevDisabled = view === "yearly" ? y <= minYear : y <= minYear && month === 0;
  const nextDisabled = view === "yearly" ? y >= maxYear : y >= maxYear && month === 11;
  const periodLabel = view === "yearly" ? year : new Date(y, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const byProject = (list: WorkEntry[]) => projects.map((p) => ({ project: p, items: list.filter((e) => e.project === p) })).filter((g) => g.items.length);

  return <section className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-base font-semibold">{l.title}</h2>
      <div className="flex items-center gap-4">
        <div className="inline-flex h-9 rounded-lg border border-border p-0.5" role="tablist">
          {(["monthly", "yearly"] as const).map((v) => <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)} className={cn("rounded-md px-3 text-sm transition-colors", view === v ? "bg-accent/20 text-accent" : "text-muted-foreground hover:text-foreground")}>{l[v]}</button>)}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous" disabled={prevDisabled} onClick={() => step(-1)} className="text-accent disabled:opacity-30"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></button>
          <span className="min-w-28 text-center text-sm font-semibold">{periodLabel}</span>
          <button type="button" aria-label="Next" disabled={nextDisabled} onClick={() => step(1)} className="text-accent disabled:opacity-30"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button>
        </div>
      </div>
    </div>
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      {projects.map((p) => <span key={p} className="inline-flex items-center gap-2"><span className={cn("h-3 w-3 rounded-full", color(p).split(" ")[0])} />{p}</span>)}
      <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-muted" />{l.leave}</span>
      <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-muted/30" />{l.weekend}</span>
    </div>
    <TooltipProvider delayDuration={100}>
      {view === "monthly" ? <MonthGrid y={y} month={month} entries={entries} leave={leave} color={color} byProject={byProject} /> : <YearGrid y={y} entries={entries} projects={projects} color={color} />}
    </TooltipProvider>
  </section>;
}

function MonthGrid({ y, month, entries, leave, color, byProject }: { y: number; month: number; entries: WorkEntry[]; leave: CalendarLeave[]; color: (p: string) => string; byProject: (l: WorkEntry[]) => { project: string; items: WorkEntry[] }[] }) {
  const first = new Date(y, month, 1); const days = new Date(y, month + 1, 0).getDate();
  const offset = (first.getDay() + 1) % 7; // week starts Saturday
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  return <div className="rounded-xl border border-border bg-card p-4">
    <div className="grid grid-cols-7 pb-2 text-sm text-muted-foreground">{weekDays.map((d) => <div key={d} className="px-2">{d}</div>)}</div>
    <div className="grid grid-cols-7 border-s border-t border-border">
      {cells.map((d, i) => {
        if (!d) return <div key={i} className="min-h-24 border-b border-e border-border" />;
        const date = iso(new Date(y, month, d)); const dow = new Date(y, month, d).getDay();
        const weekend = dow === 5 || dow === 6;
        const off = leave.find((v) => v.from <= date && date <= (v.until || v.from));
        const groups = weekend || off ? [] : byProject(entries.filter((e) => e.from <= date && date <= e.until));
        return <div key={i} className={cn("min-h-24 space-y-1.5 border-b border-e border-border p-2", weekend && "bg-muted/30")}>
          <div className="text-sm font-semibold">{d}</div>
          {off && <div className="truncate rounded-md bg-muted px-2 py-1 text-center text-xs">{off.label}</div>}
          {groups.slice(0, 2).map((g) => <Tooltip key={g.project}><TooltipTrigger asChild><div className={cn("cursor-default truncate rounded-md px-2 py-1 text-center text-xs font-medium", color(g.project))}>{g.project}</div></TooltipTrigger><TooltipContent><Detail items={g.items} /></TooltipContent></Tooltip>)}
          {groups.length > 2 && <Tooltip><TooltipTrigger asChild><div className="cursor-default text-center text-xs text-muted-foreground">+{groups.length - 2} {l.more}</div></TooltipTrigger><TooltipContent><Detail items={groups.slice(2).flatMap((g) => g.items)} /></TooltipContent></Tooltip>}
        </div>;
      })}
    </div>
  </div>;
}

function YearGrid({ y, entries, projects, color }: { y: number; entries: WorkEntry[]; projects: string[]; color: (p: string) => string }) {
  const months = Array.from({ length: 12 }, (_, m) => ({ m, start: iso(new Date(y, m, 1)), end: iso(new Date(y, m + 1, 0)) }));
  const rows = projects.filter((p) => entries.some((e) => e.project === p && e.from <= `${y}-12-31` && e.until >= `${y}-01-01`));
  if (!rows.length) return <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">{l.empty}</div>;
  return <div className="overflow-x-auto rounded-xl border border-border bg-card p-4">
    <div className="grid min-w-[900px] grid-cols-[180px_repeat(12,minmax(0,1fr))] border-s border-t border-border">
      <div className="border-b border-e border-border px-2 py-2 text-sm text-muted-foreground">{l.project}</div>
      {months.map(({ m }) => <div key={m} className="border-b border-e border-border px-2 py-2 text-sm text-muted-foreground">{new Date(y, m, 1).toLocaleDateString("en-US", { month: "short" })}</div>)}
      {rows.map((p) => <div key={p} className="contents">
        <div className="truncate border-b border-e border-border px-2 py-3 text-sm font-medium">{p}</div>
        {months.map(({ m, start, end }) => {
          const items = entries.filter((e) => e.project === p && e.from <= end && e.until >= start);
          return <div key={m} className="border-b border-e border-border p-1.5">
            {items.length > 0 && <Tooltip><TooltipTrigger asChild><div className={cn("cursor-default truncate rounded-md px-2 py-1 text-center text-xs font-medium", color(p))}>{p}</div></TooltipTrigger><TooltipContent><Detail items={items} /></TooltipContent></Tooltip>}
          </div>;
        })}
      </div>)}
    </div>
  </div>;
}
