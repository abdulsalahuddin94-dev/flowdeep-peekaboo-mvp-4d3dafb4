import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
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
import { ArrowLeft, Bell } from "@/lib/icons";
import { useApprovals, type ApprovalRequest } from "@/lib/projects-store";
import { projects } from "@/lib/mock-data";
import { PLAN_CACHE } from "@/lib/plan-cache";
import { seedMilestones, initialCostEntries, initialRevEntries } from "@/lib/plan-seeds";
import type { CostEntry, Milestone, RevEntry } from "@/routes/portfolio.$projectId";
import { toast } from "@/lib/toast";
import { formatDateWithYear } from "@/lib/date-format";

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

function statusTone(status: ApprovalRequest["status"]) {
  return status === "approved"
    ? "border-rag-green/50 bg-rag-green/10 text-rag-green"
    : status === "rejected"
      ? "border-rag-red/50 bg-rag-red/10 text-rag-red"
      : "border-rag-amber/50 bg-rag-amber/10 text-rag-amber";
}

function displaySummaryValue(value?: string) {
  if (!value) return "—";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatDateWithYear(value) : value;
}

const money = (value: number | null) => (value == null ? "—" : `$${value.toFixed(2)}M`);

function ChangeRequestReviewPage() {
  const { approvalId } = Route.useParams();
  const navigate = useNavigate();
  const { approvals, decideApproval, remindApproval, currentUser } = useApprovals();
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

  const me = approval.approvers.find((approver) => approver.id === currentUser.id);
  const canAct = approval.status === "pending" && me?.decision === "pending";

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

  function sendReminder() {
    if (!approval) return;
    remindApproval(approval.id);
    toast.success("Reminder sent to pending approvers");
  }

  return (
    <div>
      <Link to="/approvals" className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Approvals
      </Link>

      <div className="mt-3">
        <PageHeader
          title={approval.title}
          subtitle={`${approval.ref} · Requested by ${approval.requestedBy} on ${formatDateWithYear(approval.requestedAt)}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={approval.type === "milestone-gate" ? "border-rag-amber/40 bg-rag-amber/10 text-rag-amber" : "border-accent/40 bg-accent-dim text-accent"}>{approval.type === "milestone-gate" ? "Milestone gate" : "Change request"}</Badge>
              <Badge variant="outline" className={statusTone(approval.status)}>{approval.status}</Badge>
              {approval.status === "pending" && (
                <>
                  <Button variant="secondary" onClick={sendReminder}><Bell className="h-4 w-4" />Remind</Button>
                  {canAct && (
                    <>
                      <Button variant="outline" className="border-rag-red/40 text-rag-red" onClick={() => openDecision("reject")}>Reject</Button>
                      <Button variant="primary" onClick={() => openDecision("approve")}>Approve</Button>
                    </>
                  )}
                </>
              )}
            </div>
          }
        />
      </div>

      <section className="mt-2 grid grid-cols-2 gap-x-5 gap-y-4 rounded-lg border border-border bg-card px-5 py-4 text-sm sm:grid-cols-4">
        <div>
          <div className="text-xs text-muted-foreground">Project</div>
          {approval.projectId ? (
            <Link to="/portfolio/$projectId" params={{ projectId: approval.projectId }} className="mt-1 block text-accent hover:underline">
              {approval.projectName}
            </Link>
          ) : <div className="mt-1 text-foreground">{approval.projectName}</div>}
        </div>
        <div><div className="text-xs text-muted-foreground">Reference</div><div className="mt-1 text-foreground">{approval.ref}</div></div>
        <div><div className="text-xs text-muted-foreground">Requested by</div><div className="mt-1 text-foreground">{approval.requestedBy}</div></div>
        <div><div className="text-xs text-muted-foreground">Requested on</div><div className="mt-1 text-foreground">{formatDateWithYear(approval.requestedAt)}</div></div>
      </section>

      {approval.summary.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-3 text-sm font-medium text-foreground">Change summary</h3>
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {approval.summary.map((item, index) => (
              <div key={`${item.label}-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3 text-xs">
                <div className="font-medium text-foreground">{item.label}</div>
                <div><span className="mb-1 block text-muted-foreground">Before</span><span className="text-foreground">{displaySummaryValue(item.before)}</span></div>
                <div><span className="mb-1 block text-muted-foreground">After</span><span className="text-foreground">{displaySummaryValue(item.after)}</span></div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-5">
        <h3 className="mb-3 text-sm font-medium text-foreground">Approvers</h3>
        <div className="space-y-3 rounded-lg border border-border bg-card px-5 py-4">
          {approval.approvers.map((approver) => (
            <div key={approver.id} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-foreground">{approver.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{approver.role}{approver.department ? ` · ${approver.department}` : ""}</div>
                </div>
                <Badge variant="outline" className={statusTone(approver.decision)}>{approver.decision}</Badge>
              </div>
              {approver.decidedAt && <div className="mt-2 text-xs text-muted-foreground">Decision date: {formatDateWithYear(approver.decidedAt)}</div>}
              {approver.comment && <div className="mt-2 rounded-md bg-secondary/30 px-3 py-2 text-xs text-foreground">{approver.comment}</div>}
            </div>
          ))}
        </div>
      </section>

      <Tabs defaultValue="schedule" className="mt-6">
        <TabsList className="overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="schedule">Project Schedule</TabsTrigger>
          <TabsTrigger value="cost">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-5">
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

        <TabsContent value="cost" className="mt-5">
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

        <TabsContent value="revenue" className="mt-5">
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
