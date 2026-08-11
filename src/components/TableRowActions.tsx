import { Button } from "@/components/ui/button";
import { EditAction, DeleteAction, Power } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * Standard table row actions (DS02): circular Edit + Delete buttons that appear
 * on row hover. Icons come from Iconsax (Edit-2 / Trash).
 * Place inside a `<TableCell>` of a row rendered by `TableRow` (which sets `group`).
 */
export function TableRowActions({
  onEdit,
  onDelete,
  onToggleActive,
  isActive = true,
  editLabel = "Edit",
  deleteLabel = "Delete",
  deleteDisabled,
  alwaysVisible,
  className,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
  isActive?: boolean;
  editLabel?: string;
  deleteLabel?: string;
  deleteDisabled?: boolean;
  alwaysVisible?: boolean;
  className?: string;
}) {
  const visibility = alwaysVisible
    ? ""
    : "opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100";
  return (
    <div className={cn("flex justify-end gap-2", visibility, className)}>
      {onEdit && (
        <Button
          type="button"
          aria-label={editLabel}
          size="icon"
          variant="secondary"
          data-ds-size="auto"
          onClick={onEdit}
          className="h-9 w-9 shrink-0 rounded-full border border-border/60 !bg-[var(--btn-secondary-bg)] text-accent-secondary hover:!bg-[var(--btn-secondary-bg-hover)]"
        >
          <EditAction size={16} />
        </Button>
      )}
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
            "h-9 w-9 shrink-0 rounded-full border border-border/60 !bg-[var(--btn-secondary-bg)] hover:!bg-[var(--btn-secondary-bg-hover)]",
            isActive ? "text-rag-amber" : "text-rag-green",
          )}
        >
          <Power className="h-4 w-4" />
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
          className="h-9 w-9 shrink-0 rounded-full border border-border/60 !bg-[var(--btn-secondary-bg)] text-rag-red hover:!bg-[var(--btn-secondary-bg-hover)]"
        >
          <DeleteAction size={16} />
        </Button>
      )}
    </div>
  );
}

export default TableRowActions;
