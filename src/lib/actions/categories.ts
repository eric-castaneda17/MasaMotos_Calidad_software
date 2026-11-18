"use server";

import type { ActionResult, FormState } from "@/lib/action-result";
import { requireActionUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { categorySchema, formDataToObject, toFieldErrors } from "@/lib/validation/schemas";
import { DomainError, refreshAll, runAction, throwDbError } from "./helpers";

const UNIQUE = { categories_name_key: { key: "duplicateCategory", field: "name" } };

export async function saveCategoryAction(
  categoryId: number | null,
  _prev: FormState,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    await requireActionUser("categories.manage");
    const parsed = categorySchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { ok: false, message: "errors.validation", fieldErrors: toFieldErrors(parsed.error) };
    }
    const supabase = await createClient();
    const { data: dup } = await supabase.from("categories").select("id").ilike("name", parsed.data.name).maybeSingle();
    if (dup && dup.id !== categoryId) throw new DomainError("duplicateCategory", undefined, "name");

    const row = { name: parsed.data.name, description: parsed.data.description ?? null, active: parsed.data.active };
    const { error } = categoryId
      ? await supabase.from("categories").update(row).eq("id", categoryId)
      : await supabase.from("categories").insert(row);
    throwDbError(error, UNIQUE);
    refreshAll();
    return { ok: true, message: categoryId ? "toast.categoryUpdated" : "toast.categoryCreated" };
  });
}

export async function deleteCategoryAction(categoryId: number): Promise<ActionResult> {
  return runAction(async () => {
    await requireActionUser("categories.manage");
    const supabase = await createClient();
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId);
    if ((count ?? 0) > 0) throw new DomainError("categoryInUse", { count: count ?? 0 });
    throwDbError((await supabase.from("categories").delete().eq("id", categoryId)).error);
    refreshAll();
    return { ok: true, message: "toast.categoryDeleted" };
  });
}
