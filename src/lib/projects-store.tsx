import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { projects as initialProjects, rfps as initialRfps, orgTags as initialTags, workCalendars as initialCalendars, type Project, type WorkCalendar } from "./mock-data";

export type OrgTag = { name: string; color: string };

export type JobRole = { id: string; title: string };

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
  type: "milestone-gate" | "change-request";
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

const SEED_JOB_ROLES: JobRole[] = [
  { id: "jr-ba",     title: "Business Analyst" },
  { id: "jr-sa",     title: "Solution Architect" },
  { id: "jr-ux",     title: "UX Designer" },
  { id: "jr-be",     title: "Backend Dev" },
  { id: "jr-fe",     title: "Frontend Dev" },
  { id: "jr-int",    title: "Integration Dev" },
  { id: "jr-de",     title: "Data Engineer" },
  { id: "jr-qa",     title: "QA Engineer" },
  { id: "jr-qal",    title: "QA Lead" },
  { id: "jr-devops", title: "DevOps Engineer" },
  { id: "jr-sec",    title: "Security Lead" },
  { id: "jr-perf",   title: "Performance Engineer" },
  { id: "jr-sup",    title: "Support Lead" },
  { id: "jr-tr",     title: "Trainer" },
  { id: "jr-pm",     title: "Project Manager" },
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
  // Calendars
  calendars: WorkCalendar[];
  addCalendar: (c: WorkCalendar) => void;
  updateCalendar: (id: string, patch: Partial<WorkCalendar>) => void;
  removeCalendar: (id: string) => void;
  // Job roles (Organization-level)
  jobRoles: JobRole[];
  addJobRole: (title: string) => void;
  updateJobRole: (id: string, title: string) => void;
  removeJobRole: (id: string) => void;
  // Identity (demo "view as" switcher)
  currentUser: AppUser;
  setCurrentUserId: (id: string) => void;
  // Approvals inbox
  approvals: ApprovalRequest[];
  addApprovalRequest: (r: Omit<ApprovalRequest, "id" | "status" | "requestedAt" | "reminders">) => string;
  decideApproval: (id: string, approverId: string, decision: Exclude<ApprovalDecision, "pending">, comment?: string) => void;
  remindApproval: (id: string) => void;
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
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);

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
    setApprovals((prev) => prev.map((a) => {
      if (a.id !== id) return a;
      const approvers = a.approvers.map((ap) => ap.id === approverId
        ? { ...ap, decision, decidedAt: new Date().toISOString().split("T")[0], comment }
        : ap);
      const status: ApprovalDecision =
        approvers.some((ap) => ap.decision === "rejected") ? "rejected"
        : approvers.every((ap) => ap.decision === "approved") ? "approved"
        : "pending";
      return { ...a, approvers, status };
    }));
  }

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

  function addJobRole(title: string) {
    const t = title.trim();
    if (!t) return;
    setJobRoles((prev) => prev.some((r) => r.title.toLowerCase() === t.toLowerCase())
      ? prev
      : [...prev, { id: `jr-${Date.now()}`, title: t }]);
  }
  function updateJobRole(id: string, title: string) {
    const t = title.trim();
    if (!t) return;
    setJobRoles((prev) => prev.map((r) => r.id === id ? { ...r, title: t } : r));
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
      tags, addTag,
      calendars, addCalendar, updateCalendar, removeCalendar,
      jobRoles, addJobRole, updateJobRole, removeJobRole,
      currentUser, setCurrentUserId,
      approvals, addApprovalRequest, decideApproval, remindApproval,
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
  const { tags, addTag } = useAppContext();
  return { tags, addTag };
}

export function useCalendars() {
  const { calendars, addCalendar, updateCalendar, removeCalendar } = useAppContext();
  return { calendars, addCalendar, updateCalendar, removeCalendar };
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
