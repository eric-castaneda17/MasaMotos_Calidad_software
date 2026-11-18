"use server";

import { redirect } from "@/i18n/navigation";
import type { ActionResult, FormState } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { formDataToObject, loginSchema, toFieldErrors } from "@/lib/validation/schemas";
import { getLocale } from "next-intl/server";
import { createLogContext, elapsed, logEvent } from "@/lib/observability/logger";

export async function loginAction(_prev: FormState, formData: FormData): Promise<ActionResult> {
  const context = createLogContext();
  const parsed = loginSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    logEvent("AUTH_VALIDATION_REJECTED", context, { reason: "validation", durationMs: elapsed(context) });
    return { ok: false, message: "errors.validation", fieldErrors: toFieldErrors(parsed.error) };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
    });
    if (error || !data.user) {
      logEvent(error && (error.status ?? 0) >= 500 ? "AUTH_ERROR" : "AUTH_LOGIN_FAILED", context, {
        status: error?.status,
        durationMs: elapsed(context),
      });
      return { ok: false, message: "errors.invalidCredentials" };
    }

    const { data: profile } = await supabase.from("profiles").select("active").eq("id", data.user.id).maybeSingle();
    if (!profile?.active) {
      logEvent("AUTH_LOGIN_INACTIVE", context, { durationMs: elapsed(context) });
      await supabase.auth.signOut();
      return { ok: false, message: "errors.inactiveUser" };
    }

    await supabase.rpc("touch_last_login");
    logEvent("AUTH_LOGIN_SUCCEEDED", context, { durationMs: elapsed(context) });
  } catch (error) {
    logEvent("AUTH_ERROR", context, { reason: "upstream", durationMs: elapsed(context) });
    throw error;
  }
  const locale = await getLocale();
  return redirect({ href: "/", locale });
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const locale = await getLocale();
  redirect({ href: "/signin", locale });
}
