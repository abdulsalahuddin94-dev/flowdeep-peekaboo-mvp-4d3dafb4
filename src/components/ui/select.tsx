"use client";

/**
 * Combobox-style Select: the trigger is an editable field. Typing filters the
 * options underneath (Google-search feel) but the text is never kept — the user
 * must pick one of the listed options, otherwise the previous value is restored.
 * The public API matches the shadcn Select it replaces.
 */

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown, ChevronUp } from "@/lib/icons";

import { cn } from "@/lib/utils";

type Ctx = {
  value: string | undefined;
  select: (v: string, label: string) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  query: string;
  setQuery: (q: string) => void;
  label: string;
  registerLabel: (v: string, label: string) => void;
  disabled?: boolean;
  searchable: boolean;
  activeValue: string | null;
  setActiveValue: (v: string | null) => void;
  registerOption: (v: string, matched: boolean) => void;
  matchedValues: React.MutableRefObject<string[]>;
};

const SelectContext = React.createContext<Ctx | null>(null);
const useSelect = () => {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select parts must be used inside <Select>");
  return ctx;
};

function nodeText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join(" ");
  if (React.isValidElement(node))
    return nodeText((node.props as { children?: React.ReactNode }).children);
  return "";
}

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  /** Set to false to disable typing/filtering. */
  searchable?: boolean;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Select = ({
  value,
  defaultValue,
  onValueChange,
  disabled,
  searchable = true,
  children,
  open: openProp,
  onOpenChange,
}: SelectProps) => {
  const [uncontrolled, setUncontrolled] = React.useState<string | undefined>(defaultValue);
  const current = value !== undefined ? value : uncontrolled;

  const [openState, setOpenState] = React.useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = React.useCallback(
    (o: boolean) => {
      setOpenState(o);
      onOpenChange?.(o);
    },
    [onOpenChange],
  );

  const [query, setQuery] = React.useState("");
  const [activeValue, setActiveValue] = React.useState<string | null>(null);
  const [labels, setLabels] = React.useState<Record<string, string>>({});
  const matchedValues = React.useRef<string[]>([]);

  const registerLabel = React.useCallback((v: string, label: string) => {
    setLabels((prev) => (prev[v] === label ? prev : { ...prev, [v]: label }));
  }, []);

  const [, bump] = React.useState(0);
  const registerOption = React.useCallback((v: string, matched: boolean) => {
    const list = matchedValues.current;
    const i = list.indexOf(v);
    if (matched && i === -1) list.push(v);
    else if (!matched && i !== -1) list.splice(i, 1);
    else return;
    bump((n) => n + 1);
  }, []);

  const select = React.useCallback(
    (v: string, label: string) => {
      registerLabel(v, label);
      if (value === undefined) setUncontrolled(v);
      onValueChange?.(v);
      setQuery("");
      setOpen(false);
    },
    [onValueChange, registerLabel, setOpen, value],
  );

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveValue(null);
    }
  }, [open]);

  const ctx: Ctx = {
    value: current,
    select,
    open,
    setOpen,
    query,
    setQuery,
    label: current !== undefined ? (labels[current] ?? current) : "",
    registerLabel,
    disabled,
    searchable,
    activeValue,
    setActiveValue,
    registerOption,
    matchedValues,
  };

  return (
    <SelectContext.Provider value={ctx}>
      <PopoverPrimitive.Root open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
        {children}
      </PopoverPrimitive.Root>
    </SelectContext.Provider>
  );
};

const SelectGroup = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn(className)} {...props} />
);

/** Only carries the placeholder; the trigger renders the value itself. */
const SelectValue = ({ placeholder }: { placeholder?: React.ReactNode; children?: React.ReactNode }) => {
  const ctx = useSelect();
  return ctx.value ? null : <>{placeholder ?? null}</>;
};

function findPlaceholder(children: React.ReactNode): string {
  let found = "";
  React.Children.forEach(children, (child) => {
    if (found || !React.isValidElement(child)) return;
    const props = child.props as { placeholder?: React.ReactNode; children?: React.ReactNode };
    if (child.type === SelectValue) found = nodeText(props.placeholder);
    else if (props.children) found = findPlaceholder(props.children);
  });
  return found;
}

const SelectTrigger = React.forwardRef<HTMLInputElement, React.ComponentProps<"div"> & { children?: React.ReactNode }>(
  ({ className, children, ...props }, ref) => {
    const ctx = useSelect();
    const placeholder = React.useMemo(() => findPlaceholder(children), [children]);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const text = ctx.open && ctx.searchable ? ctx.query : ctx.label;

    return (
      <PopoverPrimitive.Anchor asChild>
        <div
          data-ui="control"
          data-state={ctx.open ? "open" : "closed"}
          className={cn(
            "relative flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 text-sm shadow-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring",
            ctx.disabled && "pointer-events-none opacity-50",
            className,
          )}
          {...props}
        >
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }}
            role="combobox"
            aria-expanded={ctx.open}
            autoComplete="off"
            disabled={ctx.disabled}
            readOnly={!ctx.searchable}
            value={text}
            placeholder={placeholder || undefined}
            onChange={(e) => {
              if (!ctx.searchable) return;
              ctx.setQuery(e.target.value);
              ctx.setActiveValue(null);
              if (!ctx.open) ctx.setOpen(true);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              inputRef.current?.focus();
              ctx.setOpen(!ctx.open);
            }}
            onKeyDown={(e) => {
              const list = ctx.matchedValues.current;
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                if (!ctx.open) return ctx.setOpen(true);
                const i = ctx.activeValue ? list.indexOf(ctx.activeValue) : -1;
                const next =
                  e.key === "ArrowDown"
                    ? list[(i + 1) % Math.max(list.length, 1)]
                    : list[(i - 1 + list.length) % Math.max(list.length, 1)];
                if (next !== undefined) ctx.setActiveValue(next);
              } else if (e.key === "Enter") {
                if (ctx.open) {
                  e.preventDefault();
                  const target = ctx.activeValue ?? list[0];
                  if (target !== undefined) ctx.select(target, target);
                }
              } else if (e.key === "Escape") {
                ctx.setOpen(false);
              }
            }}
            className="w-full cursor-pointer bg-transparent pr-6 outline-none placeholder:text-muted-foreground"
          />
          <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 opacity-50" />
        </div>
      </PopoverPrimitive.Anchor>
    );
  },
);
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof PopoverPrimitive.Content> & { position?: "popper" | "item-aligned" }
>(({ className, children, position: _position, ...props }, ref) => {
  const ctx = useSelect();
  const empty = ctx.open && ctx.query.trim() !== "" && ctx.matchedValues.current.length === 0;

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "z-50 max-h-72 w-(--radix-popover-trigger-width) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          className,
        )}
        {...props}
      >
        {children}
        {empty && <div className="px-2 py-3 text-center text-sm text-muted-foreground">No results</div>}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
});
SelectContent.displayName = "SelectContent";

const SelectLabel = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />
);

const SelectItem = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<"div">, "value"> & { value: string; disabled?: boolean }
>(({ className, children, value, disabled, ...props }, ref) => {
  const ctx = useSelect();
  const label = React.useMemo(() => nodeText(children), [children]);
  const matched = !ctx.query.trim() || label.toLowerCase().includes(ctx.query.trim().toLowerCase());
  const selected = ctx.value === value;
  const active = ctx.activeValue === value;

  React.useEffect(() => {
    ctx.registerLabel(value, label || value);
  }, [ctx, label, value]);

  React.useEffect(() => {
    ctx.registerOption(value, matched && !disabled);
    return () => ctx.registerOption(value, false);
  }, [ctx, value, matched, disabled]);

  if (!matched) return null;

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={selected}
      data-disabled={disabled ? "" : undefined}
      onClick={() => !disabled && ctx.select(value, label || value)}
      onMouseEnter={() => !disabled && ctx.setActiveValue(value)}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none",
        active && "bg-accent text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      {...props}
    >
      {selected && (
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4" />
        </span>
      )}
      {children}
    </div>
  );
});
SelectItem.displayName = "SelectItem";

const SelectSeparator = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
);

const SelectScrollUpButton = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex items-center justify-center py-1", className)} {...props}>
    <ChevronUp className="h-4 w-4" />
  </div>
);

const SelectScrollDownButton = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex items-center justify-center py-1", className)} {...props}>
    <ChevronDown className="h-4 w-4" />
  </div>
);

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
