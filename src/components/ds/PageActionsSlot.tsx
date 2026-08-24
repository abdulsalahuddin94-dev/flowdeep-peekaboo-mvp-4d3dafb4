import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/*
 * DS02 — the page main CTA always lives in the title row.
 * Pages render <PageActionsSlot /> next to the title; toolbars teleport their
 * CTA into it so a single API keeps working across every module.
 */

export const PAGE_ACTIONS_ID = "ds-page-actions";

export function PageActionsSlot({ className = "" }: { className?: string }) {
  return <div id={PAGE_ACTIONS_ID} className={`flex items-center gap-2 ${className}`} />;
}

/** Renders children into the page title row when a slot exists, otherwise inline. */
export function PageActions({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setHost(document.getElementById(PAGE_ACTIONS_ID));
  });
  if (host) return createPortal(children, host);
  return <>{children}</>;
}
