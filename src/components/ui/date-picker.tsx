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
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const date = value ? parseISO(value) : undefined;

  const handleSelect = (d: Date | undefined) => {
    onChange?.(d ? format(d, "yyyy-MM-dd") : "");
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
  };

  const handleToday = () => {
    onChange?.(format(new Date(), "yyyy-MM-dd"));
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
          data-ui="control"
          className={cn(
            "w-full justify-between bg-transparent px-3 font-normal",
            !value && "text-muted-foreground",
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
      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          disabled={disabledMatcher}
          className="pointer-events-auto"
        />
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <button
            type="button"
            onClick={() => onChange?.("")}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="text-xs font-medium text-accent transition-colors hover:text-accent-foreground"
          >
            Today
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
