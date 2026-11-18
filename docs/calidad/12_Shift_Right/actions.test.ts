import { mkdirSync, writeFileSync } from "node:fs";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loginAction } from "../../../src/lib/actions/auth";
import { createSaleAction } from "../../../src/lib/actions/sales";
import { DomainError, runAction } from "../../../src/lib/actions/helpers";
import { AuthError, requireActionUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { createLogContext } from "@/lib/observability/logger";

vi.mock("@/i18n/navigation", () => ({
  redirect: vi.fn(() => { throw Object.assign(new Error("redirect"), { digest: "NEXT_REDIRECT" }); }),
}));
vi.mock("next-intl/server", () => ({ getLocale: async () => "es" }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth/dal", () => ({
  requireActionUser: vi.fn(),
  AuthError: class extends Error {
    constructor(public key: "unauthorized" | "forbidden") { super(key); }
  },
}));

const evidence: { origin: string; scenario: string; record: unknown }[] = [];
let records: Record<string, unknown>[];
const client = vi.mocked(createClient);
const authorize = vi.mocked(requireActionUser);
const rpc = vi.fn();
const signin = vi.fn();
const profile = vi.fn();
const signout = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  records = [];
  for (const method of ["info", "warn", "error"] as const) {
    vi.spyOn(console, method).mockImplementation((line) => { records.push(JSON.parse(String(line))); });
  }
  client.mockResolvedValue({
    auth: { signInWithPassword: signin, signOut: signout },
    rpc,
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: profile }) }) }),
  } as never);
  authorize.mockResolvedValue({ id: "FICTIONAL", email: "private@example.test", name: "PRIVATE", role: "SELLER" });
});

afterEach(() => {
  for (const record of records) {
    evidence.push({ origin: "simulated-dependencies", scenario: expect.getState().currentTestName ?? "", record });
  }
  expect(JSON.stringify(records)).not.toMatch(/private@example|FICTIONAL|PRIVATE|password|Bearer|cookie/);
  vi.restoreAllMocks();
});

afterAll(() => {
  mkdirSync("docs/calidad/12_Shift_Right/evidencias", { recursive: true });
  writeFileSync("docs/calidad/12_Shift_Right/evidencias/eventos-simulados.jsonl", evidence.map(row => JSON.stringify(row)).join("\n") + "\n");
});

const validSale = {
  customerId: 12, paymentMethodId: 1, discountType: "PERCENT" as const, discountValue: 0,
  notes: "PRIVATE-NOTES", items: [{ productId: 3, quantity: 1 }],
};
function credentials() {
  const form = new FormData();
  form.set("email", "private@example.test");
  form.set("password", "FICTIONAL-PASSWORD-123");
  return form;
}
function event(name: string) { return records.find(record => record.event === name); }

describe("Acciones reales con dependencias simuladas", () => {
  it("SIM-01 · credencial incorrecta conserva el rechazo y emite WARN", async () => {
    signin.mockResolvedValue({ data: { user: null }, error: { status: 400, message: "PRIVATE" } });
    expect(await loginAction(null, credentials())).toEqual({ ok: false, message: "errors.invalidCredentials" });
    expect(event("AUTH_LOGIN_FAILED")).toMatchObject({ level: "WARN", metadata: { status: 400 } });
  });

  it("SIM-02 · inicio correcto registra INFO antes de la redirección", async () => {
    signin.mockResolvedValue({ data: { user: { id: "PRIVATE" } }, error: null });
    profile.mockResolvedValue({ data: { active: true } });
    rpc.mockResolvedValue({ error: null });
    await expect(loginAction(null, credentials())).rejects.toMatchObject({ digest: "NEXT_REDIRECT" });
    expect(event("AUTH_LOGIN_SUCCEEDED")).toMatchObject({ level: "INFO" });
    expect(event("AUTH_ERROR")).toBeUndefined();
  });

  it("SIM-03 · formulario inválido se registra sin tocar el cliente Supabase", async () => {
    expect((await loginAction(null, new FormData())).ok).toBe(false);
    expect(client).not.toHaveBeenCalled();
    expect(event("AUTH_VALIDATION_REJECTED")).toMatchObject({ level: "WARN" });
  });

  it("SIM-04 · venta válida registra IDs técnicos y duración", async () => {
    rpc.mockResolvedValue({ data: { saleId: 22, invoiceId: 23, invoiceNumber: "PRIVATE" }, error: null });
    expect((await createSaleAction(validSale)).ok).toBe(true);
    expect(event("SALE_CREATED")).toMatchObject({ level: "INFO", metadata: { saleId: 22, invoiceId: 23, itemCount: 1 } });
    expect((event("SALE_CREATED")?.metadata as { durationMs: number }).durationMs).toBeGreaterThanOrEqual(0);
  });

  it("SIM-05 · stock insuficiente conserva el error y correlaciona los eventos", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "P0001", message: "insufficientStock", details: JSON.stringify({ product: "PRIVATE", available: 0 }) },
    });
    expect(await createSaleAction(validSale)).toMatchObject({ ok: false, message: "errors.insufficientStock" });
    expect(event("SALE_STOCK_REJECTED")).toMatchObject({ level: "WARN", metadata: { available: 0 } });
    expect(new Set(records.map(record => record.correlationId)).size).toBe(1);
    expect(event("SALE_CREATED")).toBeUndefined();
  });

  it("SIM-06 · venta inválida se rechaza antes del RPC", async () => {
    expect((await createSaleAction({ ...validSale, items: [] })).ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
    expect(event("SALE_VALIDATION_REJECTED")).toMatchObject({ level: "WARN" });
  });

  it("SIM-07 · caída del cliente mantiene errors.generic y emite ERROR depurado", async () => {
    client.mockRejectedValue(new Error("PRIVATE-token=FICTIONAL"));
    expect(await createSaleAction(validSale)).toEqual({ ok: false, message: "errors.generic" });
    expect(event("ACTION_ERROR")).toMatchObject({ level: "ERROR", metadata: { operation: "createSale" } });
  });

  it("SIM-08 · autorización denegada conserva la respuesta y evita RPC", async () => {
    authorize.mockRejectedValue(new AuthError("forbidden"));
    expect(await createSaleAction(validSale)).toMatchObject({ ok: false, message: "errors.forbidden" });
    expect(rpc).not.toHaveBeenCalled();
    expect(event("ACTION_REJECTED")).toMatchObject({ level: "WARN", metadata: { reason: "forbidden" } });
  });

  it("SIM-09 · logger roto permite completar la venta", async () => {
    vi.spyOn(console, "info").mockImplementation(() => { throw new Error("sink unavailable"); });
    rpc.mockResolvedValue({ data: { saleId: 1, invoiceId: 2 }, error: null });
    expect((await createSaleAction(validSale)).ok).toBe(true);
  });

  it("SIM-10 · login con fallo de red registra ERROR y conserva la excepción", async () => {
    signin.mockRejectedValue(new Error("PRIVATE-network-FICTIONAL"));
    await expect(loginAction(null, credentials())).rejects.toThrow("PRIVATE-network-FICTIONAL");
    expect(event("AUTH_ERROR")).toMatchObject({ level: "ERROR", metadata: { reason: "upstream" } });
  });

  it("SIM-11 · rechazo genérico del proveedor se registra como error interno", async () => {
    const context = createLogContext();
    expect(await runAction(async () => { throw new DomainError("generic"); }, context)).toMatchObject({ ok: false, message: "errors.generic" });
    expect(event("ACTION_ERROR")).toMatchObject({ level: "ERROR" });
  });
});
