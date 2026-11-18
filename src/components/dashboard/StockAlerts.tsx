"use client";

import DataCard from "@/components/common/DataCard";
import EmptyState from "@/components/common/EmptyState";
import { StockBadge } from "@/components/common/StatusBadges";
import { Link } from "@/i18n/navigation";
import { CheckCircleIcon } from "@/icons";
import type { LowStockItem } from "@/lib/data/analytics";
import { useTranslations } from "next-intl";

export default function StockAlerts({ items }: { items: LowStockItem[] }) {
  const t = useTranslations("dashboard.lowStock");
  const tp = useTranslations("products.fields");

  return (
    <DataCard
      title={t("title")}
      bodyClassName="p-0 sm:p-0"
      actions={
        <Link href="/productos?status=low" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
          {t("viewAll")}
        </Link>
      }
    >
      {items.length === 0 ? (
        <EmptyState title={t("empty")} icon={<CheckCircleIcon />} />
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/productos/${p.id}`}
                  className="block truncate text-sm font-medium text-gray-800 hover:text-brand-600 dark:text-white/90"
                >
                  {p.name}
                </Link>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {p.code} · {tp("stock")}: <b className="text-gray-700 dark:text-gray-200">{p.stock}</b> / {tp("minStock")}:{" "}
                  {p.minStock}
                </p>
              </div>
              <StockBadge status={p.stock === 0 ? "out" : "low"} />
            </li>
          ))}
        </ul>
      )}
    </DataCard>
  );
}
