import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, Check, ChevronRight, ChevronLeft } from "@/lib/icons";

export type DrawerFilterGroup = {
  key: string;
  label: string;
  multi?: boolean;
  /** current value: string[] for multi, string ("" = all) for single */
  value: string[] | string;
  onChange: (v: never) => void;
  options: { value: string; label: string }[];
};

type Draft = Record<string, string[] | string>;

/** DS02 side-drawer filter button + drill-down panel. Shared across modules. */
export function FilterDrawer({ groups }: { groups: DrawerFilterGroup[] }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({});
  const [panel, setPanel] = useState<string | null>(null);
  const [panelQuery, setPanelQuery] = useState("");

  const countOf = (v: string[] | string) => (Array.isArray(v) ? v.length : v ? 1 : 0);
  const activeCount = groups.reduce((n, g) => n + countOf(g.value), 0);

  function openDrawer() {
    setDraft(Object.fromEntries(groups.map((g) => [g.key, Array.isArray(g.value) ? [...g.value] : g.value])));
    setPanel(null);
    setPanelQuery("");
    setOpen(true);
  }

  function apply() {
    groups.forEach((g) => {
      const next = draft[g.key];
      if (next !== undefined) (g.onChange as (v: string[] | string) => void)(next);
    });
    setOpen(false);
  }

  function toggle(g: DrawerFilterGroup, val: string) {
    setDraft((d) => {
      const cur = d[g.key] ?? (Array.isArray(g.value) ? [] : "");
      if (g.multi) {
        const arr = Array.isArray(cur) ? cur : [];
        return { ...d, [g.key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
      }
      return { ...d, [g.key]: cur === val ? "" : val };
    });
  }

  const chips = groups.flatMap((g) => {
    const v = draft[g.key] ?? g.value;
    const vals = Array.isArray(v) ? v : v ? [v] : [];
    return vals.map((val) => ({
      id: `${g.key}:${val}`,
      label: g.options.find((o) => o.value === val)?.label ?? val,
      group: g,
      val,
    }));
  });

  const activePanel = groups.find((g) => g.key === panel);
  const panelOptions = activePanel
    ? activePanel.options.filter((o) => o.label.toLowerCase().includes(panelQuery.trim().toLowerCase()))
    : [];

  return (
    <>
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
                    const cur = draft[activePanel.key] ?? activePanel.value;
                    const selected = Array.isArray(cur) ? cur.includes(o.value) : cur === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggle(activePanel, o.value)}
                        className="flex w-full items-center gap-3 rounded-md px-1 py-2 text-left text-sm text-foreground hover:bg-secondary/40"
                      >
                        <span
                          aria-hidden
                          className={`grid h-4 w-4 shrink-0 place-content-center rounded-sm border ${
                            selected ? "border-[hsl(258_90%_76%)] bg-[hsl(258_90%_76%)] text-[#12121a]" : "border-border"
                          }`}
                        >
                          {selected && <Check className="h-3 w-3" />}
                        </span>
                        <span className="truncate">{o.label}</span>
                      </button>
                    );
                  })}
                  {panelOptions.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No options</p>}
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
                  {groups.map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => { setPanel(g.key); setPanelQuery(""); }}
                      className="flex w-full items-center justify-between rounded-md py-3 text-left text-sm text-foreground hover:bg-secondary/30"
                    >
                      <span>{g.label}</span>
                      <span className="flex items-center gap-2">
                        {countOf(draft[g.key] ?? g.value) > 0 && (
                          <span className="text-[11px] text-muted-foreground">{countOf(draft[g.key] ?? g.value)}</span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
              {chips.length > 0 && (
                <div className="border-t border-border px-5 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">Applied Filters</span>
                    <button
                      type="button"
                      onClick={() => setDraft(Object.fromEntries(groups.map((g) => [g.key, g.multi ? [] : ""])))}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Clear Filters <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {chips.map((c) => (
                      <span key={c.id} className="flex items-center gap-1 rounded-md bg-secondary/50 px-2 py-1 text-[11px] text-foreground">
                        {c.label}
                        <button
                          type="button"
                          aria-label={`Remove ${c.label}`}
                          onClick={() => toggle(c.group, c.val)}
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
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={apply}>Apply</Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
