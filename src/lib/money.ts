/** Los cálculos se hacen en centavos (enteros) para evitar errores de coma flotante. */

export const APP_TIME_ZONE = "America/Bogota";

export const toCents = (value: number | string | { toString(): string }) =>
  Math.round(Number(value.toString()) * 100);

export const fromCents = (cents: number) => cents / 100;

const intlLocale = (locale: string) => (locale === "en" ? "en-US" : "es-CO");

export function formatMoney(value: number, locale: string, currency = "COP") {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}

export function formatDateTime(date: Date | string, locale: string) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(date));
}

export function formatDate(date: Date | string, locale: string) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "medium",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(date));
}
