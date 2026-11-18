"use server";

import type { ActionResult, FormState } from "@/lib/action-result";
import { requireActionUser } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  changePasswordSchema,
  formDataToObject,
  profileSchema,
  toFieldErrors,
  userCreateSchema,
  userUpdateSchema,
} from "@/lib/validation/schemas";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { DomainError, refreshAll, runAction, throwDbError } from "./helpers";

// Bloqueo de ~100 años para usuarios desactivados (Supabase Auth rechaza su inicio de sesión).
const BAN_FOREVER = "876000h";

async function assertUniqueEmail(email: string, exceptId?: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
  if (data && data.id !== exceptId) throw new DomainError("duplicateEmail", undefined, "email");
}

/** Impide dejar el sistema sin ningún administrador activo. */
async function assertNotLastAdmin(userId: string) {
  const supabase = await createClient();
  const { data: target } = await supabase.from("profiles").select("role, active").eq("id", userId).maybeSingle();
  if (!target || target.role !== "ADMIN" || !target.active) return;
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "ADMIN")
    .eq("active", true);
  if ((count ?? 0) <= 1) throw new DomainError("lastAdmin");
}

function authError(message: string | undefined): never {
  if (message && /already|registered|exists/i.test(message)) throw new DomainError("duplicateEmail", undefined, "email");
  if (message && /password/i.test(message)) throw new DomainError("validation", undefined, "password");
  throw new DomainError("generic");
}

export async function saveUserAction(userId: string | null, _prev: FormState, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const current = await requireActionUser("users.manage");
    const raw = formDataToObject(formData);
    const admin = createAdminClient();

    if (userId) {
      const parsed = userUpdateSchema.safeParse(raw);
      if (!parsed.success) {
        return { ok: false, message: "errors.validation", fieldErrors: toFieldErrors(parsed.error) };
      }
      const d = parsed.data;
      const email = d.email.toLowerCase();
      await assertUniqueEmail(email, userId);
      if (userId === current.id && (!d.active || d.role !== "ADMIN")) throw new DomainError("cannotDemoteSelf");
      if (!d.active || d.role !== "ADMIN") await assertNotLastAdmin(userId);

      const { error: authErr } = await admin.auth.admin.updateUserById(userId, {
        email,
        email_confirm: true,
        user_metadata: { name: d.name },
        app_metadata: { role: d.role, active: d.active },
        ban_duration: d.active ? "none" : BAN_FOREVER,
        ...(d.password ? { password: d.password } : {}),
      });
      if (authErr) authError(authErr.message);

      // Perfil (rol, estado): con la sesión del administrador → pasa por RLS.
      const supabase = await createClient();
      throwDbError(
        (await supabase.from("profiles").update({ name: d.name, email, role: d.role, active: d.active }).eq("id", userId))
          .error,
      );
    } else {
      const parsed = userCreateSchema.safeParse(raw);
      if (!parsed.success) {
        return { ok: false, message: "errors.validation", fieldErrors: toFieldErrors(parsed.error) };
      }
      const d = parsed.data;
      const email = d.email.toLowerCase();
      await assertUniqueEmail(email);
      // El trigger handle_new_user crea el perfil con el rol y estado de app_metadata.
      const { error: authErr } = await admin.auth.admin.createUser({
        email,
        password: d.password,
        email_confirm: true,
        user_metadata: { name: d.name },
        app_metadata: { role: d.role, active: d.active },
        ...(d.active ? {} : { ban_duration: BAN_FOREVER }),
      });
      if (authErr) authError(authErr.message);
    }
    refreshAll();
    return { ok: true, message: userId ? "toast.userUpdated" : "toast.userCreated" };
  });
}

export async function toggleUserActiveAction(userId: string): Promise<ActionResult> {
  return runAction(async () => {
    const current = await requireActionUser("users.manage");
    if (userId === current.id) throw new DomainError("cannotDemoteSelf");
    const supabase = await createClient();
    const { data: user } = await supabase.from("profiles").select("active, role").eq("id", userId).maybeSingle();
    if (!user) throw new DomainError("notFound");
    if (user.active) await assertNotLastAdmin(userId);

    const active = !user.active;
    throwDbError((await supabase.from("profiles").update({ active }).eq("id", userId)).error);
    const { error } = await createAdminClient().auth.admin.updateUserById(userId, {
      ban_duration: active ? "none" : BAN_FOREVER,
      app_metadata: { role: user.role, active },
    });
    if (error) authError(error.message);
    refreshAll();
    return { ok: true, message: active ? "toast.userActivated" : "toast.userDeactivated" };
  });
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const current = await requireActionUser();
    const parsed = profileSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { ok: false, message: "errors.validation", fieldErrors: toFieldErrors(parsed.error) };
    }
    const supabase = await createClient();
    throwDbError((await supabase.from("profiles").update({ name: parsed.data.name }).eq("id", current.id)).error);
    refreshAll();
    return { ok: true, message: "toast.profileUpdated" };
  });
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const current = await requireActionUser();
    const parsed = changePasswordSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { ok: false, message: "errors.validation", fieldErrors: toFieldErrors(parsed.error) };
    }
    // Verifica la contraseña actual con un cliente aislado (no toca la sesión activa).
    const { url, key } = supabasePublicEnv();
    const verifier = createPlainClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: wrong } = await verifier.auth.signInWithPassword({
      email: current.email,
      password: parsed.data.currentPassword,
    });
    if (wrong) throw new DomainError("wrongPassword", undefined, "currentPassword");
    await verifier.auth.signOut();

    const { error } = await createAdminClient().auth.admin.updateUserById(current.id, {
      password: parsed.data.newPassword,
    });
    if (error) authError(error.message);
    return { ok: true, message: "toast.passwordChanged" };
  });
}
