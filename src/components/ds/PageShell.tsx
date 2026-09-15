import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "@/lib/icons";
import type { ReactNode } from "react";
import { projects } from "@/lib/mock-data";

/*
 * DS02 page shell — breadcrumb appears only from the third navigation level.
 * Module roots stay clean, project details show a back link from the page itself.
 */

/*
 * Module metadata used when building third-level breadcrumb trails.
 */
const MODULES: Record<string, { label: string; to: string }> = {
  "": { label: "Dashboard", to: "/" },
  portfolio: { label: "Portfolio", to: "/portfolio" },
  resources: { label: "Resources", to: "/resources" },
  "clients-vendors": { label: "Clients & Vendors", to: "/clients-vendors" },
  financials: { label: "Financials", to: "/financials" },
  risks: { label: "Risk & Issues", to: "/risks" },
  organization: { label: "Organization", to: "/organization" },
  approvals: { label: "Approvals", to: "/approvals" },
};

type BreadcrumbItem = { label: string; to?: string; params?: Record<string, string> };

function pathSegments(pathname: string) {
  return pathname.split("/").filter(Boolean);
}

function buildTrail(pathname: string, current?: string): BreadcrumbItem[] {
  const segments = pathSegments(pathname);
  const module = MODULES[segments[0] ?? ""];
  if (!current || segments.length < 3 || !module) return [];

  const trail: BreadcrumbItem[] = [{ label: module.label, to: module.to }];

  if (segments[0] === "portfolio") {
    const projectId = segments[1];
    const projectName = projects.find((project) => project.id === projectId)?.name ?? projectId;
    trail.push({ label: projectName, to: "/portfolio/$projectId", params: { projectId } });
  }

  trail.push({ label: current });
  return trail;
}

/** True only for third-level pages such as Portfolio > Project > Page. */
export function hasBreadcrumb(pathname: string, current?: string) {
  return Boolean(current && pathSegments(pathname).length >= 3);
}

export function Breadcrumbs({ current }: { current?: string }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  if (!hasBreadcrumb(pathname, current)) return null;
  const trail = buildTrail(pathname, current);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-breadcrumb-muted">
      {trail.map((item, index) => {
        const isLast = index === trail.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
            {item.to && !isLast ? (
              <Link to={item.to as never} params={item.params as never} className="transition-colors hover:text-breadcrumb-hover">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-breadcrumb-current" : undefined}>{item.label}</span>
            )}
            {!isLast && <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />}
          </span>
        );
      })}
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
              {title && <h1 className="text-xl font-medium text-foreground">{title}</h1>}
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
