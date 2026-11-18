"use client";

import EmptyState from "@/components/common/EmptyState";
import { useFormat } from "@/hooks/useFormat";
import { CartIcon, MinusIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { useTranslations } from "next-intl";
import type { CartLine } from "./types";

interface CartTableProps {
  lines: CartLine[];
  onQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

export default function CartTable({ lines, onQuantity, onRemove }: CartTableProps) {
  const t = useTranslations("pos.cart");
  const f = useFormat();

  if (lines.length === 0) {
    return <EmptyState title={t("empty")} description={t("emptyHint")} icon={<CartIcon />} />;
  }

  const qtyBtn =
    "flex size-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5";

  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800" data-testid="pos-cart">
      {lines.map((l) => (
        <li key={l.productId} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{l.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-mono">{l.code}</span> · {f.money(l.unitPrice)}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className={qtyBtn}
                onClick={() => onQuantity(l.productId, l.quantity - 1)}
                disabled={l.quantity <= 1}
                aria-label={t("decrease")}
              >
                <MinusIcon className="size-4" />
              </button>
              <input
                type="number"
                min={1}
                max={l.stock}
                value={l.quantity}
                onChange={(e) => onQuantity(l.productId, Math.floor(Number(e.target.value) || 1))}
                aria-label={t("quantity")}
                className="h-9 w-16 rounded-lg border border-gray-300 bg-transparent text-center text-sm font-semibold text-gray-800 tabular-nums focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:text-white"
              />
              <button
                type="button"
                className={qtyBtn}
                onClick={() => onQuantity(l.productId, l.quantity + 1)}
                disabled={l.quantity >= l.stock}
                aria-label={t("increase")}
              >
                <PlusIcon className="size-4" />
              </button>
            </div>
            <span className="w-28 text-end text-sm font-semibold text-gray-900 tabular-nums dark:text-white">
              {f.money(l.unitPrice * l.quantity)}
            </span>
            <button
              type="button"
              onClick={() => onRemove(l.productId)}
              className="flex size-9 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/15"
              aria-label={t("remove")}
              title={t("remove")}
            >
              <TrashBinIcon className="size-5 fill-current" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
