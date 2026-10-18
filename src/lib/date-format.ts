import { format, isValid, parseISO } from "date-fns";

export type DisplayDateValue = Date | string | number | null | undefined;

function parseDisplayDate(value: DisplayDateValue): Date | null {
  if (value === null || value === undefined || value === "" || value === "—") return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === "number") {
    const date = new Date(value);
    return isValid(date) ? date : null;
  }

  const trimmed = value.trim();
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const date = isoDateOnly ? parseISO(trimmed) : new Date(trimmed);
  return isValid(date) ? date : null;
}

/** User-facing calendar date: `22 Sep, 2026`. Machine values remain ISO. */
export function formatDateWithYear(value: DisplayDateValue, fallback = "—"): string {
  const date = parseDisplayDate(value);
  return date ? format(date, "dd MMM, yyyy") : fallback;
}

/** User-facing calendar date without a year: `22 Sep`. */
export function formatDateWithoutYear(value: DisplayDateValue, fallback = "—"): string {
  const date = parseDisplayDate(value);
  return date ? format(date, "dd MMM") : fallback;
}

/** Formats a visible date according to whether its source explicitly includes a year. */
export function formatDateForDisplay(value: DisplayDateValue, fallback = "—"): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    const includesYear = /(?:^|\D)\d{4}(?:\D|$)/.test(trimmed);
    return includesYear ? formatDateWithYear(trimmed, fallback) : formatDateWithoutYear(trimmed, fallback);
  }
  return formatDateWithYear(value, fallback);
}
/** Comment timestamp: `22 Sep, 2026 · 14:05`; legacy date-only values show the date alone. */
export function formatDateTime(value: DisplayDateValue, fallback = "—"): string {
  const date = parseDisplayDate(value);
  if (!date) return fallback;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return format(date, "dd MMM, yyyy");
  return format(date, "dd MMM, yyyy · HH:mm");
}
