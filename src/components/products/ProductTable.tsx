"use client";

import { DataTable, Td, Th, Tr } from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import { StockBadge } from "@/components/common/StatusBadges";
import UrlPagination from "@/components/common/UrlPagination";
import { useFormat } from "@/hooks/useFormat";
import { Link } from "@/i18n/navigation";
import type { ProductRow } from "@/lib/data/products";
import type { Paginated } from "@/lib/data/pagination";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";
import ProductRowActions from "./ProductRowActions";
import ProductThumb from "./ProductThumb";

interface ProductTableProps {
  data: Paginated<ProductRow>;
  canManage: boolean;
  filtered: boolean;
}

export default function ProductTable({ data, canManage, filtered }: ProductTableProps) {
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const f = useFormat();

  if (data.rows.length === 0) {
    return (
      <EmptyState
        title={filtered ? tc("emptySearch") : t("empty")}
        action={
          !filtered &&
          canManage && (
            <Link href="/productos/nuevo" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              {t("emptyAction")}
            </Link>
          )
        }
      />
    );
  }

  return (
    <>
      <DataTable>
        <thead>
          <tr>
            <Th>{t("fields.name")}</Th>
            <Th>{t("fields.category")}</Th>
            <Th>{t("fields.brand")}</Th>
            <Th align="end">{t("fields.salePrice")}</Th>
            <Th align="end">{t("fields.stock")}</Th>
            <Th>{t("fields.status")}</Th>
            <Th align="end">{tc("actions")}</Th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((p) => (
            <Tr key={p.id} className={cn(!p.active && "opacity-60")}>
              <Td className="min-w-64">
                <div className="flex items-center gap-3">
                  <ProductThumb productId={p.id} hasImage={p.hasImage} version={p.updatedAt} name={p.name} />
                  <div className="min-w-0">
                    <Link
                      href={`/productos/${p.id}`}
                      className="block truncate font-medium text-gray-800 hover:text-brand-600 dark:text-white/90"
                    >
                      {p.name}
                    </Link>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-mono">{p.code}</span>
                      {p.compatibleModel ? ` · ${p.compatibleModel}` : ""}
                    </p>
                  </div>
                </div>
              </Td>
              <Td className="whitespace-nowrap">{p.categoryName}</Td>
              <Td className="whitespace-nowrap">{p.brand}</Td>
              <Td align="end" className="font-medium whitespace-nowrap">
                {f.money(p.salePrice)}
              </Td>
              <Td align="end">
                <span
                  className={cn(
                    "font-semibold",
                    p.status === "out" && "text-error-600 dark:text-error-400",
                    p.status === "low" && "text-warning-600 dark:text-warning-400",
                  )}
                >
                  {f.number(p.stock)}
                </span>
                <span className="block text-xs text-gray-400">{t("minShort", { min: p.minStock })}</span>
              </Td>
              <Td>
                <StockBadge status={p.status} active={p.active} />
              </Td>
              <Td align="end">
                <ProductRowActions id={p.id} name={p.name} active={p.active} canManage={canManage} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </DataTable>
      <UrlPagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} />
    </>
  );
}
