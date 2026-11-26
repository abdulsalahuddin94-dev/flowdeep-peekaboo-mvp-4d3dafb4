import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmployeeSingleSelect } from "@/components/actions/EmployeePickers";
import { useEmployees } from "@/lib/employees-store";
import { Plus, X } from "@/lib/icons";
import type { Attendee, AttendeeParty } from "@/lib/meeting-store";

const T = {
  en: { type: "Type", internal: "Internal", external: "External", attendees: "Attendees", organization: "Organization", name: "Attendee name", organizationPlaceholder: "Organization", add: "Add attendee", remove: "Remove attendee", empty: "No attendees yet", search: "Search employees", none: "No employees found" },
  ar: { type: "النوع", internal: "داخلي", external: "خارجي", attendees: "الحضور", organization: "المؤسسة", name: "اسم الحاضر", organizationPlaceholder: "المؤسسة", add: "إضافة حاضر", remove: "إزالة حاضر", empty: "لا يوجد حضور بعد", search: "ابحث عن موظف", none: "لا يوجد موظفون" },
};

/**
 * One composer for both attendee kinds: the Type select decides the inputs on the
 * row, the "+" is always there to commit them, and every added person lands in the
 * bar below — internal and external live in the same array, so switching Type never
 * drops the other group.
 */
export function MeetingAttendeesField({ attendees, onChange, lang = "en" }: { attendees: Attendee[]; onChange: (attendees: Attendee[]) => void; lang?: "en" | "ar" }) {
  const t = T[lang];
  const { employees } = useEmployees();
  const [party, setParty] = useState<AttendeeParty>("Internal");
  const [picked, setPicked] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");

  const norm = (s: string) => s.trim().toLocaleLowerCase();
  const taken = (n: string) => attendees.some((a) => norm(a.name) === norm(n));

  function addInternal() {
    const chosen = picked.trim();
    if (!chosen || taken(chosen)) return;
    const employee = employees.find((e) => norm(e.name) === norm(chosen));
    onChange([...attendees, { id: crypto.randomUUID(), name: employee?.name ?? chosen, party: "Internal", ...(employee?.email ? { email: employee.email } : {}) }]);
    setPicked("");
  }

  function addExternal() {
    const chosen = name.trim();
    if (!chosen || taken(chosen)) return;
    onChange([...attendees, { id: crypto.randomUUID(), name: chosen, party: "External", ...(organization.trim() ? { organization: organization.trim() } : {}) }]);
    setName("");
    setOrganization("");
  }

  const canAdd = party === "Internal" ? Boolean(picked.trim()) && !taken(picked) : Boolean(name.trim()) && !taken(name);
  const commit = party === "Internal" ? addInternal : addExternal;

  return (
    <div className="space-y-2">
      <div dir="ltr" className={party === "External" ? "grid grid-cols-1 items-end gap-4 sm:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_36px]" : "grid grid-cols-1 items-end gap-4 sm:grid-cols-[160px_minmax(0,1fr)_36px]"}>
        <Field label={t.type} htmlFor="meeting-attendee-type">
          <Select value={party} onValueChange={(value) => { if (value === "Internal" || value === "External") setParty(value); }}>
            <SelectTrigger id="meeting-attendee-type" aria-label={t.type}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Internal">{t.internal}</SelectItem><SelectItem value="External">{t.external}</SelectItem></SelectContent>
          </Select>
        </Field>
        {party === "Internal" ? (
          <Field label={t.attendees} htmlFor="meeting-attendees">
            <EmployeeSingleSelect value={picked} onChange={setPicked} searchPlaceholder={t.search} emptyText={t.none} />
          </Field>
        ) : (
          <>
            <Field label={t.attendees} htmlFor="meeting-external-name"><Input id="meeting-external-name" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder={t.name} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addExternal(); } }} /></Field>
            <Field label={t.organization} htmlFor="meeting-external-organization"><Input id="meeting-external-organization" maxLength={80} value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder={t.organizationPlaceholder} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addExternal(); } }} /></Field>
          </>
        )}
        <Tooltip><TooltipTrigger asChild><Button type="button" variant="primary" size="icon" aria-label={t.add} disabled={!canAdd} onClick={commit}><Plus size={16} /></Button></TooltipTrigger><TooltipContent>{t.add}</TooltipContent></Tooltip>
      </div>
      <div dir="ltr" aria-label={t.attendees} className="min-h-11 rounded-lg border border-dashed border-input bg-background/40 p-2">
        {attendees.length === 0 ? (
          <p className="px-1 py-1.5 text-xs text-muted-foreground">{t.empty}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {attendees.map((attendee) => (
              <div key={attendee.id} className={`flex h-7 max-w-full items-center gap-2 rounded-full border px-3 text-xs ${attendee.party === "Internal" ? "border-primary/50 bg-primary/15 text-primary" : "border-rag-teal/40 bg-rag-teal/10 text-rag-teal"}`}>
                <span className="truncate">{attendee.name}{attendee.organization ? ` · ${attendee.organization}` : ""}</span>
                <Tooltip><TooltipTrigger asChild><Button type="button" size="icon" variant="ghost" className="h-5 w-5 shrink-0" aria-label={`${t.remove}: ${attendee.name}`} onClick={() => onChange(attendees.filter((a) => a.id !== attendee.id))}><X size={12} /></Button></TooltipTrigger><TooltipContent>{t.remove}</TooltipContent></Tooltip>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
