import { useState } from "react";
import { useEmployees, type EmploymentType } from "@/lib/employees-store";
import { PageToolbar, EmptyRow } from "@/components/ds/PageToolbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TableRowActions } from "@/components/TableRowActions";
import { TablePagination, usePagination } from "@/components/TablePagination";
import { statusGroup, matchStatus } from "@/components/ds/filters";
import { Plus } from "@/lib/icons";
import { toast } from "@/lib/toast";
export const T = {
  en: { add: "Add employment type", edit: "Edit employment type", name: "Name", search: "Search employment types…", employees: "Employees", status: "Status", cancel: "Cancel", save: "Save changes", required: "Enter a unique employment type name.", delete: "Delete employment type?", blocked: "This type is assigned to employees. Deactivate it instead.", remove: "Delete", deactivate: "Deactivate", activate: "Activate", confirm: "Confirm", toggle: "Change availability?", hint: "Existing employees keep their employment type.", removeHint: "This unused employment type will be removed." },
  ar: { add: "إضافة نوع توظيف", edit: "تعديل نوع التوظيف", name: "الاسم", search: "ابحث عن أنواع التوظيف…", employees: "الموظفون", status: "الحالة", cancel: "إلغاء", save: "حفظ التغييرات", required: "أدخل اسم نوع توظيف غير مكرر.", delete: "حذف نوع التوظيف؟", blocked: "هذا النوع مرتبط بموظفين. يمكنك تعطيله بدلاً من حذفه.", remove: "حذف", deactivate: "تعطيل", activate: "تفعيل", confirm: "تأكيد", toggle: "تغيير الإتاحة؟", hint: "يحتفظ الموظفون الحاليون بنوع التوظيف.", removeHint: "سيتم حذف نوع التوظيف غير المستخدم." },
};
const t = T.en;
export function EmploymentTypesTab() {
  const { employees, employmentTypes, addEmploymentType, updateEmploymentType, removeEmploymentType } = useEmployees();
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<EmploymentType | null>(null); const [open, setOpen] = useState(false); const [name, setName] = useState("");
  const [confirmation, setConfirmation] = useState<{ entry: EmploymentType; kind: "delete" | "toggle" } | null>(null);
  const [error, setError] = useState("");
  const count = (id: string) => employees.filter((e) => e.employmentTypeId === id).length;
  const pager = usePagination(employmentTypes.filter((v) => v.name.toLowerCase().includes(query.toLowerCase()) && matchStatus(status, v.active)));
  const blocked = confirmation?.kind === "delete" && count(confirmation.entry.id) > 0;
  function submit() { const value = name.trim(); if (!value || employmentTypes.some((v) => v.id !== editing?.id && v.name.trim().toLowerCase() === value.toLowerCase())) { setError(t.required); return; } if (editing) updateEmploymentType(editing.id, { name: value }); else addEmploymentType(value); setOpen(false); }
  return <>
    <PageToolbar query={query} onQueryChange={setQuery} placeholder={t.search} filterGroups={[statusGroup(status, setStatus)]} cta={<Button variant="primary" onClick={() => { setEditing(null); setName(""); setError(""); setOpen(true); }}><Plus className="mr-1 h-4 w-4" />{t.add}</Button>} />
    <Table><TableHeader><TableRow><TableHead>{t.name}</TableHead><TableHead>{t.employees}</TableHead><TableHead className="w-40 text-center">{t.status}</TableHead></TableRow></TableHeader><TableBody>
      {!pager.pageItems.length && <EmptyRow colSpan={3} />}{pager.pageItems.map((v) => <TableRow key={v.id} className="group bg-table-row-bg hover:bg-table-row-hover"><TableCell>{v.name}</TableCell><TableCell>{count(v.id)}</TableCell><TableCell><TableRowActions isActive={v.active} onEdit={() => { setEditing(v); setName(v.name); setError(""); setOpen(true); }} onDelete={() => setConfirmation({ entry: v, kind: "delete" })} onToggleActive={() => setConfirmation({ entry: v, kind: "toggle" })} /></TableCell></TableRow>)}
    </TableBody></Table><TablePagination {...pager} itemLabel="employment types" demoPages={0} />
    <FormDialog open={open} onOpenChange={setOpen} title={editing ? t.edit : t.add} cancelLabel={t.cancel} submitLabel={editing ? t.save : t.add} onSubmit={submit}><Field label={t.name} htmlFor="employment-type-name" required error={error}><Input id="employment-type-name" maxLength={60} value={name} onChange={(e) => { setName(e.target.value); setError(""); }} /></Field></FormDialog>
    <ConfirmDialog open={!!confirmation} onOpenChange={(o) => { if (!o) setConfirmation(null); }} title={confirmation?.kind === "delete" ? t.delete : t.toggle} description={blocked ? t.blocked : confirmation?.kind === "delete" ? t.removeHint : t.hint} tone={blocked || confirmation?.kind === "toggle" ? "warning" : "danger"} cancelLabel={t.cancel} confirmLabel={blocked ? t.deactivate : confirmation?.kind === "delete" ? t.remove : t.confirm} onConfirm={() => { if (!confirmation) return; if (blocked) updateEmploymentType(confirmation.entry.id, { active: false }); else if (confirmation.kind === "delete") { if (!removeEmploymentType(confirmation.entry.id)) toast.error(t.blocked); } else updateEmploymentType(confirmation.entry.id, { active: !confirmation.entry.active }); setConfirmation(null); }} />
  </>;
}
