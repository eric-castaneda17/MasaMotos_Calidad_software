"use client";

import { DataTable, Td, Th, Tr } from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import { SaleStatusBadge } from "@/components/common/StatusBadges";
import UrlPagination from "@/components/common/UrlPagination";
import { useFormat } from "@/hooks/useFormat";
import { usePaymentLabel } from "@/hooks/usePaymentLabel";
import { Link } from "@/i18n/navigation";
import { ReceiptIcon } from "@/icons";
import type { Paginated } from "@/lib/data/pagination";
import type { SaleRow } from "@/lib/data/sales";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";

interface SalesTableProps {
  data: Paginated<SaleRow>;
  emptyText: string;
  showCustomer?: boolean;
  showSeller?: boolean;
  paginate?: boolean;
}

export default function SalesTable({ data, emptyText, showCustomer = true, showSeller = true, paginate = true }: SalesTableProps) {
  const t = useTranslations("sales.fields");
  const f = useFormat();
  const payLabel = usePaymentLabel();

  if (data.rows.length === 0) return <EmptyState title={emptyText} icon={<ReceiptIcon />} />;

  return (
    <>
      <DataTable>
        <thead>
          <tr>
            <Th>{t("invoice")}</Th>
            <Th>{t("date")}</Th>
            {showCustomer && <Th>{t("customer")}</Th>}
            {showSeller && <Th>{t("seller")}</Th>}
            <Th>{t("paymentMethod")}</Th>
            <Th align="center">{t("items")}</Th>
            <Th align="end">{t("total")}</Th>
            <Th>{t("status")}</Th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((s) => (
            <Tr key={s.id} className={cn(s.status === "VOIDED" && "opacity-60")}>
              <Td className="whitespace-nowrap">
                {s.invoiceId ? (
                  <Link
                    href={`/facturas/${s.invoiceId}`}
                    className="font-mono font-semibold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {s.invoiceNumber}
                  </Link>
                ) : (
                  "—"
                )}
              </Td>
              <Td className="whitespace-nowrap">{f.dateTime(s.createdAt)}</Td>
              {showCustomer && (
                <Td className="min-w-44">
                  <span className="block font-medium text-gray-800 dark:text-white/90">{s.customerName}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">{s.customerDocument}</span>
                </Td>
              )}
              {showSeller && <Td className="whitespace-nowrap">{s.sellerName}</Td>}
              <Td className="whitespace-nowrap">{payLabel(s.paymentMethodCode, s.paymentMethodName)}</Td>
              <Td align="center">{s.itemCount}</Td>
              <Td align="end" className="font-semibold whitespace-nowrap text-gray-900 dark:text-white">
                {f.money(s.total)}
              </Td>
              <Td>
                <SaleStatusBadge status={s.status} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </DataTable>
      {paginate && (
        <UrlPagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} />
      )}
    </>
  );
}
