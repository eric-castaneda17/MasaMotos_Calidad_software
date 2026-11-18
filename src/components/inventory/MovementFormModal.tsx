"use client";

import FormModal from "@/components/common/FormModal";
import SelectInput from "@/components/form/SelectInput";
import TextInput from "@/components/form/TextInput";
import Button from "@/components/ui/button/Button";
import { useFormAction } from "@/hooks/useFormAction";
import { registerMovementAction } from "@/lib/actions/inventory";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";
import { useState } from "react";

export type MovementProductOption = { id: number; code: string; name: string; stock: number };

interface MovementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: MovementProductOption[];
  fixedProduct?: MovementProductOption;
}

type Kind = "ENTRY" | "EXIT" | "ADJUSTMENT";

export default function MovementFormModal({ isOpen, onClose, products, fixedProduct }: MovementFormModalProps) {
  const t = useTranslations("inventory");
  const tc = useTranslations("common");
  const [productId, setProductId] = useState<number | null>(fixedProduct?.id ?? null);
  const [type, setType] = useState<Kind>("ENTRY");
  const [quantity, setQuantity] = useState<number>(0);

  const { pending, onSubmit, fieldErrors, reset } = useFormAction(registerMovementAction, {
    onSuccess: () => {
      setQuantity(0);
      reset();
      onClose();
    },
  });

  const product = fixedProduct ?? products.find((p) => p.id === productId);
  const resulting =
    product === undefined
      ? null
      : type === "ENTRY"
        ? product.stock + quantity
        : type === "EXIT"
          ? product.stock - quantity
          : quantity;

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title={t("registerMovement")}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {fixedProduct ? (
          <>
            <input type="hidden" name="productId" value={fixedProduct.id} />
            <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-white/5">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{fixedProduct.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{fixedProduct.code}</p>
            </div>
          </>
        ) : (
          <SelectInput
            label={t("fields.product")}
            name="productId"
            placeholder={tc("select")}
            options={products.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name} (${p.stock})` }))}
            value={productId ? String(productId) : ""}
            onChange={(e) => setProductId(Number(e.target.value) || null)}
            required
            error={fieldErrors.productId}
          />
        )}

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-400">{t("fields.type")}</legend>
          <div className="grid grid-cols-3 gap-2">
            {(["ENTRY", "EXIT", "ADJUSTMENT"] as const).map((k) => (
              <label
                key={k}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                  type === k
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5",
                )}
              >
                <input
                  type="radio"
                  name="type"
                  value={k}
                  checked={type === k}
                  onChange={() => setType(k)}
                  className="sr-only"
                />
                {t(`types.${k}`)}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{t(`typeHelp.${type}`)}</p>
        </fieldset>

        <TextInput
          label={type === "ADJUSTMENT" ? t("fields.countedStock") : t("fields.quantity")}
          name="quantity"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={Number.isNaN(quantity) ? "" : quantity}
          onChange={(e) => setQuantity(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          required
          error={fieldErrors.quantity}
        />

        {product && resulting !== null && (
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm",
              resulting < 0
                ? "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-300"
                : "bg-navy-50 text-navy-800 dark:bg-navy-500/15 dark:text-navy-200",
            )}
          >
            <span>{t("currentStock", { stock: product.stock })}</span>
            <span className="font-semibold">
              {resulting < 0 ? t("negativeWarning") : t("resultingStock", { stock: resulting })}
            </span>
          </div>
        )}

        <TextInput
          label={t("fields.reason")}
          name="reason"
          placeholder={t("placeholders.reason")}
          maxLength={255}
          error={fieldErrors.reason}
        />

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={pending}>
            {tc("cancel")}
          </Button>
          <Button type="submit" size="sm" loading={pending} disabled={resulting !== null && resulting < 0} data-testid="movement-submit">
            {tc("save")}
          </Button>
        </div>
      </form>
    </FormModal>
  );
}
