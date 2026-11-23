import { useMemo, useState, type ReactNode } from "react";
import { useEmployees, type EmployeeTrip } from "@/lib/employees-store";
import { useProjects } from "@/lib/projects-store";
import { PLAN_CACHE } from "@/lib/plan-cache";
import { seedMilestones } from "@/lib/plan-seeds";
import { useBackNav } from "@/lib/record-pages";
import { RecordPageHeader, T as recordT } from "@/components/ds/RecordPageHeader";
import { T as tripT, daysBetween } from "@/components/ProjectTripsTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { MultiSelectField } from "@/components/ui/multi-select-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOCATIONS } from "@/lib/locations";
import { dollars } from "@/lib/money";
import { toast } from "@/lib/toast";

const t = { ...tripT.en, pickDatesFirst: "Set the travel dates first", travelersHint: "Only team members without another trip in these dates are listed." };

/** Overlapping inclusive date ranges (YYYY-MM-DD strings compare lexically). */
export const overlaps = (a1: string, a2: string, b1: string, b2: string) => a1 <= b2 && b1 <= a2;

type Errors = Partial<Record<"travelers" | "country" | "city" | "from" | "until" | "workFrom" | "workUntil", string>>;

export function TripFormPage({ projectId, back }: { projectId?: string; back?: string }) {
  const { projects } = useProjects();
  const { employees, addProjectTrip } = useEmployees();
  const goBack = useBackNav();
  const project = projects.find((p) => p.id === projectId);
  const backUrl = back ?? (project ? `/portfolio/${project.id}?tab=Trips` : undefined);
  const fallback = { to: "/portfolio" };
  const milestones = useMemo(() => {
    if (!project) return [];
    const cached = (PLAN_CACHE.get(project.id) as { milestones?: { kind: string; name: string }[] } | undefined)?.milestones;
    const list = cached ?? (project.ragNote === "New" ? [] : seedMilestones(project));
    return list.filter((m) => m.kind === "Milestone").map((m) => m.name);
  }, [project]);

  const empty = { country: "", city: "", purpose: "", milestone: "", from: "", until: "", workFrom: "", workUntil: "", ticketsCost: "", visaCost: "", perDiemCost: "" };
  const [f, setF] = useState(empty); const [ids, setIds] = useState<string[]>([]); const [errors, setErrors] = useState<Errors>({});
  const set = (k: keyof typeof empty, v: string) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const datesReady = !!f.from && !!f.until && f.until >= f.from;
  // Travelers already on another trip during these travel dates are hidden so nobody is double-booked.
  const available = useMemo(() => !project || !datesReady ? [] : employees.filter((e) => e.active !== false && e.projects.includes(project.name)
    && !e.trips.some((x) => overlaps(f.from, f.until, x.from, x.until))), [employees, project, datesReady, f.from, f.until]);
  const selected = ids.filter((id) => available.some((e) => e.id === id));

  if (!project) return <RecordPageHeader kind="trip" back={back} title={t.add} subtitle="Project not found" />;

  function submit() {
    const next: Errors = {
      from: f.from ? undefined : "Travel start date is required.",
      until: !f.until ? "Travel end date is required." : f.until < f.from ? "Must be on or after the travel start date." : undefined,
      workFrom: !f.workFrom ? "Work start date is required." : f.from && f.workFrom < f.from ? "Must be within the travel dates." : undefined,
      workUntil: !f.workUntil ? "Work end date is required." : f.workUntil < f.workFrom ? "Must be on or after the work start date." : f.until && f.workUntil > f.until ? "Must be within the travel dates." : undefined,
      travelers: selected.length ? undefined : "Select at least one traveler.",
      country: f.country.trim() ? undefined : "Country is required.",
      city: f.city.trim() ? undefined : "City is required.",
    };
    setErrors(next); if (Object.values(next).some(Boolean) || !project) return;
    const trip: Omit<EmployeeTrip, "id" | "groupId"> = { project: project.name, country: f.country, city: f.city, purpose: f.purpose.trim() || undefined, milestone: f.milestone || undefined, from: f.from, until: f.until, workFrom: f.workFrom, workUntil: f.workUntil, days: daysBetween(f.from, f.until), ticketsCost: Number(f.ticketsCost) || 0, visaCost: Number(f.visaCost) || 0, perDiemCost: Number(f.perDiemCost) || 0 };
    addProjectTrip(selected, trip);
    toast.success(t.added, { description: `${trip.city} · ${selected.length} ${t.travelers.toLowerCase()}` });
    goBack(backUrl, fallback);
  }

  const date = (k: "from" | "until" | "workFrom" | "workUntil", label: string) => <Field label={label} htmlFor={`pt-${k}`} required error={errors[k]}><Input id={`pt-${k}`} type="date" value={f[k]} onChange={(e) => set(k, e.target.value)} /></Field>;
  const cost = (k: "ticketsCost" | "visaCost" | "perDiemCost", label: string) => <Field label={`${label} (USD)`} htmlFor={`pt-${k}`}><Input id={`pt-${k}`} type="number" min={0} placeholder="0" value={f[k]} onChange={(e) => set(k, e.target.value)} /></Field>;
  const perTraveler = (Number(f.ticketsCost) || 0) + (Number(f.visaCost) || 0) + (Number(f.perDiemCost) || 0);
  const section = (title: string, body: ReactNode) => <section className="space-y-3"><h3 className="text-sm font-semibold">{title}</h3>{body}</section>;

  return <>
    <RecordPageHeader kind="trip" back={backUrl} title={t.add} subtitle={`Project: ${project.name}`} />
    <div className="glass-card w-full p-6">
      <div className="space-y-6">
        {section(t.dates, <div className="grid gap-4 sm:grid-cols-2">
          {date("from", t.travelStart)}{date("until", t.travelEnd)}
          {date("workFrom", t.workStart)}{date("workUntil", t.workEnd)}
        </div>)}
        {section(t.travelers, <Field error={errors.travelers} hint={datesReady ? t.travelersHint : undefined}>
          <MultiSelectField id="pt-travelers" options={available.map((m) => ({ value: m.id, label: m.name }))} value={selected} invalid={!!errors.travelers}
            disabled={!datesReady} placeholder={datesReady ? t.searchPeople : t.pickDatesFirst}
            onChange={(v) => { setIds(v); setErrors((e) => ({ ...e, travelers: undefined })); }} />
        </Field>)}
        {section(t.tripDetails, <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.purpose} htmlFor="pt-purpose"><Input id="pt-purpose" placeholder={t.purposeHint} value={f.purpose} onChange={(e) => set("purpose", e.target.value)} /></Field>
          <Field label={t.milestone} htmlFor="pt-ms"><Select value={f.milestone || "__none"} onValueChange={(v) => set("milestone", v === "__none" ? "" : v)}><SelectTrigger id="pt-ms"><SelectValue>{f.milestone || t.none}</SelectValue></SelectTrigger><SelectContent><SelectItem value="__none">{t.none}</SelectItem>{milestones.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></Field>
        </div>)}
        {section(t.destination, <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.country} htmlFor="pt-country" required error={errors.country}><Select value={f.country} onValueChange={(country) => { if (country !== f.country) set("city", ""); set("country", country); }}><SelectTrigger id="pt-country" aria-invalid={!!errors.country}><SelectValue placeholder="Select country" /></SelectTrigger><SelectContent>{Object.keys(LOCATIONS).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
          <Field label={t.city} htmlFor="pt-city" required error={errors.city}><Select value={f.city} disabled={!f.country} onValueChange={(city) => set("city", city)}><SelectTrigger id="pt-city" aria-invalid={!!errors.city}><SelectValue placeholder="Select city" /></SelectTrigger><SelectContent>{(LOCATIONS[f.country] ?? []).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
        </div>)}
        {section(t.costs, <>
          <div className="grid gap-4 sm:grid-cols-3">{cost("ticketsCost", t.tickets)}{cost("visaCost", t.visa)}{cost("perDiemCost", t.perDiem)}</div>
          <div className="space-y-1.5 rounded-lg bg-muted/30 px-3 py-2.5">
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{t.perTraveler}</span><span className="num-mono font-medium">{dollars(perTraveler)}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{t.total}{selected.length ? ` · ${selected.length} ${t.selected}` : ""}</span><span className="num-mono font-semibold">{dollars(perTraveler * selected.length)}</span></div>
          </div>
        </>)}
      </div>
      <div className="mt-7 flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={() => goBack(backUrl, fallback)}>{recordT.en.cancel}</Button>
        <Button variant="primary" onClick={submit}>{recordT.en.save}</Button>
      </div>
    </div>
  </>;
}
