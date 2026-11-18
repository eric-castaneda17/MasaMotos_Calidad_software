import { readFile } from "node:fs/promises";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { credentials, lotFile, qaConfig } from "../../../scripts/qa-fixtures.mjs";

type Lot = {
  run: string;
  categories: { name: string }[];
  products: Record<string, { code: string }>;
  customers: Record<string, { full_name: string; document_number: string }>;
};

let lot: Lot;

test.beforeAll(async () => {
  await qaConfig();
  expect(process.env.QA_ALLOW_WRITES, "La suite registra ventas de QA").toBe("1");
  lot = JSON.parse(await readFile(lotFile, "utf8")) as Lot;
  expect(lot.run).toMatch(/^QA_TEST-[A-Z0-9]+$/);
});

async function signIn(page: Page, role: "ADMIN" | "SELLER") {
  const user = await credentials(role);
  await page.goto("/signin");
  await page.getByLabel(/correo electrónico/i).fill(user.email);
  // El valor se pasa a FormData sin incluirlo en los pasos de Playwright.
  await page.getByLabel(/^Contraseña/).evaluate((input, password) => {
    (input as HTMLInputElement).value = password;
  }, user.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/");
}

async function addProduct(page: Page, code: string) {
  await page.getByRole("searchbox", { name: /buscar producto/i }).fill(searchableCode(code));
  await page.getByRole("button", { name: new RegExp(code) }).click();
}

function searchableCode(code: string) {
  return code.slice("QA_TEST-".length).split("_")[0];
}

async function selectCustomer(page: Page, customer: Lot["customers"][string]) {
  await page.getByRole("button", { name: "Cambiar", exact: true }).click();
  await page.getByRole("searchbox", { name: /buscar cliente/i }).fill(customer.document_number);
  await page.getByRole("button", { name: new RegExp(customer.full_name) }).click();
}

async function confirm(page: Page) {
  await page.getByRole("combobox", { name: /método de pago/i }).selectOption({ label: "Efectivo" });
  await page.getByRole("button", { name: "Confirmar venta", exact: true }).click();
  await page.getByRole("alertdialog", { name: /confirmar la venta/i })
    .getByRole("button", { name: "Confirmar venta" }).click();
}

async function invoice(page: Page) {
  const notice = page.getByText(/Se generó la factura /);
  await expect(notice).toBeVisible();
  const number = (await notice.innerText()).replace(/^Se generó la factura /, "").replace(/\.$/, "");
  await page.getByRole("button", { name: "Ver factura" }).click();
  await expect(page.getByRole("heading", { name: `Factura de venta ${number}` })).toBeVisible();
  return number;
}

async function catalogRow(page: Page, code: string) {
  await page.goto("/productos");
  await page.getByRole("searchbox", { name: /buscar por nombre, código o modelo/i }).fill(searchableCode(code));
  return page.getByRole("row").filter({ hasText: code });
}

async function note(page: Page, suffix: string) {
  await page.getByRole("textbox", { name: /observaciones de la venta/i }).fill(`${lot.run}-${suffix}`);
}

async function startTrace(context: BrowserContext) {
  // Se inicia después del login. Sin snapshots de DOM/red ni código adjunto.
  await context.tracing.start({ screenshots: true, snapshots: false, sources: false });
}

test("E2E-01 · ingreso y protección previa al login", async ({ page }) => {
  await page.goto("/ventas/nueva");
  await expect(page).toHaveURL((url) => url.pathname === "/signin");
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  await signIn(page, "SELLER");
  await page.getByRole("link", { name: "Productos", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Productos", exact: true })).toBeVisible();
});

test("E2E-02 · vendedor confirma dos unidades, factura y saldo", async ({ page, context }, info) => {
  await signIn(page, "SELLER");
  await startTrace(context);
  const product = lot.products.E2E_SALE;
  try {
    await page.goto("/ventas/nueva");
    await selectCustomer(page, lot.customers.E2E_SALE);
    await addProduct(page, product.code);
    await page.getByRole("button", { name: "Aumentar cantidad" }).click();
    await page.getByRole("spinbutton", { name: "Porcentaje" }).fill("10");
    await expect(page.getByTestId("pos-total")).toContainText("53.550");
    await note(page, "E2E02");
    await confirm(page);
    const number = await invoice(page);
    await expect(page.getByRole("row").filter({ hasText: product.code })
      .getByRole("cell", { name: "2", exact: true })).toBeVisible();
    const row = await catalogRow(page, product.code);
    await expect(row.getByRole("cell", { name: /^8\b/ })).toBeVisible();
    await row.getByRole("link", { name: product.code }).click();
    const movement = page.getByRole("row").filter({ hasText: number });
    await expect(movement).toContainText("Venta");
    await expect(movement).toContainText("−2");
    await info.attach("stock-e2e02", { body: await page.screenshot(), contentType: "image/png" });
  } catch (error) {
    await context.tracing.stop({ path: info.outputPath("trace.zip") });
    throw error;
  }
  await context.tracing.stop();
});

test("E2E-03 · administrador registra un repuesto y vende el saldo exacto", async ({ page, context }, info) => {
  await signIn(page, "ADMIN");
  await startTrace(context);
  const code = `${lot.run}-E2E03-${Date.now().toString(36).slice(-5).toUpperCase()}`;
  async function createProduct() {
    await page.goto("/productos/nuevo");
    await page.getByLabel(/código \/ referencia/i).fill(code);
    await page.getByLabel(/nombre del repuesto/i).fill(code);
    await page.getByLabel(/categoría/i).selectOption({ label: lot.categories[0].name });
    await page.getByLabel(/marca/i).fill("Yamaha");
    await page.getByLabel(/precio de compra/i).fill("10000");
    await page.getByLabel(/precio de venta/i).fill("25000");
    await page.getByLabel(/stock inicial/i).fill("2");
    await page.getByRole("button", { name: "Nuevo producto", exact: true }).click();
  }
  try {
    await createProduct();
    await expect(page.getByRole("heading", { name: code })).toBeVisible();
    await createProduct();
    await expect(page.getByLabel(/código \/ referencia/i))
      .toHaveAccessibleDescription(/ya existe un producto con este código/i);
    await page.goto("/ventas/nueva");
    await selectCustomer(page, lot.customers.E2E_NEW);
    await addProduct(page, code);
    await page.getByRole("button", { name: "Aumentar cantidad" }).click();
    await expect(page.getByRole("spinbutton", { name: "Cantidad" })).toHaveValue("2");
    await note(page, "E2E03");
    await confirm(page);
    await invoice(page);
    const detail = page.getByRole("row").filter({ hasText: code });
    await expect(detail.getByRole("cell", { name: "2", exact: true })).toBeVisible();
    await expect(detail).toContainText("25.000");
    await expect(page.getByText("Efectivo", { exact: true })).toBeVisible();
    await expect(page.getByText(/Fecha de emisión:/)).toBeVisible();
    await expect(page.getByText(/Atendido por:\s+\S/)).toBeVisible();
    await expect(page.getByText(/59\.500/)).toBeVisible();
    await info.attach("factura-e2e03", { body: await page.screenshot(), contentType: "image/png" });
    const row = await catalogRow(page, code);
    await expect(row).toHaveCount(1);
    await expect(row.getByRole("cell", { name: /^0\b/ })).toBeVisible();
    await expect(row).toContainText("Agotado");
  } catch (error) {
    await context.tracing.stop({ path: info.outputPath("trace.zip") });
    throw error;
  }
  await context.tracing.stop();
});

test("E2E-04 · una segunda sesión recibe el rechazo por saldo desactualizado", async ({ page, browser }) => {
  const other = await browser.newContext();
  try {
    const first = lot.products.E2E_RACE;
    await signIn(page, "SELLER");
    await page.goto("/ventas/nueva");
    await selectCustomer(page, lot.customers.E2E_A);
    await addProduct(page, first.code);
    await note(page, "E2E04A");

    const competing = await other.newPage();
    await signIn(competing, "SELLER");
    await competing.goto("/ventas/nueva");
    await selectCustomer(competing, lot.customers.E2E_B);
    await addProduct(competing, first.code);
    await note(competing, "E2E04B");
    await confirm(competing);
    await invoice(competing);

    await confirm(page);
    await expect(page.getByRole("status")).toContainText(/stock insuficiente.*disponible: 0/i);
    await expect(page.getByRole("spinbutton", { name: "Cantidad" })).toHaveValue("1");
    const row = await catalogRow(competing, first.code);
    await expect(row).toContainText("Agotado");
    await competing.goto(`/facturas?q=${encodeURIComponent(lot.customers.E2E_A.document_number)}`);
    await expect(competing.getByText("No hay facturas para los filtros seleccionados.")).toBeVisible();
  } finally {
    await other.close();
  }
});

test("E2E-05 · alta de productos reservada a administrador", async ({ page, browser }) => {
  await signIn(page, "SELLER");
  await page.goto("/productos");
  await expect(page.getByRole("heading", { name: "Productos", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Nuevo producto" })).toHaveCount(0);
  await page.goto("/productos/nuevo");
  await expect(page).toHaveURL((url) => url.pathname === "/");
  const admin = await browser.newContext();
  try {
    const adminPage = await admin.newPage();
    await signIn(adminPage, "ADMIN");
    await adminPage.goto("/productos/nuevo");
    await expect(adminPage.getByRole("heading", { name: "Nuevo producto" })).toBeVisible();
  } finally {
    await admin.close();
  }
});
