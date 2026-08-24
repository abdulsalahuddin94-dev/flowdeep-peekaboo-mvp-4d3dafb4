import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "@/lib/icons";
import clockGears from "@/assets/empty/clock-gears.png";
import calendar from "@/assets/empty/calendar.png";
import searchQuestion from "@/assets/empty/search-question.png";
import people from "@/assets/empty/people.png";
import shieldCheck from "@/assets/empty/shield-check.png";
import mapPin from "@/assets/empty/map-pin.png";
import roleGear from "@/assets/empty/role-gear.png";
import noteGear from "@/assets/empty/note-gear.png";
import buildingGear from "@/assets/empty/building-gear.png";
import bell from "@/assets/empty/bell.png";

/*
 * DS02 empty state — one shared shape for every "nothing here yet" surface:
 * card, left text block (title + subtitle + CTA), 3D illustration on the right.
 */

export const EMPTY_ART = {
  clock: clockGears,
  calendar,
  search: searchQuestion,
  people,
  shield: shieldCheck,
  map: mapPin,
  role: roleGear,
  note: noteGear,
  building: buildingGear,
  bell,
} as const;

export type EmptyArt = keyof typeof EMPTY_ART;

export function EmptyState({
  art = "search",
  title,
  description,
  ctaLabel,
  onCta,
  actions,
  className,
}: {
  art?: EmptyArt;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-8 rounded-2xl border border-border bg-surface px-8 py-14 sm:flex-row sm:justify-center sm:gap-16 ${className ?? ""}`}
    >
      <div className="max-w-sm text-center sm:text-left">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        {(ctaLabel || actions) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {ctaLabel && (
              <Button onClick={onCta}>
                <Plus className="h-4 w-4" />
                {ctaLabel}
              </Button>
            )}
            {actions}
          </div>
        )}
      </div>
      <img
        src={EMPTY_ART[art]}
        alt=""
        aria-hidden
        loading="lazy"
        width={200}
        height={200}
        className="h-40 w-40 shrink-0 object-contain sm:h-48 sm:w-48"
      />
    </div>
  );
}
