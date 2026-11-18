import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { academicEndpoints, academicProject } from "./qa-fixtures.mjs";
import { functionBody, readBlocks, verifyReversion, withTransaction } from "./qa-reversion.mjs";

const folder = "docs/calidad/10_Playwright";
const source = await readFile(folder + "/reversion/SWR-REL-001.sql", "utf8");
const migration = await readFile("supabase/migrations/003_functions.sql", "utf8");
const schema = await readFile("supabase/migrations/001_schema.sql", "utf8");
const baseline = JSON.parse(await readFile(folder + "/estado-final.json", "utf8"));
const blocks = readBlocks(source);
const saleDefinition = migration.slice(migration.indexOf("create or replace function public.create_sale("));
const expectedBody = functionBody(saleDefinition);
const note = baseline.lot + "-REL001-SIM0001";
const fakeEmail = "seller@example.test";
const structure = [{ kind: "function", name: "simulada", definition: "metadato simulado no publicable" }];
const structuralBaseline = createHash("sha256").update(JSON.stringify(structure)).digest("hex");
const invoice = { id: 20, number: "QA-000071", saleId: 22 };
const state = {
  product: { code: baseline.lot + "-API_LOW", active: true, stock: 3, updatedAt: "2026-11-18T16:00:00Z" },
  settings: { prefix: "QA", next: 80 },
  referenceInvoice: invoice,
  sales: [],
  items: [],
  movements: [{ id: 12, type: "ADJUSTMENT", saleId: null, quantity: 3, stockBefore: 0, stockAfter: 3 }],
  invoices: [],
};
const fixture = {
  product_id: 11, customer_id: 12, payment_id: 13, seller_id: "00000000-0000-4000-8000-000000000014",
  collision_id: invoice.id, collision_number: invoice.number, collision_sequence: 71,
  sale_function: saleDefinition,
};

function dbError(code, fields = {}) {
  return Object.assign(new Error("mensaje simulado que no se debe publicar"), { code, ...fields });
}

const lateError = dbError("23505", {
  schema: "public", table: "invoices", constraint: "invoices_number_key",
  detail: "Key (number)=(QA-000071) already exists.",
  where: 'SQL statement "insert into public.invoices (number, sale_id) values (v_number, v_sale_id)"\n' +
    "PL/pgSQL function create_sale(integer,integer,text,numeric,numeric,text,jsonb) line 107 at SQL statement",
});

const bySql = new Map(Array.from(blocks, ([name, sql]) => [sql, name]));
const one = (row) => ({ rowCount: 1, rows: [row] });

function simulate({ action, connect, close, fingerprint = structuralBaseline } = {}) {
  const sessions = [];
  const newClient = () => {
    const index = sessions.length;
    const events = [];
    sessions.push(events);
    const client = new EventEmitter();
    let prepared = false;
    client.connect = async () => {
      events.push("connect");
      await connect?.(index);
    };
    client.end = async () => {
      events.push("end");
      await close?.(index, client);
    };
    client.query = async (sql, params) => {
      const block = bySql.get(sql);
      assert(block, "Consulta simulada desconocida");
      assert.equal(params?.length ?? 0, Math.max(0, ...Array.from(sql.matchAll(/\$(\d+)/g), (m) => Number(m[1]))));
      events.push(block);
      const override = await action?.({ index, block, params, client });
      if (override !== undefined) return override;
      switch (block) {
        case "beginRead":
        case "beginWrite": return { command: "BEGIN" };
        case "structure": return { rows: structure };
        case "fixture": return one(fixture);
        case "state": return one({ state: prepared ? { ...state, settings: { ...state.settings, next: 71 } } : state });
        case "prepareCounter": prepared = true; return one({ next_invoice_number: 71 });
        case "lockProduct": return one({ id: fixture.product_id });
        case "lockCounter": return one({ id: 1 });
        case "checkIdentity": return one({ authorized: true });
        case "failSale": throw lateError;
        case "rollback": return { command: "ROLLBACK" };
        default: return { command: block };
      }
    };
    return client;
  };
  return {
    sessions, newClient,
    run: () => verifyReversion({ newClient, blocks, expectedBody, structuralBaseline: fingerprint, sellerEmail: fakeEmail, note }),
  };
}

test("solo permite el proyecto académico y descarta opciones del DSN", () => {
  const config = {
    QA_SUPABASE_REF: academicProject,
    NEXT_PUBLIC_SUPABASE_URL: `https://${academicProject}.supabase.co`,
    SUPABASE_DB_URL: `postgresql://postgres.${academicProject}:fake@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=disable&host=example.test`,
  };
  assert.equal(new URL(academicEndpoints(config).dbUrl).search, "");
  const direct = { ...config, SUPABASE_DB_URL: `postgresql://postgres:fake@db.${academicProject}.supabase.co/postgres` };
  assert.equal(new URL(academicEndpoints(direct).dbUrl).port, "5432");
  for (const SUPABASE_DB_URL of [
    config.SUPABASE_DB_URL.replace("aws-1-us-east-2.pooler.supabase.com", "example.test"),
    config.SUPABASE_DB_URL.replace("5432", "6543"),
    config.SUPABASE_DB_URL.replace("5432", "443"),
    config.SUPABASE_DB_URL.replace("postgres." + academicProject, "postgres.otro-proyecto"),
    config.SUPABASE_DB_URL.replace("/postgres?", "/otra-base?"),
  ]) assert.throws(() => academicEndpoints({ ...config, SUPABASE_DB_URL }));
  assert.throws(() => academicEndpoints({ ...config, QA_SUPABASE_REF: "otro-proyecto" }));
  assert.throws(() => academicEndpoints({ ...config, NEXT_PUBLIC_SUPABASE_URL: "https://otro-proyecto.supabase.co" }));
  assert.throws(() => academicEndpoints({ ...config, NEXT_PUBLIC_SUPABASE_URL: config.NEXT_PUBLIC_SUPABASE_URL.replace("https:", "http:") }));
});

test("SQL, migraciones y auditoría histórica son compatibles en el repositorio", () => {
  assert.equal(baseline.lot, "QA_TEST-MWLP83ZG");
  assert.match(baseline.structuralHash, /^[a-f0-9]{64}$/);
  const historical = baseline.products.find(({ code }) => code === state.product.code);
  assert.deepEqual([historical.stock, historical.sales, historical.sale_movements], [3, 0, 0]);
  const positions = [
    "insert into public.sales", "insert into public.sale_items", "update public.products",
    "insert into public.inventory_movements", "update public.settings", "insert into public.invoices",
  ].map((fragment) => expectedBody.indexOf(fragment));
  assert(positions[0] >= 0 && positions.every((position, index) => index === 0 || position > positions[index - 1]));
  assert.match(schema, /number\s+varchar\(30\) not null unique/);
  assert.match(blocks.get("fixture"), /invoices_number_key/);
  assert.match(blocks.get("beginRead"), /read only/);
  assert.equal(blocks.get("rollback"), "rollback;");
  assert.equal(blocks.get("undoSale"), "rollback to savepoint before_sale;");
  assert.doesNotMatch(source, /\b(?:commit|prepare\s+transaction|end\s+transaction)\b/i);
  assert.doesNotMatch(blocks.get("state"), /to_jsonb|\bm\.user_id\b|\bm\.reason\b|'email'|'notes'|'customer_id'/i);
});

test("la colisión exacta, las dos comparaciones y tres sesiones cerradas producen PASS simulado", async () => {
  const simulation = simulate({
    action: ({ block, params }) => {
      if (block === "failSale") assert.deepEqual(params, [12, 13, note, 11]);
      if (block === "prepareCounter") assert.deepEqual(params, [71, 80, "QA"]);
    },
  });
  const { summary, evidence } = await simulation.run();
  assert.equal(summary.status, "PASS");
  assert.equal(summary.outerRollbackAcknowledged, true);
  assert.equal(summary.finalMatchesInitial, true);
  assert.equal(Object.keys(evidence).length, 5);
  assert.deepEqual(simulation.sessions[1].slice(-4), ["undoSale", "state", "rollback", "end"]);
  assert(simulation.sessions.every((events) => events.slice(-2).join(",") === "rollback,end"));
  assert.doesNotMatch(JSON.stringify(evidence), /example\.test|00000000-0000|metadato simulado|mensaje simulado/);
});

test("una conexión rechazada cierra el cliente sin enviar consultas", async () => {
  const simulation = simulate({ connect: () => { throw dbError("ENOTFOUND"); } });
  const { summary } = await simulation.run();
  assert.notEqual(summary.status, "PASS");
  assert.deepEqual(simulation.sessions, [["connect", "end"]]);
  assert.equal(summary.interruptedTransaction.operationCode, "ENOTFOUND");
});

test("un error durante BEGIN o el bloqueo todavía solicita ROLLBACK", async () => {
  for (const failureAt of ["beginWrite", "lockCounter"]) {
    const simulation = simulate({ action: ({ block }) => { if (block === failureAt) throw dbError("55P03"); } });
    const { summary } = await simulation.run();
    assert.notEqual(summary.status, "PASS");
    assert.equal(summary.outerRollbackAcknowledged, true);
    assert.equal(summary.interruptedTransaction.operationCode, "55P03");
    assert.deepEqual(simulation.sessions[1].slice(-2), ["rollback", "end"]);
    assert(!simulation.sessions[1].includes("prepareCounter"));
  }
});

test("una respuesta inesperada a BEGIN evita las siguientes consultas y solicita ROLLBACK", async () => {
  const simulation = simulate({ action: ({ block }) => {
    if (block === "beginWrite") return { command: "UNKNOWN" };
  } });
  const { summary } = await simulation.run();
  assert.notEqual(summary.status, "PASS");
  assert.deepEqual(simulation.sessions[1], ["connect", "beginWrite", "rollback", "end"]);
});

test("un evento de error no omite ROLLBACK aunque la consulta todavía responda", async () => {
  const simulation = simulate({ action: ({ index, block, client }) => {
    if (index === 1 && block === "undoSale") client.emit("error", dbError("ECONNRESET"));
  } });
  const { summary } = await simulation.run();
  assert.equal(summary.outerRollbackAcknowledged, true);
  assert.equal(summary.writeTransactionClean, false);
  assert.equal(summary.interruptedTransaction.connectionCode, "ECONNRESET");
  assert.notEqual(summary.status, "PASS");
  assert.deepEqual(simulation.sessions[1].slice(-2), ["rollback", "end"]);
});

test("ROLLBACK fallido o sin confirmación impide PASS con las demás comparaciones favorables", async () => {
  for (const connectionLost of [true, false]) {
    const simulation = simulate({ action: ({ index, block, client }) => {
      if (index !== 1 || block !== "rollback") return;
      if (!connectionLost) return { command: "UNKNOWN" };
      const loss = dbError("ECONNRESET");
      client.emit("error", loss);
      throw loss;
    } });
    const { summary } = await simulation.run();
    assert.equal(summary.outerRollbackAcknowledged, false);
    assert.equal(summary.finalMatchesInitial, true);
    assert.equal(summary.savepointVerified, true);
    assert.notEqual(summary.status, "PASS");
    assert.deepEqual(simulation.sessions[1].slice(-2), ["rollback", "end"]);
  }
});

test("conserva el error de consulta aunque fallen también ROLLBACK y el cierre", async () => {
  const simulation = simulate({
    action: ({ block }) => { if (block === "rollback") throw dbError("ECONNRESET"); },
    close: () => { throw dbError("EPIPE"); },
  });
  await assert.rejects(
    withTransaction(simulation.newClient, blocks, "beginWrite", async () => { throw dbError("57014"); }),
    (error) => error.cause.code === "57014" && error.transaction.rollbackCode === "ECONNRESET" &&
      error.transaction.closeCode === "EPIPE" && !error.transaction.rollbackAcknowledged,
  );
  assert.deepEqual(simulation.sessions[0].slice(-2), ["rollback", "end"]);
});

test("un error reportado durante el cierre excluye PASS aunque ROLLBACK responda", async () => {
  const simulation = simulate({ close: (index, client) => {
    if (index === 1) client.emit("error", dbError("ECONNRESET"));
  } });
  const { summary } = await simulation.run();
  assert.equal(summary.outerRollbackAcknowledged, true);
  assert.equal(summary.interruptedTransaction.connectionCode, "ECONNRESET");
  assert.notEqual(summary.status, "PASS");
});

test("un cierre remoto sin evento error excluye PASS aunque ROLLBACK responda", async () => {
  const simulation = simulate({ action: ({ index, block, client }) => {
    if (index === 1 && block === "rollback") client.emit("end");
  } });
  const { summary } = await simulation.run();
  assert.equal(summary.outerRollbackAcknowledged, true);
  assert.equal(summary.interruptedTransaction.connectionCode, "QA_CONNECTION_ENDED");
  assert.notEqual(summary.status, "PASS");
});

test("éxito inesperado, otro duplicado o un error de negocio dejan el caso inconcluso", async () => {
  for (const outcome of [null, dbError("23505", { ...lateError, constraint: "invoices_sale_id_key" }), dbError("P0001")]) {
    const simulation = simulate({ action: ({ block }) => {
      if (block !== "failSale") return;
      if (outcome) throw outcome;
      return one({ saleId: 123 });
    } });
    const { summary, evidence } = await simulation.run();
    assert.equal(summary.status, "INCONCLUSO");
    assert.equal(summary.lateFailureVerified, false);
    assert.equal(summary.outerRollbackAcknowledged, true);
    assert.equal(evidence["REL-001-02-error-factura.json"].expected, false);
    assert(simulation.sessions[1].includes("undoSale"));
  }
});

test("un SAVEPOINT que falla impide PASS y fuerza el ROLLBACK exterior", async () => {
  const simulation = simulate({ action: ({ block }) => { if (block === "undoSale") throw dbError("3B001"); } });
  const { summary } = await simulation.run();
  assert.equal(summary.savepointVerified, false);
  assert.equal(summary.outerRollbackAcknowledged, true);
  assert.equal(summary.status, "NO VERIFICADO");
});

test("una lectura final fallida o distinta impide PASS", async () => {
  for (const readFails of [true, false]) {
    const simulation = simulate({ action: ({ index, block }) => {
      if (index !== 2 || block !== "state") return;
      if (readFails) throw dbError("57014");
      return one({ state: { ...state, settings: { ...state.settings, next: 81 } } });
    } });
    const { summary } = await simulation.run();
    assert.equal(summary.finalMatchesInitial, false);
    assert.equal(summary.status, "NO VERIFICADO");
    assert.deepEqual(simulation.sessions[2].slice(-2), ["rollback", "end"]);
  }
});

test("huella, función o identidad inesperadas detienen el flujo antes de vender", async () => {
  const drift = simulate({ fingerprint: "otra huella" });
  assert.notEqual((await drift.run()).summary.status, "PASS");
  assert.equal(drift.sessions.length, 1);
  const functionDrift = simulate({ action: ({ block }) => {
    if (block === "fixture") return one({ ...fixture, sale_function: "as $$ begin end $$" });
  } });
  assert.notEqual((await functionDrift.run()).summary.status, "PASS");
  assert.equal(functionDrift.sessions.length, 1);
  const wrongSeller = simulate({ action: ({ block }) => {
    if (block === "checkIdentity") return one({ authorized: false });
  } });
  assert.notEqual((await wrongSeller.run()).summary.status, "PASS");
  assert(!wrongSeller.sessions[1].includes("failSale"));
  assert.deepEqual(wrongSeller.sessions[1].slice(-2), ["rollback", "end"]);
});
