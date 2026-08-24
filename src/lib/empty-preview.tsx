import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { EmptyState } from "@/components/ds/EmptyState";
import { emptyStatesForPath } from "@/lib/empty-states";

/*
 * Empty-state preview mode. Toggled from the topbar (same feel as the
 * dark/light switch): while it's on, the current page's content is replaced
 * in place by that page's empty state — no separate gallery screen.
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

/** Renders the page's empty state instead of `children` while preview mode is on. */
export function EmptyPreviewBoundary({ children }: { children: ReactNode }) {
  const { enabled } = useEmptyPreview();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const matches = useMemo(() => emptyStatesForPath(pathname), [pathname]);
  const [index, setIndex] = useState(0);

  if (!enabled || pathname === "/auth") return <>{children}</>;

  const active = matches[Math.min(index, Math.max(matches.length - 1, 0))];

  if (!active) {
    return (
      <EmptyState
        art="search"
        title="No empty state for this page yet"
        description="Turn the switch off to go back, or add one to the catalog."
      />
    );
  }

  return (
    <div>
      {matches.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {matches.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-9 rounded-lg px-3 text-xs transition-colors ${
                m.id === active.id
                  ? "bg-primary/20 text-foreground"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              {m.page}
            </button>
          ))}
        </div>
      )}
      <EmptyState
        art={active.art}
        title={active.title}
        description={active.description}
        ctaLabel={active.ctaLabel}
      />
    </div>
  );
}
