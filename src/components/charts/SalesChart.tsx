"use client";

import { useTheme } from "@/context/ThemeContext";
import { useFormat } from "@/hooks/useFormat";
import type { SeriesPoint } from "@/lib/data/analytics";
import type { ApexOptions } from "apexcharts";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SalesChartProps {
  points: SeriesPoint[];
  granularity: "day" | "month";
  type?: "area" | "bar";
  height?: number;
}

export default function SalesChart({ points, granularity, type = "area", height = 300 }: SalesChartProps) {
  const t = useTranslations("dashboard.charts");
  const locale = useLocale();
  const f = useFormat();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const categories = useMemo(() => {
    const intl = locale === "en" ? "en-US" : "es-CO";
    return points.map((p) => {
      if (granularity === "month") {
        const [y, m] = p.key.split("-").map(Number);
        return new Intl.DateTimeFormat(intl, { month: "short", year: "2-digit", timeZone: "UTC" }).format(
          new Date(Date.UTC(y, m - 1, 15)),
        );
      }
      const [y, m, d] = p.key.split("-").map(Number);
      return new Intl.DateTimeFormat(intl, { day: "2-digit", month: "short", timeZone: "UTC" }).format(
        new Date(Date.UTC(y, m - 1, d, 12)),
      );
    });
  }, [points, granularity, locale]);

  const options: ApexOptions = {
    // navy-600 y brand-600 de la paleta del logo.
    colors: [type === "bar" ? "#0000d6" : "#e00000"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type,
      toolbar: { show: false },
      zoom: { enabled: false },
      background: "transparent",
    },
    theme: { mode: dark ? "dark" : "light" },
    stroke: { curve: "smooth", width: type === "area" ? 2.5 : 0 },
    fill:
      type === "area"
        ? { type: "gradient", gradient: { opacityFrom: 0.45, opacityTo: 0.02 } }
        : { opacity: 1 },
    plotOptions: { bar: { borderRadius: 5, columnWidth: "55%" } },
    dataLabels: { enabled: false },
    grid: {
      borderColor: dark ? "#1d2939" : "#e4e7ec",
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: granularity === "day" ? Math.min(points.length, 10) : undefined,
      labels: { rotate: 0, hideOverlappingLabels: true, style: { colors: dark ? "#98a2b3" : "#667085" } },
    },
    yaxis: {
      labels: {
        style: { colors: dark ? "#98a2b3" : "#667085" },
        formatter: (v: number) =>
          new Intl.NumberFormat(locale === "en" ? "en-US" : "es-CO", { notation: "compact" }).format(v),
      },
    },
    tooltip: {
      theme: dark ? "dark" : "light",
      y: {
        formatter: (v: number, opts?: { dataPointIndex?: number }) => {
          const count = opts?.dataPointIndex !== undefined ? points[opts.dataPointIndex]?.count : undefined;
          return count !== undefined ? `${f.money(v)} · ${count} ${t("salesCount").toLowerCase()}` : f.money(v);
        },
      },
    },
    legend: { show: false },
  };

  return (
    <div className="-ms-2 min-w-0">
      <ReactApexChart
        options={options}
        series={[{ name: t("revenue"), data: points.map((p) => p.total) }]}
        type={type}
        height={height}
      />
    </div>
  );
}
