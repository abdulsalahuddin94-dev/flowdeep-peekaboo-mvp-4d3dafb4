import * as React from "react";
import { Check, ChevronDown, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectFieldProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** Chips shown before collapsing into "+N". */
  maxVisible?: number;
  id?: string;
  className?: string;
}

/** DS02 multiple-selection field — chips with per-chip remove, "+N" overflow and clear-all. */
export function MultiSelectField({
  options,
  value,
  onChange,
  placeholder = "Select…",
  disabled,
  invalid,
  maxVisible = 5,
  id,
  className,
}: MultiSelectFieldProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.filter((o) => value.includes(o.value));
  const visible = selected.slice(0, maxVisible);
  const overflow = selected.length - visible.length;

  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          data-ui="control"
          data-state={open ? "open" : "closed"}
          data-filled={selected.length > 0 ? "true" : undefined}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className={cn(
            "flex w-full items-center gap-1.5 px-2 text-sm",
            selected.length === 0 && "px-3",
            className,
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {visible.map((o) => (
                  <span
                    key={o.value}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                    style={{ background: "var(--field-chip-bg)", color: "var(--field-chip-fg)" }}
                  >
                    {o.label}
                    <span
                      role="button"
                      tabIndex={-1}
                      aria-label={`Remove ${o.label}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(o.value);
                      }}
                      className="inline-flex cursor-pointer items-center opacity-70 hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </span>
                ))}
                {overflow > 0 ? (
                  <span
                    className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs"
                    style={{ background: "var(--field-chip-bg)", color: "var(--field-chip-fg)" }}
                  >
                    +{overflow}
                  </span>
                ) : null}
              </>
            )}
          </span>
          {selected.length > 0 ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear all"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="inline-flex cursor-pointer items-center text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : null}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-1">
        <div className="max-h-60 overflow-y-auto">
          {options.map((o) => {
            const active = value.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary/60"
              >
                <span>{o.label}</span>
                {active ? <Check className="h-4 w-4 text-accent" /> : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
