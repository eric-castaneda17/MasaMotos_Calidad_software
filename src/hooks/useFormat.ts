"use client";

import { formatDate, formatDateTime, formatMoney, formatNumber } from "@/lib/money";
import { useLocale } from "next-intl";
import { useMemo } from "react";

export function useFormat() {
  const locale = useLocale();
  return useMemo(
    () => ({
      money: (v: number) => formatMoney(v, locale),
      number: (v: number) => formatNumber(v, locale),
      dateTime: (v: Date | string) => formatDateTime(v, locale),
      date: (v: Date | string) => formatDate(v, locale),
    }),
    [locale],
  );
}
