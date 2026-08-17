import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Check, X, Pencil, Trash2 } from "@/lib/icons";
import { useSkills } from "@/lib/projects-store";
import { toast } from "@/lib/toast";

/** Manage the organization-wide skills lookup used by Job Roles. */
export function ManageSkillsDialog() {
  const { skillsCatalog, addSkill, updateSkill, removeSkill } = useSkills();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<{ original: string; value: string } | null>(null);

  function add() {
    const s = draft.trim();
    if (!s) { toast.error("Skill name is required"); return; }
    if (skillsCatalog.some((x) => x.toLowerCase() === s.toLowerCase())) { toast.error(`"${s}" already exists`); return; }
    addSkill(s);
    setDraft("");
    toast.success(`Skill "${s}" added`);
  }

  function saveEdit() {
    if (!editing) return;
    const v = editing.value.trim();
    if (!v) { toast.error("Skill name is required"); return; }
    updateSkill(editing.original, v);
    setEditing(null);
    toast.success("Skill updated");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="mr-1 h-4 w-4" />Add Skills</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skills Lookup</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            placeholder="e.g. Kubernetes"
          />
          <Button variant="primary" onClick={add}>Add</Button>
        </div>
        <ScrollArea className="mt-2 h-72 rounded-md border border-border">
          <div className="divide-y divide-border">
            {skillsCatalog.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">No skills yet</p>
            )}
            {skillsCatalog.map((s) => (
              <div key={s} className="flex items-center gap-2 px-3 py-2">
                {editing?.original === s ? (
                  <>
                    <Input
                      value={editing.value}
                      onChange={(e) => setEditing({ original: s, value: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveEdit(); } }}
                      className="h-8 flex-1"
                    />
                    <button type="button" aria-label="Save" onClick={saveEdit} className="text-accent hover:opacity-80"><Check className="h-4 w-4" /></button>
                    <button type="button" aria-label="Cancel" onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 truncate text-sm text-foreground">{s}</span>
                    <button type="button" aria-label={`Edit ${s}`} onClick={() => setEditing({ original: s, value: s })} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                    <button
                      type="button"
                      aria-label={`Delete ${s}`}
                      onClick={() => { removeSkill(s); toast.success(`Deleted "${s}"`); }}
                      className="text-muted-foreground hover:text-rag-red"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="primary" onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Multi-select skills chooser backed by the organization skills lookup. */
export function SkillsSelect({ value, onChange }: { value: string[]; onChange: (skills: string[]) => void }) {
  const { skillsCatalog } = useSkills();
  const toggle = (s: string) => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  return (
    <ScrollArea className="h-40 rounded-md border border-input">
      <div className="space-y-1 p-2">
        {skillsCatalog.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">No skills in the lookup yet — add some with “Add Skills”.</p>
        )}
        {skillsCatalog.map((s) => {
          const on = value.includes(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(s)}
              className="flex w-full items-center gap-3 rounded-md px-1 py-1.5 text-left text-sm text-foreground hover:bg-secondary/40"
            >
              <Checkbox checked={on} className="pointer-events-none" />
              <span className="truncate">{s}</span>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
