import { useState, useSyncExternalStore, type MouseEvent } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ToggleActive } from "@/lib/icons";
import { useEmployees, type Employee } from "@/lib/employees-store";
import { useMeetings } from "@/lib/meeting-store";
import { useResourceRequests } from "@/lib/projects-store";
import { employeeLinks, openLinks, type EmployeeLink } from "@/lib/employee-links";
import { formatDateWithYear as formatDate } from "@/lib/date-format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const T = {
  task: "Task", project: "Project team", trip: "Trip", meeting: "Meeting", current: "In progress", future: "Upcoming",
  deactivateTitle: (n: string) => `Deactivate "${n}"?`,
  deactivateBody: "They will no longer appear in any resource list. Their open assignments below stay on record — reassign them if needed.",
  deactivateNone: "They will no longer appear in any resource list.",
  activateTitle: (n: string) => `Activate "${n}"?`, activateBody: "They will appear again in resource lists.",
  deleteBlockedTitle: (n: string) => `"${n}" can't be deleted`,
  deleteBlockedBody: "This employee is linked to work that is still in progress or upcoming. Reassign or finish these items first, or deactivate the employee instead.",
  deleteTitle: (n: string) => `Delete "${n}"?`,
  deleteBody: "The employee is removed from all lists. Their name stays on past tasks, meetings and trips.",
  deletedTitle: "Employee deleted", deletedBody: (n: string) => `${n} was an employee here and has since been deleted. Their profile is no longer available.`,
};

function LinkList({ links }: { links: EmployeeLink[] }) {
  return <ul className="max-h-56 space-y-1.5 overflow-y-auto">{links.map((l, i) => (
    <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs">
      <div className="min-w-0"><div className="truncate font-medium text-foreground">{T[l.kind]} · {l.label}</div><div className="truncate text-muted-foreground">{[l.project, l.from === l.until ? formatDate(l.from) : `${formatDate(l.from)} – ${formatDate(l.until)}`].filter(Boolean).join(" · ")}</div></div>
      <span className={cn("inline-flex h-7 shrink-0 items-center rounded-full border px-3", l.timing === "current" ? "border-rag-amber/40 bg-rag-amber/10 text-rag-amber" : "border-rag-blue/40 bg-rag-blue/10 text-rag-blue")}>{T[l.timing as "current" | "future"]}</span>
    </li>))}</ul>;
}

/** Shared deactivate/activate and delete flows for the employees list and profile. */
export function useEmployeeLifecycle(onDeleted?: () => void) {
  const { updateEmployee } = useEmployees();
  const { resourceRequests } = useResourceRequests();
  const { meetings } = useMeetings();
  const [toggle, setToggle] = useState<Employee | null>(null);
  const [del, setDel] = useState<Employee | null>(null);
  const open = (e: Employee | null) => e ? openLinks(employeeLinks(e, resourceRequests, meetings)) : [];
  const toggleLinks = open(toggle); const delLinks = open(del);
  const deactivating = toggle?.active !== false;
  const dialogs = <>
    <ConfirmDialog open={!!toggle} onOpenChange={(o) => !o && setToggle(null)} tone={deactivating ? "warning" : "success"}
      icon={({ className }) => <ToggleActive className={cn(className, deactivating ? "" : "-scale-x-100")} />}
      title={toggle ? (deactivating ? T.deactivateTitle(toggle.name) : T.activateTitle(toggle.name)) : ""}
      description={deactivating ? (toggleLinks.length ? T.deactivateBody : T.deactivateNone) : T.activateBody}
      confirmLabel={deactivating ? "Deactivate" : "Activate"}
      onConfirm={() => { if (!toggle) return; updateEmployee(toggle.id, { active: !deactivating }); toast.done("Employee", deactivating ? "deactivated" : "activated"); setToggle(null); }}>
      {deactivating && toggleLinks.length ? <LinkList links={toggleLinks} /> : null}
    </ConfirmDialog>
    <ConfirmDialog open={!!del && delLinks.length > 0} onOpenChange={(o) => !o && setDel(null)} tone="warning" hideCancel
      title={del ? T.deleteBlockedTitle(del.name) : ""} description={T.deleteBlockedBody} confirmLabel="Got it" onConfirm={() => setDel(null)}>
      <LinkList links={delLinks} />
    </ConfirmDialog>
    <ConfirmDialog open={!!del && delLinks.length === 0} onOpenChange={(o) => !o && setDel(null)} tone="danger"
      title={del ? T.deleteTitle(del.name) : ""} description={T.deleteBody} confirmLabel="Delete"
      onConfirm={() => { if (!del) return; updateEmployee(del.id, { deleted: true, active: false }); toast.done("Employee", "deleted"); setDel(null); onDeleted?.(); }} />
  </>;
  return { requestToggle: setToggle, requestDelete: setDel, dialogs };
}

let deletedName: string | null = null;
const subs = new Set<() => void>();
const setDeleted = (n: string | null) => { deletedName = n; subs.forEach((l) => l()); };

/** Use on any link to an employee profile: deleted employees open a notice instead of navigating. */
export function guardDeletedEmployee(e: Pick<Employee, "name" | "deleted"> | undefined, ev?: MouseEvent) {
  if (!e?.deleted) return false;
  ev?.preventDefault(); ev?.stopPropagation();
  setDeleted(e.name);
  return true;
}

export function DeletedEmployeeNotice() {
  const name = useSyncExternalStore((l) => { subs.add(l); return () => { subs.delete(l); }; }, () => deletedName, () => null);
  return <ConfirmDialog open={!!name} onOpenChange={(o) => !o && setDeleted(null)} tone="info" hideCancel title={T.deletedTitle} description={name ? T.deletedBody(name) : ""} confirmLabel="Got it" onConfirm={() => setDeleted(null)} />;
}
