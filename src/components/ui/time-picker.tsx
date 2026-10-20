import { useEffect, useRef, useState } from "react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TIMES = Array.from({ length: 96 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`);
const VALID = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Next 15-minute slot from now, e.g. 12:22 → 12:30. */
function nearestSlot() {
  const d = new Date();
  const mins = Math.ceil((d.getHours() * 60 + d.getMinutes()) / 15) * 15 % 1440;
  return TIMES[mins / 15];
}

function normalize(raw: string): string | null {
  const s = raw.trim();
  if (!s) return "";
  const m = /^(\d{1,2}):?(\d{2})$/.exec(s);
  if (!m) return null;
  const v = `${m[1].padStart(2, "0")}:${m[2]}`;
  return VALID.test(v) ? v : null;
}

/** 24-hour time field: type any HH:mm, or pick from a 15-minute list opened at the current time. */
export function TimePicker({ value, onChange, placeholder = "HH:mm" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  const [invalid, setInvalid] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => setText(value), [value]);

  const focusSlot = value && VALID.test(value) ? TIMES.reduce((best, t) => (t <= value ? t : best), TIMES[0]) : nearestSlot();

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      const el = listRef.current?.querySelector<HTMLElement>(`[data-time="${focusSlot}"]`);
      el?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(id);
  }, [open, focusSlot]);

  function commit(raw: string) {
    const v = normalize(raw);
    if (v === null) { setInvalid(true); return; }
    setInvalid(false);
    setText(v);
    onChange(v);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div>
          <Input
            aria-label="Time"
            value={text}
            placeholder={placeholder}
            inputMode="numeric"
            maxLength={5}
            aria-invalid={invalid}
            className={cn("num-mono", invalid && "border-rag-red")}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onChange={(e) => { setText(e.target.value); setInvalid(false); }}
            onBlur={() => commit(text)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(text); setOpen(false); } }}
          />
          {invalid && <p className="mt-1 text-xs text-rag-red">Use 24-hour format HH:mm, e.g. 14:22</p>}
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div ref={listRef} className="max-h-60 overflow-y-auto">
          {TIMES.map((t) => (
            <button
              key={t}
              type="button"
              data-time={t}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { commit(t); setOpen(false); }}
              className={cn(
                "block w-full rounded-md px-3 py-1.5 text-start text-sm num-mono hover:bg-accent/40",
                t === value ? "bg-primary/20 text-foreground" : t === focusSlot ? "bg-accent/30 text-foreground" : "text-muted-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
