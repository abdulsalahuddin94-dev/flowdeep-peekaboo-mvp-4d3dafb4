import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { PageToolbar, EmptyRow } from "@/components/ds/PageToolbar";
import { ViewAsSelect } from "@/components/ViewAsSelect";
import {
  StyledTable,
  StyledTableBody,
  StyledTableCell,
  StyledTableHead,
  StyledTableHeader,
  StyledTableHeaderRow,
  StyledTableRow,
} from "@/components/StyledTable";
import { TablePagination, usePagination } from "@/components/TablePagination";
import { TableRowActions } from "@/components/TableRowActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, Diamond, GitBranch, Bell, CalendarDays } from "@/lib/icons";
import { EmptyRegion } from "@/lib/empty-preview";
import { useApprovals, type ApprovalRequest } from "@/lib/projects-store";
import { toast } from "@/lib/toast";
import { formatDateWithYear } from "@/lib/date-format";

export const Route = createFileRoute("/approvals")({
  component: ApprovalsInbox,
  validateSearch: (search: Record<string, unknown>) => {
    if (typeof search.project === "string" && search.project) return { project: search.project };
    return {};
  },
  head: () => ({
    meta: [
      { title: "Approvals Inbox — Nexus PMO MVP" },
      { name: "description", content: "Central inbox for milestone completion gates and baseline change requests awaiting your decision." },
      { property: "og:title", content: "Approvals Inbox — Nexus PMO MVP" },
      { property: "og:description", content: "Review and decide on milestone gates and baseline change requests in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type InboxView = "mine" | "pending" | "history";
type StatusFilter = "all" | ApprovalRequest["status"];
type TypeFilter = "all" | ApprovalRequest["type"];

const TYPE_LABELS: Record<ApprovalRequest["type"], string> = {
  "milestone-gate": "Milestone gate",
  "change-request": "Change request",
  "calendar-change": "Calendar change",
};

function statusTone(status: ApprovalRequest["status"]) {
  return status === "approved"
    ? "border-rag-green/50 bg-rag-green/10 text-rag-green"
    : status === "rejected"
      ? "border-rag-red/50 bg-rag-red/10 text-rag-red"
      : "border-rag-amber/50 bg-rag-amber/10 text-rag-amber";
}

function typeTone(type: ApprovalRequest["type"]) {
  return type === "milestone-gate"
    ? "border-rag-amber/40 bg-rag-amber/10 text-rag-amber"
    : type === "calendar-change"
      ? "border-rag-blue/40 bg-rag-blue/10 text-rag-blue"
      : "border-accent/40 bg-accent-dim text-accent";
}

function displaySummaryValue(value?: string) {
  if (!value) return "—";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatDateWithYear(value) : value;
}

function ApprovalsInbox() {
  const { approvals, decideApproval, remindApproval, currentUser } = useApprovals();
  const { project: projectFilter } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [query, setQuery] = useState("");
  const [inboxView, setInboxView] = useState<InboxView>("mine");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [mode, setMode] = useState<"approve" | "reject">("approve");
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");

  const projectNames = useMemo(
    () => Array.from(new Set(approvals.map((approval) => approval.projectName).filter(Boolean))).sort(),
    [approvals],
  );

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return approvals
      .filter((approval) => !projectFilter || approval.projectName === projectFilter)
      .filter((approval) => {
        if (inboxView === "history") return approval.status !== "pending";
        if (inboxView === "pending") return approval.status === "pending";
        return approval.status === "pending"
          && approval.approvers.some((approver) => approver.id === currentUser.id && approver.decision === "pending");
      })
      .filter((approval) => status === "all" || approval.status === status)
      .filter((approval) => type === "all" || approval.type === type)
      .filter((approval) => !normalizedQuery || [
        approval.title,
        approval.projectName,
        approval.requestedBy,
        TYPE_LABELS[approval.type],
        approval.ref,
      ].some((value) => value.toLowerCase().includes(normalizedQuery)));
  }, [approvals, currentUser.id, inboxView, projectFilter, query, status, type]);

  const pagination = usePagination(rows, 10);
  const details = approvals.find((approval) => approval.id === detailsId) ?? null;

  function setProjectFilter(value: string) {
    navigate({ search: value === "all" ? {} : { project: value } });
  }

  function openDecision(approval: ApprovalRequest, nextMode: "approve" | "reject") {
    setSelected(approval);
    setMode(nextMode);
    setComment("");
    setCommentError("");
  }

  function confirmDecision() {
    if (!selected) return;
    if (mode === "reject" && !comment.trim()) {
      setCommentError("A comment is required when rejecting.");
      return;
    }
    decideApproval(
      selected.id,
      currentUser.id,
      mode === "approve" ? "approved" : "rejected",
      comment.trim() || undefined,
    );
    toast[mode === "approve" ? "success" : "error"](
      mode === "approve" ? `Approved — ${selected.title}` : `Rejected — ${selected.title}`,
    );
    setSelected(null);
    setDetailsId(null);
  }

  function sendReminder(approval: ApprovalRequest) {
    remindApproval(approval.id);
    toast.success("Reminder sent to pending approvers");
  }

  return (
    <div>
      <PageHeader
        title="Approvals"
        subtitle={`Signed in as ${currentUser.name} · ${currentUser.role}`}
        actions={<ViewAsSelect />}
      />

      <PageToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search request, project or requester…"
        filterGroups={[
          {
            key: "inbox",
            label: "Inbox view",
            value: inboxView,
            onChange: (value) => setInboxView(value as InboxView),
            options: [
              { value: "mine", label: "Pending on me" },
              { value: "pending", label: "All pending" },
              { value: "history", label: "History" },
            ],
          },
          {
            key: "project",
            label: "Project",
            value: projectFilter ?? "all",
            onChange: setProjectFilter,
            options: [{ value: "all", label: "All projects" }, ...projectNames.map((name) => ({ value: name, label: name }))],
          },
          {
            key: "status",
            label: "Status",
            value: status,
            onChange: (value) => setStatus(value as StatusFilter),
            options: [
              { value: "all", label: "All statuses" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ],
          },
          {
            key: "type",
            label: "Request type",
            value: type,
            onChange: (value) => setType(value as TypeFilter),
            options: [
              { value: "all", label: "All request types" },
              { value: "milestone-gate", label: TYPE_LABELS["milestone-gate"] },
              { value: "change-request", label: TYPE_LABELS["change-request"] },
              { value: "calendar-change", label: TYPE_LABELS["calendar-change"] },
            ],
          },
        ]}
      />

      <EmptyRegion id="approvals-inbox">
        <StyledTable wrapperClassName="">
          <StyledTableHeader>
            <StyledTableHeaderRow>
              <StyledTableHead>Request</StyledTableHead>
              <StyledTableHead>Project</StyledTableHead>
              <StyledTableHead>Type</StyledTableHead>
              <StyledTableHead>Requested by</StyledTableHead>
              <StyledTableHead>Approvers</StyledTableHead>
              <StyledTableHead className="w-52 text-center">Status</StyledTableHead>
            </StyledTableHeaderRow>
          </StyledTableHeader>
          <StyledTableBody>
            {pagination.pageItems.length === 0 ? <EmptyRow colSpan={6} /> : pagination.pageItems.map((approval) => {
              const me = approval.approvers.find((approver) => approver.id === currentUser.id);
              const canAct = approval.status === "pending" && me?.decision === "pending";
              const approvedCount = approval.approvers.filter((approver) => approver.decision === "approved").length;
              return (
                <StyledTableRow key={approval.id} className="group cursor-pointer" onClick={() => setDetailsId(approval.id)}>
                  <StyledTableCell>
                    <div className="max-w-sm font-medium text-foreground">{approval.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{approval.ref}</div>
                  </StyledTableCell>
                  <StyledTableCell>
                    {approval.projectId ? (
                      <Link
                        to="/portfolio/$projectId"
                        params={{ projectId: approval.projectId }}
                        className="text-accent hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {approval.projectName}
                      </Link>
                    ) : approval.projectName}
                  </StyledTableCell>
                  <StyledTableCell><Badge variant="outline" className={typeTone(approval.type)}>{TYPE_LABELS[approval.type]}</Badge></StyledTableCell>
                  <StyledTableCell>
                    <div className="text-foreground">{approval.requestedBy}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{formatDateWithYear(approval.requestedAt)}</div>
                  </StyledTableCell>
                  <StyledTableCell>
                    <div className="text-foreground">{approvedCount} of {approval.approvers.length} approved</div>
                    {approval.reminders > 0 && <div className="mt-0.5 text-xs text-muted-foreground">{approval.reminders} reminder{approval.reminders === 1 ? "" : "s"}</div>}
                  </StyledTableCell>
                  <StyledTableCell onClick={(event) => event.stopPropagation()}>
                    <TableRowActions
                      statusNode={<Badge variant="outline" className={statusTone(approval.status)}>{approval.status}</Badge>}
                      extraActions={approval.status === "pending" ? (
                        <>
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            data-ds-size="auto"
                            aria-label="Remind pending approvers"
                            title="Remind pending approvers"
                            onClick={() => sendReminder(approval)}
                            className="h-9 w-9 rounded-full border border-border/60 text-accent-secondary"
                          >
                            <Bell className="h-4 w-4" />
                          </Button>
                          {canAct && (
                            <>
                              <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                data-ds-size="auto"
                                aria-label="Reject request"
                                title="Reject request"
                                onClick={() => openDecision(approval, "reject")}
                                className="h-9 w-9 rounded-full border border-border/60 text-rag-red"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                data-ds-size="auto"
                                aria-label="Approve request"
                                title="Approve request"
                                onClick={() => openDecision(approval, "approve")}
                                className="h-9 w-9 rounded-full border border-border/60 text-rag-green"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </>
                      ) : undefined}
                    />
                  </StyledTableCell>
                </StyledTableRow>
              );
            })}
          </StyledTableBody>
        </StyledTable>
        <TablePagination {...pagination} itemLabel="requests" demoPages={1} />
      </EmptyRegion>

      <ApprovalDetailsSheet
        approval={details}
        currentUserId={currentUser.id}
        onClose={() => setDetailsId(null)}
        onDecision={openDecision}
        onRemind={sendReminder}
      />

      <FormDialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={mode === "approve" ? "Approve request" : "Reject request"}
        description={selected ? `${selected.title} · ${selected.projectName}` : undefined}
        submitLabel={mode === "approve" ? "Approve" : "Reject"}
        onSubmit={confirmDecision}
      >
        {selected && (
          <div className="rounded-md border border-border bg-secondary/20 px-4 py-3">
            <div className="text-sm font-medium text-foreground">{selected.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{selected.projectName}</div>
          </div>
        )}
        <Field label="Comment" htmlFor="approval-comment" required={mode === "reject"} error={commentError}>
          <Textarea
            id="approval-comment"
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

function ApprovalDetailsSheet({
  approval,
  currentUserId,
  onClose,
  onDecision,
  onRemind,
}: {
  approval: ApprovalRequest | null;
  currentUserId: string;
  onClose: () => void;
  onDecision: (approval: ApprovalRequest, mode: "approve" | "reject") => void;
  onRemind: (approval: ApprovalRequest) => void;
}) {
  if (!approval) return null;
  const me = approval.approvers.find((approver) => approver.id === currentUserId);
  const canAct = approval.status === "pending" && me?.decision === "pending";

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 border-l border-border bg-drawer p-0 sm:max-w-[520px]">
        <SheetHeader className="border-b border-border px-6 py-5 pr-14">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={typeTone(approval.type)}>{TYPE_LABELS[approval.type]}</Badge>
            <Badge variant="outline" className={statusTone(approval.status)}>{approval.status}</Badge>
          </div>
          <SheetTitle className="pt-2 text-lg">{approval.title}</SheetTitle>
          <SheetDescription>{approval.ref}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 px-6 py-5">
            <section className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
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
              <section>
                <h3 className="mb-3 text-sm font-medium text-foreground">Change summary</h3>
                <div className="divide-y divide-border border-y border-border">
                  {approval.summary.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 py-3 text-xs">
                      <div className="font-medium text-foreground">{item.label}</div>
                      <div><span className="mb-1 block text-muted-foreground">Before</span><span className="text-foreground">{displaySummaryValue(item.before)}</span></div>
                      <div><span className="mb-1 block text-muted-foreground">After</span><span className="text-foreground">{displaySummaryValue(item.after)}</span></div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="mb-3 text-sm font-medium text-foreground">Approvers</h3>
              <div className="space-y-3">
                {approval.approvers.map((approver) => (
                  <div key={approver.id} className="border-b border-border pb-3 last:border-b-0">
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
          </div>
        </ScrollArea>

        {approval.status === "pending" && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-6 py-4">
            <Button variant="secondary" onClick={() => onRemind(approval)}><Bell className="h-4 w-4" />Remind</Button>
            {canAct && (
              <>
                <Button variant="outline" className="border-rag-red/40 text-rag-red" onClick={() => onDecision(approval, "reject")}>Reject</Button>
                <Button variant="primary" onClick={() => onDecision(approval, "approve")}>Approve</Button>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}