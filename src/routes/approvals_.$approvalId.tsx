import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { PlanChangesTable } from "@/components/PlanChangesTable";
import { ApprovalOutcomeBanner } from "@/components/ApprovalOutcome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StyledTable,
  StyledTableBody,
  StyledTableCell,
  StyledTableHead,
  StyledTableHeader,
  StyledTableHeaderRow,
  StyledTableRow,
} from "@/components/StyledTable";
import { EmptyRow } from "@/components/ds/PageToolbar";
import { RagBadge } from "@/components/RagBadge";
import { ArrowLeft } from "@/lib/icons";
import { useApprovals, useProjects, type ApprovalRequest } from "@/lib/projects-store";
import { PLAN_CACHE } from "@/lib/plan-cache";
import { seedMilestones, initialCostEntries, initialRevEntries } from "@/lib/plan-seeds";
import type { CostEntry, Milestone, RevEntry } from "@/routes/portfolio.$projectId";
import { toast } from "@/lib/toast";
import { formatDateWithYear } from "@/lib/date-format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/approvals_/$approvalId")({
  component: ChangeRequestReviewPage,
  head: () => ({
    meta: [
      { title: "Project Approval Review — Nexus PMO MVP" },
      { name: "description", content: "Review project milestone approvals and change requests alongside the schedule, cost breakdown and revenue breakdown." },
      { property: "og:title", content: "Project Approval Review — Nexus PMO MVP" },
      { property: "og:description", content: "Review project milestone approvals and change requests alongside the schedule, cost breakdown and revenue breakdown." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type SectionKey = "info" | "schedule" | "cost" | "revenue";
const SECTIONS: { key: SectionKey; label: string; prefix: string }[] = [
  { key: "info", label: "Project Info", prefix: "Info · " },
  { key: "schedule", label: "Project Schedule", prefix: "" },
  { key: "cost", label: "Cost Breakdown", prefix: "Cost · " },
  { key: "revenue", label: "Revenue Breakdown", prefix: "Revenue · " },
];
type SectionChange = { item: string; field: string; before?: string; after?: string; type?: string };

/** Change labels are "[Cost · |Revenue · ]Item · Field"; unprefixed labels belong to the schedule. */
function splitChanges(
  summary: ApprovalRequest["summary"],
  kindOf: (item: string) => string | undefined,
): Record<SectionKey, SectionChange[]> {
  const out: Record<SectionKey, SectionChange[]> = { info: [], schedule: [], cost: [], revenue: [] };
  for (const entry of summary) {
    const section = SECTIONS.find((sec) => sec.prefix && entry.label.startsWith(sec.prefix)) ?? SECTIONS.find((sec) => sec.key === "schedule")!;
    const rest = entry.label.slice(section.prefix.length);
    const cut = rest.lastIndexOf(" · ");
    const item = cut >= 0 ? rest.slice(0, cut) : "—";
    out[section.key].push({
      item,
      field: cut >= 0 ? rest.slice(cut + 3) : rest,
      before: entry.before,
      after: entry.after,
      // Schedule rows carry the item kind; financial rows have none.
      type: section.key === "schedule" ? entry.type ?? kindOf(item) : undefined,
    });
  }
  return out;
}

function statusDot(status: ApprovalRequest["status"]) {
  return status === "approved" ? "bg-rag-green" : status === "rejected" ? "bg-rag-red" : "bg-rag-amber";
}

const money = (value: number | null) => (value == null ? "—" : `$${value.toFixed(2)}M`);


function ChangeRequestReviewPage() {
  const { approvalId } = Route.useParams();
  const navigate = useNavigate();
  const { approvals, decideApproval, currentUser } = useApprovals();
  const { projects } = useProjects();
  const approval = approvals.find((a) => a.id === approvalId) ?? null;

  const [mode, setMode] = useState<"approve" | "reject">("approve");
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");

  if (!approval || approval.type === "calendar-change") {
    return (
      <div>
        <Link to="/approvals" className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Approvals
        </Link>
        <div className="mt-10 rounded-lg border border-border bg-card p-10 text-center">
          <div className="text-lg font-medium text-foreground">Project approval not found</div>
          <p className="mt-2 text-sm text-muted-foreground">This request may have been removed, or it is not a project approval.</p>
        </div>
      </div>
    );
  }

  const project = projects.find((p) => p.id === approval.projectId);
  const cached = PLAN_CACHE.get(approval.projectId) as
    | { milestones?: Milestone[]; costEntries?: CostEntry[]; revEntries?: RevEntry[] }
    | undefined;
  const scheduleItems = cached?.milestones ?? (project ? seedMilestones(project) : []);
  const costEntries = cached?.costEntries ?? initialCostEntries(false);
  const revEntries = cached?.revEntries ?? (project ? initialRevEntries(project, false) : []);

  const itemKinds = new Map(scheduleItems.map((item) => [item.name, item.kind as string]));
  const sectionChanges = splitChanges(approval.summary, (item) =>
    itemKinds.get(item) ?? (item === "—" && approval.type === "milestone-gate" ? itemKinds.get(approval.ref) ?? "Milestone" : undefined),
  );
  // Project Info tab only appears when the request carries basic-info edits.
  const visibleSections = SECTIONS.filter((sec) => sec.key !== "info" || sectionChanges.info.length > 0);
  const firstSection = visibleSections.find((sec) => sectionChanges[sec.key].length > 0)?.key ?? "schedule";

  // Single-approver flow: any signed-in user can decide a pending request.
  const canAct = approval.status === "pending";
  // Decided requests show the changes only — no "Current …" reference tables.
  const isPending = approval.status === "pending";

  function openDecision(nextMode: "approve" | "reject") {
    setMode(nextMode);
    setComment("");
    setCommentError("");
    setDecisionOpen(true);
  }

  function confirmDecision() {
    if (!approval) return;
    if (mode === "reject" && !comment.trim()) {
      setCommentError("A comment is required when rejecting.");
      return;
    }
    decideApproval(approval.id, currentUser.id, mode === "approve" ? "approved" : "rejected", comment.trim() || undefined);
    toast[mode === "approve" ? "success" : "error"](
      mode === "approve" ? `Approved — ${approval.title}` : `Rejected — ${approval.title}`,
    );
    setDecisionOpen(false);
    navigate({ to: "/approvals" });
  }


  return (
    <div>
      <Link to="/approvals" className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Approvals
      </Link>

      <div className="mt-3">
        <PageHeader
          title={approval.title}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {approval.status === "pending" && canAct && (
                <>
                  <Button variant="outline" className="border-rag-red/40 text-rag-red" onClick={() => openDecision("reject")}>Reject</Button>
                  <Button variant="primary" onClick={() => openDecision("approve")}>Approve</Button>
                </>
              )}
            </div>
          }
        />
      </div>

      {/* Compact meta line — the request's facts in one band. */}
      <div className="-mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        {approval.projectId ? (
          <Link to="/portfolio/$projectId" params={{ projectId: approval.projectId }} className="text-accent hover:underline">
            {approval.projectName}
          </Link>
        ) : <span className="text-foreground">{approval.projectName}</span>}
        <span aria-hidden>·</span>
        <span>Requested by {approval.requestedBy} on {formatDateWithYear(approval.requestedAt)}</span>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full", statusDot(approval.status))} aria-hidden />
          <span className="text-foreground capitalize">{approval.status}</span>
        </span>
      </div>

      {/* Decided requests: who decided, when, and the comment they left. */}
      {!isPending && <ApprovalOutcomeBanner request={approval} className="mt-5" />}

      <Tabs defaultValue={firstSection} className="mt-6">
        <TabsList className="overflow-x-auto whitespace-nowrap">
          {visibleSections.map((s) => (
            <TabsTrigger key={s.key} value={s.key} className="gap-2">
              {s.label}
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[11px] text-foreground">{sectionChanges[s.key].length}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {visibleSections.map((s) => (
          <TabsContent key={s.key} value={s.key} className="mt-5">
            <PlanChangesTable changes={sectionChanges[s.key]} label={s.label} showType={s.key === "schedule"} />
          </TabsContent>
        ))}

        {isPending && (
        <TabsContent value="schedule" className="mt-6">
          <h3 className="mb-3 text-sm font-medium text-foreground">Current schedule</h3>
          <StyledTable wrapperClassName="">
            <StyledTableHeader>
              <StyledTableHeaderRow>
                <StyledTableHead>Item</StyledTableHead>
                <StyledTableHead>Type</StyledTableHead>
                <StyledTableHead>Start</StyledTableHead>
                <StyledTableHead>Finish</StyledTableHead>
                <StyledTableHead>Owner</StyledTableHead>
                <StyledTableHead>Progress</StyledTableHead>
                <StyledTableHead>Status</StyledTableHead>
              </StyledTableHeaderRow>
            </StyledTableHeader>
            <StyledTableBody>
              {scheduleItems.length === 0 ? <EmptyRow colSpan={7} /> : scheduleItems.map((item) => (
                <StyledTableRow key={item.name}>
                  <StyledTableCell>
                    <div className="font-medium text-foreground">{item.name}</div>
                    {item.parent && <div className="mt-0.5 text-xs text-muted-foreground">{item.parent}</div>}
                  </StyledTableCell>
                  <StyledTableCell>
                    <Badge variant="outline" className={item.kind === "Milestone" ? "border-accent/40 bg-accent-dim text-accent" : "border-border text-muted-foreground"}>
                      {item.kind}
                    </Badge>
                  </StyledTableCell>
                  <StyledTableCell>{formatDateWithYear(item.startDate)}</StyledTableCell>
                  <StyledTableCell>{formatDateWithYear(item.endDate)}</StyledTableCell>
                  <StyledTableCell>{item.owner}</StyledTableCell>
                  <StyledTableCell>{item.progress ?? 0}%</StyledTableCell>
                  <StyledTableCell><RagBadge rag={item.rag} /></StyledTableCell>
                </StyledTableRow>
              ))}
            </StyledTableBody>
          </StyledTable>
        </TabsContent>
        )}

        {isPending && (
        <TabsContent value="cost" className="mt-6">
          <h3 className="mb-3 text-sm font-medium text-foreground">Current cost lines</h3>
          <StyledTable wrapperClassName="">
            <StyledTableHeader>
              <StyledTableHeaderRow>
                <StyledTableHead>Cost line</StyledTableHead>
                <StyledTableHead>Category</StyledTableHead>
                <StyledTableHead>Type</StyledTableHead>
                <StyledTableHead>CapEx/OpEx</StyledTableHead>
                <StyledTableHead>Planned</StyledTableHead>
                <StyledTableHead>Actual</StyledTableHead>
                <StyledTableHead>Date</StyledTableHead>
              </StyledTableHeaderRow>
            </StyledTableHeader>
            <StyledTableBody>
              {costEntries.length === 0 ? <EmptyRow colSpan={7} /> : costEntries.map((entry) => (
                <StyledTableRow key={entry.c}>
                  <StyledTableCell>
                    <div className="font-medium text-foreground">{entry.c}</div>
                    {entry.desc && <div className="mt-0.5 text-xs text-muted-foreground">{entry.desc}</div>}
                  </StyledTableCell>
                  <StyledTableCell>{entry.cat ?? "—"}</StyledTableCell>
                  <StyledTableCell className="capitalize">{entry.ctype ?? "—"}</StyledTableCell>
                  <StyledTableCell className="uppercase">{entry.classification ?? "—"}</StyledTableCell>
                  <StyledTableCell>{money(entry.b)}</StyledTableCell>
                  <StyledTableCell>{money(entry.a)}</StyledTableCell>
                  <StyledTableCell>
                    {entry.linkKind === "milestone" ? entry.linkRef : entry.linkRef ? formatDateWithYear(entry.linkRef) : "—"}
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </StyledTableBody>
          </StyledTable>
        </TabsContent>
        )}

        {isPending && (
        <TabsContent value="revenue" className="mt-6">
          <h3 className="mb-3 text-sm font-medium text-foreground">Current revenue events</h3>
          <StyledTable wrapperClassName="">
            <StyledTableHeader>
              <StyledTableHeaderRow>
                <StyledTableHead>Milestone</StyledTableHead>
                <StyledTableHead>Event</StyledTableHead>
                <StyledTableHead>Planned</StyledTableHead>
                <StyledTableHead>Actual</StyledTableHead>
                <StyledTableHead>Date</StyledTableHead>
                <StyledTableHead>Status</StyledTableHead>
              </StyledTableHeaderRow>
            </StyledTableHeader>
            <StyledTableBody>
              {revEntries.length === 0 ? <EmptyRow colSpan={6} /> : revEntries.map((entry) => (
                <StyledTableRow key={`${entry.ms}-${entry.evt}`}>
                  <StyledTableCell>{entry.ms}</StyledTableCell>
                  <StyledTableCell><div className="font-medium text-foreground">{entry.evt}</div></StyledTableCell>
                  <StyledTableCell>{money(entry.plan)}</StyledTableCell>
                  <StyledTableCell>{money(entry.act)}</StyledTableCell>
                  <StyledTableCell>{/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ? formatDateWithYear(entry.date) : entry.date}</StyledTableCell>
                  <StyledTableCell>
                    <Badge variant="outline" className={
                      entry.sl === "Received" ? "border-rag-green/50 bg-rag-green/10 text-rag-green"
                        : entry.sl === "Pending" ? "border-rag-amber/50 bg-rag-amber/10 text-rag-amber"
                          : "border-rag-blue/50 bg-rag-blue/10 text-rag-blue"
                    }>{entry.sl}</Badge>
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </StyledTableBody>
          </StyledTable>
        </TabsContent>
        )}
      </Tabs>

      <FormDialog
        open={decisionOpen}
        onOpenChange={(open) => !open && setDecisionOpen(false)}
        title={mode === "approve" ? "Approve request" : "Reject request"}
        description={`${approval.title} · ${approval.projectName}`}
        submitLabel={mode === "approve" ? "Approve" : "Reject"}
        onSubmit={confirmDecision}
      >
        <div className="rounded-md border border-border bg-secondary/20 px-4 py-3">
          <div className="text-sm font-medium text-foreground">{approval.title}</div>
          <div className="mt-1 text-xs text-muted-foreground">{approval.projectName}</div>
        </div>
        <Field label="Comment" htmlFor="cr-comment" required={mode === "reject"} error={commentError}>
          <Textarea
            id="cr-comment"
            value={comment}
            onChange={(event) => { setComment(event.target.value); setCommentError(""); }}
            placeholder={mode === "approve" ? "Optional comment…" : "Reason for rejection"}
            className="min-h-24"
          />
        </Field>
      </FormDialog>
    </div>
  );
}
