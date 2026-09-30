import { useMemo, useState } from "react";
import { Plus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FINANCIAL_CATALOG, findFinancialItem, type FinancialItem } from "@/lib/finance-links";

type Props = {
  costIds: string[];
  revenueIds: string[];
  onChange: (next: { cost: string[]; revenue: string[] }) => void;
  /** ids already attached to another WBS item anywhere in the system */
  linkedElsewhere: Set<string>;
  hint?: string;
  readOnly?: boolean;
};

function parseAmount(a: string) {
  const n = Number(a.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function fmtTotal(ids: string[]) {
  const sum = ids.reduce((acc, id) => acc + parseAmount(findFinancialItem(id)?.amount ?? ""), 0);
  return `$${sum.toFixed(2)}M`;
}

function Chip({ id, onRemove }: { id: string; onRemove?: () => void }) {
  const item = findFinancialItem(id);
  if (!item) return null;
  return (
    <span className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-md bg-muted px-2 text-xs text-foreground">
      <span className="truncate">{item.label}</span>
      <span className="num-mono shrink-0 text-muted-foreground">{item.amount}</span>
      {onRemove && (
        <button
          type="button"
          aria-label={`Unlink ${item.label}`}
          onClick={onRemove}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

export function FinancialLinkField({ costIds, revenueIds, onChange, linkedElsewhere, hint, readOnly = false }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"cost" | "revenue">("cost");
  const [query, setQuery] = useState("");
  const [draftCost, setDraftCost] = useState<string[]>(costIds);
  const [draftRevenue, setDraftRevenue] = useState<string[]>(revenueIds);

  function openPicker(which: "cost" | "revenue") {
    setDraftCost(costIds);
    setDraftRevenue(revenueIds);
    setTab(which);
    setQuery("");
    setOpen(true);
  }

  const list = (kind: "cost" | "revenue"): FinancialItem[] => {
    const selected = kind === "cost" ? draftCost : draftRevenue;
    return FINANCIAL_CATALOG[kind].filter(
      (i) =>
        (selected.includes(i.id) || !linkedElsewhere.has(i.id)) &&
        i.label.toLowerCase().includes(query.trim().toLowerCase()),
    );
  };

  const toggle = (kind: "cost" | "revenue", id: string) => {
    const setter = kind === "cost" ? setDraftCost : setDraftRevenue;
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const draftCount = draftCost.length + draftRevenue.length;
  const totalCount = costIds.length + revenueIds.length;

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (costIds.length) parts.push(`${costIds.length} cost · ${fmtTotal(costIds)}`);
    if (revenueIds.length) parts.push(`${revenueIds.length} revenue · ${fmtTotal(revenueIds)}`);
    return parts.join("   ·   ");
  }, [costIds, revenueIds]);

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Label className="text-sm">Financial Link</Label>
          <p className="text-xs text-muted-foreground">
            {totalCount > 0 ? summary : "Nothing linked yet — amounts come from the Financials tab."}
          </p>
        </div>
        {!readOnly && (
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => openPicker("cost")}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            {totalCount > 0 ? "Manage" : "Link items"}
          </Button>
        )}
      </div>

      {totalCount > 0 && (
        <div className="mt-3 max-h-48 space-y-3 overflow-y-auto">
          {costIds.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-rag-amber">Cost · {costIds.length}</p>
              <div className="flex flex-wrap gap-1.5">
                {costIds.map((id) => (
                  <Chip key={id} id={id} onRemove={readOnly ? undefined : () => onChange({ cost: costIds.filter((x) => x !== id), revenue: revenueIds })} />
                ))}
              </div>
            </div>
          )}
          {revenueIds.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-rag-green">Revenue · {revenueIds.length}</p>
              <div className="flex flex-wrap gap-1.5">
                {revenueIds.map((id) => (
                  <Chip key={id} id={id} onRemove={readOnly ? undefined : () => onChange({ cost: costIds, revenue: revenueIds.filter((x) => x !== id) })} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {hint && <p className="mt-2 text-[10px] text-muted-foreground">{hint}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Link financial items</DialogTitle>
            <DialogDescription>
              Pick as many cost and revenue items as needed. Items already linked elsewhere are hidden.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "cost" | "revenue")}>
            <TabsList className="w-full">
              <TabsTrigger value="cost" className="flex-1">Cost ({draftCost.length})</TabsTrigger>
              <TabsTrigger value="revenue" className="flex-1">Revenue ({draftRevenue.length})</TabsTrigger>
            </TabsList>

            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search items…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {(["cost", "revenue"] as const).map((kind) => (
              <TabsContent key={kind} value={kind} className="mt-3">
                <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                  {list(kind).length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">No available items.</p>
                  )}
                  {list(kind).map((i) => {
                    const selected = (kind === "cost" ? draftCost : draftRevenue).includes(i.id);
                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => toggle(kind, i.id)}
                        className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
                          selected ? "bg-muted" : "hover:bg-muted/60"
                        }`}
                      >
                        <Checkbox checked={selected} className="pointer-events-none" />
                        <span className="min-w-0 flex-1 truncate text-sm">{i.label}</span>
                        <span className="num-mono shrink-0 text-xs text-muted-foreground">{i.amount}</span>
                      </button>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <DialogFooter className="items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">{draftCount} item(s) selected</span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  onChange({ cost: draftCost, revenue: draftRevenue });
                  setOpen(false);
                }}
              >
                Done
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
