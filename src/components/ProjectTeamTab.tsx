import { useMemo, useState } from "react";
import { useResourceRequests, useJobRoles, employmentFromFte, requestQuantity, requestAssignees, type Employment, type ResourceRequest } from "@/lib/projects-store";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StyledTable, StyledTableBody, StyledTableCell, StyledTableHead, StyledTableHeader, StyledTableHeaderRow, StyledTableRow } from "@/components/StyledTable";
import { EmptyState } from "@/components/ds/EmptyState";
import { Pill } from "@/components/Pill";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEmployees } from "@/lib/employees-store";
import { Plus } from "@/lib/icons";
import { toast } from "@/lib/toast";

export type TeamMember = { name: string; role: string; employment: Employment };
type Item = { name: string; kind: string; startDate: string; endDate: string; assignee?: string; progress?: number };

/** Team = people placed on the project by fulfilled requests (team or task). Partially filled requests already count their assignees. */
export function projectTeam(project: string, requests: ResourceRequest[]): TeamMember[] {
  const map = new Map<string, TeamMember>();
  for (const r of requests) {
    if (r.project !== project || r.status === "Declined") continue;
    const employment = r.employment ?? employmentFromFte(r.fte);
    for (const name of requestAssignees(r)) {
      const prev = map.get(name);
      if (!prev) map.set(name, { name, role: r.role, employment });
      else if (employment === "Full time") prev.employment = "Full time";
    }
  }
  return [...map.values()];
}

export function isWorkingNow(name: string, items: Item[], today = new Date()) {
  const t = today.getTime();
  return items.some((i) => i.kind === "Task" && i.assignee === name && (i.progress ?? 0) < 100
    && new Date(i.startDate).getTime() <= t && new Date(i.endDate).getTime() >= t);
}

const T = {
  en: { team: "Team", requests: "Requests", request: "Request role", member: "Member", role: "Role", employment: "Employment", tasks: "Tasks", status: "Status", type: "Type", seniority: "Seniority", priority: "Priority", notes: "Notes", working: "Working now", idle: "Not working now", emptyT: "No team members yet", emptyD: "Request a role. Once Resources fulfills it, the employee joins the team.", submit: "Send request", cancel: "Cancel", dlgDesc: "Resources will assign an employee for this role.", task: "Task", teamScope: "Team" },
  ar: { team: "الفريق", requests: "الطلبات", request: "طلب دور", member: "العضو", role: "الدور", employment: "نوع الدوام", tasks: "المهام", status: "الحالة", type: "النوع", seniority: "الخبرة", priority: "الأولوية", notes: "ملاحظات", working: "يعمل الآن", idle: "لا يعمل الآن", emptyT: "لا يوجد أعضاء بعد", emptyD: "اطلب دورًا، وبعد تنفيذه من الموارد ينضم الموظف للفريق.", submit: "إرسال الطلب", cancel: "إلغاء", dlgDesc: "ستقوم الموارد بتعيين موظف لهذا الدور.", task: "مهمة", teamScope: "فريق" },
};

export function ProjectTeamTab({ project, projectId, pm, items, lang = "en" }: { project: string; projectId: string; pm: string; items: Item[]; lang?: "en" | "ar" }) {
  const t = T[lang];
  const { resourceRequests, addResourceRequest } = useResourceRequests();
  const [open, setOpen] = useState(false);
  const { employees } = useEmployees();
  const team = useMemo(() => projectTeam(project, resourceRequests), [project, resourceRequests]);
  const reqs = resourceRequests.filter((r) => r.project === project);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-medium text-foreground">{t.team}<span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-accent-dim px-3 text-xs num-mono text-accent">{team.length}</span></h3>
        <Button variant="primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />{t.request}</Button>
      </div>
      {!team.length ? <EmptyState art="role" title={t.emptyT} description={t.emptyD} ctaLabel={t.request} onCta={() => setOpen(true)} /> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {team.map((m) => {
            const working = isWorkingNow(m.name, items);
            const tasks = items.filter((i) => i.assignee === m.name).length;
            const emp = employees.find((e) => e.name === m.name);
            const body = (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 shrink-0">{emp?.avatar ? <AvatarImage src={emp.avatar} alt={m.name} /> : null}<AvatarFallback className="bg-accent-dim text-sm font-medium text-accent">{m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">{m.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{m.role}</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{m.employment}</span>
                  <span><span className="num-mono text-foreground">{tasks}</span> {t.tasks}</span>
                </div>
                <div className="mt-3"><Pill label={working ? t.working : t.idle} tone={working ? "border-rag-green/40 text-rag-green" : "border-border text-muted-foreground"} /></div>
              </>
            );
            const cls = "block rounded-lg border border-border bg-card p-4 text-start transition-colors";
            return emp ? (
              <Link key={m.name} to="/resources/employees/$employeeId" params={{ employeeId: emp.id }} search={{ from: "team", projectId }} className={`${cls} hover:border-primary/60`}>{body}</Link>
            ) : <div key={m.name} className={cls}>{body}</div>;
          })}
        </div>
      )}

      {reqs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-medium text-foreground">{t.requests}</h3>
          <StyledTable>
            <StyledTableHeader><StyledTableHeaderRow>{[t.role, t.type, t.task, t.employment, t.priority, t.status].map((h, i) => <StyledTableHead key={i}>{h}</StyledTableHead>)}</StyledTableHeaderRow></StyledTableHeader>
            <StyledTableBody>
              {reqs.map((r) => (
                <StyledTableRow key={r.id}>
                  <StyledTableCell><div className="font-medium text-foreground">{r.role}</div><div className="text-xs text-muted-foreground">{r.skill}</div></StyledTableCell>
                  <StyledTableCell>{r.scope === "team" ? t.teamScope : t.task}</StyledTableCell>
                  <StyledTableCell>{r.task ?? "—"}</StyledTableCell>
                  <StyledTableCell>{r.employment ?? employmentFromFte(r.fte)}</StyledTableCell>
                  <StyledTableCell>{r.priority}</StyledTableCell>
                  <StyledTableCell><Pill label={r.status} tone={r.status === "Fulfilled" ? "border-rag-green/40 text-rag-green" : r.status === "Declined" ? "border-rag-red/40 text-rag-red" : "border-rag-amber/40 text-rag-amber"} /></StyledTableCell>
                </StyledTableRow>
              ))}
            </StyledTableBody>
          </StyledTable>
        </div>
      )}

      <RequestRoleDialog open={open} onOpenChange={setOpen} lang={lang} onSubmit={(v) => {
        const month = new Date().toISOString().slice(0, 7);
        addResourceRequest({ project, scope: "team", role: v.role, skill: v.skill, employment: v.employment, fte: v.employment === "Full time" ? 1 : 0.5, from: month, until: month, priority: v.priority, submittedBy: pm, notes: v.notes });
        toast.success("Role request sent to Resources");
      }} />
    </div>
  );
}

export type RoleRequestValue = { role: string; skill: ResourceRequest["skill"]; employment: Employment; priority: ResourceRequest["priority"]; notes: string };

export function RequestRoleDialog({ open, onOpenChange, onSubmit, lang = "en", description }: { open: boolean; onOpenChange: (o: boolean) => void; onSubmit: (v: RoleRequestValue) => void; lang?: "en" | "ar"; description?: string }) {
  const t = T[lang];
  const { jobRoles } = useJobRoles();
  const [v, setV] = useState<RoleRequestValue>({ role: "", skill: "Mid", employment: "Full time", priority: "Medium", notes: "" });
  const [err, setErr] = useState("");
  const submit = () => {
    if (!v.role) { setErr("Select a role."); return; }
    onSubmit(v); onOpenChange(false); setErr("");
    setV({ role: "", skill: "Mid", employment: "Full time", priority: "Medium", notes: "" });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t.request}</DialogTitle><DialogDescription>{description ?? t.dlgDesc}</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <Field label={t.role} required error={err}>
            <Select value={v.role} onValueChange={(role) => { setV({ ...v, role }); setErr(""); }}>
              <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>{jobRoles.map((r) => <SelectItem key={r.title} value={r.title}>{r.title}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.seniority}>
              <Select value={v.skill} onValueChange={(skill) => setV({ ...v, skill: skill as RoleRequestValue["skill"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["Junior", "Mid", "Senior", "Lead"] as const).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label={t.employment}>
              <Select value={v.employment} onValueChange={(e) => setV({ ...v, employment: e as Employment })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["Full time", "Part time"] as const).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label={t.priority}>
            <Select value={v.priority} onValueChange={(p) => setV({ ...v, priority: p as RoleRequestValue["priority"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["Critical", "High", "Medium", "Low"] as const).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label={t.notes} optional>
            <Textarea value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
          <Button variant="primary" onClick={submit}>{t.submit}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
