import { useMemo, useState } from "react";
import { Link, useBlocker, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Field } from "@/components/ui/field";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Briefcase, ChevronDown, X, Check, ChevronLeft } from "@/lib/icons";
import { useCalendars, useProjects, useTags } from "@/lib/projects-store";
import { parseLabelDate, formatLabelDate, toIsoDateLocal, type Project, type Rag } from "@/lib/mock-data";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type ProjectType = "capital" | "commercial";

const SECTIONS = [
  { id: "identity", label: "Identity" },
  { id: "classification", label: "Classification" },
  { id: "timeline", label: "Timeline" },
  { id: "financials", label: "Financials" },
  { id: "governance", label: "Calendar & Tags" },
] as const;

const PROJECT_TYPES = ["Software Solutions", "EPC", "Consultation", "Maintenance"];
const DEPARTMENTS = ["Engineering", "IT", "Operations", "R&D", "Finance"];
const CLIENTS = ["ACME Energy", "Northwind Logistics", "Global Tech"];
const STAGES = ["Initiation", "Planning", "Execution", "Monitoring", "Closure"] as const;

const DAY = 86_400_000;
const addDays = (iso: string, days: number) =>
  new Date(new Date(`${iso}T00:00:00`).getTime() + days * DAY).toISOString().slice(0, 10);
const diffDays = (a: string, b: string) =>
  Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / DAY) + 1;

export type FormState = {
  projectType: ProjectType | null;
  name: string;
  code: string;
  businessLine: string;
  departments: string[];
  client: string;
  stage: Project["stage"];
  startDate: string;
  duration: string;
  endDate: string;
  budget: string;
  revenue: string;
  tags: string[];
  calendarId: string;
};

type FormErrors = Partial<Record<"name" | "client", string>>;

const projectRequiredFieldsSchema = z.object({
  projectType: z.enum(["capital", "commercial"]),
  name: z.string().trim().min(1, "Project Name is required.").max(120, "Project Name must be 120 characters or less."),
  client: z.string().trim().max(120, "Client must be 120 characters or less."),
}).superRefine((value, context) => {
  if (value.projectType === "commercial" && (!value.client || value.client === "Internal")) {
    context.addIssue({ code: "custom", path: ["client"], message: "Client is required." });
  }
});

function emptyForm(calendarId: string): FormState {
  return {
    projectType: null, name: "", code: "", businessLine: PROJECT_TYPES[0],
    departments: ["Engineering"], client: "Internal", stage: "Initiation",
    startDate: "", duration: "", endDate: "", budget: "", revenue: "",
    tags: [], calendarId,
  };
}

function fromProject(p: Project, fallbackCalendar: string): FormState {
  const start = parseLabelDate(p.startDate);
  const end = parseLabelDate(p.endDate);
  const startIso = start ? toIsoDateLocal(start) : "";
  const endIso = end ? toIsoDateLocal(end) : "";
  return {
    projectType: !p.client || p.client === "Internal" ? "capital" : "commercial",
    name: p.name,
    code: p.code ?? "",
    businessLine: p.businessLine,
    departments: p.department ?? ["Engineering"],
    client: p.client ?? "Internal",
    stage: p.stage,
    startDate: startIso,
    duration: startIso && endIso ? String(diffDays(startIso, endIso)) : "",
    endDate: endIso,
    budget: String(p.budgetTotal ?? ""),
    revenue: "",
    tags: p.tags ?? [],
    calendarId: p.calendarId ?? fallbackCalendar,
  };
}

const autoCode = (t: ProjectType) =>
  `${t === "capital" ? "CAP" : "COM"}-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
const isAutoCode = (v: string) => /^(CAP|COM)-\d{4}-\d{4}$/.test(v.trim());

export function ProjectFormPage({ project }: { project?: Project }) {
  const isEdit = !!project;
  const navigate = useNavigate();
  const { calendars } = useCalendars();
  const { tags: orgTags } = useTags();
  const { addProject, updateProject } = useProjects();
  const fallbackCalendar = calendars[0]?.id ?? "";

  const initial = useMemo(
    () => (project ? fromProject(project, fallbackCalendar) : emptyForm(fallbackCalendar)),
    [project, fallbackCalendar],
  );
  const [form, setForm] = useState<FormState>(initial);
  const [dirty, setDirty] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "name" || key === "client") {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
    setDirty(true);
  };

  /* Unsaved-changes guard */

  const blocker = useBlocker({
    shouldBlockFn: () => dirty && !submitted,
    withResolver: true,
    enableBeforeUnload: () => dirty && !submitted,
  });

  function onStartChange(v: string) {
    setDirty(true);
    setForm((f) => {
      const next = { ...f, startDate: v };
      const d = parseInt(f.duration, 10);
      if (v && d > 0) next.endDate = addDays(v, d - 1);
      else if (v && f.endDate) {
        const n = diffDays(v, f.endDate);
        next.duration = n > 0 ? String(n) : "";
      }
      return next;
    });
  }
  function onDurationChange(v: string) {
    setDirty(true);
    setForm((f) => {
      const next = { ...f, duration: v };
      const d = parseInt(v, 10);
      if (f.startDate && d > 0) next.endDate = addDays(f.startDate, d - 1);
      return next;
    });
  }
  function onEndChange(v: string) {
    setDirty(true);
    setForm((f) => {
      const next = { ...f, endDate: v };
      if (f.startDate && v) {
        const n = diffDays(f.startDate, v);
        next.duration = n > 0 ? String(n) : "";
      }
      return next;
    });
  }

  function pickType(t: ProjectType) {
    setDirty(true);
    setForm((f) => ({
      ...f,
      projectType: t,
      client: t === "capital" ? "Internal" : f.client === "Internal" ? "" : f.client,
      code: !f.code.trim() || isAutoCode(f.code) ? autoCode(t) : f.code,
    }));
  }

  const checklist = [
    { label: "Project type selected", done: !!form.projectType },
    { label: "Project name", done: !!form.name.trim() },
    { label: "Timeline set", done: !!form.startDate && !!form.endDate },
    { label: "Budget entered", done: !!form.budget && parseFloat(form.budget) > 0 },
    { label: form.projectType === "commercial" ? "Client selected" : "Departments assigned", done: form.projectType === "commercial" ? !!form.client && form.client !== "Internal" : form.departments.length > 0 },
  ];
  const completion = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  function finish() {
    setSubmitted(true);
    setTimeout(() => {
      if (isEdit && project) navigate({ to: "/portfolio/$projectId", params: { projectId: project.id } });
      else navigate({ to: "/portfolio" });
    }, 0);
  }

  function handleSubmit() {
    if (!form.projectType) return;
    const result = projectRequiredFieldsSchema.safeParse(form);
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors;
      const nextErrors: FormErrors = {
        name: flattened.name?.[0],
        client: flattened.client?.[0],
      };
      setErrors(nextErrors);
      const firstInvalidId = nextErrors.name ? "project-name" : "project-client";
      requestAnimationFrame(() => {
        const field = document.getElementById(firstInvalidId);
        if (field instanceof HTMLElement) {
          (field.matches("input, button") ? field : field.querySelector<HTMLElement>("input, button"))?.focus();
        }
      });
      return;
    }
    const finalClient = form.projectType === "capital" ? "Internal" : form.client || "Internal";
    const startDateLabel = form.startDate ? formatLabelDate(new Date(`${form.startDate}T00:00:00`)) : "—";
    const endDateLabel = form.endDate ? formatLabelDate(new Date(`${form.endDate}T00:00:00`)) : "TBD";

    if (isEdit && project) {
      updateProject(project.id, {
        name: form.name.trim(),
        businessLine: form.businessLine,
        department: form.departments,
        client: finalClient,
        stage: form.stage,
        budgetTotal: parseFloat(form.budget) || 0,
        tags: form.tags,
        calendarId: form.calendarId || undefined,
        ...(form.code.trim() ? { code: form.code.trim() } : {}),
        ...(form.startDate ? { startDate: startDateLabel } : {}),
        ...(form.endDate ? { endDate: endDateLabel } : {}),
      });
      toast.success(`Project "${form.name.trim()}" updated`);
      finish();
      return;
    }

    addProject({
      id: `p-${Date.now()}`,
      code: form.code.trim() || autoCode(form.projectType),
      name: form.name.trim(),
      businessLine: form.businessLine,
      department: form.departments,
      client: finalClient,
      pm: "Unassigned",
      pmAvatar: "—",
      progress: 0,
      budgetUsed: 0,
      budgetTotal: parseFloat(form.budget) || 0,
      startDate: startDateLabel,
      endDate: endDateLabel,
      rag: "blue" as Rag,
      risks: 0,
      issues: 0,
      stage: form.stage,
      tags: form.tags,
      ragNote: "New",
      calendarId: form.calendarId || undefined,
    });
    toast.success(`Project "${form.name.trim()}" created`);
    finish();
  }

  function handleCancel() {
    if (dirty) { setLeaveOpen(true); return; }
    if (isEdit && project) navigate({ to: "/portfolio/$projectId", params: { projectId: project.id } });
    else navigate({ to: "/portfolio" });
  }

  const backTo = isEdit && project ? `Back to ${project.name}` : "Back to Portfolio";

  return (
    <div>

      {/* Back link — page is 2nd level so no breadcrumb trail */}
      {isEdit && project ? (
        <Link
          to="/portfolio/$projectId"
          params={{ projectId: project.id }}
          className="inline-flex items-center gap-1 text-sm text-breadcrumb-current transition-colors hover:text-breadcrumb-hover"
        >
          <ChevronLeft className="h-4 w-4" />{backTo}
        </Link>
      ) : (
        <Link
          to="/portfolio"
          className="inline-flex items-center gap-1 text-sm text-breadcrumb-current transition-colors hover:text-breadcrumb-hover"
        >
          <ChevronLeft className="h-4 w-4" />{backTo}
        </Link>
      )}

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-medium text-foreground">
            {isEdit ? "Edit Project" : "New Project"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEdit
              ? "Update project details. Schedule changes are managed in the project's Schedule tab."
              : "Set up a project in the portfolio. For initiatives requiring approval, submit a Business Case instead."}
          </p>
        </div>
        {form.projectType && (
          <Badge variant="outline" className="border-accent/40 bg-accent-dim text-accent">
            {form.projectType === "capital" ? "Capital / Internal" : "Commercial / External"}
          </Badge>
        )}
      </div>

      {!form.projectType ? (
        <TypeCards onPick={pickType} />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* ---------- Form column ---------- */}
          <div className="min-w-0 space-y-5">
            <TypeSwitch value={form.projectType} onChange={pickType} />

            <Section id="identity" title="Identity" subtitle="What this project is called and how it's referenced.">
              <Field className="sm:col-span-2" label="Project name *" htmlFor="project-name" error={errors.name}>
                <Input
                  id="project-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. ERP Integration Phase 2"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "project-name-error" : undefined}
                />
              </Field>
              <div>
                <Label>Project code</Label>
                <Input value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="Auto-generated" />
              </div>
              <div>
                <Label>Stage</Label>
                <Select value={form.stage} onValueChange={(v) => set("stage", v as Project["stage"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </Section>

            <Section id="classification" title="Classification" subtitle="How the project rolls up across the organization.">
              <div>
                <Label>Project type</Label>
                <Select value={form.businessLine} onValueChange={(v) => set("businessLine", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Departments</Label>
                <MultiPicker
                  options={DEPARTMENTS}
                  value={form.departments}
                  onChange={(v) => set("departments", v)}
                  placeholder="Select departments…"
                />
              </div>
              {form.projectType === "commercial" && (
                <Field className="sm:col-span-2" label="Client *" htmlFor="project-client" error={errors.client}>
                  <Select value={form.client} onValueChange={(v) => set("client", v)}>
                    <SelectTrigger id="project-client" aria-invalid={!!errors.client} aria-describedby={errors.client ? "project-client-error" : undefined}>
                      <SelectValue placeholder="Select a client…" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </Section>

            <Section id="timeline" title="Timeline" subtitle="Duration is calculated automatically from the dates.">
              <div>
                <Label>Start date</Label>
                <DatePicker value={form.startDate} onChange={onStartChange} placeholder="Pick start date" />
              </div>
              <div>
                <Label>Duration (days)</Label>
                <Input type="number" min="1" step="1" value={form.duration} onChange={(e) => onDurationChange(e.target.value)} placeholder="e.g. 120" />
              </div>
              <div>
                <Label>Target end date</Label>
                <DatePicker value={form.endDate} onChange={onEndChange} min={form.startDate || undefined} placeholder="Pick end date" />
              </div>
            </Section>

            <Section id="financials" title="Financials" subtitle="Approved budget and, for client work, expected revenue.">
              <div>
                <Label>Budget total ($M)</Label>
                <Input type="number" min="0" step="0.1" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="e.g. 2.5" />
              </div>
              {form.projectType === "commercial" && (
                <div>
                  <Label>Expected revenue ($M)</Label>
                  <Input type="number" min="0" step="0.1" value={form.revenue} onChange={(e) => set("revenue", e.target.value)} placeholder="e.g. 3.0" />
                </div>
              )}
            </Section>

            <Section id="governance" title="Calendar & Tags" subtitle="Working days and classification used across reporting.">
              <div className="sm:col-span-2">
                <Label>Working calendar</Label>
                <Select value={form.calendarId} onValueChange={(v) => set("calendarId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select a calendar…" /></SelectTrigger>
                  <SelectContent>
                    {calendars.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Working days and holidays applied to this project's schedule. Manage calendars in Organization → Calendars.
                </p>
              </div>
              <div className="sm:col-span-2">
                <Label>Tags (optional)</Label>
                <TagPicker options={orgTags} value={form.tags} onChange={(v) => set("tags", v)} />
                <p className="mt-1 text-[11px] text-muted-foreground">Tags come from Organization → Tags &amp; Classifications.</p>
              </div>
            </Section>
          </div>

          {/* ---------- Summary column ---------- */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              <div className="glass-card p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Setup completeness</span>
                  <span className="num-mono text-foreground">{completion}%</span>
                </div>
                <Progress value={completion} className="mt-2 h-1.5" />
                <ul className="mt-3 space-y-1.5">
                  {checklist.map((c) => (
                    <li key={c.label} className="flex items-center gap-2 text-xs">
                      <span className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                        c.done ? "bg-rag-green/20 text-rag-green" : "border border-border",
                      )}>
                        {c.done && <Check className="h-2.5 w-2.5" />}
                      </span>
                      <span className={c.done ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-card p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Live preview</p>
                <p className="mt-2 truncate text-sm font-medium text-foreground">{form.name.trim() || "Untitled project"}</p>
                <p className="text-xs text-muted-foreground">{form.code || "No code"}</p>
                <dl className="mt-3 space-y-1.5 text-xs">
                  <SummaryRow l="Client" v={form.projectType === "capital" ? "Internal" : form.client || "—"} />
                  <SummaryRow l="Project type" v={form.businessLine} />
                  <SummaryRow l="Departments" v={form.departments.join(", ") || "—"} />
                  <SummaryRow l="Stage" v={form.stage} />
                  <SummaryRow l="Timeline" v={form.startDate && form.endDate ? `${form.startDate} → ${form.endDate}` : "—"} />
                  <SummaryRow l="Budget" v={form.budget ? `$${form.budget}M` : "—"} />
                  {form.projectType === "commercial" && (
                    <SummaryRow l="Revenue" v={form.revenue ? `$${form.revenue}M` : "—"} />
                  )}
                </dl>
                {form.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {form.tags.map((t) => {
                      const color = orgTags.find((x) => x.name === t)?.color ?? "#94A3B8";
                      return (
                        <span
                          key={t}
                          className="rounded-full border px-2 py-0.5 text-[11px]"
                          style={{ color, borderColor: `${color}66`, backgroundColor: `${color}22` }}
                        >
                          {t}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <nav className="glass-card p-2">
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block rounded-md px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-secondary/40 hover:text-foreground"
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      )}

      {/* Sticky action bar */}
      {form.projectType && (
        <div className="sticky bottom-0 z-30 -mx-6 mt-6 border-t border-border bg-background/95 px-6 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <p className="hidden text-xs text-muted-foreground sm:block">
              {dirty ? "Unsaved changes" : "No changes yet"}
            </p>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmit}>
                {isEdit ? "Save Changes" : "Create Project"}
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* Explicit cancel confirmation */}
      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              Your changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveOpen(false)}>Keep editing</Button>
            <Button
              variant="primary"
              onClick={() => {
                setLeaveOpen(false);
                setSubmitted(true);
                setTimeout(() => {
                  if (isEdit && project) navigate({ to: "/portfolio/$projectId", params: { projectId: project.id } });
                  else navigate({ to: "/portfolio" });
                }, 0);
              }}
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Router-level guard for sidebar / back navigation */}
      <Dialog open={blocker.status === "blocked"} onOpenChange={(o) => { if (!o) blocker.reset?.(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leave this page?</DialogTitle>
            <DialogDescription>
              You have unsaved changes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => blocker.reset?.()}>Stay</Button>
            <Button variant="primary" onClick={() => blocker.proceed?.()}>Leave</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryRow({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{l}</dt>
      <dd className="truncate text-right text-foreground">{v}</dd>
    </div>
  );
}

function Section({
  id, title, subtitle, children,
}: { id: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="glass-card scroll-mt-6 p-5">
      <div className="mb-4">
        <h2 className="text-base font-medium text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function TypeSwitch({ value, onChange }: { value: ProjectType; onChange: (t: ProjectType) => void }) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-border bg-secondary/20 p-1">
      {([["capital", "Capital / Internal"], ["commercial", "Commercial / External"]] as const).map(([k, l]) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          aria-selected={value === k}
          className={cn(
            "flex-1 rounded-[6px] px-3 py-1.5 text-xs font-medium transition",
            value === k ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function TypeCards({ onPick }: { onPick: (t: ProjectType) => void }) {
  const cards = [
    {
      key: "capital" as const,
      label: "Capital / Internal",
      blurb: "Internally-funded initiatives, transformation, infrastructure and R&D.",
      icon: Building2,
      ring: "ring-accent/40",
      color: "text-accent",
    },
    {
      key: "commercial" as const,
      label: "Commercial / External",
      blurb: "Client engagements, delivery projects and third-party bids won.",
      icon: Briefcase,
      ring: "ring-rag-blue/40",
      color: "text-rag-blue",
    },
  ];
  return (
    <div className="mt-6">
      <p className="mb-4 text-sm text-muted-foreground">Choose the type of project to tailor the intake form.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onPick(c.key)}
              className={cn("glass-card group p-6 text-left transition hover:ring-2", c.ring)}
            >
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/50", c.color)}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-4 text-base font-medium text-foreground">{c.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.blurb}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MultiPicker({
  options, value, onChange, placeholder,
}: { options: string[]; value: string[]; onChange: (next: string[]) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const toggle = (n: string) => onChange(value.includes(n) ? value.filter((x) => x !== n) : [...value, n]);
  const shown = value.slice(0, 3);
  const extra = value.length - shown.length;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mt-1 flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-left text-sm"
        >
          <span className="flex flex-1 flex-wrap items-center gap-1.5">
            {value.length === 0 && <span className="text-muted-foreground">{placeholder}</span>}
            {shown.map((n) => (
              <span key={n} className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 px-2 py-0.5 text-[11px] text-foreground">
                {n}
                <X className="h-3 w-3 opacity-70 hover:opacity-100" onClick={(e) => { e.stopPropagation(); toggle(n); }} />
              </span>
            ))}
            {extra > 0 && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">+{extra} more</span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0">
        <div className="max-h-64 overflow-y-auto p-1">
          {options.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggle(d)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60"
            >
              <Checkbox checked={value.includes(d)} className="pointer-events-none rounded-[4px]" />
              <span className="flex-1 truncate">{d}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border px-2 py-1.5">
          <span className="text-[11px] text-muted-foreground">{value.length} selected</span>
          <Button variant="ghost" size="sm" onClick={() => onChange([])} disabled={value.length === 0}>Clear all</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TagPicker({
  options, value, onChange,
}: { options: { name: string; color: string }[]; value: string[]; onChange: (next: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const colorOf = (n: string) => options.find((t) => t.name === n)?.color ?? "#94A3B8";
  const toggle = (n: string) => onChange(value.includes(n) ? value.filter((x) => x !== n) : [...value, n]);
  const shown = value.slice(0, 4);
  const extra = value.length - shown.length;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mt-1 flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-left text-sm"
        >
          <span className="flex flex-1 flex-wrap items-center gap-1.5">
            {value.length === 0 && <span className="text-muted-foreground">Select tags…</span>}
            {shown.map((n) => (
              <span
                key={n}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]"
                style={{ color: colorOf(n), borderColor: `${colorOf(n)}66`, backgroundColor: `${colorOf(n)}22` }}
              >
                {n}
                <X className="h-3 w-3 opacity-70 hover:opacity-100" onClick={(e) => { e.stopPropagation(); toggle(n); }} />
              </span>
            ))}
            {extra > 0 && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">+{extra} more</span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0">
        <div className="max-h-64 overflow-y-auto p-1">
          {options.length === 0 && <p className="px-3 py-6 text-center text-xs text-muted-foreground">No tags found</p>}
          {options.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => toggle(t.name)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60"
            >
              <Checkbox checked={value.includes(t.name)} className="pointer-events-none rounded-[4px]" />
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
              <span className="flex-1 truncate" style={{ color: t.color }}>{t.name}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border px-2 py-1.5">
          <span className="text-[11px] text-muted-foreground">{value.length} selected</span>
          <Button variant="ghost" size="sm" onClick={() => onChange([])} disabled={value.length === 0}>Clear all</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
