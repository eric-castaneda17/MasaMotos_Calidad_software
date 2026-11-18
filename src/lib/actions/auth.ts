"use server";

import { redirect } from "@/i18n/navigation";
import type { ActionResult, FormState } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { formDataToObject, loginSchema, toFieldErrors } from "@/lib/validation/schemas";
import { getLocale } from "next-intl/server";

export async function loginAction(_prev: FormState, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { ok: false, message: "errors.validation", fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
  });
  if (error || !data.user) {
    return { ok: false, message: "errors.invalidCredentials" };
  }

  const { data: profile } = await supabase.from("profiles").select("active").eq("id", data.user.id).maybeSingle();
  if (!profile?.active) {
    await supabase.auth.signOut();
    return { ok: false, message: "errors.inactiveUser" };
  }

  await supabase.rpc("touch_last_login");
  const locale = await getLocale();
  return redirect({ href: "/", locale });
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const locale = await getLocale();
  redirect({ href: "/signin", locale });
}
