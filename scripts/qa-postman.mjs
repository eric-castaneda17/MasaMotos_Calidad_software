import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createServerClient } from "@supabase/ssr";
import newman from "newman";
import { appUrl, credentials, lotFile, qaConfig } from "./qa-fixtures.mjs";

const artifacts = "docs/calidad/09_Postman";
let phase = "configuración";

async function sellerCookie(config, seller) {
  const cookies = new Map();
  const supabase = createServerClient(config.url, config.apiKey, {
    cookies: {
      getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
      setAll: (items) => {
        for (const { name, value } of items) cookies.set(name, value);
      },
    },
  });
  const { error } = await supabase.auth.signInWithPassword(seller);
  if (error) throw Object.assign(new Error("Supabase Auth rechazó la sesión QA."), { code: error.code });
  const auth = [...cookies].filter(([name, value]) => value && /^sb-.*-auth-token(?:\.\d+)?$/.test(name));
  assert(auth.length, "No se recibió la cookie de sesión del vendedor.");
  return auth.map(([name, value]) => `${name}=${value}`).join("; ");
}

async function main() {
  assert.equal(process.env.QA_ALLOW_WRITES, "1");
  const config = await qaConfig();
  const lot = JSON.parse(await readFile(lotFile, "utf8"));
  assert.match(lot.run, /^QA_TEST-[A-Z0-9]+$/);
  const seller = await credentials("SELLER");
  const collection = JSON.parse(await readFile(`${artifacts}/MASA_MOTOS_QA.postman_collection.json`, "utf8"));
  const environment = JSON.parse(await readFile(`${artifacts}/MASA_MOTOS_QA.postman_environment.json`, "utf8"));
  phase = "sesión SSR del vendedor en Supabase Auth";
  const cookie = await sellerCookie(config, seller);
  const values = {
    appUrl, supabaseUrl: config.url, publicKey: config.apiKey, sellerEmail: seller.email,
    sellerPassword: seller.password, unknownEmail: `${lot.run.toLowerCase()}-unknown@example.test`,
    appCookie: cookie, runId: lot.run, cashId: lot.cashId,
    catAvailableId: lot.products.CAT_AVAILABLE.id, catLowId: lot.products.CAT_LOW.id,
    catZeroId: lot.products.CAT_ZERO.id,
  };
  for (const [alias, key] of [["zero", "API_ZERO"], ["low", "API_LOW"], ["sale", "API_SALE"], ["invoice", "API_INVOICE"]]) {
    values[`${alias}ProductId`] = lot.products[key].id;
    values[`${alias}CustomerId`] = lot.customers[key].id;
  }
  for (const variable of environment.values) {
    if (Object.hasOwn(values, variable.key)) variable.value = String(values[variable.key]);
  }
  const records = new Map();
  for (const section of collection.item) {
    for (const item of section.item) {
      const id = item.name.split(" ")[0];
      let expectedAssertions = 0;
      for (const request of item.item) {
        request.name = `${id} · ${request.name}`;
        expectedAssertions += request.event[0].script.exec.filter((line) => line.startsWith("pm.test(")).length;
      }
      records.set(id, { id, expectedRequests: item.item.length, expectedAssertions, requests: [], assertions: [] });
    }
  }
  phase = "ejecución de las solicitudes";
  const result = await new Promise((resolve, reject) => {
    const emitter = newman.run({ collection, environment, reporters: [], timeoutRequest: 25000, ignoreRedirects: true, silent: true }, (error, summary) => {
      if (error) reject(error);
      else resolve(summary);
    });
    emitter.on("request", (error, args) => {
      const id = args.item.name.split(" ")[0];
      records.get(id).requests.push({
        name: args.item.name,
        http: args.response?.code ?? null,
        transportError: Boolean(error),
      });
    });
    emitter.on("assertion", (error, args) => {
      const id = args.item.name.split(" ")[0];
      records.get(id).assertions.push({ name: args.assertion, passed: !error, skipped: Boolean(args.skipped) });
    });
  });
  const cases = [...records.values()].map((record) => ({
    ...record,
    status: record.requests.length && record.assertions.length
      ? record.requests.length === record.expectedRequests && record.assertions.length === record.expectedAssertions &&
        record.requests.every((r) => !r.transportError) && record.assertions.every((a) => a.passed && !a.skipped)
        ? "PASS" : "FAIL"
      : "PENDIENTE",
  }));
  const report = {
    runner: "Newman",
    lot: lot.run,
    executedAt: new Date().toISOString(),
    cases,
    stats: result.run.stats,
  };
  phase = "escritura del reporte depurado";
  await writeFile(`${artifacts}/resultados-newman.json`, JSON.stringify(report, null, 2) + "\n");
  for (const item of cases) console.log(`${item.id} ${item.status} (${item.assertions.length} aserciones)`);
  if (cases.some((item) => item.status !== "PASS") || result.run.failures.length) process.exitCode = 1;
}

main().catch((error) => {
  const detail = error.message ?? "";
  const signal = ["Timeout", "browserType.launch", "ERR_CONNECTION_REFUSED", "ERR_CERT", "EACCES", "EPERM", "SELF_SIGNED_CERT_IN_CHAIN"]
    .find((term) => detail.includes(term));
  console.error("Ejecución Postman detenida en", phase, error.code ?? error.name, signal ?? "");
  process.exitCode = 1;
});
