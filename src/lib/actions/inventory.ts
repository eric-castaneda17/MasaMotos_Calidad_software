"use server";

import type { ActionResult, FormState } from "@/lib/action-result";
import { requireActionUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { formDataToObject, movementSchema, toFieldErrors } from "@/lib/validation/schemas";
import { DomainError, refreshAll, runAction, throwDbError } from "./helpers";

/** register_movement bloquea el producto y nunca deja stock negativo. */
export async function registerMovementAction(_prev: FormState, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireActionUser("inventory.manage");
    const parsed = movementSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { ok: false, message: "errors.validation", fieldErrors: toFieldErrors(parsed.error) };
    }
    const { productId, type, quantity, reason } = parsed.data;
    if (type !== "ADJUSTMENT" && quantity <= 0) {
      return { ok: false, message: "errors.validation", fieldErrors: { quantity: "validation.positive" } };
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("register_movement", {
      p_product_id: productId,
      p_type: type,
      p_quantity: quantity,
      p_reason: reason ?? null,
    });
    try {
      throwDbError(error);
    } catch (e) {
      if (e instanceof DomainError && (e.key === "insufficientStock" || e.key === "noStockChange")) {
        throw new DomainError(e.key, e.params, "quantity");
      }
      throw e;
    }
    refreshAll();
    return { ok: true, message: "toast.movementRegistered" };
  });
}
