import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useBackParam } from "@/lib/record-pages";
import { useEmployees, type EmployeeTrip } from "@/lib/employees-store";
import { Button } from "@/components/ui/button";
import { StyledTable, StyledTableBody, StyledTableCell, StyledTableHead, StyledTableHeader, StyledTableHeaderRow, StyledTableRow } from "@/components/StyledTable";
import { PageToolbar } from "@/components/ds/PageToolbar";
import { matchAnySelected } from "@/components/ds/filters";
import { EmptyState } from "@/components/ds/EmptyState";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, Plus, Trash2 } from "@/lib/icons";
import { dollars } from "@/lib/money";
import { toast } from "@/lib/toast";
import { formatDateWithYear } from "@/lib/date-format";

export const T = {
  en: { title: "Trips", add: "Add trip", destination: "Destination", purpose: "Purpose", milestone: "Linked milestone", none: "Not linked", travelers: "Travelers", travel: "Travel", work: "Trip work", perTraveler: "Cost / traveler", total: "Total cost", country: "Country", city: "City", travelStart: "Travel start date", travelEnd: "Travel end date", workStart: "Trip work start date", workEnd: "Trip work end date", tickets: "Tickets cost", visa: "Visa cost", perDiem: "Per diem cost", cancel: "Cancel", save: "Save", searchPeople: "Search team members", emptyTitle: "No trips yet", emptyDesc: "Plan a business trip for project team members and link it to a milestone.", added: "Trip added", removed: "Trip removed", selected: "selected", noTeam: "No team members assigned to this project", purposeHint: "e.g. Client requirements workshop", tripDetails: "Trip details", dates: "Dates", costs: "Costs", searchTrips: "Search destination or purpose…", employee: "Employee", allCountries: "All countries", allCities: "All cities", allEmployees: "All employees", noMatch: "No trips match your search or filters" },
  ar: { title: "الرحلات", add: "إضافة رحلة", destination: "الوجهة", purpose: "الغرض", milestone: "المرحلة المرتبطة", none: "غير مرتبطة", travelers: "المسافرون", travel: "السفر", work: "العمل في الرحلة", perTraveler: "التكلفة / مسافر", total: "إجمالي التكلفة", country: "الدولة", city: "المدينة", travelStart: "تاريخ بداية السفر", travelEnd: "تاريخ نهاية السفر", workStart: "تاريخ بداية العمل", workEnd: "تاريخ نهاية العمل", tickets: "تكلفة التذاكر", visa: "تكلفة التأشيرة", perDiem: "البدل اليومي", cancel: "إلغاء", save: "حفظ", searchPeople: "ابحث في أعضاء الفريق", emptyTitle: "لا توجد رحلات", emptyDesc: "خطط لرحلة عمل لأعضاء فريق المشروع واربطها بمرحلة.", added: "تمت إضافة الرحلة", removed: "تم حذف الرحلة", selected: "محدد", noTeam: "لا يوجد أعضاء فريق في هذا المشروع", purposeHint: "مثال: ورشة متطلبات مع العميل", tripDetails: "تفاصيل الرحلة", dates: "التواريخ", costs: "التكاليف", searchTrips: "ابحث بالوجهة أو الغرض…", employee: "الموظف", allCountries: "كل الدول", allCities: "كل المدن", allEmployees: "كل الموظفين", noMatch: "لا توجد رحلات مطابقة للبحث أو الفلاتر" },
};
const t = T.en;
export const daysBetween = (a: string, b: string) => Math.max(1, Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86400000) + 1);

export function ProjectTripsTab({ project, projectId }: { project: string; projectId: string }) {
  const { employees, removeTripGroup } = useEmployees();
  const navigate = useNavigate();
  const back = useBackParam();
  const openAdd = () => navigate({ to: "/trips/new", search: { project: projectId, back } });
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

  const [query, setQuery] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [people, setPeople] = useState<string[]>([]);
  const countryOptions = useMemo(() => [...new Set(trips.map((g) => g.trip.country))].sort((a, b) => a.localeCompare(b)), [trips]);
  const cityOptions = useMemo(() => [...new Set(trips.filter((g) => matchAnySelected(countries, [g.trip.country])).map((g) => g.trip.city))].sort((a, b) => a.localeCompare(b)), [trips, countries]);
  const peopleOptions = useMemo(() => {
    const seen = new Map<string, string>();
    trips.forEach((g) => g.travelers.forEach((v) => seen.set(v.id, v.name)));
    return [...seen.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [trips]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return trips.filter((g) =>
      (!q || g.trip.city.toLowerCase().includes(q) || g.trip.country.toLowerCase().includes(q) || (g.trip.purpose ?? "").toLowerCase().includes(q))
      && matchAnySelected(countries, [g.trip.country])
      && matchAnySelected(cities, [g.trip.city])
      && matchAnySelected(people, g.travelers.map((v) => v.id)));
  }, [trips, query, countries, cities, people]);

  return <section className="space-y-4">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold">{t.title}</h2>
      {trips.length > 0 && <Button size="sm" variant="outline" onClick={openAdd}><Plus className="me-1 h-4 w-4" />{t.add}</Button>}
    </div>
    {!trips.length ? <EmptyState art="calendar" title={t.emptyTitle} description={t.emptyDesc} ctaLabel={t.add} onCta={openAdd} /> :
      <>
      <PageToolbar query={query} onQueryChange={setQuery} placeholder={t.searchTrips} filterGroups={[
        { key: "country", label: t.country, value: countries, onChange: setCountries, mode: "multi", searchable: true, showAll: true, options: [{ value: "all", label: t.allCountries }, ...countryOptions.map((v) => ({ value: v, label: v }))] },
        { key: "city", label: t.city, value: cities, onChange: setCities, mode: "multi", searchable: true, showAll: true, options: [{ value: "all", label: t.allCities }, ...cityOptions.map((v) => ({ value: v, label: v }))] },
        { key: "employee", label: t.employee, value: people, onChange: setPeople, mode: "multi", searchable: true, showAll: true, options: [{ value: "all", label: t.allEmployees }, ...peopleOptions] },
      ]} />
      {!filtered.length ? <EmptyState art="search" title={t.noMatch} /> :
      <StyledTable>
        <StyledTableHeader><StyledTableHeaderRow>{[t.destination, t.purpose, t.milestone, t.travelers, t.travel, t.work, t.perTraveler, t.total, ""].map((h, i) => <StyledTableHead key={i}>{h}</StyledTableHead>)}</StyledTableHeaderRow></StyledTableHeader>
        <StyledTableBody>{filtered.map(({ key, trip, travelers }) => {
          const per = trip.ticketsCost + trip.visaCost + trip.perDiemCost;
          return <StyledTableRow key={key}>
            <StyledTableCell><div className="font-medium">{trip.city}</div><div className="text-xs text-muted-foreground">{trip.country}</div></StyledTableCell>
            <StyledTableCell>{trip.purpose || "—"}</StyledTableCell>
            <StyledTableCell>{trip.milestone || <span className="text-muted-foreground">{t.none}</span>}</StyledTableCell>
            <StyledTableCell><TravelersCell travelers={travelers} employees={employees} /></StyledTableCell>
            <StyledTableCell className="whitespace-nowrap">{formatDateWithYear(trip.from)} → {formatDateWithYear(trip.until)}</StyledTableCell>
            <StyledTableCell className="whitespace-nowrap">{formatDateWithYear(trip.workFrom)} → {formatDateWithYear(trip.workUntil)}</StyledTableCell>
            <StyledTableCell className="num-mono">{dollars(per)}</StyledTableCell>
            <StyledTableCell className="num-mono font-medium">{dollars(per * travelers.length)}</StyledTableCell>
            <StyledTableCell><Button size="icon" variant="dangerOutline" data-ds-size="auto" aria-label={t.removed} className="h-9 w-9 rounded-full" onClick={() => setDel(key)}><Trash2 className="h-4 w-4" /></Button></StyledTableCell>
          </StyledTableRow>;
        })}</StyledTableBody>
      </StyledTable>}
      </>}
    {del && <ConfirmDeleteDialog label="trip" onCancel={() => setDel(null)} onConfirm={() => { const g = trips.find((x) => x.key === del); if (g) removeTripGroup(project, g.trip.groupId ?? g.trip.id); toast.success(t.removed); setDel(null); }} />}
  </section>;
}

function TravelersCell({ travelers, employees }: { travelers: { id: string; name: string }[]; employees: { id: string; name: string; role: string; avatar?: string }[] }) {
  const [open, setOpen] = useState(false);
  const byId = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const shown = travelers.slice(0, 4);
  const extra = travelers.length - shown.length;
  // Click, not hover: the stack is a button that opens the standard people-list popup.
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={`${t.travelers} (${travelers.length})`}
      className="flex w-fit cursor-pointer items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {shown.map((v, i) => <Avatar key={v.id} className={`h-7 w-7 ring-2 ring-card ${i > 0 ? "-ms-2" : ""}`}>
        {byId.get(v.id)?.avatar ? <AvatarImage src={byId.get(v.id)?.avatar} alt={v.name} /> : null}
        <AvatarFallback className="bg-accent-dim text-[10px] font-medium text-accent">{v.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback>
      </Avatar>)}
      {extra > 0 && <span className="-ms-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium text-muted-foreground ring-2 ring-card">+{extra}</span>}
    </button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.travelers}</DialogTitle>
          <DialogDescription>{travelers.length}</DialogDescription>
        </DialogHeader>
        <div className="max-h-80 space-y-1 overflow-y-auto pe-1">
          {travelers.map((v) => {
            const e = byId.get(v.id);
            return <Link key={v.id} to="/resources/employees/$employeeId" params={{ employeeId: v.id }} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-secondary">
              <Avatar className="h-9 w-9 shrink-0">{e?.avatar ? <AvatarImage src={e.avatar} alt={v.name} /> : null}<AvatarFallback className="bg-accent-dim text-xs font-medium text-accent">{v.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{v.name}</div>
                {e?.role && <div className="truncate text-xs text-muted-foreground">{e.role}</div>}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-180" />
            </Link>;
          })}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}

