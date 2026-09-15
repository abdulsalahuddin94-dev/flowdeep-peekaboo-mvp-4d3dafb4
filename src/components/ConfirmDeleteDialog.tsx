import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * DS02 delete-confirmation popup: opens whenever `label` is set (the name of the
 * thing about to be deleted), closes on cancel. Shared across master-data tables
 * and project-plan rows so every delete confirmation looks and behaves the same.
 */
export function ConfirmDeleteDialog({
  label,
  onCancel,
  onConfirm,
  description = "This entry will be removed.",
}: {
  label?: string;
  onCancel: () => void;
  onConfirm: () => void;
  description?: string;
}) {
  return (
    <ConfirmDialog
      open={!!label}
      onOpenChange={(o) => !o && onCancel()}
      tone="danger"
      title={`Delete "${label}"?`}
      description={description}
      cancelLabel="Cancel"
      confirmLabel="Delete"
      onConfirm={onConfirm}
    />
  );
}

export default ConfirmDeleteDialog;
