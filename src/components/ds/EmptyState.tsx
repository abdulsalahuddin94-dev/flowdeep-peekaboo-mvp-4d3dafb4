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
import briefcase from "@/assets/empty/briefcase.png";
import coins from "@/assets/empty/coins.png";
import tag from "@/assets/empty/tag.png";
import handshake from "@/assets/empty/handshake.png";

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
  briefcase,
  coins,
  tag,
  handshake,
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
  variant = "default",
}: {
  art?: EmptyArt;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  actions?: ReactNode;
  className?: string;
  variant?: "default" | "card";
}) {
  const isCard = variant === "card";
  return (
    <div
      className={`${isCard
        ? "flex min-h-32 items-center justify-center gap-5 py-2"
        : "flex flex-col items-center gap-8 rounded-2xl border border-border bg-surface px-8 py-14 sm:flex-row sm:justify-center sm:gap-16"
      } ${className ?? ""}`}
    >
      <div className={isCard ? "max-w-64" : "max-w-sm text-center sm:text-left"}>
        <h2 className={isCard ? "text-sm font-semibold text-foreground" : "text-xl font-semibold text-foreground"}>{title}</h2>
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
        className={isCard ? "h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24" : "h-40 w-40 shrink-0 object-contain sm:h-48 sm:w-48"}
      />
    </div>
  );
}
