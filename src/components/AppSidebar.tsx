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
import { useApprovals } from "@/lib/projects-store";
import sansLogo from "@/assets/sans-logo.png.asset.json";
import teamsmartLogo from "@/assets/teamsmart-logo.png.asset.json";

/*
 * Sidebar is fully token-driven. All colors come from CSS variables defined
 * in src/styles.css (see `--sidebar-*` tokens). Do NOT add hex/rgba literals
 * or inline color styles in this file — edit the tokens instead.
 */

const main = [
  { title: "Dashboard",         url: "/",                icon: LayoutDashboard },
  { title: "Portfolio",         url: "/portfolio",       icon: Target },
  { title: "Resources",         url: "/resources",       icon: Users },
  { title: "Clients & Vendors", url: "/clients-vendors", icon: Handshake },
  { title: "Financials",        url: "/financials",      icon: DollarSign },
  { title: "Organization",      url: "/organization",    icon: Building2 },
];

const mgmt: typeof main = [];

const allItems = [...main, ...mgmt];

const orgTabs = [
  { title: "Project Types", tab: "business-lines" },
  { title: "Tags & Classifications", tab: "tags" },
  { title: "Cost Categories", tab: "cost-categories" },
  { title: "Departments", tab: "departments" },
  { title: "Job Roles", tab: "job-roles" },
  { title: "Calendars", tab: "calendars" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const search = useRouterState({ select: (r) => r.location.search as { tab?: string } });
  const isActive = (url: string) => url === "/" ? pathname === "/" : pathname.startsWith(url);
  const onOrg = pathname.startsWith("/organization");
  const [orgOpen, setOrgOpen] = useState(onOrg);
  const activeTab = search?.tab ?? "business-lines";
  const { myPending, currentUser } = useApprovals();
  const canApprove = ["Director", "Portfolio Director", "Project Manager"].includes(currentUser.role);
  const items = canApprove
    ? [...allItems, { title: "Approvals", url: "/approvals", icon: CheckSquare, badge: myPending.length || undefined }]
    : allItems;

  return (
    <Sidebar collapsible="icon" className="ds02-sidebar border-r-0">
      {/* Header — centered logo */}
      <SidebarHeader className="px-3 py-5">
        <div className="flex items-center justify-center">
          <Link to="/" className={cn("flex items-center justify-center", collapsed && "hidden")} aria-label="Home">
            <img
              src={teamsmartLogo.url}
              alt="TeamSmart"
              className="h-7 w-auto object-contain"
            />
          </Link>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {items.map((item) => {
                const active = isActive(item.url);
                const badge = ("badge" in item ? item.badge : undefined) as number | string | undefined;
                const badgeDanger = "badgeTone" in item && item.badgeTone === "red";
                if (item.url === "/organization") {
                  const open = orgOpen || onOrg;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        isActive={false}
                        tooltip={item.title}
                        onClick={() => setOrgOpen((o) => !o)}
                        className="h-10 rounded-lg px-3 text-sm font-medium"
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate text-left">{item.title}</span>
                            <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
                          </>
                        )}
                      </SidebarMenuButton>
                      {!collapsed && open && (
                        <div className="mt-2 flex flex-col gap-1">
                          {orgTabs.map((t) => {
                            const tabActive = onOrg && activeTab === t.tab;
                            return (
                              <Link
                                key={t.tab}
                                to="/organization"
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
                        </div>
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
                      className="h-10 rounded-lg px-3 text-sm font-medium"
                    >
                      <Link to={item.url} className="flex w-full items-center gap-3">
                        <item.icon className="h-5 w-5 shrink-0" />
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
            className={cn("opacity-70", collapsed ? "h-7 w-7 object-contain" : "h-12 w-auto")}
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
