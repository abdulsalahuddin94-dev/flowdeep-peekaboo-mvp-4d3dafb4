import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ds/EmptyState";
import { EMPTY_STATES, emptyStatesByModule } from "@/lib/empty-states";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "@/lib/icons";

export const Route = createFileRoute("/empty-states")({
  head: () => ({
    meta: [
      { title: "Empty States Gallery — TeamSmart PMO" },
      { name: "description", content: "Preview every empty state across the PMO modules — live and planned — in one place." },
      { property: "og:title", content: "Empty States Gallery — TeamSmart PMO" },
      { property: "og:description", content: "Preview every empty state across the PMO modules in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s.id === "string" ? s.id : undefined }),
  component: EmptyStatesPage,
});

function EmptyStatesPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const active = EMPTY_STATES.find((e) => e.id === id) ?? EMPTY_STATES[0];
  const groups = emptyStatesByModule()
    .map((g) => ({
      ...g,
      items: g.items.filter((e) =>
        `${g.module} ${e.page} ${e.title}`.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    }))
    .filter((g) => g.items.length > 0);

  function select(nextId: string) {
    navigate({ to: "/empty-states", search: { id: nextId } });
  }

  return (
    <div>
      <PageHeader title="Empty States" />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="rounded-2xl border border-border bg-surface p-3">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search empty states…"
              className="rounded-full pl-9"
            />
          </div>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            {groups.map((g) => (
              <div key={g.module}>
                <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {g.module}
                </div>
                <ul className="space-y-1">
                  {g.items.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => select(e.id)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          active?.id === e.id
                            ? "bg-primary/20 text-foreground"
                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        }`}
                      >
                        <span className="truncate">{e.page}</span>
                        {e.status === "planned" && (
                          <Badge variant="outline" className="shrink-0 rounded-full text-[10px]">
                            Planned
                          </Badge>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {groups.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No results</p>
            )}
          </div>
        </aside>

        <section>
          {active && (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="text-foreground">{active.module}</span>
                <span className="opacity-50">/</span>
                <span>{active.page}</span>
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {active.status === "live" ? "Live" : "Planned"}
                </Badge>
              </div>
              <EmptyState
                art={active.art}
                title={active.title}
                description={active.description}
                ctaLabel={active.ctaLabel}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
