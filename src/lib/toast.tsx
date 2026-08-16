/**
 * DS02 toast — two-line alert card (Title + message) with a leading Iconsax
 * icon, rendered as a sonner custom toast so the layout is fully controlled.
 * Drop-in replacement for `import { toast } from "sonner"`.
 */
import { toast as sonnerToast, type ExternalToast } from "sonner";
import { InfoCircle, TickCircle, Warning2, CloseCircle } from "iconsax-react";
import { X } from "@/lib/icons";
import type { ReactNode } from "react";

type Kind = "info" | "success" | "warning" | "error";

const KINDS: Record<Kind, { label: string; Icon: typeof InfoCircle; bg: string; border: string; title: string; subtitle: string }> = {
  info:    { label: "Information", Icon: InfoCircle,   bg: "var(--toast-info-bg)",    border: "var(--toast-info-border)",    title: "var(--toast-info-title)",    subtitle: "var(--toast-info-subtitle)" },
  success: { label: "Success",     Icon: TickCircle,   bg: "var(--toast-success-bg)", border: "var(--toast-success-border)", title: "var(--toast-success-title)",    subtitle: "var(--toast-success-subtitle)" },
  warning: { label: "Warning",     Icon: Warning2,     bg: "var(--toast-warning-bg)", border: "var(--toast-warning-border)", title: "var(--toast-warning-title)",    subtitle: "var(--toast-warning-subtitle)" },
  error:   { label: "Error",       Icon: CloseCircle,  bg: "var(--toast-error-bg)",   border: "var(--toast-error-border)",   title: "var(--toast-error-title)",    subtitle: "var(--toast-error-subtitle)" },
};

type Opts = ExternalToast & { title?: ReactNode };

function ToastCard({ kind, title, message, onClose }: { kind: Kind; title: ReactNode; message: ReactNode; onClose: () => void }) {
  const c = KINDS[kind];
  const { Icon } = c;
  return (
    <div
      className="flex w-full items-start gap-3 rounded-lg border px-5 py-3.5"
      style={{ background: c.bg, borderColor: c.border, color: "var(--toast-fg)" }}
    >
      <Icon size={24} variant="Outline" color={c.title} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold leading-tight" style={{ color: c.title }}>{title}</div>
        <div className="mt-0.5 text-sm leading-snug opacity-95">{message}</div>
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="mt-0.5 shrink-0 opacity-75 transition-opacity hover:opacity-100"
      >
        <X className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

function show(kind: Kind, message: ReactNode, opts?: Opts) {
  const { title, ...rest } = opts ?? {};
  return sonnerToast.custom(
    (id) => (
      <ToastCard
        kind={kind}
        title={title ?? KINDS[kind].label}
        message={message}
        onClose={() => sonnerToast.dismiss(id)}
      />
    ),
    { unstyled: true, classNames: { toast: "w-full" }, ...rest },
  );
}

export const toast = Object.assign(
  (message: ReactNode, opts?: Opts) => show("info", message, opts),
  {
    info: (m: ReactNode, o?: Opts) => show("info", m, o),
    success: (m: ReactNode, o?: Opts) => show("success", m, o),
    warning: (m: ReactNode, o?: Opts) => show("warning", m, o),
    error: (m: ReactNode, o?: Opts) => show("error", m, o),
    message: (m: ReactNode, o?: Opts) => show("info", m, o),
    custom: sonnerToast.custom,
    loading: sonnerToast.loading,
    promise: sonnerToast.promise,
    dismiss: sonnerToast.dismiss,
  },
);
