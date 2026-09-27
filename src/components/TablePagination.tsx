import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** Slice a list into pages. Resets to page 1 whenever the list shrinks below the current page. */
export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset to page 1 when the underlying list changes size (e.g. search/filter),
  // but keep the selected page otherwise so demo page pills stay navigable.
  const lastLength = useRef(items.length);
  useEffect(() => {
    if (lastLength.current !== items.length) {
      lastLength.current = items.length;
      setPage(1);
    }
  }, [items.length]);

  const safePage = Math.max(1, Math.min(page, pageCount));
  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  return {
    page,
    setPage,
    pageCount,
    pageSize,
    total: items.length,
    pageItems,
  };
}

/** Standard table pagination footer (DS02): "Showing x to y of n" + numbered pages. */
export function TablePagination({
  page,
  setPage,
  pageCount,
  pageSize,
  total,
  itemLabel = "items",
  className,
  demoPages = 5,
}: {
  page: number;
  setPage: (p: number) => void;
  pageCount: number;
  pageSize: number;
  total: number;
  itemLabel?: string;
  className?: string;
  /** Minimum number of page pills to render (demo/preview padding). */
  demoPages?: number;
}) {
  if (total === 0) return null;
  const displayPageCount = Math.max(pageCount, demoPages);
  const displayTotal = demoPages > 0 ? Math.max(total, displayPageCount * pageSize) : total;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, displayTotal);

  const pages: (number | "…")[] = [];
  if (displayPageCount <= 7) {
    for (let i = 1; i <= displayPageCount; i++) pages.push(i);
  } else {
    pages.push(1);
    const start = Math.max(2, page - 1);
    const end = Math.min(displayPageCount - 1, page + 1);
    if (start > 2) pages.push("…");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < displayPageCount - 1) pages.push("…");
    pages.push(displayPageCount);
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn("mt-3 flex flex-wrap items-center justify-between gap-3 px-1", className)}
    >
      <span className="text-xs text-muted-foreground">
        Showing {from} to {to} of {displayTotal} {itemLabel}
      </span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          data-ds-size="auto"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className={cn(
            "h-9 w-9 hover:bg-transparent",
            page === 1 ? "text-muted-foreground" : "text-[var(--btn-primary-bg)]",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? "page" : undefined}
              onClick={() => setPage(p)}
              className={cn(
                "h-9 min-w-9 rounded-lg px-2 text-xs font-medium transition-colors",
                p === page
                  ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]"
                  : "text-foreground hover:bg-secondary/30",
              )}
            >
              {p}
            </button>
          ),
        )}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          data-ds-size="auto"
          aria-label="Next page"
          disabled={page >= displayPageCount}
          onClick={() => setPage(page + 1)}
          className={cn(
            "h-9 w-9 hover:bg-transparent",
            page >= displayPageCount ? "text-muted-foreground" : "text-[var(--btn-primary-bg)]",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}

export default TablePagination;
