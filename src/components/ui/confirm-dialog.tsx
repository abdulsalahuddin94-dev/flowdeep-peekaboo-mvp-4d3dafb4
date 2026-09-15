import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Info, AlertTriangle, Trash2, X } from "@/lib/icons";

/**
 * DS02 confirmation popup — success / info / warning / danger.
 * Single source of truth for every confirm/destructive prompt in the app.
 */
export type ConfirmTone = "success" | "info" | "warning" | "danger";

const TONES: Record<
  ConfirmTone,
  {
    Icon: React.ComponentType<{ className?: string; size?: number }>;
    surface: string;
    ring: string;
    icon: string;
    confirmVariant: "primary" | "warning" | "danger";
  }
> = {
  success: {
    Icon: CheckCircle2,
    surface: "var(--confirm-success-surface)",
    ring: "var(--confirm-success-ring)",
    icon: "var(--confirm-success-icon)",
    confirmVariant: "primary",
  },
  info: {
    Icon: Info,
    surface: "var(--confirm-info-surface)",
    ring: "var(--confirm-info-ring)",
    icon: "var(--confirm-info-icon)",
    confirmVariant: "primary",
  },
  warning: {
    Icon: AlertTriangle,
    surface: "var(--confirm-warning-surface)",
    ring: "var(--confirm-warning-ring)",
    icon: "var(--confirm-warning-icon)",
    confirmVariant: "warning",
  },
  danger: {
    Icon: Trash2,
    surface: "var(--confirm-danger-surface)",
    ring: "var(--confirm-danger-ring)",
    icon: "var(--confirm-danger-icon)",
    confirmVariant: "danger",
  },
};

export function ConfirmIcon({
  tone,
  className,
  icon: IconOverride,
}: {
  tone: ConfirmTone;
  className?: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
}) {
  const t = TONES[tone];
  const Icon = IconOverride ?? t.Icon;
  return (
    <span
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-full border",
        className,
      )}
      style={{ background: t.surface, borderColor: t.ring, color: t.icon }}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tone?: ConfirmTone;
  title: string;
  /** Override the tone icon (e.g. toggle icon for activate/deactivate). */
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  description?: React.ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  /** Hide the secondary/cancel action (single-action acknowledgement popups). */
  hideCancel?: boolean;
  loading?: boolean;
  onConfirm?: () => void | Promise<void>;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  tone = "info",
  title,
  icon,
  description,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  hideCancel = false,
  loading = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const t = TONES[tone];
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-modal border border-modal-border bg-modal-bg p-7 text-center shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute right-4 top-4 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={22} />
          </DialogPrimitive.Close>

          <div className="flex flex-col items-center gap-3">
            <ConfirmIcon tone={tone} icon={icon} />
            <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>

          {children ? <div className="mt-4 text-left">{children}</div> : null}

          <div className="mt-6 flex items-center justify-center gap-3">
            {!hideCancel && (
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                {cancelLabel}
              </Button>
            )}
            <Button
              variant={t.confirmVariant}
              disabled={loading}
              onClick={async () => {
                await onConfirm?.();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
