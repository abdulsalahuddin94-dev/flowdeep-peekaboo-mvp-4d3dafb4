import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TableCell, TableRow } from "@/components/ui/table";
import { Search, Filter, Check, ChevronRight, ChevronLeft, X } from "@/lib/icons";

/*
 * DS02 page toolbar — search (left) + filter drawer + main CTA (right).
 * Single source of truth: every module page uses this instead of ad-hoc toolbars.
 */

export type FilterGroup = {
  key: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
};

/** Shared search + filter toolbar (side-drawer filters) used by every Organization tab. */
export function PageToolbar({
  query,
  onQueryChange,
  placeholder,
  filterGroups = [],
  cta,
}: {
  title?: string;
  desc?: string;
  query: string;
  onQueryChange: (v: string) => void;
  placeholder?: string;
  filterGroups?: FilterGroup[];
  resultCount?: number;
  totalCount?: number;
  onReset?: () => void;
  cta?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [panel, setPanel] = useState<string | null>(null);
  const [panelQuery, setPanelQuery] = useState("");

  const activeCount = filterGroups.filter((g) => g.value !== g.options[0]?.value).length;

  function openDrawer() {
    setDraft(Object.fromEntries(filterGroups.map((g) => [g.key, g.value])));
    setPanel(null);
    setPanelQuery("");
    setOpen(true);
  }

  function apply() {
    filterGroups.forEach((g) => {
      const next = draft[g.key];
      if (next !== undefined && next !== g.value) g.onChange(next);
    });
    setOpen(false);
  }

  const appliedChips = filterGroups.flatMap((g) => {
    const v = draft[g.key] ?? g.value;
    if (!v || v === g.options[0]?.value) return [];
    const label = g.options.find((o) => o.value === v)?.label ?? v;
    return [{ key: g.key, label, group: g }];
  });

  const activePanel = filterGroups.find((g) => g.key === panel);
  const panelOptions = activePanel
    ? activePanel.options.filter((o) => o.label.toLowerCase().includes(panelQuery.trim().toLowerCase()))
    : [];

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative w-full min-w-[220px] sm:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder ?? "Search by …"}
          className="rounded-md pl-9"
          aria-label={placeholder ?? "Search"}
        />
      </div>

      {filterGroups.length > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={openDrawer}
          className="gap-2 rounded-md border-[var(--btn-outline-border)] bg-[var(--btn-secondary-bg)] px-5 text-[var(--btn-secondary-fg)] hover:bg-[var(--btn-outline-bg-hover)] hover:text-[var(--btn-secondary-fg)]"
        >
          <Filter className="h-4 w-4 text-[var(--btn-outline-border)]" />
          Filter
          {activeCount > 0 && (
            <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgba(255,255,255,0.14)] px-1.5 text-[11px] font-medium text-[var(--btn-secondary-fg)]">
              {activeCount}
            </span>
          )}
        </Button>
      )}

      {cta && <div className="ml-auto">{cta}</div>}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-[380px] flex-col gap-0 border-l border-border bg-surface p-0 sm:max-w-[380px]">
          {activePanel ? (
            <>
              <div className="flex items-center gap-2 px-5 py-4">
                <button type="button" aria-label="Back" onClick={() => { setPanel(null); setPanelQuery(""); }} className="text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <SheetTitle className="text-sm font-medium text-foreground">{activePanel.label}</SheetTitle>
              </div>
              <div className="px-5 pb-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={panelQuery}
                    onChange={(e) => setPanelQuery(e.target.value)}
                    placeholder={`Search by ${activePanel.label}`}
                    className="rounded-md pl-8 text-xs"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1 px-5">
                <div className="space-y-1 pb-4">
                  {panelOptions.map((o) => {
                    const selected = (draft[activePanel.key] ?? activePanel.value) === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setDraft((d) => ({ ...d, [activePanel.key]: o.value }))}
                        className="flex w-full items-center gap-3 rounded-md px-1 py-2 text-left text-sm text-foreground hover:bg-secondary/40"
                      >
                        <span
                          aria-hidden
                          className={`grid h-5 w-5 shrink-0 place-content-center rounded-lg border ${
                            selected
                              ? "border-accent bg-accent text-accent-foreground"
                              : "border-border"
                          }`}
                        >
                          {selected && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <span className="truncate">{o.label}</span>
                      </button>
                    );
                  })}
                  {panelOptions.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">No options</p>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-5 py-4">
                <SheetTitle className="text-sm font-medium text-foreground">Filters</SheetTitle>
              </div>
              <ScrollArea className="flex-1 px-5">
                <div className="pb-4">
                  {filterGroups.map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => { setPanel(g.key); setPanelQuery(""); }}
                      className="flex w-full items-center justify-between rounded-md py-3 text-left text-sm text-foreground hover:bg-secondary/30"
                    >
                      <span>{g.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
              {appliedChips.length > 0 && (
                <div className="border-t border-border px-5 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">Applied Filters</span>
                    <button
                      type="button"
                      onClick={() => setDraft(Object.fromEntries(filterGroups.map((g) => [g.key, g.options[0]?.value ?? ""])))}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Clear Filters <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {appliedChips.map((c) => (
                      <span key={c.key} className="flex items-center gap-1 rounded-md bg-secondary/50 px-2 py-1 text-[11px] text-foreground">
                        {c.label}
                        <button
                          type="button"
                          aria-label={`Remove ${c.label}`}
                          onClick={() => setDraft((d) => ({ ...d, [c.key]: c.group.options[0]?.value ?? "" }))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={apply}>Apply</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow className="bg-transparent hover:bg-transparent border-0">
      <TableCell colSpan={colSpan} className="py-8 text-center text-sm text-muted-foreground">No matching records</TableCell>
    </TableRow>
  );
}

