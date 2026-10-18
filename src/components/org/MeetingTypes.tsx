import { useState } from "react";
import { PageToolbar, EmptyRow } from "@/components/ds/PageToolbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TableRowActions } from "@/components/TableRowActions";
import { TablePagination, usePagination } from "@/components/TablePagination";
import { matchStatus, statusGroup } from "@/components/ds/filters";
import { useMeetingTypes, type MeetingTypeEntry } from "@/lib/meeting-types-store";
import { useMeetings } from "@/lib/meeting-store";
import { Plus } from "@/lib/icons";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export const T = {
  en: { title: "Meeting Types", add: "Add meeting type", edit: "Edit meeting type", name: "Name", search: "Search meeting types…", status: "Status", save: "Save changes", cancel: "Cancel", required: "Name is required.", duplicate: "A meeting type with this name already exists.", added: "Meeting type added", updated: "Meeting type updated", remove: "Delete meeting type?", removeHint: "This type will no longer be available for new meetings. Existing meetings keep their type.", delete: "Delete", activate: "Activate", deactivate: "Deactivate", toggleHint: "Existing meetings keep their type.", toggleTitle: "this meeting type?", placeholder: "e.g. Project kickoff" },
  ar: { title: "أنواع الاجتماعات", add: "إضافة نوع اجتماع", edit: "تعديل نوع الاجتماع", name: "الاسم", search: "ابحث عن أنواع الاجتماعات…", status: "الحالة", save: "حفظ التغييرات", cancel: "إلغاء", required: "الاسم مطلوب.", duplicate: "يوجد نوع اجتماع بهذا الاسم بالفعل.", added: "تمت إضافة نوع الاجتماع", updated: "تم تعديل نوع الاجتماع", remove: "حذف نوع الاجتماع؟", removeHint: "لن يكون هذا النوع متاحاً للاجتماعات الجديدة. تحتفظ الاجتماعات الحالية بنوعها.", delete: "حذف", activate: "تفعيل", deactivate: "تعطيل", toggleHint: "تحتفظ الاجتماعات الحالية بنوعها.", toggleTitle: "نوع الاجتماع هذا؟", placeholder: "مثال: انطلاق المشروع" },
};
const t = T.en;
const normalize = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

export function MeetingTypesTab() {
  const { meetingTypes, addMeetingType, updateMeetingType, removeMeetingType } = useMeetingTypes();
  const { renameMeetingType } = useMeetings();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MeetingTypeEntry | null>(null);
  const [name, setName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<MeetingTypeEntry | null>(null);
  const [pendingToggle, setPendingToggle] = useState<MeetingTypeEntry | null>(null);
  const visible = meetingTypes.filter((v) => v.name.toLowerCase().includes(query.trim().toLowerCase()) && matchStatus(status, v.active));
  const pager = usePagination(visible);
  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error(t.required); return; }
    if (meetingTypes.some((v) => v.id !== editing?.id && normalize(v.name) === normalize(trimmed))) { toast.error(t.duplicate); return; }
    if (editing) {
      renameMeetingType(editing.name, trimmed);
      updateMeetingType(editing.id, { name: trimmed });
    } else addMeetingType(trimmed);
    toast.success(editing ? t.updated : t.added);
    setOpen(false);
  };
  return <>
    <PageToolbar query={query} onQueryChange={setQuery} placeholder={t.search} resultCount={visible.length} totalCount={meetingTypes.length}
      onReset={() => { setQuery(""); setStatus("all"); }} filterGroups={[statusGroup(status, setStatus)]}
      cta={<Button variant="primary" onClick={() => { setEditing(null); setName(""); setOpen(true); }}><Plus className="mr-1 h-4 w-4" />{t.add}</Button>} />
    <Table>
      <TableHeader><TableRow className="border-0 bg-transparent hover:bg-transparent"><TableHead>{t.name}</TableHead><TableHead className="w-32 text-center">{t.status}</TableHead></TableRow></TableHeader>
      <TableBody>
        {visible.length === 0 && <EmptyRow colSpan={2} />}
        {pager.pageItems.map((v) => <TableRow key={v.id} className={cn("border-0 bg-table-row-bg hover:bg-table-row-hover", !v.active && "opacity-60")}>
          <TableCell className="font-medium text-foreground">{v.name}</TableCell>
          <TableCell><TableRowActions isActive={v.active} onEdit={() => { setEditing(v); setName(v.name); setOpen(true); }} onDelete={() => setPendingDelete(v)} onToggleActive={() => setPendingToggle(v)} /></TableCell>
        </TableRow>)}
      </TableBody>
    </Table>
    <TablePagination {...pager} itemLabel={t.title} />
    <FormDialog open={open} onOpenChange={setOpen} title={editing ? t.edit : t.add} cancelLabel={t.cancel} submitLabel={editing ? t.save : t.add} onSubmit={submit}>
      <Field label={t.name} htmlFor="meeting-type-name"><Input id="meeting-type-name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.placeholder} /></Field>
    </FormDialog>
    <ConfirmDialog open={!!pendingDelete} onOpenChange={(o) => { if (!o) setPendingDelete(null); }} title={t.remove} description={t.removeHint} tone="danger" confirmLabel={t.delete} cancelLabel={t.cancel}
      onConfirm={() => { if (pendingDelete) removeMeetingType(pendingDelete.id); setPendingDelete(null); }} />
    <ConfirmDialog open={!!pendingToggle} onOpenChange={(o) => { if (!o) setPendingToggle(null); }} title={`${pendingToggle?.active ? t.deactivate : t.activate} ${t.toggleTitle}`} description={t.toggleHint} tone={pendingToggle?.active ? "warning" : "success"} confirmLabel={pendingToggle?.active ? t.deactivate : t.activate} cancelLabel={t.cancel}
      onConfirm={() => { if (pendingToggle) updateMeetingType(pendingToggle.id, { active: !pendingToggle.active }); setPendingToggle(null); }} />
  </>;
}