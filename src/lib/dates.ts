/** Fechas en America/Bogota (UTC-5 fijo); la base de datos guarda instantes en UTC. */
const OFFSET_HOURS = 5;

export function toLocalDateString(date: Date = new Date()) {
  const local = new Date(date.getTime() - OFFSET_HOURS * 3600_000);
  return local.toISOString().slice(0, 10);
}

export function localDayStart(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, OFFSET_HOURS, 0, 0));
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}

export function isValidDay(value: string | undefined | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = localDayStart(value);
  return !Number.isNaN(d.getTime()) && toLocalDateString(d) === value;
}

export function todayRange() {
  const start = localDayStart(toLocalDateString());
  return { start, end: addDays(start, 1) };
}

export function monthRange() {
  const today = toLocalDateString();
  const start = localDayStart(`${today.slice(0, 7)}-01`);
  const [y, m] = today.split("-").map(Number);
  const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { start, end: localDayStart(nextMonth) };
}

/** Rango inclusivo desde la URL; por defecto los últimos `defaultDays` días. */
export function resolveRange(from?: string, to?: string, defaultDays = 30) {
  const today = toLocalDateString();
  const toDay = isValidDay(to) ? to : today;
  const fromDay = isValidDay(from)
    ? from
    : toLocalDateString(addDays(localDayStart(toDay), -(defaultDays - 1)));
  const [a, b] = fromDay <= toDay ? [fromDay, toDay] : [toDay, fromDay];
  return { fromDay: a, toDay: b, start: localDayStart(a), end: addDays(localDayStart(b), 1) };
}
