"use server";

import type { ActionResult, FormState } from "@/lib/action-result";
import { requireActionUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { formDataToObject, paymentMethodSchema, settingsSchema, toFieldErrors } from "@/lib/validation/schemas";
import { DomainError, refreshAll, runAction, throwDbError } from "./helpers";

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireActionUser("settings.manage");
    const parsed = settingsSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { ok: false, message: "errors.validation", fieldErrors: toFieldErrors(parsed.error) };
    }
    const d = parsed.data;
    const supabase = await createClient();
    const { error } = await supabase
      .from("settings")
      .update({
        company_name: d.companyName,
        company_tax_id: d.companyTaxId ?? "",
        company_address: d.companyAddress ?? "",
        company_phone: d.companyPhone ?? "",
        company_email: d.companyEmail ?? "",
        tax_rate: d.taxRate,
        tax_enabled: d.taxEnabled,
        invoice_prefix: d.invoicePrefix.toUpperCase(),
        invoice_footer: d.invoiceFooter ?? "",
      })
      .eq("id", 1);
    throwDbError(error);
    refreshAll();
    return { ok: true, message: "toast.settingsSaved" };
  });
}

export async function savePaymentMethodAction(
  methodId: number | null,
  _prev: FormState,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    await requireActionUser("settings.manage");
    const parsed = paymentMethodSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { ok: false, message: "errors.validation", fieldErrors: toFieldErrors(parsed.error) };
    }
    const { name, active } = parsed.data;
    const supabase = await createClient();
    const { data: dup } = await supabase.from("payment_methods").select("id").ilike("name", name).maybeSingle();
    if (dup && dup.id !== methodId) throw new DomainError("duplicatePaymentMethod", undefined, "name");

    const { error } = methodId
      ? await supabase.from("payment_methods").update({ name, active }).eq("id", methodId)
      : await supabase
          .from("payment_methods")
          .insert({ code: `CUSTOM_${Date.now().toString(36).toUpperCase()}`, name, active });
    throwDbError(error);
    refreshAll();
    return { ok: true, message: "toast.paymentMethodSaved" };
  });
}
