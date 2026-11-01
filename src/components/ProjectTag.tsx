import { cn } from "@/lib/utils";

/**
 * Project tag: fully rounded pill in the tag's own color, matching the other
 * chips and status badges. `dimmed` is the unselected filter state; selecting the
 * filter (or showing it on a card) lights it up.
 */
export function ProjectTag({ name, color, dimmed = false, className }: { name: string; color?: string; dimmed?: boolean; className?: string }) {
  const style = color
    ? dimmed
      ? { color: `${color}99`, borderColor: `${color}33`, backgroundColor: `${color}0d` }
      : { color, borderColor: `${color}80`, backgroundColor: `${color}26` }
    : undefined;
  return (
    <span
      className={cn("inline-flex items-center whitespace-nowrap rounded-full border", !color && (dimmed ? "border-border text-muted-foreground" : "border-accent/50 text-accent"), className)}
      style={style}
    >
      {name}
    </span>
  );
}
