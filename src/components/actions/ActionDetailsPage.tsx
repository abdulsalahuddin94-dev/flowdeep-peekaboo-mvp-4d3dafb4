import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, DeleteAction, EditAction } from "@/lib/icons";
import { formatDateWithYear, formatDateTime } from "@/lib/date-format";
import { useCurrentUser, useProjects } from "@/lib/projects-store";
import {
  useActions, isActionOverdue, daysOverdue, ACTION_STATUSES,
  type ActionResponsibility, type ActionStatus, type ActionUpdate,
} from "@/lib/action-store";
import { useResponsibilities, respTone } from "@/lib/responsibility-store";
import { useOrgActive } from "@/lib/org-active";
import { STATUS_TONE, sourceLabel, T as actionT } from "@/components/actions/ActionTracker";
import { useBackNav } from "@/lib/record-pages";

const t = actionT.en;
const COMMENT_MAX = 500;

/**
 * Standalone Action details page. Details, editing, status updates and the
 * comment history all live here — no popup is stacked over a source drawer.
 */
export function ActionDetailsPage({ actionId, back }: { actionId: string; back?: string }) {
  const { actions, updateAction, removeAction, logActionUpdate, editActionUpdate, removeActionUpdate } = useActions();
  const { currentUser } = useCurrentUser();
  const { respTypes } = useResponsibilities();
  const { isActive } = useOrgActive("responsibility-type");
  const { projects } = useProjects();
  const navigate = useNavigate();
  const goBack = useBackNav();

  const a = actions.find((x) => x.id === actionId) ?? null;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", owner: "", responsibility: "" as ActionResponsibility, dueDate: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<ActionStatus>(a?.status ?? "Open");
  const [comment, setComment] = useState("");
  const [editingUpdate, setEditingUpdate] = useState<ActionUpdate | null>(null);
  const [updateComment, setUpdateComment] = useState("");
  const [pendingDelete, setPendingDelete] = useState(false);
  const [pendingDeleteUpdate, setPendingDeleteUpdate] = useState<ActionUpdate | null>(null);

  const fallback = { to: "/action-tracker" };

  if (!a) {
    return (
      <>
        <PageHeader title="Action details" subtitle={actionId} />
        <div className="glass-card flex flex-wrap items-center justify-between gap-4 p-6">
          <p className="text-sm text-muted-foreground">This action is no longer in the tracker — it may have been deleted.</p>
          <Button variant="outline" onClick={() => goBack(back, fallback)}><ArrowLeft size={15} />Back</Button>
        </div>
      </>
    );
  }

  const over = isActionOverdue(a);
  const sourceProject = projects.find((p) => p.name === a.project);
  const canSaveUpdate = comment.trim().length > 0 || status !== a.status;

  function startEdit() {
    setDraft({ title: a!.title, description: a!.description ?? "", owner: a!.owner, responsibility: a!.responsibility, dueDate: a!.dueDate });
    setErrors({});
    setEditing(true);
  }

  function saveEdit() {
    const next: Record<string, string> = {};
    if (!draft.title.trim()) next.title = "Action title is required";
    if (!draft.dueDate) next.dueDate = "Due date is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    updateAction(a!.id, {
      title: draft.title.trim().slice(0, 150),
      description: draft.description.trim().slice(0, 1000),
      owner: draft.owner.trim() || currentUser.name,
      responsibility: draft.responsibility,
      dueDate: draft.dueDate,
    });
    toast.success("Action updated");
    setEditing(false);
  }

  function saveUpdate() {
    if (!canSaveUpdate) return;
    logActionUpdate(a!.id, { comment: comment.trim().slice(0, COMMENT_MAX), by: currentUser.name, status });
    toast.success("Action updated");
    setComment("");
    setStatus(a!.status);
  }

  function saveCommentEdit() {
    if (!updateComment.trim()) return;
    editActionUpdate(a!.id, editingUpdate!.id, updateComment.trim().slice(0, COMMENT_MAX));
    toast.success("Comment updated");
    setEditingUpdate(null);
    setUpdateComment("");
  }

  function openSource() {
    if (a!.source === "Meeting" && a!.meetingId) {
      navigate({ to: "/meetings/$meetingId", params: { meetingId: a!.meetingId }, search: { back } });
      return;
    }
    if (a!.sourceRef && sourceProject) {
      navigate({
        to: "/portfolio/$projectId",
        params: { projectId: sourceProject.id },
        search: { tab: "Risk & Issues", ...(a!.source === "Risk" ? { risk: a!.sourceRef } : { issue: a!.sourceRef }) },
      });
      return;
    }
    navigate({ to: "/risks", search: { tab: a!.source === "Issue" ? "issues" : "register" } });
  }

  return (
    <>
      <PageHeader
        title={a.title}
        subtitle={`${a.id} · ${sourceLabel(a)}`}
        actions={
          <>
            <Button variant="outline" onClick={() => goBack(back, fallback)}><ArrowLeft size={15} />Back</Button>
            <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setPendingDelete(true)}>
              <DeleteAction size={15} />Delete
            </Button>
            {!editing && <Button variant="primary" onClick={startEdit}><EditAction size={15} />Edit</Button>}
          </>
        }
      />

      <dl className="glass-card grid items-stretch p-0 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { l: "Status", v: <Pill label={over ? "Overdue" : a.status} tone={STATUS_TONE[over ? "Overdue" : a.status]} /> },
          { l: t.responsibility, v: <Pill label={a.responsibility} tone={respTone(a.responsibility, respTypes)} /> },
          { l: "Owner", v: a.owner || "—" },
          {
            l: t.dueDate,
            v: <span className={cn(over && "text-rag-red")}>{formatDateWithYear(a.dueDate)}{over && <span className="ms-2 text-[11px]">{daysOverdue(a)}d overdue</span>}</span>,
          },
          { l: "Closed", v: formatDateWithYear(a.closedDate) },
        ].map((k, i) => (
          <div key={k.l} className={cn("flex min-w-0 flex-col justify-center border-border px-5 py-4", i < 4 && "border-b xl:border-b-0 xl:border-e")}>
            <dt className="label-eyebrow">{k.l}</dt>
            <dd className="mt-2 break-words text-sm font-medium text-foreground">{k.v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <section className="glass-card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground">Action</h2>
              {editing && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={saveEdit}>Save changes</Button>
                </div>
              )}
            </div>
            {editing ? (
              <div className="space-y-4">
                <Field label={t.actionPlaceholder} htmlFor="act-title" error={errors.title}>
                  <Input id="act-title" maxLength={150} value={draft.title}
                    onChange={(e) => { setDraft((d) => ({ ...d, title: e.target.value })); setErrors((x) => ({ ...x, title: "" })); }} />
                </Field>
                <Field label="Description" htmlFor="act-desc" optional>
                  <Textarea id="act-desc" maxLength={1000} value={draft.description}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} placeholder="What this action covers" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Owner" htmlFor="act-owner"><Input id="act-owner" maxLength={80} value={draft.owner} onChange={(e) => setDraft((d) => ({ ...d, owner: e.target.value }))} /></Field>
                  <Field label={t.responsibility}>
                    <Select value={draft.responsibility} onValueChange={(v) => setDraft((d) => ({ ...d, responsibility: v as ActionResponsibility }))}>
                      <SelectTrigger aria-label={t.responsibility}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {respTypes.filter((s) => isActive(s.name) || s.name === draft.responsibility).map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label={t.dueDate} error={errors.dueDate}><DatePicker value={draft.dueDate} onChange={(v) => { setDraft((d) => ({ ...d, dueDate: v })); setErrors((x) => ({ ...x, dueDate: "" })); }} /></Field>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-line text-sm text-muted-foreground">{a.description || "No description yet."}</p>
            )}
          </section>

          <section className="glass-card p-5">
            <h2 className="mb-4 text-base font-semibold text-foreground">{t.commentsUpdates}</h2>
            <div className="grid gap-3 rounded-lg border border-border bg-secondary/30 p-3 sm:grid-cols-[190px_minmax(0,1fr)]">
              <Field label="Status" className="min-w-0">
                <Select value={status} onValueChange={(v) => setStatus(v as ActionStatus)}>
                  <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Comment" htmlFor="act-new-comment" optional className="min-w-0">
                <Textarea id="act-new-comment" maxLength={COMMENT_MAX} value={comment}
                  onChange={(e) => setComment(e.target.value)} placeholder="What progressed on this action?" />
              </Field>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{t.commentTrackerHint}</p>
              <Button variant="primary" onClick={saveUpdate} disabled={!canSaveUpdate}>Save update</Button>
            </div>
            <div className="mt-5 space-y-3">
              {a.updates.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
              {a.updates.map((u) => editingUpdate?.id === u.id ? (
                <div key={u.id} className="rounded-lg border border-border bg-[var(--field-bg-filled)] p-3">
                  <Textarea aria-label="Edit comment" maxLength={COMMENT_MAX} value={updateComment} onChange={(e) => setUpdateComment(e.target.value)} />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingUpdate(null); setUpdateComment(""); }}>Cancel</Button>
                    <Button variant="primary" size="sm" disabled={!updateComment.trim()} onClick={saveCommentEdit}><Check size={14} />Save</Button>
                  </div>
                </div>
              ) : (
                <div key={u.id} className="rounded-lg border border-border bg-[var(--field-bg-filled)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-foreground">{u.by}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="num-mono text-[10px] text-muted-foreground">{formatDateTime(u.at)}</span>
                      <button type="button" aria-label="Edit comment" title="Edit comment"
                        className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={() => { setEditingUpdate(u); setUpdateComment(u.comment); }}><EditAction size={13} /></button>
                      <button type="button" aria-label="Delete comment" title="Delete comment"
                        className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setPendingDeleteUpdate(u)}><DeleteAction size={13} /></button>
                    </div>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{u.comment}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="glass-card p-5">
            <h2 className="mb-3 text-base font-semibold text-foreground">Source</h2>
            {a.source === "General" ? (
              <p className="text-sm text-muted-foreground">Logged directly in the Action Tracker.</p>
            ) : (
              <Button variant="outline" className="w-full justify-start" onClick={openSource}>
                <Pill label={a.source} tone="border-border bg-muted text-muted-foreground" />
                <span className="min-w-0 truncate text-sm">
                  {a.source === "Meeting" ? (a.meetingName ?? a.meetingId) : a.sourceRef}
                  {a.source === "Meeting" && a.meetingDate ? ` · ${formatDateWithYear(a.meetingDate)}` : ""}
                </span>
              </Button>
            )}
          </section>
          <section className="glass-card p-5">
            <h2 className="mb-3 text-base font-semibold text-foreground">Project</h2>
            <p className="break-words text-sm text-foreground">{a.project}</p>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={pendingDelete}
        onOpenChange={(o) => { if (!o) setPendingDelete(false); }}
        title="Delete this action?"
        description="The action and its comments will be permanently removed."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          removeAction(a.id);
          toast.success("Action deleted");
          setPendingDelete(false);
          goBack(back, fallback);
        }}
      />
      <ConfirmDialog
        open={!!pendingDeleteUpdate}
        onOpenChange={(o) => { if (!o) setPendingDeleteUpdate(null); }}
        title="Delete this comment?"
        description="The comment will be removed from the action history. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          if (pendingDeleteUpdate) {
            removeActionUpdate(a.id, pendingDeleteUpdate.id);
            toast.success("Comment deleted");
          }
          setPendingDeleteUpdate(null);
        }}
      />
    </>
  );
}
