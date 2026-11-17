import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useMemo, useState } from "react";
import { RequestPeriod } from "@/components/RequestPeriod";
import { useResourceRequests, useJobRoles, employmentFromFte, requestQuantity, requestAssignees, requestCoverage, type Employment, type ResourceRequest } from "@/lib/projects-store";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StyledTable, StyledTableBody, StyledTableCell, StyledTableHead, StyledTableHeader, StyledTableHeaderRow, StyledTableRow } from "@/components/StyledTable";
import { EmptyState } from "@/components/ds/EmptyState";
import { Pill } from "@/components/Pill";
import { StatusPill } from "@/components/TableRowActions";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEmployees } from "@/lib/employees-store";
import { Plus, Users, ClipboardCheck, AlertTriangle } from "@/lib/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import { TableRowActions } from "@/components/TableRowActions";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { MultiSelectField } from "@/components/ui/multi-select-field";

export type TeamMember = { name: string; role: string; employment: Employment; /** Allocation window from task/period requests; undefined = whole project. */ window?: { from: string; until: string }; /** Joined only for specific tasks — no extra task assignment. */ taskOnly?: boolean };
const dayFrom = (d: string) => (d.length === 7 ? `${d}-01` : d.slice(0, 10));
const dayUntil = (d: string) => (d.length === 7 ? `${d}-31` : d.slice(0, 10));
/** Tasks whose dates fall outside the member's allocation window — a soft, non-blocking warning. */
export function tasksOutsideWindow(member: TeamMember, tasks: Item[]): Item[] {
  const w = member.window;
  if (!w) return [];
  return tasks.filter((i) => i.startDate.slice(0, 10) < w.from || i.endDate.slice(0, 10) > w.until);
}
type Item = { name: string; kind: string; startDate: string; endDate: string; assignee?: string; progress?: number };

/** Team = people placed on the project by fulfilled requests (team or task). Partially filled requests already count their assignees. */
export function projectTeam(project: string, requests: ResourceRequest[]): TeamMember[] {
  const map = new Map<string, TeamMember>();
  for (const r of requests) {
    if (r.project !== project || r.status === "Declined") continue;
    const employment = r.employment ?? employmentFromFte(r.fte);
    for (const name of requestAssignees(r)) {
      const prev = map.get(name);
      const w = requestCoverage(r) === "project" ? undefined : { from: dayFrom(r.periodStart ?? r.from), until: dayUntil(r.periodEnd ?? r.until) };
      const taskOnly = requestCoverage(r) === "task";
      if (!prev) map.set(name, { name, role: r.role, employment, window: w, taskOnly });
      else {
        if (employment === "Full time") prev.employment = "Full time";
        prev.taskOnly = prev.taskOnly && taskOnly;
        prev.window = !prev.window || !w ? undefined : { from: w.from < prev.window.from ? w.from : prev.window.from, until: w.until > prev.window.until ? w.until : prev.window.until };
      }
    }
  }
  return [...map.values()];
}

/** Empty Team sub-tab: nothing asked for yet, or asked and still with Resources. */
export function teamEmptyVariant(reqs: ResourceRequest[]): "none" | "waiting" {
  return reqs.some((r) => r.status !== "Fulfilled" && r.status !== "Declined") ? "waiting" : "none";
}

export function isWorkingNow(name: string, items: Item[], today = new Date()) {
  const t = today.getTime();
  return items.some((i) => i.kind === "Task" && i.assignee === name && (i.progress ?? 0) < 100
    && new Date(i.startDate).getTime() <= t && new Date(i.endDate).getTime() >= t);
}

const T = {
  en: { team: "Team", requests: "Requests", request: "Request role", member: "Member", role: "Role", employment: "Employment", tasks: "Tasks", status: "Status", seniority: "Seniority", priority: "Priority", notes: "Notes", coverage: "Request for", fullProject: "Full project", forTask: "Specific task", period: "Period of time", selectTask: "Select a task", startD: "Start date", endD: "End date", periodCol: "Period", project: "Project", active: "Active", inactive: "Inactive", emptyT: "No team members yet", emptyD: "Request the roles you need. Once Resources fulfills a request, the employee joins the team.", submit: "Send request", cancel: "Cancel", dlgDesc: "Resources will assign an employee for this role.", task: "Task", headcount: "Employees needed", filled: "filled", noReqT: "No requests yet", reqEmptyD: "Ask Resources for people — for the whole project, a specific task, or a period of time.", waitingT: "Waiting on Resources", waitingD: (n: number) => n === 1 ? "1 request is with Resources. The employee joins the team as soon as it is fulfilled." : `${n} requests are with Resources. Each employee joins the team as soon as their request is fulfilled.`, viewReq: "View requests", tasksOf: (n: string) => `${n} · Tasks`, noTasksYet: "No tasks assigned in this project yet.", assignTask: "Assign to task", assignDesc: (n: string) => `Pick one or more tasks in this project to assign to ${n}.`, pickTask: "Select tasks", assign: "Assign", assigned: (n: number): string => n === 1 ? "Task assigned" : "Tasks assigned", noFreeTasks: "All tasks already have this assignee.", progress: "Progress", dates: "Dates", editReq: "Edit request", save: "Save changes", actions: "Actions", reqUpdated: "Request updated", reqDeleted: "Request deleted", outT: "Outside allocation period", outD: (n: string, f: string, u: string) => `${n} is allocated to this project from ${f} to ${u}. These tasks start or end outside that period:`, assignAnyway: "Assign anyway" },
  ar: { team: "الفريق", requests: "الطلبات", request: "طلب دور", member: "العضو", role: "الدور", employment: "نوع الدوام", tasks: "المهام", status: "الحالة", seniority: "الخبرة", priority: "الأولوية", notes: "ملاحظات", coverage: "الطلب لـ", fullProject: "المشروع كامل", forTask: "مهمة محددة", period: "فترة زمنية", selectTask: "اختر مهمة", startD: "تاريخ البداية", endD: "تاريخ النهاية", periodCol: "الفترة", project: "المشروع", active: "نشط", inactive: "غير نشط", emptyT: "لا يوجد أعضاء بعد", emptyD: "اطلب الأدوار التي تحتاجها. وبعد تنفيذ الطلب من الموارد، ينضم الموظف إلى الفريق.", submit: "إرسال الطلب", cancel: "إلغاء", dlgDesc: "ستقوم الموارد بتعيين موظف لهذا الدور.", task: "مهمة", headcount: "عدد الموظفين المطلوب", filled: "تم تعيينهم", noReqT: "لا توجد طلبات بعد", reqEmptyD: "اطلب من الموارد موظفين — للمشروع كامل، أو لمهمة محددة، أو لفترة زمنية.", waitingT: "في انتظار الموارد", waitingD: (n: number) => `لديك ${n} ${n === 1 ? "طلب" : "طلبات"} لدى الموارد. ينضم كل موظف إلى الفريق فور تنفيذ طلبه.`, viewReq: "عرض الطلبات", tasksOf: (n: string) => `${n} · المهام`, noTasksYet: "لا توجد مهام مسندة في هذا المشروع بعد.", assignTask: "إسناد مهمة", assignDesc: (n: string) => `اختر مهمة أو أكثر في هذا المشروع لإسنادها إلى ${n}.`, pickTask: "اختر المهام", assign: "إسناد", assigned: (n: number): string => n === 1 ? "تم إسناد المهمة" : "تم إسناد المهام", noFreeTasks: "كل المهام مسندة بالفعل لهذا الموظف.", progress: "التقدم", dates: "التواريخ", editReq: "تعديل الطلب", save: "حفظ التغييرات", actions: "الإجراءات", reqUpdated: "تم تحديث الطلب", reqDeleted: "تم حذف الطلب", outT: "خارج فترة التخصيص", outD: (n: string, f: string, u: string) => `${n} مخصص لهذا المشروع من ${f} إلى ${u}. هذه المهام تبدأ أو تنتهي خارج هذه الفترة:`, assignAnyway: "إسناد على أي حال" },
};

export function ProjectTeamTab({ project, projectId, pm, items, lang = "en", onAssignTask }: { project: string; projectId: string; pm: string; items: Item[]; lang?: "en" | "ar"; /** Assigning staff to tasks is not a plan change, so it works outside Change Plan. */ onAssignTask?: (tasks: string[], member: TeamMember) => void }) {
  const t = T[lang];
  const covLabel = { project: t.project, task: t.task, period: t.periodCol };
  const { resourceRequests, addResourceRequest, updateResourceRequest, removeResourceRequest } = useResourceRequests();
  const [open, setOpen] = useState(false);
  const [tasksFor, setTasksFor] = useState<TeamMember | null>(null);
  const [assignFor, setAssignFor] = useState<TeamMember | null>(null);
  const [editing, setEditing] = useState<ResourceRequest | null>(null);
  const [deleting, setDeleting] = useState<ResourceRequest | null>(null);
  const isPending = (r: ResourceRequest) => r.status !== "Fulfilled" && r.status !== "Declined" && requestAssignees(r).length === 0;
  const rangeFor = (v: RoleRequestValue) => {
    const task = v.coverage === "task" ? items.find((i) => i.name === v.task) : undefined;
    const starts = items.map((i) => i.startDate).sort(), ends = items.map((i) => i.endDate).sort();
    const month = new Date().toISOString().slice(0, 7);
    const [from, until] = task ? [task.startDate, task.endDate] : v.coverage === "period" ? [v.start, v.end] : [starts[0] ?? month, ends[ends.length - 1] ?? month];
    return { task, from: from.slice(0, 10), until: until.slice(0, 10), periodStart: from, periodEnd: until };
  };
  const { employees } = useEmployees();
  const team = useMemo(() => projectTeam(project, resourceRequests), [project, resourceRequests]);
  const reqs = resourceRequests.filter((r) => r.project === project);
  const [tab, setTab] = useState("team");
  const pending = reqs.filter((r) => r.status !== "Fulfilled" && r.status !== "Declined").length;
  const waiting = !team.length && pending > 0;

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid h-11 w-full grid-cols-2 gap-0 rounded-lg border border-border bg-[var(--field-bg-filled)] p-1">
          <TabsTrigger value="team" className="h-9 gap-2 rounded-md border border-transparent bg-transparent px-4 text-xs text-muted-foreground data-[state=active]:border-accent/50 data-[state=active]:bg-accent/10 data-[state=active]:text-accent"><Users size={15} />{t.team}</TabsTrigger>
          <TabsTrigger value="requests" className="h-9 gap-2 rounded-md border border-transparent bg-transparent px-4 text-xs text-muted-foreground data-[state=active]:border-accent/50 data-[state=active]:bg-accent/10 data-[state=active]:text-accent"><ClipboardCheck size={15} />{t.requests}</TabsTrigger>
        </TabsList>
        <TabsContent value="team" className="mt-0 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-medium text-foreground">{t.team}<span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-accent-dim px-3 text-xs num-mono text-accent">{team.length}</span></h3>
        <Button variant="primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />{t.request}</Button>
      </div>
      {!team.length ? <EmptyState
        art={waiting ? "clock" : "people"}
        title={waiting ? t.waitingT : t.emptyT}
        description={waiting ? t.waitingD(pending) : t.emptyD}
        ctaLabel={t.request}
        onCta={() => setOpen(true)}
        actions={waiting ? <Button variant="outline" onClick={() => setTab("requests")}>{t.viewReq}</Button> : undefined}
      /> : (
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
                <div className="mt-4 text-xs text-muted-foreground">{m.employment}</div>
              </>
            );
            return (
              <div key={m.name} className="flex flex-col rounded-lg border border-border bg-card p-4 text-start transition-colors hover:border-primary/60">
                {emp ? <Link to="/resources/employees/$employeeId" params={{ employeeId: emp.id }} search={{ from: "team", projectId }} className="block">{body}</Link> : <div>{body}</div>}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <StatusPill isActive={working} label={working ? t.active : t.inactive} />
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setTasksFor(m)} className="rounded-md px-2 py-1 text-xs text-muted-foreground underline-offset-2 hover:text-accent hover:underline"><span className="num-mono text-foreground">{tasks}</span> {t.tasks}</button>
                    {onAssignTask && !m.taskOnly && <Button size="icon" variant="secondary" className="h-8 w-8" aria-label={t.assignTask} title={t.assignTask} onClick={() => setAssignFor(m)}><Plus className="h-4 w-4" /></Button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </TabsContent>

        <TabsContent value="requests" className="mt-0 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-medium text-foreground">{t.requests}<span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-accent-dim px-3 text-xs num-mono text-accent">{reqs.length}</span></h3>
        <Button variant="primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />{t.request}</Button>
      </div>
      {!reqs.length ? <EmptyState art="note" title={t.noReqT} description={t.reqEmptyD} ctaLabel={t.request} onCta={() => setOpen(true)} /> : (
        <div className="space-y-3">
          <StyledTable>
            <StyledTableHeader><StyledTableHeaderRow>{[t.role, t.coverage, t.task, t.employment, t.priority, t.notes, t.status].map((h, i) => <StyledTableHead key={i}>{h}</StyledTableHead>)}</StyledTableHeaderRow></StyledTableHeader>
            <StyledTableBody>
              {reqs.map((r) => {
                const statusPill = <Pill label={r.status} tone={r.status === "Fulfilled" ? "border-rag-green/40 text-rag-green" : r.status === "Declined" ? "border-rag-red/40 text-rag-red" : "border-rag-amber/40 text-rag-amber"} />;
                return (
                <StyledTableRow key={r.id}>
                  <StyledTableCell><div className="font-medium text-foreground">{r.role}{requestQuantity(r) > 1 ? <span className="num-mono text-muted-foreground"> × {requestQuantity(r)}</span> : null}</div><div className="text-xs text-muted-foreground">{r.skill}{requestQuantity(r) > 1 ? ` · ${requestAssignees(r).length} / ${requestQuantity(r)} ${t.filled}` : ""}</div></StyledTableCell>
                  <StyledTableCell>{covLabel[requestCoverage(r)]}</StyledTableCell>
                  <StyledTableCell><div>{r.task ?? "—"}</div>{(r.periodStart || (!r.task && r.from.length > 7)) ? <RequestPeriod from={r.periodStart ?? r.from} until={r.periodEnd ?? r.until} durationHours={r.durationHours} lang={lang} /> : null}</StyledTableCell>
                  <StyledTableCell>{r.employment ?? employmentFromFte(r.fte)}</StyledTableCell>
                  <StyledTableCell>{r.priority}</StyledTableCell>
                  <StyledTableCell><div className="max-w-72 break-words text-xs text-muted-foreground">{r.notes || "—"}</div></StyledTableCell>
                  {/* Status is the last column and steps aside for Edit/Delete on row hover
                      (DS02 row-actions pattern). Fulfilled/Declined rows keep the pill only. */}
                  <StyledTableCell className="w-36">{isPending(r) ? <TableRowActions statusNode={statusPill} editLabel={t.editReq} onEdit={() => setEditing(r)} onDelete={() => setDeleting(r)} /> : statusPill}</StyledTableCell>
                </StyledTableRow>
                );
              })}
            </StyledTableBody>
          </StyledTable>
        </div>
      )}
        </TabsContent>
      </Tabs>

      <MemberTasksDialog member={tasksFor} items={items} t={t} onClose={() => setTasksFor(null)} />
      <AssignTaskDialog member={assignFor} items={items} t={t} onClose={() => setAssignFor(null)} onAssign={(tasks) => { if (assignFor) { onAssignTask?.(tasks, assignFor); toast.success(t.assigned(tasks.length), { description: `${tasks.join(", ")} → ${assignFor.name}` }); } setAssignFor(null); }} />
      <RequestRoleDialog key={editing?.id ?? "edit"} open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }} lang={lang} title={t.editReq} submitLabel={t.save}
        initial={editing ? { role: editing.role, skill: editing.skill, employment: editing.employment ?? employmentFromFte(editing.fte), priority: editing.priority, notes: editing.notes ?? "", quantity: requestQuantity(editing), coverage: requestCoverage(editing), task: editing.task ?? "", start: requestCoverage(editing) === "period" ? editing.from : "", end: requestCoverage(editing) === "period" ? editing.until : "" } : undefined}
        tasks={items.filter((i) => i.kind === "Task").map((i) => i.name)} onSubmit={(v) => {
          if (!editing) return;
          const { task, from, until, periodStart, periodEnd } = rangeFor(v);
          updateResourceRequest(editing.id, { scope: task ? "task" : "team", coverage: v.coverage, task: task?.name, role: v.role, skill: v.skill, employment: v.employment, fte: v.employment === "Full time" ? 1 : 0.5, quantity: v.quantity, from, until, periodStart, periodEnd, durationHours: undefined, priority: v.priority, notes: v.notes });
          toast.success(t.reqUpdated);
        }} />
      <ConfirmDeleteDialog label={deleting ? `${deleting.role}${requestQuantity(deleting) > 1 ? ` × ${requestQuantity(deleting)}` : ""}` : undefined} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) { removeResourceRequest(deleting.id); toast.success(t.reqDeleted); } setDeleting(null); }} />
      <RequestRoleDialog open={open} onOpenChange={setOpen} lang={lang} tasks={items.filter((i) => i.kind === "Task").map((i) => i.name)} onSubmit={(v) => {
        const task = v.coverage === "task" ? items.find((i) => i.name === v.task) : undefined;
        const starts = items.map((i) => i.startDate).sort(), ends = items.map((i) => i.endDate).sort();
        const month = new Date().toISOString().slice(0, 7);
        const [from, until] = task ? [task.startDate, task.endDate]
          : v.coverage === "period" ? [v.start, v.end]
          : [starts[0] ?? month, ends[ends.length - 1] ?? month];
        addResourceRequest({ project, scope: task ? "task" : "team", coverage: v.coverage, task: task?.name, role: v.role, skill: v.skill, employment: v.employment, fte: v.employment === "Full time" ? 1 : 0.5, quantity: v.quantity, from: from.slice(0, 10), until: until.slice(0, 10), periodStart: from, periodEnd: until, priority: v.priority, submittedBy: pm, notes: v.notes });
        toast.success("Role request sent to Resources");
      }} />
    </div>
  );
}

export type RoleRequestValue = { role: string; skill: ResourceRequest["skill"]; employment: Employment; priority: ResourceRequest["priority"]; notes: string; quantity: number; coverage: "project" | "task" | "period"; task: string; start: string; end: string };

export function RequestRoleDialog({ open, onOpenChange, onSubmit, lang = "en", description, tasks, initial, title, submitLabel }: { open: boolean; onOpenChange: (o: boolean) => void; onSubmit: (v: RoleRequestValue) => void; lang?: "en" | "ar"; description?: string; tasks?: string[]; initial?: RoleRequestValue; title?: string; submitLabel?: string }) {
  const t = T[lang];
  const { jobRoles } = useJobRoles();
  const [v, setV] = useState<RoleRequestValue>(initial ?? { role: "", skill: "Mid", employment: "Full time", priority: "Medium", notes: "", quantity: 1, coverage: "project", task: "", start: "", end: "" });
  const [err, setErr] = useState("");
  const [covErr, setCovErr] = useState("");
  const submit = () => {
    if (!v.role) { setErr("Select a role."); return; }
    if (tasks && v.coverage === "task" && !v.task) { setCovErr("Select a task."); return; }
    if (tasks && v.coverage === "period" && (!v.start || !v.end)) { setCovErr("Pick start and end dates."); return; }
    if (tasks && v.coverage === "period" && v.end < v.start) { setCovErr("End date must be after start date."); return; }
    setCovErr("");
    onSubmit(v); onOpenChange(false); setErr("");
    setV({ role: "", skill: "Mid", employment: "Full time", priority: "Medium", notes: "", quantity: 1, coverage: "project", task: "", start: "", end: "" });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title ?? t.request}</DialogTitle><DialogDescription>{description ?? t.dlgDesc}</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <Field label={t.role} required error={err}>
            <Select value={v.role} onValueChange={(role) => { setV({ ...v, role }); setErr(""); }}>
              <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>{jobRoles.map((r) => <SelectItem key={r.title} value={r.title}>{r.title}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          {tasks && (
            <>
              <Field label={t.coverage} error={covErr && v.coverage === "project" ? covErr : undefined}>
                <Select value={v.coverage} onValueChange={(c) => { setV({ ...v, coverage: c as RoleRequestValue["coverage"] }); setCovErr(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">{t.fullProject}</SelectItem>
                    <SelectItem value="task">{t.forTask}</SelectItem>
                    <SelectItem value="period">{t.period}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {v.coverage === "task" && (
                <Field label={t.task} required error={covErr || undefined}>
                  <Select value={v.task} onValueChange={(task) => { setV({ ...v, task }); setCovErr(""); }}>
                    <SelectTrigger><SelectValue placeholder={t.selectTask} /></SelectTrigger>
                    <SelectContent>{tasks.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              )}
              {v.coverage === "period" && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.startD} required error={covErr || undefined}>
                    <DatePicker value={v.start} onChange={(start) => { setV({ ...v, start }); setCovErr(""); }} max={v.end || undefined} placeholder={t.startD} />
                  </Field>
                  <Field label={t.endD} required>
                    <DatePicker value={v.end} onChange={(end) => { setV({ ...v, end }); setCovErr(""); }} min={v.start || undefined} placeholder={t.endD} />
                  </Field>
                </div>
              )}
            </>
          )}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.priority}>
              <Select value={v.priority} onValueChange={(p) => setV({ ...v, priority: p as RoleRequestValue["priority"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["Critical", "High", "Medium", "Low"] as const).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label={t.headcount}>
              <Input type="number" min={1} max={99} value={v.quantity} onChange={(e) => setV({ ...v, quantity: Math.max(1, Math.min(99, Math.floor(Number(e.target.value) || 1))) })} />
            </Field>
          </div>
          <Field label={t.notes} optional>
            <Textarea value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
          <Button variant="primary" onClick={submit}>{submitLabel ?? t.submit}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type TeamT = (typeof T)["en"];

/** Tasks a team member holds in this project, opened from the card's task count. */
function MemberTasksDialog({ member, items, t, onClose }: { member: TeamMember | null; items: Item[]; t: TeamT; onClose: () => void }) {
  const tasks = member ? items.filter((i) => i.assignee === member.name) : [];
  return (
    <Dialog open={!!member} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{member ? t.tasksOf(member.name) : ""}</DialogTitle><DialogDescription>{member?.role}</DialogDescription></DialogHeader>
        {!tasks.length ? <p className="py-6 text-center text-sm text-muted-foreground">{t.noTasksYet}</p> : (
          <ul className="max-h-96 divide-y divide-border overflow-y-auto rounded-lg border border-border">
            {tasks.map((i) => (
              <li key={i.name} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0"><div className="truncate text-sm font-medium text-foreground">{i.name}</div><div className="text-xs num-mono text-muted-foreground">{i.startDate.slice(0, 10)} → {i.endDate.slice(0, 10)}</div></div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Quick-assign a team member to one or more tasks in this project. */
function AssignTaskDialog({ member, items, t, onClose, onAssign }: { member: TeamMember | null; items: Item[]; t: TeamT; onClose: () => void; onAssign: (tasks: string[]) => void }) {
  const [tasks, setTasks] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [pending, setPending] = useState<string[] | null>(null);
  const options = member ? items.filter((i) => i.kind === "Task" && i.assignee !== member.name) : [];
  const close = () => { onClose(); setTasks([]); setErr(""); setPending(null); };
  /* Soft, non-blocking check: surfaced only after Assign, so picking tasks stays uninterrupted. */
  const outside = member?.window && pending ? tasksOutsideWindow(member, options.filter((i) => pending.includes(i.name))) : [];
  const confirmAssign = () => { if (!pending) return; onAssign(pending); setTasks([]); setPending(null); };
  return (
    <>
    <Dialog open={!!member && !pending} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t.assignTask}</DialogTitle><DialogDescription>{member ? t.assignDesc(member.name) : ""}</DialogDescription></DialogHeader>
        {!options.length ? <p className="py-4 text-sm text-muted-foreground">{t.noFreeTasks}</p> : (
          <Field label={t.tasks} required error={err || undefined}>
            <MultiSelectField
              options={options.map((i) => ({ value: i.name, label: i.name }))}
              value={tasks}
              onChange={(value) => { setTasks(value); setErr(""); }}
              placeholder={t.pickTask}
              invalid={!!err}
              maxVisible={1}
            />
          </Field>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={close}>{t.cancel}</Button>
          <Button variant="primary" disabled={!options.length} onClick={() => { if (!tasks.length) { setErr(t.pickTask); return; } const bad = member ? tasksOutsideWindow(member, options.filter((i) => tasks.includes(i.name))) : []; if (bad.length) { setPending(tasks); return; } onAssign(tasks); setTasks([]); }}>{t.assign}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ConfirmDialog
      open={!!pending}
      onOpenChange={(o) => { if (!o) setPending(null); }}
      tone="warning"
      title={t.outT}
      description={member?.window ? t.outD(member.name, member.window.from, member.window.until) : ""}
      cancelLabel={t.cancel}
      confirmLabel={t.assignAnyway}
      onConfirm={confirmAssign}
    >
      <ul className="space-y-1 rounded-lg border border-border bg-card p-3 text-sm">
        {outside.map((i) => <li key={i.name} className="text-foreground">{i.name} <span className="text-muted-foreground">· {i.startDate.slice(0, 10)} → {i.endDate.slice(0, 10)}</span></li>)}
      </ul>
    </ConfirmDialog>
    </>
  );
}
