"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Earliest selectable date (ISO yyyy-MM-dd). */
  min?: string;
  /** Latest selectable date (ISO yyyy-MM-dd). */
  max?: string;
  className?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "mm/dd/yyyy",
  disabled,
  min,
  max,
  className,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState("");
  const resolvedValue = value ?? internalValue;
  const date = resolvedValue ? parseISO(resolvedValue) : undefined;

  const handleSelect = (d: Date | undefined) => {
    const nextValue = d ? format(d, "yyyy-MM-dd") : "";
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value === undefined) setInternalValue("");
    onChange?.("");
  };

  const handleToday = () => {
    const nextValue = format(new Date(), "yyyy-MM-dd");
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
    setOpen(false);
  };

  const disabledMatcher = React.useCallback(
    (d: Date) => {
      if (min && d < parseISO(min)) return true;
      if (max && d > parseISO(max)) return true;
      return false;
    },
    [min, max],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          data-ui="control"
          className={cn(
            "w-full justify-between bg-transparent px-3 font-normal",
            !resolvedValue && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {date ? format(date, "MMM d, yyyy") : placeholder}
          </span>
          {date ? (
            <span
              role="button"
              aria-label="Clear date"
              onClick={handleClear}
              className="hover:text-destructive -mr-1 rounded p-1"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : (
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden border-border bg-popover p-0 pointer-events-auto shadow-lg" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          disabled={disabledMatcher}
          className="pointer-events-auto"
        />
        <div className="flex items-center justify-between border-t border-border px-3 py-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 px-0 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToday}
            disabled={disabledMatcher(new Date())}
            className="h-8 px-0 text-xs font-semibold text-accent hover:bg-transparent hover:text-accent"
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
