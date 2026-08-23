import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { PageToolbar, EmptyRow } from "@/components/ds/PageToolbar";
import { useRelatedProjectsDialog } from "@/components/ds/RelatedProjectsDialog";
import { relatedProjectsGroup, statusGroup, matchRelated, matchStatus } from "@/components/ds/filters";
import { TableRowActions } from "@/components/TableRowActions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useOrgActive } from "@/lib/org-active";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/lib/toast";
import { Plus, Search, Star, Building2, ChevronRight, FileText, Mail, Phone, X } from "@/lib/icons";
import { clients, vendors, projects, contracts } from "@/lib/mock-data";

export const Route = createFileRoute("/clients-vendors")({
  component: ClientsVendorsPage,
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  head: () => ({ meta: [{ title: "Clients & Vendors — Nexus PMO" }, { name: "description", content: "Manage external parties: clients with active engagements and approved vendor / subcontractor pool." }] }),
});

// ── Supplemental contact data (not in mock-data) ──────────────────────────────
const CLIENT_DETAILS: Record<string, { email: string; phone: string; industry: string }> = {
  "ACME Energy":          { email: "r.hadid@acme-energy.com",         phone: "+971 4 123 4567", industry: "Oil & Gas" },
  "Northwind Logistics":  { email: "k.bauer@northwind-logistics.com",  phone: "+971 2 987 6543", industry: "Logistics" },
  "Helios Solar":         { email: "m.park@helios-solar.com",          phone: "+966 11 456 7890", industry: "Renewables" },
  "Atlas Mining":         { email: "t.okafor@atlas-mining.com",        phone: "+974 4 321 0987", industry: "Mining" },
};

const VENDOR_DETAILS: Record<string, { email: string; phone: string; contact: string }> = {
  "Siemens MENA":       { email: "procurement@siemens-mena.com",   phone: "+971 4 888 0000", contact: "Hans Müller" },
  "Oracle Consulting":  { email: "oracle-consulting@oracle.com",    phone: "+971 4 402 3000", contact: "Leila Nasser" },
  "Bechtel Subcontract":{ email: "contracts@bechtel.com",           phone: "+1 415 768 1234", contact: "James Calloway" },
  "Local Crane Co.":    { email: "ops@localcrane.ae",               phone: "+971 6 744 5500", contact: "Ali Mansoor" },
  "Cyberguard":         { email: "enterprise@cyberguard.io",        phone: "+44 20 7946 0958", contact: "Nadia Volkov" },
};

// ── RAG helpers ───────────────────────────────────────────────────────────────
const RAG_DOT: Record<string, string> = {
  green: "bg-rag-green", amber: "bg-rag-amber", red: "bg-rag-red",
  blue: "bg-rag-blue", grey: "bg-muted-foreground",
};
const RAG_BAR: Record<string, string> = {
  green: "[&>div]:bg-rag-green", amber: "[&>div]:bg-rag-amber", red: "[&>div]:bg-rag-red",
  blue: "[&>div]:bg-rag-blue", grey: "[&>div]:bg-muted-foreground",
};

// ── Page ──────────────────────────────────────────────────────────────────────
function ClientsVendorsPage() {
  const { tab = "clients" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <div>
      <PageHeader
        title="Clients & Vendors"
        current={tab === "vendors" ? "Vendors" : "Clients"}
      />
      {/* Subpages live in the sidebar (?tab=) */}
      <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v } })}>

        {/* ── Clients tab ──────────────────────────────────────────────── */}
        <TabsContent value="clients" className="mt-5">
          <ClientsTab />
        </TabsContent>

        {/* ── Vendors tab ───────────────────────────────────────────────── */}
        <TabsContent value="vendors" className="mt-5">
          <VendorsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Derived client metrics ────────────────────────────────────────────────────
/** Linked projects of a client (single source of truth for counts + revenue). */
function clientProjects(name: string) {
  return projects.filter((p) => p.client === name);
}
/** Recognized revenue = Σ(project budget × % complete) — read-only, never typed in. */
function clientRevenue(name: string) {
  return clientProjects(name).reduce((s, p) => s + p.budgetTotal * (p.progress / 100), 0);
}

// ── Clients tab ───────────────────────────────────────────────────────────────
function ClientsTab() {
  const related$ = useRelatedProjectsDialog();
  const [query, setQuery] = useState("");
  const [related, setRelated] = useState("all");
  const [status, setStatus] = useState("all");
  const { isActive, setActive } = useOrgActive("client");
  const [rows, setRows] = useState(clients);
  const [editing, setEditing] = useState<typeof clients[number] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<{ name: string; active: boolean } | null>(null);

  const q = query.trim().toLowerCase();
  const list = rows
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q))
    .filter((c) => matchRelated(related, clientProjects(c.name).length))
    .filter((c) => matchStatus(status, isActive(c.name)));

  return (
    <>
      <PageToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search client or contact…"
        filterGroups={[relatedProjectsGroup(related, setRelated), statusGroup(status, setStatus)]}
        cta={<ClientFormDialog onSave={(c) => setRows((prev) => [...prev, c])} />}
      />
      <Table>
        <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
          <TableHead>Client</TableHead><TableHead>Primary Contact</TableHead>
          <TableHead className="text-center">Active Projects</TableHead>
          <TableHead className="text-center">Revenue (FY26)</TableHead>
          <TableHead className="w-32 text-center">Status</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {list.length === 0 && <EmptyRow colSpan={5} />}
          {list.map((c) => {
            const linkedCount = clientProjects(c.name).length;
            return (
              <TableRow
                key={c.name}
                onClick={() => related$.openFor({ label: c.name, projects: clientProjects(c.name).map((p) => ({ id: p.id, name: p.name })) })}
                className={cn("cursor-pointer bg-table-row-bg hover:bg-table-row-hover border-0", !isActive(c.name) && "opacity-60")}
              >
                <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.contact}</TableCell>
                <TableCell className="text-center num-mono">{linkedCount}</TableCell>
                <TableCell className="text-center num-mono">
                  {linkedCount === 0 ? "—" : `$${clientRevenue(c.name).toFixed(1)}M`}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <TableRowActions
                    onEdit={() => setEditing(c)}
                    isActive={isActive(c.name)}
                    onToggleActive={() => setPendingToggle({ name: c.name, active: isActive(c.name) })}
                    onDelete={() => setPendingDelete(c.name)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {related$.dialog}


      {editing && (
        <ClientFormDialog
          client={editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
          onSave={(c) => setRows((prev) => prev.map((r) => (r.name === editing.name ? c : r)))}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={`Delete "${pendingDelete ?? ""}"?`}
        description="The client record is removed. Linked projects stay untouched."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          setRows((prev) => prev.filter((r) => r.name !== pendingDelete));
          toast.success(`Deleted "${pendingDelete}"`);
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        open={!!pendingToggle}
        onOpenChange={(o) => !o && setPendingToggle(null)}
        title={pendingToggle?.active ? `Deactivate "${pendingToggle.name}"?` : `Reactivate "${pendingToggle?.name ?? ""}"?`}
        description={pendingToggle?.active
          ? "Deactivated clients stay on record but can't be linked to new projects."
          : "The client becomes available for new projects again."}
        confirmLabel={pendingToggle?.active ? "Deactivate" : "Reactivate"}
        tone={pendingToggle?.active ? "warning" : "success"}
        onConfirm={() => {
          if (!pendingToggle) return;
          setActive(pendingToggle.name, !pendingToggle.active);
          toast.success(`${pendingToggle.name} ${pendingToggle.active ? "deactivated" : "reactivated"}`);
          setPendingToggle(null);
        }}
      />
    </>
  );
}


// ── Vendors tab ───────────────────────────────────────────────────────────────
function VendorsTab() {
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");
  const [related, setRelated] = useState("all");
  const [status, setStatus] = useState("all");
  const [vendorView, setVendorView] = useState<typeof vendors[number] | null>(null);
  const { isActive, setActive } = useOrgActive("vendor");
  const [rows, setRows] = useState(vendors);
  const [editing, setEditing] = useState<typeof vendors[number] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<{ name: string; active: boolean } | null>(null);
  const q = query.trim().toLowerCase();
  const list = rows
    .filter((v) => !q || v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q))
    .filter((v) => type === "all" || v.type === type)
    .filter((v) => matchRelated(related, v.contracts))
    .filter((v) => matchStatus(status, isActive(v.name)));

  return (
    <>
      <PageToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search vendor or category…"
        filterGroups={[
          { key: "related", label: "Related Contracts", value: related, onChange: setRelated, options: [{ value: "all", label: "All records" }, { value: "with", label: "With Contracts" }, { value: "without", label: "No Contracts" }] },
          { key: "type", label: "Types", value: type, onChange: setType, options: [{ value: "all", label: "All types" }, { value: "Vendor", label: "Vendor" }, { value: "Subcontractor", label: "Subcontractor" }] },
          statusGroup(status, setStatus),
        ]}
        cta={<VendorFormDialog onSave={(v) => setRows((prev) => [...prev, v])} />}
      />
      <div className="">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
            <TableHead>Vendor</TableHead><TableHead>Type</TableHead><TableHead>Category</TableHead>
            <TableHead className="text-center">Contracts</TableHead><TableHead className="text-center">Total Spend</TableHead>
            <TableHead>Evaluation</TableHead><TableHead className="w-32 text-center">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {list.length === 0 && <EmptyRow colSpan={7} />}
            {list.map((v) => (
              <TableRow
                key={v.name}
                onClick={() => setVendorView(v)}
                className={cn("cursor-pointer bg-table-row-bg hover:bg-table-row-hover border-0", !isActive(v.name) && "opacity-60")}
              >
                <TableCell className="font-medium text-foreground">{v.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`rounded-full ${v.type === "Vendor" ? "border-rag-blue/40 bg-rag-blue/10 text-rag-blue" : "border-role-exec/40 bg-role-exec/10 text-role-exec"}`}>
                    {v.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{v.category}</TableCell>
                <TableCell className="text-center num-mono">{v.contracts}</TableCell>
                <TableCell className="text-center num-mono">${v.spend.toFixed(1)}M</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3 fill-rag-amber text-rag-amber" />
                    <span className="num-mono">{v.eval.toFixed(1)}</span>
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <TableRowActions
                    onEdit={() => setEditing(v)}
                    isActive={isActive(v.name)}
                    onToggleActive={() => setPendingToggle({ name: v.name, active: isActive(v.name) })}
                    onDelete={() => setPendingDelete(v.name)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Vendor detail sheet */}
      <VendorSheet vendor={vendorView} onClose={() => setVendorView(null)} />

      {editing && (
        <VendorFormDialog
          vendor={editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
          onSave={(v) => setRows((prev) => prev.map((r) => (r.name === editing.name ? v : r)))}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={`Remove "${pendingDelete ?? ""}" from the pool?`}
        description="Existing contracts stay on record."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          setRows((prev) => prev.filter((r) => r.name !== pendingDelete));
          toast.success(`Deleted "${pendingDelete}"`);
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        open={!!pendingToggle}
        onOpenChange={(o) => !o && setPendingToggle(null)}
        title={pendingToggle?.active ? `Deactivate "${pendingToggle.name}"?` : `Reactivate "${pendingToggle?.name ?? ""}"?`}
        description={pendingToggle?.active
          ? "Deactivated vendors stay on record but can't be added to new contracts."
          : "The vendor becomes available for new contracts again."}
        confirmLabel={pendingToggle?.active ? "Deactivate" : "Reactivate"}
        tone={pendingToggle?.active ? "warning" : "success"}
        onConfirm={() => {
          if (!pendingToggle) return;
          setActive(pendingToggle.name, !pendingToggle.active);
          toast.success(`${pendingToggle.name} ${pendingToggle.active ? "deactivated" : "reactivated"}`);
          setPendingToggle(null);
        }}
      />
    </>
  );
}


// ── Vendor detail sheet ───────────────────────────────────────────────────────
function VendorSheet({ vendor, onClose }: { vendor: typeof vendors[number] | null; onClose: () => void }) {
  const [extraContractIds, setExtraContractIds] = useState<string[]>([]);
  const [connectOpen, setConnectOpen]           = useState(false);
  const [connectSel, setConnectSel]             = useState<string[]>([]);

  if (!vendor) return null;

  const detail      = VENDOR_DETAILS[vendor.name];
  const baseLinked  = contracts.filter((c) => c.vendor === vendor.name);
  const extraLinked = extraContractIds.map((id) => contracts.find((c) => c.id === id)).filter(Boolean) as typeof contracts;
  const linked      = [...baseLinked, ...extraLinked];
  const linkedIds   = new Set(linked.map((c) => c.id));
  const available   = contracts.filter((c) => !linkedIds.has(c.id));

  const scores = {
    Delivery:   +(vendor.eval * 0.95).toFixed(1),
    Quality:    +(vendor.eval * 1.03).toFixed(1),
    Commercial: +(vendor.eval * 0.97).toFixed(1),
    Support:    +(vendor.eval * 0.99).toFixed(1),
  };

  function toggleConnect(id: string) {
    setConnectSel((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleConnect() {
    if (connectSel.length === 0) { toast.error("Select at least one contract"); return; }
    setExtraContractIds((prev) => [...prev, ...connectSel.filter((id) => !prev.includes(id))]);
    toast.success(`${connectSel.length} contract${connectSel.length !== 1 ? "s" : ""} linked to ${vendor?.name ?? ""}`);
    setConnectOpen(false); setConnectSel([]);
  }

  return (
    <Sheet open={!!vendor} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-[480px] max-w-full p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg">{vendor.name}</SheetTitle>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={vendor.type === "Vendor" ? "border-rag-blue/40 bg-rag-blue/10 text-rag-blue text-[10px]" : "border-role-exec/40 bg-role-exec/10 text-role-exec text-[10px]"}>{vendor.type}</Badge>
                <Badge variant="outline" className="border-border bg-secondary/40 text-muted-foreground text-[10px]">{vendor.category}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(vendor.eval) ? "fill-rag-amber text-rag-amber" : "text-border"}`} />
              ))}
              <span className="ml-1 num-mono text-sm font-medium text-foreground">{vendor.eval.toFixed(1)}</span>
            </div>
          </div>
          {detail && (
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">{detail.contact}</span>
                <span className="text-muted-foreground/50">·</span>
                <a href={`mailto:${detail.email}`} className="hover:text-accent">{detail.email}</a>
              </div>
              <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{detail.phone}</div>
            </div>
          )}
        </SheetHeader>

        {/* KPI strip */}
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          {[
            { l: "Active contracts", v: String(linked.length || vendor.contracts) },
            { l: "Total spend",      v: `$${vendor.spend.toFixed(1)}M` },
            { l: "Eval score",       v: `${vendor.eval.toFixed(1)} / 5.0` },
          ].map((k) => (
            <div key={k.l} className="px-4 py-3">
              <div className="label-eyebrow text-[10px]">{k.l}</div>
              <div className="mt-0.5 text-sm font-medium text-foreground num-mono">{k.v}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Contracts */}
          <div>
            <div className="label-eyebrow mb-3">Contracts</div>
            {linked.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
                <FileText className="h-7 w-7 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No contracts on record for this vendor.</p>
                <button className="mt-1 text-xs text-accent hover:underline" onClick={() => setConnectOpen(true)}>+ Connect existing contract</button>
              </div>
            ) : (
              <div className="space-y-2">
                {linked.map((c) => (
                  <div key={c.id} className="glass-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="num-mono text-xs text-muted-foreground">{c.id}</span>
                          <Badge variant="outline" className={c.status === "Active" ? "border-rag-green/40 bg-rag-green/10 text-rag-green text-[10px]" : "border-rag-amber/40 bg-rag-amber/10 text-rag-amber text-[10px]"}>{c.status}</Badge>
                        </div>
                        <div className="mt-1 text-sm font-medium text-foreground">{c.project}</div>
                        <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                          <span className="num-mono text-accent font-medium">${c.value}M</span>
                          <span>Ends {c.end}</span>
                        </div>
                      </div>
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground">
                        Open <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Evaluation scorecard */}
          <div>
            <div className="label-eyebrow mb-3">Evaluation Scorecard</div>
            <div className="space-y-3">
              {Object.entries(scores).map(([label, score]) => {
                const pct = (score / 5) * 100;
                const color = score >= 4.5 ? "bg-rag-green" : score >= 3.5 ? "bg-rag-amber" : "bg-rag-red";
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-24 shrink-0 text-xs text-muted-foreground">{label}</div>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary/50">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="num-mono text-xs w-8 text-right text-foreground">{score}</span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3 w-3 ${s <= Math.round(score) ? "fill-rag-amber text-rag-amber" : "text-border"}`} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Last reviewed: Q1 2026 · Next review: Q3 2026</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 space-y-2">
          <Button variant="outline" className="w-full border-accent/40 text-accent hover:bg-accent-dim" onClick={() => setConnectOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />Connect existing contract
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </SheetContent>

      {/* Connect contracts dialog */}
      <Dialog open={connectOpen} onOpenChange={(o) => { if (!o) { setConnectOpen(false); setConnectSel([]); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Link contracts to {vendor.name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <div className="rounded-md border border-border">
              <div className="px-2 py-1.5 space-y-0.5">
                {available.map((c) => {
                  const checked = connectSel.includes(c.id);
                  return (
                    <label key={c.id} className={`flex cursor-pointer items-center gap-2.5 rounded px-2 py-2 ${checked ? "bg-accent-dim/30" : "hover:bg-secondary/40"}`}>
                      <Checkbox checked={checked} onCheckedChange={() => toggleConnect(c.id)} className="shrink-0" />
                      <span className="num-mono text-[11px] text-muted-foreground shrink-0">{c.id}</span>
                      <span className="flex-1 truncate text-sm text-foreground">{c.project}</span>
                      <span className="num-mono text-xs text-accent shrink-0">${c.value}M</span>
                      <Badge variant="outline" className={`shrink-0 text-[10px] py-0 ${c.status === "Active" ? "border-rag-green/40 bg-rag-green/10 text-rag-green" : "border-rag-amber/40 bg-rag-amber/10 text-rag-amber"}`}>{c.status}</Badge>
                    </label>
                  );
                })}
                {available.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">All contracts are already linked.</p>
                )}
              </div>
            </div>
            {connectSel.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {connectSel.map((id) => {
                  const c = contracts.find((x) => x.id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/20 px-2 py-0.5 text-[11px] text-accent">
                      <span className="num-mono">{c?.id}</span>
                      <span className="text-muted-foreground">·</span>
                      {c?.project}
                      <button onClick={() => toggleConnect(id)} className="ml-0.5 hover:text-rag-red"><X className="h-3 w-3" /></button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConnectOpen(false); setConnectSel([]); }}>Cancel</Button>
            <Button variant="primary" onClick={handleConnect}>
              Link {connectSel.length > 0 ? `${connectSel.length} contract${connectSel.length !== 1 ? "s" : ""}` : "selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}

// ── Add / edit client dialog ──────────────────────────────────────────────────
type ClientRecord = typeof clients[number];

function ClientFormDialog({
  client,
  open: openProp,
  onOpenChange,
  onSave,
}: {
  client?: ClientRecord;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  onSave?: (c: ClientRecord) => void;
}) {
  const isEdit = !!client;
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (o: boolean) => { onOpenChange?.(o); if (openProp === undefined) setOpenState(o); };

  const [name, setName]       = useState(client?.name ?? "");
  const [contact, setContact] = useState(client?.contact ?? "");
  const [email, setEmail]     = useState(client ? CLIENT_DETAILS[client.name]?.email ?? "" : "");
  const [phone, setPhone]     = useState(client ? CLIENT_DETAILS[client.name]?.phone ?? "" : "");

  function handleSave() {
    if (!name.trim()) { toast.error("Company name is required"); return; }
    onSave?.({
      name: name.trim(),
      contact: contact.trim() || "—",
      projects: client?.projects ?? 0,
      revenue: client?.revenue ?? 0,
      status: client?.status ?? "Active",
    });
    toast.success(`${name.trim()} ${isEdit ? "updated" : "added"}`);
    setOpen(false);
    if (!isEdit) {
      setName(""); setContact(""); setEmail(""); setPhone("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button size="sm" variant="primary">
            <Plus className="mr-1 h-4 w-4" />Add Client
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Client" : "New Client"}</DialogTitle></DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Company name <span className="text-rag-red">*</span></Label>
            <Input placeholder="ACME Energy" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Primary contact</Label>
            <Input placeholder="Full name" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input placeholder="contact@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>



        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>
            {isEdit ? "Save changes" : <><Plus className="mr-1 h-3.5 w-3.5" />Add Client</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// ── Add / edit vendor dialog ──────────────────────────────────────────────────
type VendorRecord = typeof vendors[number];

function VendorFormDialog({
  vendor,
  open: openProp,
  onOpenChange,
  onSave,
}: {
  vendor?: VendorRecord;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  onSave?: (v: VendorRecord) => void;
}) {
  const isEdit = !!vendor;
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (o: boolean) => { onOpenChange?.(o); if (openProp === undefined) setOpenState(o); };

  const [name, setName]         = useState(vendor?.name ?? "");
  const [type, setType]         = useState(vendor?.type === "Subcontractor" ? "sub" : "vendor");
  const [category, setCategory] = useState(vendor?.category ?? "");
  const [notes, setNotes]       = useState("");

  function handleSave() {
    if (!name.trim()) { toast.error("Company name is required"); return; }
    onSave?.({
      name: name.trim(),
      type: type === "sub" ? "Subcontractor" : "Vendor",
      category: category.trim() || "—",
      contracts: vendor?.contracts ?? 0,
      spend: vendor?.spend ?? 0,
      eval: vendor?.eval ?? 0,
    });
    toast.success(`${name.trim()} ${isEdit ? "updated" : "added to vendor pool"}`);
    setOpen(false);
    if (!isEdit) { setName(""); setType("vendor"); setCategory(""); setNotes(""); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button size="sm" variant="primary">
            <Plus className="mr-1 h-4 w-4" />Add Vendor
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Vendor / Subcontractor" : "New Vendor / Subcontractor"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Company name <span className="text-rag-red">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="sub">Subcontractor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Input placeholder="Hardware / Software / EPC…" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Approval notes</Label>
            <Input placeholder="Pre-qualification reference" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>
            {isEdit ? "Save changes" : <><Plus className="mr-1 h-3.5 w-3.5" />Add to pool</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

