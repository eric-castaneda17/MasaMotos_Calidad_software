"use server";

import type { ActionResult, FormState } from "@/lib/action-result";
import { requireActionUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { formDataToObject, supplierSchema, toFieldErrors } from "@/lib/validation/schemas";
import { DomainError, refreshAll, runAction, throwDbError } from "./helpers";

export async function saveSupplierAction(
  supplierId: number | null,
  _prev: FormState,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    await requireActionUser("suppliers.manage");
    const parsed = supplierSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { ok: false, message: "errors.validation", fieldErrors: toFieldErrors(parsed.error) };
    }
    const d = parsed.data;
    const supabase = await createClient();
    const { data: dup } = await supabase.from("suppliers").select("id").eq("tax_id", d.taxId).maybeSingle();
    if (dup && dup.id !== supplierId) throw new DomainError("duplicateTaxId", undefined, "taxId");

    const row = {
      name: d.name,
      tax_id: d.taxId,
      contact_name: d.contactName ?? null,
      phone: d.phone ?? null,
      email: d.email?.toLowerCase() ?? null,
      address: d.address ?? null,
      city: d.city ?? null,
      active: d.active,
    };
    const { error } = supplierId
      ? await supabase.from("suppliers").update(row).eq("id", supplierId)
      : await supabase.from("suppliers").insert(row);
    throwDbError(error, { tax_id: { key: "duplicateTaxId", field: "taxId" } });
    refreshAll();
    return { ok: true, message: supplierId ? "toast.supplierUpdated" : "toast.supplierCreated" };
  });
}

export async function deleteSupplierAction(supplierId: number): Promise<ActionResult> {
  return runAction(async () => {
    await requireActionUser("suppliers.manage");
    const supabase = await createClient();
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", supplierId);
    if ((count ?? 0) > 0) throw new DomainError("supplierInUse", { count: count ?? 0 });
    throwDbError((await supabase.from("suppliers").delete().eq("id", supplierId)).error);
    refreshAll();
    return { ok: true, message: "toast.supplierDeleted" };
  });
}
