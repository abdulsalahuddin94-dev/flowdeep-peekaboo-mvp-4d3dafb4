import { useMemo, useState } from "react";
import { PageToolbar, EmptyRow } from "@/components/ds/PageToolbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TableRowActions, StatusPill } from "@/components/TableRowActions";
import { TablePagination, usePagination } from "@/components/TablePagination";
import { EmptyRegion } from "@/lib/empty-preview";
import { cn } from "@/lib/utils";
import { Plus, ToggleActive } from "@/lib/icons";
import { toast } from "@/lib/toast";
import { matchStatus, statusGroup } from "@/components/ds/filters";
import {
  useResponsibilities,
  type ResponsibilityType, type RespParty,
} from "@/lib/responsibility-store";
import { useActions } from "@/lib/action-store";
import { useOrgActive } from "@/lib/org-active";

/** Master-data names are unique per list — compared ignoring case and extra spaces. */
const normName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");


/** Shared form fields for add / edit. */
function RespTypeFields({ name, party, onName, onParty }: {
  name: string; party: RespParty;
  onName: (v: string) => void; onParty: (v: RespParty) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Name</Label>
        <Input value={name} maxLength={60} onChange={(e) => onName(e.target.value)} placeholder="e.g. Internal, Client, Vendor" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Party</Label>
          <Select value={party} onValueChange={(v) => onParty(v as RespParty)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Internal">Internal</SelectItem>
              <SelectItem value="External">External</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

/** Toolbar CTA — owns its own dialog so it works from the portaled actions slot. */
function AddResponsibilityDialog({ existing, onAdd }: {
  existing: string[];
  onAdd: (v: { name: string; party: RespParty }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [party, setParty] = useState<RespParty>("Internal");

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Name is required"); return; }
    if (existing.some((e) => normName(e) === normName(trimmed))) {
      toast.error(`Responsibility type "${trimmed}" already exists. Use a different name.`);
      return;
    }
    onAdd({ name: trimmed, party });
    toast.done("Responsibility type", "added");
    setOpen(false);
    setName(""); setParty("Internal");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary"><Plus className="mr-1 h-4 w-4" />Add responsibility type</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Responsibility Type</DialogTitle>
          <DialogDescription>Used for the Responsibility field on actions. Names are English only.</DialogDescription>
        </DialogHeader>
        <RespTypeFields name={name} party={party} onName={setName} onParty={setParty} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={save}>Add responsibility type</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ResponsibilityTypesTab() {
  const { respTypes, addRespType, updateRespType, removeRespType } = useResponsibilities();
  const { renameResponsibility } = useActions();
  const { isActive, setActive } = useOrgActive("responsibility-type");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<ResponsibilityType | null>(null);
  const [editName, setEditName] = useState("");
  const [editParty, setEditParty] = useState<RespParty>("Internal");
  const [pendingDelete, setPendingDelete] = useState<ResponsibilityType | null>(null);
  const [pendingToggle, setPendingToggle] = useState<{ name: string; active: boolean } | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return respTypes
      .filter((t) => !q || t.name.toLowerCase().includes(q))
      .filter((t) => matchStatus(status, isActive(t.name)));
  }, [respTypes, query, status, isActive]);

  const pager = usePagination(visible);

  const openEdit = (t: ResponsibilityType) => { setEditing(t); setEditName(t.name); setEditParty(t.party); };

  const saveEdit = () => {
    if (!editing) return;
    const name = editName.trim();
    if (!name) { toast.error("Name is required"); return; }
    if (respTypes.some((t) => normName(t.name) === normName(name) && t.id !== editing.id)) {
      toast.error(`Responsibility type "${name}" already exists. Use a different name.`);
      return;
    }
    if (editing.name !== name) {
      renameResponsibility(editing.name, name);
    }
    updateRespType(editing.id, { name, party: editParty });
    toast.done("Responsibility type", "updated");
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    removeRespType(pendingDelete.id);
    toast.done("Responsibility type", "deleted");
    setPendingDelete(null);
  };

  return (
    <>
      <PageToolbar
        title="Responsibility Types"
        desc="Central lookup for the Responsibility field on actions across projects."
        query={query}
        onQueryChange={setQuery}
        placeholder="Search name…"
        resultCount={visible.length}
        totalCount={respTypes.length}
        onReset={() => { setQuery(""); setStatus("all"); }}
        cta={<AddResponsibilityDialog existing={respTypes.map((t) => t.name)} onAdd={addRespType} />}
        filterGroups={[statusGroup(status, setStatus)]}
      />
      <EmptyRegion id="org-responsibility-types">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
            <TableHead className="w-64">Name</TableHead>
            <TableHead className="w-40">Party</TableHead>
            <TableHead className="w-32 text-center">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {visible.length === 0 && <EmptyRow colSpan={3} />}
            {pager.pageItems.map((t) => (
              <TableRow
                key={t.id}
                className={cn("bg-table-row-bg hover:bg-table-row-hover border-0", !isActive(t.name) && "opacity-60")}
              >
                <TableCell className="whitespace-nowrap font-medium text-foreground">{t.name}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{t.party}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <TableRowActions
                    onEdit={() => openEdit(t)}
                    isActive={isActive(t.name)}
                    onToggleActive={() => setPendingToggle({ name: t.name, active: isActive(t.name) })}
                    onDelete={() => setPendingDelete(t)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination {...pager} itemLabel="responsibility types" />
      </EmptyRegion>


      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Responsibility Type</DialogTitle>
            <DialogDescription>
              Renaming updates this type on every action already using it.
            </DialogDescription>
          </DialogHeader>
          <RespTypeFields name={editName} party={editParty} onName={setEditName} onParty={setEditParty} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        description="This responsibility type will be removed from the organization master data. Actions already carrying it keep their value, shown in the default styling."
        label={pendingDelete?.name}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={!!pendingToggle}
        onOpenChange={(o) => !o && setPendingToggle(null)}
        tone={pendingToggle?.active ? "warning" : "success"}
        icon={({ className }) => <ToggleActive className={cn(className, !pendingToggle?.active && "-scale-x-100")} />}
        title={`${pendingToggle?.active ? "Deactivate" : "Activate"} "${pendingToggle?.name ?? ""}"?`}
        description={`Are you sure you want to ${pendingToggle?.active ? "deactivate" : "activate"} this responsibility type?`}
        cancelLabel="Cancel"
        confirmLabel={pendingToggle?.active ? "Deactivate" : "Activate"}
        onConfirm={() => {
          if (!pendingToggle) return;
          setActive(pendingToggle.name, !pendingToggle.active);
          toast.done("Responsibility type", pendingToggle.active ? "deactivated" : "activated");
          setPendingToggle(null);
        }}
      />
    </>
  );
}
