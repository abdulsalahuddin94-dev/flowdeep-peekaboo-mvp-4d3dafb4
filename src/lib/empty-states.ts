import type { EmptyArt } from "@/components/ds/EmptyState";

/**
 * Catalog of every empty state in the app. The topbar toggle uses `path` to
 * decide which empty state(s) belong to the page the user is currently on, so
 * previewing one never needs a dedicated screen.
 */
export type EmptyStateEntry = {
  id: string;
  module: string;
  page: string;
  /** Route this empty state belongs to. */
  path: string;
  /** When true the pathname must equal `path`, otherwise a prefix match is enough. */
  exact?: boolean;
  art: EmptyArt;
  title: string;
  description?: string;
  ctaLabel?: string;
};

export const EMPTY_STATES: EmptyStateEntry[] = [
  // Dashboard
  { id: "dashboard-kpis", module: "Dashboard", page: "Overview", path: "/", exact: true, art: "clock", title: "No activity yet", description: "Once projects are created, your KPIs and activity feed show up here.", ctaLabel: "Create Project" },
  { id: "dashboard-notifications", module: "Dashboard", page: "Notifications", path: "/", exact: true, art: "bell", title: "You're all caught up", description: "New approvals, requests and status changes will appear here." },

  // Portfolio
  { id: "portfolio-projects", module: "Portfolio", page: "All Projects", path: "/portfolio", exact: true, art: "briefcase", title: "No Projects added yet", description: "Start by adding the first project", ctaLabel: "Add Project" },
  { id: "portfolio-search", module: "Portfolio", page: "Search results", path: "/portfolio", exact: true, art: "search", title: "No matching projects", description: "Try a different search term or clear your filters." },
  { id: "portfolio-schedule", module: "Portfolio", page: "Project Schedule", path: "/portfolio/", art: "clock", title: "No Milestones added yet", description: "Start by adding the first milestone", ctaLabel: "Add Milestone" },
  { id: "project-cost", module: "Portfolio", page: "Project Cost", path: "/portfolio/", art: "coins", title: "No Cost Items added yet", description: "Start by adding the first cost item", ctaLabel: "Add Cost" },
  { id: "project-revenue", module: "Portfolio", page: "Project Revenue", path: "/portfolio/", art: "coins", title: "No Revenue Events added yet", description: "Start by adding the first revenue event", ctaLabel: "Add Revenue Event" },
  { id: "project-overview-risks", module: "Portfolio", page: "Overview — Risks Summary", path: "/portfolio/", art: "shield", title: "No risks logged yet", description: "Risks linked to this project will appear here." },
  { id: "project-overview-gates", module: "Portfolio", page: "Overview — Stage Gates", path: "/portfolio/", art: "clock", title: "No stage gates yet", description: "Stage progress will appear once the project plan is set." },
  { id: "project-overview-health", module: "Portfolio", page: "Overview — Project Health", path: "/portfolio/", art: "shield", title: "No health update yet", description: "Submit a status update to establish project health." },
  { id: "project-overview-milestones", module: "Portfolio", page: "Overview — Next Milestones", path: "/portfolio/", art: "calendar", title: "No upcoming milestones", description: "The next scheduled milestones will appear here." },
  { id: "project-overview-budget", module: "Portfolio", page: "Overview — Budget Status", path: "/portfolio/", art: "coins", title: "No budget data yet", description: "Add planned costs to start tracking the budget." },
  { id: "project-team-members", module: "Portfolio", page: "Team — Members", path: "/portfolio/", art: "people", title: "No team members yet", description: "Request the roles you need. Once Resources fulfills a request, the employee joins the team.", ctaLabel: "Request role" },
  { id: "project-team-waiting", module: "Portfolio", page: "Team — Waiting on Resources", path: "/portfolio/", art: "clock", title: "Waiting on Resources", description: "Your open requests are with Resources. Each employee joins the team as soon as their request is fulfilled.", ctaLabel: "Request role" },
  { id: "project-team-requests", module: "Portfolio", page: "Team — Requests", path: "/portfolio/", art: "note", title: "No requests yet", description: "Ask Resources for people — for the whole project, a specific task, or a period of time.", ctaLabel: "Request role" },


  // Resources
  { id: "resources-capacity", module: "Resources", page: "Capacity", path: "/resources", art: "people", title: "No Resources added yet", description: "Start by adding the first resource", ctaLabel: "Add Resource" },
  { id: "resources-requests", module: "Resources", page: "Requests", path: "/resources", art: "role", title: "No Resource Requests yet", description: "Requests raised from project schedules land here" },
  { id: "employee-info", module: "Resources", page: "Employee Details — Employee Info", path: "/resources/employees/", art: "people", title: "No employee information yet", description: "Employee details will appear here once they are added." },
  { id: "employee-salary", module: "Resources", page: "Employee Details — Salary", path: "/resources/employees/", art: "coins", title: "No salary data yet", description: "Set a monthly salary plan to see salary distribution and project charges.", ctaLabel: "Set plan" },
  { id: "employee-capacity", module: "Resources", page: "Employee Details — Capacity", path: "/resources/employees/", art: "charts", title: "No capacity data yet", description: "Set a monthly capacity plan to track availability and utilization.", ctaLabel: "Set capacity" },
  { id: "employee-leave", module: "Resources", page: "Employee Details — Leave records", path: "/resources/employees/", art: "calendar", title: "No leave records yet", description: "Add annual, sick, unpaid or partial leave for this employee.", ctaLabel: "Add entry" },
  { id: "employee-allocation", module: "Resources", page: "Employee Details — Projects & allocation", path: "/resources/employees/", art: "calendar", title: "No project allocations yet", description: "Assigned project work for this period will appear here." },
  { id: "employee-tasks", module: "Resources", page: "Employee Details — Assigned tasks", path: "/resources/employees/", art: "note", title: "No tasks assigned yet", description: "Tasks assigned to this employee will appear here." },
  { id: "employee-trips", module: "Resources", page: "Employee Details — Trips", path: "/resources/employees/", art: "map", title: "No trips yet", description: "Business trips and training for this year will appear here." },

  // Clients & Vendors
  { id: "clients", module: "Clients & Vendors", page: "Clients", path: "/clients-vendors", art: "handshake", title: "No Clients added yet", description: "Start by adding the first client", ctaLabel: "Add Client" },
  { id: "vendors", module: "Clients & Vendors", page: "Vendors", path: "/clients-vendors", art: "handshake", title: "No Vendors added yet", description: "Start by adding the first vendor", ctaLabel: "Add Vendor" },

  // Financials
  { id: "financials-profitability", module: "Financials", page: "Profitability by Project Type", path: "/financials", art: "charts", title: "No profitability data yet", description: "Project revenue and costs will appear here." },
  { id: "financials-profit-share", module: "Financials", page: "Profit Share by project type", path: "/financials", art: "charts", title: "No profit share yet", description: "Profit by project type will appear here." },
  { id: "financials-actuals", module: "Financials", page: "Actuals by Project Type", path: "/financials", art: "charts", title: "No actuals yet", description: "Collected revenue and payments will appear here." },
  { id: "financials-cash-flow", module: "Financials", page: "Cash Flow Forecast", path: "/financials", art: "charts", title: "No cash flow data yet", description: "Cost and revenue events will appear here." },
  { id: "financials-overview", module: "Financials", page: "Overview (P&L)", path: "/financials", art: "coins", title: "No Financial data yet", description: "Budgets and revenue appear here once projects are created" },
  { id: "financials-costs", module: "Financials", page: "Costs", path: "/financials", art: "coins", title: "No Cost Items added yet", description: "Start by adding the first cost item", ctaLabel: "Add Cost Item" },
  { id: "financials-revenue", module: "Financials", page: "Revenue", path: "/financials", art: "coins", title: "No Revenue events yet", description: "Milestone-linked revenue appears here once projects are created" },


  // Risk & Issues
  { id: "risks-register", module: "Risk & Issues", page: "Risk Register", path: "/risks", art: "shield", title: "No Risks logged yet", description: "Start by logging the first risk", ctaLabel: "Log Risk" },
  { id: "risks-heatmap", module: "Risk & Issues", page: "Heat Map", path: "/risks", art: "shield", title: "No Risks to plot yet", description: "The probability × impact map fills in once risks are logged", ctaLabel: "Log Risk" },
  { id: "risks-issues", module: "Risk & Issues", page: "Issues Log", path: "/risks", art: "note", title: "No Issues logged yet", description: "Start by logging the first issue", ctaLabel: "Log Issue" },

  // Organization
  { id: "org-project-types", module: "Organization", page: "Project Types", path: "/organization", art: "briefcase", title: "No Project Types added yet", description: "Start by adding the first Project Type", ctaLabel: "Add Project Type" },
  { id: "org-tags", module: "Organization", page: "Tags & Classifications", path: "/organization", art: "tag", title: "No Tags added yet", description: "Start by adding the first Tag", ctaLabel: "Add Tag" },
  { id: "org-risk-categories", module: "Organization", page: "Risk Categories", path: "/organization", art: "shield", title: "No Risk Categories added yet", description: "Start by adding the first Category", ctaLabel: "Add Category" },
  { id: "org-cost-categories", module: "Organization", page: "Cost Categories", path: "/organization", art: "tag", title: "No Cost Categories added yet", description: "Start by adding the first Category", ctaLabel: "Add Category" },
  { id: "org-departments", module: "Organization", page: "Departments", path: "/organization", art: "building", title: "No Departments added yet", description: "Start by adding the first Department", ctaLabel: "Add Department" },
  { id: "org-roles", module: "Organization", page: "Roles & Skills — Job Roles", path: "/organization", art: "role", title: "No Job Roles added yet", description: "Start by adding the first Job Role", ctaLabel: "Add Job Role" },
  { id: "org-skills", module: "Organization", page: "Roles & Skills — Skills", path: "/organization", art: "note", title: "No Skills added yet", description: "Start by adding the first Skill", ctaLabel: "Add Skill" },
  { id: "org-calendars", module: "Organization", page: "Calendars", path: "/organization", art: "calendar", title: "No Calendars added yet", description: "Start by adding the first calendar", ctaLabel: "Add Calendar" },

  // Approvals
  { id: "change-requests-inbox", module: "Change Requests", page: "Change Requests", path: "/change-requests", art: "shield", title: "Nothing to decide", description: "Change requests assigned to you will appear here" },
];

/** Empty states that belong to the given pathname. */
export function emptyStatesForPath(pathname: string): EmptyStateEntry[] {
  const p = pathname.replace(/\/+$/, "") || "/";
  return EMPTY_STATES.filter((e) =>
    e.exact ? p === e.path.replace(/\/+$/, "") || (e.path === "/" && p === "/") : pathname.startsWith(e.path),
  );
}
