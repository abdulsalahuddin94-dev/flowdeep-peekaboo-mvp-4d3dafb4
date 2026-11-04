import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
  prevLabel: string;
  nextLabel: string;
  className?: string;
};

/**
 * Chevrons around a fixed-width label. The label box never shrinks to the text,
 * so the control occupies the exact same coordinates wherever it is rendered.
 */
export function PeriodStepper({ label, onPrev, onNext, prevDisabled, nextDisabled, prevLabel, nextLabel, className }: Props) {
  const btn = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30";
  return (
    <div className={cn("flex shrink-0 items-center gap-2", className)}>
      <button type="button" aria-label={prevLabel} disabled={prevDisabled} onClick={onPrev} className={btn}>
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
      </button>
      <span className="min-w-28 text-center text-sm font-semibold tabular-nums">{label}</span>
      <button type="button" aria-label={nextLabel} disabled={nextDisabled} onClick={onNext} className={btn}>
        <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
      </button>
    </div>
  );
}

/** Monthly / Yearly segmented pill used by the work calendar. */
export function ViewToggle({ view, onView, labels }: { view: "monthly" | "yearly"; onView: (v: "monthly" | "yearly") => void; labels: { monthly: string; yearly: string } }) {
  return (
    <div className="inline-flex h-9 shrink-0 rounded-lg border border-border p-0.5" role="tablist">
      {(["monthly", "yearly"] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={view === v}
          onClick={() => onView(v)}
          className={cn("rounded-md px-3 text-sm transition-colors", view === v ? "bg-accent/20 text-accent" : "text-muted-foreground hover:text-foreground")}
        >
          {labels[v]}
        </button>
      ))}
    </div>
  );
}
