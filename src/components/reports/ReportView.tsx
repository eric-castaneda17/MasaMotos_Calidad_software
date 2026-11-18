"use client";

import SalesChart from "@/components/charts/SalesChart";
import DataCard from "@/components/common/DataCard";
import { DataTable, Td, Th, Tr } from "@/components/common/DataTable";
import DateRangeFilter from "@/components/common/DateRangeFilter";
import EmptyState from "@/components/common/EmptyState";
import MetricCard from "@/components/common/MetricCard";
import { StockBadge } from "@/components/common/StatusBadges";
import SalesTable from "@/components/sales/SalesTable";
import { useFormat } from "@/hooks/useFormat";
import { usePaymentLabel } from "@/hooks/usePaymentLabel";
import { Link } from "@/i18n/navigation";
import { BoxIconLine, CartIcon, CheckCircleIcon, DollarLineIcon, DownloadIcon, PieChartIcon, ReceiptIcon, TagIcon } from "@/icons";
import type { ReportData } from "@/lib/data/analytics";
import type { Paginated } from "@/lib/data/pagination";
import type { SaleRow } from "@/lib/data/sales";
import { useTranslations } from "next-intl";

interface ReportViewProps {
  data: ReportData;
  history: Paginated<SaleRow>;
  fromDay: string;
  toDay: string;
}

function ExportLink({ type, from, to, label }: { type: string; from: string; to: string; label: string }) {
  return (
    <a
      href={`/api/reports/export?type=${type}&from=${from}&to=${to}`}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/5"
      download
    >
      <DownloadIcon className="size-4" />
      {label}
    </a>
  );
}

export default function ReportView({ data, history, fromDay, toDay }: ReportViewProps) {
  const t = useTranslations("reports");
  const td = useTranslations("dashboard.topProducts");
  const tp = useTranslations("products.fields");
  const ts = useTranslations("sales.fields");
  const f = useFormat();
  const pay = usePaymentLabel();
  const maxMethod = Math.max(1, ...data.byPaymentMethod.map((m) => m.total));

  return (
    <div className="space-y-6">
      <DataCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <DateRangeFilter from={fromDay} to={toDay} showPresets className="lg:max-w-xl lg:flex-1" />
          <div className="flex flex-wrap gap-2">
            <ExportLink type="sales" from={fromDay} to={toDay} label={t("export.sales")} />
            <ExportLink type="daily" from={fromDay} to={toDay} label={t("export.daily")} />
            <ExportLink type="top" from={fromDay} to={toDay} label={t("export.products")} />
            <ExportLink type="lowstock" from={fromDay} to={toDay} label={t("export.lowStock")} />
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {t("range.period", { from: f.date(`${fromDay}T12:00:00Z`), to: f.date(`${toDay}T12:00:00Z`) })}
        </p>
      </DataCard>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <MetricCard tone="brand" icon={<DollarLineIcon />} label={t("summary.revenue")} value={f.money(data.summary.total)} />
        <MetricCard tone="navy" icon={<CartIcon />} label={t("summary.sales")} value={f.number(data.summary.count)} />
        <MetricCard tone="success" icon={<ReceiptIcon />} label={t("summary.averageTicket")} value={f.money(data.summary.averageTicket)} />
        <MetricCard tone="gray" icon={<BoxIconLine />} label={t("summary.units")} value={f.number(data.summary.units)} />
        <MetricCard tone="warning" icon={<TagIcon />} label={t("summary.discounts")} value={f.money(data.summary.discount)} />
        <MetricCard tone="gray" icon={<PieChartIcon />} label={t("summary.taxes")} value={f.money(data.summary.tax)} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DataCard title={t("salesByDay")}>
          <SalesChart points={data.daily} granularity="day" type="area" height={280} />
        </DataCard>
        <DataCard title={t("salesByMonth")}>
          <SalesChart points={data.monthly} granularity="month" type="bar" height={280} />
        </DataCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <DataCard title={t("topProducts")} className="xl:col-span-2" bodyClassName="p-0 sm:p-0">
          {data.topProducts.length === 0 ? (
            <EmptyState title={td("empty")} />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>#</Th>
                  <Th>{tp("name")}</Th>
                  <Th align="end">{td("units")}</Th>
                  <Th align="end">{td("revenue")}</Th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p, i) => (
                  <Tr key={p.productId}>
                    <Td className="text-gray-400">{i + 1}</Td>
                    <Td className="min-w-52">
                      <Link href={`/productos/${p.productId}`} className="font-medium text-gray-800 hover:text-brand-600 dark:text-white/90">
                        {p.name}
                      </Link>
                      <span className="block font-mono text-xs text-gray-500">{p.code}</span>
                    </Td>
                    <Td align="end" className="font-semibold">
                      {f.number(p.units)}
                    </Td>
                    <Td align="end">{f.money(p.revenue)}</Td>
                  </Tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </DataCard>

        <DataCard title={t("byPaymentMethod")}>
          {data.byPaymentMethod.length === 0 ? (
            <EmptyState title={td("empty")} />
          ) : (
            <ul className="space-y-4">
              {data.byPaymentMethod.map((m) => (
                <li key={m.code}>
                  <div className="mb-1.5 flex justify-between gap-2 text-sm">
                    <span className="font-medium text-gray-800 dark:text-white/90">{pay(m.code, m.name)}</span>
                    <span className="text-gray-500 tabular-nums dark:text-gray-400">{m.count}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className="h-full rounded-full bg-navy-600" style={{ width: `${(m.total / maxMethod) * 100}%` }} />
                    </div>
                    <span className="w-28 text-end text-xs font-semibold text-gray-700 tabular-nums dark:text-gray-300">
                      {f.money(m.total)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DataCard>
      </div>

      <DataCard title={t("lowStock")} subtitle={String(data.lowStock.length)} bodyClassName="p-0 sm:p-0">
        {data.lowStock.length === 0 ? (
          <EmptyState title={t("lowStock")} icon={<CheckCircleIcon />} />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>{tp("name")}</Th>
                <Th>{tp("category")}</Th>
                <Th>{tp("supplier")}</Th>
                <Th align="end">{tp("stock")}</Th>
                <Th align="end">{tp("minStock")}</Th>
                <Th>{tp("status")}</Th>
              </tr>
            </thead>
            <tbody>
              {data.lowStock.map((p) => (
                <Tr key={p.id}>
                  <Td className="min-w-52">
                    <Link href={`/productos/${p.id}`} className="font-medium text-gray-800 hover:text-brand-600 dark:text-white/90">
                      {p.name}
                    </Link>
                    <span className="block font-mono text-xs text-gray-500">{p.code}</span>
                  </Td>
                  <Td>{p.categoryName}</Td>
                  <Td>{p.supplierName ?? "—"}</Td>
                  <Td align="end" className="font-semibold">
                    {p.stock}
                  </Td>
                  <Td align="end">{p.minStock}</Td>
                  <Td>
                    <StockBadge status={p.stock === 0 ? "out" : "low"} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </DataCard>

      <DataCard title={t("history")} subtitle={`${ts("total")}: ${f.number(history.total)}`} bodyClassName="p-0 sm:p-0">
        <SalesTable data={history} emptyText={td("empty")} />
      </DataCard>
    </div>
  );
}
