"use client";

import ProductThumb from "@/components/products/ProductThumb";
import { useFormat } from "@/hooks/useFormat";
import { PlusIcon, SearchIcon } from "@/icons";
import { type PosProduct, searchPosProductsAction } from "@/lib/actions/pos";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

interface ProductSearchProps {
  onAdd: (p: PosProduct) => void;
  /** Unidades ya agregadas al carrito por producto. */
  inCart: Map<number, number>;
  /** Cambia tras cada venta para recargar las existencias. */
  refreshKey: number;
}

export default function ProductSearch({ onAdd, inCart, refreshKey }: ProductSearchProps) {
  const t = useTranslations("pos");
  const f = useFormat();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PosProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQuery = useRef("");

  const search = useCallback((q: string) => {
    startTransition(async () => {
      const rows = await searchPosProductsAction(q);
      setResults(rows);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    search(latestQuery.current);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refreshKey, search]);

  const onChange = (v: string) => {
    setQuery(v);
    latestQuery.current = v;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => search(v), 250);
  };

  const available = (p: PosProduct) => p.stock - (inCart.get(p.id) ?? 0);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const first = results.find((p) => available(p) > 0);
      if (first) {
        onAdd(first);
        setQuery("");
        latestQuery.current = "";
        search("");
      }
    }
  };

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
          {isPending ? (
            <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <SearchIcon className="size-5" />
          )}
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          autoFocus
          className="h-12 w-full rounded-xl border border-gray-300 bg-white ps-12 pe-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          data-testid="pos-search"
        />
      </div>
      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{t("searchHint")}</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3" aria-busy={isPending}>
        {loaded && results.length === 0 && (
          <p className="col-span-full rounded-xl bg-gray-50 py-8 text-center text-sm text-gray-500 dark:bg-white/3 dark:text-gray-400">
            {t("noResults")}
          </p>
        )}
        {results.map((p) => {
          const left = available(p);
          const disabled = left <= 0;
          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => onAdd(p)}
              className={cn(
                "group flex min-w-0 items-center gap-3 rounded-xl border bg-white p-3 text-start transition dark:bg-white/3",
                disabled
                  ? "cursor-not-allowed border-gray-200 opacity-55 dark:border-gray-800"
                  : "border-gray-200 hover:border-brand-300 hover:shadow-theme-sm dark:border-gray-800 dark:hover:border-brand-700",
              )}
              data-testid={`pos-product-${p.code}`}
            >
              <ProductThumb productId={p.id} hasImage={p.hasImage} name={p.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">{p.name}</span>
                <span className="block truncate font-mono text-xs text-gray-500 dark:text-gray-400">{p.code}</span>
                <span className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 tabular-nums dark:text-white">
                    {f.money(p.salePrice)}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      disabled ? "text-error-600 dark:text-error-400" : "text-success-600 dark:text-success-400",
                    )}
                  >
                    {disabled ? t("outOfStock") : t("available", { stock: left })}
                  </span>
                </span>
              </span>
              {!disabled && (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-500/15 dark:text-brand-400">
                  <PlusIcon className="size-4" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
