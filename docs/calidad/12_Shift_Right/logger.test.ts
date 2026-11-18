import { afterEach, describe, expect, it, vi } from "vitest";
import { createLogContext, elapsed, logEvent, type LogEvent } from "../../../src/lib/observability/logger";

afterEach(() => vi.restoreAllMocks());

describe("Registro estructurado", () => {
  it("LOG-01 · registra campos obligatorios y correlación", () => {
    const sink = vi.fn();
    const context = createLogContext();
    expect(logEvent("SALE_CREATED", context, { saleId: 3, invoiceId: 4, itemCount: 2 }, sink)).toBe(true);
    const [line, level] = sink.mock.calls[0];
    expect(JSON.parse(line)).toMatchObject({
      level: "INFO", event: "SALE_CREATED", module: "Sales", operation: "create", result: "success",
      correlationId: context.correlationId, metadata: { saleId: 3, invoiceId: 4, itemCount: 2 },
    });
    expect(level).toBe("INFO");
    expect(new Date(JSON.parse(line).timestamp).toISOString()).toBe(JSON.parse(line).timestamp);
  });

  it.each([
    ["LOG-02", "AUTH_LOGIN_FAILED", "WARN", "warn"],
    ["LOG-03", "ACTION_ERROR", "ERROR", "error"],
    ["LOG-04", "APPLICATION_STARTED", "INFO", "info"],
  ] as const)("%s · usa la salida correspondiente a %s", (_id, event, level, method) => {
    const sink = vi.spyOn(console, method).mockImplementation(() => {});
    logEvent(event, createLogContext());
    expect(JSON.parse(sink.mock.calls[0][0]).level).toBe(level);
  });

  it("LOG-05 · excluye secretos, datos personales y errores completos", () => {
    const sink = vi.fn();
    const metadata = {
      saleId: 12, password: "FICTIONAL-SECRET", token: "FICTIONAL-TOKEN",
      authorization: "Bearer FICTIONAL", cookie: "FICTIONAL-COOKIE", email: "private@example.test",
      document: "FICTIONAL-DOCUMENT", body: { password: "FICTIONAL-SECRET" },
      error: new Error("FICTIONAL-ERROR"), reason: "private@example.test", operation: "FICTIONAL-URL",
    };
    logEvent("ACTION_ERROR", createLogContext(), metadata as never, sink);
    expect(JSON.parse(sink.mock.calls[0][0]).metadata).toEqual({ saleId: 12 });
    expect(sink.mock.calls[0][0]).not.toMatch(/FICTIONAL|private@|Bearer|password|cookie/);
  });

  it("LOG-06 · evita números no finitos y campos numéricos de texto", () => {
    const sink = vi.fn();
    logEvent("SALE_CREATED", createLogContext(), {
      saleId: NaN, invoiceId: -1, itemCount: Infinity, available: "FICTIONAL" as never, durationMs: 12.5,
    }, sink);
    expect(JSON.parse(sink.mock.calls[0][0]).metadata).toEqual({ durationMs: 12.5 });
  });

  it("LOG-07 · el fallo del destino no interrumpe al llamador", () => {
    expect(logEvent("ACTION_ERROR", createLogContext(), {}, () => { throw new Error("disk unavailable"); })).toBe(false);
  });

  it("LOG-08 · el fallo de console tampoco interrumpe al llamador", () => {
    vi.spyOn(console, "error").mockImplementation(() => { throw new Error("sink unavailable"); });
    expect(() => logEvent("ACTION_ERROR", createLogContext())).not.toThrow();
    expect(logEvent("ACTION_ERROR", createLogContext())).toBe(false);
  });

  it("LOG-09 · rechaza eventos arbitrarios", () => {
    const sink = vi.fn();
    expect(logEvent("FICTIONAL-SECRET" as LogEvent, createLogContext(), {}, sink)).toBe(false);
    expect(sink).not.toHaveBeenCalled();
  });

  it("LOG-10 · reemplaza correlación externa inválida", () => {
    const sink = vi.fn();
    logEvent("ACTION_ERROR", { correlationId: "private@example.test", startedAt: 1 }, {}, sink);
    expect(sink.mock.calls[0][0]).not.toContain("private@");
    expect(JSON.parse(sink.mock.calls[0][0]).correlationId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("LOG-11 · conserva correlación entre eventos de una operación", () => {
    const sink = vi.fn();
    const context = createLogContext();
    logEvent("SALE_STOCK_REJECTED", context, { available: 0 }, sink);
    logEvent("ACTION_REJECTED", context, { operation: "createSale" }, sink);
    expect(new Set(sink.mock.calls.map(([line]) => JSON.parse(line).correlationId)).size).toBe(1);
  });

  it("LOG-12 · calcula duración sin aceptar valores negativos", () => {
    const context = createLogContext();
    expect(elapsed(context)).toBeGreaterThanOrEqual(0);
    expect(elapsed({ ...context, startedAt: 0 })).toBeUndefined();
  });

  it("LOG-13 · un getter hostil no propaga errores ni publica registros incompletos", () => {
    const sink = vi.fn();
    const metadata = Object.defineProperty({}, "status", { get() { throw new Error("getter"); } });
    expect(logEvent("ACTION_ERROR", createLogContext(), metadata, sink)).toBe(false);
    expect(sink).not.toHaveBeenCalled();
  });

  it("LOG-14 · lee una sola vez los campos antes de validar su contenido", () => {
    const sink = vi.fn();
    let reads = 0;
    const metadata = Object.defineProperty({}, "reason", {
      get() { reads += 1; return reads === 1 ? "internal" : "FICTIONAL-SECRET"; },
    });
    logEvent("ACTION_ERROR", createLogContext(), metadata, sink);
    expect(reads).toBe(1);
    expect(JSON.parse(sink.mock.calls[0][0]).metadata).toEqual({ reason: "internal" });
  });
});
