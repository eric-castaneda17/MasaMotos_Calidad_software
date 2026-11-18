/** Eventos de servidor con datos acotados. Los cuerpos y errores originales quedan fuera del registro. */
const events = {
  APPLICATION_STARTED: ["INFO", "Runtime", "register", "success"],
  AUTH_LOGIN_SUCCEEDED: ["INFO", "Auth", "login", "success"],
  AUTH_LOGIN_FAILED: ["WARN", "Auth", "login", "rejected"],
  AUTH_LOGIN_INACTIVE: ["WARN", "Auth", "login", "rejected"],
  AUTH_VALIDATION_REJECTED: ["WARN", "Auth", "validate", "rejected"],
  AUTH_ERROR: ["ERROR", "Auth", "login", "error"],
  ADMIN_AUTH_ERROR: ["ERROR", "Users", "manage", "error"],
  ACCESS_DENIED: ["WARN", "Access", "authorize", "rejected"],
  SALE_VALIDATION_REJECTED: ["WARN", "Sales", "validate", "rejected"],
  SALE_STOCK_REJECTED: ["WARN", "Sales", "create", "rejected"],
  SALE_CREATED: ["INFO", "Sales", "create", "success"],
  ACTION_REJECTED: ["WARN", "Actions", "execute", "rejected"],
  ACTION_ERROR: ["ERROR", "Actions", "execute", "error"],
  REQUEST_ERROR: ["ERROR", "Runtime", "request", "error"],
} as const;

export type LogEvent = keyof typeof events;
type LogLevel = "INFO" | "WARN" | "ERROR";
export type LogContext = { correlationId: string; startedAt: number };
type LogMetadata = {
  durationMs?: number;
  status?: number;
  saleId?: number;
  invoiceId?: number;
  itemCount?: number;
  available?: number;
  reason?: "unauthorized" | "forbidden" | "validation" | "internal" | "upstream";
  operation?: "createSale" | "serverAction" | "page" | "proxy" | "report";
};

export function createLogContext(): LogContext {
  try {
    return { correlationId: crypto.randomUUID(), startedAt: performance.now() };
  } catch {
    // El fallo del reloj o generador tampoco debe detener la operación de negocio.
    return { correlationId: "00000000-0000-4000-8000-000000000000", startedAt: 0 };
  }
}

export function elapsed(context: LogContext): number | undefined {
  try {
    return context.startedAt > 0 ? Math.max(0, Math.round((performance.now() - context.startedAt) * 100) / 100) : undefined;
  } catch {
    return undefined;
  }
}

const reasons = new Set(["unauthorized", "forbidden", "validation", "internal", "upstream"]);
const operations = new Set(["createSale", "serverAction", "page", "proxy", "report"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Devuelve false si el registro falla, preservando la ejecución del llamador. */
export function logEvent(
  event: LogEvent,
  context: LogContext,
  metadata: LogMetadata = {},
  sink?: (line: string, level: LogLevel) => void,
): boolean {
  try {
    if (!Object.hasOwn(events, event)) return false;
    const [level, module, operation, result] = events[event];
    const safe: Record<string, string | number> = {};
    for (const field of ["durationMs", "status", "saleId", "invoiceId", "itemCount", "available"] as const) {
      const value = metadata[field];
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        if (field === "durationMs" || Number.isSafeInteger(value)) safe[field] = value;
      }
    }
    const reason = metadata.reason;
    const operationDetail = metadata.operation;
    const correlationId = context.correlationId;
    if (reason && reasons.has(reason)) safe.reason = reason;
    if (operationDetail && operations.has(operationDetail)) safe.operation = operationDetail;
    const record = {
      timestamp: new Date().toISOString(),
      level,
      event,
      module,
      operation,
      result,
      correlationId: uuid.test(correlationId) ? correlationId : createLogContext().correlationId,
      metadata: safe,
    };
    const line = JSON.stringify(record);
    if (sink) sink(line, level);
    else if (level === "ERROR") console.error(line);
    else if (level === "WARN") console.warn(line);
    else console.info(line);
    return true;
  } catch {
    return false;
  }
}
