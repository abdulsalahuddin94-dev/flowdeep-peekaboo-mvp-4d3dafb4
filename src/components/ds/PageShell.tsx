import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "@/lib/icons";
import type { ReactNode } from "react";

/*
 * DS02 page shell — breadcrumb (Parent > Current) with optional title/subtitle
 * and right-aligned actions. Two levels max; anything deeper stays as in-page tabs.
 */

/*
 * `standalone: true` means the module root has its own real view, so a crumb
 * linking back to it is meaningful. Modules that are only sub-page containers
 * (Organization, Resources, ...) get a plain page title instead of a crumb.
 */
const MODULES: Record<string, { label: string; to: string; standalone?: boolean }> = {
  "": { label: "Dashboard", to: "/", standalone: true },
  portfolio: { label: "Portfolio", to: "/portfolio", standalone: true },
  resources: { label: "Resources", to: "/resources" },
  "clients-vendors": { label: "Clients & Vendors", to: "/clients-vendors" },
  financials: { label: "Financials", to: "/financials" },
  organization: { label: "Organization", to: "/organization" },
  approvals: { label: "Approvals", to: "/approvals", standalone: true },
};

/** True when a `current` page should render as "Parent > Current". */
export function hasBreadcrumb(pathname: string, current?: string) {
  if (!current) return false;
  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  const mod = MODULES[seg];
  if (!mod?.standalone) return false;
  // Module root itself (e.g. /portfolio) is the current page — no parent crumb.
  return pathname.replace(/\/$/, "") !== mod.to.replace(/\/$/, "");
}

export function Breadcrumbs({ current }: { current?: string }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  if (!hasBreadcrumb(pathname, current)) return null;
  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  const mod = MODULES[seg] ?? { label: seg || "Dashboard", to: pathname };

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link to={mod.to} className="transition-colors hover:text-foreground">{mod.label}</Link>
      <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
      <span className="text-foreground">{current}</span>
    </nav>
  );
}

export function PageShell({
  current, title, subtitle, actions, children,
}: {
  current?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div>
      <div className="mb-4">
        <Breadcrumbs current={current} />
        {(title || actions) && (
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              {title && <h1 className="text-2xl font-medium text-foreground">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
