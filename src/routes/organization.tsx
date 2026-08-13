import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { SkillsTagsInput } from "@/components/SkillsTagsInput";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, CalendarDays, CalendarIcon, PartyPopper, Link2, Lock, Clock, GitBranch, Search, Filter, Check, ChevronRight, ChevronLeft, X } from "@/lib/icons";
import { TableRowActions } from "@/components/TableRowActions";
import { PageToolbar as FilterBar, EmptyRow, type FilterGroup } from "@/components/ds/PageToolbar";
import { Breadcrumbs } from "@/components/ds/PageShell";
import { TablePagination, usePagination } from "@/components/TablePagination";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { businessLines, departments, type WorkCalendar } from "@/lib/mock-data";
import { RulesThresholdsTab } from "@/components/org/RulesThresholds";
import { useTags, useProjects, useCalendars, useJobRoles, useApprovals, useResourceRequests } from "@/lib/projects-store";
import { ApprovalOutcomeBanner } from "@/components/ApprovalOutcome";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

const ORG_TAB_LABELS: Record<string, string> = {
  "business-lines": "Project Types", tags: "Tags & Classifications",
  "cost-categories": "Cost Categories", departments: "Departments",
  "job-roles": "Job Roles", calendars: "Calendars",
  "rules": "Rules & Thresholds",
};

export const Route = createFileRoute("/organization")({
  component: OrganizationPage,
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  head: () => ({ meta: [{ title: "Organization — Nexus PMO" }, { name: "description", content: "Manage business lines, departments and classification tags." }] }),
});

function OrganizationPage() {
  const { tab = "business-lines" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const label = ORG_TAB_LABELS[tab] ?? "Project Types";
  return (
    <div>
      <div className="mb-4"><Breadcrumbs current={label} /></div>
      <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v } })}>
        <TabsContent value="business-lines">
          <BusinessLinesTab />
        </TabsContent>

        <TabsContent value="tags">
          <TagsTab />
        </TabsContent>

        <TabsContent value="cost-categories">
          <CostCategoriesTab />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsTab />
        </TabsContent>

        <TabsContent value="job-roles">
          <JobRolesTab />
        </TabsContent>

        <TabsContent value="calendars">
          <CalendarsTab />
        </TabsContent>

        <TabsContent value="rules">
          <RulesThresholdsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type OrgBusinessLine = { name: string; description: string; projects: number };

function BusinessLinesTab() {
  const [rows, setRows] = useState<OrgBusinessLine[]>(
    businessLines.map((b) => ({ name: b.name, description: b.description ?? "", projects: b.projects ?? 0 })),
  );
  const [editing, setEditing] = useState<{ index: number; name: string; description: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ index: number; name: string } | null>(null);
  const [query, setQuery] = useState("");
  const [usage, setUsage] = useState("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .map((b, index) => ({ ...b, index }))
      .filter((b) => !q || b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
      .filter((b) => usage === "all" || (usage === "active" ? b.projects > 0 : b.projects === 0));
  }, [rows, query, usage]);

  const pager = usePagination(visible);

  return (
    <>
      <FilterBar
        title="Project Types"
        desc="Used across Portfolio filters such as business lines."
        query={query}
        onQueryChange={setQuery}
        placeholder="Search name or description…"
        resultCount={visible.length}
        totalCount={rows.length}
        onReset={() => { setQuery(""); setUsage("all"); }}
        cta={<AddBusinessLineDialog onAdd={(name, description) => setRows((prev) => [...prev, { name, description, projects: 0 }])} />}
        filterGroups={[{ key: "usage", label: "Active Projects", value: usage, onChange: setUsage, options: [{ value: "all", label: "All types" },{ value: "active", label: "With active projects" },{ value: "empty", label: "No projects" },] }]}
      />
      <div className="">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
            <TableHead className="w-56">Name</TableHead>
            <TableHead className="w-72">Description</TableHead>
            <TableHead className="w-36 text-center">Active Projects</TableHead>
            <TableHead className="w-24" />
          </TableRow></TableHeader>
          <TableBody>
            {visible.length === 0 && <EmptyRow colSpan={4} />}
            {pager.pageItems.map((b) => {
              const i = b.index;
              return (
              <TableRow key={`${b.name}-${i}`} className="bg-table-row-bg hover:bg-table-row-hover border-0">
                <TableCell className="whitespace-nowrap font-medium text-foreground">{b.name}</TableCell>
                <TableCell className="w-72 text-muted-foreground">{b.description || "—"}</TableCell>
                <TableCell className="text-center num-mono">{b.projects}</TableCell>
                <TableCell>
                  <RowActions
                    onEdit={() => setEditing({ index: i, name: b.name, description: b.description })}
                    onDelete={() => setPendingDelete({ index: i, name: b.name })}
                  />
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <TablePagination {...pager} itemLabel="project types" />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Project Type</DialogTitle><DialogDescription>Update the name and description of this project type.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing((p) => p ? { ...p, name: e.target.value } : p)} /></div>
            <div><Label>Description</Label><Textarea value={editing?.description ?? ""} onChange={(e) => setEditing((p) => p ? { ...p, description: e.target.value } : p)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              if (!editing) return;
              const name = editing.name.trim();
              if (!name) { toast.error("Name is required"); return; }
              setRows((prev) => prev.map((r, idx) => idx === editing.index ? { ...r, name, description: editing.description.trim() } : r));
              toast.success("Project Type updated");
              setEditing(null);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        label={pendingDelete?.name}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          setRows((prev) => prev.filter((_, idx) => idx !== pendingDelete.index));
          toast.success(`Deleted "${pendingDelete.name}"`);
          setPendingDelete(null);
        }}
      />
    </>
  );
}

type OrgDepartment = { name: string; description: string };

function DepartmentsTab() {
  const { projects } = useProjects();
  const [rows, setRows] = useState<OrgDepartment[]>(departments.map((d) => ({ name: d.name, description: d.description ?? "" })));
  const [editing, setEditing] = useState<{ index: number; name: string; description: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ index: number; name: string } | null>(null);
  const [query, setQuery] = useState("");
  const [usage, setUsage] = useState("all");

  const countFor = (name: string) => projects.filter((p) => p.department === name).length;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .map((d, index) => ({ ...d, index, projects: projects.filter((p) => p.department === d.name).length }))
      .filter((d) => !q || d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q))
      .filter((d) => usage === "all" || (usage === "active" ? d.projects > 0 : d.projects === 0));
  }, [rows, query, usage, projects]);

  const pager = usePagination(visible);

  return (
    <>
      <FilterBar
        title="Departments"
        desc="Org chart units; a project may span multiple."
        query={query}
        onQueryChange={setQuery}
        placeholder="Search name or description…"
        resultCount={visible.length}
        totalCount={rows.length}
        onReset={() => { setQuery(""); setUsage("all"); }}
        cta={<AddDepartmentDialog onAdd={(name, description) => setRows((prev) => [...prev, { name, description }])} />}
        filterGroups={[{ key: "usage", label: "Active Projects", value: usage, onChange: setUsage, options: [{ value: "all", label: "All departments" }, { value: "active", label: "With active projects" }, { value: "empty", label: "No projects" }] }]}
      />
      <div className="">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
            <TableHead className="w-64">Department</TableHead>
            <TableHead className="w-72">Description</TableHead>
            <TableHead className="text-center">Active Projects</TableHead>
            <TableHead className="w-24" />
          </TableRow></TableHeader>
          <TableBody>
            {visible.length === 0 && <EmptyRow colSpan={4} />}
            {pager.pageItems.map((d) => {
              const i = d.index;
              return (
              <TableRow key={`${d.name}-${i}`} className="bg-table-row-bg hover:bg-table-row-hover border-0">
                <TableCell className="whitespace-nowrap font-medium text-foreground">{d.name}</TableCell>
                <TableCell className="text-muted-foreground">{d.description || "—"}</TableCell>
                <TableCell className="text-center num-mono">{d.projects}</TableCell>
                <TableCell>
                  <RowActions
                    onEdit={() => setEditing({ index: i, name: d.name, description: d.description })}
                    onDelete={() => setPendingDelete({ index: i, name: d.name })}
                  />
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <TablePagination {...pager} itemLabel="departments" />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Department</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing((p) => p ? { ...p, name: e.target.value } : p)} /></div>
            <div><Label>Description</Label><Textarea value={editing?.description ?? ""} onChange={(e) => setEditing((p) => p ? { ...p, description: e.target.value } : p)} placeholder="Brief description" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              if (!editing) return;
              const name = editing.name.trim();
              if (!name) { toast.error("Name is required"); return; }
              setRows((prev) => prev.map((r, idx) => idx === editing.index ? { name, description: editing.description.trim() } : r));
              toast.success("Department updated");
              setEditing(null);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        label={pendingDelete?.name}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          setRows((prev) => prev.filter((_, idx) => idx !== pendingDelete.index));
          toast.success(`Deleted "${pendingDelete.name}"`);
          setPendingDelete(null);
        }}
      />
    </>
  );
}

function ConfirmDeleteDialog({ label, onCancel, onConfirm }: { label?: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <ConfirmDialog
      open={!!label}
      onOpenChange={(o) => !o && onCancel()}
      tone="danger"
      title={`Delete "${label}"?`}
      description="This entry will be removed from the organization master data."
      cancelLabel="Cancel"
      confirmLabel="Delete"
      onConfirm={onConfirm}
    />
  );
}

function TagsTab() {
  const { tags, updateTag, removeTag } = useTags();
  const { projects } = useProjects();
  const [editing, setEditing] = useState<{ name: string; color: string; original: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [usage, setUsage] = useState("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tags
      .map((t, index) => ({ ...t, index }))
      .filter((t) => !q || t.name.toLowerCase().includes(q))
      .filter((t) => usage === "all" || (usage === "used" ? (t.usage ?? 0) > 0 : (t.usage ?? 0) === 0));
  }, [tags, query, usage]);
  return (
    <>
      <FilterBar
        title="Tags & Classifications"
        desc="Labels applied to business cases and projects."
        query={query}
        onQueryChange={setQuery}
        placeholder="Search tags…"
        resultCount={visible.length}
        totalCount={tags.length}
        onReset={() => { setQuery(""); setUsage("all"); }}
        cta={<AddTagDialog />}
        filterGroups={[{ key: "usage", label: "Usage", value: usage, onChange: setUsage, options: [{ value: "all", label: "All tags" },{ value: "used", label: "In use" },{ value: "unused", label: "Unused" },] }]}
      />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {visible.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm text-muted-foreground">No matching tags</div>
        )}
        {visible.map((t) => (
          <div key={t.name} className="group glass-card flex items-center justify-between p-4">
            <button
              type="button"
              onClick={() => setViewing(t.name)}
              className="flex flex-1 items-center gap-3 text-left"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: t.color }} aria-hidden />
              <div>
                <div className="font-medium text-foreground group-hover:underline">{t.name}</div>
                <div className="text-xs text-muted-foreground">Used by {t.usage} projects</div>
              </div>
            </button>
            <RowActions
              onEdit={() => setEditing({ name: t.name, color: t.color, original: t.name })}
              onDelete={() => setPendingDelete(t.name)}
            />
          </div>
        ))}
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing}</DialogTitle>
            <DialogDescription>Projects connected to this tag.</DialogDescription>
          </DialogHeader>
          {(() => {
            const connected = projects.filter((p) => p.tags.includes(viewing ?? ""));
            if (connected.length === 0) {
              return <p className="py-6 text-center text-sm text-muted-foreground">Not used by any project yet</p>;
            }
            return (
              <ScrollArea className="max-h-72">
                <div className="space-y-1 pr-2">
                  {connected.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-secondary/40">
                      <span className="truncate text-foreground">{p.name}</span>
                      <span className="ml-3 shrink-0 text-xs text-muted-foreground">{p.id}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Tag</DialogTitle><DialogDescription>Renaming updates the tag on every project already using it.</DialogDescription></DialogHeader>
          <div className="flex items-end gap-3">
            <div className="flex-1"><Label>Tag name</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing((p) => p ? { ...p, name: e.target.value } : p)} /></div>
            <div>
              <Label>Color</Label>
              <ColorPicker value={editing?.color ?? "#51CAAD"} onChange={(color) => setEditing((p) => p ? { ...p, color } : p)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              if (!editing) return;
              const name = editing.name.trim();
              if (!name) { toast.error("Tag name is required"); return; }
              updateTag(editing.original, { name, color: editing.color });
              toast.success("Tag updated");
              setEditing(null);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        label={pendingDelete ?? undefined}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          removeTag(pendingDelete);
          toast.success(`Deleted "${pendingDelete}"`);
          setPendingDelete(null);
        }}
      />
    </>
  );
}

const TAG_COLORS = ["#51CAAD", "#EF4444", "#8B5CF6", "#10B981", "#0EA5E9", "#F97316", "#F59E0B", "#64748B"];

/** Swatch + native color input for tag colors. */
function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label="Tag color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
      />
      <div className="flex gap-1">
        {TAG_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Use ${c}`}
            onClick={() => onChange(c)}
            className={`h-4 w-4 rounded-full ring-offset-1 ring-offset-background ${value.toLowerCase() === c.toLowerCase() ? "ring-2 ring-accent" : ""}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

function RowActions(props: React.ComponentProps<typeof TableRowActions>) {
  return <TableRowActions {...props} />;
}

function FilterSelect({ value, onChange, options, width = "w-40" }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; width?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={width}><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function AddBusinessLineDialog({ onAdd }: { onAdd: (name: string, description: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="primary"><Plus className="mr-1 h-4 w-4" />Add Project Type</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Project Type</DialogTitle><DialogDescription>High-level category used as filter chips in Portfolio.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Renewables" /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            const trimmed = name.trim();
            if (!trimmed) { toast.error("Name is required"); return; }
            onAdd(trimmed, description.trim());
            toast.success("Project Type created");
            setName(""); setDescription(""); setOpen(false);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddDepartmentDialog({ onAdd }: { onAdd: (name: string, description: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="primary"><Plus className="mr-1 h-4 w-4" />Add Department</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Department</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Quality Assurance" /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            const trimmed = name.trim();
            if (!trimmed) { toast.error("Name is required"); return; }
            onAdd(trimmed, description.trim());
            toast.success("Department created");
            setName(""); setDescription(""); setOpen(false);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddTagDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#51CAAD");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const { addTag } = useTags();
  const { projects } = useProjects();

  const filtered = projects.filter((p) =>
    !search.trim() || p.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function reset() {
    setName(""); setSearch(""); setSelected([]); setColor("#51CAAD");
  }

  function save() {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Tag name is required"); return; }
    addTag({ name: trimmed, color }, selected);
    toast.success(
      selected.length
        ? `Tag "${trimmed}" created and assigned to ${selected.length} project${selected.length === 1 ? "" : "s"}`
        : `Tag "${trimmed}" created`
    );
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild><Button size="sm" variant="primary"><Plus className="mr-1 h-4 w-4" />Add Tag</Button></DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Tag</DialogTitle>
          <DialogDescription>Create a tag and optionally assign it to existing projects.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label>Tag name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sustainability" />
            </div>
            <div>
              <Label>Color</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label>Assign to projects {selected.length > 0 && <span className="ml-1 text-xs text-muted-foreground">({selected.length} selected)</span>}</Label>
              {selected.length > 0 && (
                <button type="button" onClick={() => setSelected([])} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
              )}
            </div>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects…" className="mb-2" />
            <ScrollArea className="h-56 rounded-md border border-border">
              <div className="divide-y divide-border/60">
                {filtered.length === 0 && (
                  <div className="px-3 py-6 text-center text-xs text-muted-foreground">No projects match</div>
                )}
                {filtered.map((p) => {
                  const checked = selected.includes(p.id);
                  return (
                    <label key={p.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-secondary/40">
                      <Checkbox checked={checked} onCheckedChange={() => toggle(p.id)} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-foreground">{p.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{p.businessLine} · {p.department}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarsTab() {
  const { calendars, removeCalendar, updateCalendar } = useCalendars();
  const { approvals } = useApprovals();
  const { projects } = useProjects();
  const [editing, setEditing] = useState<WorkCalendar | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [link, setLink] = useState("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return calendars
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.holidays.some((h) => h.label.toLowerCase().includes(q)))
      .filter((c) => {
        const linkedCount = projects.filter((p) => p.calendarId === c.id).length;
        if (link === "linked") return linkedCount > 0;
        if (link === "unlinked") return linkedCount === 0;
        if (link === "active") return c.active !== false;
        if (link === "inactive") return c.active === false;
        return true;
      });
  }, [calendars, projects, query, link]);

  function deleteCalendar(calendar: WorkCalendar) {
    if (projects.some((p) => p.calendarId === calendar.id)) {
      toast.error("Calendar is linked to active projects — unlink them first");
      return;
    }
    removeCalendar(calendar.id);
    toast.success(`Calendar "${calendar.name}" deleted`);
  }

  return (
    <>
      <FilterBar
        title="Calendars"
        desc="Working days, hours and holidays per region."
        query={query}
        onQueryChange={setQuery}
        placeholder="Search calendar or holiday…"
        resultCount={visible.length}
        totalCount={calendars.length}
        onReset={() => { setQuery(""); setLink("all"); }}
        cta={<Button size="sm" variant="primary" onClick={() => setCreateOpen(true)}><Plus className="mr-1 h-4 w-4" />New Calendar</Button>}
        filterGroups={[{ key: "link", label: "Linked Projects", value: link, onChange: setLink, options: [{ value: "all", label: "All calendars" },{ value: "linked", label: "Linked to projects" },{ value: "unlinked", label: "Not linked" },{ value: "active", label: "Active" },{ value: "inactive", label: "Deactivated" },] }]}
      />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {visible.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm text-muted-foreground">No matching calendars</div>
        )}
        {visible.map((c) => {
          const linked = projects.filter((p) => p.calendarId === c.id);
          const isActive = c.active !== false;
          const decided = approvals.find(
            (a) => a.type === "calendar-change" && a.ref === c.name && a.status !== "pending",
          );
          return (
          <div key={c.id} className="group glass-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-accent" />
                <div className="font-medium text-foreground">{c.name}</div>
              </div>
              <RowActions
                editLabel={`Edit ${c.name}`}
                deleteLabel={`Delete ${c.name}`}
                deleteDisabled={linked.length > 0}
                onEdit={() => setEditing(c)}
                isActive={isActive}
                onToggleActive={() => {
                  if (isActive && linked.length > 0) {
                    toast.error("Calendar is linked to active projects — unlink them first");
                    return;
                  }
                  updateCalendar(c.id, { active: !isActive });
                  toast.success(isActive ? `Calendar "${c.name}" deactivated` : `Calendar "${c.name}" activated`);
                }}
                onDelete={() => deleteCalendar(c)}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Link2 className="h-3 w-3" />{linked.length} linked project{linked.length === 1 ? "" : "s"}
              </span>
              {!isActive && (
                <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Deactivated
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {DAY_LABELS.map((d, i) => (
                <span key={d} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${c.workingDays.includes(i) ? "bg-accent/15 text-accent" : "bg-secondary/40 text-muted-foreground line-through"}`}>{d}</span>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{c.hoursPerDay}h/day · {c.holidays.length} holiday{c.holidays.length === 1 ? "" : "s"}</div>
            {linked.length > 0 && (
              <div className="mt-2 truncate text-[11px] text-muted-foreground/80" title={linked.map((p) => p.name).join(", ")}>
                {linked.slice(0, 3).map((p) => p.name).join(" · ")}{linked.length > 3 ? ` +${linked.length - 3} more` : ""}
              </div>
            )}
            {decided && <ApprovalOutcomeBanner request={decided} className="mt-2" />}
          </div>
          );
        })}
      </div>
      <CalendarDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editing && <CalendarDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} calendar={editing} />}
    </>
  );
}

function CalendarDialog({ open, onOpenChange, calendar }: { open: boolean; onOpenChange: (v: boolean) => void; calendar?: WorkCalendar }) {
  const { addCalendar, updateCalendar, updateCalendarWithAdoption } = useCalendars();
  const { projects } = useProjects();
  const isEdit = !!calendar;
  const linked = calendar ? projects.filter((p) => p.calendarId === calendar.id) : [];
  const hasLinked = isEdit && linked.length > 0;
  const [name, setName] = useState(calendar?.name ?? "");
  const [workingDays, setWorkingDays] = useState<number[]>(calendar?.workingDays ?? [1, 2, 3, 4, 5]);
  const [hoursPerDay, setHoursPerDay] = useState<number>(calendar?.hoursPerDay ?? 8);
  const [holidays, setHolidays] = useState<{ date: string; label: string }[]>(calendar?.holidays ?? []);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newLabel, setNewLabel] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const holidayDates = holidays.map((h) => parseISO(h.date));

  const diffs = (() => {
    if (!calendar) return [];
    const out: { label: string; before?: string; after?: string }[] = [];
    if (name.trim() !== calendar.name) out.push({ label: "Calendar name", before: calendar.name, after: name.trim() });
    const dayStr = (d: number[]) => d.slice().sort().map((i) => DAY_LABELS[i]).join(", ") || "None";
    if (dayStr(workingDays) !== dayStr(calendar.workingDays)) out.push({ label: "Working days", before: dayStr(calendar.workingDays), after: dayStr(workingDays) });
    if (hoursPerDay !== calendar.hoursPerDay) out.push({ label: "Hours / day", before: `${calendar.hoursPerDay}h`, after: `${hoursPerDay}h` });
    const before = new Map(calendar.holidays.map((h) => [h.date, h.label]));
    const after = new Map(holidays.map((h) => [h.date, h.label]));
    for (const [date, label] of after) {
      if (!before.has(date)) out.push({ label: `Holiday · ${date}`, before: "—", after: label });
      else if (before.get(date) !== label) out.push({ label: `Holiday · ${date}`, before: before.get(date), after: label });
    }
    for (const [date, label] of before) {
      if (!after.has(date)) out.push({ label: `Holiday · ${date}`, before: label, after: "Removed" });
    }
    return out;
  })();

  function toggleDay(d: number) {
    setWorkingDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());
  }
  function addHoliday() {
    if (!newDate) { toast.error("Pick a date"); return; }
    const iso = format(newDate, "yyyy-MM-dd");
    if (holidays.some((h) => h.date === iso)) { toast.error("Holiday already added for that date"); return; }
    setHolidays((prev) => [...prev, { date: iso, label: newLabel.trim() || "Holiday" }].sort((a, b) => a.date.localeCompare(b.date)));
    setNewDate(undefined); setNewLabel("");
  }
  function removeHoliday(date: string) {
    setHolidays((prev) => prev.filter((h) => h.date !== date));
  }
  function save() {
    if (!name.trim()) { toast.error("Calendar name is required"); return; }
    if (workingDays.length === 0) { toast.error("Select at least one working day"); return; }
    if (isEdit && calendar) {
      if (hasLinked) {
        if (diffs.length === 0) { toast.info("No changes to save"); return; }
        updateCalendarWithAdoption(
          calendar.id,
          { name: name.trim(), workingDays, hoursPerDay, holidays },
          diffs,
        );
        toast.success("Calendar updated");
        onOpenChange(false);
        return;
      }
      updateCalendar(calendar.id, { name: name.trim(), workingDays, hoursPerDay, holidays });
      toast.success("Calendar updated");
    } else {
      addCalendar({ id: `cal-${Date.now()}`, name: name.trim(), workingDays, hoursPerDay, holidays });
      toast.success(`Calendar "${name.trim()}" created`);
    }
    onOpenChange(false);
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Calendar" : "New Calendar"}</DialogTitle>
          <DialogDescription>Working schedule and official holidays. Projects can be bound to this calendar for scheduling.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Egypt — Standard" />
            </div>
            <div>
              <Label>Hours / day</Label>
              <Input type="number" min={1} max={24} step={0.5} value={hoursPerDay} onChange={(e) => setHoursPerDay(parseFloat(e.target.value) || 0)} className="w-24" />
            </div>
          </div>
          <div>
            <Label>Working days</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {DAY_LABELS.map((d, i) => {
                const on = workingDays.includes(i);
                return (
                  <button key={d} type="button" onClick={() => toggleDay(i)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${on ? "border-accent bg-accent/15 text-accent" : "border-border bg-secondary/40 text-muted-foreground"}`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Official holidays</Label>
            <div className="mt-1.5 flex flex-col gap-2 rounded-lg border border-border bg-secondary/30 p-3 sm:flex-row sm:items-center">
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className={`w-full justify-start gap-2 sm:w-44 ${!newDate ? "text-muted-foreground" : ""}`}>
                    <CalendarIcon className="h-4 w-4 text-accent" />
                    {newDate ? format(newDate, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={(d) => { setNewDate(d); if (d) setPickerOpen(false); }}
                    initialFocus
                    modifiers={{ holiday: holidayDates }}
                    modifiersClassNames={{ holiday: "bg-rag-red/20 text-rag-red font-semibold rounded-md" }}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label (e.g. Labour Day)" className="flex-1" />
              <Button type="button" variant="primary" onClick={addHoliday}>
                <Plus className="mr-1 h-4 w-4" />Add
              </Button>
            </div>
            <ScrollArea className="mt-2 h-48 rounded-lg border border-border bg-card">
              <div className="divide-y divide-border/60">
                {holidays.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 px-3 py-10 text-center">
                    <PartyPopper className="h-6 w-6 text-muted-foreground/60" />
                    <div className="text-xs text-muted-foreground">No holidays yet — pick a date above to add one</div>
                  </div>
                )}
                {holidays.map((h) => {
                  const d = parseISO(h.date);
                  return (
                    <div key={h.date} className="group flex items-center gap-3 px-3 py-2 transition hover:bg-accent/5">
                      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md border border-rag-red/30 bg-rag-red/10 text-rag-red">
                        <span className="text-[9px] font-semibold uppercase leading-none">{format(d, "MMM")}</span>
                        <span className="text-sm font-bold leading-none">{format(d, "d")}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">{h.label}</div>
                        <div className="text-[11px] text-muted-foreground">{format(d, "EEEE, yyyy")}</div>
                      </div>
                      <Button aria-label={`Delete ${h.label}`} size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:!bg-rag-red/15 hover:!text-rag-red" onClick={() => removeHoliday(h.date)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            {isEdit ? "Save changes" : "Create Calendar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

function CostCategoriesTab() {
  const [categories, setCategories] = useState<CostCategory[]>([
    { id: "staff", name: "Staff", number: "CC-001", description: "Salaries, benefits and internal staff cost", type: "OpEx" },
    { id: "services", name: "Services", number: "CC-002", description: "External professional and managed services", type: "OpEx" },
    { id: "insurance", name: "Insurance", number: "CC-003", description: "Project and asset insurance premiums", type: "OpEx" },
    { id: "business-trips", name: "Business Trips", number: "CC-004", description: "Travel, accommodation and per-diem", type: "OpEx" },
    { id: "contracts", name: "Contracts", number: "CC-005", description: "Capitalized contracts and construction works", type: "CapEx" },
  ]);
  const [editing, setEditing] = useState<CostCategory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CostCategory | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.number.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
      .filter((c) => type === "all" || c.type === type);
  }, [categories, query, type]);

  const pager = usePagination(visible);

  return (
    <>
      <FilterBar
        title="Cost Categories"
        desc="Standard cost classifications used across projects."
        query={query}
        onQueryChange={setQuery}
        placeholder="Search name, ID or description…"
        resultCount={visible.length}
        totalCount={categories.length}
        onReset={() => { setQuery(""); setType("all"); }}
        cta={<AddCostCategoryDialog onAdd={(cat) => setCategories([...categories, cat])} />}
        filterGroups={[{ key: "type", label: "Type", value: type, onChange: setType, options: [{ value: "all", label: "All types" },{ value: "CapEx", label: "CapEx only" },{ value: "OpEx", label: "OpEx only" },] }]}
      />
      <div className="">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
            <TableHead className="w-32">Account Num.</TableHead>
            <TableHead className="w-56">Category Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-28">Type</TableHead>
            <TableHead className="w-28 text-right">Usage</TableHead>
            <TableHead className="w-24" />
          </TableRow></TableHeader>
          <TableBody>
            {visible.length === 0 && <EmptyRow colSpan={6} />}
            {pager.pageItems.map((c) => (
              <TableRow key={c.id} className="bg-table-row-bg hover:bg-table-row-hover border-0">
                <TableCell className="num-mono whitespace-nowrap text-muted-foreground">{c.number}</TableCell>
                <TableCell className="whitespace-nowrap font-medium text-foreground">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.description || "—"}</TableCell>
                <TableCell>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${c.type === "CapEx" ? "bg-rag-blue/15 text-rag-blue" : "bg-accent-dim text-accent"}`}>{c.type}</span>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">— projects</TableCell>
                <TableCell>
                  <RowActions onEdit={() => setEditing(c)} onDelete={() => setPendingDelete(c)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <TablePagination {...pager} itemLabel="cost categories" />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Cost Category</DialogTitle><DialogDescription>Update the classification, its cost center identifier, description and type.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Category Name</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing((p) => p ? { ...p, name: e.target.value } : p)} /></div>
            <div><Label>Account Num.</Label><Input value={editing?.number ?? ""} onChange={(e) => setEditing((p) => p ? { ...p, number: e.target.value } : p)} /></div>
            <div><Label>Description</Label><Textarea value={editing?.description ?? ""} onChange={(e) => setEditing((p) => p ? { ...p, description: e.target.value } : p)} /></div>
            <div>
              <Label>Type</Label>
              <Select value={editing?.type ?? "OpEx"} onValueChange={(v) => setEditing((p) => p ? { ...p, type: v as "CapEx" | "OpEx" } : p)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CapEx">CapEx — Capital expenditure</SelectItem>
                  <SelectItem value="OpEx">OpEx — Operating expenditure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              if (!editing) return;
              const name = editing.name.trim();
              const number = editing.number.trim();
              if (!name || !number) { toast.error("Name and ID are required"); return; }
              setCategories((prev) => prev.map((c) => c.id === editing.id ? { ...editing, name, number, description: editing.description.trim() } : c));
              toast.success("Cost Category updated");
              setEditing(null);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        label={pendingDelete?.name}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          setCategories((prev) => prev.filter((c) => c.id !== pendingDelete.id));
          toast.success(`Deleted "${pendingDelete.name}"`);
          setPendingDelete(null);
        }}
      />
    </>
  );
}

type CostCategory = { id: string; name: string; number: string; description: string; type: "CapEx" | "OpEx" };

function AddCostCategoryDialog({ onAdd }: { onAdd: (cat: CostCategory) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"CapEx" | "OpEx">("OpEx");

  function save() {
    const trimmed = name.trim();
    const numTrimmed = number.trim();
    if (!trimmed || !numTrimmed) { toast.error("Name and ID are required"); return; }
    onAdd({ id: `cat-${Date.now()}`, name: trimmed, number: numTrimmed, description: description.trim(), type });
    toast.success(`Cost Category "${trimmed}" created`);
    setName("");
    setNumber("");
    setDescription("");
    setType("OpEx");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="primary"><Plus className="mr-1 h-4 w-4" />Add Category</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Cost Category</DialogTitle>
          <DialogDescription>Define a cost classification and its cost center identifier for tracking expenses.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Category Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Staff, Services, Insurance" />
          </div>
          <div>
            <Label>Account Num.</Label>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="e.g. CC-001" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What kind of costs belong to this category?" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "CapEx" | "OpEx")}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CapEx">CapEx — Capital expenditure</SelectItem>
                <SelectItem value="OpEx">OpEx — Operating expenditure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function JobRolesTab() {
  const { jobRoles, addJobRole, updateJobRole, removeJobRole } = useJobRoles();
  const { resourceRequests } = useResourceRequests();
  const usageByRole = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const r of resourceRequests) {
      const key = r.role.trim().toLowerCase();
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(r.project);
    }
    return map;
  }, [resourceRequests]);
  const [editing, setEditing] = useState<{ id: string; title: string; skills: string[] }  | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const [query, setQuery] = useState("");
  const [usage, setUsage] = useState("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobRoles
      .map((r, index) => ({ ...r, index }))
      .filter((r) => !q || r.title.toLowerCase().includes(q) || (r.skills ?? []).some((sk) => sk.toLowerCase().includes(q)))
      .filter((r) => {
        if (usage === "all") return true;
        const used = (usageByRole.get(r.title.trim().toLowerCase())?.size ?? 0) > 0;
        if (usage === "used") return used;
        if (usage === "unused") return !used;
        if (usage === "with-skills") return (r.skills ?? []).length > 0;
        return (r.skills ?? []).length === 0;
      });
  }, [jobRoles, query, usage, usageByRole]);

  const pager = usePagination(visible);

  return (
    <>
      <FilterBar
        title="Job Roles Definition"
        desc="Standard job titles used when planning tasks."
        query={query}
        onQueryChange={setQuery}
        placeholder="Search role title or skill…"
        resultCount={visible.length}
        totalCount={jobRoles.length}
        onReset={() => { setQuery(""); setUsage("all"); }}
        cta={<AddJobRoleDialog onAdd={(title, skills) => { addJobRole(title, skills); toast.success(`Job Role "${title}" created`); }} />}
        filterGroups={[{ key: "usage", label: "Usage", value: usage, onChange: setUsage, options: [{ value: "all", label: "All roles" },{ value: "used", label: "Used in projects" },{ value: "unused", label: "Not used" },{ value: "with-skills", label: "With skills" },{ value: "no-skills", label: "Without skills" },] }]}
      />
      <div className="">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
            <TableHead className="w-56">Role Title</TableHead>
            <TableHead className="w-48">Skills</TableHead>
            <TableHead className="w-40 text-center">Usage in Projects</TableHead>
            <TableHead className="w-24" />
          </TableRow></TableHeader>
          <TableBody>
            {visible.length === 0 && <EmptyRow colSpan={4} />}
            {pager.pageItems.map((r) => (
              <TableRow key={r.id} className="bg-table-row-bg hover:bg-table-row-hover border-0">
                <TableCell className="whitespace-nowrap font-medium text-foreground">{r.title}</TableCell>
                <TableCell>
                  {r.skills?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {r.skills.map((sk) => (
                        <span key={sk} className="rounded-md bg-secondary/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{sk}</span>
                      ))}
                    </div>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-center text-xs">
                  {(() => {
                    const projects = usageByRole.get(r.title.trim().toLowerCase());
                    const count = projects?.size ?? 0;
                    return count === 0
                      ? <span className="text-muted-foreground">Not used</span>
                      : <span className="text-foreground" title={[...projects!].join(", ")}>{count} project{count > 1 ? "s" : ""}</span>;
                  })()}
                </TableCell>
                <TableCell>
                  <TableRowActions
                    onEdit={() => setEditing({ id: r.id, title: r.title, skills: r.skills ?? [] })}
                    onDelete={() => setPendingDelete({ id: r.id, title: r.title })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <TablePagination {...pager} itemLabel="job roles" />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job Role</DialogTitle>
            <DialogDescription>Rename this role. Existing task assignments keep referencing this role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Role Title</Label>
              <Input value={editing?.title ?? ""} onChange={(e) => setEditing((prev) => prev ? { ...prev, title: e.target.value } : prev)} />
            </div>
            <div>
              <Label>Skills</Label>
              <SkillsTagsInput value={editing?.skills ?? []} onChange={(skills) => setEditing((prev) => prev ? { ...prev, skills } : prev)} />
              <p className="mt-1 text-[11px] text-muted-foreground">Press Enter, Tab or double space to add a skill.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              if (!editing) return;
              const t = editing.title.trim();
              if (!t) { toast.error("Role title is required"); return; }
              updateJobRole(editing.id, t, editing.skills);
              toast.success("Job Role updated");
              setEditing(null);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete "{pendingDelete?.title}"?</DialogTitle>
            <DialogDescription>This role will no longer appear in the Project Schedule role picker. Tasks already tagged with this role are not affected.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button className="bg-rag-red text-white hover:bg-rag-red/90" onClick={() => {
              if (!pendingDelete) return;
              removeJobRole(pendingDelete.id);
              toast.success(`Deleted "${pendingDelete.title}"`);
              setPendingDelete(null);
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddJobRoleDialog({ onAdd }: { onAdd: (title: string, skills: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  function save() {
    const trimmed = title.trim();
    if (!trimmed) { toast.error("Role title is required"); return; }
    onAdd(trimmed, skills);
    setTitle("");
    setSkills([]);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="primary"><Plus className="mr-1 h-4 w-4" />Add Role</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Job Role</DialogTitle>
          <DialogDescription>Define a job title that Project Managers can assign to tasks during planning — before any resource is allocated. Skills and seniority can be added on the task itself.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Role Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Data Engineer, Cloud Architect" />
          </div>
          <div>
            <Label>Skills</Label>
            <SkillsTagsInput value={skills} onChange={setSkills} />
            <p className="mt-1 text-[11px] text-muted-foreground">Press Enter, Tab or double space to add a skill.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
