"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@/lib/icons";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar w-[276px] bg-transparent p-3 [--cell-size:2.25rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex w-full flex-col gap-5 md:flex-row md:gap-8", defaultClassNames.months),
        month: cn("flex min-w-0 flex-1 flex-col gap-3", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex h-9 w-full items-center justify-between gap-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-9 w-9 select-none rounded-md p-0 text-foreground hover:bg-secondary aria-disabled:opacity-40",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-9 w-9 select-none rounded-md p-0 text-foreground hover:bg-secondary aria-disabled:opacity-40",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-9 w-full items-center justify-center px-9",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn("bg-popover absolute inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-semibold text-foreground",
          captionLayout === "label"
             ? "text-sm"
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label,
        ),
        month_grid: cn("w-full table-fixed border-collapse", defaultClassNames.month_grid),
        weekdays: cn("grid w-full grid-cols-7 pt-1", defaultClassNames.weekdays),
        weekday: cn(
          "flex h-(--cell-size) w-full select-none items-center justify-center text-center text-xs font-medium text-muted-foreground",
          defaultClassNames.weekday,
        ),
        weeks: cn("w-full", defaultClassNames.weeks),
        week: cn("mt-1 grid w-full grid-cols-7", defaultClassNames.week),
        week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day relative h-(--cell-size) w-full select-none p-0 text-center",
          defaultClassNames.day,
        ),
        // Range band geometry is handled entirely on the DayButton (the visible
        // layer that fills the cell). Leave the day <td> free of bg/rounding so
        // a single-day range (where start===end) doesn't get conflicting classes.
        range_start: cn(defaultClassNames.range_start),
        range_middle: cn(defaultClassNames.range_middle),
        range_end: cn(defaultClassNames.range_end),
        today: cn(
          "text-accent font-semibold",
          "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground/35 aria-selected:text-muted-foreground/50",
          defaultClassNames.outside,
        ),
        disabled: cn("text-muted-foreground/40 opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className={cn("size-4", className)} {...props} />;
          }

          if (orientation === "right") {
            return <ChevronRightIcon className={cn("size-4", className)} {...props} />;
          }

          return <ChevronDownIcon className={cn("size-4", className)} {...props} />;
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  // Compute range band geometry from modifiers in JS so a single-day range
  // (where range_start AND range_end are both true) doesn't get conflicting
  // Tailwind rounding classes applied via data-attributes.
  const isStart = !!modifiers.range_start;
  const isEnd = !!modifiers.range_end;
  const isMiddle = !!modifiers.range_middle;
  const isRange = isStart || isEnd || isMiddle;
  const sameDayRange = isStart && isEnd;
  const selectedSingle = modifiers.selected && !isRange;

  // Border radius is set via INLINE STYLE (not Tailwind utilities) because the
  // button's base `rounded-md` and the unlayered DS02 control baseline both
  // set individual corners and would otherwise bleed into the opposite side,
  // defeating the asymmetric range band. Inline style beats all stylesheet rules.
  //   start        → left 8px, right 0     "8px 0px 0px 8px"
  //   end          → right 8px, left 0     "0px 8px 8px 0px"
  //   middle       → square                "0px"
  //   single / same-day → all 8px          "8px"
  let radiusStyle: React.CSSProperties;
  if (isRange && !sameDayRange) {
    if (isStart) radiusStyle = { borderRadius: "8px 0px 0px 8px" };
    else if (isEnd) radiusStyle = { borderRadius: "0px 8px 8px 0px" };
    else radiusStyle = { borderRadius: "0px" };
  } else {
    radiusStyle = { borderRadius: "8px" };
  }

  // data-ds-size="auto" opts the day button out of the unlayered DS02 control
  // baseline ([data-ui="control"]{height:36px;border-radius:8px}); height is
  // driven by --cell-size instead so the picker honours its own cell sizing.
  const fillClass = isRange
    ? cn(
        "bg-accent text-accent-foreground font-medium",
        sameDayRange && "font-bold",
        isMiddle && "hover:bg-accent", // keep middle flush, no tint shift
      )
    : selectedSingle
      ? "bg-accent text-accent-foreground font-bold"
      : "hover:bg-secondary hover:text-foreground";

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={selectedSingle}
      data-range-start={isStart}
      data-range-end={isEnd}
      data-range-middle={isMiddle}
      data-ds-size="auto"
      {...props}
      style={radiusStyle}
      className={cn(
        "group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50",
        "flex h-(--cell-size) w-full min-w-0 flex-col gap-1 text-sm font-medium leading-none transition-colors",
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px]",
        "[&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        fillClass,
        className,
      )}
    />
  );
}

export { Calendar, CalendarDayButton };
