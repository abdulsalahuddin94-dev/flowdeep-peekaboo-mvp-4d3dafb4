import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Temporary overflow treatment for long tab rows: hidden scrollbar, edge fades and arrow buttons.
export function ScrollableTabs({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    const rtl = getComputedStyle(el).direction === "rtl";
    const start = pos > 2, end = pos < max - 2;
    setCanL(rtl ? end : start);
    setCanR(rtl ? start : end);
  };

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, []);

  const scrollBy = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.6, behavior: "smooth" });

  const btn = "absolute top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground";

  return (
    <div className={cn("relative", className)} dir="ltr">
      {canL && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-16 bg-gradient-to-r from-background to-transparent" />
          <button type="button" aria-label="Scroll tabs left" className={cn(btn, "left-0")} onClick={() => scrollBy(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </button>
        </>
      )}
      <div ref={ref} onScroll={update} className="no-scrollbar overflow-x-auto">
        {children}
      </div>
      {canR && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-16 bg-gradient-to-l from-background to-transparent" />
          <button type="button" aria-label="Scroll tabs right" className={cn(btn, "right-0")} onClick={() => scrollBy(1)}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
