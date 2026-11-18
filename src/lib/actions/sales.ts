"use server";

import type { ActionResult } from "@/lib/action-result";
import { requireActionUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { type SaleInput, saleSchema, toFieldErrors } from "@/lib/validation/schemas";
import { DomainError, refreshAll, runAction, throwDbError } from "./helpers";

export type CreateSaleResult = { saleId: number; invoiceId: number; invoiceNumber: string };

/** Toda la venta (stock, totales, detalle, movimientos y factura) ocurre en una transacción dentro de create_sale. */
export async function createSaleAction(input: SaleInput): Promise<ActionResult<CreateSaleResult>> {
  return runAction(async () => {
    await requireActionUser("sales.create");
    const parsed = saleSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error);
      const message = fieldErrors.items === "emptyCart" ? "errors.emptyCart" : "errors.validation";
      return { ok: false, message, fieldErrors };
    }
    const d = parsed.data;
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_sale", {
      p_customer_id: d.customerId,
      p_payment_method_id: d.paymentMethodId,
      p_discount_type: d.discountType,
      p_discount_value: d.discountValue,
      p_amount_received: d.amountReceived ?? null,
      p_notes: d.notes ?? null,
      p_items: d.items,
    });
    try {
      throwDbError(error);
    } catch (e) {
      if (e instanceof DomainError && e.key === "amountReceivedTooLow") {
        throw new DomainError(e.key, undefined, "amountReceived");
      }
      throw e;
    }
    refreshAll();
    return { ok: true, message: "toast.saleCreated", data: data as CreateSaleResult };
  });
}

export async function voidSaleAction(saleId: number, reason: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireActionUser("sales.void");
    const cleanReason = reason.trim().slice(0, 255);
    if (!cleanReason) {
      return { ok: false, message: "errors.validation", fieldErrors: { reason: "validation.required" } };
    }
    const supabase = await createClient();
    throwDbError((await supabase.rpc("void_sale", { p_sale_id: saleId, p_reason: cleanReason })).error);
    refreshAll();
    return { ok: true, message: "toast.saleVoided" };
  });
}
