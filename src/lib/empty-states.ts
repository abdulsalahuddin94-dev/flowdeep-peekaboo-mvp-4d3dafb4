import type { EmptyArt } from "@/components/ds/EmptyState";

/**
 * Catalog of every empty state in the app — both the ones already wired into a
 * page ("live") and the ones still to be built ("planned"). The nav switcher
 * and the /empty-states gallery both read from here, so adding a new empty
 * state means adding one entry.
 */
export type EmptyStateEntry = {
  id: string;
  module: string;
  page: string;
  art: EmptyArt;
  title: string;
  description?: string;
  ctaLabel?: string;
  status: "live" | "planned";
};

export const EMPTY_STATES: EmptyStateEntry[] = [
  // Dashboard
  { id: "dashboard-kpis", module: "Dashboard", page: "Overview", art: "clock", title: "No activity yet", description: "Once projects are created, your KPIs and activity feed show up here.", ctaLabel: "Create Project", status: "planned" },
  { id: "dashboard-notifications", module: "Dashboard", page: "Notifications", art: "bell", title: "You're all caught up", description: "New approvals, requests and status changes will appear here.", status: "planned" },

  // Portfolio
  { id: "portfolio-projects", module: "Portfolio", page: "All Projects", art: "building", title: "No Projects added yet", description: "Start by adding the first project", ctaLabel: "Add Project", status: "planned" },
  { id: "portfolio-search", module: "Portfolio", page: "Search results", art: "search", title: "No matching projects", description: "Try a different search term or clear your filters.", status: "planned" },
  { id: "portfolio-schedule", module: "Portfolio", page: "Project Schedule", art: "clock", title: "No Milestones added yet", description: "Start by adding the first milestone", ctaLabel: "Add Milestone", status: "planned" },
  { id: "portfolio-documents", module: "Portfolio", page: "Documents", art: "note", title: "No Documents uploaded yet", description: "Upload the project charter, contracts or reports", ctaLabel: "Upload Document", status: "planned" },

  // Resources
  { id: "resources-capacity", module: "Resources", page: "Capacity", art: "people", title: "No Resources added yet", description: "Start by adding the first resource", ctaLabel: "Add Resource", status: "planned" },
  { id: "resources-requests", module: "Resources", page: "Requests", art: "role", title: "No Resource Requests yet", description: "Requests raised from project schedules land here", status: "planned" },

  // Clients & Vendors
  { id: "clients", module: "Clients & Vendors", page: "Clients", art: "building", title: "No Clients added yet", description: "Start by adding the first client", ctaLabel: "Add Client", status: "planned" },
  { id: "vendors", module: "Clients & Vendors", page: "Vendors", art: "building", title: "No Vendors added yet", description: "Start by adding the first vendor", ctaLabel: "Add Vendor", status: "planned" },

  // Financials
  { id: "financials-overview", module: "Financials", page: "Overview (P&L)", art: "note", title: "No Financial data yet", description: "Budgets and revenue appear here once projects are created", status: "planned" },
  { id: "financials-costs", module: "Financials", page: "Costs", art: "map", title: "No Cost Items added yet", description: "Start by adding the first cost item", ctaLabel: "Add Cost Item", status: "planned" },

  // Organization
  { id: "org-project-types", module: "Organization", page: "Project Types", art: "building", title: "No Project Types added yet", description: "Start by adding the first Project Type", ctaLabel: "Add Project Type", status: "planned" },
  { id: "org-tags", module: "Organization", page: "Tags & Classifications", art: "note", title: "No Tags added yet", description: "Start by adding the first Tag", ctaLabel: "Add Tag", status: "planned" },
  { id: "org-cost-categories", module: "Organization", page: "Cost Categories", art: "map", title: "No Cost Categories added yet", description: "Start by adding the first Category", ctaLabel: "Add Category", status: "planned" },
  { id: "org-departments", module: "Organization", page: "Departments", art: "building", title: "No Departments added yet", description: "Start by adding the first Department", ctaLabel: "Add Department", status: "planned" },
  { id: "org-roles", module: "Organization", page: "Roles & Skills — Job Roles", art: "role", title: "No Job Roles added yet", description: "Start by adding the first Job Role", ctaLabel: "Add Job Role", status: "planned" },
  { id: "org-skills", module: "Organization", page: "Roles & Skills — Skills", art: "note", title: "No Skills added yet", description: "Start by adding the first Skill", ctaLabel: "Add Skill", status: "planned" },
  { id: "org-calendars", module: "Organization", page: "Calendars", art: "calendar", title: "No Calendars added yet", description: "Start by adding the first calendar", ctaLabel: "Add Calendar", status: "planned" },

  // Approvals
  { id: "approvals-inbox", module: "Approvals", page: "Inbox", art: "shield", title: "Nothing to approve", description: "Approval requests assigned to you will appear here", status: "planned" },
];

export function emptyStatesByModule() {
  const groups: { module: string; items: EmptyStateEntry[] }[] = [];
  for (const e of EMPTY_STATES) {
    const g = groups.find((x) => x.module === e.module);
    if (g) g.items.push(e);
    else groups.push({ module: e.module, items: [e] });
  }
  return groups;
}
