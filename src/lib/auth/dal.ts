import "server-only";

import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import { cache } from "react";
import { can, type Permission, type Role } from "../permissions";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/** getUser() valida el token contra Supabase Auth. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, role, active")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile || !profile.active) return null;
  return { id: profile.id, name: profile.name, email: profile.email, role: profile.role as Role };
});

/** Para páginas: redirige al login si no hay sesión, o al inicio si falta el permiso. */
export async function requirePageUser(permission?: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  const locale = await getLocale();
  if (!user) return redirect({ href: "/signin", locale });
  if (permission && !can(user.role, permission)) return redirect({ href: "/", locale });
  return user;
}

export class AuthError extends Error {
  constructor(public readonly key: "unauthorized" | "forbidden") {
    super(key);
  }
}

/** Para server actions / route handlers: lanza AuthError en lugar de redirigir. */
export async function requireActionUser(permission?: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("unauthorized");
  if (permission && !can(user.role, permission)) throw new AuthError("forbidden");
  return user;
}
