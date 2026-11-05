type Item = { name: string; startDate: string; endDate: string; dependencies?: { predecessor: string }[] };

const toDay = (s: string | undefined) => {
  if (!s || s === "—") return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

/** Names of items that sit on a dependency loop (A → B → … → A). */
export function findCircularItems(items: readonly Item[]): string[] {
  const preds = new Map(items.map((i) => [i.name, (i.dependencies ?? []).map((d) => d.predecessor)]));
  const onCycle = new Set<string>();
  const state = new Map<string, 1 | 2>();
  const stack: string[] = [];
  const visit = (n: string) => {
    state.set(n, 1); stack.push(n);
    for (const p of preds.get(n) ?? []) {
      if (!preds.has(p)) continue;
      if (state.get(p) === 1) stack.slice(stack.indexOf(p)).forEach((x) => onCycle.add(x));
      else if (!state.has(p)) visit(p);
    }
    stack.pop(); state.set(n, 2);
  };
  for (const i of items) if (!state.has(i.name)) visit(i.name);
  return items.map((i) => i.name).filter((n) => onCycle.has(n));
}

/** Names of items starting before the project start or finishing after the project end. */
export function findItemsOutsideProject(items: readonly Item[], projectStart: string, projectEnd: string): string[] {
  const ps = toDay(projectStart), pe = toDay(projectEnd);
  return items
    .filter((i) => {
      const s = toDay(i.startDate), e = toDay(i.endDate);
      return (ps !== null && s !== null && s < ps) || (pe !== null && e !== null && e > pe);
    })
    .map((i) => i.name);
}
