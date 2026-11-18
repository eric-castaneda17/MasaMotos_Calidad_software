import { fromCents, toCents } from "./money";

export type DiscountType = "PERCENT" | "AMOUNT";

export type CalcLine = { unitPrice: number; quantity: number };

export type SaleTotals = {
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
};

/** Compartido por el POS (vista previa) y el servidor. El impuesto se aplica a subtotal - descuento. */
export function calculateTotals(
  lines: CalcLine[],
  discountType: DiscountType,
  discountValue: number,
  taxRate: number,
  taxEnabled: boolean,
): SaleTotals {
  const subtotalC = lines.reduce(
    (acc, l) => acc + toCents(l.unitPrice) * l.quantity,
    0,
  );
  const safeValue =
    Number.isFinite(discountValue) && discountValue > 0 ? discountValue : 0;
  let discountC =
    discountType === "PERCENT"
      ? Math.round((subtotalC * Math.min(safeValue, 100)) / 100)
      : toCents(safeValue);
  discountC = Math.min(discountC, subtotalC);
  const rate = taxEnabled ? taxRate : 0;
  const taxC = Math.round(((subtotalC - discountC) * rate) / 100);
  return {
    subtotal: fromCents(subtotalC),
    discount: fromCents(discountC),
    taxRate: rate,
    taxAmount: fromCents(taxC),
    total: fromCents(subtotalC - discountC + taxC),
  };
}
