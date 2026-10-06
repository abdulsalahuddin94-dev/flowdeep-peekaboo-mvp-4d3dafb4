import { useMemo, useState } from "react";
import { PageToolbar, EmptyRow } from "@/components/ds/PageToolbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TableRowActions, StatusPill } from "@/components/TableRowActions";
import { TablePagination, usePagination } from "@/components/TablePagination";
import { EmptyRegion } from "@/lib/empty-preview";
import { Pill } from "@/components/Pill";
import { cn } from "@/lib/utils";
import { ToggleActive } from "@/lib/icons";
import { toast } from "@/lib/toast";
import { matchStatus, statusGroup } from "@/components/ds/filters";
import {
  useResponsibilities, useMeetingPartyResp, RESP_TONES, RESP_TONE_CLASS, defaultResponsibility,
  type ResponsibilityType, type RespParty,
} from "@/lib/responsibility-store";
import { useActions } from "@/lib/action-store";
import { useOrgActive } from "@/lib/org-active";
import { ATTENDEE_PARTIES } from "@/lib/meeting-store";

/** Master-data names are unique per list — compared ignoring case and extra spaces. */
const normName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

const PARTY_TONE: Record<RespParty, string> = {
  Internal: "border-accent/40 bg-accent/10 text-accent",
  External: "border-border bg-muted text-muted-foreground",
};

type Draft = { id?: string; name: string; party: RespParty; tone: string };

export function ResponsibilityTypesTab() {
  const { respTypes, addRespType, updateRespType, removeRespType } = useResponsibilities();
  const { mapping, setPartyResp } = useMeetingPartyResp();
  const { renameResponsibility } = useActions();
  const { isActive, setActive } = useOrgActive("responsibility-type");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ResponsibilityType | null>(null);
  const [pendingToggle, setPendingToggle] = useState<{ name: string; active: boolean } | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return respTypes
      .filter((t) => !q || t.name.toLowerCase().includes(q))
      .filter((t) => matchStatus(status, isActive(t.name)));
  }, [respTypes, query, status, isActive]);

  const pager = usePagination(visible);

  const submit = () => {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) { toast.error("Name is required"); return; }
    if (respTypes.some((t) => normName(t.name) === normName(name) && t.id !== draft.id)) {
      toast.error(`Responsibility type "${name}" already exists. Use a different name.`);
      return;
    }
    if (draft.id) {
      const original = respTypes.find((t) => t.id === draft.id);
      if (original && original.name !== name) {
        renameResponsibility(original.name, name);
        ATTENDEE_PARTIES.forEach((p) => { if (mapping[p] === original.name) setPartyResp(p, name); });
      }
      updateRespType(draft.id, { name, party: draft.party, tone: draft.tone });
      toast.done("Responsibility type", "updated");
    } else {
      addRespType({ name, party: draft.party, tone: draft.tone });
      toast.done("Responsibility type", "added");
    }
    setDraft(null);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    removeRespType(pendingDelete.id);
    const rest = respTypes.filter((t) => t.id !== pendingDelete.id);
    const fallback = defaultResponsibility(rest);
    ATTENDEE_PARTIES.forEach((p) => { if (mapping[p] === pendingDelete.name) setPartyResp(p, fallback); });
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
        cta={<Button variant="primary" onClick={() => { console.log("ADD-CLICK"); setDraft({ name: "", party: "Internal", tone: "accent" }); }}Add responsibility type</Button>}
        filterGroups={[statusGroup(status, setStatus)]}
      />
      <EmptyRegion id="org-responsibility-types">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
            <TableHead className="w-64">Name</TableHead>
            <TableHead className="w-40">Party</TableHead>
            <TableHead className="w-40">Color</TableHead>
            <TableHead className="w-32 text-center">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {visible.length === 0 && <EmptyRow colSpan={4} />}
            {pager.pageItems.map((t) => (
              <TableRow
                key={t.id}
                className={cn("bg-table-row-bg hover:bg-table-row-hover border-0", !isActive(t.name) && "opacity-60")}
              >
                <TableCell className="whitespace-nowrap font-medium text-foreground">{t.name}</TableCell>
                <TableCell><Pill label={t.party} tone={PARTY_TONE[t.party]} /></TableCell>
                <TableCell><Pill label={t.name} tone={RESP_TONE_CLASS[t.tone] ?? RESP_TONE_CLASS.muted} /></TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <TableRowActions
                    onEdit={() => setDraft({ id: t.id, name: t.name, party: t.party, tone: t.tone })}
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

      <Card className="mt-4 border-border bg-surface">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-medium">Meeting attendee mapping</CardTitle>
          <CardDescription>
            When an action owner is picked from a meeting's attendees, the responsibility is taken from that attendee's party.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 pt-0 sm:grid-cols-2 lg:grid-cols-5">
          {ATTENDEE_PARTIES.map((p) => {
            const value = mapping[p];
            const options = respTypes.filter((t) => isActive(t.name) || t.name === value);
            return (
              <div key={p} className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">{p}</Label>
                <Select value={value} onValueChange={(v) => { setPartyResp(p, v); toast.done("Meeting attendee mapping", "updated"); }}>
                  <SelectTrigger aria-label={`Responsibility for ${p}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {options.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit Responsibility Type" : "Add Responsibility Type"}</DialogTitle>
            <DialogDescription>
              Used for the Responsibility field on actions. Names are English only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={draft?.name ?? ""} maxLength={60} onChange={(e) => setDraft((p) => (p ? { ...p, name: e.target.value } : p))} placeholder="e.g. Internal, Client, Vendor" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Party</Label>
                <Select value={draft?.party ?? "Internal"} onValueChange={(v) => setDraft((p) => (p ? { ...p, party: v as RespParty } : p))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Internal">Internal</SelectItem>
                    <SelectItem value="External">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Color</Label>
                <Select value={draft?.tone ?? "accent"} onValueChange={(v) => setDraft((p) => (p ? { ...p, tone: v } : p))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESP_TONES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="inline-flex items-center">
                          <span className={cn("mr-2 inline-flex rounded-full border px-2 py-0.5 text-[11px]", RESP_TONE_CLASS[c.value])}>{c.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="primary" onClick={submit}>{draft?.id ? "Save" : "Add responsibility type"}</Button>
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
