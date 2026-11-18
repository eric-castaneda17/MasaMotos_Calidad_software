import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "@playwright/test";

const base = "http://localhost:3116";
const out = "docs/calidad/12_Shift_Right/evidencias";
const startedAt = new Date().toISOString();
const records = [];
const results = [];
const output = new Map();
let server;
let browser;
let startupError = false;
let startupFailure = false;

function collect(stream, chunk) {
  const lines = (output.get(stream) ?? "") + chunk.toString();
  const parts = lines.split(/\r?\n/);
  output.set(stream, parts.pop());
  for (const line of parts) {
    if (line.includes("EADDRINUSE")) startupError = true;
    try {
      const record = JSON.parse(line.trim());
      if (typeof record.event === "string" && typeof record.correlationId === "string") {
        records.push({ origin: "local-production-server", record });
      }
    } catch {
      // La salida no estructurada del framework queda fuera de la evidencia.
    }
  }
}

try {
  await mkdir(out, { recursive: true });
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "localhost", "--port", "3116"], {
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.on("error", () => { startupFailure = true; });
  server.stdout.on("data", chunk => collect("stdout", chunk));
  server.stderr.on("data", chunk => collect("stderr", chunk));
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    assert(!startupError && !startupFailure, "No se pudo reservar el servidor de QA.");
    if (server.exitCode !== null) break;
    try {
      const response = await fetch(base + "/signin", { redirect: "manual", signal: AbortSignal.timeout(1000) });
      if (response.status === 200 && records.some(({ record }) => record.event === "APPLICATION_STARTED")) {
        ready = true;
        break;
      }
    } catch { /* el servidor todavía no está listo */ }
    await delay(250);
  }
  assert(ready && !startupError && !startupFailure, "El servidor no alcanzó el estado listo.");
  results.push({ id: "SR-00", status: "PASS_LOCAL", expectedEvent: "APPLICATION_STARTED", observed: "Inicio real del servidor compilado." });

  const response = await fetch(base + "/ventas/nueva", { redirect: "manual", signal: AbortSignal.timeout(5000) });
  assert([307, 308].includes(response.status));
  assert.equal(new URL(response.headers.get("location"), base).pathname, "/signin");
  await delay(150);
  assert(records.some(({ record }) => record.event === "ACCESS_DENIED" && record.metadata.operation === "proxy"));
  results.push({ id: "SR-02", status: "PASS_LOCAL", expectedEvent: "ACCESS_DENIED", observed: "Ruta protegida redirige a /signin sin sesión.", httpStatus: response.status });

  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ locale: "es-CO" });
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    return url.origin === base ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  await page.goto(base + "/signin");
  await page.getByLabel(/correo electrónico/i).fill("correo-invalido");
  await page.getByLabel(/^Contraseña/).fill("dato-ficticio");
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await page.locator('[name="email"][aria-invalid="true"]').waitFor({ state: "visible" });
  await delay(150);
  assert(records.some(({ record }) => record.event === "AUTH_VALIDATION_REJECTED"));
  results.push({ id: "SR-06", status: "PASS_LOCAL", expectedEvent: "AUTH_VALIDATION_REJECTED", observed: "La acción real rechazó el formato antes de crear el cliente Supabase." });
  await context.close();
} catch (error) {
  results.push({ id: "RUNNER", status: "INCONCLUSO", category: error?.name ?? "Error" });
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server?.exitCode === null && !startupFailure) {
    const exit = once(server, "exit");
    server.kill();
    await exit;
  }
  await writeFile(out + "/eventos-reales-locales.jsonl", records.map(record => JSON.stringify(record)).join("\n") + "\n");
  await writeFile(out + "/resultados-locales.json", JSON.stringify({
    startedAt, finishedAt: new Date().toISOString(), origin: "local-production-server",
    supabaseWritesAuthorized: false,
    scope: "Inicio, bloqueo sin sesión y rechazo de formato previo a Supabase. No ejecuta los casos BB manuales.",
    results,
  }, null, 2) + "\n");
  console.log(JSON.stringify({ localScenarios: results, logRecords: records.length }));
}
