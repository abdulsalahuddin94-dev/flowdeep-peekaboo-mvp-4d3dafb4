import { isEmployeeAvailable } from "@/lib/employee-links";
import { useEmployees } from "@/lib/employees-store";
import { MultiSelectField } from "@/components/ui/multi-select-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
