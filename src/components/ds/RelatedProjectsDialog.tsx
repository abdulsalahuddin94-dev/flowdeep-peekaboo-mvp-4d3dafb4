import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type RelatedItem = { id: string; name: string };
export type RelatedTab = { key: string; label: string; items: RelatedItem[]; empty?: string };

/**
 * DS02 standard "Related Projects" popup — used everywhere a record exposes an
 * Active / Connected Projects count. Optional extra tabs (e.g. Job Roles) share
 * the same list shell so every module looks identical.
 */
export function RelatedProjectsDialog({
  open,
  onOpenChange,
  label,
  projects,
  extraTabs = [],
  caption = "Related Projects",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  label: string;
  projects: RelatedItem[];
  extraTabs?: RelatedTab[];
  caption?: string;
}) {
  const tabs: RelatedTab[] = [
    { key: "projects", label: "Projects", items: projects, empty: "No active projects" },
    ...extraTabs,
  ];
  const [tab, setTab] = useState(tabs[0].key);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-semibold">{label}</span>
            <span className="text-sm font-normal text-muted-foreground">({caption})</span>
          </DialogTitle>
        </DialogHeader>

        {extraTabs.length > 0 ? (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-3">
              {tabs.map((t) => (
                <TabsTrigger key={t.key} value={t.key}>
                  {t.label}
                  <span className="ml-1.5 text-[11px] text-muted-foreground">{t.items.length}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((t) => (
              <TabsContent key={t.key} value={t.key}>
                <ItemList items={t.items} empty={t.empty} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <ItemList items={projects} empty="No active projects" />
        )}

        <DialogFooter>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemList({ items, empty = "Nothing connected yet" }: { items: RelatedItem[]; empty?: string }) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ScrollArea className="max-h-72">
      <div className="space-y-1 pr-2">
        {items.map((it) => (
          <div key={`${it.name}-${it.id}`} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-secondary/40">
            <span className="truncate text-foreground">{it.name}</span>
            {it.id && <span className="ml-3 shrink-0 text-xs text-muted-foreground">{it.id}</span>}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

/**
 * Clickable count cell that opens the standard popup. Drop-in for any
 * "Active Projects" / "Connected Projects" table cell.
 */
export function RelatedProjectsCount({
  label,
  projects,
  extraTabs,
  count,
  caption,
  className,
}: {
  label: string;
  projects: RelatedItem[];
  extraTabs?: RelatedTab[];
  count?: number;
  caption?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const n = count ?? projects.length;
  return (
    <>
      <button
        type="button"
        disabled={n === 0 && !extraTabs?.length}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={cn(
          "num-mono rounded-md px-2 py-0.5 text-sm text-foreground transition hover:bg-secondary/50 hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline disabled:hover:bg-transparent",
          className,
        )}
      >
        {n}
      </button>
      <RelatedProjectsDialog open={open} onOpenChange={setOpen} label={label} projects={projects} extraTabs={extraTabs} caption={caption} />
    </>
  );
}

type RelatedPayload = { label: string; projects: RelatedItem[]; extraTabs?: RelatedTab[]; caption?: string };

/**
 * Row-level trigger: tables call openFor(...) from the whole row's onClick and
 * render the returned dialog once. Keeps one popup instance per table.
 */
export function useRelatedProjectsDialog() {
  const [payload, setPayload] = useState<RelatedPayload | null>(null);
  return {
    openFor: (p: RelatedPayload) => setPayload(p),
    dialog: (
      <RelatedProjectsDialog
        open={!!payload}
        onOpenChange={(o) => !o && setPayload(null)}
        label={payload?.label ?? ""}
        projects={payload?.projects ?? []}
        extraTabs={payload?.extraTabs}
        caption={payload?.caption}
      />
    ),
  };
}
