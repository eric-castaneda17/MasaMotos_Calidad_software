"use client";

import SelectInput from "@/components/form/SelectInput";
import { useFormat } from "@/hooks/useFormat";
import { usePaymentLabel } from "@/hooks/usePaymentLabel";
import type { DiscountType, SaleTotals } from "@/lib/sale-calc";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";
import type { PaymentMethodOption } from "./types";

interface PaymentPanelProps {
  methods: PaymentMethodOption[];
  methodId: number | null;
  onMethod: (id: number) => void;
  discountType: DiscountType;
  discountValue: number;
  onDiscount: (type: DiscountType, value: number) => void;
  amountReceived: string;
  onAmountReceived: (v: string) => void;
  notes: string;
  onNotes: (v: string) => void;
  totals: SaleTotals;
  taxEnabled: boolean;
  receivedError?: string;
}

export default function PaymentPanel(p: PaymentPanelProps) {
  const t = useTranslations("pos");
  const f = useFormat();
  const label = usePaymentLabel();
  const selected = p.methods.find((m) => m.id === p.methodId);
  const isCash = selected?.code === "CASH";
  const received = Number(p.amountReceived);
  const change = isCash && received > 0 ? received - p.totals.total : null;

  return (
    <div className="space-y-5">
      <SelectInput
        label={t("payment.method")}
        name="paymentMethodId"
        value={p.methodId ? String(p.methodId) : ""}
        onChange={(e) => p.onMethod(Number(e.target.value))}
        options={p.methods.map((m) => ({ value: String(m.id), label: label(m.code, m.name) }))}
        required
      />

      <div>
        <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-400">{t("discount.title")}</p>
        <div className="flex gap-2">
          <div className="flex shrink-0 rounded-lg border border-gray-300 p-0.5 dark:border-gray-700" role="group">
            {(["PERCENT", "AMOUNT"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => p.onDiscount(k, 0)}
                aria-pressed={p.discountType === k}
                title={k === "PERCENT" ? t("discount.percentLabel") : t("discount.amountLabel")}
                className={cn(
                  "h-9 w-10 rounded-md text-sm font-semibold",
                  p.discountType === k
                    ? "bg-navy-700 text-white dark:bg-navy-600"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5",
                )}
              >
                {k === "PERCENT" ? t("discount.percent") : t("discount.amount")}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={0}
            max={p.discountType === "PERCENT" ? 100 : undefined}
            step="any"
            inputMode="decimal"
            value={p.discountValue || ""}
            onChange={(e) => {
              let v = Math.max(0, Number(e.target.value) || 0);
              if (p.discountType === "PERCENT") v = Math.min(v, 100);
              p.onDiscount(p.discountType, v);
            }}
            placeholder="0"
            aria-label={p.discountType === "PERCENT" ? t("discount.percentLabel") : t("discount.amountLabel")}
            className="h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 tabular-nums focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
            data-testid="pos-discount"
          />
        </div>
      </div>

      {isCash && (
        <div>
          <label htmlFor="amountReceived" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            {t("payment.amountReceived")}
          </label>
          <input
            id="amountReceived"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={p.amountReceived}
            onChange={(e) => p.onAmountReceived(e.target.value)}
            className={cn(
              "h-11 w-full rounded-lg border bg-transparent px-4 text-sm text-gray-800 tabular-nums focus:ring-3 focus:outline-hidden dark:text-white/90",
              p.receivedError
                ? "border-error-500 focus:ring-error-500/20"
                : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700",
            )}
            data-testid="pos-received"
          />
          {p.receivedError && <p className="mt-1.5 text-xs text-error-600 dark:text-error-400">{p.receivedError}</p>}
          {change !== null && change >= 0 && (
            <p className="mt-1.5 text-sm text-success-700 dark:text-success-400">
              {t("payment.change")}: <b className="tabular-nums">{f.money(change)}</b>
            </p>
          )}
        </div>
      )}

      <textarea
        value={p.notes}
        onChange={(e) => p.onNotes(e.target.value.slice(0, 500))}
        rows={2}
        placeholder={t("notesPlaceholder")}
        aria-label={t("notesPlaceholder")}
        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
      />

      <dl className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm dark:bg-white/3" data-testid="pos-totals">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <dt>{t("summary.subtotal")}</dt>
          <dd className="tabular-nums">{f.money(p.totals.subtotal)}</dd>
        </div>
        {p.totals.discount > 0 && (
          <div className="flex justify-between text-success-700 dark:text-success-400">
            <dt>{t("summary.discount")}</dt>
            <dd className="tabular-nums">−{f.money(p.totals.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <dt>{p.taxEnabled ? t("summary.tax", { rate: p.totals.taxRate }) : t("summary.taxDisabled")}</dt>
          <dd className="tabular-nums">{f.money(p.totals.taxAmount)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
          <dt className="font-semibold text-gray-900 dark:text-white">{t("summary.total")}</dt>
          <dd className="text-2xl font-bold text-brand-700 tabular-nums dark:text-brand-400" data-testid="pos-total">
            {f.money(p.totals.total)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
