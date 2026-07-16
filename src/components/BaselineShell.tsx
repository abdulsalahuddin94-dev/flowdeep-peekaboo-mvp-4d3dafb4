import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────────

export type BaselineVersion = {
  version: number;
  createdAt: string;
  author: string;
};

export type DiffRow = {
  group: string;      // e.g. "Objective" or a row identifier
  field: string;      // e.g. "Value" or "FTE"
  from: string;
  to: string;
  kind?: "changed" | "added" | "removed";
};

export type BaselineApprover = { id: string; name: string; role: string };

// ─────────────────────────────────────────────────────────────────────────────
// Context so child inputs know if they are locked
// ─────────────────────────────────────────────────────────────────────────────

type BaselineCtx = { locked: boolean; tabKey: string; historical: boolean };
const BaselineContext = createContext<BaselineCtx>({ locked: true, tabKey: "", historical: false });
export function useBaseline() { return useContext(BaselineContext); }

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

function GroupedDiff({ rows }: { rows: DiffRow[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, DiffRow[]>();
    rows.forEach((r) => {
      const arr = map.get(r.group) ?? [];
      arr.push(r);
      map.set(r.group, arr);
    });
    return Array.from(map.entries());
  }, [rows]);

  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  if (rows.length === 0) {
    return <div className="text-xs text-muted-foreground italic px-2 py-3">No changes yet.</div>;
  }
  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
      {groups.map(([g, list]) => {
        const isOpen = openMap[g] ?? true;
        return (
          <div key={g} className="rounded-md border border-border/60 bg-secondary/20">
            <button
              type="button"
              onClick={() => setOpenMap((p) => ({ ...p, [g]: !isOpen }))}
              className="flex w-full items-center justify-between px-3 py-2 text-xs"
            >
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                {g}
              </span>
              <Badge variant="outline" className="text-[10px]">{list.length} change{list.length > 1 ? "s" : ""}</Badge>
            </button>
            {isOpen && (
              <div className="border-t border-border/60 divide-y divide-border/40">
                {list.map((r, i) => (
                  <div key={i} className="px-3 py-2 text-xs">
                    <div className="text-muted-foreground mb-0.5">{r.field}</div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-rag-red/10 px-1.5 py-0.5 text-rag-red line-through">{r.from || "—"}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="rounded bg-rag-green/10 px-1.5 py-0.5 text-rag-green">{r.to || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main shell
// ─────────────────────────────────────────────────────────────────────────────

export type BaselineShellProps = {
  tabKey: string;
  title: string;
  versions: BaselineVersion[];
  activeVersion: string;                           // "latest" or "v<n>"
  onChangeVersion: (v: string) => void;
  editMode: "viewing" | "editing";
  onEnterEdit: () => void;
  onCancelEdit: () => void;                        // parent handles reverting drafts
  hasDraftChanges: boolean;
  changeCount: number;
  diff: DiffRow[];
  approversPool: BaselineApprover[];
  onSubmitChangeRequest: (approvers: BaselineApprover[]) => void;
  children: ReactNode;
};

export function BaselineShell(props: BaselineShellProps) {
  const {
    tabKey, title, versions, activeVersion, onChangeVersion,
    editMode, onEnterEdit, onCancelEdit, hasDraftChanges,
    changeCount, diff, approversPool, onSubmitChangeRequest, children,
  } = props;

  const isViewingCurrent = activeVersion === "latest";
  const isEditing = editMode === "editing" && isViewingCurrent;
  const locked = !isEditing;

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [crDialogOpen, setCrDialogOpen] = useState(false);
  const [selectedApprovers, setSelectedApprovers] = useState<BaselineApprover[]>([]);

  useEffect(() => {
    if (crDialogOpen) setSelectedApprovers(approversPool.slice(0, Math.min(2, approversPool.length)));
  }, [crDialogOpen, approversPool]);

  function requestCancel() {
    if (hasDraftChanges) setConfirmCancelOpen(true);
    else onCancelEdit();
  }

  function openCr() {
    if (changeCount === 0) {
      toast.info("No changes to submit yet.");
      return;
    }
    setCrDialogOpen(true);
  }

  function submitCr() {
    if (selectedApprovers.length === 0) {
      toast.error("Select at least one approver");
      return;
    }
    onSubmitChangeRequest(selectedApprovers);
    setCrDialogOpen(false);
    toast.success("Change request submitted for approval", {
      description: `${changeCount} change${changeCount > 1 ? "s" : ""} · ${selectedApprovers.length} approver${selectedApprovers.length > 1 ? "s" : ""}`,
    });
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tgt = e.target as HTMLElement | null;
      const inField = tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable);
      if (e.key === "Escape" && isEditing) {
        e.preventDefault();
        requestCancel();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" && isEditing) {
        e.preventDefault();
        openCr();
      } else if (e.key.toLowerCase() === "e" && !isEditing && isViewingCurrent && !inField) {
        e.preventDefault();
        onEnterEdit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, isViewingCurrent, hasDraftChanges, changeCount]);

  const currentVersionNumber = versions.length ? versions[versions.length - 1].version : 1;
  const currentMeta = versions[versions.length - 1];

  return (
    <BaselineContext.Provider value={{ locked, tabKey, historical: !isViewingCurrent }}>
      <div className="space-y-4">
        {/* Header bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-2 text-sm font-medium text-foreground">{title}</div>

          <Select value={activeVersion} onValueChange={onChangeVersion} disabled={isEditing}>
            <SelectTrigger className="h-8 w-64 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">
                <div className="flex flex-col leading-tight">
                  <span>Current Version (v{currentVersionNumber}) ⭐</span>
                  <span className="text-[10px] text-muted-foreground">
                    {currentMeta ? `${currentMeta.createdAt} · by ${currentMeta.author}` : ""}
                  </span>
                </div>
              </SelectItem>
              {versions.slice(0, -1).map((v) => (
                <SelectItem key={v.version} value={`v${v.version}`}>
                  <div className="flex flex-col leading-tight">
                    <span>v{v.version}</span>
                    <span className="text-[10px] text-muted-foreground">{v.createdAt} · by {v.author}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!isViewingCurrent && (
            <Badge variant="outline" className="text-xs text-muted-foreground">📖 View Only</Badge>
          )}

          <div className="ml-auto flex items-center gap-2">
            {isEditing ? (
              <>
                <Badge className="bg-rag-amber/15 text-rag-amber border border-rag-amber/40 text-[10px]">
                  {changeCount} change{changeCount === 1 ? "" : "s"}
                </Badge>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={requestCancel}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={openCr}
                  disabled={changeCount === 0}
                >
                  Send Change Request
                </Button>
              </>
            ) : (
              isViewingCurrent && (
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onEnterEdit}>
                  Change Plan
                </Button>
              )
            )}
          </div>
        </div>

        {/* Editing banner */}
        {isEditing && (
          <div className="flex items-start gap-3 rounded-lg border border-rag-amber/40 bg-rag-amber/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rag-amber" />
            <div className="flex-1 text-xs">
              <div className="font-medium text-rag-amber">You're editing {title.toLowerCase()}</div>
              <div className="mt-0.5 text-muted-foreground">
                Locked fields are now editable. Changes will be reviewed as a Change Request.
                <span className="ml-2 opacity-70">Shortcuts: Esc = cancel · ⌘/Ctrl+S = submit</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab body */}
        <div>{children}</div>
      </div>

      {/* Discard confirmation */}
      <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard {changeCount} unsaved change{changeCount === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Your edits to the {title.toLowerCase()} will be lost. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onCancelEdit(); setConfirmCancelOpen(false); }}
              className="bg-rag-red text-white hover:bg-rag-red/90"
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Request dialog */}
      <Dialog open={crDialogOpen} onOpenChange={setCrDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Change Request — {title}</DialogTitle>
            <DialogDescription>
              Summary of changes and approvers. Once submitted, the new version becomes v{currentVersionNumber + 1} after approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <div className="label-eyebrow mb-1.5">Summary of changes ({changeCount})</div>
              <GroupedDiff rows={diff} />
            </div>

            <div>
              <div className="label-eyebrow mb-1.5">Select approvers</div>
              <div className="rounded-md border border-border/60 divide-y divide-border/40 max-h-[180px] overflow-y-auto">
                {approversPool.map((a) => {
                  const checked = selectedApprovers.some((x) => x.id === a.id);
                  return (
                    <label key={a.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-secondary/30">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          setSelectedApprovers((prev) => v ? [...prev, a] : prev.filter((x) => x.id !== a.id));
                        }}
                      />
                      <div className="flex-1">
                        <div className="text-sm text-foreground">{a.name}</div>
                        <div className="text-[11px] text-muted-foreground">{a.role}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCrDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={submitCr}
              disabled={changeCount === 0 || selectedApprovers.length === 0}
            >
              Submit change request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaselineContext.Provider>
  );
}
