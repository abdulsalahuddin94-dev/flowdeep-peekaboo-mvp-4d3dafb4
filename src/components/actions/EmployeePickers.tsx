import { useState } from "react";
import { isEmployeeAvailable } from "@/lib/employee-links";
import { useEmployees } from "@/lib/employees-store";
import { MultiSelectField } from "@/components/ui/multi-select-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search } from "@/lib/icons";
import type { Attendee } from "@/lib/meeting-store";

export function EmployeeOwnerSelect({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const { employees } = useEmployees();
  // Owners stay stored as names; historical non-employee owners remain selectable.
  const names = [...new Set([...employees.filter(isEmployeeAvailable).map((e) => e.name), ...(value ? [value] : [])])].filter(Boolean).sort((a, b) => a.localeCompare(b));
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}><SelectValue placeholder="Select employee" /></SelectTrigger>
      <SelectContent>{names.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
    </Select>
  );
}

export function EmployeeAttendeesSelect({ attendees, onChange }: { attendees: Attendee[]; onChange: (value: Attendee[]) => void }) {
  const { employees } = useEmployees();
  const norm = (s: string) => s.trim().toLocaleLowerCase();
  const matched = new Set<string>();
  const employeeOptions = employees.filter((e) => isEmployeeAvailable(e) || attendees.some((a) => a.id === e.id || a.name === e.name)).map((e) => {
    const existing = attendees.find((a) => !matched.has(a.id) && a.party === "Internal" && norm(a.name) === norm(e.name));
    if (existing) matched.add(existing.id);
    return { value: existing ? `attendee:${existing.id}` : `employee:${e.id}`, label: e.name };
  });
  const options = [
    ...employeeOptions,
    ...attendees.filter((a) => !matched.has(a.id)).map((a) => ({ value: `attendee:${a.id}`, label: [a.name, a.organization, a.party === "External" ? "External" : ""].filter(Boolean).join(" · ") })),
  ];
  return (
    <MultiSelectField
      id="meeting-attendees"
      searchable
      options={options}
      value={attendees.map((a) => `attendee:${a.id}`)}
      placeholder="Select attendees"
      emptyText="No employees found"
      onChange={(values) => {
        const next: Attendee[] = [];
        for (const v of values) {
          if (v.startsWith("attendee:")) { const a = attendees.find((x) => `attendee:${x.id}` === v); if (a) next.push(a); }
          else { const e = employees.find((x) => `employee:${x.id}` === v); if (e) next.push({ id: crypto.randomUUID(), name: e.name, party: "Internal", ...(e.email ? { email: e.email } : {}) }); }
        }
        onChange(next);
      }}
    />
  );
}

/**
 * Searchable single employee pick — the meeting composer picks one person here and
 * commits them with the "+" that sits next to the field, so the same row can serve
 * both Internal and External without losing the other group.
 */
export function EmployeeSingleSelect({ value, onChange, placeholder = "Select employee", searchPlaceholder = "Search employees", emptyText = "No employees found" }: { value: string; onChange: (name: string) => void; placeholder?: string; searchPlaceholder?: string; emptyText?: string }) {
  const { employees } = useEmployees();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const names = employees.filter(isEmployeeAvailable).map((e) => e.name).sort((a, b) => a.localeCompare(b));
  const needle = q.trim().toLocaleLowerCase();
  const filtered = needle ? names.filter((n) => n.toLocaleLowerCase().includes(needle)) : names;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(""); }}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={placeholder} className="mt-1 flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm">
          <span className={value ? "truncate text-foreground" : "truncate text-muted-foreground"}>{value || placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder} className="h-8 pl-8 text-sm" aria-label={searchPlaceholder} />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 && <p className="px-3 py-6 text-center text-xs text-muted-foreground">{emptyText}</p>}
          {filtered.map((n) => (
            <button key={n} type="button" aria-pressed={n === value} onClick={() => { onChange(n); setOpen(false); setQ(""); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60">
              <span className="flex-1 truncate">{n}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
