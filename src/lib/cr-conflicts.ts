type Actual = { date: string };
type CostLike = { linkKind?: string; linkRef?: string; actuals?: Actual[] };
type RevLike = { linkKind?: string; ms?: string; actuals?: Actual[] };

export const DELETED_ITEM_CONFLICT =
  "This change request conflicts with progress recorded after submission. The requester needs to resubmit.";

/** Schedule items the request deletes that received cost/revenue actuals after it was submitted. */
export function deletedItemsWithLateActuals(
  removedItems: string[],
  submittedAt: string,
  costEntries: CostLike[],
  revEntries: RevLike[],
): string[] {
  const cutoff = new Date(submittedAt).getTime();
  if (Number.isNaN(cutoff)) return [];
  const late = (list?: Actual[]) => (list ?? []).some((a) => new Date(a.date).getTime() > cutoff);
  return removedItems.filter(
    (name) =>
      costEntries.some((e) => e.linkKind === "milestone" && e.linkRef === name && late(e.actuals)) ||
      revEntries.some((e) => e.linkKind !== "fixed" && e.ms === name && late(e.actuals)),
  );
}
