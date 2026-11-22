/** Local current month; call after hydration so server and browser markup agree. */
export function currentEmployeeMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function stepEmployeeMonth(month: string, direction: -1 | 1): string {
  const date = new Date(`${month}-01T12:00:00`);
  date.setMonth(date.getMonth() + direction);
  return currentEmployeeMonth(date);
}