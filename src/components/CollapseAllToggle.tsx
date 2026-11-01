import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Table-header toggle that collapses every expandable row at once (like Figma's
 * "collapse layers"). While any row is open it collapses all; once everything is
 * collapsed the icon flips and the next click expands all.
 */
export function CollapseAllToggle({ anyExpanded, onCollapseAll, onExpandAll, disabled, className }: {
  anyExpanded: boolean;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const label = anyExpanded ? "Collapse all" : "Expand all";
  const Icon = anyExpanded ? ChevronsDownUp : ChevronsUpDown;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); if (anyExpanded) onCollapseAll(); else onExpandAll(); }}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
