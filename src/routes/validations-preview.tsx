// TEMPORARY design-handoff page: static copies of every Save-baseline validation popup for Figma. Delete when done.
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmIcon, type ConfirmTone } from "@/components/ui/confirm-dialog";
import { AlertTriangle, X } from "@/lib/icons";

export const Route = createFileRoute("/validations-preview")({
  head: () => ({
    meta: [
      { title: "Save baseline validations (temporary) · Nexus PMO" },
      { name: "description", content: "Temporary gallery of Save baseline validation popups." },
      { property: "og:title", content: "Save baseline validations (temporary)" },
      { property: "og:description", content: "Temporary gallery of Save baseline validation popups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Popup({ label, tone, title, description, cancel = "Cancel", confirm, children, confirmDisabled }: {
  label: string; tone: ConfirmTone; title: string; description: string; cancel?: string; confirm: string; children?: ReactNode; confirmDisabled?: boolean;
}) {
  const variant = tone === "warning" ? "warning" : tone === "danger" ? "danger" : "primary";
  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="relative w-[448px] rounded-modal border border-modal-border bg-modal-bg p-7 text-center shadow-lg">
        <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center text-muted-foreground"><X className="h-7 w-7" /></span>
        <div className="flex flex-col items-center gap-3">
          <ConfirmIcon tone={tone} />
          <div className="text-lg font-semibold text-foreground">{title}</div>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {children ? <div className="mt-4 space-y-2 text-left">{children}</div> : null}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="secondary">{cancel}</Button>
          <Button variant={variant} disabled={confirmDisabled}>{confirm}</Button>
        </div>
      </div>
    </div>
  );
}

function Issue({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <AlertTriangle size={14} className="shrink-0 text-rag-amber" />{title}
      </div>
      {children}
    </div>
  );
}
const Fix = ({ children }: { children: ReactNode }) => <p className="mt-2 text-xs text-muted-foreground">How to fix: {children}</p>;
const T = ({ children }: { children: ReactNode }) => <span className="text-foreground">{children}</span>;
const Amounts = ({ kind, a, b, d }: { kind: string; a: string; b: string; d: string }) => (
  <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
    <span>Project {kind}: <span className="num-mono text-foreground">{a}</span></span>
    <span>Planned total: <span className="num-mono text-foreground">{b}</span></span>
    <span>Difference: <span className="num-mono text-foreground">{d}</span></span>
  </div>
);

const NoChanges = () => <Issue title="No changes were made to the plan yet"><Fix>edit the schedule, cost, revenue or basic info before saving a new baseline.</Fix></Issue>;
const NoSchedule = () => <Issue title="The project schedule has no items yet"><Fix>create at least one milestone or task with <T>Add Item</T> on the <T>Project Schedule</T> tab.</Fix></Issue>;
const Budget = () => <Issue title="Project budget doesn't equal the planned cost total"><Amounts kind="budget" a="$2.4M" b="$2.1M" d="$300K" /><Fix>adjust the planned amounts on the <T>Cost Breakdown</T> tab.</Fix></Issue>;
const Revenue = () => <Issue title="Project revenue doesn't equal the planned revenue total"><Amounts kind="revenue" a="$3.2M" b="$2.8M" d="$400K" /><Fix>adjust the planned amounts on the <T>Revenue Breakdown</T> tab.</Fix></Issue>;
const Circular = () => <Issue title="Schedule has circular dependencies"><p className="mt-1.5 text-xs text-muted-foreground">Items: <T>Design review, Build phase, UAT</T></p><Fix>remove one of the dependencies that loops back to an earlier item on the <T>Project Schedule</T> tab.</Fix></Issue>;
const Dates = () => <Issue title="Some items fall outside the project's start and end dates"><p className="mt-1.5 text-xs text-muted-foreground">Items: <T>Kickoff, Go-live</T></p><Fix>move these items inside 2026-01-15 – 2026-06-15 on the <T>Project Schedule</T> tab.</Fix></Issue>;

const FIX = { tone: "warning" as const, title: "Fix before saving the baseline", description: "Resolve these items before the baseline can be saved." };

function Page() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Save baseline validations (temporary)</h1>
        <p className="text-sm text-muted-foreground">Static copies for Figma. Delete this page when done.</p>
      </div>
      <div className="flex flex-wrap items-start gap-8">
        <Popup label="1 · Confirmation (no issues)" tone="info" title="Save a new baseline?" description="This will be the active baseline once it's approved. Current version will be the available version until approval." confirm="Save baseline" />
        <Popup label="2 · No changes" {...FIX} confirm="Go to Project Schedule"><NoChanges /></Popup>
        <Popup label="3 · No schedule items" {...FIX} confirm="Go to Project Schedule"><NoSchedule /></Popup>
        <Popup label="4 · Cost ≠ budget" {...FIX} confirm="Go to Cost Breakdown"><Budget /></Popup>
        <Popup label="5 · Revenue ≠ expected (external)" {...FIX} confirm="Go to Revenue Breakdown"><Revenue /></Popup>
        <Popup label="6 · Circular dependencies" {...FIX} confirm="Go to Project Schedule"><Circular /></Popup>
        <Popup label="7 · Items outside project dates" {...FIX} confirm="Go to Project Schedule"><Dates /></Popup>
        <Popup label="8 · Several issues at once" {...FIX} confirm="Go to Project Schedule"><Circular /><Dates /><Budget /><Revenue /></Popup>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">9 · Approval blocked (Change request review)</div>
          <div className="w-[448px] space-y-4 rounded-modal border border-modal-border bg-modal-bg p-6">
            <div><div className="text-lg font-semibold text-foreground">Approve request</div><div className="text-sm text-muted-foreground">Baseline v5 · ERP System Upgrade</div></div>
            <div className="rounded-md border border-rag-red/40 bg-rag-red/10 px-4 py-3">
              <div className="text-sm font-medium text-rag-red">Approval blocked</div>
              <p className="mt-1 text-sm text-foreground">This change request conflicts with progress recorded after submission. The requester needs to resubmit.</p>
              <p className="mt-1 text-xs text-muted-foreground">Affected items: Data migration</p>
            </div>
            <div className="flex justify-end gap-3"><Button variant="secondary">Cancel</Button><Button disabled>Approve</Button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
