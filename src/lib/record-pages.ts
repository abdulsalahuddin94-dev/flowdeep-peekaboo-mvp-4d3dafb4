import { useCallback } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

/**
 * Shared search params for every standalone record page (risk, issue, meeting,
 * action). `project` locks the page to one project when it was opened from
 * inside that project; `back` is the exact page to return to afterwards.
 */
export type RecordSearch = { project?: string; back?: string };

export function recordSearch(search: Record<string, unknown>): RecordSearch {
  const text = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
  return { project: text(search.project), back: text(search.back) };
}

/** The current URL, ready to be carried by a record page as its `back` param. */
export function useBackParam() {
  return useRouterState({
    select: (s) => {
      const search = s.location.search as Record<string, unknown>;
      const qs = new URLSearchParams(
        Object.entries(search)
          .filter(([, v]) => typeof v !== "object")
          .map(([k, v]) => [k, String(v)]),
      ).toString();
      return `${s.location.pathname}${qs ? `?${qs}` : ""}`;
    },
  });
}

/**
 * Returns to the page a record page came from. `back` is the caller's own URL,
 * so a page opened from a project tab lands back on that tab. `fallback` is the
 * module list used when the page was opened directly (no caller).
 */
export function useBackNav() {
  const navigate = useNavigate();
  return useCallback(
    (back: string | undefined, fallback: { to: string; search?: Record<string, unknown> }) => {
      if (!back) {
        navigate({ to: fallback.to as never, search: fallback.search as never });
        return;
      }
      const url = new URL(back, window.location.origin);
      navigate({ to: url.pathname as never, search: Object.fromEntries(url.searchParams) as never });
    },
    [navigate],
  );
}
