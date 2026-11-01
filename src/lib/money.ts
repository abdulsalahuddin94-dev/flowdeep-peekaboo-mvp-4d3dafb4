/**
 * Project budgets, cost and revenue amounts are stored in millions of dollars
 * (3.2 = $3,200,000). Screens never show the "M" shorthand: they format the full
 * amount, and amount inputs take full dollars that are converted back on save.
 */
const MILLION = 1_000_000;

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Full dollar amount for a value stored in millions, e.g. 3.2 → "$3,200,000". */
export function money(millions: number): string {
  const dollars = Math.round(millions * MILLION);
  return `${dollars < 0 ? "-" : ""}$${fmt.format(Math.abs(dollars))}`;
}

/** Full number without the currency sign, for chart axes. */
export function moneyAxis(millions: number): string {
  return fmt.format(Math.round(millions * MILLION));
}

/** Input value (full dollars) for a stored amount in millions. */
export function toDollarInput(millions: number | undefined): string {
  return millions == null ? "" : String(Math.round(millions * MILLION));
}

/** Stored amount in millions for an input value typed in full dollars. */
export function fromDollarInput(value: string): number {
  return parseFloat(value.replace(/,/g, "")) / MILLION;
}

/** Full dollar amount for a whole-dollar value (no conversion), e.g. 1200000 → "$1,200,000". */
export function dollars(value: number): string {
  return `${value < 0 ? "-" : ""}$${fmt.format(Math.abs(Math.round(value)))}`;
}
