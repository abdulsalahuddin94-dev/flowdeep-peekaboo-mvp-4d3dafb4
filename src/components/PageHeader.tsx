import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ds/PageShell";

/**
 * DS02 page header — always renders the module breadcrumb above the title so
 * every page in the app shares the same top pattern.
 */
export function PageHeader({
  title, subtitle, actions, current,
}: { title: string; subtitle?: string; actions?: ReactNode; current?: string }) {
  return (
    <div className="mb-6">
      <Breadcrumbs current={current} />
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
