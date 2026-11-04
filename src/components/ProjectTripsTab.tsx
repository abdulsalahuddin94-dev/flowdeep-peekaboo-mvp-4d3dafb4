import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useEmployees, type EmployeeTrip } from "@/lib/employees-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { MultiSelectField } from "@/components/ui/multi-select-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StyledTable, StyledTableBody, StyledTableCell, StyledTableHead, StyledTableHeader, StyledTableHeaderRow, StyledTableRow } from "@/components/StyledTable";
import { EmptyState } from "@/components/ds/EmptyState";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { Plus, Trash2 } from "@/lib/icons";
import { dollars } from "@/lib/money";
import { toast } from "@/lib/toast";
import { formatDateWithYear } from "@/lib/date-format";

const T = {
  en: { title: "Trips", add: "Add trip", destination: "Destination", purpose: "Purpose", milestone: "Linked milestone", none: "Not linked", travelers: "Travelers", travel: "Travel", work: "Trip work", perTraveler: "Cost / traveler", total: "Total cost", country: "Country", city: "City", travelStart: "Travel start date", travelEnd: "Travel end date", workStart: "Trip work start date", workEnd: "Trip work end date", tickets: "Tickets cost", visa: "Visa cost", perDiem: "Per diem cost", cancel: "Cancel", save: "Save", searchPeople: "Search team members", emptyTitle: "No trips yet", emptyDesc: "Plan a business trip for project team members and link it to a milestone.", added: "Trip added", removed: "Trip removed", selected: "selected", noTeam: "No team members assigned to this project", purposeHint: "e.g. Client requirements workshop", tripDetails: "Trip details", dates: "Dates", costs: "Costs" },
  ar: { title: "الرحلات", add: "إضافة رحلة", destination: "الوجهة", purpose: "الغرض", milestone: "المرحلة المرتبطة", none: "غير مرتبطة", travelers: "المسافرون", travel: "السفر", work: "العمل في الرحلة", perTraveler: "التكلفة / مسافر", total: "إجمالي التكلفة", country: "الدولة", city: "المدينة", travelStart: "تاريخ بداية السفر", travelEnd: "تاريخ نهاية السفر", workStart: "تاريخ بداية العمل", workEnd: "تاريخ نهاية العمل", tickets: "تكلفة التذاكر", visa: "تكلفة التأشيرة", perDiem: "البدل اليومي", cancel: "إلغاء", save: "حفظ", searchPeople: "ابحث في أعضاء الفريق", emptyTitle: "لا توجد رحلات", emptyDesc: "خطط لرحلة عمل لأعضاء فريق المشروع واربطها بمرحلة.", added: "تمت إضافة الرحلة", removed: "تم حذف الرحلة", selected: "محدد", noTeam: "لا يوجد أعضاء فريق في هذا المشروع", purposeHint: "مثال: ورشة متطلبات مع العميل", tripDetails: "تفاصيل الرحلة", dates: "التواريخ", costs: "التكاليف" },
};
const t = T.en;
const daysBetween = (a: string, b: string) => Math.max(1, Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86400000) + 1);

export function ProjectTripsTab({ project, milestones }: { project: string; milestones: string[] }) {
  const { employees, addProjectTrip, removeTripGroup } = useEmployees();
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<string | null>(null);
  const trips = useMemo(() => {
    const groups = new Map<string, { trip: EmployeeTrip; travelers: { id: string; name: string }[] }>();
    employees.forEach((e) => e.trips.filter((x) => x.project === project).forEach((x) => {
      const key = x.groupId ?? x.id;
      const g = groups.get(key) ?? { trip: x, travelers: [] };
      g.travelers.push({ id: e.id, name: e.name }); groups.set(key, g);
    }));
    return [...groups.entries()].map(([key, g]) => ({ key, ...g })).sort((a, b) => a.trip.from.localeCompare(b.trip.from));
  }, [employees, project]);
  const team = employees.filter((e) => e.active !== false && e.projects.includes(project));

  return <section className="space-y-4">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold">{t.title}</h2>
      {trips.length > 0 && <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="me-1 h-4 w-4" />{t.add}</Button>}
    </div>
    {!trips.length ? <EmptyState art="calendar" title={t.emptyTitle} description={t.emptyDesc} ctaLabel={t.add} onCta={() => setOpen(true)} /> :
      <StyledTable>
        <StyledTableHeader><StyledTableHeaderRow>{[t.destination, t.purpose, t.milestone, t.travelers, t.travel, t.work, t.perTraveler, t.total, ""].map((h, i) => <StyledTableHead key={i}>{h}</StyledTableHead>)}</StyledTableHeaderRow></StyledTableHeader>
        <StyledTableBody>{trips.map(({ key, trip, travelers }) => {
          const per = trip.ticketsCost + trip.visaCost + trip.perDiemCost;
          return <StyledTableRow key={key}>
            <StyledTableCell><div className="font-medium">{trip.city}</div><div className="text-xs text-muted-foreground">{trip.country}</div></StyledTableCell>
            <StyledTableCell>{trip.purpose || "—"}</StyledTableCell>
            <StyledTableCell>{trip.milestone || <span className="text-muted-foreground">{t.none}</span>}</StyledTableCell>
            <StyledTableCell><div className="flex flex-col gap-0.5">{travelers.map((v) => <Link key={v.id} to="/resources/employees/$employeeId" params={{ employeeId: v.id }} className="text-accent hover:underline">{v.name}</Link>)}</div></StyledTableCell>
            <StyledTableCell className="whitespace-nowrap">{formatDateWithYear(trip.from)} → {formatDateWithYear(trip.until)}</StyledTableCell>
            <StyledTableCell className="whitespace-nowrap">{formatDateWithYear(trip.workFrom)} → {formatDateWithYear(trip.workUntil)}</StyledTableCell>
            <StyledTableCell className="num-mono">{dollars(per)}</StyledTableCell>
            <StyledTableCell className="num-mono font-medium">{dollars(per * travelers.length)}</StyledTableCell>
            <StyledTableCell><Button size="icon" variant="dangerOutline" data-ds-size="auto" aria-label={t.removed} className="h-9 w-9 rounded-full" onClick={() => setDel(key)}><Trash2 className="h-4 w-4" /></Button></StyledTableCell>
          </StyledTableRow>;
        })}</StyledTableBody>
      </StyledTable>}
    <TripForm open={open} onClose={() => setOpen(false)} team={team} milestones={milestones} onSave={(ids, trip) => { addProjectTrip(ids, { ...trip, project }); setOpen(false); toast.success(t.added, { description: `${trip.city} · ${ids.length} ${t.travelers.toLowerCase()}` }); }} />
    {del && <ConfirmDeleteDialog label="trip" onCancel={() => setDel(null)} onConfirm={() => { const g = trips.find((x) => x.key === del); if (g) removeTripGroup(project, g.trip.groupId ?? g.trip.id); toast.success(t.removed); setDel(null); }} />}
  </section>;
}

type Errors = Partial<Record<"travelers" | "country" | "city" | "from" | "until" | "workFrom" | "workUntil", string>>;
function TripForm({ open, onClose, team, milestones, onSave }: { open: boolean; onClose: () => void; team: { id: string; name: string; role: string }[]; milestones: string[]; onSave: (ids: string[], trip: Omit<EmployeeTrip, "id" | "groupId">) => void }) {
  const empty = { country: "", city: "", purpose: "", milestone: "", from: "", until: "", workFrom: "", workUntil: "", ticketsCost: "", visaCost: "", perDiemCost: "" };
  const [f, setF] = useState(empty); const [ids, setIds] = useState<string[]>([]); const [errors, setErrors] = useState<Errors>({});
  useEffect(() => { if (open) { setF(empty); setIds([]); setErrors({}); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof typeof empty, v: string) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  function submit() {
    const next: Errors = {
      travelers: ids.length ? undefined : "Select at least one traveler.",
      country: f.country.trim() ? undefined : "Country is required.",
      city: f.city.trim() ? undefined : "City is required.",
      from: f.from ? undefined : "Travel start date is required.",
      until: !f.until ? "Travel end date is required." : f.until < f.from ? "Must be on or after the travel start date." : undefined,
      workFrom: !f.workFrom ? "Work start date is required." : f.from && f.workFrom < f.from ? "Must be within the travel dates." : undefined,
      workUntil: !f.workUntil ? "Work end date is required." : f.workUntil < f.workFrom ? "Must be on or after the work start date." : f.until && f.workUntil > f.until ? "Must be within the travel dates." : undefined,
    };
    setErrors(next); if (Object.values(next).some(Boolean)) return;
    onSave(ids, { country: f.country.trim(), city: f.city.trim(), purpose: f.purpose.trim() || undefined, milestone: f.milestone || undefined, from: f.from, until: f.until, workFrom: f.workFrom, workUntil: f.workUntil, days: daysBetween(f.from, f.until), ticketsCost: Number(f.ticketsCost) || 0, visaCost: Number(f.visaCost) || 0, perDiemCost: Number(f.perDiemCost) || 0 });
  }
  const date = (k: "from" | "until" | "workFrom" | "workUntil", label: string) => <Field label={label} htmlFor={`pt-${k}`} required error={errors[k]}><Input id={`pt-${k}`} type="date" value={f[k]} onChange={(e) => set(k, e.target.value)} /></Field>;
  const cost = (k: "ticketsCost" | "visaCost" | "perDiemCost", label: string) => <Field label={`${label} (USD)`} htmlFor={`pt-${k}`}><Input id={`pt-${k}`} type="number" min={0} placeholder="0" value={f[k]} onChange={(e) => set(k, e.target.value)} /></Field>;
  const options = team.map((m) => ({ value: m.id, label: m.name }));
  const perTraveler = (Number(f.ticketsCost) || 0) + (Number(f.visaCost) || 0) + (Number(f.perDiemCost) || 0);
  const section = (title: string, body: ReactNode) => <section className="px-6 py-4"><h3 className="mb-3 text-sm font-semibold">{title}</h3>{body}</section>;
  return <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
    <SheetContent side="right" className="flex flex-col gap-0 p-0">
      <SheetHeader className="border-b border-border px-6 py-5"><SheetTitle>{t.add}</SheetTitle></SheetHeader>
      <div className="flex-1 divide-y divide-border overflow-y-auto">
        {section(t.travelers, <Field error={errors.travelers}>
          <MultiSelectField id="pt-travelers" options={options} value={ids} invalid={!!errors.travelers} placeholder={t.searchPeople} onChange={(v) => { setIds(v); setErrors((e) => ({ ...e, travelers: undefined })); }} />
        </Field>)}
        {section(t.tripDetails, <div className="grid grid-cols-2 gap-3">
          <Field label={t.purpose} htmlFor="pt-purpose"><Input id="pt-purpose" placeholder={t.purposeHint} value={f.purpose} onChange={(e) => set("purpose", e.target.value)} /></Field>
          <Field label={t.milestone} htmlFor="pt-ms"><Select value={f.milestone || "__none"} onValueChange={(v) => set("milestone", v === "__none" ? "" : v)}><SelectTrigger id="pt-ms"><SelectValue>{f.milestone || t.none}</SelectValue></SelectTrigger><SelectContent><SelectItem value="__none">{t.none}</SelectItem>{milestones.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></Field>
        </div>)}
        {section(t.destination, <div className="grid grid-cols-2 gap-3">
          <Field label={t.country} htmlFor="pt-country" required error={errors.country}><Input id="pt-country" placeholder="e.g. Saudi Arabia" value={f.country} onChange={(e) => set("country", e.target.value)} /></Field>
          <Field label={t.city} htmlFor="pt-city" required error={errors.city}><Input id="pt-city" placeholder="e.g. Riyadh" value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
        </div>)}
        {section(t.dates, <div className="grid grid-cols-2 gap-3">
          {date("from", t.travelStart)}{date("until", t.travelEnd)}
          {date("workFrom", t.workStart)}{date("workUntil", t.workEnd)}
        </div>)}
        {section(t.costs, <>
          <div className="grid grid-cols-3 gap-3">{cost("ticketsCost", t.tickets)}{cost("visaCost", t.visa)}{cost("perDiemCost", t.perDiem)}</div>
          <div className="mt-4 space-y-1.5 rounded-lg bg-muted/30 px-3 py-2.5">
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{t.perTraveler}</span><span className="num-mono font-medium">{dollars(perTraveler)}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{t.total}{ids.length ? ` · ${ids.length} ${t.selected}` : ""}</span><span className="num-mono font-semibold">{dollars(perTraveler * ids.length)}</span></div>
          </div>
        </>)}
      </div>
      <div className="flex justify-end gap-3 border-t border-border px-6 py-4"><Button variant="outline" onClick={onClose}>{t.cancel}</Button><Button variant="primary" onClick={submit}>{t.save}</Button></div>
    </SheetContent>
  </Sheet>;
}
