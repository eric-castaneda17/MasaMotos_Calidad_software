/**
 * Captura las evidencias de la Microcredencial de Bilingüismo desde la aplicación real.
 *
 *   BASE_URL=http://localhost:3000 npm run evidence
 *
 * Genera las imágenes en docs/evidencias/. Requiere la app en ejecución y la base sembrada.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { ADMIN, BASE_URL, launch, login, newContext } from "./lib/browser.mjs";

const OUT = join(process.cwd(), "docs", "evidencias");
mkdirSync(OUT, { recursive: true });

const browser = await launch();

async function fillCart(page) {
  for (const q of ["BUJ", "20W", "PAS-BWS"]) {
    await page.fill('[data-testid="pos-search"]', q);
    await page.waitForTimeout(900);
    await page.locator('[data-testid^="pos-product-"]').first().click();
  }
  await page.locator('[data-testid^="pos-product-"]').first().click();
  await page.fill('[data-testid="pos-search"]', "");
  await page.waitForTimeout(900);
  await page.fill('[data-testid="pos-discount"]', "5");
  await page.waitForTimeout(300);
}

const shots = [];
async function shot(page, name, opts = {}) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200); // gráficos y fuentes
  const path = join(OUT, `${name}.png`);
  await page.screenshot({ path, ...opts });
  shots.push(path);
  console.log("✔", name);
}

try {
  for (const locale of ["es", "en"]) {
    const ctx = await newContext(browser, { locale, viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();

    await page.goto(`${BASE_URL}/signin`, { waitUntil: "networkidle" });
    await shot(page, `00-login-${locale}`);
    await login(page, ADMIN.email, ADMIN.password);

    await page.goto(`${BASE_URL}/`);
    await shot(page, `01-dashboard-${locale}`);

    await page.goto(`${BASE_URL}/productos`);
    await shot(page, `02-inventario-productos-${locale}`);

    await page.goto(`${BASE_URL}/inventario`);
    await shot(page, `03-inventario-movimientos-${locale}`);

    await page.goto(`${BASE_URL}/ventas/nueva`, { waitUntil: "networkidle" });
    await fillCart(page);
    await shot(page, `04-ventas-pos-${locale}`, { fullPage: true });

    await page.goto(`${BASE_URL}/facturas/5`);
    await shot(page, `05-factura-${locale}`, { fullPage: true });

    await page.goto(`${BASE_URL}/reportes`);
    await shot(page, `06-reportes-${locale}`);

    await ctx.close();

    const m = await newContext(browser, { locale, viewport: { width: 390, height: 844 } });
    const mp = await m.newPage();
    await login(mp, ADMIN.email, ADMIN.password);
    await shot(mp, `07-movil-dashboard-${locale}`);
    await m.close();
  }
} finally {
  await browser.close();
}
console.log(`\n${shots.length} capturas guardadas en ${OUT}`);
