import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "@/lib/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  picker?: Picker;
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Picker =
  | { mode: "year"; years: string[]; year: string; onSelect: (year: string) => void }
  | { mode: "month"; years: string[]; year: string; month: number; onSelect: (year: string, month: number) => void };

/** Popover behind the stepper label: a year grid, or a month grid with its own year navigation. */
function PeriodPicker({ label, picker }: { label: string; picker: Picker }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(picker.year);
  const [yearsOpen, setYearsOpen] = useState(picker.mode === "year");
  useEffect(() => { if (open) { setViewYear(picker.year); setYearsOpen(picker.mode === "year"); } }, [open, picker.year, picker.mode]);
  const years = picker.years.includes(viewYear) ? picker.years : [...picker.years, viewYear].sort();
  const vi = years.indexOf(viewYear);
  const cell = "h-9 rounded-full text-sm transition-colors hover:bg-muted";
  const active = "bg-accent/30 text-foreground hover:bg-accent/30";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex min-w-28 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-semibold tabular-nums hover:text-foreground" aria-haspopup="dialog">
          {label}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" disabled={picker.mode === "year"} onClick={() => setYearsOpen((v) => !v)} className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold hover:bg-muted disabled:pointer-events-none">
            {picker.mode === "month" ? `${new Date(Number(viewYear), picker.month, 1).toLocaleDateString("en-US", { month: "long" })} ${viewYear}` : viewYear}
            {picker.mode === "month" && <ChevronDown className={cn("h-4 w-4 transition-transform", yearsOpen && "rotate-180")} aria-hidden />}
          </button>
          {!yearsOpen && (
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Previous year" disabled={vi <= 0} onClick={() => setViewYear(years[vi - 1] ?? viewYear)} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></button>
              <button type="button" aria-label="Next year" disabled={vi >= years.length - 1} onClick={() => setViewYear(years[vi + 1] ?? viewYear)} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {yearsOpen
            ? years.map((y) => (
                <button key={y} type="button" className={cn(cell, y === viewYear && active)} onClick={() => {
                  if (picker.mode === "year") { picker.onSelect(y); setOpen(false); } else { setViewYear(y); setYearsOpen(false); }
                }}>{y}</button>
              ))
            : picker.mode === "month" && MONTHS.map((m, i) => (
                <button key={m} type="button" className={cn(cell, viewYear === picker.year && i === picker.month && active)} onClick={() => { picker.onSelect(viewYear, i); setOpen(false); }}>{m}</button>
              ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}


/**
 * Chevrons around a fixed-width label. The label box never shrinks to the text,
 * so the control occupies the exact same coordinates wherever it is rendered.
 */
export function PeriodStepper({ label, onPrev, onNext, prevDisabled, nextDisabled, prevLabel, nextLabel, className, picker }: Props) {
  const btn = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30";
  return (
    <div className={cn("flex shrink-0 items-center gap-2", className)}>
      <button type="button" aria-label={prevLabel} disabled={prevDisabled} onClick={onPrev} className={btn}>
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
      </button>
      {picker ? <PeriodPicker label={label} picker={picker} /> : <span className="min-w-28 text-center text-sm font-semibold tabular-nums">{label}</span>}
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
