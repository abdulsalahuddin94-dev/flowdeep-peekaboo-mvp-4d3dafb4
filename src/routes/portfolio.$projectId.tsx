import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useCallback, Fragment } from "react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyRegion } from "@/lib/empty-preview";

import { RagBadge } from "@/components/RagBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskRegisterTab, IssuesLogTab } from "@/components/risk/RiskIssues";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableRowActions } from "@/components/TableRowActions";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronLeft, FileText, MessageSquare, Paperclip, Download, UserPlus, ChevronDown, ChevronRight, ChevronUp, Send, CheckCircle2, XCircle, X, Plus, AlertTriangle, ShieldAlert, Upload, FileUp, Pencil, MoreHorizontal, DeleteAction, ArrowUpRight, Clock, Check, Calendar, ClipboardCheck, Lock, Link2 } from "@/lib/icons";
import type { Rag, Project } from "@/lib/mock-data";
import { projects, vendors as vendorList, resources as resourcePool, parseLabelDate, projectDurationDays } from "@/lib/mock-data";
import { useProjects, useNotifications, useRfps, useResourceRequests, useCalendars, useJobRoles, useApprovals, type RfpEntry, type ResourceRequest } from "@/lib/projects-store";
import { FINANCIAL_CATALOG, findFinancialItem, useFinanceLinks } from "@/lib/finance-links";
import { FinancialLinkField } from "@/components/schedule/FinancialLinkField";
import { DEFAULT_COST_CATEGORIES } from "@/lib/org-cost-categories";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useRiskRegister } from "@/lib/risk-store";
import { ApprovalOutcomeBanner } from "@/components/ApprovalOutcome";
import { EmptyState } from "@/components/ds/EmptyState";
import { PageToolbar } from "@/components/ds/PageToolbar";
import { capexOpexGroup } from "@/components/ds/filters";
import { ProjectGantt } from "@/components/ProjectGantt";
import { ProjectSchedule, computePlannedProgress, depLag, depLabel } from "@/components/ProjectSchedule";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateForDisplay, formatDateWithYear } from "@/lib/date-format";
import {
  useTabBaseline,
  BaselineHeader,
  TabChangeRequestDialog,
  TabApprovalDialog,
  DEFAULT_PROJECT_APPROVERS,
  defaultDiff,
  type TabChange,
} from "@/components/TabBaseline";
void ProjectGantt;

export const Route = createFileRoute("/portfolio/$projectId")({
  component: ProjectDetail,
  loader: ({ params }) => {
    const p = projects.find((x) => x.id === params.projectId);
    // The static seed only covers demo projects — anything created at runtime (via the New Project
    // form) lives in the live ProjectsProvider context instead, which loaders can't reach (no hooks).
    // A same-id placeholder lets the component's `liveProjects.find(...) ?? loaderProject` fallback
    // resolve to the real live project on first render, without ever rendering placeholder fields.
    const placeholder: Project = {
      id: params.projectId, code: "", name: "Project", businessLine: "", department: [],
      pm: "", pmAvatar: "", progress: 0, budgetUsed: 0, budgetTotal: 0,
      startDate: "—", endDate: "—", rag: "blue", risks: 0, issues: 0,
      stage: "Initiation", tags: [],
    };
    return { project: p ?? placeholder };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.project.name ?? "Project"} — Nexus PMO` },
      { name: "description", content: `Full project workspace: planning, milestones, RAID, financials, team & status reporting for ${loaderData?.project.name}.` },
      { property: "og:title", content: `${loaderData?.project.name ?? "Project"} — Nexus PMO` },
      { property: "og:description", content: `Full project workspace: planning, milestones, financials, team and status reporting for ${loaderData?.project.name}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const TABS = [
  "Overview", "Project Schedule", "Cost Breakdown", "Revenue Breakdown", "Risk & Issues", "Status Reports",
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
  const { projects: liveProjects, updateProject, removeProject } = useProjects();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { calendars } = useCalendars();
  const projectCalendar = calendars.find((c) => c.id === (liveProjects.find((p) => p.id === loaderProject.id)?.calendarId ?? loaderProject.calendarId));
  const { addNotification } = useNotifications();
  const { addRfp } = useRfps();
  const { addResourceRequest, resourceRequests } = useResourceRequests();
  const { addApprovalRequest: addProjectApproval, currentUser: approvalUser, approvals: centralApprovals } = useApprovals();
  const { jobRoles } = useJobRoles();
  const navigate = useNavigate();
  const project = liveProjects.find((p) => p.id === loaderProject.id) ?? loaderProject;
  const isInternalProject = project.client === "Internal";
  const [reportOpen, setReportOpen] = useState(false);

  /** A project fresh out of the creation form — its tabs show guided empty states instead of demo content. */
  const isNewProject = project.ragNote === "New";
  function clearNewFlag() {
    if (project.ragNote === "New") updateProject(project.id, { ragNote: undefined });
  }
  const [activeTab, setActiveTab] = useState<string>(TABS[0]);
  
  const [addFirstMilestoneOpen, setAddFirstMilestoneOpen] = useState(false);
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
  const [milestones, setMilestones] = useState<Milestone[]>(isNewProject ? [] : [
    // ── Phase 1: Discovery — completed, all green, all assigned ──────────────
    { name: "Discovery & Requirements", kind: "Task", startDate: "2025-04-15", endDate: "2025-05-16", owner: "Sara Al-Rashid", rag: "amber", dep: "—", roles: [{ role: "Business Analyst", skill: "Senior", fte: 1 }], payment: { kind: "Package Cost", packageId: "PKG-DSC", amount: "$80K" }, progress: 20, parent: "Discovery Sign-off", weightScore: 8 },
    { name: "Stakeholder workshops", kind: "Task", startDate: "2025-04-15", endDate: "2025-04-25", owner: "Sara Al-Rashid", rag: "amber", dep: "—", roles: [{ role: "Business Analyst", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 40, parent: "Discovery & Requirements", assignee: "Sara Al-Rashid", weightScore: 5 },
    { name: "Requirements doc", kind: "Task", startDate: "2025-04-28", endDate: "2025-05-12", owner: "Sara Al-Rashid", rag: "amber", dep: "Stakeholder workshops", roles: [{ role: "Business Analyst", skill: "Mid", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Discovery & Requirements", assignee: "John Smith", weightScore: 5 },
    { name: "Discovery Sign-off", kind: "Milestone", startDate: "2025-05-16", endDate: "2025-05-16", owner: "Sara Al-Rashid", rag: "amber", dep: "Discovery & Requirements", dependencies: [{ predecessor: "Discovery & Requirements", relation: "FS", lag: 5 }], roles: [], payment: { kind: "Client Revenue", amount: "$120K" }, progress: 20, assignee: "Sara Al-Rashid", milestoneType: "finish", requiresApproval: true, approvers: [{ id: "u-sara", name: "Sara Al-Rashid", role: "Director", department: "Engineering" }, { id: "u-john", name: "John Smith", role: "Project Manager", department: "IT" }] },

    // ── Phase 2: Design — at risk (amber), mixed assignee states ────────────
    { name: "Solution Design", kind: "Task", startDate: "2025-05-19", endDate: "2025-06-27", owner: "Mei Chen", rag: "amber", dep: "Discovery Sign-off", dependencies: [{ predecessor: "Discovery Sign-off", relation: "FS" }], roles: [{ role: "Solution Architect", skill: "Senior", fte: 1 }], payment: { kind: "Package Cost", packageId: "PKG-DSN", amount: "$150K" }, progress: 70, parent: "Design Approved", weightScore: 8 },
    { name: "Architecture blueprint", kind: "Task", startDate: "2025-05-19", endDate: "2025-06-06", owner: "Mei Chen", rag: "green", dep: "Discovery Sign-off", dependencies: [{ predecessor: "Discovery Sign-off", relation: "FS" }], roles: [{ role: "Solution Architect", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 100, parent: "Solution Design", assignee: "Mei Chen", weightScore: 4 },
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
    { name: "Deployment & Hypercare", kind: "Task", startDate: "2026-09-22", endDate: "2026-10-17", owner: project.pm, rag: "amber", dep: "UAT Sign-off", roles: [{ role: "DevOps Engineer", skill: "Senior", fte: 1 }], payment: { kind: "Package Cost", packageId: "PKG-DPL", amount: "$60K" }, progress: 10, parent: "Go-Live", weightScore: 10 },
    { name: "Production cutover", kind: "Task", startDate: "2026-09-22", endDate: "2026-10-06", owner: project.pm, rag: "amber", dep: "UAT Sign-off", dependencies: [{ predecessor: "UAT Sign-off", relation: "FS" }, { predecessor: "Build Complete", relation: "FS", lag: 2 }, { predecessor: "Design Approved", relation: "FF" }, { predecessor: "Discovery Sign-off", relation: "SS", lag: 3 }, { predecessor: "Performance & load test", relation: "FS", lag: -1 }], roles: [{ role: "DevOps Engineer", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 25, parent: "Deployment & Hypercare", assignee: project.pm, weightScore: 5 },
    { name: "Hypercare support", kind: "Task", startDate: "2026-10-07", endDate: "2026-10-17", owner: project.pm, rag: "green", dep: "Production cutover", dependencies: [{ predecessor: "Production cutover", relation: "FS" }], roles: [{ role: "Support Lead", skill: "Mid", fte: 2 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Deployment & Hypercare", weightScore: 3 },
    { name: "Knowledge transfer", kind: "Task", startDate: "2026-10-06", endDate: "2026-10-17", owner: project.pm, rag: "green", dep: "Production cutover", dependencies: [{ predecessor: "Production cutover", relation: "SS" }], roles: [{ role: "Trainer", skill: "Mid", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Deployment & Hypercare", weightScore: 2 },
    { name: "Go-Live", kind: "Milestone", startDate: project.endDate, endDate: project.endDate, owner: project.pm, rag: "blue", dep: "Deployment & Hypercare", roles: [], payment: { kind: "Client Revenue", amount: "$500K" }, progress: 0, milestoneType: "finish" },
  ]);
  const [reports, setReports] = useState<StatusReport[]>(() => isNewProject ? [] : [
    { week: 18, by: project.pm, when: "3 days ago", rag: project.rag, text: "Integration layer testing delayed by 1 week. Fallback plan in review with IT Director. No impact on go-live yet." },
    { week: 17, by: project.pm, when: "10 days ago", rag: "amber", text: "Vendor SOW reviewed. Two open RAID items remain; mitigations scheduled this sprint." },
    { week: 16, by: project.pm, when: "17 days ago", rag: "green", text: "Discovery completed and signed off. Build phase 1 kicked off on plan." },
  ]);
  const [planningProgressOpen, setPlanningProgressOpen] = useState(false);
  const [progressInitial, setProgressInitial] = useState<string | undefined>(undefined);
  const [progressScope, setProgressScope] = useState<string | undefined>(undefined);
  const [stageGateOpen, setStageGateOpen] = useState(false);
  const [dependencyOpen, setDependencyOpen] = useState(false);
  const [createDependencyOpen, setCreateDependencyOpen] = useState(false);
  const [selectedItemForDep, setSelectedItemForDep] = useState<string | undefined>(undefined);
  const [finLinkItem, setFinLinkItem] = useState<string | undefined>(undefined);
  const [gateData, setGateData] = useState<GateStage[]>(INITIAL_GATE_DATA);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [crDialogOpen, setCrDialogOpen] = useState(false);
  const [crApprovalDialogOpen, setCrApprovalDialogOpen] = useState(false);
  const [selectedCrForApproval, setSelectedCrForApproval] = useState<string | undefined>(undefined);
  const [selectedBaselineVersion, setSelectedBaselineVersion] = useState<string>("latest");
  const [planEditMode, setPlanEditMode] = useState<"view" | "editing" | "pending">("view");
  const isViewingCurrent = selectedBaselineVersion === "latest";
  const isBaselineLocked = project.baselineLocked === true;
  const isEditingAllowed = isViewingCurrent && (!isBaselineLocked || planEditMode === "editing");
  // Cross-tab navigation: clicking a milestone-linked cost/revenue row jumps to
  // the Project Schedule tab and flashes that milestone row in the WBS.
  const [scheduleHighlight, setScheduleHighlight] = useState<string | null>(null);
  const goToMilestone = useCallback(
    (name: string) => {
      if (!milestones.some((m) => m.kind === "Milestone" && m.name === name)) return;
      setActiveTab("Project Schedule");
      setScheduleHighlight(name);
    },
    [milestones],
  );
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
      if (!isViewingCurrent || !isBaselineLocked) return;
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
  }, [planEditMode, isViewingCurrent, isBaselineLocked, hasPlanChanges]);

  // ── Reflect central Approvals Inbox decisions back onto this project ────────

  // 1) Milestone gates: approve → milestone completed (100%) & gate closed.
  useEffect(() => {
    const decisions: Array<{ name: string; status: "approved" | "rejected" }> = [];
    for (const m of milestones) {
      if (m.kind !== "Milestone" || !m.requiresApproval) continue;
      if (m.approvalStatus === "approved" || m.approvalStatus === "rejected") continue;
      const central = centralApprovals.find(
        (a) => a.type === "milestone-gate" && a.projectId === project.id && a.ref === m.name,
      );
      if (!central || central.status === "pending") continue;
      decisions.push({ name: m.name, status: central.status });
    }
    if (!decisions.length) return;
    setMilestones((prev) => {
      let next = prev.map((m) => {
        const d = decisions.find((x) => x.name === m.name);
        if (!d) return m;
        return d.status === "approved"
          ? { ...m, approvalStatus: "approved" as const, progress: 100 }
          : { ...m, approvalStatus: "rejected" as const };
      });
      for (const d of decisions) if (d.status === "approved") next = completeMilestoneSubtree(next, d.name);
      return next;
    });
    for (const d of decisions) {
      if (d.status === "approved") toast.success(`✅ ${d.name} approved — milestone completed (100%)`);
      else toast.error(`${d.name} approval rejected`);
    }
  }, [centralApprovals, milestones, project.id]);

  // 2) Schedule change requests: approve → new baseline version created.
  useEffect(() => {
    const pending = changeRequests.filter((cr) => cr.status === "pending" && cr.approvalId);
    if (!pending.length) return;
    for (const cr of pending) {
      const central = centralApprovals.find((a) => a.id === cr.approvalId);
      if (!central || central.status === "pending") continue;
      const reason = central.approvers.find((a) => a.comment)?.comment;
      if (central.status === "approved") {
        setChangeRequests((prev) =>
          prev.map((c) =>
            c.id === cr.id
              ? { ...c, status: "approved" as const, approvedAt: new Date().toISOString().split("T")[0], approvedBy: central.approvers.map((a) => a.name).join(", "), approvalReason: reason }
              : c,
          ),
        );
        setProjectBaselineVersions((prev) => {
          const version = prev.length + 1;
          toast.success(`✅ Change Request ${cr.id} approved — Project Schedule baseline v${version} created`);
          return [...prev, { version, createdAt: new Date().toISOString().split("T")[0], snapshot: milestones.map((m) => ({ ...m })) }];
        });
        setSelectedBaselineVersion("latest");
        setPlanEditMode("view");
      } else {
        setChangeRequests((prev) =>
          prev.map((c) =>
            c.id === cr.id
              ? { ...c, status: "rejected" as const, rejectedAt: new Date().toISOString().split("T")[0], rejectionReason: reason }
              : c,
          ),
        );
        setPlanEditMode("view");
        toast.error(`Change Request ${cr.id} rejected${reason ? ` — ${reason}` : ""}`);
      }
    }
  }, [centralApprovals, changeRequests, milestones]);

  // Initialize sample baseline versions on component mount
  useEffect(() => {
    if (isBaselineLocked && projectBaselineVersions.length === 0 && milestones.length > 0) {
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
  }, [isBaselineLocked, milestones, projectBaselineVersions.length]);

  function saveProjectBaseline() {
    const snapshot = computeDerivedSchedule(milestones, resourceRequests).map((item) => ({ ...item }));
    const createdAt = new Date().toISOString().split("T")[0];
    const firstVersion = { version: 1, createdAt, snapshot };
    setProjectBaseline({ ...firstVersion, isLocked: true });
    setProjectBaselineVersions([firstVersion]);
    setSelectedBaselineVersion("latest");
    setPlanEditMode("view");
    updateProject(project.id, { baselineLocked: true, ragNote: undefined });
    toast.success("Project baseline saved — Schedule and Financials are now locked");
  }

  // Publish this project's financial links so a linked item is excluded from
  // every other dropdown in the system (one item = one WBS element).
  const { setProjectLinks } = useFinanceLinks();
  useEffect(() => {
    const links: { itemId: string; wbsItem: string }[] = [];
    for (const m of milestones) {
      if (m.payment?.packageId) links.push({ itemId: m.payment.packageId, wbsItem: m.name });
      for (const ex of m.extraPayments ?? []) if (ex.packageId) links.push({ itemId: ex.packageId, wbsItem: m.name });
    }
    setProjectLinks(project.name, links);
  }, [milestones, project.name, setProjectLinks]);

  const currentStage = PLANNING_STAGES.find((s) => s.state === "active") ?? PLANNING_STAGES[0];
  const planningDone = PLANNING_CHECKLIST.filter((c) => c.done).length;
  const durationDays = projectDurationDays(project);
  const scheduleSummary = (() => {
    const derived = computeDerivedSchedule(milestones, resourceRequests);
    const leaves = derived.filter((item) => item.kind === "Task" && !derived.some((child) => child.parent === item.name));
    let totalWeight = 0;
    let weightedActual = 0;
    let weightedPlanned = 0;
    for (const task of leaves) {
      const weight = Math.max(0, task.weightScore ?? 1);
      totalWeight += weight;
      weightedActual += weight * (task.progress ?? 0);
      weightedPlanned += weight * computePlannedProgress(task.startDate, task.endDate);
    }
    return {
      actual: totalWeight ? Math.round(weightedActual / totalWeight) : project.progress,
      planned: totalWeight ? Math.round(weightedPlanned / totalWeight) : project.progress,
    };
  })();
  const pendingApprovalCount = centralApprovals.filter(
    (approval) => approval.projectId === project.id && approval.status === "pending",
  ).length;
  /** Project-level plan version + Change Plan controls, shown in the project header. */
  const planVersionControls = isBaselineLocked ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {isViewingCurrent && planEditMode === "editing" && planChangeCount > 0 && (
                <Badge variant="outline" className="h-7 gap-1.5 border-rag-amber/40 bg-rag-amber/10 px-2.5 text-[11px] font-medium text-rag-amber">
                  <Clock className="h-3.5 w-3.5" />
                  {planChangeCount} pending
                </Badge>
              )}
              {isViewingCurrent && planEditMode === "pending" && (
                <Badge variant="outline" className="h-7 gap-1.5 border-rag-blue/40 bg-rag-blue/10 px-2.5 text-[11px] font-medium text-rag-blue">
                  <Clock className="h-3.5 w-3.5" />
                  Waiting for Approval
                </Badge>
              )}
              <Select value={selectedBaselineVersion} onValueChange={(v) => {
                setSelectedBaselineVersion(v);
                setPlanEditMode("view");
                setEditBaselineSnapshot(null);
              }}>
                <SelectTrigger className="h-9 w-56 text-xs">
                  <span className="truncate">
                    {selectedBaselineVersion === "latest"
                      ? `Latest (v${projectBaselineVersions.length})`
                      : selectedBaselineVersion}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">
                    <div className="flex flex-col leading-tight">
                      <span>Latest (v{projectBaselineVersions.length})</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDateWithYear(projectBaselineVersions[projectBaselineVersions.length - 1]?.createdAt)}
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
                          {formatDateWithYear(v.createdAt)} · by {versionAuthors[v.version] ?? "—"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isViewingCurrent && planEditMode === "editing" && (
                <>
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
  ) : null;
  return (
    <div>
      <div className="mb-2">
        <Link to="/portfolio" className="inline-flex items-center text-sm text-breadcrumb-current transition-colors hover:text-breadcrumb-hover">
          <ChevronLeft className="mr-1 h-3 w-3" />Back to Portfolio
        </Link>
      </div>
      <PageHeader
        title="Project Details"
        current="Project Details"
        actions={(() => {
          /**
           * Deletion rules: only administrative roles may delete, and never once
           * the project carries ANY recorded actual — schedule progress on a
           * task, reported project progress, or spend.
           */
          const ADMIN_ROLES = ["Director", "PMO Lead", "Portfolio Director", "Administrator", "System Admin"];
          const isAdmin =
            ADMIN_ROLES.some((r) => r.toLowerCase() === approvalUser.role.toLowerCase()) ||
            approvalUser.department === "PMO";
          const scheduleActuals = milestones.some((m) => (m.progress ?? 0) > 0);
          const hasActuals = project.progress > 0 || project.budgetUsed > 0 || scheduleActuals;
          const blockReason = !isAdmin
            ? `Deleting a project is restricted to administrators (you are signed in as ${approvalUser.role}).`
            : hasActuals
              ? "This project already has recorded actual progress or cost. It can no longer be deleted — close or cancel it instead."
              : null;
          return (
          <div className="flex items-center gap-2">
            {planVersionControls}
            <Button size="sm" variant="primary" onClick={() => setReportOpen(true)}>Submit status</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Project actions"
                  className="h-9 w-9 rounded-lg border-border"
                >
                  <MoreHorizontal size={16} className="rotate-90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isBaselineLocked && (
                  <>
                    <DropdownMenuItem onClick={() => navigate({ to: "/portfolio/$projectId/edit", params: { projectId: project.id } })}>
                      <Pencil size={14} className="mr-2" />Edit Basic Info
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={saveProjectBaseline}>
                      <Lock size={14} className="mr-2" />Save Baseline
                    </DropdownMenuItem>
                  </>
                )}
                {isBaselineLocked && isViewingCurrent && planEditMode === "view" && (
                  <DropdownMenuItem onClick={enterEditMode}>
                    <Pencil size={14} className="mr-2" />Change Plan
                  </DropdownMenuItem>
                )}
                {isBaselineLocked && isViewingCurrent && planEditMode === "editing" && (
                  <>
                    <DropdownMenuItem disabled={planChangeCount === 0} onClick={() => setCrDialogOpen(true)}>
                      <Pencil size={14} className="mr-2" />Send Change Request{planChangeCount > 0 ? ` (${planChangeCount})` : ""}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={requestExitEditMode}>
                      <Pencil size={14} className="mr-2" />Exit Change Plan
                    </DropdownMenuItem>
                  </>
                )}
                {isBaselineLocked && isViewingCurrent && planEditMode === "pending" && (
                  <DropdownMenuItem disabled>
                    <Pencil size={14} className="mr-2" />Change Plan — Waiting For Approval
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  disabled={isBaselineLocked}
                  className={isBaselineLocked || blockReason ? "text-muted-foreground" : "text-rag-red focus:text-rag-red"}
                  title={isBaselineLocked ? "A baselined project cannot be deleted." : blockReason ?? undefined}
                  onClick={() => { if (isBaselineLocked) return; if (blockReason) { toast.error(blockReason); return; } setDeleteOpen(true); }}
                >
                  <DeleteAction size={14} className="mr-2" />Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ConfirmDialog
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              tone="danger"
              title={`Delete “${project.name}”?`}
              description="This project will be removed from the portfolio. This action cannot be undone."
              cancelLabel="Cancel"
              confirmLabel="Delete"
              onConfirm={() => {
                if (blockReason) { toast.error(blockReason); return; }
                removeProject(project.id);
                toast.done("Project", "deleted");
                navigate({ to: "/portfolio" });
              }}
            />
          </div>
          );
        })()}

      />

      <section className="mb-5 rounded-lg bg-card p-5" aria-label="Project overview information">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-foreground">{project.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {project.client && (
                <span className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-[10px] font-semibold text-accent">
                    {project.client.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                  </span>
                  {project.client}
                </span>
              )}
              {projectCalendar && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={13} className="text-muted-foreground" />
                  {projectCalendar.name}
                </span>
              )}
              <span className="num-mono text-p-neutral-500"># {project.code}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {project.tags.slice(0, 1).map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            {pendingApprovalCount > 0 && (
              <Badge variant="outline" className="border-rag-amber/30 bg-rag-amber/10 text-rag-amber">{pendingApprovalCount} Pending Approvals</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex h-16 flex-col justify-center gap-1.5 rounded-lg bg-[var(--field-bg-filled)] px-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Progress</div>
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", scheduleSummary.actual >= scheduleSummary.planned ? "bg-rag-green/15 text-rag-green" : "bg-rag-amber/15 text-rag-amber")}>
                {scheduleSummary.actual >= scheduleSummary.planned ? "On plan" : `${scheduleSummary.planned - scheduleSummary.actual}% behind`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={scheduleSummary.actual} className="h-1.5 flex-1" />
              <span className="num-mono text-lg font-semibold text-foreground">{scheduleSummary.actual}%</span>
              <span className="text-xs text-muted-foreground">/ {scheduleSummary.planned}%</span>
            </div>
          </div>

          <div className="flex h-16 items-center gap-3 rounded-lg bg-[var(--field-bg-filled)] px-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rag-red/15 text-rag-red">
              <AlertTriangle size={18} />
            </span>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Open Issues</div>
              <div className="flex items-baseline gap-2">
                <span className="num-mono text-lg font-semibold text-rag-red">{String(project.issues).padStart(2, "0")}</span>
                <span className="text-xs text-muted-foreground">active · 2 critical</span>
              </div>
            </div>
          </div>

          <div className="flex h-16 items-center gap-3 rounded-lg bg-[var(--field-bg-filled)] px-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rag-amber/15 text-rag-amber">
              <ShieldAlert size={18} />
            </span>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Open Risks</div>
              <div className="flex items-baseline gap-2">
                <span className="num-mono text-lg font-semibold text-rag-amber">{String(project.risks).padStart(2, "0")}</span>
                <span className="text-xs text-muted-foreground">active · 1 escalated</span>
              </div>
            </div>
          </div>

          <div className="flex h-16 flex-col justify-center gap-1.5 rounded-lg bg-[var(--field-bg-filled)] px-4">
            <div className="text-xs text-muted-foreground">Timeline</div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="num-mono text-sm font-medium text-accent">{durationDays != null ? `${durationDays}d` : "—"}</span>
              <span className="num-mono text-[10px] text-muted-foreground">({formatDateWithYear(project.startDate)} → {formatDateWithYear(project.endDate)})</span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            data-ds-size="auto"
            onClick={() => setStageGateOpen(true)}
            className="group h-16 justify-center rounded-lg bg-[var(--field-bg-filled)] px-4 text-left hover:bg-[var(--field-bg-filled)]/80"
          >
            <div className="flex w-full min-w-0 flex-col gap-1.5">
              <div className="text-xs font-normal text-muted-foreground">Stage Gate</div>
              <div className="flex items-center gap-3">
                <span className="shrink-0 text-sm font-semibold text-foreground">{currentStage.name}</span>
                <div className="flex min-w-0 flex-1 items-center gap-1" aria-label={`Stage ${currentStage.n} of ${PLANNING_STAGES.length}`}>
                  {PLANNING_STAGES.map((stage) => (
                    <span key={stage.n} className={cn("h-1 flex-1 rounded-full", stage.state === "done" ? "bg-accent" : stage.state === "active" ? "bg-accent/60" : "bg-secondary")} />
                  ))}
                </div>
              </div>
            </div>
          </Button>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={(t) => setActiveTab(t)}>
        <div>
        <TabsList className="overflow-x-auto whitespace-nowrap">
          {TABS.filter((t) => t !== "Revenue Breakdown" || !isInternalProject).map((t) => (
            <TabsTrigger key={t} value={t}>{t}</TabsTrigger>
          ))}
        </TabsList>
        </div>

        <TabsContent value="Overview" className="mt-5">
          <OverviewTab project={project} isNew={isNewProject} gateData={gateData} />
        </TabsContent>

        <TabsContent value="Project Schedule" className="mt-5">
          {isNewProject && (
            <EmptyState
              art="calendar"
              title="No schedule yet"
              description="Add your first milestone or task to start planning this project's timeline."
              ctaLabel="Add first milestone"
              onCta={() => setAddFirstMilestoneOpen(true)}
              className="mb-5"
            />
          )}
          {isBaselineLocked && planEditMode === "editing" && isViewingCurrent && (
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
          {isBaselineLocked && planEditMode === "view" && isViewingCurrent && (
            <div className="mb-2 text-[11px] text-muted-foreground/70">
              📖 Baseline locked — press <kbd className="rounded border border-border bg-secondary/40 px-1">E</kbd> or click Change Plan to edit
            </div>
          )}
          <ProjectSchedule
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
            jobRoles={jobRoles.map((r) => r.title)}
            onProgressClick={(name, kind) => {
              const derived = computeDerivedSchedule(milestones, resourceRequests);
              const hasChildren = derived.some((d) => d.parent === name);
              if (kind !== "Task" || hasChildren) return;
              setProgressScope(undefined);
              setProgressInitial(name);
              setPlanningProgressOpen(true);
            }}
            highlightItem={scheduleHighlight}
            onHighlightDone={() => setScheduleHighlight(null)}
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
              const prevAssignee = milestones.find((m) => m.name === name)?.assignee;
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
              toast.success("Skill request sent to Resources", {
                description: `${role.skill} ${role.role} · ${role.fte} FTE`,
                action: {
                  label: "Undo",
                  onClick: () => {
                    setMilestones((prev) =>
                      prev.map((m) =>
                        m.name === name
                          ? {
                              ...m,
                              assignee: prevAssignee,
                              resourceRequestIds: (m.resourceRequestIds ?? []).filter((x) => x !== id),
                            }
                          : m,
                      ),
                    );
                    toast.success("Request cancelled — assignee restored");
                  },
                },
              });
            }}
            onDependencyClick={(name) => {
              setSelectedItemForDep(name);
              setDependencyOpen(true);
            }}
            onAddDependencyClick={(name) => {
              if (!isEditingAllowed) {
                toast.error("📖 View Only — Click 'Change Plan' to edit");
                return;
              }
              setSelectedItemForDep(name);
              setCreateDependencyOpen(true);
            }}
            onFinancialLinkClick={(name) => {
              if (!isEditingAllowed) {
                toast.error("📖 View Only — Click 'Change Plan' to edit");
                return;
              }
              setFinLinkItem(name);
            }}
            AddItemSlot={
              <AddMilestoneDialog
                defaultOwner={project.pm}
                packages={SEED_PACKAGES}
                items={milestones}
                projectName={project.name}
                addResourceRequest={addResourceRequest}
                onAdd={(newItems) => { setMilestones((prev) => [...prev, ...newItems]); clearNewFlag(); }}
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

          {/* Controlled dialog for row-menu "Add subtask" / "Edit" */}
          <AddMilestoneDialog
            defaultOwner={project.pm}
            packages={SEED_PACKAGES}
            items={milestones}
            projectName={project.name}
            addResourceRequest={addResourceRequest}
            onAdd={(newItems) => { setMilestones((prev) => [...prev, ...newItems]); clearNewFlag(); }}
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

          {/* Controlled dialog for the "Add first milestone" CTA in the new-project empty state */}
          <AddMilestoneDialog
            defaultOwner={project.pm}
            packages={SEED_PACKAGES}
            items={milestones}
            projectName={project.name}
            addResourceRequest={addResourceRequest}
            onAdd={(newItems) => { setMilestones((prev) => [...prev, ...newItems]); clearNewFlag(); }}
            onUpdateExisting={(name, patch) =>
              setMilestones((prev) => prev.map((m) => (m.name === name ? { ...m, ...patch } : m)))
            }
            hideTrigger
            open={addFirstMilestoneOpen}
            onOpenChange={setAddFirstMilestoneOpen}
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
                        Submitted by {cr.submittedBy} · {formatDateWithYear(cr.createdAt)}
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
              setCrDialogOpen(false);
              setPlanEditMode("pending");
              setEditBaselineSnapshot(null);
              // The dependency-shift markers have served their purpose once submitted.
              setMilestones((prev) => prev.map((m) => (m.depDateShift ? { ...m, depDateShift: undefined } : m)));
              const approvalId = addProjectApproval({
                type: "change-request",
                projectId: project.id,
                projectName: project.name,
                ref: cr.id,
                title: `Baseline change request ${cr.id} — Project Schedule`,
                requestedBy: approvalUser.name,
                summary: cr.changes.map((c) => ({ label: c.field, before: c.oldValue, after: c.newValue })),
                approvers: DEFAULT_PROJECT_APPROVERS.map((a) => ({
                  id: a.id.startsWith("u-") ? a.id : `u-${a.id}`,
                  name: a.name,
                  role: a.role ?? "Approver",
                  decision: "pending" as const,
                })),
              });
              setChangeRequests((prev) => [...prev, { ...cr, approvalId }]);
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
              setProjectBaselineVersions((prev) => {
                const version = prev.length + 1;
                toast.success(`✅ Change Request approved — Project Schedule baseline v${version} created`);
                return [...prev, { version, createdAt: new Date().toISOString().split("T")[0], snapshot: milestones.map((m) => ({ ...m })) }];
              });
              setSelectedBaselineVersion("latest");
              setPlanEditMode("view");
              setCrApprovalDialogOpen(false);
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


        <TabsContent value="Cost Breakdown" className="mt-5">
          <EmptyRegion id="project-cost">
            <FinancialsTab mode="cost" project={project} milestones={milestones} isNew={isNewProject} onDataAdded={clearNewFlag} canEdit={isEditingAllowed} onMilestoneClick={goToMilestone} />
          </EmptyRegion>
        </TabsContent>

        {!isInternalProject && (
          <TabsContent value="Revenue Breakdown" className="mt-5">
            <EmptyRegion id="project-revenue">
              <FinancialsTab mode="revenue" project={project} milestones={milestones} isNew={isNewProject} onDataAdded={clearNewFlag} canEdit={isEditingAllowed} onMilestoneClick={goToMilestone} />
            </EmptyRegion>
          </TabsContent>
        )}


        <TabsContent value="Risk & Issues" className="mt-5">
          <ProjectRiskIssuesTab
            projectName={project.name}
            milestoneOptions={milestones.filter((m) => m.kind === "Milestone").map((m) => m.name)}
          />
        </TabsContent>

        <TabsContent value="Status Reports" className="mt-5">
          <StatusReportsTab
            project={project}
            reports={reports}
            setReports={setReports}
            externalOpen={reportOpen}
            onExternalOpenChange={setReportOpen}
            onRagChange={(rag) => { updateProject(project.id, { rag }); clearNewFlag(); addNotification({ tone: rag === "red" ? "red" : rag === "amber" ? "amber" : "green", title: `${project.name} status updated to ${rag === "red" ? "Off-Track" : rag === "amber" ? "At Risk" : "On Track"}`, time: "Just now" }); }}
          />
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
        projectId={project.id}
        projectName={project.name}
        onSetProgress={(name, progress) =>
          setMilestones((prev) => {
            // Status follows progress: >0% ⇒ In Progress, 0% ⇒ Not Started, 100% ⇒ Completed.
            const syncRag = (m: Milestone): Rag => {
              if (progress >= 100) return "green";
              if (progress > 0) return m.rag === "red" ? "red" : "amber";
              return m.rag === "red" ? "red" : "blue";
            };
            let updated = prev.map((m) => (m.name === name ? { ...m, progress, rag: syncRag(m) } : m));


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
          setMilestones((prev) =>
            completeMilestoneSubtree(
              prev.map((m) => (m.name === name ? { ...m, approvalStatus: "approved" as const, progress: 100 } : m)),
              name,
            ),
          )
        }
        onRejectApproval={(name) =>
          setMilestones((prev) => prev.map((m) => (m.name === name ? { ...m, approvalStatus: "rejected" } : m)))
        }
      />
      <StageGatesDialog open={stageGateOpen} onOpenChange={setStageGateOpen} gateData={gateData} setGateData={setGateData} />
      <ViewDependenciesDialog
        open={dependencyOpen}
        onOpenChange={setDependencyOpen}
        currentItem={selectedItemForDep ? milestones.find((m) => m.name === selectedItemForDep) : undefined}
        allItems={milestones}
        onSetDependencies={(name, dependencies, impacts) =>
          setMilestones((prev) =>
            prev.map((m) => {
              const moved = impacts.find((i) => i.name === m.name);
              let next = m.name === name ? { ...m, dependencies } : m;
              if (moved) next = { ...next, startDate: moved.start, endDate: moved.end, depDateShift: true };
              return next;
            }),
          )
        }
      />
      <CreateDependencyDialog
        open={createDependencyOpen}
        onOpenChange={setCreateDependencyOpen}
        currentItem={selectedItemForDep ? milestones.find((m) => m.name === selectedItemForDep) : undefined}
        allItems={milestones}
        onSetDependencies={(name, dependencies, impacts) =>
          setMilestones((prev) =>
            prev.map((m) => {
              const moved = impacts.find((i) => i.name === m.name);
              let next = m.name === name ? { ...m, dependencies } : m;
              if (moved) next = { ...next, startDate: moved.start, endDate: moved.end, depDateShift: true };
              return next;
            }),
          )
        }
      />
      <ScheduleFinancialLinkDialog
        open={finLinkItem !== undefined}
        onOpenChange={(v) => setFinLinkItem(v ? finLinkItem : undefined)}
        item={finLinkItem ? milestones.find((m) => m.name === finLinkItem) : undefined}
        items={milestones}
        projectName={project.name}
        onSave={(name, payment, extras) =>
          setMilestones((prev) => prev.map((m) => (m.name === name ? { ...m, payment, extraPayments: extras } : m)))
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
  const [approved, setApproved] = useState(project.stage !== "Initiation");

  const [fields, setFields] = useState({
    objective:   `Deliver ${project.name} on time and within budget, achieving the agreed scope for ${project.client ?? project.department.join(" / ")}.`,
    scope:       `In scope: full delivery of ${project.name} across all defined workstreams.\nOut of scope: ongoing operations, post-go-live support beyond 90 days.`,
    sponsor:     "Executive Director, " + project.department.join(" / "),
    pm:          project.pm,
    startDate:   "2026-04-01",
    endDate:     project.endDate,
    budget:      `$${project.budgetTotal.toFixed(1)}M`,
    constraints: "Must comply with procurement policy. Key milestones cannot slip beyond 30 days without board approval.",
    assumptions: "Stakeholder availability confirmed. No major regulatory changes expected during delivery.",
    risks:       `${project.risks} open risks logged in Project Risks tab. Top risk: vendor delivery delay.`,
    successCriteria: "Go-live achieved by target date. User acceptance ≥ 85%. Budget variance < 5%.",
  });

  const snapshot = useMemo(() => fields, [fields]);
  const baseline = useTabBaseline({
    scope: "charter",
    label: "Project Charter",
    current: snapshot,
    onCommit: (s) => setFields(s),
  });
  const displayFields = (baseline.viewedSnapshot as typeof fields | null) ?? fields;
  const editMode = baseline.canEdit;

  function patch(key: keyof typeof fields, val: string) {
    setFields((prev) => ({ ...prev, [key]: val }));
  }

  const renderField = (label: string, fieldKey: keyof typeof fields, multiline = false) => (
    <div key={fieldKey} className="space-y-1">
      <div className="label-eyebrow">{label}</div>
      {editMode ? (
        multiline
          ? <Textarea value={fields[fieldKey]} onChange={(e) => patch(fieldKey, e.target.value)} className="text-sm min-h-[64px]" rows={3} />
          : <Input value={fields[fieldKey]} onChange={(e) => patch(fieldKey, e.target.value)} className="text-sm" />
      ) : (
        <p className="text-sm text-foreground whitespace-pre-line">{displayFields[fieldKey]}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <BaselineHeader state={baseline} />
      <TabChangeRequestDialog state={baseline} approverPool={DEFAULT_PROJECT_APPROVERS} />
      <TabApprovalDialog state={baseline} />
      {/* Header bar */}
      <div className="glass-card flex items-center justify-between px-5 py-4">
        <div>
          <h2 className="text-base font-medium text-foreground">Project Charter — {project.name}</h2>
          <p className="text-xs text-muted-foreground">Version 1.0 · {project.department.join(" · ")} · {project.businessLine}</p>
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
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-4">
            <div className="label-eyebrow text-accent">Project Purpose</div>
            {renderField("Objective", "objective", true)}
            {renderField("Scope", "scope", true)}
          </div>

          <div className="glass-card p-5 space-y-4">
            <div className="label-eyebrow text-accent">Success Criteria</div>
            {renderField("Definition of success", "successCriteria", true)}
          </div>

          <div className="glass-card p-5 space-y-4">
            <div className="label-eyebrow text-accent">Constraints & Assumptions</div>
            {renderField("Constraints", "constraints", true)}
            {renderField("Assumptions", "assumptions", true)}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-4">
            <div className="label-eyebrow text-accent">Project Identity</div>
            <div className="grid grid-cols-2 gap-4">
              {renderField("Sponsor", "sponsor")}
              {renderField("Project Manager", "pm")}
              {renderField("Start Date", "startDate")}
              {renderField("End Date", "endDate")}
              {renderField("Approved Budget", "budget")}
              <div className="space-y-1">
                <div className="label-eyebrow">Client</div>
                <p className="text-sm text-foreground">{project.client ?? "Internal"}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 space-y-4">
            <div className="label-eyebrow text-accent">Risk Summary</div>
            {renderField("Key risks at charter stage", "risks", true)}
          </div>

          <div className="glass-card p-5 space-y-3">
            <div className="label-eyebrow text-accent">Approval Record</div>
            {[
              { role: "Executive Sponsor", name: "Ahmad Al-Farsi", date: approved ? "02 May, 2026" : "—", done: approved },
              { role: "Portfolio Director", name: "Aisha Khoury",  date: approved ? "04 May, 2026" : "—", done: approved },
              { role: "Project Manager",   name: project.pm,       date: approved ? "29 Apr, 2026" : "—", done: true },
              { role: "Finance Manager",   name: "John Smith",     date: approved ? "04 May, 2026" : "—", done: approved },
            ].map((a) => (
              <div key={a.role} className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-foreground">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.role}</div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{formatDateWithYear(a.date)}</span>
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

function OverviewTab({
  project, isNew, gateData,
}: {
  project: typeof projects[number]; isNew: boolean; gateData: GateStage[];
}) {
  const { risks } = useRiskRegister();
  const projectRisks = useMemo(
    () => risks.filter((risk) => risk.project === project.name).sort((a, b) => b.score - a.score),
    [project.name, risks],
  );

  if (isNew) {
    return (
      <EmptyState
        art="briefcase"
        title="This project is just getting started"
        description="Add a schedule, budget, and your first status report to bring this project to life. Use the Project Schedule, Financials, and Status Reports tabs to get going."
      />
    );
  }

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

  const stages = gateData.map((g, idx) => {
    const completed = g.items.filter((i) => i.done).length;
    const total = g.items.length;
    return { n: idx + 1, name: g.name, done: total > 0 && completed === total, completed, total };
  });

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
    <div className="grid items-start gap-4 md:grid-cols-2">
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
              <span className="num-mono font-medium text-foreground">{formatDateWithYear(project.startDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">End Date:</span>
              <span className="num-mono font-medium text-foreground">{formatDateWithYear(project.endDate)}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="label-eyebrow mb-4">Stage Gates</div>
          <ul className="space-y-4">
            {stages.map((s) => {
              const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
              return (
                <li key={s.n}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${s.done ? "bg-accent text-accent-foreground" : "border border-border bg-secondary/40 text-muted-foreground"}`}>
                      {s.done ? <span className="text-sm">✓</span> : <span className="num-mono text-xs">{s.n}</span>}
                    </div>
                    <span className={`flex-1 text-sm ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.name}</span>
                    <span className="num-mono text-xs text-muted-foreground">{s.completed}/{s.total}</span>
                  </div>
                  <div className="mt-2 ml-11">
                    <Progress
                      value={pct}
                      className={cn("h-1.5", s.done && "[&>div]:bg-rag-green")}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="label-eyebrow">Risks Summary</div>
            <span className="num-mono text-xs text-muted-foreground">{projectRisks.length} risks</span>
          </div>
          {projectRisks.length > 0 ? (
            <ul className="max-h-[220px] space-y-1 overflow-y-auto pr-2 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
              {projectRisks.map((risk) => {
                const scoreTone = risk.score >= 15
                  ? "bg-rag-red/15 text-rag-red"
                  : risk.score >= 9
                    ? "bg-rag-amber/15 text-rag-amber"
                    : "bg-rag-green/15 text-rag-green";
                return (
                  <li key={risk.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-table-row-hover">
                    <span className={cn("num-mono flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium", scoreTone)}>
                      {risk.score}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{risk.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{risk.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{risk.status}</span>
                      </div>
                    </div>
                    <span className="num-mono shrink-0 text-xs text-muted-foreground">P{risk.prob} × I{risk.impact}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No risks logged for this project.</p>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="label-eyebrow mb-4">Next Milestones</div>
          <ul className="space-y-3">
            {milestones.map((m) => (
              <li key={m.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${m.rag === "green" ? "bg-rag-green" : "bg-rag-amber"}`} />
                  <span className="text-sm font-medium text-foreground">{m.name}</span>
                </div>
                <span className="num-mono text-xs text-muted-foreground">{formatDateWithYear(m.date)}</span>
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
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Add Member</Button>
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
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Submit Request</Button>
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
  { id: "PKG-001", scope: "Integration partner services", est: "$680K", status: "Awarded", rfp: "RFP-014", vendor: "Siemens MENA", contract: "CT-2026-038", awarded: "12 May" },
  { id: "PKG-002", scope: "Cybersecurity audit & pen-test", est: "$140K", status: "Proposals Received", rfp: "RFP-015", proposals: [
    { vendor: "CyberShield Arabia", score: 88, value: "$135K" },
    { vendor: "SecureIT MENA", score: 74, value: "$142K" },
  ]},
  { id: "PKG-003", scope: "Training services rollout", est: "$95K", status: "Sent for Tendering", rfp: "RFP-016", issued: "01 Jun", closes: "28 Jun" },
  { id: "PKG-004", scope: "Managed support (1 year)", est: "$285K", status: "Draft" },
];

/**
 * Financial items are DEFINED in the project Financials tab (see
 * `src/lib/finance-links.tsx`). The WBS only links tasks/milestones to those
 * predefined items — no amounts are entered here.
 */




// ── Progress Update dialog (shown when the Progress KPI is clicked) ─────────
function ProgressUpdateDialog({
  open, onOpenChange, items, onSetProgress, onRequestApproval, onApprove, onRejectApproval, initialTaskName, scopeMilestone,
  projectBaseline, setProjectBaseline, projectBaselineVersions, setProjectBaselineVersions,
  milestones, resourceRequests, setCrDialogOpen, projectId, projectName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: Milestone[];
  onSetProgress: (name: string, progress: number) => void;
  onRequestApproval: (name: string) => void;
  onApprove: (name: string) => void;
  onRejectApproval: (name: string) => void;
  initialTaskName?: string;
  scopeMilestone?: string;
  projectBaseline: { version: number; createdAt: string; isLocked: boolean; snapshot: Milestone[] } | null;
  setProjectBaseline: React.Dispatch<React.SetStateAction<{ version: number; createdAt: string; isLocked: boolean; snapshot: Milestone[] } | null>>;
  projectBaselineVersions: Array<{ version: number; createdAt: string; snapshot: Milestone[] }>;
  setProjectBaselineVersions: React.Dispatch<React.SetStateAction<Array<{ version: number; createdAt: string; snapshot: Milestone[] }>>>;
  milestones: Milestone[];
  resourceRequests: ResourceRequest[];
  setCrDialogOpen: (v: boolean) => void;
  projectId: string;
  projectName: string;
}) {
  // All leaf tasks (no children)
  const allLeaves = useMemo(
    () => items.filter((m) => m.kind === "Task" && !m.isApprovalTask && !items.some((c) => c.parent === m.name)),
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
  // Only tasks that are still open are offered — completed ones are out of the picker
  // so the list stays short even on projects with thousands of tasks.
  const openLeaves = useMemo(
    () => leaves.filter((l) => (l.progress ?? 0) < 100 || l.name === initialTaskName),
    [leaves, initialTaskName],
  );
  useEffect(() => {
    if (!open) return;
    const pre = initialTaskName ? leaves.find((l) => l.name === initialTaskName) : undefined;
    const first = pre ?? openLeaves[0];
    setSelected(first?.name ?? "");
    setDraftPct(first?.progress ?? 0);
  }, [open, leaves, openLeaves, initialTaskName]);


  const current = leaves.find((t) => t.name === selected);
  const currentPlanned = current ? computePlannedProgress(current.startDate, current.endDate) : 0;
  const currentDependencies = current?.dependencies ?? [];
  // Find the ancestor milestone (if any) that requires approval for `current`.
  const approvalMilestone = useMemo(() => {
    const byName = new Map(items.map((i) => [i.name, i]));
    if (!current) {
      const scoped = scopeMilestone ? byName.get(scopeMilestone) : undefined;
      return scoped?.requiresApproval ? scoped : (null as Milestone | null);
    }
    let cur: Milestone | undefined = current;
    const seen = new Set<string>();
    while (cur?.parent && !seen.has(cur.parent)) {
      const p = byName.get(cur.parent);
      if (!p) break;
      if (p.requiresApproval) return p;
      seen.add(cur.parent);
      cur = p;
    }
    const scoped = scopeMilestone ? byName.get(scopeMilestone) : undefined;
    return scoped?.requiresApproval ? scoped : null;
  }, [current, items, scopeMilestone]);


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
  // Decisions live in the central Approvals inbox — this panel is read-only here.
  const { approvals, addApprovalRequest, remindApproval, currentUser } = useApprovals();
  const gateRequest = useMemo(
    () => approvals.find(
      (a) => a.type === "milestone-gate" && a.projectId === projectId && a.ref === approvalMilestone?.name,
    ) ?? null,
    [approvals, projectId, approvalMilestone?.name],
  );
  const approvedBy = (gateRequest?.approvers ?? []).filter((a) => a.decision === "approved").map((a) => a.id);

  // Reflect the inbox decision back onto the milestone.
  useEffect(() => {
    if (gateRequest?.status === "approved" && approvalMilestone && approvalMilestone.approvalStatus !== "approved") {
      onApprove(approvalMilestone.name);
    }
    if (gateRequest?.status === "rejected" && approvalMilestone && approvalMilestone.approvalStatus !== "rejected") {
      onRejectApproval(approvalMilestone.name);
    }
  }, [gateRequest?.status, approvalMilestone?.name, approvalMilestone?.approvalStatus]);

  function save() {
    if (!current) return;
    onSetProgress(current.name, draftPct);
    toast.success(`Progress updated — ${current.name} → ${draftPct}%`);
  }

  function saveAndRequestApproval() {
    if (!approvalMilestone) return;
    if (current) onSetProgress(current.name, draftPct);
    onRequestApproval(approvalMilestone.name);
    addApprovalRequest({
      type: "milestone-gate",
      projectId,
      projectName,
      ref: approvalMilestone.name,
      title: `Milestone completion — ${approvalMilestone.name}`,
      requestedBy: currentUser.name,
      summary: [
        { label: "Milestone", after: approvalMilestone.name },
        { label: "Tasks complete", after: `${approvalLeaves.length}/${approvalLeaves.length} at 100%` },
        { label: "Planned finish", after: approvalMilestone.endDate ?? "—" },
      ],
      approvers: (approvalMilestone.approvers ?? []).map((a) => ({
        id: a.id, name: a.name, role: a.role, department: a.department, decision: "pending" as const,
      })),
    });
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
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="text-lg">
            {current ? `Progress Update — ${current.name}` : "Progress Update"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Update task completion and review the milestone approval gate.
          </DialogDescription>
        </DialogHeader>

        {/* Overall planned vs actual (scoped when applicable) */}
        <div className="mx-6 mt-6 rounded-lg border border-border bg-secondary/20 px-5 py-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="label-eyebrow">{scopeMilestone ?? current?.parent ?? "Overall project"}</span>
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

        <div className="min-h-0 px-6 py-5">
          <section className="min-w-0 space-y-4 rounded-lg border border-border bg-secondary/10 p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_112px] items-center gap-3">
              <div className="min-w-0 space-y-1.5">
                <div className="truncate text-sm font-medium text-foreground">
                  {current?.name ?? initialTaskName}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="pr-7 text-right num-mono"
                    value={draftPct}
                    onChange={(e) => setDraftPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
            </div>

            {current && (
              <div className="space-y-3">
                <PlanVsActualBar actual={current.progress ?? 0} planned={currentPlanned} />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Actual <span className="num-mono text-foreground">{current.progress ?? 0}%</span></span>
                  <span>Planned <span className="num-mono text-foreground">{currentPlanned}%</span></span>
                </div>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-full justify-between border-t border-border/50 px-0 pt-2 text-[11px] text-muted-foreground hover:bg-transparent hover:text-foreground">
                      Task details
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <dl className="grid grid-cols-2 gap-x-5 gap-y-2 text-[11px]">
                      <div><dt className="text-muted-foreground">Start</dt><dd className="mt-0.5 text-foreground">{formatDateWithYear(current.startDate)}</dd></div>
                      <div><dt className="text-muted-foreground">End</dt><dd className="mt-0.5 text-foreground">{formatDateWithYear(current.endDate)}</dd></div>
                      <div><dt className="text-muted-foreground">Weight score</dt><dd className="mt-0.5 text-foreground">{current.weightScore ?? 1}</dd></div>
                      <div><dt className="text-muted-foreground">Parent</dt><dd className="mt-0.5 truncate text-foreground">{current.parent || "—"}</dd></div>
                      <div className="col-span-2">
                        <dt className="flex items-center justify-between gap-3 text-muted-foreground">
                          <span>Depends on</span>
                          {currentDependencies.length > 0 && <span>{currentDependencies.length} dependencies</span>}
                        </dt>
                        <dd className="mt-1.5">
                          {currentDependencies.length > 0 ? (
                            <div className="max-h-28 space-y-1 overflow-y-auto pr-1" aria-label={`${currentDependencies.length} dependencies`}>
                              {currentDependencies.map((dependency) => (
                                <div key={`${dependency.predecessor}-${dependency.relation}`} className="flex min-h-7 items-center justify-between gap-3 rounded-md border border-border bg-secondary/30 px-2.5 py-1.5">
                                  <span className="min-w-0 truncate text-foreground" title={dependency.predecessor}>{dependency.predecessor}</span>
                                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{depLabel(dependency)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-foreground">{current.dep || "—"}</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

          </section>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 pb-6">
          <p className="text-[11px] leading-tight text-muted-foreground">
            Progress rolls up from child tasks by weight.
          </p>
          <Button
            onClick={allChildrenAt100 && !msApproved ? saveAndRequestApproval : save}
            disabled={!current || (allChildrenAt100 && approvalMilestone?.approvalStatus === "pending")}
            variant="primary"
            className="shrink-0 px-5"
          >
            {allChildrenAt100 && !msApproved
              ? approvalMilestone?.approvalStatus === "pending"
                ? "Waiting for Approval"
                : approvalMilestone?.approvalStatus === "rejected"
                  ? "Re-send Approval Request"
                  : "Send Approval Request"
              : "Save update"}
          </Button>
        </div>
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
    { id: "T-01", purpose: "Site survey", dest: "Dubai, UAE", dates: "12 Jun – 15 Jun", travelers: "Sara, Mei", cost: "$5.2K", rag: "green", status: "Completed" },
    { id: "T-02", purpose: "Vendor workshop", dest: "Munich, DE", dates: "08 Jul – 11 Jul", travelers: "K. Bauer", cost: "$3.0K", rag: "green", status: "Completed" },
    { id: "T-03", purpose: "User training", dest: "Riyadh, KSA", dates: "18 Aug – 22 Aug", travelers: "H. Tanaka, Priya, +2", cost: "$9.8K", rag: "amber", status: "Booked" },
    { id: "T-04", purpose: "Go-live support", dest: "Doha, QA", dates: "14 Sep – 28 Sep", travelers: "John, Mei, +2", cost: "$6.5K", rag: "blue", status: "Planned" },
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
            <TableRow key={r.id} className="bg-table-row-bg hover:bg-table-row-hover border-0">
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

/**
 * Logging an actual is bookkeeping, not re-planning: it stays available after the
 * baseline is locked so no Change Plan is needed to record a payment or expense.
 */
function AddActualDialog({ title, onAdd, validateAmount }: { title: string; onAdd: (a: ActualEntry) => void; validateAmount?: (amount: number) => string | null }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setName(""); setDate(""); setAmount(""); } }}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          data-ds-size="auto"
          className="h-9 w-9 shrink-0 rounded-full border border-border/60 !bg-[var(--btn-secondary-bg)] text-accent-secondary hover:!bg-[var(--btn-secondary-bg-hover)]"
          title={title}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Recorded against the planned line — no change request required.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Invoice INV-0021" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Date</Label>
              <DatePicker value={date} onChange={setDate} placeholder="Pick a date" />
            </div>
            <div className="grid gap-1.5">
              <Label>Amount ($M)</Label>
              <Input type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const amt = parseFloat(amount);
              if (!name.trim() || !date.trim() || isNaN(amt)) { toast.error("Name, date and amount are required"); return; }
              // Actuals can never exceed the planned amount — utilization is capped at 100%.
              const err = validateAmount?.(amt);
              if (err) { toast.error(err, { title: "Actual exceeds the planned amount" }); return; }
              onAdd({ name: name.trim(), date: date.trim(), amount: amt, note: name.trim() });
              setOpen(false);
              toast.done("Actual", "added");
            }}
          >
            Add actual spend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function actualDatePickerValue(value?: string) {
  if (!value || value === "—") return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(`${value}, 2026`);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

/**
 * Edit an already-logged actual (payment/expense) — bookkeeping, not re-planning,
 * so this stays available regardless of baseline lock, same as AddActualDialog.
 */
function EditActualDialog({
  entry, onOpenChange, onSave, validateAmount,
}: {
  entry: ActualEntry | null;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: ActualEntry) => void;
  validateAmount?: (amount: number) => string | null;
}) {
  const [name, setName] = useState(entry?.name ?? entry?.note ?? "");
  const [date, setDate] = useState(actualDatePickerValue(entry?.date));
  const [amount, setAmount] = useState(entry ? String(entry.amount) : "");

  useEffect(() => {
    if (!entry) return;
    setName(entry.name ?? entry.note ?? "");
    setDate(actualDatePickerValue(entry.date));
    setAmount(String(entry.amount));
  }, [entry]);

  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit actual spend</DialogTitle>
          <DialogDescription>Recorded against the planned line — no change request required.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Invoice INV-0021" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Date</Label>
              <DatePicker value={date} onChange={setDate} placeholder="Pick a date" />
            </div>
            <div className="grid gap-1.5">
              <Label>Amount ($M)</Label>
              <Input type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const amt = parseFloat(amount);
              if (!name.trim() || !date.trim() || isNaN(amt)) { toast.error("Name, date and amount are required"); return; }
              const err = validateAmount?.(amt);
              if (err) { toast.error(err, { title: "Actual exceeds the planned amount" }); return; }
              onSave({ name: name.trim(), date: date.trim(), amount: amt, note: name.trim() });
              onOpenChange(false);
              toast.done("Actual", "updated");
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Edit dialog for a planned cost line (mirrors the revenue line editor). */
function EditCostRowDialog({
  entry, categories, milestoneNames, onOpenChange, onSave,
}: {
  entry: CostEntry | null;
  categories: string[];
  milestoneNames: string[];
  onOpenChange: (open: boolean) => void;
  onSave: (patch: Partial<CostEntry>) => void;
}) {
  const [cat, setCat] = useState(entry?.cat ?? "");
  const [desc, setDesc] = useState(entry?.desc ?? "");
  const [plan, setPlan] = useState(entry ? String(entry.b) : "");
  const [linkKind, setLinkKind] = useState<"fixed" | "milestone">(entry?.linkKind === "milestone" ? "milestone" : "fixed");
  const [linkRef, setLinkRef] = useState(entry?.linkRef ?? "");

  useEffect(() => {
    if (!entry) return;
    setCat(entry.cat ?? ""); setDesc(entry.desc ?? "");
    setPlan(String(entry.b));
    setLinkKind(entry.linkKind === "milestone" ? "milestone" : "fixed");
    setLinkRef(entry.linkRef ?? "");
  }, [entry]);

  const catOptions = Array.from(new Set([...categories, entry?.cat ?? ""].filter(Boolean)));
  const msOptions = Array.from(new Set([...milestoneNames, entry?.linkKind === "milestone" ? (entry?.linkRef ?? "") : ""].filter(Boolean)));

  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit cost line</DialogTitle>
          <DialogDescription>Update the category, planned amount, and whether the line is tied to a milestone or a fixed date.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Category</Label>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger><SelectValue placeholder="Select category…" /></SelectTrigger>
              <SelectContent>
                {catOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Planned ($M)</Label>
              <Input type="number" min={0} step={0.01} value={plan} onChange={(e) => setPlan(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Linked to</Label>
              <RadioGroup
                value={linkKind}
                onValueChange={(v) => { setLinkKind(v as "fixed" | "milestone"); setLinkRef(""); }}
                className="flex items-center gap-5"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="fixed" id="edit-cost-link-fixed" />
                  <Label htmlFor="edit-cost-link-fixed" className="cursor-pointer text-sm font-normal text-muted-foreground">Fixed date</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="milestone" id="edit-cost-link-milestone" />
                  <Label htmlFor="edit-cost-link-milestone" className="cursor-pointer text-sm font-normal text-muted-foreground">Milestone</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>{linkKind === "milestone" ? "Milestone" : "Date"}</Label>
            {linkKind === "milestone" ? (
              <Select value={linkRef} onValueChange={setLinkRef}>
                <SelectTrigger><SelectValue placeholder="Select milestone…" /></SelectTrigger>
                <SelectContent>
                  {msOptions.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input type="date" value={linkRef} onChange={(e) => setLinkRef(e.target.value)} placeholder="e.g. 2025-06-15" />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const p = parseFloat(plan);
              if (isNaN(p)) { toast.error("Planned amount is required"); return; }
              // The plan must still cover everything already logged as actual (utilization caps at 100%).
              const loggedActual = (entry?.actuals ?? (entry && entry.a > 0 ? [{ amount: entry.a, date: "—" }] : [])).reduce((s, a) => s + a.amount, 0);
              if (p < loggedActual - 0.0001) {
                toast.error(`This line already has $${loggedActual.toFixed(2)}M logged as actual. The planned amount can't be lower than that.`, { title: "Planned amount too low" });
                return;
              }
              if (linkKind === "milestone" && !linkRef) { toast.error("Please pick a milestone"); return; }
              onSave({ cat: cat || undefined, desc: desc.trim() || undefined, b: p, linkKind, linkRef });
              onOpenChange(false);
              toast.done("Cost line", "updated");
            }}
          >
            Save changes
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}

// ── Financials tab — Cost / Revenue split ────────────────────────────────────
function FinancialsTab({
  mode, project, milestones, isNew, onDataAdded, canEdit = true, onMilestoneClick,
}: { mode: "cost" | "revenue"; project: typeof projects[number]; milestones: Milestone[]; isNew: boolean; onDataAdded: () => void; canEdit?: boolean; onMilestoneClick?: (name: string) => void }) {
  const milestoneNames = useMemo(
    () => milestones.filter((m) => m.kind === "Milestone").map((m) => m.name),
    [milestones],
  );
  const [costEntries, setCostEntries] = useState<CostEntry[]>(isNew ? [] : [
    { c: "Labour", cat: "Staff", b: 1.20, a: 0.84, color: "bg-rag-green", desc: "Core delivery team", ctype: "internal", classification: "opex", linkKind: "milestone", linkRef: "Build Complete", breakdown: [
      { name: "Backend engineers (3)", amount: 0.55, note: "6-month allocation" },
      { name: "Frontend engineers (2)", amount: 0.35 },
      { name: "QA (2)", amount: 0.30 },
    ] },
    { c: "Hardware", cat: "Contracts", b: 0.90, a: 0.62, color: "bg-rag-blue", desc: "On-prem servers + peripherals", ctype: "third-party", classification: "capex", linkKind: "fixed", linkRef: "2025-06-15" },
    { c: "Software licenses", cat: "Services", b: 0.40, a: 0.31, color: "bg-accent", desc: "Annual licenses", ctype: "third-party", classification: "opex", linkKind: "fixed", linkRef: "2025-05-01" },
    { c: "Business trips", cat: "Business Trips", b: 0.10, a: 0.07, color: "bg-rag-amber", desc: "Travel & accommodation", ctype: "internal", classification: "opex", linkKind: "milestone", linkRef: "Design Approved" },
    { c: "Contingency", cat: "Services", b: 0.60, a: 0.26, color: "bg-muted-foreground", desc: "Reserve", ctype: "internal", classification: "opex", linkKind: "fixed", linkRef: "" },
  ]);
  const [revEntries, setRevEntries] = useState<RevEntry[]>(isNew ? [] : [
    { ms: "Discovery complete", evt: "Advance payment (30%)",  plan: 0.96, date: "02 May",        s: "green", sl: "Received", act: 0.96, linkKind: "fixed",
      actuals: [{ amount: 0.60, date: "02 May", note: "Invoice INV-0012" }, { amount: 0.36, date: "21 May", note: "Invoice INV-0018" }] },
    { ms: "Build phase 1",      evt: "Progress invoice (20%)", plan: 0.64, date: "30 Jun",        s: "amber", sl: "Pending",  act: 0.20, linkKind: "fixed",
      actuals: [{ amount: 0.20, date: "04 Jul", note: "Partial settlement" }] },
    { ms: "UAT Sign-off",       evt: "Progress invoice (25%)", plan: 0.80, date: project.endDate, s: "blue",  sl: "Planned",  act: null, linkKind: "milestone" },
    { ms: "Go-live",            evt: "Final payment (25%)",    plan: 0.80, date: "14 Sep",        s: "blue",  sl: "Planned",  act: null, linkKind: "fixed" },
  ]);
  // Editing is governed by the single project-level baseline (see the project header).
  const displayCost = costEntries;
  const displayRev = revEntries;

  /** Cost/revenue dates linked to a milestone always follow the milestone's planned finish. */
  const milestoneEnd = useCallback(
    (name?: string) => milestones.find((m) => m.name === name)?.endDate ?? "",
    [milestones],
  );
  const costDate = useCallback(
    (e: CostEntry) => (e.linkKind === "milestone" ? milestoneEnd(e.linkRef) || e.linkRef || "—" : e.linkRef || "—"),
    [milestoneEnd],
  );
  const revDate = useCallback(
    (e: RevEntry) => (e.linkKind === "milestone" ? milestoneEnd(e.ms) || e.date || "—" : e.date || "—"),
    [milestoneEnd],
  );

  const costTotals = useMemo(() => {
    const planned = displayCost.reduce((s, e) => s + e.b, 0);
    const actual = displayCost.reduce((s, e) => s + e.a, 0);
    // Actuals are capped per line at the planned amount, so utilization never exceeds 100%.
    return { planned, actual, util: planned ? Math.min(100, Math.round((actual / planned) * 100)) : 0 };
  }, [displayCost]);
  const revTotals = useMemo(() => {
    const planned = displayRev.reduce((s, e) => s + e.plan, 0);
    const actual = displayRev.reduce((s, e) => s + (e.act ?? 0), 0);
    // Payments are capped per event at its planned amount, so collected never exceeds 100%.
    return { planned, actual, util: planned ? Math.min(100, Math.round((actual / planned) * 100)) : 0 };
  }, [displayRev]);

  /** Expected revenue entered at project setup; the revenue plan is reconciled against it. */
  const expectedRevenue = project.expectedRevenue ?? null;
  const revVariance = expectedRevenue != null ? revTotals.planned - expectedRevenue : 0;
  const revMismatch = expectedRevenue != null && Math.abs(revVariance) > 0.0001;

  const costCategoryNames = useMemo(() => DEFAULT_COST_CATEGORIES.map((c) => c.name), []);

  /* Cost breakdown search (by cost line name) + filters (category, CapEx/OpEx). */
  const [costQuery, setCostQuery] = useState("");
  const [costCatFilter, setCostCatFilter] = useState<string[]>([]);
  const [costTypeFilter, setCostTypeFilter] = useState("all");

  const costCatOptions = useMemo(() => {
    const present = displayCost.map((e) => e.cat ?? e.c).filter(Boolean) as string[];
    return Array.from(new Set([...costCategoryNames, ...present]));
  }, [costCategoryNames, displayCost]);

  /** Keep the original index so row actions still patch the right entry while filtered. */
  const filteredCost = useMemo(() => {
    const q = costQuery.trim().toLowerCase();
    return displayCost
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => {
        const name = (e.desc ?? e.c ?? "").toLowerCase();
        if (q && !name.includes(q)) return false;
        const cat = e.cat ?? e.c ?? "";
        if (costCatFilter.length > 0 && !costCatFilter.includes(cat)) return false;
        if (costTypeFilter !== "all") {
          const type = e.classification === "capex" ? "CapEx" : "OpEx";
          if (type !== costTypeFilter) return false;
        }
        return true;
      });
  }, [displayCost, costQuery, costCatFilter, costTypeFilter]);

  const costIdxMap = useMemo(() => filteredCost.map((x) => x.i), [filteredCost]);
  const costRows = useMemo(() => filteredCost.map((x) => x.e), [filteredCost]);

  /* Revenue breakdown search (by event name) + filters (status, actual payment date range). */
  const [revQuery, setRevQuery] = useState("");
  const [revStatusFilter, setRevStatusFilter] = useState("all");
  const [revDateFilter, setRevDateFilter] = useState<{ from: string; to: string }>({ from: "", to: "" });

  const filteredRev = useMemo(() => {
    const q = revQuery.trim().toLowerCase();
    const { from, to } = revDateFilter;
    const rangeActive = Boolean(from || to);
    return displayRev
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => {
        if (q && !(e.evt ?? "").toLowerCase().includes(q)) return false;
        if (revStatusFilter !== "all") {
          const collected = e.plan ? Math.min(100, Math.round(((e.act ?? 0) / e.plan) * 100)) : 0;
          if (revStatusOf(collected, revDate(e)).sl !== revStatusFilter) return false;
        }
        if (rangeActive) {
          const parseActualDate = (raw: string): Date | null => {
            /* Legacy display strings like "02 May" carry no year — assume the current one.
             * Checked first: new Date("02 May") parses as year 2001 in some engines. */
            const m = /^(\d{1,2})\s+([A-Za-z]{3,})$/.exec(raw.trim());
            if (m) {
              const d = new Date(`${m[2]} ${m[1]}, ${new Date().getFullYear()}`);
              return Number.isNaN(d.getTime()) ? null : d;
            }
            const iso = new Date(raw);
            return Number.isNaN(iso.getTime()) ? null : iso;
          };
          const actualDates = (e.actuals ?? (e.act != null ? [{ amount: e.act, date: e.date }] : []))
            .map((a) => parseActualDate(a.date))
            .filter((d): d is Date => d !== null);
          const inRange = actualDates.some((d) => {
            if (from && d < new Date(from)) return false;
            if (to) {
              const end = new Date(to); end.setHours(23, 59, 59, 999);
              if (d > end) return false;
            }
            return true;
          });
          if (!inRange) return false;
        }
        return true;
      });
  }, [displayRev, revQuery, revStatusFilter, revDateFilter, revDate]);

  const revIdxMap = useMemo(() => filteredRev.map((x) => x.i), [filteredRev]);
  const revRows = useMemo(() => filteredRev.map((x) => x.e), [filteredRev]);

  const addLinkDialog = (kind: "cost" | "revenue") => (
    <AddFinanceLinkDialog
      milestoneNames={milestoneNames}
      defaultType={kind}
      lockKind
      label={kind === "cost" ? "Add cost line" : "Add revenue line"}
      onAddCost={(e) => { setCostEntries((prev) => [...prev, e]); onDataAdded(); }}
      onAddRevenue={(e) => { setRevEntries((prev) => [...prev, e]); onDataAdded(); }}
    />
  );

  return (
    <div className="space-y-4">
      {isNew && (
        <EmptyState
          art="coins"
          title="No budget set up yet"
          description="Add cost items and — for client projects — the revenue plan for this project."
        />
      )}

      {mode === "cost" ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { l: "Total Budget", v: `$${project.budgetTotal.toFixed(1)}M` },
              { l: "Planned cost", v: `$${costTotals.planned.toFixed(2)}M` },
              { l: "Actual spent", v: `$${costTotals.actual.toFixed(2)}M` },
              { l: "Utilization", v: `${costTotals.util}%`, c: costTotals.util > 100 ? "text-rag-red" : costTotals.util > 85 ? "text-rag-amber" : "text-rag-green" },
            ].map((k) => {
              // Utilization turns red when actual spend has exceeded the planned budget.
              const isUtilRed = k.l === "Utilization" && costTotals.util > 100;
              return (
              <div key={k.l} className="glass-card p-4">
                <div className="label-eyebrow">{k.l}</div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
                  </TooltipTrigger>
                  {isUtilRed && (
                    <TooltipContent>Actual is more than the planned</TooltipContent>
                  )}
                </Tooltip>
              </div>
              );
            })}
          </div>

          <div>
            <PageToolbar
              query={costQuery}
              onQueryChange={setCostQuery}
              placeholder="Search Cost line name…"
              filterGroups={[
                {
                  key: "category",
                  label: "Categories",
                  mode: "multi",
                  value: costCatFilter,
                  onChange: setCostCatFilter,
                  options: [{ value: "all", label: "All categories" }, ...costCatOptions.map((c) => ({ value: c, label: c }))],
                },
                capexOpexGroup(costTypeFilter, setCostTypeFilter),
              ]}
              trailing={canEdit ? addLinkDialog("cost") : undefined}
            />
            <CostBreakdownTable
              entries={costRows}
              canEdit={canEdit}
              categories={costCategoryNames}
              milestoneNames={milestoneNames}
              dateOf={costDate}
              totals={costTotals}
              onMilestoneClick={onMilestoneClick}
              onSave={(rowIdx, patch) => { const idx = costIdxMap[rowIdx]; setCostEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e))); }}
              onDelete={(rowIdx) => { const idx = costIdxMap[rowIdx]; setCostEntries((prev) => prev.filter((_, i) => i !== idx)); }}
              onAddActual={(rowIdx, actual) => {
                const idx = costIdxMap[rowIdx];
                setCostEntries((prev) =>
                  prev.map((e, i) => {
                    if (i !== idx) return e;
                    const actuals = [...(e.actuals ?? (e.a > 0 ? [{ amount: e.a, date: "—", note: "Opening actual" }] : [])), actual];
                    return { ...e, actuals, a: actuals.reduce((s, x) => s + x.amount, 0) };
                  }),
                );
              }}
              onEditActual={(rowIdx, actualIdx, patch) => {
                const idx = costIdxMap[rowIdx];
                setCostEntries((prev) =>
                  prev.map((e, i) => {
                    if (i !== idx) return e;
                    const actuals = e.actuals ?? (e.a > 0 ? [{ amount: e.a, date: "—", note: "Opening actual" }] : []);
                    const updated = actuals.map((a, ai) => (ai === actualIdx ? { ...a, ...patch } : a));
                    return { ...e, actuals: updated, a: updated.reduce((s, x) => s + x.amount, 0) };
                  }),
                );
              }}
              onDeleteActual={(rowIdx, actualIdx) => {
                const idx = costIdxMap[rowIdx];
                setCostEntries((prev) =>
                  prev.map((e, i) => {
                    if (i !== idx) return e;
                    const actuals = e.actuals ?? (e.a > 0 ? [{ amount: e.a, date: "—", note: "Opening actual" }] : []);
                    const updated = actuals.filter((_, ai) => ai !== actualIdx);
                    return { ...e, actuals: updated, a: updated.reduce((s, x) => s + x.amount, 0) };
                  }),
                );
              }}
            />
          </div>
        </div>

      ) : (
          <div className="space-y-4">
            <div className={`grid gap-3 ${expectedRevenue != null ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
              {[
                ...(expectedRevenue != null
                  ? [{ l: "Expected revenue", v: `$${expectedRevenue.toFixed(2)}M`, n: "Entered at project setup" }]
                  : []),
                {
                  l: "Planned in revenue plan",
                  v: `$${revTotals.planned.toFixed(2)}M`,
                  c: revMismatch ? "text-rag-amber" : undefined,
                  n: revMismatch
                    ? `${revVariance > 0 ? "Over" : "Under"} expected revenue by $${Math.abs(revVariance).toFixed(2)}M`
                    : expectedRevenue != null
                      ? "Matches expected revenue"
                      : undefined,
                },
                { l: "Received", v: `$${revTotals.actual.toFixed(2)}M` },
                { l: "Collected", v: `${revTotals.util}%`, c: revTotals.util >= 100 ? "text-rag-green" : "text-rag-amber" },
              ].map((k) => (
                <div key={k.l} className="glass-card p-4">
                  <div className="label-eyebrow">{k.l}</div>
                  <div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
                  {k.n && <div className={`mt-1 text-[11px] ${revMismatch && k.l === "Planned in revenue plan" ? "text-rag-amber" : "text-muted-foreground"}`}>{k.n}</div>}
                </div>
              ))}
            </div>


            <div>
              <PageToolbar
                query={revQuery}
                onQueryChange={setRevQuery}
                placeholder="Search by event name…"
                filterGroups={[
                  {
                    key: "status",
                    label: "Status",
                    value: revStatusFilter,
                    onChange: setRevStatusFilter,
                    options: [
                      { value: "all", label: "All statuses" },
                      ...REV_STATUSES.map((s) => ({ value: s.sl, label: s.sl })),
                    ],
                  },
                  {
                    key: "date",
                    label: "Actual date",
                    mode: "daterange",
                    value: revDateFilter,
                    onChange: setRevDateFilter,
                  },
                ]}
                trailing={canEdit ? addLinkDialog("revenue") : undefined}
              />
              <RevenuePlanTable
                entries={revRows}
                canEdit={canEdit}
                milestoneNames={milestoneNames}
                dateOf={revDate}
                totals={revTotals}
                onMilestoneClick={onMilestoneClick}
                onSave={(rowIdx, patch) => { const idx = revIdxMap[rowIdx]; setRevEntries((prev) => prev.map((e, i) => i === idx ? { ...e, ...patch } : e)); }}
                onDelete={(rowIdx) => { const idx = revIdxMap[rowIdx]; setRevEntries((prev) => prev.filter((_, i) => i !== idx)); }}
                onAddActual={(rowIdx, actual) => {
                  const idx = revIdxMap[rowIdx];
                  setRevEntries((prev) =>
                    prev.map((e, i) => {
                      if (i !== idx) return e;
                      const actuals = [...(e.actuals ?? (e.act != null ? [{ amount: e.act, date: e.date }] : [])), actual];
                      const total = actuals.reduce((s, x) => s + x.amount, 0);
                      const collected = e.plan ? total / e.plan : 0;
                      const status = collected >= 1 ? REV_STATUSES[2] : REV_STATUSES[1];
                      return { ...e, actuals, act: total, s: status.s, sl: status.sl };
                    }),
                  );
                }}
                onEditActual={(rowIdx, actualIdx, patch) => {
                  const idx = revIdxMap[rowIdx];
                  setRevEntries((prev) =>
                    prev.map((e, i) => {
                      if (i !== idx) return e;
                      const actuals = e.actuals ?? (e.act != null ? [{ amount: e.act, date: e.date }] : []);
                      const updated = actuals.map((a, ai) => (ai === actualIdx ? { ...a, ...patch } : a));
                      const total = updated.reduce((s, x) => s + x.amount, 0);
                      const collected = e.plan ? total / e.plan : 0;
                      const status = collected >= 1 ? REV_STATUSES[2] : REV_STATUSES[1];
                      return { ...e, actuals: updated, act: total, s: status.s, sl: status.sl };
                    }),
                  );
                }}
                onDeleteActual={(rowIdx, actualIdx) => {
                  const idx = revIdxMap[rowIdx];
                  setRevEntries((prev) =>
                    prev.map((e, i) => {
                      if (i !== idx) return e;
                      const actuals = e.actuals ?? (e.act != null ? [{ amount: e.act, date: e.date }] : []);
                      const updated = actuals.filter((_, ai) => ai !== actualIdx);
                      const total = updated.reduce((s, x) => s + x.amount, 0);
                      const collected = e.plan ? total / e.plan : 0;
                      const status = total === 0 ? REV_STATUSES[0] : collected >= 1 ? REV_STATUSES[2] : REV_STATUSES[1];
                      return { ...e, actuals: updated, act: updated.length > 0 ? total : null, s: status.s, sl: status.sl };
                    }),
                  );
                }}
              />
            </div>
          </div>
      )}
    </div>
  );
}

/** Revenue plan with one row per planned event; expanding a row reveals its logged actuals. */
function RevenuePlanTable({
  entries, canEdit, milestoneNames, dateOf, totals, onSave, onDelete, onAddActual, onEditActual, onDeleteActual, onMilestoneClick,
}: {
  entries: RevEntry[];
  canEdit: boolean;
  milestoneNames: string[];
  dateOf: (e: RevEntry) => string;
  totals: { planned: number; actual: number; util: number };
  onSave: (idx: number, patch: Partial<RevEntry>) => void;
  onDelete: (idx: number) => void;
  onAddActual: (idx: number, actual: ActualEntry) => void;
  onEditActual: (idx: number, actualIdx: number, patch: ActualEntry) => void;
  onDeleteActual: (idx: number, actualIdx: number) => void;
  onMilestoneClick?: (name: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [pendingDeleteIdx, setPendingDeleteIdx] = useState<number | null>(null);
  const [editingActual, setEditingActual] = useState<{ rowIdx: number; actualIdx: number } | null>(null);
  const [pendingDeleteActual, setPendingDeleteActual] = useState<{ rowIdx: number; actualIdx: number } | null>(null);

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent bg-transparent border-0">
          <TableHead className="w-8" />
          <TableHead>Revenue event</TableHead>
          <TableHead className="text-right">Planned ($M)</TableHead>
          <TableHead className="text-right">Actual ($M)</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Collected</TableHead>
          <TableHead>Linked to</TableHead>
          <TableHead>Expected date</TableHead>
          <TableHead className="w-32" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((r, idx) => {
          const actuals = r.actuals ?? (r.act != null ? [{ amount: r.act, date: r.date }] : []);
          const actual = actuals.reduce((s, a) => s + a.amount, 0);
          // Payments may never exceed the event's planned amount, so collected is capped at 100%.
          const util = r.plan ? Math.min(100, Math.round((actual / r.plan) * 100)) : 0;
          const remaining = Math.max(0, r.plan - actual);
          const overPlanMessage = (amt: number, allowed: number) =>
            amt > allowed + 0.0001
              ? `Total payments can't exceed the planned $${r.plan.toFixed(2)}M. This payment can be at most $${allowed.toFixed(2)}M — increase the Planned amount to record more.`
              : null;
          const open = expanded.has(r.ms);
          const linkedMs = r.linkKind === "milestone" && milestoneNames.includes(r.ms) ? r.ms : undefined;
          return (
            <Fragment key={r.ms}>
              <TableRow
                className={`bg-table-row-bg border-0 ${actuals.length > 0 ? "cursor-pointer" : ""}`}
                data-state={open ? "selected" : undefined}
                onClick={actuals.length > 0 ? () => toggle(r.ms) : undefined}
              >
                <TableCell onClick={(ev) => ev.stopPropagation()}>
                  {actuals.length > 0 && (
                    <Button
                      type="button" variant="ghost" size="icon"
                      aria-label={open ? "Collapse actuals" : "Expand actuals"}
                      aria-expanded={open}
                      onClick={() => toggle(r.ms)}
                      className="h-7 w-7 rounded-md text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                    >
                      {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{r.evt}</TableCell>
                <TableCell className="num-mono text-right">${r.plan.toFixed(2)}M</TableCell>
                <TableCell className="num-mono text-right">{actual > 0 ? `$${actual.toFixed(2)}M` : "—"}</TableCell>
                <TableCell><RagBadge rag={r.s as any} label={r.sl} /></TableCell>
                <TableCell className={`num-mono text-right ${util >= 100 ? "text-rag-green" : util > 0 ? "text-rag-amber" : "text-muted-foreground"}`}>{util}%</TableCell>
                <TableCell className="text-xs" onClick={(ev) => ev.stopPropagation()}>
                  {linkedMs ? (
                    <button
                      type="button"
                      onClick={() => onMilestoneClick?.(linkedMs)}
                      title={`View “${linkedMs}” in Project Schedule`}
                      className="inline-flex items-center gap-1.5 rounded bg-accent/15 px-1.5 py-0.5 text-[11px] text-accent hover:bg-accent/25"
                    >
                      {r.ms}
                    </button>
                  ) : (
                    <span className="inline-flex items-center rounded bg-secondary/40 px-1.5 py-0.5 text-[11px] text-muted-foreground">Fixed date</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDateForDisplay(dateOf(r))}</TableCell>
                <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
                  {/* Logging an actual stays available after baseline lock; re-planning does not. */}
                  <TableRowActions
                    onEdit={canEdit ? () => setEditingIdx(idx) : undefined}
                    onDelete={canEdit ? () => setPendingDeleteIdx(idx) : undefined}
                    extraActions={
                      <AddActualDialog
                        title="Add revenue recognition"
                        validateAmount={(amt) => overPlanMessage(amt, remaining)}
                        onAdd={(a) => { onAddActual(idx, a); setExpanded((prev) => new Set(prev).add(r.ms)); }}
                      />
                    }
                  />
                </TableCell>
              </TableRow>
              {open && (
                <TableRow className="bg-transparent hover:bg-transparent border-0 [&>td]:!bg-transparent hover:[&>td]:!bg-transparent">
                  <TableCell colSpan={9} className="px-4 pb-3 pt-1">
                    <div className="ml-4 border-l border-border pl-3">
                      {/* Expanded nested actual-spend table uses Gray 600 (#45464F) fill. */}
                      <div className="overflow-hidden rounded-lg bg-p-neutral-600">
                        <div className="grid grid-cols-[minmax(220px,1fr)_180px_150px_108px] items-center border-b border-black/20 px-5 py-3 text-xs font-medium text-foreground">
                          <span>Actual payment</span>
                          <span>Date</span>
                          <span className="text-right">Amount ($M)</span>
                          <span className="sr-only">Actions</span>
                        </div>
                        {actuals.map((a, i) => (
                          <div
                            key={`${r.ms}-a${i}`}
                            className="grid grid-cols-[minmax(220px,1fr)_180px_150px_108px] items-center px-5 py-3 text-xs text-muted-foreground transition-colors hover:bg-p-charcoal-400"
                          >
                            <span className="text-foreground">
                              {a.name ?? "Actual payment"}{a.note && a.note !== a.name ? ` — ${a.note}` : ""}
                            </span>
                            <span>{formatDateForDisplay(a.date)}</span>
                            <span className="num-mono text-right text-foreground">${a.amount.toFixed(2)}M</span>
                            <span className="flex justify-end">
                              {/* Editing/removing a logged actual is bookkeeping, not re-planning — always available. */}
                              <TableRowActions
                                onEdit={() => setEditingActual({ rowIdx: idx, actualIdx: i })}
                                onDelete={() => setPendingDeleteActual({ rowIdx: idx, actualIdx: i })}
                              />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
        {entries.length > 0 && (
          <TableRow className="bg-transparent hover:bg-transparent border-0">
            <TableCell />
            <TableCell className="text-xs uppercase tracking-wide text-muted-foreground">Total</TableCell>
            <TableCell className="num-mono text-right font-medium">${totals.planned.toFixed(2)}M</TableCell>
            <TableCell className="num-mono text-right font-medium">${totals.actual.toFixed(2)}M</TableCell>
            <TableCell />
            <TableCell className="num-mono text-right font-medium">{totals.util}%</TableCell>
            <TableCell colSpan={3} />
          </TableRow>
        )}
      </TableBody>
    </Table>
    <EditRevenueRowDialog
      entry={editingIdx !== null ? entries[editingIdx] : null}
      milestoneNames={milestoneNames}
      onOpenChange={(o) => !o && setEditingIdx(null)}
      onSave={(patch) => { if (editingIdx !== null) onSave(editingIdx, patch); setEditingIdx(null); }}
    />
    <ConfirmDeleteDialog
        description="This entry will be removed from the plan."
      label={pendingDeleteIdx !== null ? entries[pendingDeleteIdx]?.ms : undefined}
      onCancel={() => setPendingDeleteIdx(null)}
      onConfirm={() => {
        if (pendingDeleteIdx !== null) { onDelete(pendingDeleteIdx); toast.done("Revenue line", "deleted"); }
        setPendingDeleteIdx(null);
      }}
    />
    <EditActualDialog
      entry={editingActual
        ? (entries[editingActual.rowIdx]?.actuals ?? (entries[editingActual.rowIdx]?.act != null
            ? [{ amount: entries[editingActual.rowIdx].act ?? 0, date: entries[editingActual.rowIdx].date }]
            : []))[editingActual.actualIdx] ?? null
        : null}
      validateAmount={(amt) => {
        if (!editingActual) return null;
        const row = entries[editingActual.rowIdx];
        if (!row) return null;
        const rowActuals = row.actuals ?? (row.act != null ? [{ amount: row.act, date: row.date }] : []);
        const others = rowActuals.reduce((s, a, ai) => (ai === editingActual.actualIdx ? s : s + a.amount), 0);
        const allowed = Math.max(0, row.plan - others);
        return amt > allowed + 0.0001
          ? `Total payments can't exceed the planned $${row.plan.toFixed(2)}M. This payment can be at most $${allowed.toFixed(2)}M — increase the Planned amount to record more.`
          : null;
      }}
      onOpenChange={(o) => !o && setEditingActual(null)}
      onSave={(patch) => {
        if (editingActual) onEditActual(editingActual.rowIdx, editingActual.actualIdx, patch);
        setEditingActual(null);
      }}
    />
    <ConfirmDeleteDialog
        description="This entry will be removed from the plan."
      label={pendingDeleteActual ? (entries[pendingDeleteActual.rowIdx]?.actuals?.[pendingDeleteActual.actualIdx]?.name ?? "this actual") : undefined}
      onCancel={() => setPendingDeleteActual(null)}
      onConfirm={() => {
        if (pendingDeleteActual) { onDeleteActual(pendingDeleteActual.rowIdx, pendingDeleteActual.actualIdx); toast.done("Actual", "deleted"); }
        setPendingDeleteActual(null);
      }}
    />
    </>
  );
}

/** Cost breakdown with one row per planned item; expanding a row reveals its logged actual expenses. */
function CostBreakdownTable({
  entries, canEdit, categories, milestoneNames, dateOf, totals, onSave, onDelete, onAddActual, onEditActual, onDeleteActual, onMilestoneClick,
}: {
  entries: CostEntry[];
  canEdit: boolean;
  categories: string[];
  milestoneNames: string[];
  dateOf: (e: CostEntry) => string;
  totals: { planned: number; actual: number; util: number };
  onSave: (idx: number, patch: Partial<CostEntry>) => void;
  onDelete: (idx: number) => void;
  onAddActual: (idx: number, actual: ActualEntry) => void;
  onEditActual: (idx: number, actualIdx: number, patch: ActualEntry) => void;
  onDeleteActual: (idx: number, actualIdx: number) => void;
  onMilestoneClick?: (name: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggle = (key: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [pendingDeleteIdx, setPendingDeleteIdx] = useState<number | null>(null);
  const [editingActual, setEditingActual] = useState<{ rowIdx: number; actualIdx: number } | null>(null);
  const [pendingDeleteActual, setPendingDeleteActual] = useState<{ rowIdx: number; actualIdx: number } | null>(null);

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent bg-transparent border-0">
          <TableHead className="w-8" />
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Planned ($M)</TableHead>
          <TableHead className="text-right">Actual ($M)</TableHead>
          <TableHead className="text-right">Utilization</TableHead>
          <TableHead>Linked to</TableHead>
          <TableHead>Date</TableHead>

          <TableHead className="w-32" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e, idx) => {
          const actuals = e.actuals ?? (e.a > 0 ? [{ amount: e.a, date: dateOf(e), note: "Opening actual" }] : []);
          const actual = actuals.reduce((s, a) => s + a.amount, 0);
          // Actuals may never exceed the planned amount, so utilization is capped at 100%.
          const util = e.b ? Math.min(100, Math.round((actual / e.b) * 100)) : 0;
          const remaining = Math.max(0, (e.b ?? 0) - actual);
          const overPlanMessage = (amt: number, allowed: number) =>
            amt > allowed + 0.0001
              ? `Total actuals can't exceed the planned $${(e.b ?? 0).toFixed(2)}M. This actual can be at most $${allowed.toFixed(2)}M — increase the Planned amount to record more.`
              : null;
           const open = expanded.has(idx);
          const linkedMs = e.linkKind === "milestone" && e.linkRef && milestoneNames.includes(e.linkRef) ? e.linkRef : undefined;
          // A planned cost line that already has logged (paid) actuals cannot be deleted — only its plan changed.
          const hasPaidActuals = actuals.length > 0 && actuals.some((a) => a.amount > 0);
          const requestDelete = hasPaidActuals
            ? () => toast.error("This line already has paid actuals. Remove the actuals before deleting the plan.", { title: "Cannot delete cost line" })
            : canEdit ? () => setPendingDeleteIdx(idx) : undefined;
          return (
            <Fragment key={`${e.c}-${idx}`}>
              <TableRow
                className={`bg-table-row-bg border-0 ${actuals.length > 0 ? "cursor-pointer" : ""}`}
                data-state={open ? "selected" : undefined}
                onClick={actuals.length > 0 ? () => toggle(idx) : undefined}
              >
                <TableCell onClick={(ev) => ev.stopPropagation()}>
                  {actuals.length > 0 && (
                    <Button
                      type="button" variant="ghost" size="icon"
                      aria-label={open ? "Collapse actuals" : "Expand actuals"}
                      aria-expanded={open}
                      onClick={() => toggle(idx)}
                      className="h-7 w-7 rounded-md text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                    >
                      {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{e.desc ?? "—"}</TableCell>
                <TableCell className="font-medium text-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    {e.cat ?? e.c}
                    {e.classification && (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase leading-none ${e.classification === "capex" ? "bg-accent/15 text-accent" : "bg-secondary/40 text-muted-foreground"}`}>
                        {e.classification === "capex" ? "Capex" : "Opex"}
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="num-mono text-right">${e.b.toFixed(2)}M</TableCell>
                <TableCell className="num-mono text-right">{actual > 0 ? `$${actual.toFixed(2)}M` : "—"}</TableCell>
                <TableCell className={`num-mono text-right ${util > 100 ? "text-rag-red" : util > 85 ? "text-rag-amber" : "text-rag-green"}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-default">{util}%</span>
                    </TooltipTrigger>
                    {util > 100 && (
                      <TooltipContent>Actual is more than the planned</TooltipContent>
                    )}
                  </Tooltip>
                </TableCell>
                <TableCell className="text-xs" onClick={(ev) => ev.stopPropagation()}>
                  {e.linkKind === "milestone" && e.linkRef ? (
                    <button
                      type="button"
                      onClick={() => onMilestoneClick?.(e.linkRef ?? "")}
                      title={`View “${e.linkRef}” in Project Schedule`}
                      className="inline-flex items-center rounded bg-accent/15 px-1.5 py-0.5 text-[11px] text-accent hover:bg-accent/25"
                    >
                      {e.linkRef}
                    </button>
                  ) : (
                    <span className="inline-flex items-center rounded bg-secondary/40 px-1.5 py-0.5 text-[11px] text-muted-foreground">Fixed date</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDateForDisplay(dateOf(e))}</TableCell>

                <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
                  {/* Logging an actual expense stays available after baseline lock; re-planning does not. */}
                  <TableRowActions
                    onEdit={canEdit ? () => setEditingIdx(idx) : undefined}
                    onDelete={requestDelete}
                    extraActions={
                      <AddActualDialog
                        title="Add actual spend"
                        validateAmount={(amt) => overPlanMessage(amt, remaining)}
                         onAdd={(a) => { onAddActual(idx, a); setExpanded((prev) => new Set(prev).add(idx)); }}
                      />
                    }
                  />
                </TableCell>
              </TableRow>
              {open && (
                <TableRow className="bg-transparent hover:bg-transparent border-0 [&>td]:!bg-transparent hover:[&>td]:!bg-transparent">
                  <TableCell colSpan={9} className="px-4 pb-3 pt-1">
                    <div className="ml-4 border-l border-border pl-3">
                      {/* Expanded nested actual-spend table uses Gray 600 (#45464F) fill. */}
                      <div className="overflow-hidden rounded-lg bg-p-neutral-600">
                        <div className="grid grid-cols-[minmax(220px,1fr)_180px_150px_108px] items-center border-b border-black/20 px-5 py-3 text-xs font-medium text-foreground">
                          <span>Actual spend</span>
                          <span>Date</span>
                          <span className="text-right">Amount ($M)</span>
                          <span className="sr-only">Actions</span>
                        </div>
                        {actuals.map((a, i) => (
                          <div
                            key={`${e.c}-a${i}`}
                            className="grid grid-cols-[minmax(220px,1fr)_180px_150px_108px] items-center px-5 py-3 text-xs text-muted-foreground transition-colors hover:bg-p-charcoal-400"
                          >
                            <span className="text-foreground">
                              {a.name ?? "Actual spend"}{a.note && a.note !== a.name ? ` — ${a.note}` : ""}
                            </span>
                            <span>{formatDateForDisplay(a.date)}</span>
                            <span className="num-mono text-right text-foreground">${a.amount.toFixed(2)}M</span>
                            <span className="flex justify-end">
                              {/* Editing/removing a logged actual is bookkeeping, not re-planning — always available. */}
                              <TableRowActions
                                onEdit={() => setEditingActual({ rowIdx: idx, actualIdx: i })}
                                onDelete={() => setPendingDeleteActual({ rowIdx: idx, actualIdx: i })}
                              />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
    <EditCostRowDialog
      entry={editingIdx !== null ? entries[editingIdx] : null}
      categories={categories}
      milestoneNames={milestoneNames}
      onOpenChange={(o) => !o && setEditingIdx(null)}
      onSave={(patch) => { if (editingIdx !== null) onSave(editingIdx, patch); setEditingIdx(null); }}
    />
    <ConfirmDeleteDialog
        description="This entry will be removed from the plan."
      label={pendingDeleteIdx !== null ? entries[pendingDeleteIdx]?.c : undefined}
      onCancel={() => setPendingDeleteIdx(null)}
      onConfirm={() => {
        if (pendingDeleteIdx !== null) { onDelete(pendingDeleteIdx); toast.done("Cost line", "deleted"); }
        setPendingDeleteIdx(null);
      }}
    />
    <EditActualDialog
      entry={editingActual
        ? (entries[editingActual.rowIdx]?.actuals ?? (entries[editingActual.rowIdx]?.a > 0
            ? [{ amount: entries[editingActual.rowIdx].a, date: "—", note: "Opening actual" }]
            : []))[editingActual.actualIdx] ?? null
        : null}
      validateAmount={(amt) => {
        if (!editingActual) return null;
        const row = entries[editingActual.rowIdx];
        if (!row) return null;
        const rowActuals = row.actuals ?? (row.a > 0 ? [{ amount: row.a, date: "—", note: "Opening actual" }] : []);
        const others = rowActuals.reduce((s, a, ai) => (ai === editingActual.actualIdx ? s : s + a.amount), 0);
        const allowed = Math.max(0, (row.b ?? 0) - others);
        return amt > allowed + 0.0001
          ? `Total actuals can't exceed the planned $${(row.b ?? 0).toFixed(2)}M. This actual can be at most $${allowed.toFixed(2)}M — increase the Planned amount to record more.`
          : null;
      }}
      onOpenChange={(o) => !o && setEditingActual(null)}
      onSave={(patch) => {
        if (editingActual) onEditActual(editingActual.rowIdx, editingActual.actualIdx, patch);
        setEditingActual(null);
      }}
    />
    <ConfirmDeleteDialog
        description="This entry will be removed from the plan."
      label={pendingDeleteActual ? (entries[pendingDeleteActual.rowIdx]?.actuals?.[pendingDeleteActual.actualIdx]?.name ?? "this actual") : undefined}
      onCancel={() => setPendingDeleteActual(null)}
      onConfirm={() => {
        if (pendingDeleteActual) { onDeleteActual(pendingDeleteActual.rowIdx, pendingDeleteActual.actualIdx); toast.done("Actual", "deleted"); }
        setPendingDeleteActual(null);
      }}
    />
    </>
  );
}



const REV_STATUSES: { s: string; sl: string }[] = [
  { s: "blue", sl: "Planned" },
  { s: "amber", sl: "Pending" },
  { s: "green", sl: "Received" },
  { s: "red", sl: "Overdue" },
];

/** Accepts ISO dates and legacy display strings like "02 May" (no year — assume the current one). */
function parseRevDate(raw: string): Date | null {
  if (!raw) return null;
  const m = /^(\d{1,2})\s+([A-Za-z]{3,})$/.exec(raw.trim());
  if (m) {
    const d = new Date(`${m[2]} ${m[1]}, ${new Date().getFullYear()}`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const iso = new Date(raw);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

/**
 * Revenue status is derived from collection and the expected date, never stored:
 * fully collected → Received; expected date passed while short → Overdue.
 */
function revStatusOf(collectedPct: number, expectedDate: string): { s: string; sl: string } {
  if (collectedPct >= 100) return REV_STATUSES[2];
  const due = parseRevDate(expectedDate);
  if (due && due.getTime() < Date.now()) return REV_STATUSES[3];
  return collectedPct > 0 ? REV_STATUSES[1] : REV_STATUSES[0];
}

function EditRevenueRowDialog({
  entry, milestoneNames, onOpenChange, onSave,
}: {
  entry: RevEntry | null;
  milestoneNames: string[];
  onOpenChange: (open: boolean) => void;
  onSave: (patch: Partial<RevEntry>) => void;
}) {
  const [evt, setEvt] = useState(entry?.evt ?? "");
  const [plan, setPlan] = useState(entry ? String(entry.plan) : "");
  const [linkKind, setLinkKind] = useState<"milestone" | "fixed">(entry?.linkKind === "milestone" ? "milestone" : "fixed");
  const [linkMs, setLinkMs] = useState(entry?.linkKind === "milestone" ? entry.ms : "");
  const [linkDate, setLinkDate] = useState(entry?.linkKind === "fixed" ? entry.date : "");
  const [label, setLabel] = useState(entry?.linkKind === "fixed" ? entry.ms : "");

  useEffect(() => {
    if (!entry) return;
    setEvt(entry.evt);
    setPlan(String(entry.plan));
    setLinkKind(entry.linkKind === "milestone" ? "milestone" : "fixed");
    setLinkMs(entry.linkKind === "milestone" ? entry.ms : "");
    setLinkDate(entry.linkKind === "fixed" ? entry.date : "");
    setLabel(entry.linkKind === "fixed" ? entry.ms : "");
  }, [entry]);

  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit revenue line</DialogTitle>
          <DialogDescription>Link this revenue event to a milestone or a fixed date.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Revenue event</Label>
            <Input value={evt} onChange={(e) => setEvt(e.target.value)} placeholder="e.g. Progress invoice (15%)" />
          </div>
          <div>
            <Label>Planned amount ($M)</Label>
            <Input type="number" min={0} step={0.01} value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="0.50" />
          </div>
          <div>
            <Label>Link to</Label>
            <RadioGroup
              value={linkKind}
              onValueChange={(v) => {
                setLinkKind(v as typeof linkKind);
                // Switching modes clears the previous link target, like the create form.
                if (v === "milestone") { setLinkDate(""); setLabel(""); } else { setLinkMs(""); }
              }}
              className="flex gap-4 pt-1"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="milestone" id="edit-link-ms" />
                <Label htmlFor="edit-link-ms" className="cursor-pointer font-normal">Milestone (Dynamic)</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="fixed" id="edit-link-fixed" />
                <Label htmlFor="edit-link-fixed" className="cursor-pointer font-normal">Fixed Date</Label>
              </div>
            </RadioGroup>
          </div>
          {linkKind === "fixed" && (
            <div><Label>Due Date</Label><DatePicker value={linkDate} onChange={setLinkDate} placeholder="Pick due date" /></div>
          )}
          {linkKind === "fixed" && (
            <div><Label>Label (optional)</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Advance payment" /></div>
          )}
          {linkKind === "milestone" && (
            <div>
              <Label>Milestone</Label>
              <Select value={linkMs} onValueChange={setLinkMs}>
                <SelectTrigger><SelectValue placeholder="Select milestone…" /></SelectTrigger>
                <SelectContent>
                  {milestoneNames.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No milestones yet</div>
                  ) : milestoneNames.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              const p = parseFloat(plan);
              if (!evt.trim()) { toast.error("Revenue event is required"); return; }
              if (isNaN(p)) { toast.error("Planned amount is required"); return; }
              // Collected can never exceed 100%, so Planned cannot drop below what is already received.
              const logged = (entry?.actuals ?? (entry?.act != null ? [{ amount: entry.act, date: entry.date }] : []))
                .reduce((s, a) => s + a.amount, 0);
              if (p + 0.0001 < logged) {
                toast.error(`$${logged.toFixed(2)}M is already received on this event. Planned can't be lower than that.`, { title: "Planned amount too low" });
                return;
              }
              if (linkKind === "fixed" && !linkDate) { toast.error("Please pick a date"); return; }
              if (linkKind === "milestone" && !linkMs) { toast.error("Please pick a milestone"); return; }
              onSave({
                ms: linkKind === "milestone" ? linkMs : (label.trim() || "Revenue"),
                evt: evt.trim(),
                plan: p,
                date: linkKind === "fixed" ? linkDate : "Linked",
                linkKind,
              });
              onOpenChange(false);
              toast.done("Revenue line", "updated");
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
        <Button size="sm" variant="primary">
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
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>
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
  /** Additional cost links (a task can carry several cost items). */
  extraPayments?: PaymentLink[];

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
  /** Synthetic approval gate task (auto-generated, never persisted). */
  isApprovalTask?: boolean;
  /** Gate unlocked — every sibling leaf task reached 100%. */
  approvalReady?: boolean;
  dependencies?: any[];
  /** Dates were moved by a dependency change and not yet submitted for approval. */
  depDateShift?: boolean;
  /** Baseline snapshot — locked version after approval. Milestone only. */
  baseline?: { version: number; createdAt: string; baselineStart: string; baselineEnd: string; baselineProgress: number; isLocked: boolean };
  /** Version history for change requests. */
  versions?: Array<{ version: number; createdAt: string; change?: string; approvedBy?: string }>;
};

type Trip = { id: string; purpose: string; dest: string; dates: string; travelers: string; cost: string; rag: Rag; status: string };
type CostBreakdownItem = { name: string; amount: number; note?: string };
/** One logged actual (payment received, or expense incurred) under a planned item. */
type ActualEntry = { name?: string; amount: number; date: string; note?: string };
type CostEntry = {
  c: string; b: number; a: number; color: string;
  /** Cost category from Organization master data. */
  cat?: string;
  desc?: string;
  ctype?: "internal" | "third-party";
  classification?: "capex" | "opex";
  linkKind?: "fixed" | "milestone";
  linkRef?: string; // ISO date OR milestone name
  breakdown?: CostBreakdownItem[];
  /** Individual actual expenses logged against this planned cost item. */
  actuals?: ActualEntry[];
};
type RevEntry = {
  ms: string; evt: string; plan: number; date: string; s: string; sl: string; act: number | null;
  linkKind?: "fixed" | "milestone";
  /** Individual actual payments logged against this planned event. */
  actuals?: ActualEntry[];
};
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
export const APPROVAL_TASK_PREFIX = "Approval — ";

/** One item whose planned dates move because of a dependency change. */
export type DepImpact = { name: string; oldStart: string; oldEnd: string; start: string; end: string };

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
function daysBetweenISO(a: string, b: string) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86400000);
}

/**
 * Which planned dates move when the dependencies of one item change.
 * The item is pulled to the latest start its predecessors allow (relation + signed
 * lag), and every downstream successor shifts by the same number of days so the
 * user can see the knock-on effect before saving.
 */
/** Every task that names `targetName` as one of its own predecessors. */
export function getSuccessors<T extends { name: string; dependencies?: { predecessor: string }[] }>(
  items: T[],
  targetName: string,
): T[] {
  return items.filter((it) => (it.dependencies ?? []).some((d) => d.predecessor === targetName));
}

export function computeDependencyImpact(
  items: { name: string; startDate: string; endDate: string; dependencies?: any[] }[],
  targetName: string,
  deps: any[],
): DepImpact[] {
  const byName = new Map(items.map((i) => [i.name, i]));
  const target = byName.get(targetName);
  if (!target || !ISO_RE.test(target.startDate) || !ISO_RE.test(target.endDate)) return [];
  const targetDur = daysBetweenISO(target.endDate, target.startDate);

  let requiredStart: string | undefined;
  for (const d of deps) {
    const p = byName.get(d.predecessor);
    if (!p || !ISO_RE.test(p.startDate) || !ISO_RE.test(p.endDate)) continue;
    const lag = depLag(d);
    let start: string | undefined;
    if (d.relation === "FS") start = addDaysISO(p.endDate, 1 + lag);
    else if (d.relation === "SS") start = addDaysISO(p.startDate, lag);
    else if (d.relation === "FF") start = addDaysISO(p.endDate, lag - targetDur);
    else if (d.relation === "SF") start = addDaysISO(p.startDate, lag - targetDur);
    if (start && (!requiredStart || start > requiredStart)) requiredStart = start;
  }
  if (!requiredStart) return [];
  const delta = daysBetweenISO(requiredStart, target.startDate);
  if (delta === 0) return [];

  // Everything that depends (directly or transitively) on the target moves with it.
  const moving = new Set<string>([targetName]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const it of items) {
      if (moving.has(it.name)) continue;
      const follows = (it.dependencies ?? []).some((d: any) => moving.has(d.predecessor)) || (it.name !== targetName && moving.has(it.name));
      if (follows) { moving.add(it.name); grew = true; }
    }
  }

  return items
    .filter((i) => moving.has(i.name) && ISO_RE.test(i.startDate) && ISO_RE.test(i.endDate))
    .map((i) => ({
      name: i.name,
      oldStart: i.startDate,
      oldEnd: i.endDate,
      start: addDaysISO(i.startDate, delta),
      end: addDaysISO(i.endDate, delta),
    }));
}

// When a milestone gate is approved, every task underneath it is considered delivered.
function completeMilestoneSubtree(items: Milestone[], milestoneName: string): Milestone[] {
  const names = new Set<string>([milestoneName]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const it of items) {
      if (it.parent && names.has(it.parent) && !names.has(it.name)) {
        names.add(it.name);
        changed = true;
      }
    }
  }
  return items.map((m) => (names.has(m.name) ? { ...m, progress: 100 } : m));
}

function computeDerivedSchedule(items: Milestone[], reqs: ResourceRequest[]): Milestone[] {
  const base = items.map((it) => ({ ...it }));
  // Inject a synthetic "Approval Task" gate under every milestone that requires approval.
  const out: Milestone[] = [];
  for (const it of base) {
    if (it.isApprovalTask) continue; // never persist / duplicate synthetic gates
    out.push(it);
    if (it.kind === "Milestone" && it.requiresApproval) {
      const approved = it.approvalStatus === "approved";
      out.push({
        name: `${APPROVAL_TASK_PREFIX}${it.name}`,
        kind: "Task",
        startDate: it.endDate,
        endDate: it.endDate,
        owner: it.owner,
        rag: approved ? "green" : it.approvalStatus === "pending" ? "amber" : "grey",
        dep: it.name,
        roles: [],
        payment: { kind: "None", amount: "" },
        progress: approved ? 100 : 0,
        parent: it.name,
        assignee: (it.approvers ?? []).map((a) => a.name).join(", ") || "—",
        weightScore: 0, // gate: no weight in the milestone roll-up
        isApprovalTask: true,
        requiresApproval: true,
        approvalStatus: it.approvalStatus,
        approvers: it.approvers,
      } as Milestone);
    }
  }
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

  // Gate readiness: unlocked once every non-gate leaf under the milestone is at 100%.
  for (const gate of out) {
    if (!gate.isApprovalTask || !gate.parent) continue;
    const isDesc = (n: string) => {
      let c = out.find((x) => x.name === n);
      const seen = new Set<string>();
      while (c?.parent && !seen.has(c.parent)) {
        if (c.parent === gate.parent) return true;
        seen.add(c.parent);
        c = out.find((x) => x.name === c!.parent);
      }
      return false;
    };
    const leaves = out.filter(
      (l) => l.kind === "Task" && !l.isApprovalTask && !out.some((c) => c.parent === l.name) && isDesc(l.name),
    );
    gate.approvalReady = leaves.length > 0 && leaves.every((l) => (l.progress ?? 0) >= 100);
  }

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
  const dependencyDatesLocked = isEditing && (editingItem?.dependencies?.length ?? 0) > 0;
  const dependencyDateHint = dependencyDatesLocked
    ? "Computed from dependency. Remove it to edit directly"
    : undefined;
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
  const [parentMode, setParentMode] = useState<"none" | "milestone" | "task">("none");
  const [startDate, setStartDate] = useState("");
  const [endMode, setEndMode] = useState<"date" | "duration">("duration");
  const [taskEndDate, setTaskEndDate] = useState("");
  const [durationValue, setDurationValue] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<"hours" | "days">("days");
  const [weightScore, setWeightScore] = useState<number>(1);

  // Skill/Role rows — one task can request several roles (a subtask per role is best practice)
  const emptyRole = (): RoleReq => ({ role: "", skill: "Mid", fte: 1 });
  const [skillRoles, setSkillRoles] = useState<RoleReq[]>([emptyRole()]);
  // Financial linking (items are defined in the Financials tab — here we only link)
  // Costs and revenue can be linked together on the same item, several of each.
  const [costLinkIds, setCostLinkIds] = useState<string[]>([]);
  const [revenueLinkIds, setRevenueLinkIds] = useState<string[]>([]);


  // Milestone approval workflow
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string; endDate?: string; startDate?: string; taskEndDate?: string; duration?: string; status?: string }>({});
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

  // Which radio group option matches a stored parent name
  const modeForParent = (n?: string): "none" | "milestone" | "task" => {
    if (!n || n === "__none__") return "none";
    return items.find((i) => i.name === n)?.kind === "Milestone" ? "milestone" : "task";
  };

  // A subtask is always a Task — a milestone is a zero-duration point in the plan,
  // so it can never sit *inside* another item as a child deliverable.
  const lockKindToTask = !isEditing && !!initialParent;

  // A child can only live inside its parent's date window (MS Project behaviour).
  const parentItem = parentName === "__none__" ? undefined : items.find((i) => i.name === parentName);
  const parentWindow = parentItem
    ? parentItem.kind === "Milestone"
      ? { min: undefined as string | undefined, max: parentItem.endDate || undefined }
      : { min: parentItem.startDate || undefined, max: parentItem.endDate || undefined }
    : { min: undefined as string | undefined, max: undefined as string | undefined };

  function reset() {
    setKind(initialKind ?? "Task"); setName(""); setOwner(defaultOwner); setStatus("Not Started"); setDep(""); setErrors({});
    setEndDate(""); setLagDays(0); setMilestoneType("finish");
    setParentName(initialParent ?? "__none__"); setParentMode(modeForParent(initialParent));
    setStartDate(""); setEndMode("duration"); setTaskEndDate("");
    setDurationValue(1); setDurationUnit("days"); setWeightScore(1);
    setSkillRoles([emptyRole()]);
    setCostLinkIds([]); setRevenueLinkIds([]);
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
      setParentMode(modeForParent(editingItem.parent));
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
      setSkillRoles(editingItem.roles?.length ? editingItem.roles.map((r) => ({ ...r })) : [emptyRole()]);
      const allLinks = [editingItem.payment, ...(editingItem.extraPayments ?? [])].filter(Boolean) as PaymentLink[];
      setCostLinkIds(allLinks.filter((l) => l.kind === "Package Cost" && l.packageId).map((l) => l.packageId!));
      setRevenueLinkIds(allLinks.filter((l) => l.kind === "Client Revenue" && l.packageId).map((l) => l.packageId!));

      setRequiresApproval(editingItem.requiresApproval ?? false);
      setSelectedApprovers(editingItem.approvers?.map((a) => a.id) ?? []);
    } else {
      setKind(initialKind ?? "Task");
      setParentName(initialParent ?? "__none__");
      setParentMode(modeForParent(initialParent));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingItem?.name, initialParent, initialKind]);

  /**
   * A financial item can only ever be attached to ONE WBS item — anywhere in the
   * system. `globalLinks` covers every project that has been opened, `items`
   * covers the current schedule (including unsaved edits).
   */
  const { links: globalLinks } = useFinanceLinks();
  const linkedElsewhere = useMemo(() => {
    const used = new Set<string>();
    for (const it of items) {
      if (editingItem && it.name === editingItem.name) continue;
      if (it.payment?.packageId) used.add(it.payment.packageId);
      for (const ex of it.extraPayments ?? []) if (ex.packageId) used.add(ex.packageId);
    }
    for (const l of globalLinks) {
      if (l.project === projectName && editingItem && l.wbsItem === editingItem.name) continue;
      used.add(l.itemId);
    }
    return used;
  }, [items, editingItem, globalLinks, projectName]);



  function buildPayments(): { payment: PaymentLink; extras: PaymentLink[] } {
    const links: PaymentLink[] = [
      ...costLinkIds.filter(Boolean).map((id) => ({
        kind: "Package Cost" as PaymentLinkKind,
        packageId: id,
        amount: findFinancialItem(id)?.amount ?? "",
      })),
      ...revenueLinkIds.filter(Boolean).map((id) => ({
        kind: "Client Revenue" as PaymentLinkKind,
        packageId: id,
        amount: findFinancialItem(id)?.amount ?? "",
      })),
    ];
    if (!links.length) return { payment: { kind: "None", amount: "" }, extras: [] };
    // Revenue leads when present so milestone-level revenue recognition keeps working.
    const revenueFirst = [...links].sort((a, b) => (a.kind === "Client Revenue" ? -1 : 0) - (b.kind === "Client Revenue" ? -1 : 0));
    return { payment: revenueFirst[0], extras: revenueFirst.slice(1) };
  }


  function submit() {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "Name is required.";
    // New items always start as Not Started; "In Progress" needs real progress.
    const effectiveStatus = isEditing ? status : "Not Started";
    const currentProgress = editingItem?.progress ?? 0;
    if (effectiveStatus === "In Progress" && currentProgress <= 0) {
      nextErrors.status = "Enter progress above 0% before selecting In Progress.";
    }
    const rag = ragMap[effectiveStatus] ?? "blue";
    const { payment: mainPayment, extras: extraPayments } = buildPayments();
    const newItems: Milestone[] = [];


    if (kind === "Milestone") {
      if (!endDate) nextErrors.endDate = "Date is required.";
      if (Object.values(nextErrors).some(Boolean)) { setErrors(nextErrors); return; }
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
      const parent = parentName === "__none__" ? undefined : parentName;
      newItems.push({
        name: name.trim(), kind: "Milestone",
        startDate: endDate, endDate, owner: owner || defaultOwner, rag, dep,
        roles: skillRoles.filter((r) => r.role.trim()).map((r) => ({ role: r.role.trim(), skill: r.skill, fte: Number(r.fte) || 0 })),
        payment: mainPayment, extraPayments: extraPayments.length ? extraPayments : undefined, progress: 0,
        parent,
        lagDays: Number(lagDays) || 0,
        milestoneType,
        requiresApproval,
        approvers: requiresApproval ? approvers : undefined,
        approvalStatus: undefined,
      });
    }

    if (kind === "Task") {
      if (!startDate) nextErrors.startDate = "Start date is required.";
      let computedEnd: string;
      let durVal: number | undefined;
      let durUnit: "hours" | "days" | undefined;
      if (endMode === "date") {
        if (!taskEndDate) nextErrors.taskEndDate = "End date is required.";
        else if (startDate && taskEndDate < startDate) nextErrors.taskEndDate = "End date must be on or after start date.";
        computedEnd = taskEndDate;
      } else {
        if (!durationValue || durationValue <= 0) nextErrors.duration = "Duration must be greater than 0.";
        const days = durationUnit === "hours"
          ? Math.max(1, Math.ceil(Number(durationValue) / 8))
          : Math.max(1, Number(durationValue));
        computedEnd = addDaysISO(startDate, days - 1);
        durVal = Number(durationValue);
        durUnit = durationUnit;
      }
      // A child must stay inside its parent's window.
      if (parentItem) {
        if (parentWindow.min && startDate && startDate < parentWindow.min) {
          nextErrors.startDate = `Cannot start before “${parentItem.name}” (${parentWindow.min}).`;
        }
        if (parentWindow.max && computedEnd && computedEnd > parentWindow.max) {
          const msg = `Cannot finish after “${parentItem.name}” (${parentWindow.max}).`;
          if (endMode === "date") nextErrors.taskEndDate = msg;
          else nextErrors.duration = msg;
        }
      }
      if (Object.values(nextErrors).some(Boolean)) { setErrors(nextErrors); return; }
      const parent = parentName === "__none__" ? undefined : parentName;

      // Each requested role gets its own resource request.
      // On edit, skip roles that already existed to avoid duplicate requests.
      const requestIds: string[] = [];
      const fromMonth = startDate.slice(0, 7);
      const existingRoles = new Set((editingItem?.roles ?? []).map((r) => `${r.role}|${r.skill}`));
      const taskRoles: RoleReq[] = skillRoles
        .filter((r) => r.role.trim())
        .map((r) => ({ role: r.role.trim(), skill: r.skill, fte: Number(r.fte) || 0 }));
      for (const r of taskRoles) {
        if (isEditing && existingRoles.has(`${r.role}|${r.skill}`)) continue;
        const id = addResourceRequest({
          project: projectName,
          role: r.role,
          skill: r.skill,
          fte: r.fte,
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
        roles: taskRoles, payment: mainPayment, extraPayments: extraPayments.length ? extraPayments : undefined, progress: 0, parent,
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
      toast.done(kind, "updated");
    } else {
      onAdd(newItems);
      toast.done(kind, "created");
    }
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button size="sm" variant="primary"><Plus className="mr-1 h-4 w-4" />Add Item</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEditing ? `Edit ${kind}` : `Add ${kind}`}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          {!isEditing && (
          <div>
            <Label>Type</Label>
            <RadioGroup
              value={kind}
              onValueChange={(v) => setKind(v as ItemKind)}
              className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id="type-milestone" value="Milestone" disabled={lockKindToTask} />
                <Label htmlFor="type-milestone" className={cn("cursor-pointer text-sm", lockKindToTask && "opacity-40")}>Milestone</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="type-task" value="Task" />
                <Label htmlFor="type-task" className="cursor-pointer text-sm">Task</Label>
              </div>
            </RadioGroup>
            {lockKindToTask && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Subtasks are always tasks — a milestone is a single checkpoint date, not a child of another item.
              </p>
            )}
          </div>
          )}

          <Field label="Name" htmlFor="schedule-item-name" required error={errors.name}>
            <Input id="schedule-item-name" value={name} onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }} placeholder="e.g. UAT Sign-off" />
          </Field>

          {(isEditing || kind === "Task") && (
            <div>
              <Label>Parent</Label>
              <RadioGroup
                value={parentMode}
                onValueChange={(v) => { setParentMode(v as "none" | "milestone" | "task"); setParentName("__none__"); }}
                className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2"
              >
                {([
                  { id: "none", label: "None (top level)" },
                  { id: "milestone", label: "Milestone" },
                  { id: "task", label: "Task" },
                ] as const).map((opt) => {
                  const count = opt.id === "none" ? 1 : parentOptions.filter((p) => (opt.id === "milestone" ? p.kind === "Milestone" : p.kind === "Task")).length;
                  return (
                    <div key={opt.id} className="flex items-center gap-2">
                      <RadioGroupItem id={`parent-${opt.id}`} value={opt.id} disabled={count === 0} />
                      <Label htmlFor={`parent-${opt.id}`} className={cn("cursor-pointer text-sm", count === 0 && "opacity-40")}>{opt.label}</Label>
                    </div>
                  );
                })}
              </RadioGroup>
              {parentMode !== "none" && (
                <div className="mt-2">
                  <Select value={parentName} onValueChange={setParentName}>
                    <SelectTrigger><SelectValue placeholder={parentMode === "milestone" ? "Select a milestone…" : "Select a task…"} /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {parentOptions
                        .filter((p) => (parentMode === "milestone" ? p.kind === "Milestone" : p.kind === "Task"))
                        .map((p) => (
                          <SelectItem key={`${parentMode}-${p.name}`} value={p.name}>
                            {parentMode === "milestone" ? `◆ ${p.name}` : p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

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
              <div>
                <Field label="Date" htmlFor="milestone-date" required error={errors.endDate} hint={dependencyDateHint}>
                  <DatePicker id="milestone-date" value={endDate} disabled={dependencyDatesLocked} onChange={(value) => { setEndDate(value); setErrors((p) => ({ ...p, endDate: undefined })); }} placeholder="Pick milestone date" />
                </Field>
              </div>


              {!isEditing && (
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
              )}

            </>
          )}

          {/* TASK: parent (any milestone or task) + start + (end date | duration) + weight */}
          {kind === "Task" && (
            <>
              <Field label="Start date" htmlFor="task-start-date" required error={errors.startDate} hint={dependencyDateHint}>
                <DatePicker id="task-start-date" value={startDate} disabled={dependencyDatesLocked} min={parentWindow.min} max={parentWindow.max} onChange={(value) => { setStartDate(value); setErrors((p) => ({ ...p, startDate: undefined })); }} placeholder="Pick start date" />
              </Field>
              {parentItem && (parentWindow.min || parentWindow.max) && (
                <p className="-mt-2 text-[10px] text-muted-foreground">
                  Must stay inside “{parentItem.name}”: {parentWindow.min ? `${parentWindow.min} → ` : "on or before "}{parentWindow.max ?? "—"}
                </p>
              )}

              <div>
                <Label>End Date Or Duration</Label>
                <RadioGroup
                  value={endMode}
                  onValueChange={(v) => v && setEndMode(v as "date" | "duration")}
                  className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="end-mode-date" value="date" />
                    <Label htmlFor="end-mode-date" className="cursor-pointer text-sm">End date</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="end-mode-duration" value="duration" />
                    <Label htmlFor="end-mode-duration" className="cursor-pointer text-sm">Duration</Label>
                  </div>
                </RadioGroup>
                {endMode === "date" ? (
                  <Field htmlFor="task-end-date" required error={errors.taskEndDate} hint={dependencyDateHint}>
                    <DatePicker id="task-end-date" className="mt-2" value={taskEndDate} disabled={dependencyDatesLocked} min={startDate || parentWindow.min} max={parentWindow.max} onChange={(value) => { setTaskEndDate(value); setErrors((p) => ({ ...p, taskEndDate: undefined })); }} placeholder="Pick end date" />
                  </Field>
                ) : (
                  <Field className="mt-2" htmlFor="task-duration" required error={errors.duration}>
                    <div className="grid grid-cols-2 gap-2">
                    <Input id="task-duration" type="number" min="0" step="0.5" value={durationValue} onChange={(e) => { setDurationValue(Number(e.target.value)); setErrors((p) => ({ ...p, duration: undefined })); }} placeholder="Duration" />
                    <Select value={durationUnit} onValueChange={(v) => setDurationUnit(v as "hours" | "days")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>
                  </Field>
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



        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit}>{isEditing ? `Save ${kind}` : `Add ${kind}`}</Button>
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
        <Button size="sm" variant="primary"><Plus className="mr-1 h-4 w-4" />Log Trip</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Log Business Trip</DialogTitle></DialogHeader>
        <div className="rounded-md border border-accent/20 bg-accent-dim/30 px-3 py-2 text-xs text-accent">Status defaults to Planned</div>
        <div className="grid gap-3">
          <div><Label>Purpose</Label><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Vendor workshop" /></div>
          <div><Label>Destination</Label><Input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="e.g. Munich, DE" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Dates</Label><Input value={dates} onChange={(e) => setDates(e.target.value)} placeholder="08 Jul – 11 Jul" /></div>
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
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Log Trip</Button>
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
  const risksBaseline = useTabBaseline({
    scope: "risks",
    label: "Project Risks",
    current: items,
    onCommit: (s) => setItems(s),
  });
  const displayItems = (risksBaseline.viewedSnapshot as RaidItem[] | null) ?? items;
  const canEdit = risksBaseline.canEdit;
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
    toast.success(`${kind} logged`);
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
      <BaselineHeader state={risksBaseline} />
      <TabChangeRequestDialog state={risksBaseline} approverPool={DEFAULT_PROJECT_APPROVERS} />
      <TabApprovalDialog state={risksBaseline} />
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
        {canEdit && <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="primary">
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
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={submit}>Log {kind}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>}
      </div>
      <div className="">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0"><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Score</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{displayItems.map((r) => (
            <TableRow key={r.id} className="bg-table-row-bg hover:bg-table-row-hover border-0">
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
        <Button size="sm" variant="primary" onClick={() => onExternalOpenChange(true)}>
          Submit Week {nextWeek} Report
        </Button>
      </div>
      {reports.length === 0 ? (
        <EmptyState
          art="note"
          title="No status reports yet"
          description="Submit a weekly status report to start tracking this project's history."
          ctaLabel={`Submit Week ${nextWeek} Report`}
          onCta={() => onExternalOpenChange(true)}
        />
      ) : (
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
      )}

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
            <Button variant="secondary" onClick={() => onExternalOpenChange(false)}>Cancel</Button>
            <Button variant="primary" onClick={submit}>Submit Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Procurement (project) tab ─────────────────────────────────────────────────
function ProcurementProjectTab({ projectName, addRfp }: { projectName: string; addRfp: (r: RfpEntry) => void }) {
  const contracts = [
    { id: "CT-2026-038", vendor: "Oracle Consulting", value: "$680K", end: "12 Dec", rag: "green" as Rag, status: "Active" },
    { id: "CT-2026-029", vendor: "Cyberguard", value: "$140K", end: "30 Sep", rag: "green" as Rag, status: "Active" },
    { id: "CT-2026-031", vendor: "LearnSphere", value: "$95K", end: "25 Aug", rag: "amber" as Rag, status: "Expiring" },
  ];
  const rfps = [
    { id: "RFP-014", title: "Robotics Integration Partner", type: "RFP", due: "28 Jun", bidders: 4, rag: "amber" as Rag, status: "Open" },
    { id: "RFP-016", title: "Training services rollout", type: "RFP", due: "12 Jul", bidders: 2, rag: "amber" as Rag, status: "Open" },
  ];

  const [packages, setPackages] = useState<TenderPackage[]>(SEED_PACKAGES);
  const procBaseline = useTabBaseline({
    scope: "procurement",
    label: "Procurement",
    current: packages,
    onCommit: (s) => setPackages(s),
  });
  const canEdit = procBaseline.canEdit;
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
      <BaselineHeader state={procBaseline} />
      <TabChangeRequestDialog state={procBaseline} approverPool={DEFAULT_PROJECT_APPROVERS} />
      <TabApprovalDialog state={procBaseline} />
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
          <div className="flex items-center gap-2">
            {!canEdit && (
              <span className="text-[11px] text-muted-foreground">
                Click "Edit Procurement" to create or send requests
              </span>
            )}
            <Dialog open={newPkgOpen} onOpenChange={setNewPkgOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={!canEdit}
                  title={!canEdit ? "Enable Edit Procurement first" : undefined}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + New Request
                </Button>
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
                  <Button variant="secondary" onClick={() => setNewPkgOpen(false)}>Cancel</Button>
                  <Button variant="primary" onClick={handleNewPackage}>Create Request</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
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
                <TableRow className="bg-table-row-bg hover:bg-table-row-hover border-0">
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
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canEdit}
                        title={!canEdit ? "Enable Edit Procurement first" : undefined}
                        className="border-accent/40 text-accent hover:bg-accent-dim h-7 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => sendForTendering(pkg.id)}
                      >
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
          <span className="text-xs text-muted-foreground">Open Procurement module →</span>
        </div>
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0"><TableHead>Contract</TableHead><TableHead>Vendor</TableHead><TableHead>Value</TableHead><TableHead>End</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{contracts.map((c) => (
            <TableRow key={c.id} className="bg-table-row-bg hover:bg-table-row-hover border-0">
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
            <TableRow key={r.id} className="bg-table-row-bg hover:bg-table-row-hover border-0">
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
  const stkBaseline = useTabBaseline({
    scope: "stakeholders",
    label: "Stakeholders",
    current: items,
    onCommit: (s) => setItems(s),
  });
  const displayStk = (stkBaseline.viewedSnapshot as Stakeholder[] | null) ?? items;
  const canEdit = stkBaseline.canEdit;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [org, setOrg] = useState("");
  const [influence, setInfluence] = useState<"High" | "Medium" | "Low">("Medium");
  const [interest, setInterest] = useState<"High" | "Medium" | "Low">("Medium");
  const [strategy, setStrategy] = useState("");

  function submit() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setItems((prev) => [...prev, { name: name.trim(), org: org || "—", influence, interest, strategy: strategy || "—" }]);
    toast.done("Stakeholder", "created");
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
      <BaselineHeader state={stkBaseline} />
      <TabChangeRequestDialog state={stkBaseline} approverPool={DEFAULT_PROJECT_APPROVERS} />
      <TabApprovalDialog state={stkBaseline} />
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">Stakeholder matrix · {displayStk.length} stakeholders</div>
        {canEdit && <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="primary"><UserPlus className="mr-1 h-4 w-4" />Add Stakeholder</Button>
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
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={submit}>Add Stakeholder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>}
      </div>

      <div className="">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0"><TableHead>Name</TableHead><TableHead>Org</TableHead><TableHead>Influence</TableHead><TableHead>Interest</TableHead><TableHead>Strategy</TableHead></TableRow></TableHeader>
          <TableBody>{displayStk.map((s) => (
            <TableRow key={s.name} className="bg-table-row-bg hover:bg-table-row-hover border-0">
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
                {displayStk.filter(q.filter).map((s) => (<li key={s.name}>{s.name}</li>))}
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

// ── Cost categories list with expandable breakdown ────────────────────────────
const COST_COLORS: Record<string, string> = {
  Labour: "bg-rag-green", Hardware: "bg-rag-blue", Software: "bg-accent",
  "Business trips": "bg-rag-amber", Contingency: "bg-muted-foreground", Other: "bg-rag-red",
};
function CostCategoriesList({
  entries, canEdit, onUpdate,
}: {
  entries: CostEntry[];
  canEdit: boolean;
  onUpdate: (idx: number, patch: Partial<CostEntry>) => void;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  return (
    <div className="space-y-3">
      {entries.map((r, idx) => {
        const pct = r.b > 0 ? Math.round((r.a / r.b) * 100) : 0;
        const open = openIdx === idx;
        const bd = r.breakdown ?? [];
        const bdTotal = bd.reduce((s, i) => s + i.amount, 0);
        return (
          <div key={r.c + idx} className="rounded-md border border-border/50 bg-background/30 p-2.5">
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : idx)}
              className="flex w-full items-center gap-2 text-left"
            >
              <span className={`text-xs transition-transform ${open ? "rotate-90" : ""}`}>▸</span>
              <div className="flex-1">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    {r.c}
                    {r.classification && (
                      <span className="rounded bg-secondary/40 px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                        {r.classification}
                      </span>
                    )}
                    {r.ctype && (
                      <span className="rounded bg-secondary/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {r.ctype === "internal" ? "Internal" : "3rd party"}
                      </span>
                    )}
                    {r.linkKind && r.linkRef && (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] ${r.linkKind === "milestone" ? "bg-accent/15 text-accent" : "bg-secondary/40 text-muted-foreground"}`}>
                        {r.linkKind === "milestone" ? `→ ${r.linkRef}` : r.linkRef}
                      </span>
                    )}
                  </span>
                  <span className="num-mono text-xs text-muted-foreground">${r.a.toFixed(2)}M / ${r.b.toFixed(2)}M</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/50">
                  <div className={`h-full ${r.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </button>
            {open && (
              <div className="mt-3 space-y-2 border-t border-border/40 pt-2 pl-6">
                {r.desc && <div className="text-xs text-muted-foreground">{r.desc}</div>}
                {bd.length === 0 && <div className="text-xs italic text-muted-foreground">No breakdown items yet.</div>}
                {bd.map((b, bi) => (
                  <div key={bi} className="flex items-center justify-between text-xs">
                    <div>
                      <div className="text-foreground">{b.name}</div>
                      {b.note && <div className="text-[11px] text-muted-foreground">{b.note}</div>}
                    </div>
                    <span className="num-mono text-muted-foreground">${b.amount.toFixed(2)}M</span>
                  </div>
                ))}
                {bd.length > 0 && (
                  <div className="flex items-center justify-between border-t border-border/30 pt-1 text-[11px] text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="num-mono">${bdTotal.toFixed(2)}M</span>
                  </div>
                )}
                {canEdit && (
                  <div className="flex items-end gap-2 pt-1">
                    <div className="flex-1">
                      <Label className="text-[11px]">Item</Label>
                      <Input
                        value={openIdx === idx ? newName : ""}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Backend engineers (2)"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="w-28">
                      <Label className="text-[11px]">Amount ($M)</Label>
                      <Input
                        type="number" min={0} step={0.01}
                        value={openIdx === idx ? newAmount : ""}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-accent/40 text-accent hover:bg-accent-dim"
                      onClick={() => {
                        const amt = parseFloat(newAmount);
                        if (!newName.trim() || isNaN(amt)) { toast.error("Item name and amount are required"); return; }
                        onUpdate(idx, { breakdown: [...bd, { name: newName.trim(), amount: amt }] });
                        setNewName(""); setNewAmount("");
                        toast.done("Breakdown item", "created");
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" />Add
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Unified Add Finance Link dialog (Cost OR Revenue) ─────────────────────────
function AddFinanceLinkDialog({
  milestoneNames, defaultType, onAddCost, onAddRevenue, label, lockKind,
}: {
  milestoneNames: string[];
  defaultType: "cost" | "revenue";
  onAddCost: (e: CostEntry) => void;
  onAddRevenue: (e: RevEntry) => void;
  /** Button/dialog wording — the Cost and Revenue tabs each name their own action. */
  label?: string;
  /** When true the cost/revenue switch is hidden: the tab already decided. */
  lockKind?: boolean;
}) {
  const actionLabel = label ?? "Add Finance Link";
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"cost" | "revenue">(defaultType);

  // Common
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [linkKind, setLinkKind] = useState<"fixed" | "milestone">("milestone");
  const [linkDate, setLinkDate] = useState("");
  const [linkMs, setLinkMs] = useState("");

  // Cost-only
  const [cat, setCat] = useState("");
  const [ctype, setCtype] = useState<"internal" | "third-party">("internal");
  const [capex, setCapex] = useState<"capex" | "opex">("opex");

  // Revenue-only
  const [evt, setEvt] = useState("");

  function reset() {
    setKind(defaultType);
    setAmount(""); setDesc(""); setLinkKind("milestone"); setLinkDate(""); setLinkMs("");
    setCat(""); setCtype("internal"); setCapex("opex");
    setEvt("");
  }

  function submit() {
    const linkRef = linkKind === "fixed" ? linkDate : linkMs;
    if (linkKind === "fixed" && !linkDate) { toast.error("Please pick a date"); return; }
    if (linkKind === "milestone" && !linkMs) { toast.error("Please pick a milestone"); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt)) { toast.error("Amount is required"); return; }

    if (kind === "cost") {
      if (!cat.trim()) { toast.error("Category is required"); return; }
      onAddCost({
        c: cat.trim(), b: amt, a: 0,
        color: COST_COLORS[cat] ?? "bg-muted-foreground",
        desc: desc.trim() || undefined,
        ctype, classification: capex,
        linkKind, linkRef, breakdown: [],
      });
      toast.done("Cost link", "created");
    } else {
      onAddRevenue({
        ms: linkKind === "milestone" ? linkMs : (desc.trim() || "Revenue"),
        evt: evt.trim() || "—",
        plan: amt,
        date: linkKind === "fixed" ? linkDate : "Linked",
        s: "blue", sl: "Planned", act: null,
        linkKind,
      });
      toast.done("Revenue link", "created");
    }
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); else setKind(defaultType); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 border-accent/40 text-accent hover:bg-accent-dim text-xs">
          <Plus className="mr-1 h-3.5 w-3.5" />{actionLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{actionLabel}</DialogTitle>
          <DialogDescription>
            {lockKind
              ? `Link this ${defaultType === "cost" ? "cost item" : "revenue event"} to a milestone or a fixed date.`
              : "Link either a cost or a revenue event to a milestone or a fixed date."}
          </DialogDescription>
        </DialogHeader>

        {!lockKind && (
          <div className="mb-1 grid grid-cols-2 gap-1 rounded-md bg-secondary/30 p-1">
            {(["cost", "revenue"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded px-2 py-1.5 text-xs font-medium transition ${kind === k ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {k === "cost" ? "Outgoing (Cost)" : "Incoming (Revenue)"}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-3">
          {kind === "cost" ? (
            <>
              <div>
                <Label>Name</Label>
                <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. Senior developer contract" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={cat} onValueChange={setCat}>
                  <SelectTrigger><SelectValue placeholder="Select category…" /></SelectTrigger>
                  <SelectContent>
                    {["Staff", "Services", "Insurance", "Business Trips", "Contracts", "Hardware", "Software", "Other"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Planned amount ($M)</Label><Input type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.50" /></div>
            </>
          ) : (
            <>
              <div><Label>Revenue event</Label><Input value={evt} onChange={(e) => setEvt(e.target.value)} placeholder="e.g. Progress invoice (15%)" /></div>
              <div><Label>Planned amount ($M)</Label><Input type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.50" /></div>
              {linkKind === "fixed" && (
                <div><Label>Label (optional)</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. Advance payment" /></div>
              )}
            </>
          )}

          <div>
            <Label>Link to</Label>
            <RadioGroup
              value={linkKind}
              onValueChange={(v) => setLinkKind(v as typeof linkKind)}
              className="flex gap-4 pt-1"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="milestone" id="link-ms" />
                <Label htmlFor="link-ms" className="cursor-pointer font-normal">Milestone (Dynamic)</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="fixed" id="link-fixed" />
                <Label htmlFor="link-fixed" className="cursor-pointer font-normal">Fixed Date</Label>
              </div>
            </RadioGroup>
          </div>
          {linkKind === "fixed" && (
            <div><Label>Due Date</Label><DatePicker value={linkDate} onChange={setLinkDate} placeholder="Pick due date" /></div>
          )}
          {linkKind === "milestone" && (
            <div>
              <Label>Milestone</Label>
              <Select value={linkMs} onValueChange={setLinkMs}>
                <SelectTrigger><SelectValue placeholder="Select milestone…" /></SelectTrigger>
                <SelectContent>
                  {milestoneNames.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No milestones yet</div>
                  ) : milestoneNames.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Add link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Legacy Add Cost Entry dialog (kept for reference) ─────────────────────────
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
    toast.done("Cost entry", "created");
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
            <Label>Name</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. Senior developer contract" />
          </div>
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
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Planned amount ($M)</Label><Input type="number" min={0} step={0.01} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0.50" /></div>
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
            <div><Label>Due Date</Label><DatePicker value={linkDate} onChange={setLinkDate} placeholder="Pick due date" /></div>
          )}
          {linkType === "milestone" && (
            <div><Label>Milestone Name</Label><Input value={linkDate} onChange={(e) => setLinkDate(e.target.value)} placeholder="e.g. Design Approved" /></div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Add Entry</Button>
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
    toast.done("Revenue event", "created");
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
            <div><Label>Expected date</Label><Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="30 Oct" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Add Event</Button>
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
    toast.done("Checklist item", "created");
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
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
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
    { tag: "What Went Well", text: "Early stakeholder alignment on scope prevented scope creep.", by: project.pm, when: "20 May" },
    { tag: "Challenges", text: "Vendor delivery delay on Oracle ERP — impacted integration milestone by 2 weeks.", by: "Mei Chen", when: "18 May" },
    { tag: "Recommendations", text: "Run UAT in parallel with integration build on future projects — saves 1 sprint.", by: "Priya Iyer", when: "15 May" },
    { tag: "Process", text: "Earlier vendor SLA reviews surface delays sooner.", by: project.pm, when: "14 May" },
    { tag: "People", text: "Pair architect with junior dev for knowledge transfer.", by: "Mei Chen", when: "11 May" },
    { tag: "Governance", text: "Bi-weekly steering tempo too slow for critical phase.", by: project.pm, when: "09 May" },
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
            <Button size="sm" variant="primary"><Plus className="mr-1 h-4 w-4" />Add Lesson</Button>
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
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={submit}>Add Lesson</Button>
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
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
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
  /** Linked central Approvals Inbox request id. */
  approvalId?: string;
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
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary"
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
            Submitted by {changeRequest.submittedBy} on {formatDateWithYear(changeRequest.createdAt)}
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
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Dependency Management Dialog ────────────────────────────────────────────────
type DepItem = Parameters<typeof ProjectSchedule>[0]["items"][number];
/** Lists a task's current dependencies with per-row edit and confirmed removal actions. */
function ViewDependenciesDialog({
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
  onSetDependencies: (name: string, dependencies: any[], impacts: DepImpact[]) => void;
}) {
  const deps = (currentItem?.dependencies ?? []).map((d) => ({ ...d, lag: depLag(d) }));

  /** Tasks that already name this one as a predecessor — context for the decision, not something being edited here. */
  const successors = useMemo(
    () => (currentItem ? getSuccessors(allItems, currentItem.name) : []),
    [allItems, currentItem],
  );

  const [pendingDepIdx, setPendingDepIdx] = useState<number | null>(null);
  const [editingDepIdx, setEditingDepIdx] = useState<number | null>(null);

  function removeDependency(idx: number) {
    if (!currentItem) return;
    const updated = deps.filter((_, i) => i !== idx);
    const impacts = computeDependencyImpact(allItems as any, currentItem.name, updated);
    onSetDependencies(currentItem.name, updated, impacts);
    toast.done("Dependency", "removed");
  }

  const pendingDepDesc = "This dependency will be removed from the item. Removing it may shift the item's planned dates.";

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>View Dependencies — {currentItem?.name}</DialogTitle>
          {successors.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex w-fit items-center gap-1.5 rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  {successors.length} task{successors.length === 1 ? "" : "s"} depend{successors.length === 1 ? "s" : ""} on this
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Depends on this task
                </div>
                <div className="max-h-48 space-y-0.5 overflow-y-auto">
                  {successors.map((s) => (
                    <div key={s.name} className="truncate rounded px-2 py-1 text-sm text-foreground hover:bg-secondary/40">
                      {s.name}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </DialogHeader>
        <div className="space-y-2 rounded-md border border-border bg-secondary/20 p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Current Dependencies</div>
            <span className="text-xs text-muted-foreground">{deps.length}</span>
          </div>
          <div className="h-[220px] space-y-2 overflow-y-auto pr-1">
            {deps.length === 0 ? (
              <p className="py-16 text-center text-xs text-muted-foreground">No dependencies yet.</p>
            ) : (
              deps.map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded border border-border/60 bg-background/60 p-2 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{d.predecessor}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{depLabel(d)}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => setEditingDepIdx(i)} title="Edit dependency" aria-label="Edit dependency"
                      className="flex items-center justify-center rounded-md p-1.5 text-accent hover:bg-accent/10 hover:text-accent">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setPendingDepIdx(i)} title="Remove dependency" aria-label="Remove dependency"
                      className="flex items-center justify-center rounded-md p-1.5 text-rag-red hover:bg-rag-red/10 hover:text-rag-red">
                      <DeleteAction size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ConfirmDialog
      open={pendingDepIdx != null}
      onOpenChange={(v) => { if (!v) setPendingDepIdx(null); }}
      tone="danger"
      title="Remove dependency?"
      description={pendingDepDesc}
      cancelLabel="Cancel"
      confirmLabel="Remove"
      onConfirm={() => {
        if (pendingDepIdx != null) {
          removeDependency(pendingDepIdx);
        }
        setPendingDepIdx(null);
      }}
    />
    <CreateDependencyDialog
      open={editingDepIdx != null}
      onOpenChange={(v) => { if (!v) setEditingDepIdx(null); }}
      currentItem={currentItem}
      allItems={allItems}
      editIndex={editingDepIdx}
      onSetDependencies={onSetDependencies}
    />
    </>
  );
}

/** Adds or edits exactly one dependency and saves immediately — no batching. */
function CreateDependencyDialog({
  open,
  onOpenChange,
  currentItem,
  allItems,
  editIndex = null,
  onSetDependencies,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentItem?: DepItem;
  allItems: DepItem[];
  editIndex?: number | null;
  onSetDependencies: (name: string, dependencies: any[], impacts: DepImpact[]) => void;
}) {
  const [selectedPred, setSelectedPred] = useState<string>("");
  const [predecessorKind, setPredecessorKind] = useState<"Task" | "Milestone">("Task");
  const [relation, setRelation] = useState<"FS" | "SF" | "SS" | "FF">("FS");
  const [lag, setLag] = useState(0);
  const [acceptShift, setAcceptShift] = useState(false);
  const existingDeps = (currentItem?.dependencies ?? []).map((d) => ({ ...d, lag: depLag(d) }));
  const editingDep = editIndex != null ? existingDeps[editIndex] : undefined;
  const isEditingDependency = editingDep !== undefined;

  useEffect(() => {
    if (open) {
      setSelectedPred(editingDep?.predecessor ?? "");
      setPredecessorKind(
        editingDep
          ? allItems.find((item) => item.name === editingDep.predecessor)?.kind ?? "Task"
          : "Task",
      );
      setRelation(editingDep?.relation ?? "FS");
      setLag(editingDep ? depLag(editingDep) : 0);
      setAcceptShift(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentItem?.name, editIndex]);

  /** Dates that will move once this new dependency is saved. */
  const draftDeps = useMemo(
    () => {
      if (!selectedPred) return existingDeps;
      const nextDependency = { predecessor: selectedPred, relation, lag: lag || undefined };
      if (editIndex != null && existingDeps[editIndex]) {
        return existingDeps.map((dependency, index) => index === editIndex ? nextDependency : dependency);
      }
      return [...existingDeps, nextDependency];
    },
    [existingDeps, selectedPred, relation, lag, editIndex],
  );
  const impacts = useMemo(
    () => (currentItem && selectedPred ? computeDependencyImpact(allItems as any, currentItem.name, draftDeps) : []),
    [allItems, currentItem, draftDeps, selectedPred],
  );
  useEffect(() => { setAcceptShift(false); }, [impacts.length]);

  function save() {
    if (!currentItem || !selectedPred) return;
    if (impacts.length > 0 && !acceptShift) {
      toast.error("Please confirm you accept the date changes before saving");
      return;
    }
    onSetDependencies(currentItem.name, draftDeps, impacts);
    toast.done("Dependency", isEditingDependency ? "updated" : "added");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditingDependency ? "Edit Dependency" : "Add Dependency"} — {currentItem?.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label className="text-xs">Predecessor Type</Label>
            <RadioGroup
              value={predecessorKind}
              onValueChange={(value) => {
                setPredecessorKind(value as "Task" | "Milestone");
                setSelectedPred("");
              }}
              className="mt-2 flex flex-wrap items-center gap-5"
            >
              <label htmlFor="create-dep-task" className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <RadioGroupItem id="create-dep-task" value="Task" />
                Predecessor Task
              </label>
              <label htmlFor="create-dep-milestone" className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <RadioGroupItem id="create-dep-milestone" value="Milestone" />
                Predecessor Milestone
              </label>
            </RadioGroup>
          </div>
          <div>
            <Label className="text-xs">
              {predecessorKind === "Task" ? "Predecessor Task" : "Predecessor Milestone"}
            </Label>
            <Select value={selectedPred} onValueChange={setSelectedPred}>
              <SelectTrigger>
                <SelectValue placeholder={`Select a ${predecessorKind.toLowerCase()}...`} />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {allItems
                  .filter((m) => m.name !== currentItem?.name && m.kind === predecessorKind)
                  .map((m) => (
                    <SelectItem key={m.name} value={m.name}>
                      {m.name}
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
              <Label className="text-xs">Lag / Lead (days)</Label>
              <Input
                type="number"
                value={lag}
                onChange={(e) => setLag(Number(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="mt-1 text-[9px] text-muted-foreground">
                {lag > 0
                  ? `Lag — starts ${lag}d after the predecessor`
                  : lag < 0
                    ? `Lead — overlaps ${Math.abs(lag)}d with the predecessor`
                    : "Positive = lag (delay) · Negative = lead (overlap)"}
              </p>
            </div>
          </div>

          {/* Knock-on date changes must be acknowledged before saving. Deliberately just a
              disclaimer — no computed count or date list, so this stays simple regardless
              of how many downstream tasks would shift. */}
          {impacts.length > 0 && (
            <div className="space-y-2 rounded-md border border-rag-amber/50 bg-rag-amber/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-rag-amber">
                <AlertTriangle className="h-4 w-4" />
                Some task dates will change
              </div>
              <label className="flex cursor-pointer items-start gap-2 text-xs">
                <Checkbox checked={acceptShift} onCheckedChange={(v) => setAcceptShift(!!v)} className="mt-0.5" />
                <span>I understand some planned dates will move because of this change and want to continue.</span>
              </label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={!selectedPred || (impacts.length > 0 && !acceptShift)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type TeamAllocationTabProps = {
  project: typeof projects[number];
  teamMembers: Array<{ n: string; r: string; a: number; p: string; s: Rag }>;
  setTeamMembers: React.Dispatch<React.SetStateAction<Array<{ n: string; r: string; a: number; p: string; s: Rag }>>>;
  addMemberOpen: boolean;
  setAddMemberOpen: (v: boolean) => void;
  reqResourceOpen: boolean;
  setReqResourceOpen: (v: boolean) => void;
  addResourceRequest: (r: Omit<ResourceRequest, "id" | "date" | "status">) => string;
};
function TeamAllocationTab({
  project, teamMembers, setTeamMembers,
  addMemberOpen, setAddMemberOpen, reqResourceOpen, setReqResourceOpen, addResourceRequest,
}: TeamAllocationTabProps) {
  const [teamState] = useState({ label: "team-allocation" });
  const teamBaseline = useTabBaseline({
    scope: "team",
    label: "Team & Allocation",
    current: teamState,
  });
  return (
    <div className="space-y-4">
      <BaselineHeader state={teamBaseline} />
      <TabChangeRequestDialog state={teamBaseline} approverPool={DEFAULT_PROJECT_APPROVERS} />
      <TabApprovalDialog state={teamBaseline} />
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
                      <TableRow key={m.r} className="bg-table-row-bg hover:bg-table-row-hover border-0">
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
              <div className="flex items-center justify-end gap-2">
                {!teamBaseline.canEdit && (
                  <span className="text-[11px] text-muted-foreground mr-1">
                    Click "Edit Team & Allocation" to add or request resources
                  </span>
                )}
                <Button size="sm" variant="outline"
                  disabled={!teamBaseline.canEdit}
                  title={!teamBaseline.canEdit ? "Enable Edit Team & Allocation first" : undefined}
                  className="gap-1 text-xs border-accent/40 text-accent hover:bg-accent-dim disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setReqResourceOpen(true)}>
                  <UserPlus className="h-3.5 w-3.5" />Request Resource
                </Button>
                <Button size="sm"
                  disabled={!teamBaseline.canEdit}
                  title={!teamBaseline.canEdit ? "Enable Edit Team & Allocation first" : undefined}
                  className="gap-1 text-xs bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <TableRow key={m.n} className="bg-table-row-bg hover:bg-table-row-hover border-0">
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
    </div>
  );
}

// ── Risk & Issues tab ─────────────────────────────────────────────────────────

function ProjectRiskIssuesTab({ projectName, milestoneOptions }: { projectName: string; milestoneOptions: string[] }) {
  const [view, setView] = useState<"register" | "issues">("register");
  const [issueRiskFilter, setIssueRiskFilter] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
        <TabsList className="grid h-11 w-full grid-cols-2 gap-0 rounded-lg border border-border bg-[var(--field-bg-filled)] p-1">
          <TabsTrigger value="register" className="h-9 gap-2 rounded-md border border-transparent bg-transparent px-4 text-xs text-muted-foreground data-[state=active]:border-accent/50 data-[state=active]:bg-accent/10 data-[state=active]:text-accent">
            <ClipboardCheck size={15} />Risk Register
          </TabsTrigger>
          <TabsTrigger value="issues" className="h-9 gap-2 rounded-md border border-transparent bg-transparent px-4 text-xs text-muted-foreground data-[state=active]:border-accent/50 data-[state=active]:bg-accent/10 data-[state=active]:text-accent">
            <AlertTriangle size={15} />Issues Log
          </TabsTrigger>
        </TabsList>
        <TabsContent value="register" className="mt-5">
          <RiskRegisterTab
            project={projectName}
            milestoneOptions={milestoneOptions}
            onViewLinkedIssues={(riskId) => { setIssueRiskFilter([riskId]); setView("issues"); }}
          />
        </TabsContent>
        <TabsContent value="issues" className="mt-5">
          <IssuesLogTab
            project={projectName}
            milestoneOptions={milestoneOptions}
            riskFilter={issueRiskFilter}
            onRiskFilterChange={setIssueRiskFilter}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Financial Link dialog (opened from the WBS "Financial Link" cell) ─────────
function ScheduleFinancialLinkDialog({
  open, onOpenChange, item, items, projectName, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item?: Milestone;
  items: Milestone[];
  projectName: string;
  onSave: (name: string, payment: PaymentLink, extras: PaymentLink[]) => void;
}) {
  const { links: globalLinks } = useFinanceLinks();
  const [costIds, setCostIds] = useState<string[]>([]);
  const [revenueIds, setRevenueIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !item) return;
    const all = [item.payment, ...(item.extraPayments ?? [])].filter(Boolean) as PaymentLink[];
    setCostIds(all.filter((p) => p.kind === "Package Cost" && p.packageId).map((p) => p.packageId!));
    setRevenueIds(all.filter((p) => p.kind === "Client Revenue" && p.packageId).map((p) => p.packageId!));
  }, [open, item]);

  const linkedElsewhere = useMemo(() => {
    const used = new Set<string>();
    for (const it of items) {
      if (it.name === item?.name) continue;
      for (const p of [it.payment, ...(it.extraPayments ?? [])]) if (p?.packageId) used.add(p.packageId);
    }
    for (const l of globalLinks) {
      if (l.project === projectName && item && l.wbsItem === item.name) continue;
      used.add(l.itemId);
    }
    return used;
  }, [items, item, globalLinks, projectName]);

  function save() {
    if (!item) return;
    const links: PaymentLink[] = [
      ...revenueIds.map((id) => ({ kind: "Client Revenue" as PaymentLinkKind, packageId: id, amount: findFinancialItem(id)?.amount ?? "" })),
      ...costIds.map((id) => ({ kind: "Package Cost" as PaymentLinkKind, packageId: id, amount: findFinancialItem(id)?.amount ?? "" })),
    ];
    if (links.length === 0) onSave(item.name, { kind: "None", amount: "" }, []);
    else onSave(item.name, links[0], links.slice(1));
    toast.done("Financial links", "saved");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Financial Link — {item?.name}</DialogTitle>
          <DialogDescription>
            Amounts are defined in the Financials tab; here you only attach items to this {item?.kind === "Milestone" ? "milestone" : "task"}.
          </DialogDescription>
        </DialogHeader>
        <FinancialLinkField
          costIds={costIds}
          revenueIds={revenueIds}
          onChange={({ cost, revenue }) => { setCostIds(cost); setRevenueIds(revenue); }}
          linkedElsewhere={linkedElsewhere}
        />
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={save}>Save links</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
