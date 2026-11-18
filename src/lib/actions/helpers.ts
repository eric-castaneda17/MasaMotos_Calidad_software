import "server-only";

import type { ActionResult } from "@/lib/action-result";
import { AuthError } from "@/lib/auth/dal";
import type { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createLogContext, elapsed, logEvent, type LogContext } from "@/lib/observability/logger";

export class DomainError extends Error {
  constructor(
    public readonly key: string,
    public readonly params?: Record<string, string | number>,
    public readonly field?: string,
  ) {
    super(key);
  }
}

/** Claves de error que lanzan las funciones SQL (supabase/migrations/003_functions.sql). */
const SQL_ERROR_KEYS = new Set([
  "forbidden",
  "validation",
  "notFound",
  "insufficientStock",
  "productInactive",
  "noStockChange",
  "emptyCart",
  "customerRequired",
  "paymentMethodRequired",
  "amountReceivedTooLow",
  "alreadyVoided",
  "stockViaMovements",
  "productHasHistory",
]);

/** `uniqueMap` asocia un fragmento del nombre de la restricción única con su clave de error. */
export function throwDbError(
  error: PostgrestError | null,
  uniqueMap: Record<string, { key: string; field?: string }> = {},
): void {
  if (!error) return;
  if (error.code === "P0001" && SQL_ERROR_KEYS.has(error.message)) {
    let params: Record<string, string | number> | undefined;
    try {
      params = error.details ? JSON.parse(error.details) : undefined;
    } catch {
      params = undefined;
    }
    throw new DomainError(error.message, params);
  }
  if (error.code === "23505") {
    const text = `${error.message} ${error.details ?? ""}`;
    const match = Object.entries(uniqueMap).find(([fragment]) => text.includes(fragment));
    if (match) throw new DomainError(match[1].key, undefined, match[1].field);
    throw new DomainError("duplicate");
  }
  if (error.code === "23503") throw new DomainError("inUse");
  if (error.code === "23514") throw new DomainError("validation");
  // 42501: violación de RLS / permisos insuficientes.
  if (error.code === "42501") throw new DomainError("forbidden");
  if (error.code === "PGRST116") throw new DomainError("notFound");
  throw error;
}

export async function runAction<T>(
  fn: () => Promise<ActionResult<T>>,
  context: LogContext = createLogContext(),
  operation: "createSale" | "serverAction" = "serverAction",
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AuthError) {
      logEvent("ACTION_REJECTED", context, { reason: err.key, operation, durationMs: elapsed(context) });
      return { ok: false, message: `errors.${err.key}` };
    }
    if (err instanceof DomainError) {
      logEvent(err.key === "generic" ? "ACTION_ERROR" : "ACTION_REJECTED", context, {
        reason: err.key === "generic" ? "internal" : "validation",
        operation,
        durationMs: elapsed(context),
      });
      return {
        ok: false,
        message: `errors.${err.key}`,
        params: err.params,
        fieldErrors: err.field ? { [err.field]: `errors.${err.key}` } : undefined,
      };
    }
    // Las redirecciones de Next.js (redirect()) deben propagarse.
    if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_")) {
      throw err;
    }
    logEvent("ACTION_ERROR", context, { reason: "internal", operation, durationMs: elapsed(context) });
    return { ok: false, message: "errors.generic" };
  }
}

export function refreshAll() {
  revalidatePath("/", "layout");
}
