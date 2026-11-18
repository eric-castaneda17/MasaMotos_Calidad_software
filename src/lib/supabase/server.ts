import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublicEnv } from "./env";

/** Cliente por solicitud con la sesión del usuario: todas las consultas pasan por RLS. */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = supabasePublicEnv();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un Server Component: el proxy (src/proxy.ts) refresca la sesión.
        }
      },
    },
  });
}
