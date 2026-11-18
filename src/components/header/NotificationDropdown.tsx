"use client";

import { Link } from "@/i18n/navigation";
import { useClickOutside } from "@/hooks/useClickOutside";
import { BellIcon } from "@/icons";
import type { LowStockItem } from "@/lib/data/analytics";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

export default function NotificationDropdown({ alerts }: { alerts: LowStockItem[] }) {
  const t = useTranslations("header.notifications");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="relative flex size-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("title")}
        aria-expanded={open}
      >
        {alerts.length > 0 && (
          <span className="absolute -top-0.5 -end-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] leading-5 font-bold text-white">
            {alerts.length}
          </span>
        )}
        <BellIcon className="size-5" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute end-0 z-40 mt-2 flex w-[calc(100vw-2rem)] max-w-sm flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg sm:w-90 dark:border-gray-800 dark:bg-gray-dark">
          <h3 className="mb-2 border-b border-gray-100 px-2 pb-3 text-base font-semibold text-gray-800 dark:border-gray-800 dark:text-white/90">
            {t("title")}
          </h3>
          {alerts.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>
          ) : (
            <ul className="custom-scrollbar max-h-80 overflow-y-auto">
              {alerts.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/productos/${a.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2.5 shrink-0 rounded-full",
                        a.stock === 0 ? "bg-error-500" : "bg-warning-500",
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                        {a.name}
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {a.code} · {a.stock === 0 ? t("outOfStock") : t("lowStock", { stock: a.stock, min: a.minStock })}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/productos?status=low"
            onClick={() => setOpen(false)}
            className="mt-3 block rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t("viewAll")}
          </Link>
        </div>
      )}
    </div>
  );
}
