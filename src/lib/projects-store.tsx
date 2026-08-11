import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { projects as initialProjects, rfps as initialRfps, orgTags as initialTags, workCalendars as initialCalendars, type Project, type WorkCalendar } from "./mock-data";

export type OrgTag = { name: string; color: string };

export type JobRole = { id: string; title: string; skills?: string[] };

// ── Identity (demo role switcher) ─────────────────────────────────────────────

export type AppUser = { id: string; name: string; role: string; department?: string };

export const APP_USERS: AppUser[] = [
  { id: "u-aisha", name: "Aisha Khoury",  role: "Portfolio Director", department: "PMO" },
  { id: "u-sara",  name: "Sara Al-Rashid", role: "Director",          department: "Engineering" },
  { id: "u-john",  name: "John Smith",     role: "Project Manager",   department: "IT" },
  { id: "u-mei",   name: "Mei Chen",       role: "Solution Architect", department: "Engineering" },
];

// ── Approvals ─────────────────────────────────────────────────────────────────

export type ApprovalDecision = "pending" | "approved" | "rejected";

export type ApprovalApprover = {
  id: string; name: string; role: string; department?: string;
  decision: ApprovalDecision; decidedAt?: string; comment?: string;
};

export type ApprovalRequest = {
  id: string;
  type: "milestone-gate" | "change-request" | "calendar-change";
  projectId: string;
  projectName: string;
  /** Milestone name or Change Request id. */
  ref: string;
  title: string;
  requestedBy: string;
  requestedAt: string;
  summary: { label: string; before?: string; after?: string }[];
  approvers: ApprovalApprover[];
  status: ApprovalDecision;
  reminders: number;
};

const SEED_APPROVALS: ApprovalRequest[] = [
  {
    id: "AP-1041",
    type: "milestone-gate",
    projectId: "p-001",
    projectName: "ERP System Upgrade",
    ref: "Discovery Sign-off",
    title: "Milestone completion — Discovery Sign-off",
    requestedBy: "John Smith",
    requestedAt: "2026-07-24",
    summary: [
      { label: "Milestone progress", before: "80%", after: "100%" },
      { label: "Tasks completed", before: "4 of 5", after: "5 of 5" },
      { label: "Finish date", before: "2026-07-26", after: "2026-07-24" },
    ],
    approvers: [
      { id: "u-sara", name: "Sara Al-Rashid", role: "Director", department: "Engineering", decision: "approved", decidedAt: "2026-07-25" },
      { id: "u-aisha", name: "Aisha Khoury", role: "Portfolio Director", department: "PMO", decision: "pending" },
    ],
    status: "pending",
    reminders: 1,
  },
  {
    id: "AP-1038",
    type: "change-request",
    projectId: "p-002",
    projectName: "Coastal Refinery Expansion",
    ref: "CR-schedule-0042",
    title: "Project Schedule change request — 3 changes",
    requestedBy: "Mei Chen",
    requestedAt: "2026-07-23",
    summary: [
      { label: "Detailed Design · Finish", before: "2026-09-10", after: "2026-10-02" },
      { label: "Detailed Design · Owner", before: "Omar Haddad", after: "Mei Chen" },
      { label: "Procurement Kick-off · Depends on", before: "Detailed Design (FS)", after: "Detailed Design (FS +10d)" },
    ],
    approvers: [
      { id: "u-aisha", name: "Aisha Khoury", role: "Portfolio Director", department: "PMO", decision: "pending" },
      { id: "u-sara", name: "Sara Al-Rashid", role: "Director", department: "Engineering", decision: "pending" },
    ],
    status: "pending",
    reminders: 0,
  },
  {
    id: "AP-1035",
    type: "change-request",
    projectId: "p-003",
    projectName: "Salesforce Migration",
    ref: "CR-financials-0031",
    title: "Financials change request — 2 changes",
    requestedBy: "John Smith",
    requestedAt: "2026-07-21",
    summary: [
      { label: "Licences · Budget", before: "$180,000", after: "$225,000" },
      { label: "Integration · Cost type", before: "OpEx", after: "CapEx" },
    ],
    approvers: [
      { id: "u-aisha", name: "Aisha Khoury", role: "Portfolio Director", department: "PMO", decision: "pending" },
    ],
    status: "pending",
    reminders: 2,
  },
  {
    id: "AP-1029",
    type: "change-request",
    projectId: "p-006",
    projectName: "Customer Portal v3",
    ref: "CR-charter-0018",
    title: "Project Charter change request — 1 change",
    requestedBy: "Mei Chen",
    requestedAt: "2026-07-16",
    summary: [{ label: "Objective", before: "Launch portal MVP by Q3", after: "Launch portal MVP + payments by Q4" }],
    approvers: [
      { id: "u-aisha", name: "Aisha Khoury", role: "Portfolio Director", department: "PMO", decision: "approved", decidedAt: "2026-07-17", comment: "Scope aligned with the commercial plan." },
    ],
    status: "approved",
    reminders: 0,
  },
  {
    id: "AP-1024",
    type: "milestone-gate",
    projectId: "p-005",
    projectName: "Warehouse Robotics",
    ref: "Pilot Acceptance",
    title: "Milestone completion — Pilot Acceptance",
    requestedBy: "Omar Haddad",
    requestedAt: "2026-07-12",
    summary: [{ label: "Milestone progress", before: "95%", after: "100%" }],
    approvers: [
      { id: "u-sara", name: "Sara Al-Rashid", role: "Director", department: "Engineering", decision: "rejected", decidedAt: "2026-07-13", comment: "Two acceptance defects still open." },
    ],
    status: "rejected",
    reminders: 0,
  },
  {
    id: "AP-1026",
    type: "calendar-change",
    projectId: "p-001",
    projectName: "9 linked projects",
    ref: "Egypt — Standard",
    title: "Calendar change request — Egypt — Standard",
    requestedBy: "Aisha Khoury",
    requestedAt: "2026-07-27",
    summary: [
      { label: "Holiday · 2026-08-13", before: "—", after: "Eid Al-Adha (extended)" },
      { label: "Hours / day", before: "8h", after: "7.5h" },
      { label: "Impacted projects", after: "ERP System Upgrade, Smart Grid Pilot, Data Lake Foundation, +6 more" },
    ],
    approvers: [
      { id: "u-aisha", name: "Aisha Khoury", role: "Portfolio Director", department: "PMO", decision: "pending" },
      { id: "u-sara", name: "Sara Al-Rashid", role: "Director", department: "Engineering", decision: "pending" },
    ],
    status: "pending",
    reminders: 0,
  },
];

const SEED_JOB_ROLES: JobRole[] = [
  { id: "jr-ba",     title: "Business Analyst",       skills: ["Requirements elicitation", "BPMN", "User stories"] },
  { id: "jr-sa",     title: "Solution Architect",     skills: ["System design", "Integration patterns", "Cloud architecture"] },
  { id: "jr-ux",     title: "UX Designer",            skills: ["Wireframing", "Figma", "Usability testing"] },
  { id: "jr-be",     title: "Backend Dev",            skills: ["Node.js", "SQL", "REST APIs"] },
  { id: "jr-fe",     title: "Frontend Dev",           skills: ["React", "TypeScript", "Tailwind CSS"] },
  { id: "jr-int",    title: "Integration Dev",        skills: ["Middleware", "SOAP/REST", "Message queues"] },
  { id: "jr-de",     title: "Data Engineer",          skills: ["ETL", "Data modelling", "Spark"] },
  { id: "jr-qa",     title: "QA Engineer",            skills: ["Test cases", "Automation", "Regression testing"] },
  { id: "jr-qal",    title: "QA Lead",                skills: ["Test strategy", "Defect governance", "Team leadership"] },
  { id: "jr-devops", title: "DevOps Engineer",        skills: ["CI/CD", "Kubernetes", "Observability"] },
  { id: "jr-sec",    title: "Security Lead",          skills: ["Threat modelling", "Pen-testing", "Compliance"] },
  { id: "jr-perf",   title: "Performance Engineer",   skills: ["Load testing", "Profiling", "Tuning"] },
  { id: "jr-sup",    title: "Support Lead",           skills: ["Incident management", "SLA handling", "Escalation"] },
  { id: "jr-tr",     title: "Trainer",                skills: ["Curriculum design", "Facilitation", "Documentation"] },
  { id: "jr-pm",     title: "Project Manager",        skills: ["Scheduling", "Stakeholder management", "Risk control"] },
];

// ── Shared types ──────────────────────────────────────────────────────────────

export type Notification = {
  id: string;
  tone: "red" | "amber" | "green" | "blue";
  title: string;
  time: string;
  read: boolean;
};

export type RfpEntry = {
  id: string; title: string; type: string;
  status: string; bidders: number; due: string; project?: string;
};

export type ResourceRequest = {
  id: string; project: string; role: string;
  skill: "Junior" | "Mid" | "Senior" | "Lead";
  fte: number; from: string; until: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Pending" | "Fulfilled" | "Declined";
  submittedBy: string; date: string; notes: string;
  assignedTo?: string; declineReason?: string;
};

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_NOTIFS: Notification[] = [
  { id: "n1", tone: "red",   title: "ERP Upgrade slipping — UAT Sign-off in 18 days", time: "12m ago",   read: false },
  { id: "n2", tone: "amber", title: "Business Case BC-018 awaiting your review",       time: "1h ago",    read: false },
  { id: "n3", tone: "green", title: "Salesforce Migration milestone closed",           time: "3h ago",    read: false },
  { id: "n4", tone: "amber", title: "Priya Iyer over-allocated to 102%",              time: "Yesterday", read: false },
  { id: "n5", tone: "blue",  title: "Weekly Executive Report ready",                  time: "Yesterday", read: false },
];

const SEED_RFPS: RfpEntry[] = initialRfps.map((r) => ({ ...r }));

export const SEED_RESOURCE_REQUESTS: ResourceRequest[] = [
  { id: "RR-001", project: "ERP System Upgrade",         role: "Solution Architect", skill: "Senior", fte: 1.0, from: "2026-06", until: "2026-09", priority: "Critical", status: "Pending",   submittedBy: "Sara Al-Rashid", date: "2d ago",  notes: "Must have SAP ECC or S/4HANA experience" },
  { id: "RR-002", project: "Coastal Refinery Expansion",  role: "Field Engineer",    skill: "Senior", fte: 2.0, from: "2026-07", until: "2026-12", priority: "High",     status: "Pending",   submittedBy: "John Smith",     date: "3d ago",  notes: "" },
  { id: "RR-003", project: "Smart Grid Pilot",            role: "QA Engineer",       skill: "Mid",    fte: 1.0, from: "2026-07", until: "2026-09", priority: "Medium",   status: "Pending",   submittedBy: "Priya Iyer",     date: "5d ago",  notes: "" },
  { id: "RR-004", project: "AI Forecasting Engine",       role: "Data Engineer",     skill: "Mid",    fte: 1.5, from: "2026-06", until: "2026-11", priority: "Medium",   status: "Pending",   submittedBy: "Diego Ortiz",    date: "6d ago",  notes: "Python + Spark stack preferred" },
  { id: "RR-005", project: "Security Hardening 2026",     role: "Security Lead",     skill: "Senior", fte: 0.5, from: "2026-08", until: "2026-08", priority: "Critical", status: "Fulfilled", submittedBy: "Mei Chen",       date: "1w ago",  notes: "Pen-test cert required", assignedTo: "Mei Chen" },
  { id: "RR-006", project: "Warehouse Robotics",          role: "Change Manager",    skill: "Mid",    fte: 0.5, from: "2026-09", until: "2026-09", priority: "Low",      status: "Declined",  submittedBy: "Priya Iyer",     date: "1w ago",  notes: "", declineReason: "No available change managers this quarter — recommend external consultant" },
];

// ── Context ───────────────────────────────────────────────────────────────────

type AppContextValue = {
  // Projects
  projects: Project[];
  addProject: (p: Project) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, "id" | "read">) => void;
  markAllRead: () => void;
  // RFPs
  rfps: RfpEntry[];
  addRfp: (r: RfpEntry) => void;
  // Resource requests
  resourceRequests: ResourceRequest[];
  addResourceRequest: (r: Omit<ResourceRequest, "id" | "date" | "status">) => string;
  updateResourceRequest: (id: string, patch: Partial<ResourceRequest>) => void;
  // Tags
  tags: (OrgTag & { usage: number })[];
  addTag: (tag: OrgTag, projectIds: string[]) => void;
  updateTag: (oldName: string, patch: Partial<OrgTag>) => void;
  removeTag: (name: string) => void;
  // Calendars
  calendars: WorkCalendar[];
  addCalendar: (c: WorkCalendar) => void;
  updateCalendar: (id: string, patch: Partial<WorkCalendar>) => void;
  removeCalendar: (id: string) => void;
  // Job roles (Organization-level)
  jobRoles: JobRole[];
  addJobRole: (title: string, skills?: string[]) => void;
  updateJobRole: (id: string, title: string, skills?: string[]) => void;
  removeJobRole: (id: string) => void;
  // Identity (demo "view as" switcher)
  currentUser: AppUser;
  setCurrentUserId: (id: string) => void;
  // Approvals inbox
  approvals: ApprovalRequest[];
  addApprovalRequest: (r: Omit<ApprovalRequest, "id" | "status" | "requestedAt" | "reminders">) => string;
  decideApproval: (id: string, approverId: string, decision: Exclude<ApprovalDecision, "pending">, comment?: string) => void;
  remindApproval: (id: string) => void;
  /** Applies the calendar edit immediately and asks each linked project to accept or keep its current calendar. */
  updateCalendarWithAdoption: (calendarId: string, patch: Partial<WorkCalendar>, summary: { label: string; before?: string; after?: string }[]) => number;
  pendingCalendarIds: string[];
};

const AppContext = createContext<AppContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFS);
  const [rfps, setRfps] = useState<RfpEntry[]>(SEED_RFPS);
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>(SEED_RESOURCE_REQUESTS);
  const [tagList, setTagList] = useState<OrgTag[]>(initialTags.map(({ name, color }) => ({ name, color })));
  const [calendars, setCalendars] = useState<WorkCalendar[]>(initialCalendars);
  const [jobRoles, setJobRoles] = useState<JobRole[]>(SEED_JOB_ROLES);
  const [currentUserId, setCurrentUserId] = useState<string>("u-aisha");
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(SEED_APPROVALS);
  // approvalId -> per-project adoption of an already-applied calendar edit.
  // Rejecting pins that project to a frozen copy of the previous calendar.
  const [pendingCalendarPatches, setPendingCalendarPatches] = useState<
    Record<string, { calendarId: string; projectId: string; previous: WorkCalendar }>
  >({});

  const currentUser = APP_USERS.find((u) => u.id === currentUserId) ?? APP_USERS[0];

  function addApprovalRequest(r: Omit<ApprovalRequest, "id" | "status" | "requestedAt" | "reminders">) {
    const id = `AP-${String(Date.now()).slice(-5)}`;
    setApprovals((prev) => [
      { ...r, id, status: "pending", requestedAt: new Date().toISOString().split("T")[0], reminders: 0 },
      ...prev,
    ]);
    setNotifications((prev) => [{
      id: `n-${Date.now()}`,
      tone: "amber" as const,
      title: `Approval requested: ${r.title}`,
      time: "Just now",
      read: false,
    }, ...prev]);
    return id;
  }

  function decideApproval(id: string, approverId: string, decision: Exclude<ApprovalDecision, "pending">, comment?: string) {
    let finalStatus: ApprovalDecision = "pending";
    setApprovals((prev) => prev.map((a) => {
      if (a.id !== id) return a;
      const approvers = a.approvers.map((ap) => ap.id === approverId
        ? { ...ap, decision, decidedAt: new Date().toISOString().split("T")[0], comment }
        : ap);
      const status: ApprovalDecision =
        approvers.some((ap) => ap.decision === "rejected") ? "rejected"
        : approvers.every((ap) => ap.decision === "approved") ? "approved"
        : "pending";
      finalStatus = status;
      return { ...a, approvers, status };
    }));
    // Calendar edits are already applied org-wide. A project that rejects the
    // update keeps working on a frozen copy of the previous calendar.
    const queued = pendingCalendarPatches[id];
    if (queued && finalStatus !== "pending") {
      if (finalStatus === "rejected") {
        const pinnedId = `${queued.previous.id}-pinned-${queued.projectId}`;
        setCalendars((prev) => prev.some((c) => c.id === pinnedId)
          ? prev
          : [...prev, { ...queued.previous, id: pinnedId, name: `${queued.previous.name} (kept — previous version)` }]);
        setProjects((prev) => prev.map((p) => p.id === queued.projectId ? { ...p, calendarId: pinnedId } : p));
      } else {
        setProjects((prev) => prev.map((p) => p.id === queued.projectId ? { ...p, calendarId: queued.calendarId } : p));
      }
      setPendingCalendarPatches((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function updateCalendarWithAdoption(
    calendarId: string,
    patch: Partial<WorkCalendar>,
    summary: { label: string; before?: string; after?: string }[],
  ) {
    const cal = calendars.find((c) => c.id === calendarId);
    if (!cal) return 0;
    const previous: WorkCalendar = { ...cal, holidays: cal.holidays.map((h) => ({ ...h })) };
    // The edit takes effect right away — no baseline lock.
    setCalendars((prev) => prev.map((c) => c.id === calendarId ? { ...c, ...patch } : c));

    const affected = projects.filter((p) => p.calendarId === calendarId);
    const queued: Record<string, { calendarId: string; projectId: string; previous: WorkCalendar }> = {};
    for (const p of affected) {
      const pmUser = APP_USERS.find((u) => u.name === p.pm);
      const approvers: ApprovalApprover[] = [
        pmUser
          ? { id: pmUser.id, name: pmUser.name, role: pmUser.role, department: pmUser.department, decision: "pending" as const }
          : { id: "u-aisha", name: "Aisha Khoury", role: "Portfolio Director", department: "PMO", decision: "pending" as const },
      ];
      const id = addApprovalRequest({
        type: "calendar-change",
        projectId: p.id,
        projectName: p.name,
        ref: cal.name,
        title: `Adopt calendar update — ${patch.name ?? cal.name}`,
        requestedBy: currentUser.name,
        summary: [
          ...summary,
          { label: "If rejected", after: `${p.name} keeps the previous calendar version` },
        ],
        approvers,
      });
      queued[id] = { calendarId, projectId: p.id, previous };
    }
    setPendingCalendarPatches((prev) => ({ ...prev, ...queued }));
    return affected.length;
  }

  const pendingCalendarIds = useMemo(() => {
    const pendingIds = new Set(approvals.filter((a) => a.status === "pending").map((a) => a.id));
    return Object.entries(pendingCalendarPatches)
      .filter(([apId]) => pendingIds.has(apId))
      .map(([, v]) => v.calendarId);
  }, [approvals, pendingCalendarPatches]);

  function remindApproval(id: string) {
    setApprovals((prev) => prev.map((a) => a.id === id ? { ...a, reminders: a.reminders + 1 } : a));
  }

  function addCalendar(c: WorkCalendar) { setCalendars((prev) => [...prev, c]); }
  function updateCalendar(id: string, patch: Partial<WorkCalendar>) {
    setCalendars((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));
  }
  function removeCalendar(id: string) {
    setCalendars((prev) => prev.filter((c) => c.id !== id));
  }

  function addJobRole(title: string, skills?: string[]) {
    const t = title.trim();
    if (!t) return;
    setJobRoles((prev) => prev.some((r) => r.title.toLowerCase() === t.toLowerCase())
      ? prev
      : [...prev, { id: `jr-${Date.now()}`, title: t, skills: skills ?? [] }]);
  }
  function updateJobRole(id: string, title: string, skills?: string[]) {
    const t = title.trim();
    if (!t) return;
    setJobRoles((prev) => prev.map((r) => r.id === id ? { ...r, title: t, ...(skills ? { skills } : {}) } : r));
  }
  function removeJobRole(id: string) {
    setJobRoles((prev) => prev.filter((r) => r.id !== id));
  }

  const tags = useMemo(
    () => tagList.map((t) => ({ ...t, usage: projects.filter((p) => p.tags.includes(t.name)).length })),
    [tagList, projects],
  );

  function addTag(tag: OrgTag, projectIds: string[]) {
    setTagList((prev) => prev.some((t) => t.name.toLowerCase() === tag.name.toLowerCase()) ? prev : [...prev, tag]);
    if (projectIds.length) {
      setProjects((prev) => prev.map((p) =>
        projectIds.includes(p.id) && !p.tags.includes(tag.name) ? { ...p, tags: [...p.tags, tag.name] } : p,
      ));
    }
  }

  function updateTag(oldName: string, patch: Partial<OrgTag>) {
    setTagList((prev) => prev.map((t) => t.name === oldName ? { ...t, ...patch } : t));
    if (patch.name && patch.name !== oldName) {
      const next = patch.name;
      setProjects((prev) => prev.map((p) =>
        p.tags.includes(oldName) ? { ...p, tags: p.tags.map((t) => t === oldName ? next : t) } : p,
      ));
    }
  }

  function removeTag(name: string) {
    setTagList((prev) => prev.filter((t) => t.name !== name));
    setProjects((prev) => prev.map((p) =>
      p.tags.includes(name) ? { ...p, tags: p.tags.filter((t) => t !== name) } : p,
    ));
  }


  const unreadCount = notifications.filter((n) => !n.read).length;

  function addProject(p: Project) { setProjects((prev) => [p, ...prev]); }
  function updateProject(id: string, patch: Partial<Project>) {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p));
  }

  function addNotification(n: Omit<Notification, "id" | "read">) {
    setNotifications((prev) => [{ ...n, id: `n-${Date.now()}`, read: false }, ...prev]);
  }
  function markAllRead() { setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))); }

  function addRfp(r: RfpEntry) { setRfps((prev) => [r, ...prev]); }

  function addResourceRequest(r: Omit<ResourceRequest, "id" | "date" | "status">) {
    const id = `RR-${String(Date.now()).slice(-4)}-${Math.floor(Math.random() * 1000)}`;
    setResourceRequests((prev) => [{
      ...r,
      id,
      date: "Just now",
      status: "Pending",
    }, ...prev]);
    return id;
  }
  function updateResourceRequest(id: string, patch: Partial<ResourceRequest>) {
    setResourceRequests((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));
  }

  return (
    <AppContext.Provider value={{
      projects, addProject, updateProject,
      notifications, unreadCount, addNotification, markAllRead,
      rfps, addRfp,
      resourceRequests, addResourceRequest, updateResourceRequest,
      tags, addTag, updateTag, removeTag,
      calendars, addCalendar, updateCalendar, removeCalendar,
      jobRoles, addJobRole, updateJobRole, removeJobRole,
      currentUser, setCurrentUserId,
      approvals, addApprovalRequest, decideApproval, remindApproval,
      submitCalendarChangeRequest, pendingCalendarIds,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("Must be used within ProjectsProvider");
  return ctx;
}

export function useProjects() { return useAppContext(); }

export function useNotifications() {
  const { notifications, unreadCount, addNotification, markAllRead } = useAppContext();
  return { notifications, unreadCount, addNotification, markAllRead };
}

export function useRfps() {
  const { rfps, addRfp } = useAppContext();
  return { rfps, addRfp };
}

export function useResourceRequests() {
  const { resourceRequests, addResourceRequest, updateResourceRequest } = useAppContext();
  return { resourceRequests, addResourceRequest, updateResourceRequest };
}

export function useTags() {
  const { tags, addTag, updateTag, removeTag } = useAppContext();
  return { tags, addTag, updateTag, removeTag };
}

export function useCalendars() {
  const { calendars, addCalendar, updateCalendar, removeCalendar, submitCalendarChangeRequest, pendingCalendarIds } = useAppContext();
  return { calendars, addCalendar, updateCalendar, removeCalendar, submitCalendarChangeRequest, pendingCalendarIds };
}

export function useJobRoles() {
  const { jobRoles, addJobRole, updateJobRole, removeJobRole } = useAppContext();
  return { jobRoles, addJobRole, updateJobRole, removeJobRole };
}

export function useCurrentUser() {
  const { currentUser, setCurrentUserId } = useAppContext();
  return { currentUser, setCurrentUserId, users: APP_USERS };
}

export function useApprovals() {
  const { approvals, addApprovalRequest, decideApproval, remindApproval, currentUser } = useAppContext();
  const myPending = approvals.filter(
    (a) => a.status === "pending" && a.approvers.some((ap) => ap.id === currentUser.id && ap.decision === "pending"),
  );
  return { approvals, addApprovalRequest, decideApproval, remindApproval, currentUser, myPending };
}
