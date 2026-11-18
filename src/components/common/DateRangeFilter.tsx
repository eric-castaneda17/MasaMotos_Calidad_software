"use client";

import { useUrlParams } from "@/hooks/useUrlParams";
import { addDays, localDayStart, toLocalDateString } from "@/lib/dates";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";

interface DateRangeFilterProps {
  from?: string;
  to?: string;
  showPresets?: boolean;
  className?: string;
}

const inputCls =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:[color-scheme:dark]";

export default function DateRangeFilter({ from, to, showPresets = false, className }: DateRangeFilterProps) {
  const t = useTranslations("reports.range");
  const { searchParams, setParams } = useUrlParams();
  const fromValue = searchParams.get("from") ?? from ?? "";
  const toValue = searchParams.get("to") ?? to ?? "";

  const today = toLocalDateString();
  const presets = [
    { key: "today", from: today, to: today },
    { key: "last7", from: toLocalDateString(addDays(localDayStart(today), -6)), to: today },
    { key: "last30", from: toLocalDateString(addDays(localDayStart(today), -29)), to: today },
    { key: "thisMonth", from: `${today.slice(0, 7)}-01`, to: today },
    { key: "thisYear", from: `${today.slice(0, 4)}-01-01`, to: today },
  ] as const;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{t("from")}</span>
          <input
            type="date"
            value={fromValue}
            max={toValue || today}
            onChange={(e) => setParams({ from: e.target.value || undefined })}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{t("to")}</span>
          <input
            type="date"
            value={toValue}
            min={fromValue || undefined}
            max={today}
            onChange={(e) => setParams({ to: e.target.value || undefined })}
            className={inputCls}
          />
        </label>
      </div>
      {showPresets && (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const active = fromValue === p.from && toValue === p.to;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setParams({ from: p.from, to: p.to })}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition",
                  active
                    ? "bg-navy-700 text-white dark:bg-navy-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10",
                )}
              >
                {t(`presets.${p.key}`)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
