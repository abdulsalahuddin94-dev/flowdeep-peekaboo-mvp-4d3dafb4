// ============= Full file contents =============

import { useEffect, useMemo, useState } from "react";
import { PartyPopper, Umbrella } from "@/lib/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** One dated piece of work for the employee: a task inside a project milestone. */
export type WorkEntry = { project: string; milestone: string; task: string; from: string; until: string };
/** Meetings and trips the employee takes part in, shown as labelled chips per day. */
export type CalendarEvent = { id: string; kind: "meeting" | "trip"; label: string; from: string; until: string };
export type CalendarLeave = { from: string; until: string; label: string };
/** Allocation span — supplies each project's share shown next to its name. */
export type WorkAllocation = { project: string; percent: number; from: string; until: string };
/** Per-month figures the yearly cards render (structurally matches employeeMonth's return). */
export type MonthStats = { effectiveUtilization: number; allocatedHours: number; availableCapacity: number; absentDays: number; allocations: { project: string; percent: number }[] };

const chipColors = ["bg-accent/40 text-foreground", "bg-rag-blue/40 text-foreground", "bg-rag-green/40 text-foreground", "bg-rag-amber/40 text-foreground", "bg-accent-secondary/40 text-foreground"];
const barColors = ["bg-accent", "bg-rag-blue", "bg-rag-green", "bg-rag-amber", "bg-accent-secondary"];

const L = {
  en: { monthly: "Monthly", yearly: "Yearly", title: "Work calendar", today: "Today", leave: "Leave", meeting: "Meeting", trip: "Trip", holiday: "Holiday", milestone: "Milestone", task: "Task", project: "Project", empty: "No project work in this period", more: "more", absenceDays: "absence days" },
  ar: { monthly: "شهري", yearly: "سنوي", title: "تقويم العمل", today: "اليوم", leave: "إجازة", meeting: "اجتماع", trip: "رحلة", holiday: "عطلة رسمية", milestone: "المرحلة", task: "المهمة", project: "المشروع", empty: "لا يوجد عمل على المشاريع في هذه الفترة", more: "أخرى", absenceDays: "أيام غياب" },
};
const l = L.en;
const weekDays = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const eventColor = { meeting: "bg-rag-blue/20 text-foreground", trip: "bg-rag-amber/20 text-foreground" } as const;
const eventsOn = (events: CalendarEvent[], date: string) => events.filter((e) => e.from <= date && date <= e.until);

function EventChips({ events }: { events: CalendarEvent[] }) {
  return <>{events.map((e) => <Tooltip key={e.id}><TooltipTrigger asChild><div className={cn("cursor-default truncate rounded-full px-2 py-0.5 text-center text-xs", eventColor[e.kind])}>{e.label}</div></TooltipTrigger><TooltipContent>{l[e.kind]}: {e.label}</TooltipContent></Tooltip>)}</>;
}

function Detail({ items }: { items: WorkEntry[] }) {
  return <div className="w-64 space-y-2 whitespace-normal text-start">
    {items.map((e, i) => <div key={i} className="space-y-0.5">
      <div className="font-semibold">{e.project}</div>
      <div><span className="opacity-70">{l.milestone}: </span>{e.milestone}</div>
      <div><span className="opacity-70">{l.task}: </span>{e.task}</div>
    </div>)}
  </div>;
}

/**
 * Period controls (title, Monthly/Yearly, month/year stepper) live in the page's fixed slot above this
 * section rather than here, so the date navigator never moves between tabs.
 */
export function EmployeeWorkCalendar({ workingDays = [0, 1, 2, 3, 4], holidays = [], events = [], entries, leave, allocations, view, month, year, monthStats }: { workingDays?: number[]; holidays?: { date: string; label: string }[]; events?: CalendarEvent[]; entries: WorkEntry[]; leave: CalendarLeave[]; allocations: WorkAllocation[]; view: "monthly" | "yearly"; month: number; year: string; monthStats: (month: string) => MonthStats }) {
  const [today, setToday] = useState("");
  useEffect(() => { setToday(iso(new Date())); }, []);
  const projects = useMemo(() => Array.from(new Set(entries.map((e) => e.project))), [entries]);
  const color = (p: string) => chipColors[Math.max(0, projects.indexOf(p)) % chipColors.length];
  const barColor = (p: string) => barColors[Math.max(0, projects.indexOf(p)) % barColors.length];
  const y = Number(year);
  const periodKey = view === "yearly" ? year : `${y}-${String(month + 1).padStart(2, "0")}`;
  // The share shown beside a project name must match the period currently on screen.
  const percentOf = (p: string) => allocations
    .filter((a) => a.project === p && (view === "yearly" ? a.from.slice(0, 4) <= year && a.until.slice(0, 4) >= year : a.from <= periodKey && a.until >= periodKey))
    .reduce((sum, a) => sum + a.percent, 0);

  const byProject = (list: WorkEntry[]) => projects.map((p) => ({ project: p, items: list.filter((e) => e.project === p) })).filter((g) => g.items.length);

  return <section className="min-w-0 space-y-4">
    {<div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      {view === "monthly" && projects.map((p) => { const pct = percentOf(p); return <span key={p} className="inline-flex items-center gap-2"><span className={cn("h-3 w-3 rounded-full", color(p).split(" ")[0])} />{p}{pct > 0 && <span className="num-mono font-semibold text-foreground">{pct}%</span>}</span>; })}
      <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-accent" />{l.today}</span>
      <span className="inline-flex items-center gap-2"><Umbrella className="h-4 w-4 text-rag-blue" />{l.leave}</span>
      <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rag-blue/40" />{l.meeting}</span>
      <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rag-amber/40" />{l.trip}</span>
      <span className="inline-flex items-center gap-2"><PartyPopper className="h-4 w-4 text-rag-green" />{l.holiday}</span>
    </div>}
    <TooltipProvider delayDuration={100}>
      {view === "monthly" ? <MonthGrid today={today} holidays={holidays} events={events} y={y} month={month} entries={entries} leave={leave} color={color} byProject={byProject} /> : <YearGrid today={today} leave={leave} holidays={holidays} events={events} y={y} entries={entries} projects={projects} barColor={barColor} monthStats={monthStats} />}
    </TooltipProvider>
  </section>;
}

function MonthGrid({ today, holidays, events, y, month, entries, leave, color, byProject }: { today: string; holidays: { date: string; label: string }[]; events: CalendarEvent[]; y: number; month: number; entries: WorkEntry[]; leave: CalendarLeave[]; color: (p: string) => string; byProject: (l: WorkEntry[]) => { project: string; items: WorkEntry[] }[] }) {
  const first = new Date(y, month, 1); const days = new Date(y, month + 1, 0).getDate();
  const offset = (first.getDay() + 1) % 7; // week starts Saturday
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  return <div className="rounded-xl border border-border bg-card p-4">
    <div className="grid grid-cols-7 pb-2 text-sm text-muted-foreground">{weekDays.map((d) => <div key={d} className="px-2">{d}</div>)}</div>
    <div className="grid grid-cols-7 border-s border-t border-border">
      {cells.map((d, i) => {
        if (!d) return <div key={i} className="min-h-24 border-b border-e border-border" />;
        const date = iso(new Date(y, month, d));
        const holiday = holidays.find((h) => h.date === date);
        const off = leave.find((v) => v.from <= date && date <= (v.until || v.from));
        const groups = holiday || off ? [] : byProject(entries.filter((e) => e.from <= date && date <= e.until));
        const isToday = date === today;
        return <div key={i} data-date={date} aria-current={isToday ? "date" : undefined} className={cn("min-w-0 min-h-24 space-y-1.5 border-b border-e border-border p-2", isToday && "bg-muted/30")}>
          <div className="flex h-7 items-center justify-between gap-1"><span className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold", isToday && "bg-accent text-accent-foreground")}>{d}</span>{isToday && <span className="text-xs font-medium text-accent">{l.today}</span>}</div>
          {holiday && <Tooltip><TooltipTrigger asChild><div className="flex min-h-7 items-center gap-1.5 rounded-full border border-rag-green/30 bg-rag-green/10 px-2 py-1 text-xs text-rag-green"><PartyPopper className="h-4 w-4 shrink-0" /><span className="min-w-0 truncate">{l.holiday}</span></div></TooltipTrigger><TooltipContent>{l.holiday}: {holiday.label}</TooltipContent></Tooltip>}
          {off && <Tooltip><TooltipTrigger asChild><div className="flex min-h-7 items-center gap-1.5 rounded-full border border-dashed border-rag-blue/50 bg-rag-blue/10 px-2 py-1 text-xs text-rag-blue"><Umbrella className="h-4 w-4 shrink-0" /><span className="min-w-0 truncate">{off.label}</span></div></TooltipTrigger><TooltipContent>{off.label}</TooltipContent></Tooltip>}
          {groups.slice(0, 2).map((g) => <Tooltip key={g.project}><TooltipTrigger asChild><div className={cn("cursor-default truncate rounded-md px-2 py-1 text-center text-xs font-medium", color(g.project))}>{g.project}</div></TooltipTrigger><TooltipContent><Detail items={g.items} /></TooltipContent></Tooltip>)}
          <EventChips events={eventsOn(events, date)} />
          {groups.length > 2 && <Tooltip><TooltipTrigger asChild><div className="cursor-default text-center text-xs text-muted-foreground">+{groups.length - 2} {l.more}</div></TooltipTrigger><TooltipContent><Detail items={groups.slice(2).flatMap((g) => g.items)} /></TooltipContent></Tooltip>}
        </div>;
      })}
    </div>
  </div>;
}

function YearGrid({ today, leave, holidays, events, y, entries, projects, barColor, monthStats }: { today: string; leave: CalendarLeave[]; holidays: { date: string; label: string }[]; events: CalendarEvent[]; y: number; entries: WorkEntry[]; projects: string[]; barColor: (p: string) => string; monthStats: (month: string) => MonthStats }) {
  const hasWork = [...entries, ...events].some((e) => e.from <= `${y}-12-31` && e.until >= `${y}-01-01`);
  if (!hasWork) return <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">{l.empty}</div>;
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 12 }, (_, m) => {
      const stats = monthStats(`${y}-${String(m + 1).padStart(2, "0")}`);
      const over = stats.effectiveUtilization > 100;
      const shares = projects.map((p) => ({ project: p, percent: stats.allocations.filter((a) => a.project === p).reduce((sum, a) => sum + a.percent, 0) })).filter((s) => s.percent > 0);
      const scale = Math.max(100, shares.reduce((sum, s) => sum + s.percent, 0));
      return <div key={m} className={cn("space-y-3 rounded-xl border bg-card p-4", over ? "border-rag-red/50" : "border-border")}>
        <div className="flex items-center justify-between">
          <span className="font-medium">{new Date(y, m, 1).toLocaleDateString("en-US", { month: "long" })}</span>
          <span className={cn("num-mono font-semibold", over && "text-rag-red")}>{stats.effectiveUtilization}%</span>
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
          {shares.map((s) => <div key={s.project} className={barColor(s.project)} style={{ width: `${s.percent / scale * 100}%` }} />)}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="num-mono">{stats.allocatedHours.toFixed(1)}h / {stats.availableCapacity}h</span>
          {stats.absentDays > 0 && <span className="num-mono">{stats.absentDays}d {l.absenceDays}</span>}
        </div>
        <MiniMonth today={today} leave={leave} y={y} m={m} holidays={holidays} events={events} />
        {shares.length > 0 && <div className="space-y-2 border-t border-border pt-3">
          {shares.map((s) => <div key={s.project} className="flex items-center justify-between gap-2 text-sm">
            <span className="inline-flex min-w-0 items-center gap-2"><span className={cn("h-2 w-2 shrink-0 rounded-full", barColor(s.project))} /><span className="truncate">{s.project}</span></span>
            <span className="num-mono text-muted-foreground">{s.percent}%</span>
          </div>)}
        </div>}
      </div>;
    })}
  </div>;
}

/** Keep absence markers separate from the current-day highlight in both views. */
function MiniMonth({ today, leave, y, m, holidays, events }: { today: string; leave: CalendarLeave[]; y: number; m: number; holidays: { date: string; label: string }[]; events: CalendarEvent[] }) {
  const days = new Date(y, m + 1, 0).getDate(); const offset = (new Date(y, m, 1).getDay() + 1) % 7;
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return <div className="grid grid-cols-7 gap-0.5 text-center text-[10px]">
    {cells.map((d, i) => {
      if (!d) return <div key={i} />;
      const date = iso(new Date(y, m, d)); const holiday = holidays.find((h) => h.date === date); const ev = eventsOn(events, date);
      const off = leave.find((v) => v.from <= date && date <= v.until);
      const isToday = date === today;
      const cell = <div aria-current={isToday ? "date" : undefined} className={cn("flex h-9 flex-col items-center justify-center gap-0.5 rounded-md num-mono text-muted-foreground", isToday && "bg-muted/30 ring-1 ring-accent text-accent")}>
        <span>{d}</span>
        {(holiday || off) && <span className="flex gap-0.5">{holiday && <PartyPopper className="h-3 w-3 text-rag-green" />}{off && <Umbrella className="h-3 w-3 text-rag-blue" />}</span>}
        {ev.length > 0 && <span className="flex gap-0.5">{Array.from(new Set(ev.map((e) => e.kind))).map((k) => <span key={k} className={cn("h-1 w-1 rounded-full", k === "meeting" ? "bg-rag-blue" : "bg-rag-amber")} />)}</span>}
      </div>;
      if (!holiday && !off && !ev.length && !isToday) return <div key={i}>{cell}</div>;
      return <Tooltip key={i}><TooltipTrigger asChild>{cell}</TooltipTrigger><TooltipContent><div className="space-y-0.5">{isToday && <div>{l.today}</div>}{holiday && <div>{l.holiday}: {holiday.label}</div>}{off && <div>{off.label}</div>}{ev.map((e) => <div key={e.id}>{l[e.kind]}: {e.label}</div>)}</div></TooltipContent></Tooltip>;
    })}
  </div>;
}
