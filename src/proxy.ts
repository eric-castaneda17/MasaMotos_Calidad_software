import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { routing } from "./i18n/routing";
import { supabasePublicEnv } from "./lib/supabase/env";
import { createLogContext, logEvent } from "./lib/observability/logger";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PATHS = ["/signin"];

/** Idioma por defecto, refresco de la sesión de Supabase y redirección a /signin. Los roles se validan en cada página y con RLS. */
export default async function proxy(request: NextRequest) {
  if (!request.cookies.has("NEXT_LOCALE")) {
    request.cookies.set("NEXT_LOCALE", routing.defaultLocale);
  }

  const refreshed: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const { url, key } = supabasePublicEnv();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          refreshed.push({ name, value, options });
        });
      },
    },
  });

  // getClaims() verifica la firma del JWT (y lo renueva si expiró).
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = !!data?.claims?.sub;

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  let response: NextResponse;
  if (!isAuthenticated && !isPublic) {
    logEvent("ACCESS_DENIED", createLogContext(), { reason: "unauthorized", operation: "proxy" });
    response = NextResponse.redirect(new URL("/signin", request.nextUrl));
  } else if (isAuthenticated && isPublic) {
    response = NextResponse.redirect(new URL("/", request.nextUrl));
  } else {
    response = intlMiddleware(request);
  }

  refreshed.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}

export const config = {
  matcher: ["/((?!api/|_next|_vercel|.*\\..*).*)"],
};
