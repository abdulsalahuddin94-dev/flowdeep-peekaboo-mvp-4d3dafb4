import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSkills } from "@/lib/projects-store";
import { ChevronDown, Search, X } from "@/lib/icons";

/**
 * Searchable multi-select skills chooser (same interaction as the project Tags picker):
 * type to auto-complete, selected skills render as removable badges in the trigger.
 */
export function SkillsSelect({ value, onChange }: { value: string[]; onChange: (skills: string[]) => void }) {
  const { skillsCatalog } = useSkills();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const toggle = (s: string) => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? skillsCatalog.filter((s) => s.toLowerCase().includes(needle)) : skillsCatalog;
  }, [skillsCatalog, q]);

  const shown = value.slice(0, 4);
  const extra = value.length - shown.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mt-1 flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-left text-sm"
        >
          <span className="flex flex-1 flex-wrap items-center gap-1.5">
            {value.length === 0 && <span className="text-muted-foreground">Search and select skills…</span>}
            {shown.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[11px] text-foreground"
              >
                {s}
                <X
                  className="h-3 w-3 opacity-70 hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); toggle(s); }}
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
              placeholder="Search skills…"
              className="h-8 pl-8 text-sm"
              aria-label="Search skills"
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">No skills found</p>
          )}
          {filtered.map((s) => {
            const on = value.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(s)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60"
              >
                <Checkbox checked={on} className="pointer-events-none rounded-[4px]" />
                <span className="flex-1 truncate">{s}</span>
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
