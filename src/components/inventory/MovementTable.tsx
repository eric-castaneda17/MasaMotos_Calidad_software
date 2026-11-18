"use client";

import { DataTable, Td, Th, Tr } from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import { MovementBadge } from "@/components/common/StatusBadges";
import UrlPagination from "@/components/common/UrlPagination";
import { useFormat } from "@/hooks/useFormat";
import { Link } from "@/i18n/navigation";
import { SwapIcon } from "@/icons";
import type { MovementRow } from "@/lib/data/inventory";
import type { Paginated } from "@/lib/data/pagination";
import { useTranslations } from "next-intl";

const sign = { ENTRY: "+", VOID: "+", EXIT: "−", SALE: "−", ADJUSTMENT: "±" } as const;

export default function MovementTable({ data, showProduct = true }: { data: Paginated<MovementRow>; showProduct?: boolean }) {
  const t = useTranslations("inventory");
  const f = useFormat();

  const reason = (m: MovementRow) => {
    if (m.reason === "initialStock") return t("reasons.initialStock");
    return m.reason ?? "";
  };

  if (data.rows.length === 0) return <EmptyState title={t("empty")} icon={<SwapIcon />} />;

  return (
    <>
      <DataTable>
        <thead>
          <tr>
            <Th>{t("fields.date")}</Th>
            {showProduct && <Th>{t("fields.product")}</Th>}
            <Th>{t("fields.type")}</Th>
            <Th align="end">{t("fields.quantity")}</Th>
            <Th align="end">{t("fields.before")}</Th>
            <Th align="end">{t("fields.after")}</Th>
            <Th>{t("fields.reference")}</Th>
            <Th>{t("fields.user")}</Th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((m) => (
            <Tr key={m.id}>
              <Td className="whitespace-nowrap">{f.dateTime(m.createdAt)}</Td>
              {showProduct && (
                <Td className="min-w-48">
                  <Link href={`/productos/${m.productId}`} className="font-medium text-gray-800 hover:text-brand-600 dark:text-white/90">
                    {m.productName}
                  </Link>
                  <span className="block font-mono text-xs text-gray-500">{m.productCode}</span>
                </Td>
              )}
              <Td>
                <MovementBadge type={m.type} />
              </Td>
              <Td align="end" className="font-semibold">
                {sign[m.type]}
                {m.quantity}
              </Td>
              <Td align="end">{m.stockBefore}</Td>
              <Td align="end" className="font-medium text-gray-900 dark:text-white">
                {m.stockAfter}
              </Td>
              <Td className="max-w-64">
                {m.invoiceId ? (
                  <Link href={`/facturas/${m.invoiceId}`} className="font-mono text-brand-600 hover:underline dark:text-brand-400">
                    {m.invoiceNumber}
                  </Link>
                ) : null}
                {m.reason && <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{reason(m)}</span>}
              </Td>
              <Td className="whitespace-nowrap">{m.userName ?? "—"}</Td>
            </Tr>
          ))}
        </tbody>
      </DataTable>
      <UrlPagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} />
    </>
  );
}
