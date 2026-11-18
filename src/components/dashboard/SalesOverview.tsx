"use client";

import SalesChart from "@/components/charts/SalesChart";
import DataCard from "@/components/common/DataCard";
import type { SeriesPoint } from "@/lib/data/analytics";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function SalesOverview({ daily, monthly }: { daily: SeriesPoint[]; monthly: SeriesPoint[] }) {
  const t = useTranslations("dashboard.charts");
  const [mode, setMode] = useState<"day" | "month">("day");

  const tab = (value: "day" | "month", label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      aria-pressed={mode === value}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition",
        mode === value
          ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
          : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
      )}
    >
      {label}
    </button>
  );

  return (
    <DataCard
      title={mode === "day" ? t("dailyTitle") : t("monthlyTitle")}
      subtitle={mode === "day" ? t("dailySubtitle") : t("monthlySubtitle")}
      actions={
        <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
          {tab("day", t("daily"))}
          {tab("month", t("monthly"))}
        </div>
      }
    >
      {mode === "day" ? (
        <SalesChart key="day" points={daily} granularity="day" type="area" />
      ) : (
        <SalesChart key="month" points={monthly} granularity="month" type="bar" />
      )}
    </DataCard>
  );
}
