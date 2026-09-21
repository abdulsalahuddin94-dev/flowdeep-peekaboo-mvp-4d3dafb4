// Mock data for the Nexus PMO UI mockup. No backend.

export type Rag = "green" | "amber" | "red" | "blue" | "grey";

export interface Project {
  id: string;
  code: string;
  name: string;
  businessLine: string;
  department: string[];
  pm: string;
  pmAvatar: string;
  progress: number;
  budgetUsed: number;
  budgetTotal: number;
  startDate: string;
  endDate: string;
  rag: Rag;
  risks: number;
  issues: number;
  stage: "Initiation" | "Planning" | "Execution" | "Monitoring" | "Closure";
  tags: string[];
  client?: string;
  ragNote?: string;
  calendarId?: string;
  /** The first approved project-wide schedule and financial plan has been saved. */
  baselineLocked?: boolean;
}

/** Parses the "MMM DD, YYYY" display format used for project dates. Returns null for "—" or unparsable input. */
export function parseLabelDate(s: string | undefined): Date | null {
  if (!s || s === "—") return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatLabelDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

/** Formats a Date as a local YYYY-MM-DD (for <input type="date"> values) without the UTC-shift `toISOString` can introduce. */
export function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Inclusive day count between two "MMM DD, YYYY" labels, or null if either is missing/unparsable. */
export function projectDurationDays(p: Pick<Project, "startDate" | "endDate">): number | null {
  const start = parseLabelDate(p.startDate);
  const end = parseLabelDate(p.endDate);
  if (!start || !end) return null;
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86_400_000) + 1;
}

// Working calendar: which weekdays count as work days (0=Sun..6=Sat),
// hours per work day, and a list of named non-working holidays (YYYY-MM-DD).
export interface WorkCalendar {
  id: string;
  name: string;
  workingDays: number[];        // e.g. [0,1,2,3,4] (Sun–Thu) for Egypt
  hoursPerDay: number;
  holidays: { date: string; label: string }[];
  /** Inactive calendars stay on record but can't be linked to new projects. */
  active?: boolean;
}

const pms = [
  ["Sara Al-Rashid", "SA"], ["John Smith", "JS"], ["Mei Chen", "MC"],
  ["Omar Haddad", "OH"], ["Priya Iyer", "PI"], ["Liam Walker", "LW"],
  ["Hana Tanaka", "HT"], ["Diego Ortiz", "DO"],
];

const lines = ["Software Solutions", "EPC", "Consultation", "Maintenance"];
const depts = ["Engineering", "IT", "Operations", "R&D", "Finance"];
const tags = ["Strategic", "Compliance", "Innovation", "Cost-Saving", "Customer-Facing"];

const seed = [
  ["ERP System Upgrade", "red", 61, 2.1, 3.2, "Jun 15, 2026", "Critical", "Execution"],
  ["Coastal Refinery Expansion", "amber", 38, 14.2, 42.0, "Dec 02, 2026", "Vendor SLA", "Execution"],
  ["Salesforce Migration", "green", 84, 0.84, 1.10, "Jul 22, 2026", "On Track", "Monitoring"],
  ["Smart Grid Pilot", "green", 22, 0.45, 2.8, "Mar 14, 2027", "On Track", "Planning"],
  ["Warehouse Robotics", "amber", 56, 3.7, 5.4, "Oct 08, 2026", "Scope creep", "Execution"],
  ["Customer Portal v3", "green", 71, 0.62, 0.95, "Aug 30, 2026", "On Track", "Execution"],
  ["Data Lake Foundation", "blue", 8, 0.05, 1.6, "Jan 19, 2027", "Initiating", "Initiation"],
  ["Plant Maintenance Q3", "amber", 47, 0.88, 1.40, "Sep 12, 2026", "Parts delay", "Execution"],
  ["AI Forecasting Engine", "green", 33, 0.31, 1.20, "Nov 05, 2026", "On Track", "Planning"],
  ["Security Hardening 2026", "red", 19, 0.42, 0.60, "Jul 03, 2026", "Audit findings", "Execution"],
  ["Mobile Workforce App", "green", 64, 0.55, 0.90, "Aug 11, 2026", "On Track", "Execution"],
  ["EPC Substation Bravo", "amber", 51, 7.2, 12.5, "Feb 28, 2027", "Permit risk", "Execution"],
  ["Document AI Pilot", "blue", 4, 0.02, 0.40, "Apr 22, 2027", "Initiating", "Initiation"],
  ["Procurement Modernization", "green", 77, 1.10, 1.50, "Jul 30, 2026", "On Track", "Monitoring"],
  ["Cloud Cost Optimization", "green", 89, 0.18, 0.22, "Jun 09, 2026", "On Track", "Closure"],
  ["LNG Terminal Refit", "amber", 41, 9.4, 18.0, "Mar 30, 2027", "Weather slip", "Execution"],
  ["HRIS Replacement", "green", 58, 0.74, 1.30, "Oct 21, 2026", "On Track", "Execution"],
  ["Asset Tracking IoT", "green", 27, 0.21, 0.90, "Dec 14, 2026", "On Track", "Planning"],
  ["Regulatory Reporting", "amber", 62, 0.49, 0.70, "Aug 02, 2026", "SME shortage", "Execution"],
  ["Solar Microgrid", "grey", 12, 0.10, 3.4, "—", "On Hold", "Planning"],
  ["BI Self-Service", "green", 44, 0.38, 0.85, "Nov 18, 2026", "On Track", "Execution"],
  ["Wellhead Automation", "red", 35, 5.1, 6.8, "Sep 27, 2026", "Critical vendor", "Execution"],
] as const;

export const projects: Project[] = seed.map((row, i) => {
  const [name, rag, progress, used, total, endDate, ragNote, stage] = row;
  const [pmName, pmAvatar] = pms[i % pms.length];
  // Deterministic, varied duration per project (90–510 days) used to derive a start date from the seeded end date.
  const durationDays = 90 + ((i * 53) % 420);
  const endD = parseLabelDate(endDate);
  const startDate = endD ? formatLabelDate(new Date(endD.getTime() - durationDays * 86_400_000)) : "—";
  const client = ["ACME Energy", "Northwind Logistics", "Helios Solar", "Atlas Mining", "Internal"][i % 5];
  const codeYear = endD ? endD.getFullYear() : 2026;
  const codePrefix = client === "Internal" ? "CAP" : "COM";
  const code = `${codePrefix}-${codeYear}-${(1000 + i * 37).toString().padStart(4, "0")}`;
  return {
    id: `p-${(i + 1).toString().padStart(3, "0")}`,
    code,
    name,
    businessLine: lines[i % lines.length],
    department: [depts[i % depts.length]],
    pm: pmName,
    pmAvatar,
    progress,
    budgetUsed: used,
    budgetTotal: total,
    startDate,
    endDate,
    rag: rag as Rag,
    risks: ((i * 3 + 2) % 7) || 2,
    issues: ((i * 2 + 3) % 5) || 3,
    stage: stage as Project["stage"],
    tags: [tags[i % tags.length], tags[(i + 2) % tags.length]],
    client,
    ragNote,
    // Every project is bound to a working calendar so calendar edits always
    // have a visible downstream impact.
    calendarId: ["cal-eg", "cal-sa", "cal-intl"][i % 3],
    baselineLocked: true,
  };
});

export const portfolioSummary = {
  active: projects.length,
  onTrack: projects.filter((p) => p.rag === "green").length,
  atRisk: projects.filter((p) => p.rag === "amber").length,
  critical: projects.filter((p) => p.rag === "red").length,
  onHold: projects.filter((p) => p.rag === "grey").length,
  notStarted: projects.filter((p) => p.rag === "blue").length,
  budgetUsed: projects.reduce((s, p) => s + p.budgetUsed, 0),
  budgetTotal: projects.reduce((s, p) => s + p.budgetTotal, 0),
};

export const businessLines = [
  { name: "Software Solutions", color: "#51CAAD", projects: 7, description: "Enterprise software delivery & integrations" },
  { name: "EPC", color: "#F97316", projects: 5, description: "Engineering, Procurement & Construction" },
  { name: "Consultation", color: "#0EA5E9", projects: 4, description: "Advisory & strategy engagements" },
  { name: "Maintenance", color: "#8B5CF6", projects: 6, description: "Recurring service contracts" },
];

export const departments = [
  { name: "Engineering", parent: "—", head: "Sara Al-Rashid", members: 42, description: "Product engineering, delivery squads and technical leadership" },
  { name: "IT", parent: "—", head: "Mei Chen", members: 18, description: "Internal systems, infrastructure and end-user support" },
  { name: "Operations", parent: "—", head: "Omar Haddad", members: 31, description: "Service delivery operations and field execution" },
  { name: "R&D", parent: "Engineering", head: "Priya Iyer", members: 12, description: "Research, prototyping and innovation initiatives" },
  { name: "Finance", parent: "—", head: "Liam Walker", members: 9, description: "Budgeting, accounting and financial control" },
  { name: "Procurement", parent: "Operations", head: "Hana Tanaka", members: 7, description: "Vendor sourcing, contracts and purchasing" },
];

export const workCalendars: WorkCalendar[] = [
  {
    id: "cal-eg",
    name: "Egypt — Standard",
    workingDays: [0, 1, 2, 3, 4], // Sun–Thu
    hoursPerDay: 8,
    holidays: [
      { date: "2026-01-07", label: "Coptic Christmas" },
      { date: "2026-04-25", label: "Sinai Liberation Day" },
      { date: "2026-05-01", label: "Labour Day" },
      { date: "2026-07-23", label: "Revolution Day" },
      { date: "2026-10-06", label: "Armed Forces Day" },
    ],
  },
  {
    id: "cal-sa",
    name: "Saudi Arabia — Standard",
    workingDays: [0, 1, 2, 3, 4], // Sun–Thu (Fri/Sat off)
    hoursPerDay: 8,
    holidays: [
      { date: "2026-02-22", label: "Founding Day" },
      { date: "2026-09-23", label: "National Day" },
    ],
  },
  {
    id: "cal-intl",
    name: "International — Mon–Fri",
    workingDays: [1, 2, 3, 4, 5],
    hoursPerDay: 8,
    holidays: [
      { date: "2026-01-01", label: "New Year's Day" },
      { date: "2026-12-25", label: "Christmas Day" },
    ],
  },
];

export const orgTags = [
  { name: "Strategic", color: "#51CAAD", usage: 11 },
  { name: "Compliance", color: "#EF4444", usage: 6 },
  { name: "Innovation", color: "#8B5CF6", usage: 9 },
  { name: "Cost-Saving", color: "#10B981", usage: 5 },
  { name: "Customer-Facing", color: "#0EA5E9", usage: 8 },
];

export const clients = [
  { name: "ACME Energy", contact: "R. Hadid", projects: 4, revenue: 18.2, status: "Active" },
  { name: "Northwind Logistics", contact: "K. Bauer", projects: 3, revenue: 6.4, status: "Active" },
  { name: "Helios Solar", contact: "M. Park", projects: 2, revenue: 3.1, status: "Active" },
  { name: "Atlas Mining", contact: "T. Okafor", projects: 1, revenue: 2.7, status: "Active" },
];

export const vendors = [
  { name: "Siemens MENA", type: "Vendor", category: "Hardware", contracts: 6, spend: 12.4, eval: 4.6 },
  { name: "Oracle Consulting", type: "Vendor", category: "Software", contracts: 3, spend: 4.8, eval: 4.1 },
  { name: "Bechtel Subcontract", type: "Subcontractor", category: "EPC", contracts: 2, spend: 22.6, eval: 4.3 },
  { name: "Local Crane Co.", type: "Subcontractor", category: "Logistics", contracts: 4, spend: 1.1, eval: 3.8 },
  { name: "Cyberguard", type: "Vendor", category: "Security", contracts: 1, spend: 0.9, eval: 4.7 },
];

export const pipelineItems = [
  { id: "BC-2026-018", title: "AI-driven Predictive Maintenance", stage: "Under Review", score: 84, roi: "$3.2M", submittedBy: "Sara Al-Rashid", sponsor: "Ahmed Al-Mansouri", dept: "Innovation", date: "3d ago", pillar: "Innovation" },
  { id: "BC-2026-017", title: "Coastal Wind Farm Phase 2", stage: "Submitted", score: 71, roi: "$12.4M", submittedBy: "John Smith", sponsor: "Khalid Al-Farsi", dept: "Engineering", date: "5d ago", pillar: "Growth" },
  { id: "BC-2026-016", title: "Internal Audit Tooling", stage: "Revision Requested", score: 52, roi: "$0.8M", submittedBy: "Mei Chen", sponsor: "Nora Hassan", dept: "IT & Digital", date: "1w ago", pillar: "Compliance" },
  { id: "BC-2026-015", title: "Customer Loyalty Platform", stage: "Approved", score: 88, roi: "$5.6M", submittedBy: "Priya Iyer", sponsor: "Layla Mahmoud", dept: "Growth", date: "2w ago", pillar: "Growth" },
  { id: "BC-2026-014", title: "Legacy Decommissioning", stage: "Deferred", score: 38, roi: "$1.1M", submittedBy: "Liam Walker", sponsor: "Youssef Barakat", dept: "Operations", date: "3w ago", pillar: "Efficiency" },
  { id: "BC-2026-013", title: "Remote Operations Center", stage: "Under Review", score: 76, roi: "$4.0M", submittedBy: "Omar Haddad", sponsor: "Ahmed Al-Mansouri", dept: "Operations", date: "4d ago", pillar: "Operations" },
  { id: "BC-2026-012", title: "Carbon Tracking System", stage: "Submitted", score: 64, roi: "$2.2M", submittedBy: "Hana Tanaka", sponsor: "Reem Al-Dosari", dept: "ESG", date: "6d ago", pillar: "ESG" },
  { id: "BC-2026-011", title: "Field Engineer App Refresh", stage: "Rejected", score: 31, roi: "$0.4M", submittedBy: "Diego Ortiz", sponsor: "Khalid Al-Farsi", dept: "Engineering", date: "1mo ago", pillar: "Efficiency" },
];

export type RiskStatus = "Open" | "In Progress" | "Mitigated" | "Realized" | "Closed";

export interface RiskItem {
  id: string;
  project: string;
  title: string;
  category: string;
  prob: number;
  impact: number;
  score: number;
  status: RiskStatus;
  owner: string;
  mitigation: string;
  raised?: string;
  review?: string;
  /** Optional link to a schedule milestone in the same project. */
  milestone?: string;

}

export const RISK_CATEGORIES = [
  "Vendor", "Regulatory", "Compliance", "Resource", "Scope", "Schedule", "Supply", "Technical", "Financial",
];

export const risks: RiskItem[] = [
  { id: "R-091", project: "ERP System Upgrade", title: "Vendor delivery delay > 4 weeks", category: "Vendor", prob: 4, impact: 5, score: 20, status: "Open", owner: "Sara Al-Rashid", mitigation: "Switch to backup vendor; weekly SLA reviews" },
  { id: "R-088", project: "Coastal Refinery Expansion", title: "Permit approval slip", category: "Regulatory", prob: 3, impact: 5, score: 15, status: "In Progress", owner: "John Smith", mitigation: "Direct govt liaison engaged" },
  { id: "R-085", project: "Security Hardening 2026", title: "Audit finding remediation overrun", category: "Compliance", prob: 4, impact: 4, score: 16, status: "Open", owner: "Mei Chen", mitigation: "Daily standups, executive escalation" },
  { id: "R-081", project: "Wellhead Automation", title: "Specialist resource attrition", category: "Resource", prob: 3, impact: 4, score: 12, status: "Open", owner: "Omar Haddad", mitigation: "Retention bonus + knowledge transfer" },
  { id: "R-077", project: "Warehouse Robotics", title: "Scope creep from operations", category: "Scope", prob: 4, impact: 3, score: 12, status: "In Progress", owner: "Priya Iyer", mitigation: "CR board weekly; baselined scope locked" },
  { id: "R-074", project: "LNG Terminal Refit", title: "Severe weather window miss", category: "Schedule", prob: 3, impact: 4, score: 12, status: "Open", owner: "Liam Walker", mitigation: "Parallel work packages prepared" },
  { id: "R-070", project: "Plant Maintenance Q3", title: "Spare parts long lead-time", category: "Supply", prob: 3, impact: 3, score: 9, status: "In Progress", owner: "Hana Tanaka", mitigation: "Pre-orders placed; safety stock" },
  { id: "R-066", project: "Regulatory Reporting", title: "SME shortage during peak", category: "Resource", prob: 4, impact: 2, score: 8, status: "Open", owner: "Diego Ortiz", mitigation: "Contractor backfill arranged" },
  { id: "R-062", project: "Self-Service BI", title: "Data quality gaps in source systems", category: "Technical", prob: 2, impact: 3, score: 6, status: "In Progress", owner: "Priya Iyer", mitigation: "Profiling scripts + data owner sign-off" },
  { id: "R-058", project: "Cost Optimization", title: "FX movement on imported equipment", category: "Financial", prob: 2, impact: 2, score: 4, status: "Mitigated", owner: "Liam Walker", mitigation: "Forward contracts placed" },
];

export type IssuePriority = "High" | "Medium" | "Low";
export type IssueStatus = "Open" | "In Progress" | "Resolved" | "Escalated";

export interface IssueItem {
  id: string;
  project: string;
  title: string;
  /** Criticality of the issue (High / Medium / Low). */
  priority: IssuePriority;
  /** Impact rating, 1–5. */
  impact: number;
  owner: string;
  status: IssueStatus;
  raised: string;
  /** ISO date the issue was opened. */
  openDate: string;
  /** ISO target date for closure. */
  targetDate?: string;
  /** ISO date the issue was actually closed — set when it is resolved. */
  closureDate?: string;
  /** Action plan / corrective actions taken. */
  action: string;
  /** Originating risk id — optional, issues can be logged with no prior risk. */
  riskId?: string;
  /** Resolution description, required to resolve or close the issue. */
  resolution?: string;
  /** Optional supporting proof (photo or document file name). */
  attachment?: string;
  /** Optional link to a schedule milestone in the same project. */
  milestone?: string;
}


export const issues: IssueItem[] = [
  { id: "I-044", project: "ERP System Upgrade", title: "Test environment outage blocking QA", priority: "High", impact: 4, owner: "Mei Chen", status: "Escalated", raised: "2d ago", openDate: "2026-09-19", targetDate: "2026-09-30", riskId: "R-091", action: "Infra team restoring cluster; QA re-plan issued" },
  { id: "I-042", project: "Coastal Refinery Expansion", title: "Crane availability slip", priority: "Medium", impact: 3, owner: "John Smith", status: "Open", raised: "5d ago", openDate: "2026-09-16", targetDate: "2026-10-05", riskId: "R-088", action: "Alternative lifting subcontractor being quoted" },
  { id: "I-040", project: "Wellhead Automation", title: "Vendor on-site no-show", priority: "High", impact: 4, owner: "Omar Haddad", status: "In Progress", raised: "1d ago", openDate: "2026-09-20", targetDate: "2026-09-27", riskId: "R-081", action: "Escalated to vendor account manager" },
  { id: "I-038", project: "Self-Service BI", title: "Source system schema change", priority: "Low", impact: 2, owner: "Diego Ortiz", status: "Open", raised: "1w ago", openDate: "2026-09-14", targetDate: "2026-10-12", action: "Mapping layer rework scheduled next sprint" },
  { id: "I-035", project: "Warehouse Robotics", title: "Safety sign-off pending for pilot cell", priority: "Medium", impact: 3, owner: "Priya Iyer", status: "Open", raised: "3d ago", openDate: "2026-09-18", targetDate: "2026-09-29", action: "HSE walkthrough booked" },
  { id: "I-031", project: "Security Hardening 2026", title: "Patch window conflict with month-end close", priority: "Medium", impact: 2, owner: "Mei Chen", status: "Resolved", raised: "2w ago", openDate: "2026-09-07", targetDate: "2026-09-18", closureDate: "2026-09-17", action: "Window moved to first weekend of the month", resolution: "Patch window rescheduled and validated with Finance; no downtime during close.", attachment: "patch-window-signoff.pdf" },
];

export const resources = [
  { name: "Sara Al-Rashid", role: "Solution Architect", dept: "Engineering", util: 96, capacity: 40, projects: ["ERP", "Salesforce"] },
  { name: "John Smith", role: "PM", dept: "Operations", util: 110, capacity: 40, projects: ["Coastal Refinery", "LNG Terminal"] },
  { name: "Mei Chen", role: "Security Lead", dept: "IT", util: 88, capacity: 40, projects: ["Security Hardening"] },
  { name: "Omar Haddad", role: "Field Engineer", dept: "Operations", util: 72, capacity: 40, projects: ["Wellhead", "Substation"] },
  { name: "Priya Iyer", role: "Tech Lead", dept: "R&D", util: 102, capacity: 40, projects: ["AI Forecasting", "Robotics"] },
  { name: "Liam Walker", role: "Finance Analyst", dept: "Finance", util: 55, capacity: 40, projects: ["Cost Opt"] },
  { name: "Hana Tanaka", role: "Procurement Lead", dept: "Operations", util: 78, capacity: 40, projects: ["Modernization"] },
  { name: "Diego Ortiz", role: "BI Engineer", dept: "IT", util: 64, capacity: 40, projects: ["Self-Service BI"] },
];

export const contracts = [
  { id: "CT-2026-041", vendor: "Siemens MENA", project: "Substation Bravo", value: 4.2, status: "Active", end: "Dec 2026" },
  { id: "CT-2026-038", vendor: "Oracle Consulting", project: "ERP Upgrade", value: 1.6, status: "Active", end: "Sep 2026" },
  { id: "CT-2026-035", vendor: "Bechtel Subcontract", project: "Refinery Expansion", value: 18.0, status: "Active", end: "Mar 2027" },
  { id: "CT-2026-029", vendor: "Cyberguard", project: "Security Hardening", value: 0.9, status: "Expiring", end: "Jul 2026" },
];

export const rfps = [
  { id: "RFP-014", title: "Robotics Integration Partner", type: "RFP", status: "Open", bidders: 5, due: "Jun 30" },
  { id: "RFI-009", title: "AI Vendor Capability Survey", type: "RFI", status: "Closed", bidders: 12, due: "May 12" },
  { id: "RFP-013", title: "Substation Civil Works", type: "RFP", status: "Evaluation", bidders: 4, due: "May 28" },
  { id: "RFP-012", title: "Cloud Reseller Agreement", type: "RFP", status: "Awarded", bidders: 6, due: "Apr 18" },
];

export const reports = [
  { id: "RPT-EXEC", name: "Executive Portfolio Snapshot", audience: "C-Level", frequency: "Weekly", lastRun: "Today" },
  { id: "RPT-FIN", name: "Finance Burn-Down", audience: "Finance Manager", frequency: "Weekly", lastRun: "Yesterday" },
  { id: "RPT-RES", name: "Resource Utilization Heatmap", audience: "Resource Manager", frequency: "Daily", lastRun: "Today" },
  { id: "RPT-RAID", name: "Portfolio RAID Roll-up", audience: "Director", frequency: "Weekly", lastRun: "2d ago" },
  { id: "RPT-GOV", name: "Governance Decisions Log", audience: "Board", frequency: "Monthly", lastRun: "May 03" },
  { id: "RPT-VEN", name: "Vendor Performance Scorecard", audience: "Procurement", frequency: "Quarterly", lastRun: "Apr 01" },
];

export const roleCatalogue = [
  { name: "Super Admin", users: 2, color: "#8B5CF6", perms: 70, desc: "Full system access & RBAC editor" },
  { name: "Executive / C-Level", users: 6, color: "#8B5CF6", perms: 22, desc: "Portfolio + governance visibility" },
  { name: "Portfolio Director", users: 4, color: "#0EA5E9", perms: 48, desc: "Approves & monitors entire portfolio" },
  { name: "Project Manager", users: 24, color: "#10B981", perms: 36, desc: "Owns project execution & reporting" },
  { name: "Resource Manager", users: 3, color: "#F97316", perms: 28, desc: "Capacity planning & allocation" },
  { name: "Finance Manager", users: 4, color: "#F59E0B", perms: 24, desc: "Budgets, CRs, financial reports" },
  { name: "Team Member", users: 86, color: "#64748B", perms: 14, desc: "Tasks, timesheets, status updates" },
  { name: "Client (External)", users: 12, color: "#475569", perms: 6, desc: "Portal-only project visibility" },
];

export const milestones = [
  { project: "ERP System Upgrade", name: "UAT Sign-off", due: "Jun 15, 2026", in: 18, status: "amber" },
  { project: "Customer Portal v3", name: "Production cutover", due: "Aug 30, 2026", in: 94, status: "green" },
  { project: "Security Hardening 2026", name: "Pen-test remediation", due: "Jul 03, 2026", in: 36, status: "red" },
  { project: "Coastal Refinery Expansion", name: "Civil phase complete", due: "Sep 22, 2026", in: 117, status: "amber" },
  { project: "Smart Grid Pilot", name: "Pilot kick-off", due: "Jun 02, 2026", in: 5, status: "green" },
];
