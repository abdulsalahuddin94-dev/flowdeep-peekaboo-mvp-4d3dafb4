import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmployeeAttendeesSelect } from "@/components/actions/EmployeePickers";
import { Plus, X } from "@/lib/icons";
import type { Attendee, AttendeeParty } from "@/lib/meeting-store";

const T = {
  en: { type: "Type", internal: "Internal", external: "External", attendees: "Attendees", organization: "Organization", name: "Attendee name", organizationPlaceholder: "Organization", add: "Add attendee", remove: "Remove attendee" },
  ar: { type: "النوع", internal: "داخلي", external: "خارجي", attendees: "الحضور", organization: "المؤسسة", name: "اسم الحاضر", organizationPlaceholder: "المؤسسة", add: "إضافة حاضر", remove: "إزالة حاضر" },
};

export function MeetingAttendeesField({ attendees, onChange, lang = "en" }: { attendees: Attendee[]; onChange: (attendees: Attendee[]) => void; lang?: "en" | "ar" }) {
  const t = T[lang];
  const [party, setParty] = useState<AttendeeParty>("Internal");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const internal = attendees.filter((a) => a.party === "Internal");
  const external = attendees.filter((a) => a.party === "External");

  function addExternal() {
    if (!name.trim()) return;
    onChange([...attendees, { id: crypto.randomUUID(), name: name.trim(), party: "External", ...(organization.trim() ? { organization: organization.trim() } : {}) }]);
    setName("");
    setOrganization("");
  }

  return (
    <div className="space-y-2">
      <div dir="ltr" className={party === "External" ? "grid grid-cols-1 items-end gap-4 sm:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_36px]" : "grid grid-cols-1 items-end gap-4 sm:grid-cols-[160px_minmax(0,1fr)]"}>
        <Field label={t.type} htmlFor="meeting-attendee-type">
          <Select value={party} onValueChange={(value) => { if (value === "Internal" || value === "External") setParty(value); }}>
            <SelectTrigger id="meeting-attendee-type" aria-label={t.type}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Internal">{t.internal}</SelectItem><SelectItem value="External">{t.external}</SelectItem></SelectContent>
          </Select>
        </Field>
        {party === "Internal" ? (
          <Field label={t.attendees} htmlFor="meeting-attendees">
            <EmployeeAttendeesSelect attendees={internal} onChange={(next) => onChange([...next, ...external])} />
          </Field>
        ) : (
          <>
            <Field label={t.attendees} htmlFor="meeting-external-name"><Input id="meeting-external-name" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder={t.name} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addExternal(); } }} /></Field>
            <Field label={t.organization} htmlFor="meeting-external-organization"><Input id="meeting-external-organization" maxLength={80} value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder={t.organizationPlaceholder} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addExternal(); } }} /></Field>
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="primary" size="icon" aria-label={t.add} disabled={!name.trim()} onClick={addExternal}><Plus size={16} /></Button></TooltipTrigger><TooltipContent>{t.add}</TooltipContent></Tooltip>
          </>
        )}
      </div>
      {external.length > 0 && <div className="flex flex-wrap gap-2">{external.map((attendee) => (
        <div key={attendee.id} className="flex h-7 max-w-full items-center gap-2 rounded-full border border-rag-teal/40 bg-rag-teal/10 px-3 text-xs text-rag-teal">
          <span className="truncate">{attendee.name}{attendee.organization ? ` · ${attendee.organization}` : ""}</span>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="icon" variant="ghost" className="h-5 w-5 shrink-0" aria-label={`${t.remove}: ${attendee.name}`} onClick={() => onChange(attendees.filter((a) => a.id !== attendee.id))}><X size={12} /></Button></TooltipTrigger><TooltipContent>{t.remove}</TooltipContent></Tooltip>
        </div>
      ))}</div>}
    </div>
  );
}