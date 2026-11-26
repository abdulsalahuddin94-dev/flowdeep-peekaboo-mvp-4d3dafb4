export function compactRequestPeriod(from: string, until: string, durationHours?: number, lang: "en" | "ar" = "en") {
  const period = requestPeriod(from, until, durationHours);
  const date = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
  };
  const dates = (period.lines[0] === period.lines[1] || period.lines[1] === period.duration ? period.lines.slice(0, 1) : period.lines).map(date).join(" → ");
  return `${dates}${period.duration ? ` · ${period.duration}` : ""}`;
}

/** Dates determine the display shape; recorded work hours never determine the end date. */
export function requestPeriod(from: string, until: string, durationHours?: number) {
  const datePart = (value: string) => value.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? value;
  const start = datePart(from);
  const end = datePart(until);
  const timed = /T\d{2}:\d{2}/.test(from) && /T\d{2}:\d{2}/.test(until);
  const elapsed = timed ? (Date.parse(until) - Date.parse(from)) / 3_600_000 : undefined;
  const hours = durationHours ?? elapsed;
  const minutes = hours !== undefined && Number.isFinite(hours) && hours >= 0 ? Math.round(hours * 60) : undefined;
  const duration = minutes === undefined ? undefined : [Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h` : "", minutes % 60 ? `${minutes % 60}m` : ""].filter(Boolean).join(" ") || "0h";
  const sameDay = /^\d{4}-\d{2}-\d{2}$/.test(start) && start === end;
  return { lines: sameDay ? [start, ...(duration ? [duration] : [])] : start === end ? [start] : [start, end], duration, from, until };
}