import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** Slice a list into pages. Resets to page 1 whenever the list shrinks below the current page. */
export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [page, pageCount]);

  const safePage = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  return {
    page: safePage,
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
}: {
  page: number;
  setPage: (p: number) => void;
  pageCount: number;
  pageSize: number;
  total: number;
  itemLabel?: string;
  className?: string;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages: (number | "…")[] = [];
  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i++) pages.push(i);
  } else {
    pages.push(1);
    const start = Math.max(2, page - 1);
    const end = Math.min(pageCount - 1, page + 1);
    if (start > 2) pages.push("…");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < pageCount - 1) pages.push("…");
    pages.push(pageCount);
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn("mt-3 flex flex-wrap items-center justify-between gap-3 px-1", className)}
    >
      <span className="text-xs text-muted-foreground">
        Showing {from} to {to} of {total} {itemLabel}
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
          className="h-8 w-8 rounded-full text-muted-foreground"
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
                "h-8 min-w-8 rounded-lg px-2 text-xs font-medium transition-colors",
                p === page
                  ? "bg-accent-secondary text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
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
          disabled={page === pageCount}
          onClick={() => setPage(page + 1)}
          className="h-8 w-8 rounded-full text-muted-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}

export default TablePagination;
