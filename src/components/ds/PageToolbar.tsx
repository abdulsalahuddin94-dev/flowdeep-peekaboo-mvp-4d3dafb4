import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TableCell, TableRow } from "@/components/ui/table";
import { Search, Filter, ChevronRight, ChevronLeft, X } from "@/lib/icons";
import { PageActions } from "@/components/ds/PageActionsSlot";
import { StatusPill } from "@/components/TableRowActions";
import { formatDateWithYear } from "@/lib/date-format";

/*
 * DS02 page toolbar — search (left) + filter drawer + main CTA (right).
 * Single source of truth: every module page uses this instead of ad-hoc toolbars.
 */

export type SingleFilterGroup = {
  key: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  mode?: "single";
};

export type MultiFilterGroup = {
  key: string;
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  options: { value: string; label: string }[];
  mode: "multi";
};

export type DateRangeValue = { from: string; to: string };

export type DateRangeFilterGroup = {
  key: string;
  label: string;
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
  mode: "daterange";
};

export type FilterGroup = SingleFilterGroup | MultiFilterGroup | DateRangeFilterGroup;

function isMultiGroup(g: FilterGroup): g is MultiFilterGroup {
  return g.mode === "multi";
}

function isDateRangeGroup(g: FilterGroup): g is DateRangeFilterGroup {
  return g.mode === "daterange";
}

function isGroupActive(g: FilterGroup): boolean {
  if (isMultiGroup(g)) {
    return g.value.length > 0;
  }
  if (isDateRangeGroup(g)) {
    return Boolean(g.value.from || g.value.to);
  }
  return g.value !== g.options[0]?.value;
}

function groupFirstValue(g: FilterGroup): string {
  if (isDateRangeGroup(g)) return "";
  return g.options[0]?.value ?? "";
}

type Chip = { key: string; label: string; group: FilterGroup; removeValue: string };

/** Shared search + filter toolbar (side-drawer filters) used by every Organization tab. */
export function PageToolbar({
  query,
  onQueryChange,
  placeholder,
  filterGroups = [],
  cta,
  trailing,
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
  trailing?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string | string[] | DateRangeValue>>({});
  const [panel, setPanel] = useState<string | null>(null);
  const [panelQuery, setPanelQuery] = useState("");

  function openPanel(key: string) {
    setPanelQuery("");
    setPanel(key);
  }

  const activeCount = filterGroups.reduce((acc, g) => acc + (isMultiGroup(g) ? g.value.length : isGroupActive(g) ? 1 : 0), 0);

  function openDrawer() {
    setDraft(Object.fromEntries(filterGroups.map((g) => [g.key, g.value])));
    setPanel(null);
    setOpen(true);
  }

  function apply() {
    filterGroups.forEach((g) => {
      const next = draft[g.key];
      if (next === undefined) return;
      if (isMultiGroup(g)) {
        const arr = Array.isArray(next) ? next : [];
        if (JSON.stringify(arr) !== JSON.stringify(g.value)) g.onChange(arr);
      } else if (isDateRangeGroup(g)) {
        const range = (typeof next === "object" && !Array.isArray(next) ? next : { from: "", to: "" }) as DateRangeValue;
        if (range.from !== g.value.from || range.to !== g.value.to) g.onChange(range);
      } else if (next !== g.value) {
        g.onChange(String(next));
      }
    });
    setOpen(false);
  }

  const appliedChips: Chip[] = filterGroups.reduce((acc, g) => {
    if (isDateRangeGroup(g)) {
      if (!g.value.from && !g.value.to) return acc;
      const fmt = (iso: string) => formatDateWithYear(iso, iso);
      acc.push({
        key: g.key,
        label: `${g.value.from ? fmt(g.value.from) : "…"} → ${g.value.to ? fmt(g.value.to) : "…"}`,
        group: g,
        removeValue: "",
      });
      return acc;
    }
    if (isMultiGroup(g)) {
      for (const v of g.value) {
        acc.push({
          key: `${g.key}-${v}`,
          label: g.options.find((o) => o.value === v)?.label ?? v,
          group: g,
          removeValue: v,
        });
      }
    } else {
      const v = g.value;
      if (!v || v === groupFirstValue(g)) return acc;
      acc.push({
        key: g.key,
        label: g.options.find((o) => o.value === v)?.label ?? v,
        group: g,
        removeValue: v,
      });
    }
    return acc;
  }, [] as Chip[]);


  const activePanel = filterGroups.find((g) => g.key === panel);
  const activePanelIsDateRange = activePanel ? isDateRangeGroup(activePanel) : false;
  /** Drop the leading "All …" row when there are only two real choices. */
  const panelOptionsAll = (() => {
    if (!activePanel || isDateRangeGroup(activePanel)) return [];
    const opts = activePanel.options;
    const firstIsAll = /^all\b/i.test(opts[0]?.label ?? "");
    return firstIsAll && opts.length <= 3 ? opts.slice(1) : opts;
  })();
  /** Long lists (e.g. Skills) get a search box to narrow them down. */
  const showPanelSearch = panelOptionsAll.length > 6;
  const panelOptions = showPanelSearch && panelQuery.trim()
    ? panelOptionsAll.filter((o) => o.label.toLowerCase().includes(panelQuery.trim().toLowerCase()))
    : panelOptionsAll;
  const isStatusPanel = activePanel?.key === "status";

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

      {cta && <PageActions>{cta}</PageActions>}

      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent hideClose side="right" className="flex w-[380px] flex-col gap-0 rounded-l-lg border-l border-border bg-drawer p-0 sm:max-w-[380px]">
          {activePanel ? (
            <>
              <div className="flex items-center gap-2 px-5 py-4">
                <button type="button" aria-label="Back" onClick={() => setPanel(null)} className="text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <SheetTitle className="text-sm font-medium text-foreground">{activePanel.label}</SheetTitle>
              </div>
              {showPanelSearch && (
                <div className="px-5 pb-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={panelQuery}
                      onChange={(e) => setPanelQuery(e.target.value)}
                      placeholder="Search by …"
                      className="w-full rounded-md pl-9"
                      aria-label={`Search ${activePanel.label}`}
                    />
                  </div>
                </div>
              )}

              <ScrollArea className="flex-1 px-5">
                <div className="space-y-1 pb-4">
                  {activePanelIsDateRange ? (
                    <div className="space-y-4 pt-1">
                      {(["from", "to"] as const).map((bound) => {
                        const current = (draft[activePanel.key] ?? activePanel.value) as DateRangeValue;
                        const range = typeof current === "object" && !Array.isArray(current) ? current : { from: "", to: "" };
                        return (
                          <div key={bound} className="space-y-1.5">
                            <span className="text-sm font-medium text-foreground">{bound === "from" ? "Start Date" : "End Date"}</span>
                            <DatePicker
                              value={range[bound]}
                              onChange={(v) =>
                                setDraft((d) => ({
                                  ...d,
                                  [activePanel.key]: { ...range, [bound]: v },
                                }))
                              }
                              min={bound === "to" ? range.from || undefined : undefined}
                              max={bound === "from" ? range.to || undefined : undefined}
                              placeholder="Select Date"
                              className="rounded-md"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : isMultiGroup(activePanel) ? (
                    panelOptions.map((o) => {
                      const allValue = groupFirstValue(activePanel);
                      const isAll = o.value === allValue;
                      const currentDraft = Array.isArray(draft[activePanel.key])
                        ? (draft[activePanel.key] as string[])
                        : activePanel.value;
                      const selected = isAll ? currentDraft.length === 0 : currentDraft.includes(o.value);
                      return (
                        <div
                          key={o.value}
                          role="button"
                          tabIndex={0}
                          aria-pressed={selected}
                          onClick={() => {
                            setDraft((d) => {
                              const current = Array.isArray(d[activePanel.key]) ? (d[activePanel.key] as string[]) : activePanel.value;
                              if (isAll) {
                                return { ...d, [activePanel.key]: [] };
                              }
                              const next = current.includes(o.value)
                                ? current.filter((v) => v !== o.value)
                                : [...current, o.value];
                              return { ...d, [activePanel.key]: next };
                            });
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") event.currentTarget.click();
                          }}
                          className="flex w-full items-center gap-3 rounded-md px-1 py-2 text-left text-sm text-foreground hover:bg-secondary/40"
                        >
                          <Checkbox checked={selected} className="pointer-events-none" />
                          <span className="truncate">{o.label}</span>
                        </div>
                      );
                    })
                  ) : (
                    panelOptions.map((o) => {
                      const selected = (draft[activePanel.key] ?? activePanel.value) === o.value;
                      return (
                        <div
                          key={o.value}
                          role="button"
                          tabIndex={0}
                          aria-pressed={selected}
                          onClick={() => setDraft((d) => ({
                            ...d,
                            [activePanel.key]: (d[activePanel.key] ?? activePanel.value) === o.value
                              ? groupFirstValue(activePanel)
                              : o.value,
                          }))}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") event.currentTarget.click();
                          }}
                          className="flex w-full items-center gap-3 rounded-md px-1 py-2 text-left text-sm text-foreground hover:bg-secondary/40"
                        >
                          <Checkbox checked={selected} className="pointer-events-none" />
                          {isStatusPanel && (o.value === "active" || o.value === "inactive") ? (
                            <StatusPill isActive={o.value === "active"} label={o.label} />
                          ) : (
                            <span className="truncate">{o.label}</span>
                          )}
                        </div>
                      );
                    })
                  )}
                  {!activePanelIsDateRange && panelOptions.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">No options</p>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-5 py-4">
                <SheetTitle className="text-sm font-medium text-foreground">Filters</SheetTitle>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--btn-secondary-bg-hover)] text-foreground/90 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <ScrollArea className="flex-1 px-5">
                <div className="pb-4">
                  {filterGroups.map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => openPanel(g.key)}
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
                      onClick={() => setDraft(Object.fromEntries(filterGroups.map((g) => [g.key, isMultiGroup(g) ? [] : isDateRangeGroup(g) ? { from: "", to: "" } : groupFirstValue(g)])))}
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
                          onClick={() => setDraft((d) => {
                            if (isMultiGroup(c.group)) {
                              const current = Array.isArray(d[c.group.key]) ? (d[c.group.key] as string[]) : c.group.value;
                              const next = current.filter((v) => v !== c.removeValue);
                              return { ...d, [c.group.key]: next };
                            }
                            if (isDateRangeGroup(c.group)) {
                              return { ...d, [c.group.key]: { from: "", to: "" } };
                            }
                            return { ...d, [c.group.key]: groupFirstValue(c.group) };
                          })}
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
            {activePanel && <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>}
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
