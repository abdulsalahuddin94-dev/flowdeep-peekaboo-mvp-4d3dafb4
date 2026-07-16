import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useMemo, useEffect, Fragment } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RagBadge } from "@/components/RagBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, FileText, MessageSquare, Paperclip, Download, UserPlus, ChevronDown, ChevronRight, Send, CheckCircle2, XCircle, Plus, AlertTriangle, Upload, FileUp, Pencil, ArrowUpRight, Clock, Check } from "lucide-react";
import type { Rag } from "@/lib/mock-data";
import { projects, vendors as vendorList, resources as resourcePool } from "@/lib/mock-data";
import { useProjects, useNotifications, useRfps, useResourceRequests, useCalendars, type RfpEntry, type ResourceRequest } from "@/lib/projects-store";
import { toast } from "sonner";
import { ProjectGantt } from "@/components/ProjectGantt";
import { ProjectSchedule, computePlannedProgress } from "@/components/ProjectSchedule";
void ProjectGantt;

export const Route = createFileRoute("/portfolio/$projectId")({
  component: ProjectDetail,
  loader: ({ params }) => {
    const p = projects.find((x) => x.id === params.projectId);
    if (!p) throw notFound();
    return { project: p };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.project.name ?? "Project"} — Nexus PMO` },
      { name: "description", content: `Full project workspace: planning, milestones, RAID, financials, team & status reporting for ${loaderData?.project.name}.` },
    ],
  }),
});

const TABS = [
  "Overview", "Project Charter", "Project Schedule", "Team & Allocation", "Financials",
  "Project Risks", "Status Reports", "Procurement", "Business Trips", "Stakeholders", "Lessons Learned",
];

const PLANNING_STAGES = [
  { n: 1, name: "Initiation", state: "done" as const },
  { n: 2, name: "Planning",   state: "active" as const },
  { n: 3, name: "Execution",  state: "todo" as const },
  { n: 4, name: "Monitoring", state: "todo" as const },
  { n: 5, name: "Closure",    state: "todo" as const },
];

const PLANNING_CHECKLIST = [
  { label: "Objectives & scope defined", done: true },
  { label: "Milestone schedule created", done: true },
  { label: "Manpower requirements submitted", done: true },
  { label: "Business trips planned", done: false },
  { label: "Budget plan approved", done: false },
  { label: "Charter approved", done: false },
];

const INITIAL_GATE_DATA: GateStage[] = [
  { name: "Initiation", items: [
    { task: "Define project objectives & scope", role: "Project Manager", done: true },
    { task: "Identify key stakeholders", role: "Project Manager", done: true },
    { task: "Obtain project charter approval", role: "Executive Sponsor", done: true },
  ]},
  { name: "Planning", items: [
    { task: "Develop project management plan", role: "Project Manager", done: true },
    { task: "Estimate resources and budget", role: "Finance Manager", done: true },
    { task: "Risk assessment completed", role: "Project Manager", done: false },
    { task: "Procurement plan approved", role: "Procurement Lead", done: false },
  ]},
  { name: "Execution", items: [
    { task: "Kick-off meeting conducted", role: "Project Manager", done: false },
    { task: "All team members onboarded", role: "Resource Manager", done: false },
    { task: "First sprint review completed", role: "Tech Lead", done: false },
  ]},
  { name: "Monitoring", items: [
    { task: "Weekly status reports submitted", role: "Project Manager", done: false },
    { task: "Budget variance within 5%", role: "Finance Manager", done: false },
    { task: "RAID log up to date", role: "Project Manager", done: false },
  ]},
  { name: "Closure", items: [
    { task: "All deliverables accepted by client / sponsor", role: "Executive Sponsor", done: false },
    { task: "Project documentation complete and filed", role: "Project Manager", done: false },
    { task: "Lessons learned documented", role: "Project Manager", done: false },
    { task: "Final financial report approved", role: "Finance Manager", done: false },
    { task: "Stakeholder sign-off obtained", role: "Executive Sponsor", done: false },
    { task: "All contracts closed and vendors notified", role: "Procurement Lead", done: false },
    { task: "Project archived in system", role: "Project Manager", done: false },
  ]},
];

function ProjectDetail() {
  const { project: loaderProject } = Route.useLoaderData();
  const { projects: liveProjects, updateProject } = useProjects();
  const { calendars } = useCalendars();
  const projectCalendar = calendars.find((c) => c.id === (liveProjects.find((p) => p.id === loaderProject.id)?.calendarId ?? loaderProject.calendarId));
  const { addNotification } = useNotifications();
  const { addRfp } = useRfps();
  const { addResourceRequest, resourceRequests } = useResourceRequests();
  const project = liveProjects.find((p) => p.id === loaderProject.id) ?? loaderProject;
  const [reportOpen, setReportOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState([
    { n: project.pm, r: "PM", a: 80, p: "Apr–Sep", s: "green" as Rag },
    { n: "Mei Chen", r: "Security Lead", a: 40, p: "May–Aug", s: "green" as Rag },
    { n: "Priya Iyer", r: "Tech Lead", a: 100, p: "Jun–Sep", s: "amber" as Rag },
    { n: "Diego Ortiz", r: "BI Engineer", a: 30, p: "Jul–Aug", s: "blue" as Rag },
  ]);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [reqResourceOpen, setReqResourceOpen] = useState(false);
  const [ctxDialog, setCtxDialog] = useState<
    | { mode: "subtask"; parent: string }
    | { mode: "edit"; name: string }
    | null
  >(null);
  const [projectBaseline, setProjectBaseline] = useState<{
    version: number;
    createdAt: string;
    isLocked: boolean;
    snapshot: Milestone[];
  } | null>(null);

  // Initialize with sample baseline versions for demo
  const initializeBaselineVersions = (): Array<{
    version: number;
    createdAt: string;
    snapshot: Milestone[];
  }> => {
    const sampleVersions = [
      { version: 1, createdAt: "2025-04-15", daysShift: 0 },
      { version: 2, createdAt: "2025-05-01", daysShift: 16 },
      { version: 3, createdAt: "2025-05-20", daysShift: 35 },
      { version: 4, createdAt: "2025-06-10", daysShift: 56 },
    ];

    // Will be populated after milestones are initialized
    return [];
  };

  const [projectBaselineVersions, setProjectBaselineVersions] = useState<Array<{
    version: number;
    createdAt: string;
    snapshot: Milestone[];
  }>>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([
    // ── Phase 1: Discovery — completed, all green, all assigned ──────────────
    { name: "Discovery & Requirements", kind: "Task", startDate: "2025-04-15", endDate: "2025-05-16", owner: "Sara Al-Rashid", rag: "amber", dep: "—", roles: [{ role: "Business Analyst", skill: "Senior", fte: 1 }], payment: { kind: "Package Cost", packageId: "PKG-DSC", amount: "$80K" }, progress: 20, parent: "Discovery Sign-off", weightScore: 8 },
    { name: "Stakeholder workshops", kind: "Task", startDate: "2025-04-15", endDate: "2025-04-25", owner: "Sara Al-Rashid", rag: "amber", dep: "—", roles: [{ role: "Business Analyst", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 40, parent: "Discovery & Requirements", assignee: "Sara Al-Rashid", weightScore: 5 },
    { name: "Requirements doc", kind: "Task", startDate: "2025-04-28", endDate: "2025-05-12", owner: "Sara Al-Rashid", rag: "amber", dep: "Stakeholder workshops", roles: [{ role: "Business Analyst", skill: "Mid", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Discovery & Requirements", assignee: "John Smith", weightScore: 5 },
    { name: "Discovery Sign-off", kind: "Milestone", startDate: "2025-05-16", endDate: "2025-05-16", owner: "Sara Al-Rashid", rag: "amber", dep: "Discovery & Requirements", roles: [], payment: { kind: "Client Revenue", amount: "$120K" }, progress: 20, assignee: "Sara Al-Rashid", milestoneType: "finish", requiresApproval: true, approvers: [{ id: "u-sara", name: "Sara Al-Rashid", role: "Director", department: "Engineering" }, { id: "u-john", name: "John Smith", role: "Project Manager", department: "IT" }] },

    // ── Phase 2: Design — at risk (amber), mixed assignee states ────────────
    { name: "Solution Design", kind: "Task", startDate: "2025-05-19", endDate: "2025-06-27", owner: "Mei Chen", rag: "amber", dep: "Discovery Sign-off", roles: [{ role: "Solution Architect", skill: "Senior", fte: 1 }], payment: { kind: "Package Cost", packageId: "PKG-DSN", amount: "$150K" }, progress: 70, parent: "Design Approved", weightScore: 8 },
    { name: "Architecture blueprint", kind: "Task", startDate: "2025-05-19", endDate: "2025-06-06", owner: "Mei Chen", rag: "green", dep: "Discovery Sign-off", roles: [{ role: "Solution Architect", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 100, parent: "Solution Design", assignee: "Mei Chen", weightScore: 4 },
    { name: "UX wireframes", kind: "Task", startDate: "2025-05-26", endDate: "2025-06-20", owner: "Mei Chen", rag: "amber", dep: "Architecture blueprint", roles: [{ role: "UX Designer", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 60, parent: "Solution Design", assignee: "Waiting", weightScore: 4 },
    { name: "Security review", kind: "Task", startDate: "2025-06-09", endDate: "2025-06-27", owner: "Mei Chen", rag: "amber", dep: "Architecture blueprint", roles: [{ role: "Security Lead", skill: "Senior", fte: 0.5 }], payment: { kind: "None", amount: "" }, progress: 30, parent: "Solution Design", weightScore: 2 },
    { name: "Design Approved", kind: "Milestone", startDate: "2025-06-27", endDate: "2025-06-27", owner: "Mei Chen", rag: "amber", dep: "Solution Design", roles: [], payment: { kind: "Client Revenue", amount: "$180K" }, progress: 0, assignee: "Mei Chen", milestoneType: "finish" },

    // ── Phase 3: Build — in progress (blue), assignees fulfilled ────────────
    { name: "Build & Integration", kind: "Task", startDate: "2025-06-30", endDate: "2025-08-22", owner: "Priya Iyer", rag: "blue", dep: "Design Approved", roles: [{ role: "Integration Dev", skill: "Mid", fte: 2 }, { role: "Backend Dev", skill: "Senior", fte: 1 }], payment: { kind: "Package Cost", packageId: "PKG-BLD", amount: "$320K" }, progress: 45, parent: "Build Complete", weightScore: 10 },
    { name: "Backend API", kind: "Task", startDate: "2025-06-30", endDate: "2025-07-25", owner: "Diego Ortiz", rag: "blue", dep: "Design Approved", roles: [{ role: "Backend Dev", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 65, parent: "Build & Integration", assignee: "Diego Ortiz", weightScore: 4 },
    { name: "Frontend UI", kind: "Task", startDate: "2025-07-07", endDate: "2025-08-08", owner: "Priya Iyer", rag: "blue", dep: "Backend API", roles: [{ role: "Frontend Dev", skill: "Mid", fte: 2 }], payment: { kind: "None", amount: "" }, progress: 40, parent: "Build & Integration", assignee: "Priya Iyer", weightScore: 3 },
    { name: "Data migration scripts", kind: "Task", startDate: "2025-07-14", endDate: "2025-08-15", owner: "Diego Ortiz", rag: "amber", dep: "Backend API", roles: [{ role: "Data Engineer", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 25, parent: "Build & Integration", assignee: "Waiting", weightScore: 2 },
    { name: "Third-party integrations", kind: "Task", startDate: "2025-07-21", endDate: "2025-08-22", owner: "Priya Iyer", rag: "grey", dep: "Frontend UI", roles: [{ role: "Integration Dev", skill: "Mid", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Build & Integration", weightScore: 1 },
    { name: "Build Complete", kind: "Milestone", startDate: "2025-08-22", endDate: "2025-08-22", owner: "Priya Iyer", rag: "blue", dep: "Build & Integration", roles: [], payment: { kind: "Client Revenue", amount: "$250K" }, progress: 0, assignee: "Priya Iyer", milestoneType: "finish" },

    // ── Phase 4: Testing — blocked (red), waiting/unrequested mix ───────────
    { name: "Testing & QA", kind: "Task", startDate: "2025-08-25", endDate: "2025-09-19", owner: "Priya Iyer", rag: "red", dep: "Build Complete", roles: [{ role: "QA Engineer", skill: "Senior", fte: 2 }], payment: { kind: "Package Cost", packageId: "PKG-QA", amount: "$95K" }, progress: 10, parent: "UAT Sign-off", weightScore: 8 },
    { name: "SIT execution", kind: "Task", startDate: "2025-08-25", endDate: "2025-09-05", owner: "Priya Iyer", rag: "red", dep: "Build Complete", roles: [{ role: "QA Engineer", skill: "Senior", fte: 2 }], payment: { kind: "None", amount: "" }, progress: 15, parent: "Testing & QA", assignee: "Waiting", weightScore: 4 },
    { name: "UAT execution", kind: "Task", startDate: "2025-09-08", endDate: "2025-09-19", owner: project.pm, rag: "red", dep: "SIT execution", roles: [{ role: "QA Lead", skill: "Lead", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Testing & QA", weightScore: 4 },
    { name: "Performance & load test", kind: "Task", startDate: "2025-09-01", endDate: "2025-09-12", owner: "Mei Chen", rag: "amber", dep: "Build Complete", roles: [{ role: "Performance Engineer", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 5, parent: "Testing & QA", assignee: "Waiting", weightScore: 2 },
    { name: "UAT Sign-off", kind: "Milestone", startDate: "2025-09-19", endDate: "2025-09-19", owner: project.pm, rag: "red", dep: "Testing & QA", roles: [], payment: { kind: "Client Revenue", amount: "$200K" }, progress: 0, milestoneType: "finish" },

    // ── Phase 5: Deploy — not started (grey), no skill requests yet ─────────
    { name: "Deployment & Hypercare", kind: "Task", startDate: "2025-09-22", endDate: "2025-10-17", owner: project.pm, rag: "grey", dep: "UAT Sign-off", roles: [{ role: "DevOps Engineer", skill: "Senior", fte: 1 }], payment: { kind: "Package Cost", packageId: "PKG-DPL", amount: "$60K" }, progress: 0, parent: "Go-Live", weightScore: 10 },
    { name: "Production cutover", kind: "Task", startDate: "2025-09-22", endDate: "2025-09-26", owner: project.pm, rag: "grey", dep: "UAT Sign-off", roles: [{ role: "DevOps Engineer", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Deployment & Hypercare", weightScore: 5 },
    { name: "Hypercare support", kind: "Task", startDate: "2025-09-29", endDate: "2025-10-17", owner: project.pm, rag: "grey", dep: "Production cutover", roles: [{ role: "Support Lead", skill: "Mid", fte: 2 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Deployment & Hypercare", weightScore: 3 },
    { name: "Knowledge transfer", kind: "Task", startDate: "2025-10-06", endDate: "2025-10-17", owner: project.pm, rag: "grey", dep: "Production cutover", roles: [{ role: "Trainer", skill: "Mid", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Deployment & Hypercare", weightScore: 2 },
    { name: "Go-Live", kind: "Milestone", startDate: project.endDate, endDate: project.endDate, owner: project.pm, rag: "blue", dep: "Deployment & Hypercare", roles: [], payment: { kind: "Client Revenue", amount: "$500K" }, progress: 0, milestoneType: "finish" },
  ]);
  const [reports, setReports] = useState<StatusReport[]>(() => [
    { week: 18, by: project.pm, when: "3 days ago", rag: project.rag, text: "Integration layer testing delayed by 1 week. Fallback plan in review with IT Director. No impact on go-live yet." },
    { week: 17, by: project.pm, when: "10 days ago", rag: "amber", text: "Vendor SOW reviewed. Two open RAID items remain; mitigations scheduled this sprint." },
    { week: 16, by: project.pm, when: "17 days ago", rag: "green", text: "Discovery completed and signed off. Build phase 1 kicked off on plan." },
  ]);
  const [planningProgressOpen, setPlanningProgressOpen] = useState(false);
  const [progressInitial, setProgressInitial] = useState<string | undefined>(undefined);
  const [progressScope, setProgressScope] = useState<string | undefined>(undefined);
  const [stageGateOpen, setStageGateOpen] = useState(false);
  const [dependencyOpen, setDependencyOpen] = useState(false);
  const [selectedItemForDep, setSelectedItemForDep] = useState<string | undefined>(undefined);
  const [gateData, setGateData] = useState<GateStage[]>(INITIAL_GATE_DATA);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [crDialogOpen, setCrDialogOpen] = useState(false);
  const [crApprovalDialogOpen, setCrApprovalDialogOpen] = useState(false);
  const [selectedCrForApproval, setSelectedCrForApproval] = useState<string | undefined>(undefined);
  const [selectedBaselineVersion, setSelectedBaselineVersion] = useState<string>("latest");
  const [planEditMode, setPlanEditMode] = useState<"view" | "editing" | "pending">("view");
  const isViewingCurrent = selectedBaselineVersion === "latest";
  const isEditingAllowed = isViewingCurrent && planEditMode === "editing";
  const [cancelEditDialogOpen, setCancelEditDialogOpen] = useState(false);
  const [editBaselineSnapshot, setEditBaselineSnapshot] = useState<Milestone[] | null>(null);
  const [compareVersionOpen, setCompareVersionOpen] = useState(false);

  // Demo version authors (in a real app, comes from CR history)
  const versionAuthors: Record<number, string> = {
    1: "Sara Al-Rashid",
    2: "Mei Chen",
    3: "Sara Al-Rashid",
    4: "John Smith",
  };

  const planChangeCount = useMemo(() => {
    if (!editBaselineSnapshot) return 0;
    const baseByName = new Map(editBaselineSnapshot.map((m) => [m.name, m]));
    const curByName = new Map(milestones.map((m) => [m.name, m]));
    const fields: Array<keyof Milestone> = [
      "name", "kind", "startDate", "endDate", "owner", "assignee", "dep",
      "rag", "milestoneType", "lagDays", "durationValue", "durationUnit",
      "isParallel", "weightScore", "parent", "requiresApproval",
      "roles", "approvers", "payment",
    ];
    let count = 0;
    for (const cur of milestones) {
      const base = baseByName.get(cur.name);
      if (!base) { count++; continue; }
      for (const f of fields) {
        const a = (base as any)[f];
        const b = (cur as any)[f];
        if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) count++;
      }
    }
    for (const b of editBaselineSnapshot) if (!curByName.has(b.name)) count++;
    return count;
  }, [editBaselineSnapshot, milestones]);

  const hasPlanChanges = useMemo(() => {
    if (!editBaselineSnapshot) return false;
    const baseByName = new Map(editBaselineSnapshot.map((m) => [m.name, m]));
    const curByName = new Map(milestones.map((m) => [m.name, m]));
    const fields: Array<keyof Milestone> = [
      "name", "kind", "startDate", "endDate", "owner", "assignee", "dep",
      "rag", "milestoneType", "lagDays", "durationValue", "durationUnit",
      "isParallel", "weightScore", "parent", "requiresApproval",
      "roles", "approvers", "payment",
    ];
    for (const cur of milestones) {
      const base = baseByName.get(cur.name);
      if (!base) return true;
      for (const f of fields) {
        const a = (base as any)[f];
        const b = (cur as any)[f];
        if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) return true;
      }
    }
    for (const b of editBaselineSnapshot) if (!curByName.has(b.name)) return true;
    return false;
  }, [editBaselineSnapshot, milestones]);

  function enterEditMode() {
    setEditBaselineSnapshot(milestones.map((m) => ({ ...m })));
    setPlanEditMode("editing");
  }

  function requestExitEditMode() {
    if (hasPlanChanges) {
      setCancelEditDialogOpen(true);
    } else {
      setEditBaselineSnapshot(null);
      setPlanEditMode("view");
    }
  }

  function discardAndExit() {
    if (editBaselineSnapshot) {
      setMilestones(editBaselineSnapshot.map((m) => ({ ...m })));
    }
    setEditBaselineSnapshot(null);
    setCancelEditDialogOpen(false);
    setPlanEditMode("view");
  }

  // Keyboard shortcuts for Change Plan mode (E / Esc / Cmd+S)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (!isViewingCurrent) return;
      // Cmd/Ctrl + S — submit change request
      if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S")) {
        if (planEditMode === "editing" && hasPlanChanges) {
          e.preventDefault();
          setCrDialogOpen(true);
        }
        return;
      }
      // Esc — cancel edit
      if (e.key === "Escape" && planEditMode === "editing") {
        e.preventDefault();
        requestExitEditMode();
        return;
      }
      // E — enter change plan mode
      if ((e.key === "e" || e.key === "E") && planEditMode === "view") {
        e.preventDefault();
        enterEditMode();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planEditMode, isViewingCurrent, hasPlanChanges]);

  // Initialize sample baseline versions on component mount
  useEffect(() => {
    if (projectBaselineVersions.length === 0 && milestones.length > 0) {
      const versions = [
        {
          version: 1,
          createdAt: "2025-04-15",
          snapshot: milestones.map((m) => ({
            ...m,
            progress: m.kind === "Milestone" ? 0 : m.name.includes("Discovery") ? 100 : 0,
          })),
        },
        {
          version: 2,
          createdAt: "2025-05-01",
          snapshot: milestones.map((m) => ({
            ...m,
            progress:
              m.kind === "Milestone" ? 0 :
              m.name.includes("Discovery") ? 100 :
              m.name.includes("Design") ? 50 : 0,
          })),
        },
        {
          version: 3,
          createdAt: "2025-05-20",
          snapshot: milestones.map((m) => ({
            ...m,
            progress:
              m.kind === "Milestone" ? 0 :
              m.name.includes("Discovery") ? 100 :
              m.name.includes("Design") ? 100 :
              m.name.includes("Build") ? 30 : 0,
          })),
        },
        {
          version: 4,
          createdAt: "2025-06-10",
          snapshot: milestones.map((m) => ({
            ...m,
            progress:
              m.kind === "Milestone" ? 0 :
              m.name.includes("Discovery") ? 100 :
              m.name.includes("Design") ? 100 :
              m.name.includes("Build") ? 60 :
              m.name.includes("Testing") ? 10 : 0,
          })),
        },
      ];
      setProjectBaselineVersions(versions);
      setProjectBaseline({
        version: 4,
        createdAt: "2025-06-10",
        isLocked: true,
        snapshot: versions[3].snapshot,
      });
    }
  }, [milestones]);

  const currentStage = PLANNING_STAGES.find((s) => s.state === "active") ?? PLANNING_STAGES[0];
  const planningDone = PLANNING_CHECKLIST.filter((c) => c.done).length;
  return (
    <div>
      <div className="mb-4">
        <Link to="/portfolio" className="inline-flex items-center text-xs text-muted-foreground hover:text-accent">
          <ChevronLeft className="mr-1 h-3 w-3" />Back to Portfolio
        </Link>
      </div>
      <PageHeader
        title={project.name}
        subtitle={`${project.businessLine} · ${project.department} · PM ${project.pm} · Client ${project.client}${projectCalendar ? ` · 📅 ${projectCalendar.name}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <RagBadge rag={project.rag} />
            <Badge variant="outline" className="border-border bg-secondary/40">{project.stage}</Badge>
            <Button variant="outline" size="sm" onClick={() => window.print()}>Export</Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setReportOpen(true)}>Submit status</Button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-6">
        {(() => {
          const derived = computeDerivedSchedule(milestones, resourceRequests);
          const leaves = derived.filter((m) => m.kind === "Task" && !derived.some((c) => c.parent === m.name));
          let totalW = 0, weightedActual = 0, weightedPlanned = 0;
          for (const t of leaves) {
            const w = Math.max(0, t.weightScore ?? 1);
            totalW += w;
            weightedActual += w * (t.progress ?? 0);
            weightedPlanned += w * computePlannedProgress(t.startDate, t.endDate);
          }
          const actualPct = totalW ? Math.round(weightedActual / totalW) : 0;
          const plannedPct = totalW ? Math.round(weightedPlanned / totalW) : 0;
          return (
            <button
              type="button"
              onClick={() => setPlanningProgressOpen(true)}
              className="glass-card group relative p-3 text-left transition-colors hover:border-accent/40"
            >
              <ArrowUpRight className="pointer-events-none absolute top-2 right-2 h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-hover:text-accent" />
              <div className="label-eyebrow">Progress</div>
              <div className="mt-1 text-lg font-medium num-mono text-foreground">{actualPct}%</div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>Planned <span className="num-mono text-foreground/80">{plannedPct}%</span></span>
                <span className={actualPct >= plannedPct ? "text-rag-green" : "text-rag-amber"}>
                  {actualPct >= plannedPct ? "On / ahead" : `${plannedPct - actualPct}% behind`}
                </span>
              </div>
            </button>
          );
        })()}
        <button
          type="button"
          onClick={() => setStageGateOpen(true)}
          className="glass-card group relative p-3 text-left transition-colors hover:border-accent/40"
        >
          <ArrowUpRight className="pointer-events-none absolute top-2 right-2 h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-hover:text-accent" />
          <div className="label-eyebrow">Stage Gate</div>
          <div className="mt-1 text-lg font-medium text-foreground">{currentStage.name}</div>
          <div className="mt-1 flex items-center gap-1">
            {PLANNING_STAGES.map((s) => (
              <span
                key={s.n}
                className={`h-1.5 flex-1 rounded-full ${
                  s.state === "done" ? "bg-accent" : s.state === "active" ? "bg-accent/60" : "bg-secondary/60"
                }`}
              />
            ))}
          </div>
        </button>
        {[
          { l: "Budget", v: `$${project.budgetUsed.toFixed(2)}M / $${project.budgetTotal.toFixed(1)}M` },
          { l: "Variance", v: "+4%", c: "text-rag-amber" },
          { l: "End date", v: project.endDate },
          { l: "Open Risks", v: project.risks + project.issues, c: "text-rag-red" },
        ].map((k) => (
          <div key={k.l} className="glass-card p-3">
            <div className="label-eyebrow">{k.l}</div>
            <div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="Overview">
        <TabsList className="overflow-x-auto whitespace-nowrap">
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t} className="text-xs">{t}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="Overview" className="mt-5">
          <OverviewTab project={project} />
        </TabsContent>

        <TabsContent value="Project Charter" className="mt-5">
          <CharterTab project={project} />
        </TabsContent>


        <TabsContent value="Project Schedule" className="mt-5">
          {planEditMode === "editing" && isViewingCurrent && (
            <div className="mb-3 flex items-start gap-3 rounded-lg border border-rag-amber/40 bg-rag-amber/10 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rag-amber" />
              <div className="flex-1 text-xs">
                <div className="font-medium text-rag-amber">You're editing the plan</div>
                <div className="mt-0.5 text-muted-foreground">
                  Locked fields are now editable. Changes will be reviewed as a Change Request.
                  <span className="ml-2 opacity-70">Shortcuts: Esc = cancel · ⌘/Ctrl+S = submit</span>
                </div>
              </div>
              {planChangeCount > 0 && (
                <Badge variant="outline" className="border-rag-amber/40 bg-rag-amber/10 text-rag-amber">
                  {planChangeCount} change{planChangeCount === 1 ? "" : "s"} pending
                </Badge>
              )}
            </div>
          )}
          {planEditMode === "view" && isViewingCurrent && (
            <div className="mb-2 text-[11px] text-muted-foreground/70">
              📖 Baseline locked — press <kbd className="rounded border border-border bg-secondary/40 px-1">E</kbd> or click Change Plan to edit
            </div>
          )}
          <ProjectSchedule
            headerSlot={
              <div className="flex items-center gap-2">
                <Select value={selectedBaselineVersion} onValueChange={(v) => {
                  setSelectedBaselineVersion(v);
                  setPlanEditMode("view");
                  setEditBaselineSnapshot(null);
                }}>
                  <SelectTrigger className="h-8 w-64 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">
                      <div className="flex flex-col leading-tight">
                        <span>Current Version (v{projectBaselineVersions.length}) ⭐</span>
                        <span className="text-[10px] text-muted-foreground">
                          {projectBaselineVersions[projectBaselineVersions.length - 1]?.createdAt}
                          {" · by "}
                          {versionAuthors[projectBaselineVersions.length] ?? "—"}
                        </span>
                      </div>
                    </SelectItem>
                    {projectBaselineVersions.slice(0, -1).map((v) => (
                      <SelectItem key={v.version} value={`v${v.version}`}>
                        <div className="flex flex-col leading-tight">
                          <span>v{v.version}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {v.createdAt} · by {versionAuthors[v.version] ?? "—"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isViewingCurrent && planEditMode === "view" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={enterEditMode}
                    className="h-8 text-xs"
                  >
                    ✎ Change Plan
                  </Button>
                )}
                {isViewingCurrent && planEditMode === "editing" && (
                  <>
                    {planChangeCount > 0 && (
                      <Badge variant="outline" className="border-rag-amber/40 bg-rag-amber/10 text-rag-amber text-[10px]">
                        {planChangeCount} pending
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCrDialogOpen(true)}
                      className="h-8 text-xs"
                      disabled={planChangeCount === 0}
                    >
                      Send Change Request
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={requestExitEditMode}
                      className="h-8 text-xs text-muted-foreground"
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {isViewingCurrent && planEditMode === "pending" && (
                  <Badge className="border-rag-blue/40 bg-rag-blue/10 text-rag-blue text-xs">⏳ Waiting For Approval</Badge>
                )}
                {!isViewingCurrent && (
                  <>
                    <Badge variant="outline" className="text-xs text-muted-foreground">📖 View Only</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCompareVersionOpen(true)}
                      className="h-8 text-xs"
                    >
                      Compare with Current
                    </Button>
                  </>
                )}
              </div>
            }
            items={useMemo(() => {
              if (!isViewingCurrent) {
                const vNum = parseInt(selectedBaselineVersion.slice(1));
                const v = projectBaselineVersions.find((x) => x.version === vNum);
                if (v) return computeDerivedSchedule(v.snapshot as Milestone[], resourceRequests);
              }
              return computeDerivedSchedule(milestones, resourceRequests);
            }, [milestones, resourceRequests, isViewingCurrent, selectedBaselineVersion, projectBaselineVersions])}
            resourceList={resourcePool}
            restricted={!isEditingAllowed}
            onProgressClick={(name, kind) => {
              const derived = computeDerivedSchedule(milestones, resourceRequests);
              const hasChildren = derived.some((d) => d.parent === name);
              if (kind === "Milestone" || (kind === "Task" && hasChildren)) {
                setProgressScope(name);
                setProgressInitial(undefined);
              } else {
                setProgressScope(undefined);
                setProgressInitial(name);
              }
              setPlanningProgressOpen(true);
            }}
            onItemPatch={(name, patch) => {
              // Only Progress Update and Assignee changes/swaps are allowed
              // without opening the Change Plan flow. Everything else needs approval.
              const keys = Object.keys(patch);
              const isAssigneeOnly = keys.length > 0 && keys.every((k) => k === "assignee");
              const isProgressOnly = keys.length > 0 && keys.every((k) => k === "progress" || k === "approvalStatus");
              if (!isEditingAllowed && !isAssigneeOnly && !isProgressOnly) {
                toast.error("Locked — click 'Change Plan' to edit");
                return;
              }
              setMilestones((prev) => prev.map((m) => (m.name === name ? { ...m, ...patch } as Milestone : m)));
            }}
            onRequestSkill={(name, role) => {
              if (!isEditingAllowed) {
                toast.error("📖 View Only — Click 'Change Plan' to edit");
                return;
              }
              const id = addResourceRequest({
                project: project.name,
                role: role.role,
                skill: role.skill,
                fte: role.fte,
                from: new Date().toISOString().slice(0, 7),
                until: new Date().toISOString().slice(0, 7),
                priority: "Medium",
                submittedBy: project.pm,
                notes: `Requested from schedule task "${name}"`,
              });
              setMilestones((prev) =>
                prev.map((m) =>
                  m.name === name
                    ? { ...m, resourceRequestIds: [...(m.resourceRequestIds ?? []), id], assignee: "Waiting" }
                    : m,
                ),
              );
              toast.success("Skill request sent to Resources");
            }}
            onDependencyClick={(name) => {
              setSelectedItemForDep(name);
              setDependencyOpen(true);
            }}
            AddItemSlot={
              <AddMilestoneDialog
                defaultOwner={project.pm}
                packages={SEED_PACKAGES}
                items={milestones}
                projectName={project.name}
                addResourceRequest={addResourceRequest}
                onAdd={(newItems) => setMilestones((prev) => [...prev, ...newItems])}
                onUpdateExisting={(name, patch) =>
                  setMilestones((prev) => prev.map((m) => (m.name === name ? { ...m, ...patch } : m)))
                }
              />
            }
            onImport={(imported, mode) => {
              const asMilestones = imported.map((it) => ({ ...it }) as Milestone);
              setMilestones((prev) => (mode === "replace" ? asMilestones : [...prev, ...asMilestones]));
            }}
            onAddSubtask={(parentName) => {
              if (!isEditingAllowed) {
                toast.error("📖 View Only — Click 'Change Plan' to edit");
                return;
              }
              setCtxDialog({ mode: "subtask", parent: parentName });
            }}
            onEditItem={(name) => {
              if (!isEditingAllowed) {
                toast.error("📖 View Only — Click 'Change Plan' to edit");
                return;
              }
              setCtxDialog({ mode: "edit", name });
            }}
            onDeleteItem={(name) => {
              if (!isEditingAllowed) {
                toast.error("📖 View Only — Click 'Change Plan' to edit");
                return;
              }
              setMilestones((prev) => {
                // cascade-delete: remove the item and any descendant whose parent chain leads to it
                const toRemove = new Set<string>([name]);
                let changed = true;
                while (changed) {
                  changed = false;
                  for (const it of prev) {
                    if (it.parent && toRemove.has(it.parent) && !toRemove.has(it.name)) {
                      toRemove.add(it.name);
                      changed = true;
                    }
                  }
                }
                return prev.filter((m) => !toRemove.has(m.name));
              });
            }}
          />

          {/* Controlled dialog for right-click "Add subtask" / "Edit" */}
          <AddMilestoneDialog
            defaultOwner={project.pm}
            packages={SEED_PACKAGES}
            items={milestones}
            projectName={project.name}
            addResourceRequest={addResourceRequest}
            onAdd={(newItems) => setMilestones((prev) => [...prev, ...newItems])}
            onUpdateExisting={(name, patch) =>
              setMilestones((prev) => prev.map((m) => (m.name === name ? { ...m, ...patch } : m)))
            }
            hideTrigger
            open={ctxDialog !== null}
            onOpenChange={(o) => { if (!o) setCtxDialog(null); }}
            initialParent={ctxDialog?.mode === "subtask" ? ctxDialog.parent : undefined}
            initialKind={ctxDialog?.mode === "subtask" ? "Task" : undefined}
            editingItem={ctxDialog?.mode === "edit" ? (milestones.find((m) => m.name === ctxDialog.name) ?? null) : null}
          />

          {/* Change Requests Section */}
          <div className="mt-8 space-y-4 border-t border-border pt-6">
            <div className="label-eyebrow">{changeRequests.length} Change Requests</div>
            {changeRequests.length === 0 ? (
              <div className="glass-card p-6 text-center text-sm text-muted-foreground">
                No change requests yet. Create a baseline to enable change request workflow.
              </div>
            ) : (
              <div className="space-y-2">
                {changeRequests.map((cr) => (
                  <div key={cr.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{cr.id} · {cr.summary}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Submitted by {cr.submittedBy} · {cr.createdAt}
                      </div>
                      {cr.changes && cr.changes.length > 0 && (
                        <div className="mt-2 text-xs">
                          <div className="text-muted-foreground">Changes:</div>
                          {cr.changes.map((c, i) => (
                            <div key={i} className="ml-2 text-muted-foreground">
                              • {c.field}: {c.oldValue} → {c.newValue}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <Badge variant="outline" className={
                        cr.status === "pending" ? "border-rag-amber/40 bg-rag-amber/10 text-rag-amber" :
                        cr.status === "approved" ? "border-rag-green/40 bg-rag-green/10 text-rag-green" :
                        cr.status === "rejected" ? "border-rag-red/40 bg-rag-red/10 text-rag-red" :
                        "border-border bg-secondary text-muted-foreground"
                      }>{cr.status}</Badge>
                      {cr.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-accent text-accent hover:bg-accent-dim"
                          onClick={() => { setSelectedCrForApproval(cr.id); setCrApprovalDialogOpen(true); }}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CR Dialog */}
          <ChangeRequestDialog
            open={crDialogOpen}
            onOpenChange={setCrDialogOpen}
            baselineSnapshot={projectBaselineVersions[projectBaselineVersions.length - 1]?.snapshot as Milestone[] | undefined}
            currentMilestones={milestones}
            baselineVersion={projectBaselineVersions.length}
            onSubmit={(cr) => {
              setChangeRequests((prev) => [...prev, cr]);
              setCrDialogOpen(false);
              setPlanEditMode("pending");
              setEditBaselineSnapshot(null);
              toast.success(`Change Request ${cr.id} submitted for approval`);
            }}
          />

          {/* Compare versions Dialog */}
          <VersionCompareDialog
            open={compareVersionOpen}
            onOpenChange={setCompareVersionOpen}
            fromLabel={`v${parseInt(selectedBaselineVersion.replace(/^v/, "")) || projectBaselineVersions.length}`}
            toLabel={`Current (v${projectBaselineVersions.length})`}
            fromSnapshot={
              (projectBaselineVersions.find((v) => `v${v.version}` === selectedBaselineVersion)?.snapshot as Milestone[] | undefined) ??
              (projectBaselineVersions[projectBaselineVersions.length - 1]?.snapshot as Milestone[] | undefined)
            }
            toSnapshot={milestones}
          />

          {/* Cancel Edit Confirmation */}
          <AlertDialog open={cancelEditDialogOpen} onOpenChange={setCancelEditDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  You'll lose {planChangeCount} unsaved change{planChangeCount === 1 ? "" : "s"} to the schedule. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel autoFocus>Keep Editing</AlertDialogCancel>
                <AlertDialogAction
                  onClick={discardAndExit}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Discard Changes
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* CR Approval Dialog */}
          <ChangeRequestApprovalDialog
            open={crApprovalDialogOpen}
            onOpenChange={setCrApprovalDialogOpen}
            changeRequest={changeRequests.find((cr) => cr.id === selectedCrForApproval)}
            onApprove={(reason) => {
              setChangeRequests((prev) =>
                prev.map((cr) =>
                  cr.id === selectedCrForApproval
                    ? { ...cr, status: "approved" as const, approvedAt: new Date().toISOString().split('T')[0], approvedBy: "Current User", approvalReason: reason }
                    : cr
                )
              );
              setPlanEditMode("view");
              setCrApprovalDialogOpen(false);
              toast.success("✅ Change Request approved! Back to Change Plan mode");
            }}
            onReject={(reason) => {
              setChangeRequests((prev) =>
                prev.map((cr) =>
                  cr.id === selectedCrForApproval
                    ? { ...cr, status: "rejected" as const, rejectedAt: new Date().toISOString().split('T')[0], rejectionReason: reason }
                    : cr
                )
              );
              setCrApprovalDialogOpen(false);
              toast.error("Change Request rejected");
            }}
          />

        </TabsContent>


        <TabsContent value="Team & Allocation" className="mt-5">
          <Tabs defaultValue="team-members">
            <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
              {[
                { v: "manpower-plan", l: "Manpower Planning" },
                { v: "team-members", l: "Team Members" },
                { v: "alloc-overview", l: "Allocation Overview" },
              ].map((t) => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className="text-xs"
                >
                  {t.l}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="manpower-plan" className="mt-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                {[
                  { l: "Roles requested", v: "5" },
                  { l: "Confirmed", v: "4", c: "text-rag-green" },
                  { l: "Pending", v: "1", c: "text-rag-amber" },
                  { l: "Total FTE", v: "5.5" },
                ].map((k) => (
                  <div key={k.l} className="glass-card p-4">
                    <div className="label-eyebrow">{k.l}</div>
                    <div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
                  </div>
                ))}
              </div>
              <div className="">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-transparent border-0">
                      <TableHead>Role</TableHead><TableHead>FTE</TableHead><TableHead>Skill level</TableHead>
                      <TableHead>Period</TableHead><TableHead>Sourcing</TableHead><TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { r: "Solution Architect", f: 1.0, sk: "Senior", p: "Jun–Sep", src: "Internal", s: "green", sl: "Confirmed" },
                      { r: "QA Engineer",        f: 2.0, sk: "Mid",    p: "Jul–Sep", src: "Internal",  s: "green", sl: "Confirmed" },
                      { r: "Integration Dev",    f: 1.5, sk: "Mid",    p: "Jun–Aug", src: "Internal",  s: "green", sl: "Confirmed" },
                      { r: "Security Reviewer",  f: 0.5, sk: "Senior", p: "Aug",     src: "Subcontract", s: "green", sl: "Confirmed" },
                      { r: "Change Manager",     f: 0.5, sk: "Mid",    p: "Sep",     src: "Internal",  s: "amber", sl: "Pending" },
                    ].map((m) => (
                      <TableRow key={m.r} className="bg-[#1D1D23] hover:bg-[#252530] border-0">
                        <TableCell className="font-medium text-foreground">{m.r}</TableCell>
                        <TableCell className="num-mono">{m.f}</TableCell>
                        <TableCell>{m.sk}</TableCell>
                        <TableCell>{m.p}</TableCell>
                        <TableCell className="text-muted-foreground">{m.src}</TableCell>
                        <TableCell><RagBadge rag={m.s as any} label={m.sl} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="team-members" className="mt-4 space-y-3">
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" className="gap-1 text-xs border-accent/40 text-accent hover:bg-accent-dim"
                  onClick={() => setReqResourceOpen(true)}>
                  <UserPlus className="h-3.5 w-3.5" />Request Resource
                </Button>
                <Button size="sm" className="gap-1 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => setAddMemberOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />Add Member
                </Button>
              </div>
              <div className="">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-transparent border-0">
                      <TableHead>Member</TableHead><TableHead>Role</TableHead>
                      <TableHead>Allocation %</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((m) => (
                      <TableRow key={m.n} className="bg-[#1D1D23] hover:bg-[#252530] border-0">
                        <TableCell className="font-medium">{m.n}</TableCell>
                        <TableCell>{m.r}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={m.a} className="h-1.5 w-32" />
                            <span className="num-mono text-xs">{m.a}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{m.p}</TableCell>
                        <TableCell><RagBadge rag={m.s} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Add Member dialog */}
              <AddTeamMemberDialog
                open={addMemberOpen}
                onOpenChange={setAddMemberOpen}
                onAdd={(m) => { setTeamMembers((prev) => [...prev, m]); toast.success(`${m.n} added to team`); }}
              />

              {/* Request Resource dialog */}
              <RequestResourceDialog
                open={reqResourceOpen}
                onOpenChange={setReqResourceOpen}
                project={project}
                onSubmit={(r) => { addResourceRequest(r); toast.success("Resource request submitted to Resources module"); }}
              />
            </TabsContent>

            <TabsContent value="alloc-overview" className="mt-4 glass-card p-5">
              <div className="label-eyebrow mb-4">Team capacity vs. allocation — this project</div>
              <div className="space-y-4">
                {[
                  { n: project.pm,   r: "PM",           alloc: 80,  cap: 100, over: false },
                  { n: "Mei Chen",   r: "Security Lead", alloc: 40,  cap: 100, over: false },
                  { n: "Priya Iyer", r: "Tech Lead",     alloc: 100, cap: 100, over: false },
                  { n: "Diego Ortiz",r: "BI Engineer",   alloc: 30,  cap: 100, over: false },
                ].map((m) => (
                  <div key={m.n}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{m.n}</span>
                      <span className="text-xs text-muted-foreground">{m.r}</span>
                      <span className={`num-mono text-xs ml-auto ${m.alloc >= 100 ? "text-rag-amber" : "text-foreground"}`}>{m.alloc}% allocated</span>
                    </div>
                    <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary/50">
                      <div
                        className={`h-full rounded-full transition-all ${m.alloc >= 100 ? "bg-rag-amber" : "bg-accent"}`}
                        style={{ width: `${Math.min(m.alloc, 100)}%` }}
                      />
                      {m.alloc > 100 && (
                        <div className="absolute right-0 top-0 h-full w-1 rounded-r-full bg-rag-red" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-accent" />Normal</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-rag-amber" />At capacity</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-rag-red" />Over-allocated</span>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="Financials" className="mt-5">
          <FinancialsTab project={project} />
        </TabsContent>

        <TabsContent value="Project Risks" className="mt-5">
          <RisksTab project={project} />
        </TabsContent>

        <TabsContent value="Status Reports" className="mt-5">
          <StatusReportsTab
            project={project}
            reports={reports}
            setReports={setReports}
            externalOpen={reportOpen}
            onExternalOpenChange={setReportOpen}
            onRagChange={(rag) => { updateProject(project.id, { rag }); addNotification({ tone: rag === "red" ? "red" : rag === "amber" ? "amber" : "green", title: `${project.name} status updated to ${rag === "red" ? "Off-Track" : rag === "amber" ? "At Risk" : "On Track"}`, time: "Just now" }); }}
          />
        </TabsContent>

        <TabsContent value="Procurement" className="mt-5">
          <ProcurementProjectTab projectName={project.name} addRfp={addRfp} />
        </TabsContent>

        <TabsContent value="Business Trips" className="mt-5">
          <BusinessTripsTab pm={project.pm} />
        </TabsContent>

        <TabsContent value="Stakeholders" className="mt-5">
          <StakeholdersTab />
        </TabsContent>

        <TabsContent value="Lessons Learned" className="mt-5">
          <LessonsTab project={project} />
        </TabsContent>
      </Tabs>

      <ProgressUpdateDialog
        open={planningProgressOpen}
        onOpenChange={(v) => { setPlanningProgressOpen(v); if (!v) { setProgressInitial(undefined); setProgressScope(undefined); } }}
        initialTaskName={progressInitial}
        scopeMilestone={progressScope}
        items={computeDerivedSchedule(milestones, resourceRequests)}
        projectBaseline={projectBaseline}
        setProjectBaseline={setProjectBaseline}
        projectBaselineVersions={projectBaselineVersions}
        setProjectBaselineVersions={setProjectBaselineVersions}
        milestones={milestones}
        resourceRequests={resourceRequests}
        setCrDialogOpen={setCrDialogOpen}
        onSetProgress={(name, progress) =>
          setMilestones((prev) => {
            let updated = prev.map((m) => (m.name === name ? { ...m, progress } : m));

            // Auto-rollup: recalculate parent progress from children
            const byName = new Map(updated.map((i) => [i.name, i]));
            const changed = new Set<string>([name]);
            let hasChanges = true;
            while (hasChanges) {
              hasChanges = false;
              for (const m of updated) {
                if (m.kind === "Milestone" && !changed.has(m.name)) {
                  const children = updated.filter((c) => c.parent === m.name && c.kind === "Task");
                  if (children.length > 0) {
                    let totalW = 0, wa = 0;
                    for (const c of children) {
                      const w = Math.max(0, c.weightScore ?? 1);
                      totalW += w;
                      wa += w * (c.progress ?? 0);
                    }
                    const newProgress = totalW ? Math.round(wa / totalW) : 0;
                    if (newProgress !== m.progress) {
                      updated = updated.map((x) => (x.name === m.name ? { ...x, progress: newProgress } : x));
                      changed.add(m.name);
                      hasChanges = true;
                    }
                  }
                }
              }
            }

            if (progress >= 100) return updated;
            // If reducing a task below 100%, revert any approved/pending ancestor milestone.
            const seen = new Set<string>();
            let cur = byName.get(name);
            const toReset: string[] = [];
            while (cur?.parent && !seen.has(cur.parent)) {
              const p = byName.get(cur.parent);
              if (!p) break;
              if (p.requiresApproval && (p.approvalStatus === "approved" || p.approvalStatus === "pending")) {
                toReset.push(p.name);
              }
              seen.add(cur.parent);
              cur = p;
            }
            if (!toReset.length) return updated;
            return updated.map((m) => (toReset.includes(m.name) ? { ...m, approvalStatus: undefined } : m));
          })
        }
        onRequestApproval={(name) =>
          setMilestones((prev) => prev.map((m) => (m.name === name ? { ...m, approvalStatus: "pending" } : m)))
        }
        onApprove={(name) =>
          setMilestones((prev) => prev.map((m) => (m.name === name ? { ...m, approvalStatus: "approved" } : m)))
        }
      />
      <StageGatesDialog open={stageGateOpen} onOpenChange={setStageGateOpen} gateData={gateData} setGateData={setGateData} />
      <DependencyDialog
        open={dependencyOpen}
        onOpenChange={setDependencyOpen}
        currentItem={selectedItemForDep ? milestones.find((m) => m.name === selectedItemForDep) : undefined}
        allItems={milestones}
        onSetDependencies={(name, dependencies) =>
          setMilestones((prev) => prev.map((m) => (m.name === name ? { ...m, dependencies } : m)))
        }
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div><div className="label-eyebrow">{label}</div><div className="text-foreground">{value}</div></div>;
}

// ── Project Charter tab ───────────────────────────────────────────────────────
function CharterTab({ project }: { project: typeof projects[number] }) {
  const [editMode, setEditMode] = useState(false);
  const [approved, setApproved] = useState(project.stage !== "Initiation");

  const [fields, setFields] = useState({
    objective:   `Deliver ${project.name} on time and within budget, achieving the agreed scope for ${project.client ?? project.department}.`,
    scope:       `In scope: full delivery of ${project.name} across all defined workstreams.\nOut of scope: ongoing operations, post-go-live support beyond 90 days.`,
    sponsor:     "Executive Director, " + project.department,
    pm:          project.pm,
    startDate:   "2026-04-01",
    endDate:     project.endDate,
    budget:      `$${project.budgetTotal.toFixed(1)}M`,
    constraints: "Must comply with procurement policy. Key milestones cannot slip beyond 30 days without board approval.",
    assumptions: "Stakeholder availability confirmed. No major regulatory changes expected during delivery.",
    risks:       `${project.risks} open risks logged in Project Risks tab. Top risk: vendor delivery delay.`,
    successCriteria: "Go-live achieved by target date. User acceptance ≥ 85%. Budget variance < 5%.",
  });

  function patch(key: keyof typeof fields, val: string) {
    setFields((prev) => ({ ...prev, [key]: val }));
  }

  function Field({ label, fieldKey, multiline = false }: { label: string; fieldKey: keyof typeof fields; multiline?: boolean }) {
    return (
      <div className="space-y-1">
        <div className="label-eyebrow">{label}</div>
        {editMode ? (
          multiline
            ? <Textarea value={fields[fieldKey]} onChange={(e) => patch(fieldKey, e.target.value)} className="text-sm min-h-[64px]" rows={3} />
            : <Input value={fields[fieldKey]} onChange={(e) => patch(fieldKey, e.target.value)} className="text-sm" />
        ) : (
          <p className="text-sm text-foreground whitespace-pre-line">{fields[fieldKey]}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="glass-card flex items-center justify-between px-5 py-4">
        <div>
          <h2 className="text-base font-medium text-foreground">Project Charter — {project.name}</h2>
          <p className="text-xs text-muted-foreground">Version 1.0 · {project.department} · {project.businessLine}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            approved
              ? "bg-rag-green/10 text-rag-green border border-rag-green/30"
              : "bg-rag-amber/10 text-rag-amber border border-rag-amber/30"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${approved ? "bg-rag-green" : "bg-rag-amber"}`} />
            {approved ? "Approved" : "Pending Approval"}
          </span>
          {!approved && (
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
              onClick={() => { setApproved(true); toast.success("Charter approved"); }}>
              Approve Charter
            </Button>
          )}
          <Button size="sm" variant="outline" className="text-xs"
            onClick={() => { setEditMode((e) => !e); if (editMode) toast.success("Charter saved"); }}>
            {editMode ? "Save" : "Edit"}
          </Button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-4">
            <div className="label-eyebrow text-accent">Project Purpose</div>
            <Field label="Objective" fieldKey="objective" multiline />
            <Field label="Scope" fieldKey="scope" multiline />
          </div>

          <div className="glass-card p-5 space-y-4">
            <div className="label-eyebrow text-accent">Success Criteria</div>
            <Field label="Definition of success" fieldKey="successCriteria" multiline />
          </div>

          <div className="glass-card p-5 space-y-4">
            <div className="label-eyebrow text-accent">Constraints & Assumptions</div>
            <Field label="Constraints" fieldKey="constraints" multiline />
            <Field label="Assumptions" fieldKey="assumptions" multiline />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-4">
            <div className="label-eyebrow text-accent">Project Identity</div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Sponsor" fieldKey="sponsor" />
              <Field label="Project Manager" fieldKey="pm" />
              <Field label="Start Date" fieldKey="startDate" />
              <Field label="End Date" fieldKey="endDate" />
              <Field label="Approved Budget" fieldKey="budget" />
              <div className="space-y-1">
                <div className="label-eyebrow">Client</div>
                <p className="text-sm text-foreground">{project.client ?? "Internal"}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 space-y-4">
            <div className="label-eyebrow text-accent">Risk Summary</div>
            <Field label="Key risks at charter stage" fieldKey="risks" multiline />
          </div>

          <div className="glass-card p-5 space-y-3">
            <div className="label-eyebrow text-accent">Approval Record</div>
            {[
              { role: "Executive Sponsor", name: "Ahmad Al-Farsi", date: approved ? "May 02, 2026" : "—", done: approved },
              { role: "Portfolio Director", name: "Aisha Khoury",  date: approved ? "May 04, 2026" : "—", done: approved },
              { role: "Project Manager",   name: project.pm,       date: approved ? "Apr 29, 2026" : "—", done: true },
              { role: "Finance Manager",   name: "John Smith",     date: approved ? "May 04, 2026" : "—", done: approved },
            ].map((a) => (
              <div key={a.role} className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-foreground">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.role}</div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{a.date}</span>
                  <span className={`h-5 w-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                    a.done ? "bg-rag-green/10 text-rag-green" : "bg-rag-amber/10 text-rag-amber"
                  }`}>{a.done ? "✓" : "…"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ project }: { project: typeof projects[number] }) {
  const ragMap = {
    green: { label: "On Track", text: "text-rag-green", bg: "bg-rag-green/15", ring: "ring-rag-green/40" },
    amber: { label: "At Risk", text: "text-rag-amber", bg: "bg-rag-amber/15", ring: "ring-rag-amber/40" },
    red: { label: "Off-Track", text: "text-rag-red", bg: "bg-rag-red/15", ring: "ring-rag-red/40" },
    blue: { label: "Not Started", text: "text-rag-blue", bg: "bg-rag-blue/15", ring: "ring-rag-blue/40" },
    grey: { label: "On Hold", text: "text-muted-foreground", bg: "bg-muted/20", ring: "ring-muted/40" },
  } as const;
  const r = ragMap[project.rag];
  const spentPct = Math.round((project.budgetUsed / project.budgetTotal) * 100);
  const remaining = (project.budgetTotal - project.budgetUsed).toFixed(1);

  const stages = [
    { n: 1, name: "Initiation", done: true },
    { n: 2, name: "Planning", done: true },
    { n: 3, name: "Execution", done: true },
    { n: 4, name: "Monitoring", done: false },
    { n: 5, name: "Closure", done: false },
  ];

  const milestones = [
    { name: "Requirements Sign-off", date: "2026-05-15", rag: "green" as const },
    { name: "Design Review", date: "2026-05-22", rag: "green" as const },
    { name: "UAT Completion", date: "2026-06-01", rag: "amber" as const },
  ];

  const activity = [
    { title: "Status updated to At Risk", who: project.pm, when: "2h ago" },
    { title: "Milestone completed", who: "Sara Mohamed", when: "5h ago" },
    { title: "Budget revised", who: "Finance Team", when: "1d ago" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-4">
        <div className="glass-card p-5">
          <div className="label-eyebrow mb-4">Project Health</div>
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${r.bg} ring-2 ${r.ring}`}>
              <span className={`text-lg ${r.text}`}>✓</span>
            </div>
            <div>
              <div className={`text-base font-medium ${r.text}`}>{r.label}</div>
              <div className="text-xs text-muted-foreground">Last updated: 2 hours ago</div>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Progress:</span>
              <span className="num-mono font-medium text-foreground">{project.progress}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Start Date:</span>
              <span className="num-mono font-medium text-foreground">{(project as any).startDate ?? "2026-01-10"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">End Date:</span>
              <span className="num-mono font-medium text-foreground">{project.endDate}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="label-eyebrow mb-4">Stage Gates</div>
          <ul className="space-y-3">
            {stages.map((s) => (
              <li key={s.n} className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${s.done ? "bg-accent text-accent-foreground" : "border border-border bg-secondary/40 text-muted-foreground"}`}>
                  {s.done ? <span className="text-sm">✓</span> : <span className="num-mono text-xs">{s.n}</span>}
                </div>
                <span className={`text-sm ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-5">
          <div className="label-eyebrow mb-4">Next Milestones</div>
          <ul className="space-y-3">
            {milestones.map((m) => (
              <li key={m.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${m.rag === "green" ? "bg-rag-green" : "bg-rag-amber"}`} />
                  <span className="text-sm font-medium text-foreground">{m.name}</span>
                </div>
                <span className="num-mono text-xs text-muted-foreground">{m.date}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card p-5">
          <div className="label-eyebrow mb-4">Budget Status</div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Spent</span>
            <span className="num-mono font-medium text-foreground">${project.budgetUsed.toFixed(1)}M / ${project.budgetTotal.toFixed(1)}M</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary/50">
            <div className="h-full rounded-full bg-rag-green" style={{ width: `${spentPct}%` }} />
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Remaining: ${remaining}M</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-5">
          <div className="label-eyebrow mb-4">Open Project Risks</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-rag-amber/30 bg-rag-amber/10 p-5 text-center">
              <div className="num-mono text-3xl font-medium text-rag-amber">{project.risks}</div>
              <div className="mt-1 text-xs text-muted-foreground">Risks</div>
            </div>
            <div className="rounded-lg border border-rag-red/30 bg-rag-red/10 p-5 text-center">
              <div className="num-mono text-3xl font-medium text-rag-red">{project.issues}</div>
              <div className="mt-1 text-xs text-muted-foreground">Issues</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="label-eyebrow mb-4">Recent Activity</div>
          <ul className="space-y-3">
            {activity.map((a) => (
              <li key={a.title} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">{a.title}</div>
                  <div className="text-xs text-accent">{a.who}</div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{a.when}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Add Team Member dialog ─────────────────────────────────────────────────────
type TeamMemberEntry = { n: string; r: string; a: number; p: string; s: Rag };

function AddTeamMemberDialog({
  open, onOpenChange, onAdd,
}: { open: boolean; onOpenChange: (o: boolean) => void; onAdd: (m: TeamMemberEntry) => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [alloc, setAlloc] = useState("50");
  const [period, setPeriod] = useState("");

  function submit() {
    if (!name.trim() || !role.trim()) { toast.error("Name and role are required"); return; }
    onAdd({ n: name.trim(), r: role.trim(), a: parseInt(alloc) || 50, p: period || "TBD", s: "green" });
    onOpenChange(false); setName(""); setRole(""); setAlloc("50"); setPeriod("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Select onValueChange={setName}>
              <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
              <SelectContent>
                {resourcePool.map((r) => (
                  <SelectItem key={r.name} value={r.name}>{r.name} — {r.role}</SelectItem>
                ))}
                <SelectItem value="__custom__">Enter manually…</SelectItem>
              </SelectContent>
            </Select>
            {name === "__custom__" && (
              <Input placeholder="Full name" onChange={(e) => setName(e.target.value)} className="mt-1 bg-secondary/40" />
            )}
          </div>
          <div className="space-y-1">
            <Label>Role on project</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Business Analyst" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Allocation %</Label>
              <Input type="number" min={10} max={100} value={alloc} onChange={(e) => setAlloc(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Period</Label>
              <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g. Jun–Sep" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Add Member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Request Resource dialog ───────────────────────────────────────────────────
function RequestResourceDialog({
  open, onOpenChange, project, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  project: typeof projects[number];
  onSubmit: (r: Omit<ResourceRequest, "id" | "date" | "status">) => void;
}) {
  const [role, setRole] = useState("");
  const [skill, setSkill] = useState<"Junior" | "Mid" | "Senior" | "Lead">("Mid");
  const [fte, setFte] = useState("1.0");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [priority, setPriority] = useState<"Critical" | "High" | "Medium" | "Low">("Medium");
  const [notes, setNotes] = useState("");

  function submit() {
    if (!role.trim() || !from || !until) { toast.error("Role and dates are required"); return; }
    onSubmit({ project: project.name, role: role.trim(), skill, fte: parseFloat(fte) || 1, from, until, priority, submittedBy: project.pm, notes });
    onOpenChange(false); setRole(""); setSkill("Mid"); setFte("1.0"); setFrom(""); setUntil(""); setPriority("Medium"); setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Request Resource</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Role / Skill needed</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Data Engineer" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Skill level</Label>
              <Select value={skill} onValueChange={(v) => setSkill(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Junior", "Mid", "Senior", "Lead"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>FTE</Label>
              <Input type="number" min={0.5} max={3} step={0.5} value={fte} onChange={(e) => setFte(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>From (yyyy-mm)</Label>
              <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="2026-07" />
            </div>
            <div className="space-y-1">
              <Label>Until (yyyy-mm)</Label>
              <Input value={until} onChange={(e) => setUntil(e.target.value)} placeholder="2026-09" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Critical", "High", "Medium", "Low"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special requirements…" className="text-sm" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Submit Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type TenderStatus = "Draft" | "Sent for Tendering" | "Proposals Received" | "Awarded" | "Cancelled";
type TenderProposal = { vendor: string; score: number; value: string };
type TenderPackage = {
  id: string; scope: string; est: string; status: TenderStatus;
  rfp?: string; issued?: string; closes?: string;
  proposals?: TenderProposal[];
  vendor?: string; contract?: string; awarded?: string;
};

const SEED_PACKAGES: TenderPackage[] = [
  { id: "PKG-001", scope: "Integration partner services", est: "$680K", status: "Awarded", rfp: "RFP-014", vendor: "Siemens MENA", contract: "CT-2026-038", awarded: "May 12" },
  { id: "PKG-002", scope: "Cybersecurity audit & pen-test", est: "$140K", status: "Proposals Received", rfp: "RFP-015", proposals: [
    { vendor: "CyberShield Arabia", score: 88, value: "$135K" },
    { vendor: "SecureIT MENA", score: 74, value: "$142K" },
  ]},
  { id: "PKG-003", scope: "Training services rollout", est: "$95K", status: "Sent for Tendering", rfp: "RFP-016", issued: "Jun 01", closes: "Jun 28" },
  { id: "PKG-004", scope: "Managed support (1 year)", est: "$285K", status: "Draft" },
];

// ── Progress Update dialog (shown when the Progress KPI is clicked) ─────────
function ProgressUpdateDialog({
  open, onOpenChange, items, onSetProgress, onRequestApproval, onApprove, initialTaskName, scopeMilestone,
  projectBaseline, setProjectBaseline, projectBaselineVersions, setProjectBaselineVersions,
  milestones, resourceRequests, setCrDialogOpen,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: Milestone[];
  onSetProgress: (name: string, progress: number) => void;
  onRequestApproval: (name: string) => void;
  onApprove: (name: string) => void;
  initialTaskName?: string;
  scopeMilestone?: string;
  projectBaseline: { version: number; createdAt: string; isLocked: boolean; snapshot: Milestone[] } | null;
  setProjectBaseline: React.Dispatch<React.SetStateAction<{ version: number; createdAt: string; isLocked: boolean; snapshot: Milestone[] } | null>>;
  projectBaselineVersions: Array<{ version: number; createdAt: string; snapshot: Milestone[] }>;
  setProjectBaselineVersions: React.Dispatch<React.SetStateAction<Array<{ version: number; createdAt: string; snapshot: Milestone[] }>>>;
  milestones: Milestone[];
  resourceRequests: ResourceRequest[];
  setCrDialogOpen: (v: boolean) => void;
}) {
  // All leaf tasks (no children)
  const allLeaves = useMemo(
    () => items.filter((m) => m.kind === "Task" && !items.some((c) => c.parent === m.name)),
    [items],
  );
  // When scoped to a milestone, only include leaves whose ancestor chain reaches that milestone.
  const leaves = useMemo(() => {
    if (!scopeMilestone) return allLeaves;
    const byName = new Map(items.map((i) => [i.name, i]));
    const isDescendant = (name: string): boolean => {
      let cur = byName.get(name);
      const seen = new Set<string>();
      while (cur?.parent && !seen.has(cur.parent)) {
        if (cur.parent === scopeMilestone) return true;
        seen.add(cur.parent);
        cur = byName.get(cur.parent);
      }
      return false;
    };
    return allLeaves.filter((l) => isDescendant(l.name));
  }, [allLeaves, items, scopeMilestone]);
  const milestoneItems = useMemo(() => items.filter((m) => m.kind === "Milestone"), [items]);
  const scopeKind = useMemo(() => items.find((i) => i.name === scopeMilestone)?.kind, [items, scopeMilestone]);
  const scopeLabel = scopeKind === "Task" ? "Task" : "Milestone";

  // Project-wide weighted actual vs planned (based on leaf-task weightScore).
  const { actualPct, plannedPct } = useMemo(() => {
    let totalW = 0, wa = 0, wp = 0;
    for (const t of leaves) {
      const w = Math.max(0, t.weightScore ?? 1);
      totalW += w;
      wa += w * (t.progress ?? 0);
      wp += w * computePlannedProgress(t.startDate, t.endDate);
    }
    return {
      actualPct: totalW ? Math.round(wa / totalW) : 0,
      plannedPct: totalW ? Math.round(wp / totalW) : 0,
    };
  }, [leaves]);

  const [selected, setSelected] = useState<string>("");
  const [draftPct, setDraftPct] = useState<number>(0);
  useEffect(() => {
    if (!open) return;
    const pre = initialTaskName ? leaves.find((l) => l.name === initialTaskName) : undefined;
    const first = pre ?? leaves[0];
    setSelected(first?.name ?? "");
    setDraftPct(first?.progress ?? 0);
  }, [open, leaves, initialTaskName]);


  const current = leaves.find((t) => t.name === selected);
  const currentPlanned = current ? computePlannedProgress(current.startDate, current.endDate) : 0;
  // Find the ancestor milestone (if any) that requires approval for `current`.
  const approvalMilestone = useMemo(() => {
    if (!current) return null as Milestone | null;
    const byName = new Map(items.map((i) => [i.name, i]));
    let cur: Milestone | undefined = current;
    const seen = new Set<string>();
    while (cur?.parent && !seen.has(cur.parent)) {
      const p = byName.get(cur.parent);
      if (!p) break;
      if (p.requiresApproval) return p;
      seen.add(cur.parent);
      cur = p;
    }
    return null;
  }, [current, items]);

  // Every leaf task that rolls up into that milestone.
  const approvalLeaves = useMemo(() => {
    if (!approvalMilestone) return [] as Milestone[];
    const byName = new Map(items.map((i) => [i.name, i]));
    const isDesc = (name: string) => {
      let c = byName.get(name);
      const seen = new Set<string>();
      while (c?.parent && !seen.has(c.parent)) {
        if (c.parent === approvalMilestone.name) return true;
        seen.add(c.parent);
        c = byName.get(c.parent);
      }
      return false;
    };
    return allLeaves.filter((l) => isDesc(l.name));
  }, [approvalMilestone, items, allLeaves]);

  // Would every child task be at 100% once we save the current draft?
  const allChildrenAt100 = useMemo(() => {
    if (!approvalMilestone || !current || approvalLeaves.length === 0) return false;
    return approvalLeaves.every((l) => {
      const p = l.name === current.name ? draftPct : (l.progress ?? 0);
      return p >= 100;
    });
  }, [approvalMilestone, approvalLeaves, current, draftPct]);

  const msApproved = approvalMilestone?.approvalStatus === "approved";
  const msPending = approvalMilestone?.approvalStatus === "pending" && allChildrenAt100;
  const showSendApprovalBtn = !!approvalMilestone && allChildrenAt100 && !msApproved && approvalMilestone.approvalStatus !== "pending";

  function save() {
    if (!current) return;
    onSetProgress(current.name, draftPct);
    toast.success(`Progress updated — ${current.name} → ${draftPct}%`);
  }

  function saveAndRequestApproval() {
    if (!current || !approvalMilestone) return;
    onSetProgress(current.name, draftPct);
    onRequestApproval(approvalMilestone.name);
    toast.success(`Approval requests sent for ${approvalMilestone.name}`);
  }

  function createProjectBaseline() {
    const derived = computeDerivedSchedule(milestones, resourceRequests);
    const versionNumber = projectBaselineVersions.length + 1;

    const newVersion = {
      version: versionNumber,
      createdAt: new Date().toISOString().split('T')[0],
      snapshot: derived,
    };

    setProjectBaseline({
      version: versionNumber,
      createdAt: new Date().toISOString().split('T')[0],
      isLocked: true,
      snapshot: derived,
    });

    setProjectBaselineVersions((prev) => [...prev, newVersion]);
    toast.success(`🔒 Project Baseline v${versionNumber} created & locked — all schedule changes now require Change Requests`);
  }

  function requestChangeRequest() {
    if (!projectBaseline || !projectBaseline.isLocked) return;
    setCrDialogOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {scopeMilestone ? `Progress Update — ${scopeMilestone}` : "Progress Update"}
          </DialogTitle>
        </DialogHeader>

        {/* Overall planned vs actual (scoped when applicable) */}
        <div className="rounded-lg border border-border bg-secondary/30 p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="label-eyebrow">{scopeMilestone ? `${scopeLabel} roll-up` : "Overall project"}</span>
            <span className={actualPct >= plannedPct ? "text-rag-green" : "text-rag-amber"}>
              {actualPct >= plannedPct ? "On / ahead of plan" : `${plannedPct - actualPct}% behind plan`}
            </span>
          </div>
          <PlanVsActualBar actual={actualPct} planned={plannedPct} />
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Actual <span className="num-mono text-foreground">{actualPct}%</span></span>
            <span>Planned <span className="num-mono text-foreground">{plannedPct}%</span></span>
          </div>
        </div>

        {/* Picker + update form */}
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="grid gap-2">
            <Label className="text-xs">Pick a task to update</Label>
            <Select value={selected} onValueChange={(v) => {
              setSelected(v);
              const t = leaves.find((x) => x.name === v);
              setDraftPct(t?.progress ?? 0);
            }}>
              <SelectTrigger><SelectValue placeholder="Choose a task…" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {leaves.filter((t) => current?.parent ? t.parent === current.parent : true).map((t) => (
                  <SelectItem key={t.name} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {current && (
              <div className="mt-1 rounded-md border border-border bg-secondary/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-foreground">{current.name}</div>
                  {current.requiresApproval && (
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                      current.approvalStatus === "approved" ? "border-rag-green/40 bg-rag-green/10 text-rag-green"
                      : current.approvalStatus === "pending" ? "border-rag-amber/40 bg-rag-amber/10 text-rag-amber"
                      : "border-border bg-secondary text-muted-foreground"
                    }`}>
                      {current.approvalStatus === "approved" ? "Approved"
                        : current.approvalStatus === "pending" ? "Approval pending"
                        : "Needs approval at 100%"}
                    </span>
                  )}
                </div>
                <PlanVsActualBar actual={current.progress ?? 0} planned={currentPlanned} />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Actual <span className="num-mono text-foreground">{current.progress ?? 0}%</span></span>
                  <span>Planned <span className="num-mono text-foreground">{currentPlanned}%</span></span>
                </div>
                <div className="border-t border-border/50 pt-2 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start:</span>
                    <span className="text-foreground">{current.startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End:</span>
                    <span className="text-foreground">{current.endDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Owner:</span>
                    <span className="text-foreground">{current.owner || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assignee:</span>
                    <span className="text-foreground">{current.assignee || "—"}</span>
                  </div>
                  {current.dep && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Depends on:</span>
                      <span className="text-foreground">{current.dep}</span>
                    </div>
                  )}
                  {current.parent && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parent:</span>
                      <span className="text-foreground">{current.parent}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">New progress (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={draftPct}
              onChange={(e) => setDraftPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
            />
            <div className="flex flex-col gap-2">
              {msApproved ? (
                <div className="flex items-center justify-center gap-1.5 rounded-md border border-rag-green/40 bg-rag-green/10 px-3 py-2 text-sm font-medium text-rag-green">
                  <Check className="h-4 w-4" /> Approved
                </div>
              ) : msPending ? (
                <div className="flex items-center justify-center rounded-md border border-rag-amber/40 bg-rag-amber/10 px-3 py-2 text-sm font-medium text-rag-amber">
                  Waiting for the Approval
                </div>
              ) : showSendApprovalBtn ? (
                <Button
                  onClick={saveAndRequestApproval}
                  disabled={!current}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Send Approval Request
                </Button>
              ) : (
                <Button
                  onClick={save}
                  disabled={!current}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Save update
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Milestones can't be updated directly — their progress is rolled up from their child tasks
              using each task's weight score.
            </p>
          </div>
        </div>


        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanVsActualBar({ actual, planned }: { actual: number; planned: number }) {
  const a = Math.max(0, Math.min(100, actual));
  const p = Math.max(0, Math.min(100, planned));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="w-3 text-[9px] uppercase tracking-wide text-accent">A</span>
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-secondary/60">
          <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${a}%` }} />
        </div>
        <span className="num-mono w-8 shrink-0 text-right text-[10px] text-accent">{a}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 text-[9px] uppercase tracking-wide text-rag-blue">P</span>
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-secondary/40">
          <div className="absolute inset-y-0 left-0 bg-rag-blue" style={{ width: `${p}%` }} />
        </div>
        <span className="num-mono w-8 shrink-0 text-right text-[10px] text-rag-blue">{p}%</span>
      </div>
    </div>
  );
}


// ── Business Trips tab ───────────────────────────────────────────────────────
function BusinessTripsTab({ pm }: { pm: string }) {
  const [trips, setTrips] = useState<Trip[]>([
    { id: "T-01", purpose: "Site survey", dest: "Dubai, UAE", dates: "Jun 12 – Jun 15", travelers: "Sara, Mei", cost: "$5.2K", rag: "green", status: "Completed" },
    { id: "T-02", purpose: "Vendor workshop", dest: "Munich, DE", dates: "Jul 08 – Jul 11", travelers: "K. Bauer", cost: "$3.0K", rag: "green", status: "Completed" },
    { id: "T-03", purpose: "User training", dest: "Riyadh, KSA", dates: "Aug 18 – Aug 22", travelers: "H. Tanaka, Priya, +2", cost: "$9.8K", rag: "amber", status: "Booked" },
    { id: "T-04", purpose: "Go-live support", dest: "Doha, QA", dates: "Sep 14 – Sep 28", travelers: "John, Mei, +2", cost: "$6.5K", rag: "blue", status: "Planned" },
  ]);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { l: "Trips Planned", v: String(trips.length) },
          { l: "Travelers", v: "9" },
          { l: "Total Budget", v: "$24.5K" },
          { l: "Spent", v: "$8.2K", c: "text-rag-green" },
        ].map((k) => (
          <div key={k.l} className="glass-card p-4">
            <div className="label-eyebrow">{k.l}</div>
            <div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">Trips</div>
        <LogTripDialog
          teamMembers={[pm, "Mei Chen", "Priya Iyer", "Diego Ortiz", "K. Bauer", "H. Tanaka"]}
          onAdd={(t) => setTrips((prev) => [...prev, { ...t, id: `T-${String(prev.length + 1).padStart(2, "0")}` }])}
        />
      </div>
      <div className="">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0"><TableHead>Trip</TableHead><TableHead>Purpose</TableHead><TableHead>Destination</TableHead><TableHead>Dates</TableHead><TableHead>Travelers</TableHead><TableHead>Cost</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{trips.map((r) => (
            <TableRow key={r.id} className="bg-[#1D1D23] hover:bg-[#252530] border-0">
              <TableCell className="font-medium text-foreground">{r.id}</TableCell>
              <TableCell>{r.purpose}</TableCell>
              <TableCell>{r.dest}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{r.dates}</TableCell>
              <TableCell className="text-xs">{r.travelers}</TableCell>
              <TableCell className="num-mono">{r.cost}</TableCell>
              <TableCell><RagBadge rag={r.rag} label={r.status} /></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Financials tab (includes Financial Planning content) ─────────────────────
function FinancialsTab({ project }: { project: typeof projects[number] }) {
  const [costEntries, setCostEntries] = useState<CostEntry[]>([
    { c: "Labour",            b: 1.20, a: 0.84, color: "bg-rag-green" },
    { c: "Hardware",          b: 0.90, a: 0.62, color: "bg-rag-blue" },
    { c: "Software licenses", b: 0.40, a: 0.31, color: "bg-accent" },
    { c: "Business trips",    b: 0.10, a: 0.07, color: "bg-rag-amber" },
    { c: "Contingency",       b: 0.60, a: 0.26, color: "bg-muted-foreground" },
  ]);
  const [revEntries, setRevEntries] = useState<RevEntry[]>([
    { ms: "Discovery complete", evt: "Advance payment (30%)",  plan: 0.96, date: "May 02",        s: "green", sl: "Received", act: 0.96 },
    { ms: "Build phase 1",      evt: "Progress invoice (20%)", plan: 0.64, date: "Jun 30",        s: "amber", sl: "Pending",  act: null },
    { ms: "UAT Sign-off",       evt: "Progress invoice (25%)", plan: 0.80, date: project.endDate, s: "blue",  sl: "Planned",  act: null },
    { ms: "Go-live",            evt: "Final payment (25%)",    plan: 0.80, date: "Sep 14",        s: "blue",  sl: "Planned",  act: null },
  ]);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { l: "Total Budget", v: `$${project.budgetTotal.toFixed(1)}M` },
          { l: "Spent", v: `$${project.budgetUsed.toFixed(2)}M` },
          { l: "Committed", v: "$1.12M", c: "text-rag-amber" },
          { l: "Forecast EAC", v: `$${(project.budgetTotal * 1.04).toFixed(2)}M`, c: "text-rag-amber" },
        ].map((k) => (
          <div key={k.l} className="glass-card p-4">
            <div className="label-eyebrow">{k.l}</div>
            <div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_360px]">
        <div className="glass-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="label-eyebrow">Cost categories</div>
            <AddCostDialog onAdd={(e) => setCostEntries((prev) => [...prev, e])} />
          </div>
          <div className="space-y-3">
            {costEntries.map((r) => {
              const pct = Math.round((r.a / r.b) * 100);
              return (
                <div key={r.c}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-foreground">{r.c}</span>
                    <span className="num-mono text-xs text-muted-foreground">${r.a.toFixed(2)}M / ${r.b.toFixed(2)}M</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/50">
                    <div className={`h-full ${r.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="label-eyebrow mb-3">Quarterly cash plan</div>
          <ul className="space-y-3 text-sm">
            {[
              { q: "Q1 2026", v: "$0.45M", s: "green", sl: "Released" },
              { q: "Q2 2026", v: "$1.05M", s: "green", sl: "Released" },
              { q: "Q3 2026", v: "$1.20M", s: "amber", sl: "Pending" },
              { q: "Q4 2026", v: "$0.50M", s: "blue", sl: "Planned" },
            ].map((q) => (
              <li key={q.q} className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
                <div>
                  <div className="text-foreground">{q.q}</div>
                  <div className="num-mono text-xs text-muted-foreground">{q.v}</div>
                </div>
                <RagBadge rag={q.s as any} label={q.sl} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="label-eyebrow">Revenue plan — linked to milestones</div>
          <div className="flex items-center gap-3">
            <span className="num-mono text-xs text-muted-foreground">
              Total planned: ${revEntries.reduce((s, r) => s + r.plan, 0).toFixed(2)}M
            </span>
            <AddRevenueDialog onAdd={(e) => setRevEntries((prev) => [...prev, e])} />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-transparent border-0">
              <TableHead>Milestone</TableHead>
              <TableHead>Revenue event</TableHead>
              <TableHead className="text-right">Planned ($M)</TableHead>
              <TableHead>Expected date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actual ($M)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revEntries.map((r) => (
              <TableRow key={r.ms} className="bg-[#1D1D23] hover:bg-[#252530] border-0">
                <TableCell className="font-medium text-foreground">{r.ms}</TableCell>
                <TableCell className="text-muted-foreground">{r.evt}</TableCell>
                <TableCell className="num-mono text-right">${r.plan.toFixed(2)}M</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.date}</TableCell>
                <TableCell><RagBadge rag={r.s as any} label={r.sl} /></TableCell>
                <TableCell className="num-mono text-right">{r.act != null ? `$${r.act.toFixed(2)}M` : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


function RequestResourcesDialog({ projectName }: { projectName: string }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("");
  const [skill, setSkill] = useState("");
  const [fte, setFte] = useState("1.0");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [priority, setPriority] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit() {
    if (!role || !skill || !priority) { toast.error("Please fill in role, skill level, and priority"); return; }
    toast.success(`Resource request submitted to Resource Manager`, {
      description: `${fte} FTE ${skill} ${role} for ${projectName}`,
    });
    setOpen(false);
    setRole(""); setSkill(""); setFte("1.0"); setFrom(""); setUntil(""); setPriority(""); setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />Request Resources
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Resources</DialogTitle>
        </DialogHeader>

        <div className="rounded-md border border-accent/20 bg-accent-dim/30 px-3 py-2 text-xs text-accent">
          Project: <span className="font-medium">{projectName}</span>
          <span className="ml-2 text-muted-foreground">· Request will be sent to the Resource Manager</span>
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label>Role needed</Label>
              <Input
                placeholder="e.g. Solution Architect"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div>
              <Label>Skill level</Label>
              <Select onValueChange={setSkill}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Mid">Mid</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>FTE required</Label>
              <Input
                type="number" min={0.5} max={5} step={0.5}
                value={fte}
                onChange={(e) => setFte(e.target.value)}
              />
            </div>
            <div>
              <Label>From</Label>
              <Input type="month" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label>Until</Label>
              <Input type="month" value={until} onChange={(e) => setUntil(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Priority</Label>
              <Select onValueChange={setPriority}>
                <SelectTrigger><SelectValue placeholder="Select priority…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">Critical — blocks project</SelectItem>
                  <SelectItem value="High">High — needed within 2 weeks</SelectItem>
                  <SelectItem value="Medium">Medium — within a month</SelectItem>
                  <SelectItem value="Low">Low — planning ahead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Specific skills, certifications, or context…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSubmit}>
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



// ── v11 Types ─────────────────────────────────────────────────────────────────
type ItemKind = "Milestone" | "Task";
type MilestoneType = "start" | "finish";
type RoleReq = { role: string; skill: "Junior" | "Mid" | "Senior" | "Lead"; fte: number };
type PaymentLinkKind = "None" | "Client Revenue" | "Package Cost";
type PaymentLink = { kind: PaymentLinkKind; amount: string; packageId?: string };
type Milestone = {
  name: string; kind: ItemKind; startDate: string; endDate: string;
  owner: string; rag: Rag; dep: string; roles: RoleReq[];
  payment?: PaymentLink; progress?: number; parent?: string;
  assignee?: string;
  lagDays?: number;              // milestone only — buffer added after last child
  milestoneType?: MilestoneType; // milestone only — "start" | "finish" (visual)
  durationValue?: number;        // task only
  durationUnit?: "hours" | "days"; // task only
  isParallel?: boolean;          // task only — excluded from activity sum
  resourceRequestIds?: string[]; // task only — fulfilled requests set assignee
  weightScore?: number;          // task only — relative weight (1-10) for parent rollup
  /** When true, the item cannot be marked 100% complete until approval is granted. */
  requiresApproval?: boolean;
  /** Workflow state: undefined (not requested) → "pending" → "approved" | "rejected". */
  approvalStatus?: "approved" | "pending" | "rejected";
  approvers?: { id: string; name: string; role: string; department: string }[];
  dependencies?: any[];
  /** Baseline snapshot — locked version after approval. Milestone only. */
  baseline?: { version: number; createdAt: string; baselineStart: string; baselineEnd: string; baselineProgress: number; isLocked: boolean };
  /** Version history for change requests. */
  versions?: Array<{ version: number; createdAt: string; change?: string; approvedBy?: string }>;
};

type Trip = { id: string; purpose: string; dest: string; dates: string; travelers: string; cost: string; rag: Rag; status: string };
type CostEntry = { c: string; b: number; a: number; color: string };
type RevEntry = { ms: string; evt: string; plan: number; date: string; s: string; sl: string; act: number | null };
type GateItem = { task: string; role: string; done: boolean };
type GateStage = { name: string; items: GateItem[] };
type RaidItem = { id: string; title: string; kind: "Risk" | "Issue"; score: number; owner: string; status: string; rag: Rag };
type StatusReport = { week: number; by: string; when: string; rag: Rag; text: string };
type Stakeholder = { name: string; org: string; influence: "High" | "Medium" | "Low"; interest: "High" | "Medium" | "Low"; strategy: string };
type Lesson = { tag: string; text: string; by: string; when: string };

// ── Derivation: end dates / durations / assignees ────────────────────────────
function addDaysISO(iso: string, n: number) {
  if (!iso) return iso;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
function maxISO(arr: (string | undefined)[]): string | undefined {
  const v = arr.filter(Boolean) as string[];
  if (!v.length) return undefined;
  return v.slice().sort().pop();
}
function minISO(arr: (string | undefined)[]): string | undefined {
  const v = arr.filter(Boolean) as string[];
  if (!v.length) return undefined;
  return v.slice().sort()[0];
}
function computeDerivedSchedule(items: Milestone[], reqs: ResourceRequest[]): Milestone[] {
  const out = items.map((it) => ({ ...it }));
  const childrenOf = new Map<string, Milestone[]>();
  for (const it of out) {
    if (!it.parent) continue;
    if (!childrenOf.has(it.parent)) childrenOf.set(it.parent, []);
    childrenOf.get(it.parent)!.push(it);
  }

  // Task leaves: derive endDate from duration; assignee from fulfilled requests or "Waiting"
  for (const it of out) {
    if (it.kind !== "Task") continue;
    const hasKids = (childrenOf.get(it.name)?.length ?? 0) > 0;
    if (!hasKids && it.durationValue && it.startDate) {
      const days = it.durationUnit === "hours"
        ? Math.max(1, Math.ceil(it.durationValue / 8))
        : Math.max(1, it.durationValue);
      it.endDate = addDaysISO(it.startDate, days - 1);
    }
    if (it.resourceRequestIds?.length) {
      const linked = it.resourceRequestIds
        .map((id) => reqs.find((r) => r.id === id))
        .filter(Boolean) as ResourceRequest[];
      const fulfilled = linked
        .filter((r) => r.status === "Fulfilled" && r.assignedTo)
        .map((r) => r.assignedTo!) as string[];
      if (fulfilled.length) it.assignee = Array.from(new Set(fulfilled)).join(", ");
      else if (linked.length) it.assignee = "Waiting";
    }
  }

  // Recursive rollup: parent dates and progress derived from children (any depth).
  const byName = new Map(out.map((it) => [it.name, it] as const));
  const visiting = new Set<string>();

  function rollup(name: string): { start?: string; end?: string; progress: number } {
    const it = byName.get(name)!;
    const kids = childrenOf.get(name) ?? [];
    if (!kids.length) {
      return { start: it.startDate, end: it.endDate, progress: it.progress ?? 0 };
    }
    if (visiting.has(name)) return { start: it.startDate, end: it.endDate, progress: it.progress ?? 0 };
    visiting.add(name);

    let totalW = 0; let weighted = 0;
    let minS: string | undefined; let maxE: string | undefined;
    for (const c of kids) {
      const r = rollup(c.name);
      const w = c.kind === "Task" ? Math.max(0, c.weightScore ?? 1) : 0; // milestones don't add weight
      if (w > 0) { totalW += w; weighted += w * r.progress; }
      if (r.start && (!minS || r.start < minS)) minS = r.start;
      if (r.end && (!maxE || r.end > maxE)) maxE = r.end;
    }
    visiting.delete(name);

    const prog = totalW > 0 ? Math.round(weighted / totalW) : (it.progress ?? 0);
    if (it.kind === "Task") {
      if (minS) it.startDate = minS;
      if (maxE) it.endDate = maxE;
      it.progress = prog;
    } else if (it.kind === "Milestone") {
      // Milestone is a diamond: keep stored end (or roll up to last child + lag); start = end.
      if (maxE) {
        const withLag = addDaysISO(maxE, it.lagDays ?? 0);
        if (!it.endDate || withLag > it.endDate) it.endDate = withLag;
      }
      if (it.endDate) it.startDate = it.endDate;
      it.progress = prog;
    }
    return { start: it.startDate, end: it.endDate, progress: prog };
  }

  // Roll up from all root items (recursion covers descendants).
  const allNames = new Set(out.map((i) => i.name));
  const roots = out.filter((i) => !i.parent || !allNames.has(i.parent));
  for (const r of roots) rollup(r.name);

  return out;
}

// ── Add Milestone / Task dialog ──────────────────────────────────────────────
function AddMilestoneDialog({
  defaultOwner, packages, items, projectName, addResourceRequest, onAdd, onUpdateExisting,
  open: controlledOpen, onOpenChange, hideTrigger, initialParent, initialKind, editingItem,
}: {
  defaultOwner: string;
  packages: TenderPackage[];
  items: Milestone[];
  projectName: string;
  addResourceRequest: (r: Omit<ResourceRequest, "id" | "date" | "status">) => string;
  onAdd: (m: Milestone[]) => void;
  onUpdateExisting: (name: string, patch: Partial<Milestone>) => void;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  hideTrigger?: boolean;
  initialParent?: string;
  initialKind?: ItemKind;
  editingItem?: Milestone | null;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? !!controlledOpen : internalOpen;
  const setOpen = (o: boolean) => {
    if (!isControlled) setInternalOpen(o);
    onOpenChange?.(o);
  };
  const isEditing = !!editingItem;
  const [kind, setKind] = useState<ItemKind>("Task");
  const [name, setName] = useState("");
  const [owner, setOwner] = useState(defaultOwner);
  const [status, setStatus] = useState("Not Started");
  const [dep, setDep] = useState("");

  // Milestone-specific
  const [endDate, setEndDate] = useState("");
  const [lagDays, setLagDays] = useState<number>(0);
  const [milestoneType, setMilestoneType] = useState<MilestoneType>("finish");

  // Task-specific
  const [parentName, setParentName] = useState<string>("__none__");
  const [startDate, setStartDate] = useState("");
  const [endMode, setEndMode] = useState<"date" | "duration">("duration");
  const [taskEndDate, setTaskEndDate] = useState("");
  const [durationValue, setDurationValue] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<"hours" | "days">("days");
  const [weightScore, setWeightScore] = useState<number>(1);

  // Single skill (one task = one assignee) + payment (shared)
  const [skillRole, setSkillRole] = useState<RoleReq>({ role: "", skill: "Mid", fte: 1 });
  const [payKind, setPayKind] = useState<PaymentLinkKind>("None");
  const [payAmount, setPayAmount] = useState("");
  const [payPackage, setPayPackage] = useState<string>("");

  // Milestone approval workflow
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const availableApprovers = [
    { id: "sara", name: "Sara Al-Rashid", role: "Director", dept: "Engineering" },
    { id: "john", name: "John Smith", role: "Project Manager", dept: "IT" },
    { id: "mei", name: "Mei Chen", role: "Project Manager", dept: "IT" },
    { id: "omar", name: "Omar Haddad", role: "Operations Manager", dept: "Operations" },
    { id: "priya", name: "Priya Iyer", role: "Team Lead", dept: "R&D" },
    { id: "liam", name: "Liam Walker", role: "Finance Manager", dept: "Finance" },
  ];

  const ragMap: Record<string, Rag> = { "Not Started": "blue", "In Progress": "amber", Completed: "green", Overdue: "red" };
  const ragToStatus: Record<Rag, string> = { blue: "Not Started", amber: "In Progress", green: "Completed", red: "Overdue", grey: "Not Started" };
  const roleSuggestions = ["Solution Architect", "Business Analyst", "Integration Dev", "QA Engineer", "Security Reviewer", "Change Manager", "Project Manager", "Data Engineer"];

  // Parent options: every milestone and every task can be a parent (unlimited nesting).
  // Exclude self and its descendants when editing.
  const parentOptions = useMemo(() => {
    const excluded = new Set<string>();
    if (editingItem) {
      const collect = (n: string) => {
        excluded.add(n);
        for (const it of items) if (it.parent === n) collect(it.name);
      };
      collect(editingItem.name);
    }
    return items.filter((i) => (i.kind === "Milestone" || i.kind === "Task") && !excluded.has(i.name));
  }, [items, editingItem]);

  function reset() {
    setKind(initialKind ?? "Task"); setName(""); setOwner(defaultOwner); setStatus("Not Started"); setDep("");
    setEndDate(""); setLagDays(0); setMilestoneType("finish");
    setParentName(initialParent ?? "__none__"); setStartDate(""); setEndMode("duration"); setTaskEndDate("");
    setDurationValue(1); setDurationUnit("days"); setWeightScore(1);
    setSkillRole({ role: "", skill: "Mid", fte: 1 });
    setPayKind("None"); setPayAmount(""); setPayPackage("");
    setRequiresApproval(false); setSelectedApprovers([]);
  }

  // Prefill when the dialog opens (edit mode or subtask presets)
  useEffect(() => {
    if (!open) return;
    if (editingItem) {
      setKind(editingItem.kind);
      setName(editingItem.name);
      setOwner(editingItem.owner || defaultOwner);
      setStatus(ragToStatus[editingItem.rag] ?? "Not Started");
      setDep(editingItem.dep || "");
      setMilestoneType(editingItem.milestoneType ?? "finish");
      setLagDays(editingItem.lagDays ?? 0);
      setEndDate(editingItem.endDate || "");
      setParentName(editingItem.parent ?? "__none__");
      setStartDate(editingItem.startDate || "");
      setTaskEndDate(editingItem.endDate || "");
      if (editingItem.durationValue && editingItem.durationUnit) {
        setEndMode("duration");
        setDurationValue(editingItem.durationValue);
        setDurationUnit(editingItem.durationUnit);
      } else {
        setEndMode("date");
      }
      setWeightScore(editingItem.weightScore ?? 1);
      const r = editingItem.roles?.[0];
      setSkillRole(r ? { role: r.role, skill: r.skill, fte: r.fte } : { role: "", skill: "Mid", fte: 1 });
      const p = editingItem.payment;
      setPayKind(p?.kind ?? "None");
      setPayAmount(p?.amount ?? "");
      setPayPackage(p?.packageId ?? "");
      setRequiresApproval(editingItem.requiresApproval ?? false);
      setSelectedApprovers(editingItem.approvers?.map((a) => a.id) ?? []);
    } else {
      setKind(initialKind ?? "Task");
      setParentName(initialParent ?? "__none__");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingItem?.name, initialParent, initialKind]);

  function buildPayment(): PaymentLink {
    if (payKind === "None") return { kind: "None", amount: "" };
    if (payKind === "Client Revenue") return { kind: "Client Revenue", amount: payAmount.trim() };
    return { kind: "Package Cost", packageId: payPackage, amount: payAmount.trim() };
  }

  function submit() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    const rag = ragMap[status] ?? "blue";
    const newItems: Milestone[] = [];

    if (kind === "Milestone") {
      if (!endDate) { toast.error("End date is required"); return; }
      const approvers = requiresApproval
        ? selectedApprovers.map((id) => {
            const approver = availableApprovers.find((a) => a.id === id);
            return {
              id,
              name: approver?.name || "",
              role: approver?.role || "",
              department: approver?.dept || "",
            };
          })
        : [];
      newItems.push({
        name: name.trim(), kind: "Milestone",
        startDate: endDate, endDate, owner: owner || defaultOwner, rag, dep,
        roles: [], payment: buildPayment(), progress: 0,
        lagDays: Number(lagDays) || 0,
        milestoneType,
        requiresApproval,
        approvers: requiresApproval ? approvers : undefined,
        approvalStatus: undefined,
      });
    }

    if (kind === "Task") {
      if (!startDate) { toast.error("Start date is required"); return; }
      let computedEnd: string;
      let durVal: number | undefined;
      let durUnit: "hours" | "days" | undefined;
      if (endMode === "date") {
        if (!taskEndDate) { toast.error("End date is required"); return; }
        if (taskEndDate < startDate) { toast.error("End date must be on/after start date"); return; }
        computedEnd = taskEndDate;
      } else {
        if (!durationValue || durationValue <= 0) { toast.error("Duration must be > 0"); return; }
        const days = durationUnit === "hours"
          ? Math.max(1, Math.ceil(Number(durationValue) / 8))
          : Math.max(1, Number(durationValue));
        computedEnd = addDaysISO(startDate, days - 1);
        durVal = Number(durationValue);
        durUnit = durationUnit;
      }
      const parent = parentName === "__none__" ? undefined : parentName;

      // One task = one skill = at most one resource request
      const requestIds: string[] = [];
      const fromMonth = startDate.slice(0, 7);
      const normalizedRole = skillRole.role.trim();
      const taskRoles: RoleReq[] = normalizedRole
        ? [{ role: normalizedRole, skill: skillRole.skill, fte: Number(skillRole.fte) || 0 }]
        : [];
      if (normalizedRole) {
        const id = addResourceRequest({
          project: projectName,
          role: normalizedRole,
          skill: skillRole.skill,
          fte: Number(skillRole.fte) || 0,
          from: fromMonth,
          until: fromMonth,
          priority: "Medium",
          submittedBy: owner || defaultOwner,
          notes: `Auto-requested for task "${name.trim()}"`,
        });
        requestIds.push(id);
      }

      newItems.push({
        name: name.trim(), kind: "Task",
        startDate, endDate: computedEnd, owner: owner || defaultOwner, rag, dep,
        roles: taskRoles, payment: buildPayment(), progress: 0, parent,
        durationValue: durVal, durationUnit: durUnit,
        weightScore: Math.max(1, Math.min(10, Number(weightScore) || 1)),
        resourceRequestIds: requestIds.length ? requestIds : undefined,
      });

      if (requestIds.length) {
        toast.success("Resource request sent");
      }
    }


    if (isEditing && editingItem) {
      const patch = newItems[0];
      // Drop fields that don't apply to the original kind switch (keep computed)
      onUpdateExisting(editingItem.name, patch);
      toast.success(`${kind} updated`);
    } else {
      onAdd(newItems);
      toast.success(`${kind} added`);
    }
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />Add Item</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEditing ? `Edit ${kind}` : `Add ${kind}`}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as ItemKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Milestone">Milestone</SelectItem>
                <SelectItem value="Task">Task</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. UAT Sign-off" /></div>

          {/* MILESTONE: subtype + end date + lag */}
          {kind === "Milestone" && (
            <>
              <div>
                <Label>Milestone type</Label>
                <Select value={milestoneType} onValueChange={(v) => setMilestoneType(v as MilestoneType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">Start milestone</SelectItem>
                    <SelectItem value="finish">Finish milestone</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[10px] text-muted-foreground">Progress is rolled up automatically from child tasks (weighted by score).</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
                <div>
                  <Label>Lag (days)</Label>
                  <Input type="number" min="0" value={lagDays} onChange={(e) => setLagDays(Number(e.target.value))} />
                  <p className="mt-1 text-[10px] text-muted-foreground">Buffer after the last child ends.</p>
                </div>
              </div>

              <div className="rounded-md border border-accent/20 bg-accent-dim/30 p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="requires-approval"
                    checked={requiresApproval}
                    onCheckedChange={(checked) => setRequiresApproval(!!checked)}
                  />
                  <label htmlFor="requires-approval" className="text-sm font-medium cursor-pointer">
                    Requires approval to reach 100%
                  </label>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  When enabled, milestone stays Pending until all selected approvers approve it.
                </p>

                {requiresApproval && (
                  <div className="space-y-2">
                    <Label className="text-sm">Select approvers</Label>
                    {selectedApprovers.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {selectedApprovers.map((id) => {
                          const approver = availableApprovers.find((a) => a.id === id);
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/40 px-2 py-0.5 text-xs text-accent"
                            >
                              <span>{approver?.name}</span>
                              <span className="text-[9px] opacity-70">({approver?.role})</span>
                              <button
                                onClick={() => setSelectedApprovers((prev) => prev.filter((a) => a !== id))}
                                className="hover:text-foreground"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <div className="space-y-2 rounded-md border border-border bg-background/40 p-3 max-h-48 overflow-y-auto">
                      {availableApprovers.map((approver) => (
                        <div key={approver.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`approver-${approver.id}`}
                            checked={selectedApprovers.includes(approver.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedApprovers((prev) => [...prev, approver.id]);
                              } else {
                                setSelectedApprovers((prev) => prev.filter((a) => a !== approver.id));
                              }
                            }}
                          />
                          <label htmlFor={`approver-${approver.id}`} className="cursor-pointer text-sm flex-1">
                            <span className="font-medium">{approver.name}</span>
                            <span className="text-muted-foreground ml-1">({approver.role} · {approver.dept})</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TASK: parent (any milestone or task) + start + (end date | duration) + weight */}
          {kind === "Task" && (
            <>
              <div>
                <Label>Parent <span className="text-muted-foreground">(milestone or task — leave none for top level)</span></Label>
                <Select value={parentName} onValueChange={setParentName}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="__none__">— None (top level) —</SelectItem>
                    {parentOptions.filter((p) => p.kind === "Milestone").length > 0 && (
                      <>
                        <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">Milestones</div>
                        {parentOptions.filter((p) => p.kind === "Milestone").map((m) => (
                          <SelectItem key={`ms-${m.name}`} value={m.name}>◆ {m.name}</SelectItem>
                        ))}
                      </>
                    )}
                    {parentOptions.filter((p) => p.kind === "Task").length > 0 && (
                      <>
                        <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">Tasks</div>
                        {parentOptions.filter((p) => p.kind === "Task").map((t) => (
                          <SelectItem key={`tk-${t.name}`} value={t.name}>{t.name}</SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Start date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div>
                <Label>End</Label>
                <ToggleGroup type="single" value={endMode} onValueChange={(v) => v && setEndMode(v as "date" | "duration")} className="justify-start">
                  <ToggleGroupItem value="date" className="h-8 px-3 text-xs">End date</ToggleGroupItem>
                  <ToggleGroupItem value="duration" className="h-8 px-3 text-xs">Duration</ToggleGroupItem>
                </ToggleGroup>
                {endMode === "date" ? (
                  <Input className="mt-2" type="date" value={taskEndDate} onChange={(e) => setTaskEndDate(e.target.value)} />
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Input type="number" min="0" step="0.5" value={durationValue} onChange={(e) => setDurationValue(Number(e.target.value))} placeholder="Duration" />
                    <Select value={durationUnit} onValueChange={(v) => setDurationUnit(v as "hours" | "days")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {endMode === "duration"
                    ? "End date is calculated from start + duration."
                    : "Duration is calculated from start → end."}
                </p>
              </div>

              <div>
                <Label>Weight score (1–10)</Label>
                <Input type="number" min={1} max={10} step={1} value={weightScore} onChange={(e) => setWeightScore(Number(e.target.value))} />
                <p className="mt-1 text-[10px] text-muted-foreground">Relative weight inside its parent. Parent progress = Σ(child weight × child %) ÷ Σ(weights).</p>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div><Label>Owner</Label><Input value={owner} onChange={(e) => setOwner(e.target.value)} /></div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {kind === "Task" && (
            <div className="rounded-md border border-border p-3 space-y-2">
              <Label className="text-sm">Financial Link</Label>
              <p className="text-xs text-muted-foreground">Connect this task to a client revenue event or a working-package (contract) payment milestone.</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={payKind} onValueChange={(v) => setPayKind(v as PaymentLinkKind)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Client Revenue">Client revenue (main client)</SelectItem>
                      <SelectItem value="Package Cost">Working package cost (contract payment)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {payKind !== "None" && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Amount</Label>
                    <Input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="e.g. $120K" />
                  </div>
                )}
              </div>
              {payKind === "Package Cost" && (
                <div>
                  <Label className="text-xs text-muted-foreground">Working package</Label>
                  <Select value={payPackage} onValueChange={setPayPackage}>
                    <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                    <SelectContent>
                      {packages.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.id} · {p.scope} ({p.est})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {kind === "Task" && (
            <div className="rounded-md border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-sm">Skill required</Label>
                <span className="text-xs text-muted-foreground">One task · one assignee</span>
              </div>
              <div className="grid grid-cols-[1fr_110px_80px] gap-2 items-end">
                <div>
                  <Label className="text-xs text-muted-foreground">Skill / Role</Label>
                  <Input list="role-suggestions" value={skillRole.role} onChange={(e) => setSkillRole((d) => ({ ...d, role: e.target.value }))} placeholder="e.g. QA Engineer" />
                  <datalist id="role-suggestions">{roleSuggestions.map((r) => <option key={r} value={r} />)}</datalist>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Level</Label>
                  <Select value={skillRole.skill} onValueChange={(v) => setSkillRole((d) => ({ ...d, skill: v as RoleReq["skill"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Junior">Junior</SelectItem>
                      <SelectItem value="Mid">Mid</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">FTE</Label>
                  <Input type="number" min="0" step="0.5" value={skillRole.fte} onChange={(e) => setSkillRole((d) => ({ ...d, fte: Number(e.target.value) }))} />
                </div>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">Leave the role blank to skip the resource request. Assignee fills automatically once the request is fulfilled in Resources.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>{isEditing ? `Save ${kind}` : `Add ${kind}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// ── Log Trip dialog ───────────────────────────────────────────────────────────
function LogTripDialog({ onAdd, teamMembers }: { onAdd: (t: Omit<Trip, "id">) => void; teamMembers: string[] }) {
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState(""); const [dest, setDest] = useState("");
  const [dates, setDates] = useState(""); const [cost, setCost] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(name: string) {
    setSelected((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  }
  function submit() {
    if (!purpose.trim() || !dest.trim()) { toast.error("Purpose and destination are required"); return; }
    const travelers = selected.length > 0 ? selected.join(", ") : "—";
    onAdd({ purpose: purpose.trim(), dest: dest.trim(), dates: dates || "TBD", travelers, cost: cost || "TBD", rag: "blue", status: "Planned" });
    toast.success("Business trip logged");
    setOpen(false); setPurpose(""); setDest(""); setDates(""); setCost(""); setSelected([]);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />Log Trip</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Log Business Trip</DialogTitle></DialogHeader>
        <div className="rounded-md border border-accent/20 bg-accent-dim/30 px-3 py-2 text-xs text-accent">Status defaults to Planned</div>
        <div className="grid gap-3">
          <div><Label>Purpose</Label><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Vendor workshop" /></div>
          <div><Label>Destination</Label><Input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="e.g. Munich, DE" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Dates</Label><Input value={dates} onChange={(e) => setDates(e.target.value)} placeholder="Jul 08 – Jul 11" /></div>
            <div><Label>Est. Cost</Label><Input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="$3.0K" /></div>
          </div>
          <div>
            <Label>Travelers</Label>
            {selected.length > 0 && (
              <div className="mb-1.5 flex flex-wrap gap-1 mt-1">
                {selected.map((n) => (
                  <span key={n} className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/40 px-2 py-0.5 text-xs text-accent">
                    {n}
                    <button onClick={() => toggle(n)} className="hover:text-foreground">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="mt-1.5 space-y-2 rounded-md border border-border bg-background/40 p-3">
              {teamMembers.map((name) => (
                <div key={name} className="flex items-center gap-2">
                  <Checkbox id={`tr-${name}`} checked={selected.includes(name)} onCheckedChange={() => toggle(name)} />
                  <label htmlFor={`tr-${name}`} className="cursor-pointer text-sm text-foreground">{name}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Log Trip</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Risks & Issues tab ────────────────────────────────────────────────────────
function RisksTab({ project }: { project: typeof projects[number] }) {
  const [items, setItems] = useState<RaidItem[]>([
    { id: "R-091", title: "Vendor delivery delay > 4 weeks", kind: "Risk", score: 20, owner: project.pm, status: "Open", rag: "red" },
    { id: "I-044", title: "Test env outage", kind: "Issue", score: 12, owner: "Mei Chen", status: "In progress", rag: "amber" },
    { id: "R-085", title: "Risk: Audit finding remediation overrun", kind: "Risk", score: 16, owner: "Mei Chen", status: "Open", rag: "amber" },
  ]);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"Risk" | "Issue">("Risk");
  const [title, setTitle] = useState("");
  const [prob, setProb] = useState(3); const [impact, setImpact] = useState(3);
  const [owner, setOwner] = useState(project.pm);
  const [status, setStatus] = useState("Open");
  const score = prob * impact;
  const statusRag: Record<string, Rag> = { Open: "red", "In progress": "amber", Mitigated: "blue", Closed: "green" };

  function submit() {
    if (!title.trim()) { toast.error("Title is required"); return; }
    const prefix = kind === "Risk" ? "R" : "I";
    const num = items.filter((i) => i.kind === kind).length + 1;
    const id = `${prefix}-${String(100 + num).padStart(3, "0")}`;
    const rag: Rag = score >= 16 ? "red" : score >= 9 ? "amber" : "green";
    setItems((prev) => [...prev, { id, title: title.trim(), kind, score, owner, status, rag: statusRag[status] ?? rag }]);
    toast.success(`${kind} ${id} logged`);
    setOpen(false); setTitle(""); setProb(3); setImpact(3); setStatus("Open");
  }

  const kpis = [
    { l: "Open Risks", v: items.filter((i) => i.kind === "Risk" && i.status === "Open").length, c: "text-rag-amber" },
    { l: "Open Issues", v: items.filter((i) => i.kind === "Issue" && i.status === "Open").length, c: "text-rag-red" },
    { l: "In Progress", v: items.filter((i) => i.status === "In progress").length, c: "text-accent" },
    { l: "Closed", v: items.filter((i) => i.status === "Closed").length, c: "text-rag-green" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-accent/20 bg-accent-dim/20 px-4 py-3 text-xs text-accent">
        Project-level risks and issues. Log concerns that impact this project's timeline, budget, or scope.
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.l} className="glass-card p-4">
            <div className="label-eyebrow">{k.l}</div>
            <div className={`mt-1 text-lg font-medium num-mono ${k.c}`}>{k.v}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">Project Risks & Issues</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <AlertTriangle className="mr-1 h-4 w-4" />Log Risk / Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Log Risk / Issue</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Type</Label>
                  <Select value={kind} onValueChange={(v) => setKind(v as "Risk" | "Issue")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Risk">Risk</SelectItem>
                      <SelectItem value="Issue">Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In progress">In progress</SelectItem>
                      <SelectItem value="Mitigated">Mitigated</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Describe the risk or issue" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Probability (1–5)</Label>
                  <Select value={String(prob)} onValueChange={(v) => setProb(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Impact (1–5)</Label>
                  <Select value={String(impact)} onValueChange={(v) => setImpact(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className={`rounded-md border px-3 py-2 text-xs num-mono ${
                score >= 16 ? "border-rag-red/30 bg-rag-red/10 text-rag-red" :
                score >= 9 ? "border-rag-amber/30 bg-rag-amber/10 text-rag-amber" :
                "border-rag-green/30 bg-rag-green/10 text-rag-green"
              }`}>Risk score: {score}</div>
              <div><Label>Owner</Label><Input value={owner} onChange={(e) => setOwner(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Log {kind}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0"><TableHead>ID</TableHead><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Score</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{items.map((r) => (
            <TableRow key={r.id} className="bg-[#1D1D23] hover:bg-[#252530] border-0">
              <TableCell className="num-mono text-xs">{r.id}</TableCell>
              <TableCell className="font-medium">{r.title}</TableCell>
              <TableCell>{r.kind}</TableCell>
              <TableCell><Badge variant="outline" className="border-border bg-secondary/40 num-mono">{r.score}</Badge></TableCell>
              <TableCell>{r.owner}</TableCell>
              <TableCell><RagBadge rag={r.rag} label={r.status} /></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Status Reports tab ────────────────────────────────────────────────────────
function StatusReportsTab({
  project, reports, setReports, externalOpen, onExternalOpenChange, onRagChange,
}: {
  project: typeof projects[number];
  reports: StatusReport[];
  setReports: React.Dispatch<React.SetStateAction<StatusReport[]>>;
  externalOpen: boolean;
  onExternalOpenChange: (open: boolean) => void;
  onRagChange: (rag: Rag) => void;
}) {
  const nextWeek = Math.max(...reports.map((r) => r.week), 0) + 1;
  const [rag, setRag] = useState<Rag>("green");
  const [text, setText] = useState("");

  function submit() {
    if (!text.trim()) { toast.error("Status narrative is required"); return; }
    setReports((prev) => [{ week: nextWeek, by: project.pm, when: "Just now", rag, text: text.trim() }, ...prev]);
    onRagChange(rag);
    toast.success(`Week ${nextWeek} status report submitted`);
    onExternalOpenChange(false); setRag("green"); setText("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">{reports.length} status reports</div>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => onExternalOpenChange(true)}>
          Submit Week {nextWeek} Report
        </Button>
      </div>
      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.week} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">Week {r.week} status report</div>
                <div className="text-xs text-muted-foreground">Submitted by {r.by} · {r.when}</div>
              </div>
              <RagBadge rag={r.rag} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
          </div>
        ))}
      </div>

      <Dialog open={externalOpen} onOpenChange={onExternalOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Submit Week {nextWeek} Status Report</DialogTitle></DialogHeader>
          <div className="rounded-md border border-accent/20 bg-accent-dim/30 px-3 py-2 text-xs text-accent">
            Project: <span className="font-medium">{project.name}</span>
          </div>
          <div className="grid gap-3">
            <div>
              <Label>Overall RAG status</Label>
              <Select value={rag} onValueChange={(v) => setRag(v as Rag)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">On Track</SelectItem>
                  <SelectItem value="amber">At Risk</SelectItem>
                  <SelectItem value="red">Off-Track</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Status narrative</Label><Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="What happened this week, blockers, next steps…" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onExternalOpenChange(false)}>Cancel</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Submit Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Procurement (project) tab ─────────────────────────────────────────────────
function ProcurementProjectTab({ projectName, addRfp }: { projectName: string; addRfp: (r: RfpEntry) => void }) {
  const contracts = [
    { id: "CT-2026-038", vendor: "Oracle Consulting", value: "$680K", end: "Dec 12", rag: "green" as Rag, status: "Active" },
    { id: "CT-2026-029", vendor: "Cyberguard", value: "$140K", end: "Sep 30", rag: "green" as Rag, status: "Active" },
    { id: "CT-2026-031", vendor: "LearnSphere", value: "$95K", end: "Aug 25", rag: "amber" as Rag, status: "Expiring" },
  ];
  const rfps = [
    { id: "RFP-014", title: "Robotics Integration Partner", type: "RFP", due: "Jun 28", bidders: 4, rag: "amber" as Rag, status: "Open" },
    { id: "RFP-016", title: "Training services rollout", type: "RFP", due: "Jul 12", bidders: 2, rag: "amber" as Rag, status: "Open" },
  ];

  const [packages, setPackages] = useState<TenderPackage[]>(SEED_PACKAGES);
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [newPkgOpen, setNewPkgOpen] = useState(false);
  const [newScope, setNewScope] = useState("");
  const [newEst, setNewEst] = useState("");
  const [newVendors, setNewVendors] = useState<string[]>([]);

  function handleNewPackage() {
    if (!newScope.trim()) { toast.error("Please enter a package scope"); return; }
    const id = `PKG-${String(packages.length + 1).padStart(3, "0")}`;
    setPackages(prev => [...prev, { id, scope: newScope.trim(), est: newEst.trim() || "TBD", status: "Draft" }]);
    toast.success("Tender request created", { description: `${id} saved as Draft` });
    setNewPkgOpen(false); setNewScope(""); setNewEst(""); setNewVendors([]);
  }

  function sendForTendering(pkgId: string) {
    const pkg = packages.find(p => p.id === pkgId);
    if (!pkg) return;
    const rfpNum = 17 + packages.filter(p => p.rfp).length;
    const rfpId = `RFP-0${rfpNum}`;
    setPackages(prev => prev.map(p => p.id === pkgId
      ? { ...p, status: "Sent for Tendering", rfp: rfpId, issued: "Today", closes: "30 days" }
      : p
    ));
    addRfp({ id: rfpId, title: pkg.scope, type: "RFP", status: "Open", bidders: 0, due: "30 days", project: projectName });
    toast.success("RFP created in Procurement", { description: `${rfpId} published — vendors can submit proposals` });
  }

  function approveProposal(pkgId: string, proposal: TenderProposal) {
    const contractNum = 38 + packages.filter(p => p.contract).length;
    const contractId = `CT-2026-0${contractNum}`;
    setPackages(prev => prev.map(p => p.id === pkgId
      ? { ...p, status: "Awarded", vendor: proposal.vendor, contract: contractId, awarded: "Today", est: proposal.value, proposals: undefined }
      : p
    ));
    toast.success(`Package awarded to ${proposal.vendor}`, { description: `Contract ${contractId} created automatically` });
    setExpandedPkg(null);
  }

  function rejectProposal(pkgId: string, vendorName: string) {
    setPackages(prev => prev.map(p => p.id === pkgId
      ? { ...p, proposals: p.proposals?.filter(pr => pr.vendor !== vendorName) }
      : p
    ));
    toast.info(`Proposal from ${vendorName} rejected`);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { l: "Active Contracts", v: String(contracts.filter((c) => c.status === "Active").length), c: "text-rag-green" },
          { l: "Open RFPs", v: String(rfps.length), c: "text-rag-amber" },
          { l: "Tender Packages", v: String(packages.length), c: "text-accent" },
          { l: "Total Committed", v: "$915K", c: "text-foreground" },
        ].map((k) => (
          <div key={k.l} className="glass-card p-4">
            <div className="label-eyebrow">{k.l}</div>
            <div className={`mt-1 text-lg font-medium num-mono ${k.c}`}>{k.v}</div>
          </div>
        ))}
      </div>

      <div className="">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="label-eyebrow">Tender Packages</div>
          <Dialog open={newPkgOpen} onOpenChange={setNewPkgOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">+ New Request</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>New Tender Request</DialogTitle></DialogHeader>
              <div className="rounded-md border border-accent/20 bg-accent-dim/30 px-3 py-2 text-xs text-accent">
                Project: <span className="font-medium">{projectName}</span>
                <span className="ml-2 text-muted-foreground">· Saved as Draft until sent for tendering</span>
              </div>
              <div className="grid gap-3">
                <div>
                  <Label>Package scope</Label>
                  <Input placeholder="e.g. Security audit & pen-testing" value={newScope} onChange={e => setNewScope(e.target.value)} />
                </div>
                <div>
                  <Label>Estimated value</Label>
                  <Input placeholder="e.g. $150K" value={newEst} onChange={e => setNewEst(e.target.value)} />
                </div>
                <div>
                  <Label>Recommended Vendors</Label>
                  <div className="mt-1.5 space-y-2 rounded-md border border-border bg-background/40 p-3">
                    {vendorList.map((v) => (
                      <div key={v.name} className="flex items-center gap-2">
                        <Checkbox
                          id={`nv-${v.name}`}
                          checked={newVendors.includes(v.name)}
                          onCheckedChange={(checked) =>
                            setNewVendors((prev) => checked ? [...prev, v.name] : prev.filter((n) => n !== v.name))
                          }
                        />
                        <label htmlFor={`nv-${v.name}`} className="cursor-pointer text-sm text-foreground">
                          {v.name}
                          <span className="ml-1.5 text-xs text-muted-foreground">({v.category})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewPkgOpen(false)}>Cancel</Button>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleNewPackage}>Create Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-transparent border-0">
              <TableHead>Package</TableHead><TableHead>Scope</TableHead><TableHead>Est. Value</TableHead>
              <TableHead>RFP</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <Fragment key={pkg.id}>
                <TableRow className="bg-[#1D1D23] hover:bg-[#252530] border-0">
                  <TableCell className="font-medium text-foreground">{pkg.id}</TableCell>
                  <TableCell>{pkg.scope}</TableCell>
                  <TableCell className="num-mono">{pkg.est}</TableCell>
                  <TableCell className="num-mono text-xs text-muted-foreground">{pkg.rfp ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border ${
                      pkg.status === "Draft" ? "bg-secondary/40 text-muted-foreground border-border" :
                      pkg.status === "Sent for Tendering" ? "bg-rag-amber/10 text-rag-amber border-rag-amber/30" :
                      pkg.status === "Proposals Received" ? "bg-accent/10 text-accent border-accent/30" :
                      pkg.status === "Awarded" ? "bg-rag-green/10 text-rag-green border-rag-green/30" :
                      "bg-secondary/40 text-muted-foreground border-border"
                    }`}>{pkg.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {pkg.status === "Draft" && (
                      <Button size="sm" variant="outline" className="border-accent/40 text-accent hover:bg-accent-dim h-7 text-xs"
                        onClick={() => sendForTendering(pkg.id)}>
                        <Send className="mr-1.5 h-3 w-3" />Send for Tendering
                      </Button>
                    )}
                    {pkg.status === "Sent for Tendering" && (
                      <span className="text-xs text-muted-foreground">Closes {pkg.closes}</span>
                    )}
                    {pkg.status === "Proposals Received" && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-accent hover:bg-accent-dim"
                        onClick={() => setExpandedPkg(expandedPkg === pkg.id ? null : pkg.id)}>
                        {expandedPkg === pkg.id ? <ChevronDown className="mr-1 h-3 w-3" /> : <ChevronRight className="mr-1 h-3 w-3" />}
                        {pkg.proposals?.length} proposal{pkg.proposals?.length !== 1 ? "s" : ""}
                      </Button>
                    )}
                    {pkg.status === "Awarded" && (
                      <div className="text-xs">
                        <span className="font-medium text-foreground">{pkg.vendor}</span>
                        <span className="ml-2 num-mono text-muted-foreground">{pkg.contract}</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                {pkg.status === "Proposals Received" && expandedPkg === pkg.id && pkg.proposals?.map((pr) => (
                  <TableRow key={`${pkg.id}-${pr.vendor}`} className="bg-secondary/20 border-l-2 border-l-accent/30">
                    <TableCell />
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        <span className="text-sm font-medium text-foreground">{pr.vendor}</span>
                        <span className="num-mono text-xs text-muted-foreground">{pr.value}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary/60">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${pr.score}%` }} />
                        </div>
                        <span className="num-mono text-xs text-muted-foreground">{pr.score}/100</span>
                      </div>
                    </TableCell>
                    <TableCell /><TableCell />
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 border border-rag-green/30 bg-rag-green/10 text-rag-green hover:bg-rag-green/20 text-xs"
                          onClick={() => approveProposal(pkg.id, pr)}>
                          <CheckCircle2 className="mr-1 h-3 w-3" />Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-rag-red"
                          onClick={() => rejectProposal(pkg.id, pr.vendor)}>
                          <XCircle className="mr-1 h-3 w-3" />Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="label-eyebrow">Contracts</div>
          <Link to="/procurement" className="text-xs text-accent hover:underline">Open Procurement module →</Link>
        </div>
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0"><TableHead>Contract</TableHead><TableHead>Vendor</TableHead><TableHead>Value</TableHead><TableHead>End</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{contracts.map((c) => (
            <TableRow key={c.id} className="bg-[#1D1D23] hover:bg-[#252530] border-0">
              <TableCell className="num-mono text-xs text-accent">{c.id}</TableCell>
              <TableCell>{c.vendor}</TableCell>
              <TableCell className="num-mono">{c.value}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{c.end}</TableCell>
              <TableCell><RagBadge rag={c.rag} label={c.status} /></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>

      <div className="">
        <div className="px-4 py-3 border-b border-border label-eyebrow">Open RFPs</div>
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0"><TableHead>RFP</TableHead><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Due</TableHead><TableHead>Bidders</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{rfps.map((r) => (
            <TableRow key={r.id} className="bg-[#1D1D23] hover:bg-[#252530] border-0">
              <TableCell className="num-mono text-xs text-accent">{r.id}</TableCell>
              <TableCell>{r.title}</TableCell>
              <TableCell>{r.type}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{r.due}</TableCell>
              <TableCell className="num-mono">{r.bidders}</TableCell>
              <TableCell><RagBadge rag={r.rag} label={r.status} /></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Stakeholders tab ──────────────────────────────────────────────────────────
function StakeholdersTab() {
  const [items, setItems] = useState<Stakeholder[]>([
    { name: "V. Mansour", org: "Exec Sponsor", influence: "High", interest: "High", strategy: "Manage closely" },
    { name: "R. Hadid", org: "Client (ACME)", influence: "High", interest: "Medium", strategy: "Keep satisfied" },
    { name: "IT Steering", org: "Internal", influence: "Medium", interest: "High", strategy: "Keep informed" },
    { name: "Finance Board", org: "Internal", influence: "High", interest: "Low", strategy: "Inform monthly" },
  ]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [org, setOrg] = useState("");
  const [influence, setInfluence] = useState<"High" | "Medium" | "Low">("Medium");
  const [interest, setInterest] = useState<"High" | "Medium" | "Low">("Medium");
  const [strategy, setStrategy] = useState("");

  function submit() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setItems((prev) => [...prev, { name: name.trim(), org: org || "—", influence, interest, strategy: strategy || "—" }]);
    toast.success("Stakeholder added");
    setOpen(false); setName(""); setOrg(""); setStrategy("");
  }

  const colorFor = (level: "High" | "Medium" | "Low") =>
    level === "High" ? "text-rag-red" : level === "Medium" ? "text-rag-amber" : "text-muted-foreground";

  const quadrants = [
    { key: "hi-hi", label: "Manage closely", tint: "bg-rag-red/10 border-rag-red/30", text: "text-rag-red", filter: (s: Stakeholder) => s.influence === "High" && s.interest === "High" },
    { key: "hi-lo", label: "Keep satisfied", tint: "bg-rag-amber/10 border-rag-amber/30", text: "text-rag-amber", filter: (s: Stakeholder) => s.influence === "High" && s.interest !== "High" },
    { key: "lo-hi", label: "Keep informed", tint: "bg-accent/10 border-accent/30", text: "text-accent", filter: (s: Stakeholder) => s.influence !== "High" && s.interest === "High" },
    { key: "lo-lo", label: "Monitor", tint: "bg-secondary/40 border-border", text: "text-muted-foreground", filter: (s: Stakeholder) => s.influence !== "High" && s.interest !== "High" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">Stakeholder matrix · {items.length} stakeholders</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><UserPlus className="mr-1 h-4 w-4" />Add Stakeholder</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Stakeholder</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Organisation</Label><Input value={org} onChange={(e) => setOrg(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Influence</Label>
                  <Select value={influence} onValueChange={(v) => setInfluence(v as "High" | "Medium" | "Low")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Interest</Label>
                  <Select value={interest} onValueChange={(v) => setInterest(v as "High" | "Medium" | "Low")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Engagement strategy</Label><Input value={strategy} onChange={(e) => setStrategy(e.target.value)} placeholder="e.g. Weekly 1:1" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Add Stakeholder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0"><TableHead>Name</TableHead><TableHead>Org</TableHead><TableHead>Influence</TableHead><TableHead>Interest</TableHead><TableHead>Strategy</TableHead></TableRow></TableHeader>
          <TableBody>{items.map((s) => (
            <TableRow key={s.name} className="bg-[#1D1D23] hover:bg-[#252530] border-0">
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>{s.org}</TableCell>
              <TableCell className={colorFor(s.influence)}>{s.influence}</TableCell>
              <TableCell className={colorFor(s.interest)}>{s.interest}</TableCell>
              <TableCell className="text-xs">{s.strategy}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>

      {/* 2×2 engagement matrix */}
      <div className="glass-card p-5">
        <div className="label-eyebrow mb-3">Engagement matrix</div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border">
          {quadrants.map((q) => (
            <div key={q.key} className={`${q.tint} border p-4 min-h-32`}>
              <div className={`text-xs font-medium ${q.text}`}>{q.label}</div>
              <ul className="mt-2 space-y-1 text-sm text-foreground">
                {items.filter(q.filter).map((s) => (<li key={s.name}>{s.name}</li>))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {quadrants.map((q) => (
            <span key={q.key} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${q.tint.split(" ")[0].replace("/10", "")}`} />{q.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Add Cost Entry dialog ─────────────────────────────────────────────────────
const COST_COLORS: Record<string, string> = {
  Labour: "bg-rag-green", Hardware: "bg-rag-blue", Software: "bg-accent",
  "Business trips": "bg-rag-amber", Contingency: "bg-muted-foreground", Other: "bg-rag-red",
};
function AddCostDialog({ onAdd }: { onAdd: (e: CostEntry) => void }) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState("");
  const [budget, setBudget] = useState("");
  const [actual, setActual] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<"internal" | "third-party">("internal");
  const [capex, setCapex] = useState<"capex" | "opex">("opex");
  const [linkType, setLinkType] = useState<"fixed" | "milestone">("fixed");
  const [linkDate, setLinkDate] = useState("");

  function submit() {
    if (!cat.trim() || !budget) { toast.error("Category and budget are required"); return; }
    const b = parseFloat(budget); const a = parseFloat(actual || "0");
    if (isNaN(b)) { toast.error("Budget must be a number"); return; }
    onAdd({ c: cat.trim(), b, a: isNaN(a) ? 0 : a, color: COST_COLORS[cat] ?? "bg-muted-foreground" });
    toast.success("Cost entry added");
    setOpen(false);
    setCat(""); setBudget(""); setActual(""); setDesc(""); setType("internal"); setCapex("opex"); setLinkType("fixed"); setLinkDate("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 border-accent/40 text-accent hover:bg-accent-dim text-xs">
          <Plus className="mr-1 h-3.5 w-3.5" />Add Cost
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Cost Entry</DialogTitle>
          <DialogDescription>Enter detailed cost information with breakdown and classification.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Category</Label>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger><SelectValue placeholder="Select category…" /></SelectTrigger>
              <SelectContent>
                {["Staff", "Services", "Insurance", "Business Trips", "Contracts", "Other"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. Senior developer contract" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Budget ($M)</Label><Input type="number" min={0} step={0.01} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0.50" /></div>
            <div><Label>Actual ($M)</Label><Input type="number" min={0} step={0.01} value={actual} onChange={(e) => setActual(e.target.value)} placeholder="0.00" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="third-party">Third-party</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Classification</Label>
              <Select value={capex} onValueChange={(v) => setCapex(v as typeof capex)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="capex">CapEx</SelectItem>
                  <SelectItem value="opex">OpEx</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Link to</Label>
            <Select value={linkType} onValueChange={(v) => setLinkType(v as typeof linkType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed Date</SelectItem>
                <SelectItem value="milestone">Milestone (Dynamic)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {linkType === "fixed" && (
            <div><Label>Due Date</Label><Input type="date" value={linkDate} onChange={(e) => setLinkDate(e.target.value)} /></div>
          )}
          {linkType === "milestone" && (
            <div><Label>Milestone Name</Label><Input value={linkDate} onChange={(e) => setLinkDate(e.target.value)} placeholder="e.g. Design Approved" /></div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Add Entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Revenue Event dialog ──────────────────────────────────────────────────
function AddRevenueDialog({ onAdd }: { onAdd: (e: RevEntry) => void }) {
  const [open, setOpen] = useState(false);
  const [ms, setMs] = useState(""); const [evt, setEvt] = useState("");
  const [plan, setPlan] = useState(""); const [date, setDate] = useState("");
  function submit() {
    if (!ms.trim() || !plan) { toast.error("Milestone and planned amount are required"); return; }
    const p = parseFloat(plan);
    if (isNaN(p)) { toast.error("Planned amount must be a number"); return; }
    onAdd({ ms: ms.trim(), evt: evt || "—", plan: p, date: date || "TBD", s: "blue", sl: "Planned", act: null });
    toast.success("Revenue event added");
    setOpen(false); setMs(""); setEvt(""); setPlan(""); setDate("");
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 border-accent/40 text-accent hover:bg-accent-dim text-xs">
          <Plus className="mr-1 h-3.5 w-3.5" />Add Revenue Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Revenue Event</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Linked milestone</Label><Input value={ms} onChange={(e) => setMs(e.target.value)} placeholder="e.g. Phase 2 sign-off" /></div>
          <div><Label>Revenue event</Label><Input value={evt} onChange={(e) => setEvt(e.target.value)} placeholder="e.g. Progress invoice (15%)" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Planned ($M)</Label><Input type="number" min={0} step={0.01} value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="0.50" /></div>
            <div><Label>Expected date</Label><Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="Oct 30" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Add Event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Stage Gates dialog ────────────────────────────────────────────────────────
const GATE_ROLES = ["Project Manager", "Tech Lead", "Finance Manager", "Resource Manager", "Procurement Lead", "Executive Sponsor"];
function StageGatesDialog({
  open, onOpenChange, gateData, setGateData,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  gateData: GateStage[];
  setGateData: React.Dispatch<React.SetStateAction<GateStage[]>>;
}) {
  const [activeStage, setActiveStage] = useState(0);
  const [newTask, setNewTask] = useState("");
  const [newRole, setNewRole] = useState("Project Manager");

  function toggleDone(stageIdx: number, itemIdx: number) {
    setGateData((prev) =>
      prev.map((s, si) => si !== stageIdx ? s : {
        ...s,
        items: s.items.map((it, ii) => ii !== itemIdx ? it : { ...it, done: !it.done }),
      })
    );
  }

  function changeRole(stageIdx: number, itemIdx: number, role: string) {
    setGateData((prev) =>
      prev.map((s, si) => si !== stageIdx ? s : {
        ...s,
        items: s.items.map((it, ii) => ii !== itemIdx ? it : { ...it, role }),
      })
    );
  }

  function addItem() {
    if (!newTask.trim()) return;
    setGateData((prev) =>
      prev.map((s, si) => si !== activeStage ? s : {
        ...s,
        items: [...s.items, { task: newTask.trim(), role: newRole, done: false }],
      })
    );
    toast.success("Checklist item added");
    setNewTask("");
  }

  const stage = gateData[activeStage];
  const doneCount = stage?.items.filter((i) => i.done).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Stage Gate Checklists</DialogTitle></DialogHeader>

        {/* Stage tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-border pb-2">
          {gateData.map((s, i) => {
            const done = s.items.filter((x) => x.done).length;
            const total = s.items.length;
            return (
              <button
                key={s.name}
                onClick={() => setActiveStage(i)}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                  i === activeStage
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary/60"
                }`}
              >
                {s.name}
                <span className={`num-mono rounded-full px-1.5 py-0.5 text-[10px] ${
                  done === total ? "bg-rag-green/20 text-rag-green" : "bg-secondary/60"
                }`}>{done}/{total}</span>
              </button>
            );
          })}
        </div>

        {/* Checklist */}
        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {stage?.items.map((item, ii) => (
            <div key={ii} className="flex items-center gap-3 rounded-md border border-border/60 bg-secondary/20 px-3 py-2">
              <Checkbox
                checked={item.done}
                onCheckedChange={() => toggleDone(activeStage, ii)}
                className="shrink-0"
              />
              <span className={`flex-1 text-sm ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {item.task}
              </span>
              <Select value={item.role} onValueChange={(r) => changeRole(activeStage, ii, r)}>
                <SelectTrigger className="h-7 w-[160px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GATE_ROLES.map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{stage?.name} progress</span>
            <span className="num-mono">{doneCount}/{stage?.items.length ?? 0}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: stage?.items.length ? `${(doneCount / stage.items.length) * 100}%` : "0%" }}
            />
          </div>
        </div>

        {/* Add new item */}
        <div className="flex gap-2 border-t border-border pt-3">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add checklist item…"
            className="flex-1 h-8 text-sm"
            onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
          />
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger className="h-8 w-[148px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GATE_ROLES.map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 bg-accent text-accent-foreground hover:bg-accent/90" onClick={addItem}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Lessons Learned tab ───────────────────────────────────────────────────────
const LESSON_CATS = ["What Went Well", "Challenges", "Recommendations", "Process", "People", "Tech", "Governance", "Risk", "Communication", "Planning"] as const;
type LessonCat = typeof LESSON_CATS[number];

const LESSON_CAT_STYLE: Record<string, string> = {
  "What Went Well":  "border-rag-green/40 bg-rag-green/10 text-rag-green",
  "Challenges":      "border-rag-red/40 bg-rag-red/10 text-rag-red",
  "Recommendations": "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
};

function LessonsTab({ project }: { project: typeof projects[number] }) {
  const [items, setItems] = useState<Lesson[]>([
    { tag: "What Went Well", text: "Early stakeholder alignment on scope prevented scope creep.", by: project.pm, when: "May 20" },
    { tag: "Challenges", text: "Vendor delivery delay on Oracle ERP — impacted integration milestone by 2 weeks.", by: "Mei Chen", when: "May 18" },
    { tag: "Recommendations", text: "Run UAT in parallel with integration build on future projects — saves 1 sprint.", by: "Priya Iyer", when: "May 15" },
    { tag: "Process", text: "Earlier vendor SLA reviews surface delays sooner.", by: project.pm, when: "May 14" },
    { tag: "People", text: "Pair architect with junior dev for knowledge transfer.", by: "Mei Chen", when: "May 11" },
    { tag: "Governance", text: "Bi-weekly steering tempo too slow for critical phase.", by: project.pm, when: "May 09" },
  ]);
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState<LessonCat>("What Went Well");
  const [text, setText] = useState("");
  const [filterCat, setFilterCat] = useState<LessonCat | "All">("All");

  function submit() {
    if (!text.trim()) { toast.error("Lesson text is required"); return; }
    setItems((prev) => [{ tag, text: text.trim(), by: project.pm, when: "Just now" }, ...prev]);
    toast.success("Lesson recorded");
    setOpen(false); setText(""); setTag("What Went Well");
  }

  const displayed = filterCat === "All" ? items : items.filter((l) => l.tag === filterCat);

  const grouped = [
    { label: "What Went Well", items: displayed.filter((l) => l.tag === "What Went Well") },
    { label: "Challenges",     items: displayed.filter((l) => l.tag === "Challenges") },
    { label: "Recommendations",items: displayed.filter((l) => l.tag === "Recommendations") },
    { label: "Other",          items: displayed.filter((l) => !["What Went Well","Challenges","Recommendations"].includes(l.tag)) },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">{items.length} lessons recorded</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />Add Lesson</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Lesson Learned</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Category</Label>
                <Select value={tag} onValueChange={(v) => setTag(v as LessonCat)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LESSON_CATS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {tag === "What Went Well" ? "What worked? What would you repeat?" :
                   tag === "Challenges"     ? "What was difficult or went wrong?" :
                   tag === "Recommendations"? "What should future projects do differently?" :
                   "Lesson"}
                </Label>
                <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)}
                  placeholder={
                    tag === "What Went Well" ? "e.g. Early stakeholder buy-in avoided scope disputes later…" :
                    tag === "Challenges"     ? "e.g. Vendor SLA breach caused 2-week delay on milestone 3…" :
                    tag === "Recommendations"? "e.g. Run UAT in parallel with integration build to save 1 sprint…" :
                    "What did we learn?"
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Add Lesson</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {(["All", "What Went Well", "Challenges", "Recommendations", "Process", "People", "Tech", "Governance"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c as LessonCat | "All")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filterCat === c
                ? c === "What Went Well"  ? "border-rag-green/50 bg-rag-green/15 text-rag-green"
                : c === "Challenges"      ? "border-rag-red/50 bg-rag-red/15 text-rag-red"
                : c === "Recommendations" ? "border-rag-amber/50 bg-rag-amber/15 text-rag-amber"
                : "border-accent/40 bg-accent-dim text-accent"
                : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            {c} {c !== "All" && <span className="ml-1 opacity-60">{items.filter((l) => l.tag === c).length}</span>}
          </button>
        ))}
      </div>

      {/* Grouped display */}
      {filterCat === "All" ? (
        <div className="space-y-5">
          {grouped.map((g) => (
            <div key={g.label}>
              <div className={`mb-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${LESSON_CAT_STYLE[g.label] ?? "border-border bg-secondary/30 text-muted-foreground"}`}>
                {g.label === "What Went Well" ? "✓" : g.label === "Challenges" ? "⚠" : g.label === "Recommendations" ? "→" : "·"} {g.label}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {g.items.map((l, i) => (
                  <div key={i} className="glass-card p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-[10px] ${LESSON_CAT_STYLE[l.tag] ?? "border-accent/40 bg-accent-dim text-accent"}`}>{l.tag}</Badge>
                      <span className="text-xs text-muted-foreground">{l.when}</span>
                    </div>
                    <p className="mt-2 text-foreground">{l.text}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" /> by {l.by}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {displayed.map((l, i) => (
            <div key={i} className="glass-card p-4 text-sm">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`text-[10px] ${LESSON_CAT_STYLE[l.tag] ?? "border-accent/40 bg-accent-dim text-accent"}`}>{l.tag}</Badge>
                <span className="text-xs text-muted-foreground">{l.when}</span>
              </div>
              <p className="mt-2 text-foreground">{l.text}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" /> by {l.by}
              </div>
            </div>
          ))}
          {displayed.length === 0 && (
            <div className="col-span-2 glass-card p-8 text-center text-sm text-muted-foreground">
              No {filterCat} lessons recorded yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VersionCompareDialog({
  open, onOpenChange, fromLabel, toLabel, fromSnapshot, toSnapshot,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fromLabel: string;
  toLabel: string;
  fromSnapshot?: Milestone[];
  toSnapshot: Milestone[];
}) {
  const grouped = useMemo(() => {
    const out = new Map<string, Array<{ field: string; oldValue: string; newValue: string }>>();
    if (!fromSnapshot) return Array.from(out.entries());
    const baseByName = new Map(fromSnapshot.map((m) => [m.name, m]));
    const curByName = new Map(toSnapshot.map((m) => [m.name, m]));
    const fmt = (v: any): string => {
      if (v == null || v === "") return "—";
      if (Array.isArray(v)) return v.length === 0 ? "—" : v.map((x: any) => x.name ?? x.role ?? String(x)).join(", ");
      if (typeof v === "boolean") return v ? "Yes" : "No";
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    };
    const fields: Array<{ key: keyof Milestone; label: string }> = [
      { key: "startDate", label: "Start Date" },
      { key: "endDate", label: "End Date" },
      { key: "owner", label: "Owner" },
      { key: "assignee", label: "Assignee" },
      { key: "dep", label: "Depends On" },
      { key: "rag", label: "RAG" },
      { key: "progress", label: "Progress" },
      { key: "weightScore", label: "Weight" },
      { key: "requiresApproval", label: "Requires Approval" },
    ];
    const push = (item: string, field: string, oldV: string, newV: string) => {
      if (!out.has(item)) out.set(item, []);
      out.get(item)!.push({ field, oldValue: oldV, newValue: newV });
    };
    for (const cur of toSnapshot) {
      const base = baseByName.get(cur.name);
      if (!base) { push(cur.name, "Item", "—", "Added"); continue; }
      for (const f of fields) {
        const o = (base as any)[f.key];
        const n = (cur as any)[f.key];
        if (JSON.stringify(o ?? null) !== JSON.stringify(n ?? null)) {
          push(cur.name, f.label, fmt(o), fmt(n));
        }
      }
    }
    for (const base of fromSnapshot) if (!curByName.has(base.name)) push(base.name, "Item", "Existed", "Removed");
    return Array.from(out.entries());
  }, [fromSnapshot, toSnapshot]);
  const total = grouped.reduce((s, [, l]) => s + l.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Compare {fromLabel} → {toLabel}
            {total > 0 && (
              <Badge variant="outline" className="ml-2 border-rag-amber/40 bg-rag-amber/10 text-rag-amber text-[10px]">
                {total} change{total === 1 ? "" : "s"} · {grouped.length} item{grouped.length === 1 ? "" : "s"}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Read-only diff between the selected version and the current plan.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-md border border-border/50 bg-secondary/20 p-3">
          {total === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No differences between these versions.</div>
          ) : (
            grouped.map(([item, list]) => <GroupedChangeItem key={item} item={item} changes={list} />)
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Change Request Dialog ───────────────────────────────────────────────────────
interface ChangeRequest {
  id: string;
  summary: string;
  changes: Array<{ field: string; oldValue: string; newValue: string }>;
  reason: string;
  submittedBy: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: string;
  approvalReason?: string;
  rejectionReason?: string;
  rejectedAt?: string;
}

function ChangeRequestDialog({
  open,
  onOpenChange,
  baselineSnapshot,
  currentMilestones,
  baselineVersion,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  baselineSnapshot?: Milestone[];
  currentMilestones: Milestone[];
  baselineVersion: number;
  onSubmit: (cr: ChangeRequest) => void;
}) {
  const changes = useMemo(() => {
    const out: Array<{ item: string; field: string; oldValue: string; newValue: string }> = [];
    if (!baselineSnapshot) return out;
    const baseByName = new Map(baselineSnapshot.map((m) => [m.name, m]));
    const curByName = new Map(currentMilestones.map((m) => [m.name, m]));
    const fmt = (key: keyof Milestone, v: any): string => {
      if (v == null || v === "") return "—";
      if (key === "roles" && Array.isArray(v)) {
        return v.length === 0 ? "—" : v.map((r: any) => `${r.role ?? r.name ?? ""}${r.skill ? ` (${r.skill})` : ""}${r.fte ? ` × ${r.fte}` : ""}`).join(", ");
      }
      if (key === "approvers" && Array.isArray(v)) {
        return v.length === 0 ? "—" : v.map((a: any) => a.name).join(", ");
      }
      if (key === "payment" && typeof v === "object") {
        return `${v.kind ?? ""}${v.amount ? ` ${v.amount}` : ""}`.trim() || "—";
      }
      if (typeof v === "boolean") return v ? "Yes" : "No";
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    };
    const trackedFields: Array<{ key: keyof Milestone; label: string }> = [
      { key: "name", label: "Name" },
      { key: "kind", label: "Kind" },
      { key: "startDate", label: "Start Date" },
      { key: "endDate", label: "End Date" },
      { key: "owner", label: "Owner" },
      { key: "assignee", label: "Assignee" },
      { key: "dep", label: "Depends On" },
      { key: "rag", label: "RAG" },
      { key: "milestoneType", label: "Milestone Type" },
      { key: "lagDays", label: "Lag Days" },
      { key: "durationValue", label: "Duration" },
      { key: "durationUnit", label: "Duration Unit" },
      { key: "isParallel", label: "Parallel Task" },
      { key: "weightScore", label: "Weight" },
      { key: "parent", label: "Parent" },
      { key: "requiresApproval", label: "Requires Approval" },
      { key: "roles", label: "Roles" },
      { key: "approvers", label: "Approvers" },
      { key: "payment", label: "Payment" },
    ];
    for (const cur of currentMilestones) {
      const base = baseByName.get(cur.name);
      if (!base) {
        out.push({ item: cur.name, field: "Item", oldValue: "—", newValue: "Added" });
        continue;
      }
      for (const f of trackedFields) {
        const o = (base as any)[f.key];
        const n = (cur as any)[f.key];
        if (JSON.stringify(o ?? null) !== JSON.stringify(n ?? null)) {
          out.push({ item: cur.name, field: f.label, oldValue: fmt(f.key, o), newValue: fmt(f.key, n) });
        }
      }
    }
    for (const base of baselineSnapshot) {
      if (!curByName.has(base.name)) {
        out.push({ item: base.name, field: "Item", oldValue: "Existed", newValue: "Removed" });
      }
    }
    return out;
  }, [baselineSnapshot, currentMilestones]);

  function handleSubmit() {
    if (changes.length === 0) {
      toast.error("No changes detected — edit the schedule first");
      return;
    }
    const crId = `CR-${String(Date.now()).slice(-6)}`;
    const cr: ChangeRequest = {
      id: crId,
      summary: `${changes.length} change${changes.length === 1 ? "" : "s"} to schedule`,
      changes: changes.map((c) => ({ field: `${c.item} · ${c.field}`, oldValue: c.oldValue, newValue: c.newValue })),
      reason: "—",
      submittedBy: "Current User",
      createdAt: new Date().toISOString().split("T")[0],
      status: "pending",
    };
    onSubmit(cr);
  }

  const grouped = useMemo(() => {
    const m = new Map<string, Array<{ field: string; oldValue: string; newValue: string }>>();
    for (const c of changes) {
      if (!m.has(c.item)) m.set(c.item, []);
      m.get(c.item)!.push({ field: c.field, oldValue: c.oldValue, newValue: c.newValue });
    }
    return Array.from(m.entries());
  }, [changes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Review Change Request (v{baselineVersion + 1})
            {changes.length > 0 && (
              <Badge variant="outline" className="ml-2 border-rag-amber/40 bg-rag-amber/10 text-rag-amber text-[10px]">
                {changes.length} change{changes.length === 1 ? "" : "s"} · {grouped.length} item{grouped.length === 1 ? "" : "s"}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Summary of edits vs Current Version (v{baselineVersion}). Confirm to send for approval.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-md border border-border/50 bg-secondary/20 p-3">
          {changes.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No changes detected. Edit the schedule first.
            </div>
          ) : (
            grouped.map(([item, list]) => (
              <GroupedChangeItem key={item} item={item} changes={list} />
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleSubmit}
            disabled={changes.length === 0}
          >
            Submit Change Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GroupedChangeItem({
  item,
  changes,
}: {
  item: string;
  changes: Array<{ field: string; oldValue: string; newValue: string }>;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded border border-border/40 bg-background/40 p-3 text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2"
      >
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {item}
        </span>
        <Badge variant="outline" className="border-border/60 bg-secondary/40 text-[10px] text-muted-foreground">
          {changes.length} change{changes.length === 1 ? "" : "s"}
        </Badge>
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 pl-5">
          {changes.map((c, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">· {c.field}:</span>
              <span className="rounded bg-rag-red/10 px-1.5 py-0.5 text-rag-red line-through">{c.oldValue}</span>
              <span className="text-muted-foreground">→</span>
              <span className="rounded bg-rag-green/10 px-1.5 py-0.5 text-rag-green">{c.newValue}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChangeRequestApprovalDialog({
  open,
  onOpenChange,
  changeRequest,
  onApprove,
  onReject,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  changeRequest?: ChangeRequest;
  onApprove: (reason: string) => void;
  onReject: (reason: string) => void;
}) {
  const [approvalReason, setApprovalReason] = useState("");
  const [mode, setMode] = useState<"review" | "approve" | "reject">("review");

  function handleApprove() {
    if (!approvalReason.trim()) {
      toast.error("Approval reason is required");
      return;
    }
    onApprove(approvalReason);
    setApprovalReason("");
    setMode("review");
  }

  function handleReject() {
    if (!approvalReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    onReject(approvalReason);
    setApprovalReason("");
    setMode("review");
  }

  if (!changeRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{changeRequest.id} · Approval Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-border/50 bg-secondary/20 p-3">
            <div className="font-medium text-foreground">{changeRequest.summary}</div>
            <div className="mt-2 text-xs text-muted-foreground">{changeRequest.reason}</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Changes Proposed:</div>
            {changeRequest.changes.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded border border-border/30 bg-background/30 p-2 text-xs">
                <span className="text-muted-foreground">{c.field}</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-muted-foreground">{c.oldValue}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-accent">{c.newValue}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            Submitted by {changeRequest.submittedBy} on {changeRequest.createdAt}
          </div>

          {mode === "review" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-rag-green text-white hover:bg-rag-green/90"
                onClick={() => setMode("approve")}
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-rag-red/40 text-rag-red hover:bg-rag-red/10"
                onClick={() => setMode("reject")}
              >
                <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
              </Button>
            </div>
          )}

          {mode !== "review" && (
            <div className="space-y-2 rounded-md border border-accent/20 bg-accent-dim/20 p-3">
              <Label className="text-xs">
                {mode === "approve" ? "Approval notes (optional)" : "Reason for rejection (required)"}
              </Label>
              <Textarea
                rows={2}
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder={mode === "approve" ? "Add any notes..." : "Explain why this CR cannot be approved..."}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setMode("review")} className="flex-1">
                  Back
                </Button>
                {mode === "approve" ? (
                  <Button
                    size="sm"
                    className="flex-1 bg-rag-green text-white hover:bg-rag-green/90"
                    onClick={handleApprove}
                  >
                    Confirm Approval
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="flex-1 bg-rag-red text-white hover:bg-rag-red/90"
                    onClick={handleReject}
                  >
                    Confirm Rejection
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {mode === "review" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Dependency Management Dialog ────────────────────────────────────────────────
type DepItem = Parameters<typeof ProjectSchedule>[0]["items"][number];
function DependencyDialog({
  open,
  onOpenChange,
  currentItem,
  allItems,
  onSetDependencies,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentItem?: DepItem;
  allItems: DepItem[];
  onSetDependencies: (name: string, dependencies: any[]) => void;
}) {
  const [selectedPred, setSelectedPred] = useState<string>("");
  const [relation, setRelation] = useState<"FS" | "SF" | "SS" | "FF">("FS");
  const [leadTime, setLeadTime] = useState(0);
  const [lagTime, setLagTime] = useState(0);
  const [deps, setDeps] = useState<any[]>([]);

  useEffect(() => {
    if (open && currentItem) {
      setDeps(currentItem.dependencies ?? []);
      setSelectedPred("");
      setRelation("FS");
      setLeadTime(0);
      setLagTime(0);
    }
  }, [open, currentItem]);

  function addDependency() {
    if (!selectedPred || !currentItem) return;
    const newDep = {
      predecessor: selectedPred,
      relation,
      leadTime: leadTime || undefined,
      lagTime: lagTime || undefined,
    };
    const updated = [...deps, newDep];
    setDeps(updated);
    setSelectedPred("");
    setRelation("FS");
    setLeadTime(0);
    setLagTime(0);
  }

  function removeDependency(idx: number) {
    setDeps((prev) => prev.filter((_, i) => i !== idx));
  }

  function save() {
    if (currentItem) {
      onSetDependencies(currentItem.name, deps.length > 0 ? deps : []);
      toast.success("Dependencies saved");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Dependencies — {currentItem?.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          {/* Existing dependencies */}
          {deps.length > 0 && (
            <div className="space-y-2 rounded-md border border-border bg-secondary/20 p-3">
              <div className="text-sm font-medium">Current Dependencies</div>
              {deps.map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded border border-border/60 bg-background/60 p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{d.predecessor}</span>
                    <span className="text-xs text-muted-foreground">
                      [{d.relation}]
                      {d.leadTime ? ` LS: ${d.leadTime}d` : ""}
                      {d.lagTime ? ` LG: ${d.lagTime}d` : ""}
                    </span>
                  </div>
                  <button onClick={() => removeDependency(i)} className="text-xs text-rag-red hover:underline">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new dependency */}
          <div className="space-y-3 rounded-md border border-accent/20 bg-accent-dim/20 p-3">
            <div className="text-sm font-medium">Add New Dependency</div>
            <div className="grid gap-3">
              <div>
                <Label className="text-xs">Predecessor Task/Milestone</Label>
                <Select value={selectedPred} onValueChange={setSelectedPred}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {allItems
                      .filter((m) => m.name !== currentItem?.name)
                      .map((m) => (
                        <SelectItem key={m.name} value={m.name}>
                          {m.kind === "Milestone" ? "◆" : "▢"} {m.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Relation Type</Label>
                  <Select value={relation} onValueChange={(v) => setRelation(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FS">Finish to Start (FS)</SelectItem>
                      <SelectItem value="SF">Start to Finish (SF)</SelectItem>
                      <SelectItem value="SS">Start to Start (SS)</SelectItem>
                      <SelectItem value="FF">Finish to Finish (FF)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-[9px] text-muted-foreground">
                    {relation === "FS" && "Predecessor must finish before this starts"}
                    {relation === "SF" && "This must finish before predecessor starts"}
                    {relation === "SS" && "Start together"}
                    {relation === "FF" && "Finish together"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs">Lead Time (days)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={leadTime}
                    onChange={(e) => setLeadTime(Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <p className="mt-1 text-[9px] text-muted-foreground">Overlap/advance</p>
                </div>
              </div>

              <div>
                <Label className="text-xs">Lag Time (days)</Label>
                <Input
                  type="number"
                  min={0}
                  value={lagTime}
                  onChange={(e) => setLagTime(Number(e.target.value) || 0)}
                  placeholder="0"
                />
                <p className="mt-1 text-[9px] text-muted-foreground">Delay between predecessor and this</p>
              </div>

              <Button
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={addDependency}
                disabled={!selectedPred}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Dependency
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={save}>Save Dependencies</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
