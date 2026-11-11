import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useEmployees, type EmploymentType } from "@/lib/employees-store";
import { PageToolbar, EmptyRow } from "@/components/ds/PageToolbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TableRowActions } from "@/components/TableRowActions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TablePagination, usePagination } from "@/components/TablePagination";
import { statusGroup, matchStatus } from "@/components/ds/filters";
import { ChevronRight, Plus } from "@/lib/icons";
import { toast } from "@/lib/toast";
export const T = {
  en: { add: "Add employment type", edit: "Edit employment type", name: "Name", description: "Description", search: "Search employment types…", employees: "Employees", peopleOf: "employees", status: "Status", cancel: "Cancel", save: "Save changes", required: "Enter a unique employment type name.", delete: "Delete employment type?", blocked: "This type is assigned to employees. Deactivate it instead.", remove: "Delete", deactivate: "Deactivate", activate: "Activate", confirm: "Confirm", toggle: "Change availability?", hint: "Existing employees keep their employment type.", removeHint: "This unused employment type will be removed." },
  ar: { add: "إضافة نوع توظيف", edit: "تعديل نوع التوظيف", name: "الاسم", description: "الوصف", search: "ابحث عن أنواع التوظيف…", employees: "الموظفون", peopleOf: "موظف", status: "الحالة", cancel: "إلغاء", save: "حفظ التغييرات", required: "أدخل اسم نوع توظيف غير مكرر.", delete: "حذف نوع التوظيف؟", blocked: "هذا النوع مرتبط بموظفين. يمكنك تعطيله بدلاً من حذفه.", remove: "حذف", deactivate: "تعطيل", activate: "تفعيل", confirm: "تأكيد", toggle: "تغيير الإتاحة؟", hint: "يحتفظ الموظفون الحاليون بنوع التوظيف.", removeHint: "سيتم حذف نوع التوظيف غير المستخدم." },
};
const t = T.en;
export function EmploymentTypesTab() {
  const { employees, employmentTypes, addEmploymentType, updateEmploymentType, removeEmploymentType } = useEmployees();
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<EmploymentType | null>(null); const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  const [confirmation, setConfirmation] = useState<{ entry: EmploymentType; kind: "delete" | "toggle" } | null>(null);
  const [listing, setListing] = useState<EmploymentType | null>(null);
  const listed = listing ? employees.filter((e) => e.employmentTypeId === listing.id) : [];
  const [error, setError] = useState("");
  const count = (id: string) => employees.filter((e) => e.employmentTypeId === id).length;
  const pager = usePagination(employmentTypes.filter((v) => (v.name.toLowerCase().includes(query.toLowerCase()) || (v.description ?? "").toLowerCase().includes(query.toLowerCase())) && matchStatus(status, v.active)));
  const blocked = confirmation?.kind === "delete" && count(confirmation.entry.id) > 0;
  function submit() { const value = name.trim(); if (!value || employmentTypes.some((v) => v.id !== editing?.id && v.name.trim().toLowerCase() === value.toLowerCase())) { setError(t.required); return; } if (editing) updateEmploymentType(editing.id, { name: value, description: desc.trim() }); else addEmploymentType(value, desc); setOpen(false); }
  return <>
    <PageToolbar query={query} onQueryChange={setQuery} placeholder={t.search} filterGroups={[statusGroup(status, setStatus)]} cta={<Button variant="primary" onClick={() => { setEditing(null); setName(""); setDesc(""); setError(""); setOpen(true); }}><Plus className="mr-1 h-4 w-4" />{t.add}</Button>} />
    <Table><TableHeader><TableRow><TableHead>{t.name}</TableHead><TableHead>{t.description}</TableHead><TableHead>{t.employees}</TableHead><TableHead className="w-40 text-center">{t.status}</TableHead></TableRow></TableHeader><TableBody>
      {!pager.pageItems.length && <EmptyRow colSpan={4} />}{pager.pageItems.map((v) => <TableRow key={v.id} className="group bg-table-row-bg hover:bg-table-row-hover"><TableCell>{v.name}</TableCell><TableCell className="w-72 text-muted-foreground">{v.description || "—"}</TableCell><TableCell>{count(v.id) ? <button type="button" onClick={() => setListing(v)} className="num-mono font-medium text-foreground underline-offset-4 hover:text-accent hover:underline">{count(v.id)}</button> : <span className="num-mono text-muted-foreground">0</span>}</TableCell><TableCell><TableRowActions isActive={v.active} onEdit={() => { setEditing(v); setName(v.name); setDesc(v.description ?? ""); setError(""); setOpen(true); }} onDelete={() => setConfirmation({ entry: v, kind: "delete" })} onToggleActive={() => setConfirmation({ entry: v, kind: "toggle" })} /></TableCell></TableRow>)}
    </TableBody></Table><TablePagination {...pager} itemLabel="employment types" demoPages={0} />
    <FormDialog open={open} onOpenChange={setOpen} title={editing ? t.edit : t.add} cancelLabel={t.cancel} submitLabel={editing ? t.save : t.add} onSubmit={submit}><Field label={t.name} htmlFor="employment-type-name" required error={error}><Input id="employment-type-name" maxLength={60} value={name} onChange={(e) => { setName(e.target.value); setError(""); }} /></Field><Field label={t.description} htmlFor="employment-type-description"><Textarea id="employment-type-description" maxLength={200} value={desc} onChange={(e) => setDesc(e.target.value)} /></Field></FormDialog>
    <ConfirmDialog open={!!confirmation} onOpenChange={(o) => { if (!o) setConfirmation(null); }} title={confirmation?.kind === "delete" ? t.delete : t.toggle} description={blocked ? t.blocked : confirmation?.kind === "delete" ? t.removeHint : t.hint} tone={blocked || confirmation?.kind === "toggle" ? "warning" : "danger"} cancelLabel={t.cancel} confirmLabel={blocked ? t.deactivate : confirmation?.kind === "delete" ? t.remove : t.confirm} onConfirm={() => { if (!confirmation) return; if (blocked) updateEmploymentType(confirmation.entry.id, { active: false }); else if (confirmation.kind === "delete") { if (!removeEmploymentType(confirmation.entry.id)) toast.error(t.blocked); } else updateEmploymentType(confirmation.entry.id, { active: !confirmation.entry.active }); setConfirmation(null); }} />
    <Dialog open={!!listing} onOpenChange={(o) => { if (!o) setListing(null); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{listing?.name}</DialogTitle>
          <DialogDescription>{listed.length} {t.peopleOf}</DialogDescription>
        </DialogHeader>
        <div className="max-h-80 space-y-1 overflow-y-auto pe-1">
          {listed.map((e) => (
            <Link key={e.id} to="/resources/employees/$employeeId" params={{ employeeId: e.id }} onClick={() => setListing(null)} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-secondary">
              <Avatar className="h-9 w-9 shrink-0">{e.avatar ? <AvatarImage src={e.avatar} alt={e.name} /> : null}<AvatarFallback className="bg-accent-dim text-xs font-medium text-accent">{e.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{e.name}</div>
                <div className="truncate text-xs text-muted-foreground">{e.role}</div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-180" />
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
