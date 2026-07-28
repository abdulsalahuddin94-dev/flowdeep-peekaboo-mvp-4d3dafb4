import { Check, X, Clock } from "lucide-react";
import type { ApprovalRequest } from "@/lib/projects-store";

/**
 * Shared read-out of a central Approvals Inbox decision, rendered at the place
 * where the request originated (project tab, milestone gate, calendar, …).
 */
export function ApprovalOutcomeBanner({
  request,
  className = "",
  title,
}: {
  request: ApprovalRequest | null | undefined;
  className?: string;
  title?: string;
}) {
  if (!request) return null;
  const tone =
    request.status === "approved"
      ? "border-rag-green/40 bg-rag-green/10"
      : request.status === "rejected"
        ? "border-rag-red/40 bg-rag-red/10"
        : "border-rag-amber/40 bg-rag-amber/10";
  const textTone =
    request.status === "approved"
      ? "text-rag-green"
      : request.status === "rejected"
        ? "text-rag-red"
        : "text-rag-amber";
  const decided = request.approvers.filter((a) => a.decision !== "pending");

  return (
    <div className={`rounded-md border px-2.5 py-2 ${tone} ${className}`}>
      <div className={`flex items-center gap-1.5 text-[11px] font-medium ${textTone}`}>
        {request.status === "approved" ? <Check className="h-3 w-3" />
          : request.status === "rejected" ? <X className="h-3 w-3" />
          : <Clock className="h-3 w-3" />}
        {title ?? (
          request.status === "approved" ? "Approved in Approvals inbox"
          : request.status === "rejected" ? "Rejected in Approvals inbox"
          : `Waiting — ${request.approvers.filter((a) => a.decision === "approved").length}/${request.approvers.length} approved`
        )}
      </div>
      {decided.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {decided.map((a) => (
            <li key={a.id} className="text-[11px]">
              <span className="text-foreground">{a.name}</span>
              <span className="ml-1 text-muted-foreground">· {a.role}</span>
              <span className={`ml-1 ${a.decision === "approved" ? "text-rag-green" : "text-rag-red"}`}>
                {a.decision === "approved" ? "Approved" : "Rejected"}
                {a.decidedAt ? ` · ${a.decidedAt}` : ""}
              </span>
              {a.comment && (
                <div className="mt-0.5 rounded bg-background/40 px-1.5 py-1 text-[10px] text-muted-foreground">
                  Reason: {a.comment}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Most recent central request matching a type + reference key. */
export function findApprovalByRef(
  approvals: ApprovalRequest[],
  type: ApprovalRequest["type"],
  ref: string | undefined,
  projectId?: string,
) {
  if (!ref) return null;
  return (
    approvals.find(
      (a) => a.type === type && a.ref === ref && (projectId ? a.projectId === projectId : true),
    ) ?? null
  );
}