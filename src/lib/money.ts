/**
 * Project budgets, cost and revenue amounts are stored in millions of dollars
 * (3.2 = $3,200,000), while some modules (e.g. employee compensation, trip expenses)
 * store amounts in raw dollars (e.g. 9000 = $9,000).
 *
 * Requirements:
 * - When in thousands range (>= 1,000 and < 1,000,000): show "K", e.g. $840K, $950K, $50K, $12.5K.
 * - When in millions range (>= 1,000,000): show "M", e.g. $1M, $2.1M, $3.2M, $14.2M, $87.33M.
 * - When below 1,000: show regular rounded dollars, e.g. $500, $0.
 * - Amount inputs take regular numbers without M/K.
 */
const MILLION = 1_000_000;

function formatCompactDollars(dollarsAmount: number): string {
  const abs = Math.abs(dollarsAmount);
  const sign = dollarsAmount < 0 ? "-" : "";

  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    // Keep up to 2 decimal places, trimming trailing zeros (e.g. 1.00 -> 1, 14.20 -> 14.2, 87.33 -> 87.33)
    const formatted = millions.toFixed(2).replace(/\.?0+$/, "");
    return `${sign}$${formatted}M`;
  }

  if (abs >= 1_000) {
    const thousands = abs / 1_000;
    const formatted = thousands.toFixed(2).replace(/\.?0+$/, "");
    return `${sign}$${formatted}K`;
  }

  return `${sign}$${Math.round(abs)}`;
}

/** Formatted compact dollar amount for a value stored in millions, e.g. 0.05 → "$50K", 2.1 → "$2.1M". */
export function money(millions: number): string {
  const dollars = Math.round(millions * MILLION);
  return formatCompactDollars(dollars);
}

/** Formatted compact number without currency sign, for chart axes. */
export function moneyAxis(millions: number): string {
  const dollars = Math.round(millions * MILLION);
  const str = formatCompactDollars(dollars);
  return str.replace(/^\$/, "");
}

/** Input value (full dollars) for a stored amount in millions. */
export function toDollarInput(millions: number | undefined): string {
  return millions == null ? "" : String(Math.round(millions * MILLION));
}

/** Stored amount in millions for an input value typed in full dollars. */
export function fromDollarInput(value: string): number {
  return parseFloat(value.replace(/,/g, "")) / MILLION;
}

/** Formatted compact dollar amount for a whole-dollar value (no conversion), e.g. 9000 → "$9K", 14200000 → "$14.2M". */
export function dollars(value: number): string {
  return formatCompactDollars(Math.round(value));
}
