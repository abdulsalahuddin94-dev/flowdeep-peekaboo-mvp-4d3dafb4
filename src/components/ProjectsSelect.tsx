import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { projects } from "@/lib/mock-data";
import { ChevronDown, Search, X } from "@/lib/icons";

/**
 * Searchable multi-select project chooser — same interaction as the Skills picker:
 * type to auto-complete, selected projects render as removable badges in the trigger.
 */
export function ProjectsSelect({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? projects.filter((p) => p.name.toLowerCase().includes(needle)) : projects;
  }, [q]);

  const shown = value.slice(0, 3);
  const extra = value.length - shown.length;
  const nameOf = (id: string) => projects.find((p) => p.id === id)?.name ?? id;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mt-1 flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-left text-sm"
        >
          <span className="flex flex-1 flex-wrap items-center gap-1.5">
            {value.length === 0 && <span className="text-muted-foreground">Search and select projects…</span>}
            {shown.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[11px] text-foreground"
              >
                {nameOf(id)}
                <X
                  className="h-3 w-3 opacity-70 hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); toggle(id); }}
                />
              </span>
            ))}
            {extra > 0 && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">+{extra} more</span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search projects…"
              className="h-8 pl-8 text-sm"
              aria-label="Search projects"
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">No projects found</p>
          )}
          {filtered.map((p) => {
            const on = value.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(p.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60"
              >
                <Checkbox checked={on} className="pointer-events-none rounded-[4px]" />
                <span className="flex-1 truncate">{p.name}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-border px-2 py-1.5">
          <span className="text-[11px] text-muted-foreground">{value.length} selected</span>
          <Button variant="ghost" size="sm" onClick={() => onChange([])} disabled={value.length === 0}>Clear all</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
