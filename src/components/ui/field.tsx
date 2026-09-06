import * as React from "react";
import { Info } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * DS02 form field wrapper — label (+ optional tag, info tooltip), control, hint / error.
 * Pass `error` to switch the control into its error state (set aria-invalid on the control too).
 */
interface FieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  info?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, required, optional, info, hint, error, className, children }: FieldProps) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  const control = React.isValidElement<Record<string, unknown>>(children)
    ? React.cloneElement(children, {
        ...(error ? { "aria-invalid": true } : {}),
        ...(errorId && error ? { "aria-describedby": errorId } : {}),
      })
    : children;

  return (
    <div className={cn("space-y-1.5", className)} data-field-invalid={error ? "true" : undefined}>
      {label ? (
        <div className="flex items-center gap-1.5">
          <label htmlFor={htmlFor} className="text-xs font-semibold text-foreground">
            {label}{required ? <span className="text-destructive" aria-hidden="true"> *</span> : null}
          </label>
          {optional ? <span className="text-[0.65rem] text-muted-foreground">(Optional)</span> : null}
          {info ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex cursor-help text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{info}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
      {control}
      {error ? (
        <p id={errorId} role="alert" className="text-[0.7rem]" style={{ color: "var(--field-error-fg)" }}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-[0.7rem]" style={{ color: "var(--field-hint-fg)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Input row with a trailing static unit / suffix label (e.g. "Minutes"). */
export function FieldSuffix({ children, suffix }: { children: React.ReactNode; suffix: string }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        {suffix}
      </span>
    </div>
  );
}
