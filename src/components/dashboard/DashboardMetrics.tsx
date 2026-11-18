"use client";

import MetricCard from "@/components/common/MetricCard";
import { useFormat } from "@/hooks/useFormat";
import { AlertIcon, BoxCubeIcon, BoxIconLine, CheckCircleIcon, DollarLineIcon, ErrorIcon, PieChartIcon, ReceiptIcon } from "@/icons";
import type { DashboardData } from "@/lib/data/analytics";
import { useTranslations } from "next-intl";

export default function DashboardMetrics({ data }: { data: DashboardData }) {
  const t = useTranslations("dashboard.metrics");
  const f = useFormat();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          tone="brand"
          icon={<DollarLineIcon />}
          label={t("salesToday")}
          value={f.money(data.today.total)}
          hint={t("salesCount", { count: data.today.count })}
        />
        <MetricCard
          tone="navy"
          icon={<PieChartIcon />}
          label={t("salesMonth")}
          value={f.money(data.month.total)}
          hint={t("salesCount", { count: data.month.count })}
        />
        <MetricCard
          tone="success"
          icon={<BoxIconLine />}
          label={t("totalRevenue")}
          value={f.money(data.allTime.total)}
          hint={t("historical")}
        />
        <MetricCard
          tone="gray"
          icon={<ReceiptIcon />}
          label={t("invoices")}
          value={f.number(data.invoiceCount)}
          hint={t("issued")}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard
          tone="navy"
          icon={<BoxCubeIcon />}
          label={t("totalProducts")}
          value={f.number(data.products.total)}
          hint={t("activeProducts")}
        />
        <MetricCard
          tone="success"
          icon={<CheckCircleIcon />}
          label={t("available")}
          value={f.number(data.products.available)}
          hint={t("withStock")}
        />
        <MetricCard
          tone="warning"
          icon={<AlertIcon />}
          label={t("lowStock")}
          value={f.number(data.products.low)}
          hint={t("needRestock")}
        />
        <MetricCard
          tone="error"
          icon={<ErrorIcon />}
          label={t("outOfStock")}
          value={f.number(data.products.out)}
          hint={t("withoutStock")}
        />
      </div>
    </div>
  );
}
