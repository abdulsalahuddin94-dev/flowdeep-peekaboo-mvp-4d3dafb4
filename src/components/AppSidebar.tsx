import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, Handshake, Target, Users,
  DollarSign, CheckSquare, ChevronDown,
} from "@/lib/icons";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApprovals } from "@/lib/projects-store";
import sansLogo from "@/assets/sans-logo.png.asset.json";
import teamsmartLogo from "@/assets/teamsmart-logo.png.asset.json";
import teamsmartMark from "@/assets/teamsmart-mark.png.asset.json";

/*
 * Sidebar is fully token-driven. All colors come from CSS variables defined
 * in src/styles.css (see `--sidebar-*` tokens). Do NOT add hex/rgba literals
 * or inline color styles in this file — edit the tokens instead.
 */

type NavChild = { title: string; tab: string };
type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  children?: NavChild[];
  defaultTab?: string;
  badge?: number;
  badgeTone?: "red";
};

/* Page + Subpages (two levels only — anything deeper stays as in-page tabs). */
const allItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Portfolio", url: "/portfolio", icon: Target },
  {
    title: "Resources", url: "/resources", icon: Users, defaultTab: "requests",
    children: [
      { title: "Requests", tab: "requests" },
      { title: "People", tab: "people" },
      { title: "Utilization Heatmap", tab: "heatmap" },
      { title: "Manpower Planning", tab: "planning" },
      { title: "Skill Demand", tab: "skills" },
    ],
  },
  {
    title: "Clients & Vendors", url: "/clients-vendors", icon: Handshake, defaultTab: "clients",
    children: [
      { title: "Clients", tab: "clients" },
      { title: "Vendors", tab: "vendors" },
    ],
  },
  {
    title: "Financials", url: "/financials", icon: DollarSign, defaultTab: "overview",
    children: [
      { title: "Overview (P&L)", tab: "overview" },
      { title: "Cost Recognition", tab: "cost" },
      { title: "Revenue Recognition", tab: "rev" },
    ],
  },
  {
    title: "Organization", url: "/organization", icon: Building2, defaultTab: "business-lines",
    children: [
      { title: "Project Types", tab: "business-lines" },
      { title: "Tags & Classifications", tab: "tags" },
      { title: "Cost Categories", tab: "cost-categories" },
      { title: "Departments", tab: "departments" },
      { title: "Job Roles", tab: "job-roles" },
      { title: "Calendars", tab: "calendars" },
      { title: "Rules & Thresholds", tab: "rules" },
    ],
  },
];

const iconSize = "h-6 w-6";

function buttonBaseClasses(collapsed = false, isFirst = false) {
  return cn(
    "h-10 rounded-lg pl-4 pr-3 text-sm font-medium justify-start",
    "group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-full",
    collapsed && isFirst
      ? "group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!px-0"
      : "group-data-[collapsible=icon]:!justify-start group-data-[collapsible=icon]:!pl-[41px] group-data-[collapsible=icon]:!pr-3"
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const search = useRouterState({ select: (r) => r.location.search as { tab?: string } });
  const isActive = (url: string) => url === "/" ? pathname === "/" : pathname.startsWith(url);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { myPending, currentUser } = useApprovals();
  const canApprove = ["Director", "Portfolio Director", "Project Manager"].includes(currentUser.role);
  const items: NavItem[] = canApprove
    ? [...allItems, { title: "Approvals", url: "/approvals", icon: CheckSquare, badge: myPending.length || undefined }]
    : allItems;

  return (
    <Sidebar collapsible="icon" className="ds02-sidebar border-r-0">
      {/* Header — centered logo */}
      <SidebarHeader className="px-3 pt-5 pb-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:pb-3">
        <div className="flex h-10 items-center justify-center">
          <Link to="/" className="flex items-center justify-center" aria-label="Home">
            <img
              src={collapsed ? teamsmartMark.url : teamsmartLogo.url}
              alt="TeamSmart"
              className={cn("object-contain", collapsed ? "h-10 w-10" : "h-7 w-auto")}
            />
          </Link>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-0">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {items.map((item, index) => {
                const active = isActive(item.url);
                const badge = item.badge;
                const badgeDanger = item.badgeTone === "red";
                const isFirst = index === 0;
                if (item.children) {
                  const onModule = isActive(item.url);
                  const open = openGroups[item.url] ?? false;
                  const activeTab = search?.tab ?? item.defaultTab;
                  const childLinks = (
                    <>
                      {item.children.map((t) => {
                        const tabActive = onModule && activeTab === t.tab;
                        return (
                          <Link
                            key={t.tab}
                            to={item.url}
                            search={{ tab: t.tab }}
                            className={cn(
                              "flex items-center gap-3 rounded-lg py-2 pl-4 pr-3 text-sm transition-colors",
                              tabActive
                                ? "ds02-subnav-active"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tabActive ? "bg-current" : "bg-current opacity-50")} />
                            <span className="truncate">{t.title}</span>
                          </Link>
                        );
                      })}
                    </>
                  );

                  if (collapsed) {
                    return (
                      <SidebarMenuItem key={item.url}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <SidebarMenuButton
                              isActive={false}
                              tooltip={item.title}
                              className={cn(
                                buttonBaseClasses(true),
                                "group/collapsed"
                              )}
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                                <item.icon className={iconSize} />
                              </span>
                              <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-70 transition-transform group-data-[state=open]/collapsed:rotate-180" />
                            </SidebarMenuButton>
                          </PopoverTrigger>
                          <PopoverContent
                            side="right"
                            align="start"
                            sideOffset={8}
                            className="ds02-sidebar w-56 rounded-xl border-sidebar-border bg-sidebar p-2 text-sidebar-foreground shadow-lg"
                          >
                            <div className="flex flex-col gap-1">{childLinks}</div>
                          </PopoverContent>
                        </Popover>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        isActive={false}
                        tooltip={item.title}
                        onClick={() => setOpenGroups((g) => ({ ...g, [item.url]: !open }))}
                        className={buttonBaseClasses()}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                          <item.icon className={iconSize} />
                        </span>
                        {!collapsed && (
                          <span className="flex-1 truncate text-left">{item.title}</span>
                        )}
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 opacity-70 transition-transform",
                            collapsed && "ml-auto",
                            open && "rotate-180"
                          )}
                        />
                      </SidebarMenuButton>
                      {!collapsed && open && (
                        <div className="mt-2 flex flex-col gap-1">{childLinks}</div>
                      )}
                    </SidebarMenuItem>
                  );
                }
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={buttonBaseClasses(true, isFirst)}
                    >
                      <Link to={item.url} className="flex w-full items-center gap-3 justify-start">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                          <item.icon className={iconSize} />
                        </span>
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.title}</span>
                            {badge && (
                              <span
                                className={cn(
                                  "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                                  badgeDanger
                                    ? "bg-sidebar-badge-danger text-sidebar-badge-danger-foreground"
                                    : "bg-sidebar-badge text-sidebar-badge-foreground",
                                )}
                              >
                                {badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-3 py-6">
        <div className="flex items-center justify-center">
          <img
            src={sansLogo.url}
            alt="SANS"
            className={cn("opacity-70", collapsed ? "h-10 w-10 object-contain" : "h-12 w-auto")}
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
