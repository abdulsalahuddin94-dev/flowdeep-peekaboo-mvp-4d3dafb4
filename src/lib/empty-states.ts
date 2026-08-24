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
  { id: "portfolio-projects", module: "Portfolio", page: "All Projects", path: "/portfolio", exact: true, art: "building", title: "No Projects added yet", description: "Start by adding the first project", ctaLabel: "Add Project" },
  { id: "portfolio-search", module: "Portfolio", page: "Search results", path: "/portfolio", exact: true, art: "search", title: "No matching projects", description: "Try a different search term or clear your filters." },
  { id: "portfolio-schedule", module: "Portfolio", page: "Project Schedule", path: "/portfolio/", art: "clock", title: "No Milestones added yet", description: "Start by adding the first milestone", ctaLabel: "Add Milestone" },
  { id: "portfolio-documents", module: "Portfolio", page: "Documents", path: "/portfolio/", art: "note", title: "No Documents uploaded yet", description: "Upload the project charter, contracts or reports", ctaLabel: "Upload Document" },

  // Resources
  { id: "resources-capacity", module: "Resources", page: "Capacity", path: "/resources", art: "people", title: "No Resources added yet", description: "Start by adding the first resource", ctaLabel: "Add Resource" },
  { id: "resources-requests", module: "Resources", page: "Requests", path: "/resources", art: "role", title: "No Resource Requests yet", description: "Requests raised from project schedules land here" },

  // Clients & Vendors
  { id: "clients", module: "Clients & Vendors", page: "Clients", path: "/clients-vendors", art: "building", title: "No Clients added yet", description: "Start by adding the first client", ctaLabel: "Add Client" },
  { id: "vendors", module: "Clients & Vendors", page: "Vendors", path: "/clients-vendors", art: "building", title: "No Vendors added yet", description: "Start by adding the first vendor", ctaLabel: "Add Vendor" },

  // Financials
  { id: "financials-overview", module: "Financials", page: "Overview (P&L)", path: "/financials", art: "note", title: "No Financial data yet", description: "Budgets and revenue appear here once projects are created" },
  { id: "financials-costs", module: "Financials", page: "Costs", path: "/financials", art: "map", title: "No Cost Items added yet", description: "Start by adding the first cost item", ctaLabel: "Add Cost Item" },

  // Organization
  { id: "org-project-types", module: "Organization", page: "Project Types", path: "/organization", art: "building", title: "No Project Types added yet", description: "Start by adding the first Project Type", ctaLabel: "Add Project Type" },
  { id: "org-tags", module: "Organization", page: "Tags & Classifications", path: "/organization", art: "note", title: "No Tags added yet", description: "Start by adding the first Tag", ctaLabel: "Add Tag" },
  { id: "org-cost-categories", module: "Organization", page: "Cost Categories", path: "/organization", art: "map", title: "No Cost Categories added yet", description: "Start by adding the first Category", ctaLabel: "Add Category" },
  { id: "org-departments", module: "Organization", page: "Departments", path: "/organization", art: "building", title: "No Departments added yet", description: "Start by adding the first Department", ctaLabel: "Add Department" },
  { id: "org-roles", module: "Organization", page: "Roles & Skills — Job Roles", path: "/organization", art: "role", title: "No Job Roles added yet", description: "Start by adding the first Job Role", ctaLabel: "Add Job Role" },
  { id: "org-skills", module: "Organization", page: "Roles & Skills — Skills", path: "/organization", art: "note", title: "No Skills added yet", description: "Start by adding the first Skill", ctaLabel: "Add Skill" },
  { id: "org-calendars", module: "Organization", page: "Calendars", path: "/organization", art: "calendar", title: "No Calendars added yet", description: "Start by adding the first calendar", ctaLabel: "Add Calendar" },

  // Approvals
  { id: "approvals-inbox", module: "Approvals", page: "Inbox", path: "/approvals", art: "shield", title: "Nothing to approve", description: "Approval requests assigned to you will appear here" },
];

/** Empty states that belong to the given pathname. */
export function emptyStatesForPath(pathname: string): EmptyStateEntry[] {
  const p = pathname.replace(/\/+$/, "") || "/";
  return EMPTY_STATES.filter((e) =>
    e.exact ? p === e.path.replace(/\/+$/, "") || (e.path === "/" && p === "/") : pathname.startsWith(e.path),
  );
}
