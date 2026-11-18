import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { qaConfig } from "./qa-fixtures.mjs";

const dossier = "docs/calidad/10_Playwright";
const lot = "QA_TEST-MWLP83ZG";
const productCode = lot + "-API_LOW";

export function readBlocks(source) {
  const parts = source.split(/^-- @sql (\w+)\r?\n/gm);
  const blocks = new Map();
  for (let i = 1; i < parts.length; i += 2) {
    assert(!blocks.has(parts[i]), "Bloque SQL duplicado.");
    blocks.set(parts[i], parts[i + 1].trim());
  }
  return blocks;
}

function sqlOn(client, blocks) {
  return (name, params) => {
    assert(blocks.has(name), "Falta el bloque SQL " + name);
    return client.query(blocks.get(name), params);
  };
}

function one(result) {
  assert.equal(result.rowCount, 1, "Se esperaba exactamente una fila.");
  return result.rows[0];
}

export function functionBody(definition) {
  const match = definition.match(/\bas\s+\$([\w]*)\$([\s\S]*?)\$\1\$/i);
  assert(match, "No se pudo identificar el cuerpo de create_sale.");
  return match[2].replaceAll("\r\n", "\n").trim();
}

async function pickFixture(sql, expectedBody, sellerEmail) {
  const { sale_function, ...fixture } = one(await sql("fixture", [
    productCode, productCode, "QA-MWLP83ZG-API-LOW", lot + "-API08B", sellerEmail,
    "QA-MWLP83ZG-API-INVOICE", lot + "-API_INVOICE",
  ]));
  assert(functionBody(sale_function) === expectedBody, "create_sale difiere de la migración revisada.");
  assert(/\bsecurity definer\b/i.test(sale_function), "Se esperaba SECURITY DEFINER.");
  return fixture;
}

async function readState(sql, fixture, note) {
  return one(await sql("state", [fixture.product_id, fixture.customer_id, note, fixture.collision_id])).state;
}

async function structureHash(sql) {
  const { rows } = await sql("structure");
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

function safeErrorCode(error) {
  const value = error?.code ?? error?.name;
  return typeof value === "string" && /^(?:[A-Z0-9]{5}|E[A-Z0-9_]{2,39}|QA_[A-Z0-9_]{2,37})$/.test(value)
    ? value
    : "UNCLASSIFIED";
}

export async function withTransaction(newClient, blocks, begin, work) {
  const client = newClient();
  let connected = false;
  let closing = false;
  let connectionError;
  let workError;
  let rollbackError;
  let closeError;
  let rollbackAcknowledged = false;
  let result;
  client.on("error", (error) => { connectionError ??= error; });
  client.on("end", () => {
    if (!closing) {
      connectionError ??= Object.assign(new Error("La sesión se cerró antes de tiempo."), { code: "QA_CONNECTION_ENDED" });
    }
  });
  const query = sqlOn(client, blocks);
  const sql = (name, params) => {
    if (connectionError) throw connectionError;
    return query(name, params);
  };
  try {
    await client.connect();
    connected = true;
    assert.equal((await sql(begin)).command, "BEGIN", "El servidor no confirmó el inicio de la transacción.");
    await sql("limits");
    result = await work(sql);
  } catch (error) {
    workError = error;
  } finally {
    try {
      if (connected) {
        assert.equal((await query("rollback")).command, "ROLLBACK", "El servidor no confirmó el rollback.");
        rollbackAcknowledged = true;
      }
    } catch (error) {
      rollbackError = error;
    } finally {
      try {
        closing = true;
        await client.end();
      } catch (error) {
        closeError = error;
      }
    }
  }
  if (workError || connectionError || rollbackError || closeError || !rollbackAcknowledged) {
    const failure = new Error("Transacción QA interrumpida.", { cause: workError ?? connectionError ?? rollbackError ?? closeError });
    failure.code = "QA_TRANSACTION_FAILED";
    failure.transaction = {
      rollbackAcknowledged,
      operationCode: workError ? safeErrorCode(workError) : null,
      connectionCode: connectionError ? safeErrorCode(connectionError) : null,
      rollbackCode: rollbackError ? safeErrorCode(rollbackError) : null,
      closeCode: closeError ? safeErrorCode(closeError) : null,
    };
    throw failure;
  }
  return result;
}

function saleError(error, reference) {
  const context = error.where ?? "";
  const invoiceInsert = /\binsert into public\.invoices\s*\(\s*number\s*,\s*sale_id\s*\)/i;
  const functionLine = context.match(/^PL\/pgSQL function (?:public\.)?create_sale\(integer,\s*integer,\s*text,\s*numeric,\s*numeric,\s*text,\s*jsonb\) line (\d+) at SQL statement\s*$/m)?.[1];
  const duplicateNumber = error.detail?.includes("(number)=(" + reference + ")") ?? false;
  const expected = error.code === "23505" && error.schema === "public" && error.table === "invoices" &&
    error.constraint === "invoices_number_key" && invoiceInsert.test(context) && Boolean(functionLine) && duplicateNumber;
  return {
    expected,
    sqlstate: /^[A-Z0-9]{5}$/.test(error.code ?? "") ? error.code : null,
    table: error.table === "invoices" ? "public.invoices" : null,
    constraint: error.constraint === "invoices_number_key" ? error.constraint : null,
    statement: invoiceInsert.test(context) ? "INSERT INTO public.invoices (number, sale_id)" : null,
    functionLine: functionLine ? Number(functionLine) : null,
    matchedReferenceNumber: duplicateNumber ? reference : null,
  };
}

async function writeEvidence(root, evidence) {
  for (const [file, value] of Object.entries(evidence)) {
    await writeFile(join(root, file), JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
  }
}

async function run() {
  const attempt = process.env.QA_REL_RUN_ID ?? "";
  const sellerEmail = process.env.QA_REL_SELLER_EMAIL?.trim().toLowerCase();
  assert(process.argv.includes("--ejecutar") && process.env.QA_REL_WINDOW === "1",
    "La ejecución requiere aprobación previa, --ejecutar y QA_REL_WINDOW=1.");
  assert.match(attempt, /^[A-Z0-9][A-Z0-9-]{5,29}$/, "Defina un QA_REL_RUN_ID único de 6 a 30 caracteres.");
  assert(sellerEmail, "Defina QA_REL_SELLER_EMAIL por el canal privado.");
  assert(process.env.QA_DB_CA_FILE, "Indique el certificado de CA del proyecto con QA_DB_CA_FILE.");

  const [config, ca, source, migration, priorAudit] = await Promise.all([
    qaConfig(),
    readFile(process.env.QA_DB_CA_FILE, "utf8"),
    readFile(dossier + "/reversion/SWR-REL-001.sql", "utf8"),
    readFile("supabase/migrations/003_functions.sql", "utf8"),
    readFile(dossier + "/estado-final.json", "utf8").then(JSON.parse),
  ]);
  const saleStart = migration.indexOf("create or replace function public.create_sale(");
  assert(saleStart >= 0 && priorAudit.lot === lot && /^[a-f0-9]{64}$/.test(priorAudit.structuralHash));
  const expectedBody = functionBody(migration.slice(saleStart));
  const blocks = readBlocks(source);
  const newClient = () => new pg.Client({
    connectionString: config.dbUrl,
    ssl: { ca, rejectUnauthorized: true },
    connectionTimeoutMillis: 5000,
    query_timeout: 7000,
    application_name: "qa-swr-rel-001",
  });

  const root = join(dossier, "evidencias-reversion", attempt);
  await mkdir(join(dossier, "evidencias-reversion"), { recursive: true });
  await mkdir(root);
  const { summary, evidence } = await verifyReversion({
    newClient, blocks, expectedBody, structuralBaseline: priorAudit.structuralHash, sellerEmail,
    note: lot + "-REL001-" + attempt, sqlSha256: createHash("sha256").update(source).digest("hex"),
  });
  await writeEvidence(root, evidence);
  console.log("SWR-REL-001 " + summary.status + " · " + root);
  if (summary.status !== "PASS") process.exitCode = 1;
}

export async function verifyReversion({ newClient, blocks, expectedBody, structuralBaseline, sellerEmail, note, sqlSha256 }) {
  const evidence = {};
  const summary = {
    requirement: "SWR-REL-001",
    criterion: "CA-15",
    lot,
    note,
    startedAt: new Date().toISOString(),
    timeZone: "America/Bogota",
    sqlSha256,
    status: "INCONCLUSO",
    stage: "lectura inicial",
  };
  let before;
  let fixture;
  let outerRollbackAcknowledged = false;
  let writeTransactionClean = false;
  let lateFailureVerified = false;
  let savepointVerified = false;
  try {
    before = await withTransaction(newClient, blocks, "beginRead", async (sql) => {
      const structuralHash = await structureHash(sql);
      assert(structuralHash === structuralBaseline, "La estructura cambió desde la auditoría de Fase 4.");
      fixture = await pickFixture(sql, expectedBody, sellerEmail);
      const state = await readState(sql, fixture, note);
      assert(state.product?.code === productCode && state.product.stock === 3);
      assert.equal(state.sales.length + state.items.length + state.invoices.length, 0);
      assert(state.movements.every((movement) => movement.type === "ADJUSTMENT" && movement.saleId === null));
      return { structuralHash, state };
    });
    evidence["REL-001-01-estado-inicial.json"] = before;

    summary.stage = "transacción de venta";
    await withTransaction(newClient, blocks, "beginWrite", async (sql) => {
      one(await sql("lockProduct", [fixture.product_id]));
      one(await sql("lockCounter"));
      assert.deepEqual(await pickFixture(sql, expectedBody, sellerEmail), fixture);
      assert.deepEqual(await readState(sql, fixture, note), before.state);
      const prepared = one(await sql("prepareCounter", [
        fixture.collision_sequence, before.state.settings.next, before.state.settings.prefix,
      ]));
      assert.equal(prepared.next_invoice_number, fixture.collision_sequence);

      await sql("savepoint");
      await sql("saleRole");
      await sql("saleIdentity", [fixture.seller_id]);
      assert.equal(one(await sql("checkIdentity", [fixture.seller_id])).authorized, true);
      let diagnostic = { expected: false, outcome: "La venta devolvió éxito inesperado." };
      try {
        await sql("failSale", [fixture.customer_id, fixture.payment_id, note, fixture.product_id]);
      } catch (error) {
        diagnostic = saleError(error, fixture.collision_number);
      }
      evidence["REL-001-02-error-factura.json"] = diagnostic;
      lateFailureVerified = diagnostic.expected;
      await sql("undoSale");

      const restored = await readState(sql, fixture, note);
      const expected = { ...before.state, settings: { ...before.state.settings, next: fixture.collision_sequence } };
      evidence["REL-001-03-tras-savepoint.json"] = { state: restored, expectedTemporaryCounter: fixture.collision_sequence };
      assert.deepEqual(restored, expected);
      savepointVerified = true;
    });
    outerRollbackAcknowledged = true;
    writeTransactionClean = true;
  } catch (error) {
    summary.interruptedStage = summary.stage;
    summary.interruptionCode = safeErrorCode(error);
    if (error.transaction) {
      summary.interruptedTransaction = error.transaction;
      if (summary.stage === "transacción de venta") outerRollbackAcknowledged = error.transaction.rollbackAcknowledged;
    }
  } finally {
    if (before) {
      summary.stage = "lectura final en conexión nueva";
      try {
        const after = await withTransaction(newClient, blocks, "beginRead", async (sql) => {
          return { structuralHash: await structureHash(sql), state: await readState(sql, fixture, note) };
        });
        evidence["REL-001-04-estado-final.json"] = after;
        assert.deepEqual(after, before);
        summary.finalMatchesInitial = true;
      } catch (error) {
        summary.finalMatchesInitial = false;
        summary.finalVerificationCode = safeErrorCode(error);
        if (error.transaction) summary.finalTransaction = error.transaction;
      }
    }
    Object.assign(summary, {
      outerRollbackAcknowledged,
      writeTransactionClean,
      lateFailureVerified,
      savepointVerified,
      finishedAt: new Date().toISOString(),
    });
    if (writeTransactionClean && outerRollbackAcknowledged && lateFailureVerified && savepointVerified && summary.finalMatchesInitial) {
      summary.status = "PASS";
    } else if (lateFailureVerified && (summary.finalMatchesInitial === false || !savepointVerified)) {
      summary.status = "NO VERIFICADO";
    }
    evidence["REL-001-05-resumen.json"] = summary;
  }
  return { summary, evidence };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error("SWR-REL-001 detenido · " + safeErrorCode(error));
    process.exitCode = 1;
  });
}
