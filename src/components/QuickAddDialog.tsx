import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "@/lib/icons";

export type QuickAddField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select";
  placeholder?: string;
  /** Required when type is "select". */
  options?: { value: string; label: string }[];
  defaultValue?: string;
};

/**
 * DS02 "quick add" popup: a small Name/Description-shaped create form behind a
 * primary trigger button. Covers the simple master-data dialogs (Project Type,
 * Department, Risk Category, Skill, Cost Category, ...) that only differ in
 * copy and field list — richer forms (multi-select, per-field validation,
 * date/amount fields) should stay bespoke rather than strain-fit this shape.
 */
export function QuickAddDialog({
  triggerLabel,
  title,
  description,
  fields,
  submitLabel = "Save",
  onSave,
}: {
  triggerLabel: string;
  title: string;
  description?: string;
  fields: QuickAddField[];
  submitLabel?: string;
  /** Return `false` to keep the dialog open (e.g. validation failed) — anything else resets the form and closes it. */
  onSave: (values: Record<string, string>) => boolean | void;
}) {
  const initial = () => Object.fromEntries(fields.map((f) => [f.key, f.defaultValue ?? ""]));
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(initial);

  function handleOpenChange(o: boolean) {
    setOpen(o);
    if (!o) setValues(initial());
  }

  function handleSave() {
    const result = onSave(values);
    if (result === false) return;
    setValues(initial());
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="primary">
          <Plus className="mr-1 h-4 w-4" />{triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                />
              ) : f.type === "select" ? (
                <Select value={values[f.key]} onValueChange={(val) => setValues((v) => ({ ...v, [f.key]: val }))}>
                  <SelectTrigger><SelectValue placeholder={f.placeholder ?? "Select..."} /></SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default QuickAddDialog;
