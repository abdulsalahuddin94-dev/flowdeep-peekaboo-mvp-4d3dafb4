import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { X } from "@/lib/icons";
import { Button } from "@/components/ui/button";

/**
 * DS02 standard popup — the default shape/style for ANY dialog that is not
 * one of the four toned confirm popups (success / info / warning / danger).
 *
 * Anatomy (fixed):
 *   bold left-aligned title  ·  large ✕ top-right
 *   body (form fields, lists, content) — left aligned, gap-5
 *   footer: primary and secondary actions aligned to the bottom-right,
 *           dark secondary (cancel) then primary (submit). Buttons do not fill width.
 *           Popup Cancel actions are never white.
 */
export type FormDialogSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<FormDialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  size?: FormDialogSize;
  cancelLabel?: string;
  submitLabel?: string;
  /** Hide the footer entirely (content supplies its own actions). */
  hideFooter?: boolean;
  submitDisabled?: boolean;
  loading?: boolean;
  onSubmit?: () => void | Promise<void>;
  /** Render the body inside a <form> so Enter submits. */
  asForm?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  cancelLabel = "Cancel",
  submitLabel = "Save",
  hideFooter = false,
  submitDisabled = false,
  loading = false,
  onSubmit,
  asForm = true,
  className,
  children,
}: FormDialogProps) {
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await onSubmit?.();
  };

  const body = (
    <>
      <div className="flex flex-col gap-5 text-left">{children}</div>
      {!hideFooter && (
        <div className="mt-7 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type={asForm ? "submit" : "button"}
            variant="primary"
            disabled={submitDisabled || loading}
            onClick={asForm ? undefined : () => submit()}
          >
            {submitLabel}
          </Button>
        </div>
      )}
    </>
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-modal border border-modal-border bg-modal-bg p-7 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            SIZES[size],
            className,
          )}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <DialogPrimitive.Title className="text-xl font-semibold text-foreground">
                {title}
              </DialogPrimitive.Title>
              {/* DS02: popup subtitles are not displayed — kept for a11y only. */}
              <DialogPrimitive.Description className="sr-only">
                {description ?? `${title} dialog`}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="-mr-1 -mt-1 cursor-pointer text-foreground/80 transition-colors hover:text-foreground"
            >
              <X size={22} />
            </DialogPrimitive.Close>
          </div>

          {asForm ? <form onSubmit={submit}>{body}</form> : body}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
