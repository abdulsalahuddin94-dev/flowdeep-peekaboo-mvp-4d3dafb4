import { Button } from "@/components/ui/button";
import { EditAction, DeleteAction, ToggleActive } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Active / Inactive status pill (DS02): outlined green when active, amber when not. */
export function StatusPill({ isActive, label, className }: { isActive: boolean; label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full border px-3 text-xs font-medium",
        isActive
          ? "border-rag-green/60 bg-rag-green/10 text-rag-green"
          : "border-rag-amber/60 bg-rag-amber/10 text-rag-amber",
        className,
      )}
    >
      {label ?? (isActive ? "Active" : "Inactive")}
    </span>
  );
}

/**
 * Standard table row actions (DS02): circular Edit + Delete buttons that appear
 * on row hover. When the row supports deactivate/reactivate, the cell shows the
 * Active/Inactive status pill at rest and swaps to the actions on hover.
 * Place inside a `<TableCell>` of a row rendered by `TableRow` (which sets `group`).
 */
export function TableRowActions({
  onStatus,
  statusIcon,
  statusLabel = "Update status",
  onEdit,
  onDelete,
  onToggleActive,
  isActive = true,
  editLabel = "Edit",
  deleteLabel = "Delete",
  deleteDisabled,
  alwaysVisible,
  showStatus,
  extraActions,
  className,
}: {
  onStatus?: () => void;
  statusIcon?: ReactNode;
  statusLabel?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
  isActive?: boolean;
  editLabel?: string;
  deleteLabel?: string;
  deleteDisabled?: boolean;
  alwaysVisible?: boolean;
  showStatus?: boolean;
  /** Extra row-specific buttons (e.g. "Add actual") rendered between Edit and Delete. */
  extraActions?: ReactNode;
  className?: string;
}) {
  const withStatus = (showStatus ?? !!onToggleActive) && !alwaysVisible;
  // DS02: status columns are always centered so the pill and the hover actions
  // share the same optical center; action-only columns stay right-aligned.
  const align = withStatus ? "justify-center" : "justify-end";
  const visibility = alwaysVisible
    ? ""
    : withStatus
      ? "hidden group-hover:flex group-focus-within:flex"
      : "opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100";
  return (
    <div className={cn("relative h-9 min-w-32 flex items-center", align)}>
      {withStatus && (
        <div className="flex h-7 items-center justify-center group-hover:hidden group-focus-within:hidden">
          <StatusPill isActive={isActive} />
        </div>
      )}
      <div className={cn("flex h-9 items-center gap-1.5", align, visibility, className)}>
        {onStatus && (
          <Button
            type="button"
            aria-label={statusLabel}
            title={statusLabel}
            size="icon"
            variant="secondary"
            data-ds-size="auto"
            onClick={onStatus}
            className="h-9 w-9 shrink-0 rounded-lg border border-border/60 !bg-[var(--btn-secondary-bg)] text-accent-secondary hover:!bg-[var(--btn-secondary-bg-hover)]"
          >
            {statusIcon}
          </Button>
        )}
        {onEdit && (
          <Button
            type="button"
            aria-label={editLabel}
            size="icon"
            variant="secondary"
            data-ds-size="auto"
            onClick={onEdit}
            className="h-9 w-9 shrink-0 rounded-lg border border-border/60 !bg-[var(--btn-secondary-bg)] text-accent-secondary hover:!bg-[var(--btn-secondary-bg-hover)]"
          >
            <EditAction size={16} />
          </Button>
        )}
        {extraActions}
        {onToggleActive && (
          <Button
            type="button"
            aria-label={isActive ? "Deactivate" : "Activate"}
            title={isActive ? "Deactivate" : "Activate"}
            size="icon"
            variant="secondary"
            data-ds-size="auto"
            onClick={onToggleActive}
            className={cn(
              "h-9 w-9 shrink-0 rounded-lg border border-border/60 !bg-[var(--btn-secondary-bg)] hover:!bg-[var(--btn-secondary-bg-hover)]",
              isActive ? "text-rag-green" : "text-muted-foreground",
            )}
          >
            <ToggleActive className={cn("h-5 w-5", !isActive && "-scale-x-100")} />
          </Button>
        )}
        {onDelete && (
          <Button
            type="button"
            aria-label={deleteLabel}
            size="icon"
            variant="secondary"
            data-ds-size="auto"
            disabled={deleteDisabled}
            onClick={onDelete}
            className="h-9 w-9 shrink-0 rounded-lg border border-border/60 !bg-[var(--btn-secondary-bg)] text-rag-red hover:!bg-[var(--btn-secondary-bg-hover)]"
          >
            <DeleteAction size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}

export default TableRowActions;
