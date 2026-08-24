import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Breadcrumbs, hasBreadcrumb } from "@/components/ds/PageShell";
import { PageActionsSlot } from "@/components/ds/PageActionsSlot";

/**
 * DS02 page header — always renders the module breadcrumb above the title so
 * every page in the app shares the same top pattern.
 */
export function PageHeader({
  title, subtitle, actions, current,
}: { title: string; subtitle?: string; actions?: ReactNode; current?: string }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const crumbed = hasBreadcrumb(pathname, current);
  /* No parent view to link back to → the sub-page name becomes the title. */
  const heading = crumbed ? title : (current ?? title);
  return (
    <div className="mb-6">
      {crumbed && <Breadcrumbs current={current} />}
      <div className={crumbed ? "mt-2 flex flex-wrap items-end justify-between gap-3" : "flex flex-wrap items-end justify-between gap-3"}>
        <div>
          <h1 className="text-2xl font-medium text-foreground">{heading}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <PageActionsSlot />
        </div>
      </div>
    </div>
  );
}
