import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { EmptyState } from "@/components/ds/EmptyState";
import { EMPTY_STATES } from "@/lib/empty-states";

/*
 * Empty-state preview mode. Toggled from the topbar (same feel as the
 * dark/light switch): while it's on, only the *data region* of the page is
 * swapped for its empty state — the page title, tabs, toolbar and everything
 * else stay exactly where they are, so the screen is a 1:1 match of the real
 * page in its empty condition.
 */

type Ctx = { enabled: boolean; setEnabled: (v: boolean) => void };
const EmptyPreviewContext = createContext<Ctx>({ enabled: false, setEnabled: () => {} });

export function EmptyPreviewProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const value = useMemo(() => ({ enabled, setEnabled }), [enabled]);
  return <EmptyPreviewContext.Provider value={value}>{children}</EmptyPreviewContext.Provider>;
}

export function useEmptyPreview() {
  return useContext(EmptyPreviewContext);
}

/**
 * Swaps just this region for its catalog empty state while preview mode is on.
 * `id` refers to an entry in `EMPTY_STATES`.
 */
export function EmptyRegion({
  id,
  children,
  variant = "default",
  force = false,
  className,
}: {
  id: string;
  children: ReactNode;
  variant?: "default" | "card";
  force?: boolean;
  className?: string;
}) {
  const { enabled } = useEmptyPreview();
  if (!enabled && !force) return <>{children}</>;
  const entry = EMPTY_STATES.find((e) => e.id === id);
  if (!entry) return <>{children}</>;
  return (
    <EmptyState
      art={entry.art}
      title={entry.title}
      description={entry.description}
      ctaLabel={entry.ctaLabel}
      variant={variant}
      className={className}
    />
  );
}
