import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Financial items are DEFINED in the Financials module. The WBS only *links*
 * tasks/milestones to these predefined items — amounts are never typed in the
 * schedule. Links are tracked globally so a revenue item that is already
 * attached to one milestone disappears from every other dropdown in the system.
 */
export type FinanceKind = "cost" | "revenue";
export type FinancialItem = {
  id: string;
  label: string;
  amount: string;
  kind: FinanceKind;
  classification?: "capex" | "opex";
};

export const FINANCIAL_CATALOG: { cost: FinancialItem[]; revenue: FinancialItem[] } = {
  cost: [
    { id: "FIN-C-LAB", label: "Labour — core delivery team", amount: "$1.20M", kind: "cost", classification: "opex" },
    { id: "FIN-C-HW", label: "Hardware — servers & peripherals", amount: "$0.90M", kind: "cost", classification: "capex" },
    { id: "FIN-C-LIC", label: "Software licenses", amount: "$0.40M", kind: "cost", classification: "opex" },
    { id: "FIN-C-TRV", label: "Business trips", amount: "$0.10M", kind: "cost", classification: "opex" },
    { id: "FIN-C-HOT", label: "Accommodation & hotels", amount: "$0.06M", kind: "cost", classification: "opex" },
    { id: "FIN-C-CTG", label: "Contingency", amount: "$0.60M", kind: "cost", classification: "opex" },
  ],
  revenue: [
    { id: "FIN-R-ADV", label: "Advance payment (30%)", amount: "$0.96M", kind: "revenue" },
    { id: "FIN-R-P1", label: "Progress invoice (20%)", amount: "$0.64M", kind: "revenue" },
    { id: "FIN-R-P2", label: "Progress invoice (25%)", amount: "$0.80M", kind: "revenue" },
    { id: "FIN-R-FIN", label: "Final payment (25%)", amount: "$0.80M", kind: "revenue" },
  ],
};

export function findFinancialItem(id: string | undefined): FinancialItem | undefined {
  if (!id) return undefined;
  return FINANCIAL_CATALOG.cost.find((i) => i.id === id) ?? FINANCIAL_CATALOG.revenue.find((i) => i.id === id);
}

/** Where a financial item is currently attached in the schedule. */
export type FinanceLink = { itemId: string; project: string; wbsItem: string };

type Ctx = {
  links: FinanceLink[];
  /** Replaces the whole link set for one project (called from the project schedule). */
  setProjectLinks: (project: string, links: { itemId: string; wbsItem: string }[]) => void;
  /** The single link of an item, if any. */
  linkOf: (itemId: string) => FinanceLink | undefined;
};

const FinanceLinksContext = createContext<Ctx | null>(null);

export function FinanceLinksProvider({ children }: { children: ReactNode }) {
  const [byProject, setByProject] = useState<Record<string, { itemId: string; wbsItem: string }[]>>({});

  const setProjectLinks = useCallback((project: string, links: { itemId: string; wbsItem: string }[]) => {
    setByProject((prev) => {
      const before = prev[project] ?? [];
      const same =
        before.length === links.length &&
        before.every((b, i) => b.itemId === links[i].itemId && b.wbsItem === links[i].wbsItem);
      if (same) return prev;
      return { ...prev, [project]: links };
    });
  }, []);

  const links = useMemo(
    () =>
      Object.entries(byProject).flatMap(([project, entries]) =>
        entries.map((e) => ({ project, itemId: e.itemId, wbsItem: e.wbsItem })),
      ),
    [byProject],
  );

  const linkOf = useCallback((itemId: string) => links.find((l) => l.itemId === itemId), [links]);

  return (
    <FinanceLinksContext.Provider value={{ links, setProjectLinks, linkOf }}>
      {children}
    </FinanceLinksContext.Provider>
  );
}

export function useFinanceLinks() {
  const ctx = useContext(FinanceLinksContext);
  if (!ctx) throw new Error("useFinanceLinks must be used within FinanceLinksProvider");
  return ctx;
}
