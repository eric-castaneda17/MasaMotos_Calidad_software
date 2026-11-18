"use client";

import { useUrlParams } from "@/hooks/useUrlParams";
import { ChevronLeftIcon } from "@/icons";
import { useTranslations } from "next-intl";

interface UrlPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export default function UrlPagination({ page, totalPages, total, pageSize }: UrlPaginationProps) {
  const t = useTranslations("common");
  const { setParams, isPending } = useUrlParams();
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const go = (p: number) => setParams({ page: p > 1 ? String(p) : undefined }, false);

  const pages: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) pages.push(p);

  const btn =
    "flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-2.5 text-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5";

  return (
    <div
      className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:px-6 dark:border-gray-800"
      aria-busy={isPending}
    >
      <p className="text-sm text-gray-500 dark:text-gray-400">{t("showing", { from, to, total })}</p>
      {totalPages > 1 && (
        <nav className="flex items-center gap-1.5" aria-label={t("pageOf", { page, total: totalPages })}>
          <button type="button" className={btn} disabled={page <= 1} onClick={() => go(page - 1)} aria-label={t("previous")}>
            <ChevronLeftIcon className="size-4 rtl:rotate-180" />
          </button>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              aria-current={p === page ? "page" : undefined}
              className={
                p === page
                  ? "flex h-9 min-w-9 items-center justify-center rounded-lg bg-brand-600 px-2.5 text-sm font-medium text-white"
                  : btn
              }
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className={btn}
            disabled={page >= totalPages}
            onClick={() => go(page + 1)}
            aria-label={t("next")}
          >
            <ChevronLeftIcon className="size-4 rotate-180 rtl:rotate-0" />
          </button>
        </nav>
      )}
    </div>
  );
}
