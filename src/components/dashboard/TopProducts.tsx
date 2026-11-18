"use client";

import DataCard from "@/components/common/DataCard";
import EmptyState from "@/components/common/EmptyState";
import { useFormat } from "@/hooks/useFormat";
import { Link } from "@/i18n/navigation";
import type { TopProduct } from "@/lib/data/analytics";
import { useTranslations } from "next-intl";

export default function TopProducts({ products }: { products: TopProduct[] }) {
  const t = useTranslations("dashboard.topProducts");
  const f = useFormat();
  const max = Math.max(1, ...products.map((p) => p.units));

  return (
    <DataCard title={t("title")}>
      {products.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <ol className="space-y-4">
          {products.map((p, i) => (
            <li key={p.productId}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <Link
                  href={`/productos/${p.productId}`}
                  className="min-w-0 truncate text-sm font-medium text-gray-800 hover:text-brand-600 dark:text-white/90"
                >
                  <span className="me-2 text-gray-400">{i + 1}.</span>
                  {p.name}
                </Link>
                <span className="shrink-0 text-sm font-semibold text-gray-900 tabular-nums dark:text-white">
                  {f.number(p.units)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-navy-600 to-brand-600"
                    style={{ width: `${(p.units / max) * 100}%` }}
                  />
                </div>
                <span className="w-28 shrink-0 text-end text-xs text-gray-500 tabular-nums dark:text-gray-400">
                  {f.money(p.revenue)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </DataCard>
  );
}
