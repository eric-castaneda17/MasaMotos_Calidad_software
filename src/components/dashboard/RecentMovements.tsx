"use client";

import DataCard from "@/components/common/DataCard";
import EmptyState from "@/components/common/EmptyState";
import { MovementBadge } from "@/components/common/StatusBadges";
import { useCan } from "@/context/SessionContext";
import { useFormat } from "@/hooks/useFormat";
import { Link } from "@/i18n/navigation";
import type { DashboardData } from "@/lib/data/analytics";
import { useTranslations } from "next-intl";

const sign = { ENTRY: "+", VOID: "+", EXIT: "−", SALE: "−", ADJUSTMENT: "=" } as const;

export default function RecentMovements({ movements }: { movements: DashboardData["recentMovements"] }) {
  const t = useTranslations("dashboard.recentMovements");
  const f = useFormat();
  const canSeeInventory = useCan("inventory.manage");

  return (
    <DataCard
      title={t("title")}
      bodyClassName="p-0 sm:p-0"
      actions={
        canSeeInventory && (
          <Link href="/inventario" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            {t("viewAll")}
          </Link>
        )
      }
    >
      {movements.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {movements.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <MovementBadge type={m.type} />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/productos/${m.productId}`}
                  className="block truncate text-sm font-medium text-gray-800 hover:text-brand-600 dark:text-white/90"
                >
                  {m.productName}
                </Link>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {f.dateTime(m.createdAt)}
                  {m.userName ? ` · ${m.userName}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-gray-900 tabular-nums dark:text-white">
                {sign[m.type]}
                {m.quantity}
              </span>
            </li>
          ))}
        </ul>
      )}
    </DataCard>
  );
}
