"use server";

import type { ActionResult, FormState } from "@/lib/action-result";
import { requireActionUser } from "@/lib/auth/dal";
import { searchTerm } from "@/lib/data/search";
import { createClient } from "@/lib/supabase/server";
import { customerSchema, formDataToObject, toFieldErrors } from "@/lib/validation/schemas";
import { DomainError, refreshAll, runAction, throwDbError } from "./helpers";

export type CustomerOption = {
  id: number;
  fullName: string;
  documentType: string;
  documentNumber: string;
  phone: string | null;
  email: string | null;
};

const SELECT = "id, full_name, document_type, document_number, phone, email";

type Row = {
  id: number;
  full_name: string;
  document_type: string;
  document_number: string;
  phone: string | null;
  email: string | null;
};

const toOption = (r: Row): CustomerOption => ({
  id: r.id,
  fullName: r.full_name,
  documentType: r.document_type,
  documentNumber: r.document_number,
  phone: r.phone,
  email: r.email,
});

export async function saveCustomerAction(
  customerId: number | null,
  _prev: FormState,
  formData: FormData,
): Promise<ActionResult<CustomerOption>> {
  return runAction(async () => {
    await requireActionUser("customers.manage");
    const parsed = customerSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { ok: false, message: "errors.validation", fieldErrors: toFieldErrors(parsed.error) };
    }
    const d = parsed.data;
    const supabase = await createClient();
    const { data: dup } = await supabase
      .from("customers")
      .select("id")
      .eq("document_type", d.documentType)
      .eq("document_number", d.documentNumber)
      .maybeSingle();
    if (dup && dup.id !== customerId) throw new DomainError("duplicateDocument", undefined, "documentNumber");

    const row = {
      full_name: d.fullName,
      document_type: d.documentType,
      document_number: d.documentNumber,
      phone: d.phone ?? null,
      email: d.email?.toLowerCase() ?? null,
      address: d.address ?? null,
    };
    const { data, error } = customerId
      ? await supabase.from("customers").update(row).eq("id", customerId).select(SELECT).single()
      : await supabase.from("customers").insert(row).select(SELECT).single();
    throwDbError(error, { document: { key: "duplicateDocument", field: "documentNumber" } });
    refreshAll();
    return {
      ok: true,
      message: customerId ? "toast.customerUpdated" : "toast.customerCreated",
      data: toOption(data as Row),
    };
  });
}

export async function deleteCustomerAction(customerId: number): Promise<ActionResult> {
  return runAction(async () => {
    await requireActionUser("customers.manage");
    const supabase = await createClient();
    const { count } = await supabase
      .from("sales")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId);
    if ((count ?? 0) > 0) throw new DomainError("customerHasSales", { count: count ?? 0 });
    throwDbError((await supabase.from("customers").delete().eq("id", customerId)).error);
    refreshAll();
    return { ok: true, message: "toast.customerDeleted" };
  });
}

export async function searchCustomersAction(query: string): Promise<CustomerOption[]> {
  await requireActionUser("customers.view");
  const q = searchTerm(query);
  if (!q) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select(SELECT)
    .or(`full_name.ilike.%${q}%,document_number.ilike.%${q}%`)
    .order("full_name")
    .limit(8);
  return ((data ?? []) as Row[]).map(toOption);
}
