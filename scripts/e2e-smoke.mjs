/**
 * Prueba de extremo a extremo de MASA MOTOS sobre Supabase
 * (requiere la app en ejecución y la base configurada con `npm run db:setup`).
 *
 *   BASE_URL=http://localhost:3000 npm run test:e2e
 *
 * Recorre: login, todas las rutas, alta/edición/eliminación de producto, persistencia
 * al recargar, entrada de inventario, venta completa con descuento de stock, factura + PDF,
 * anulación, exportación CSV, rechazo de ventas sin stock, cambio de idioma, permisos del
 * vendedor, políticas RLS de Supabase y ausencia de scroll horizontal en móvil.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import pg from "pg";
import { ADMIN, BASE_URL, launch, login, newContext, SELLER } from "./lib/browser.mjs";

config({ path: ".env.local" });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✔" : "✘"} ${name}${detail ? ` — ${detail}` : ""}`);
};

// Conexión directa (solo lectura de verificación / limpieza de datos de prueba).
const db = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await db.connect();
const one = async (sql, params = []) => (await db.query(sql, params)).rows[0];
const stockOf = async (id) => (await one("select stock from public.products where id = $1", [id]))?.stock;

const ROUTES = [
  "/", "/ventas/nueva", "/ventas", "/facturas", "/productos", "/productos/nuevo", "/inventario",
  "/categorias", "/clientes", "/proveedores", "/reportes", "/usuarios", "/configuracion", "/perfil",
];

const stamp = Date.now().toString(36).toUpperCase();
const browser = await launch();
let productId = null;

async function createProduct(page, code, stock) {
  await page.goto(`${BASE_URL}/productos/nuevo`, { waitUntil: "networkidle" });
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="name"]', `Producto de prueba ${code}`);
  await page.selectOption('select[name="categoryId"]', { index: 1 });
  await page.fill('input[name="brand"]', "Yamaha");
  await page.fill('input[name="compatibleModel"]', "BWS 125");
  await page.fill('input[name="purchasePrice"]', "10000");
  await page.fill('input[name="salePrice"]', "20000");
  await page.fill('input[name="initialStock"]', String(stock));
  await page.fill('input[name="minStock"]', "2");
  await page.click('[data-testid="product-submit"]');
  await page.waitForURL(/\/productos\/\d+$/, { timeout: 30000 });
  return Number(new URL(page.url()).pathname.split("/").pop());
}

try {
  // ───────── Conexión y tablas ─────────
  const tables = await one(
    `select count(*)::int as n, bool_and(c.relrowsecurity) as rls from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
     where ns.nspname = 'public' and c.relkind = 'r'`,
  );
  check("Conexión con Supabase y tablas creadas con RLS", tables.n >= 12 && tables.rls, `${tables.n} tablas`);

  // ───────── Administrador (español) ─────────
  const ctx = await newContext(browser, { locale: "es" });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));

  await page.goto(`${BASE_URL}/signin`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', ADMIN.email);
  await page.fill('input[name="password"]', "incorrecta");
  await page.click('[data-testid="signin-submit"]');
  await page.waitForSelector('[data-testid="signin-error"]');
  check("Login rechaza contraseña incorrecta (Supabase Auth)", page.url().includes("/signin"));

  await login(page, ADMIN.email, ADMIN.password);
  check("Login de administrador (Supabase Auth)", new URL(page.url()).pathname === "/");

  for (const r of ROUTES) {
    const res = await page.goto(`${BASE_URL}${r}`, { waitUntil: "networkidle" });
    const status = res?.status() ?? 0;
    check(`Ruta ${r}`, status === 200 && new URL(page.url()).pathname === r, `HTTP ${status}`);
  }

  // Validación
  await page.goto(`${BASE_URL}/productos/nuevo`, { waitUntil: "networkidle" });
  await page.click('[data-testid="product-submit"]');
  await page.waitForSelector('p[role="alert"]', { timeout: 15000 }).catch(() => null);
  check("Validación de formulario de producto", (await page.locator('p[role="alert"]').count()) > 0);

  // Registro de producto
  const code = `TEST-${stamp}`;
  productId = await createProduct(page, code, 5);
  const created = await one("select code, stock from public.products where id = $1", [productId]);
  const initialMov = await one(
    "select count(*)::int as n from public.inventory_movements where product_id = $1 and type = 'ADJUSTMENT'",
    [productId],
  );
  check("Registro de producto guardado en Supabase", created?.code === code && created.stock === 5 && initialMov.n === 1, `id=${productId}`);

  // Persistencia al recargar
  await page.reload({ waitUntil: "networkidle" });
  check("Los datos persisten al recargar la página", (await page.locator("h1").innerText()).includes(code));

  // Edición
  await page.goto(`${BASE_URL}/productos/${productId}/editar`, { waitUntil: "networkidle" });
  await page.fill('input[name="salePrice"]', "25000");
  await page.click('[data-testid="product-submit"]');
  await page.waitForURL(new RegExp(`/productos/${productId}$`));
  await page.waitForLoadState("networkidle");
  const edited = await one("select sale_price::float as p from public.products where id = $1", [productId]);
  check("Edición de producto", edited?.p === 25000 && (await page.content()).includes("25.000"));

  // Búsqueda
  await page.goto(`${BASE_URL}/productos?q=${code}`, { waitUntil: "networkidle" });
  check("Búsqueda de productos por código", (await page.locator("tbody tr").count()) === 1);

  // Eliminación (producto sin historial)
  const delCode = `DEL-${stamp}`;
  const delId = await createProduct(page, delCode, 0);
  await page.goto(`${BASE_URL}/productos?q=${delCode}`, { waitUntil: "networkidle" });
  await page.locator("tbody tr").first().getByRole("button", { name: "Eliminar" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await page.waitForTimeout(2000);
  const gone = await one("select count(*)::int as n from public.products where id = $1", [delId]);
  check("Eliminación de producto", gone.n === 0);

  // Entrada de inventario
  await page.goto(`${BASE_URL}/productos/${productId}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Registrar movimiento/i }).click();
  await page.fill('input[name="quantity"]', "3");
  await page.fill('input[name="reason"]', "Compra prueba E2E");
  await page.click('[data-testid="movement-submit"]');
  await page.waitForTimeout(2000);
  check("Entrada de inventario suma existencias", (await stockOf(productId)) === 8, `stock=${await stockOf(productId)}`);

  // Venta completa
  await page.goto(`${BASE_URL}/ventas/nueva`, { waitUntil: "networkidle" });
  await page.fill('[data-testid="pos-search"]', code);
  await page.waitForSelector(`[data-testid="pos-product-${code}"]`);
  await page.click(`[data-testid="pos-product-${code}"]`);
  await page.click(`[data-testid="pos-product-${code}"]`);
  await page.waitForTimeout(300);
  const qty = await page.locator('[data-testid="pos-cart"] input[type="number"]').inputValue();
  check("Carrito acumula cantidades", qty === "2", `cantidad=${qty}`);
  await page.fill('[data-testid="pos-discount"]', "10");
  const totalText = await page.locator('[data-testid="pos-total"]').innerText();
  // 2 x 25.000 = 50.000; -10% = 45.000; IVA 19% = 8.550; total = 53.550
  check("Cálculo de totales (descuento + IVA)", totalText.replace(/\D/g, "") === "53550", totalText);
  await page.click('[data-testid="pos-confirm"]');
  await page.getByRole("alertdialog").getByRole("button", { name: /Confirmar venta/i }).click();
  await page.waitForSelector('[data-testid="sale-success"]', { timeout: 30000 });
  const invoiceNumber = (await page.locator('[data-testid="sale-success"]').innerText()).match(/MM-\d{6}/)?.[0];
  check("Venta registrada y factura generada", !!invoiceNumber, invoiceNumber);

  check("Inventario descontado automáticamente", (await stockOf(productId)) === 6, `stock=${await stockOf(productId)}`);
  const sale = await one(
    `select s.total::float as total,
            (select count(*)::int from public.sale_items i where i.sale_id = s.id) as items,
            (select count(*)::int from public.inventory_movements m where m.sale_id = s.id) as movs
     from public.sales s join public.invoices v on v.sale_id = s.id where v.number = $1`,
    [invoiceNumber],
  );
  check("Venta, detalle y movimiento persistidos (calculados en el servidor)", sale?.total === 53550 && sale.items === 1 && sale.movs === 1, sale ? `total=${sale.total}` : "no encontrada");

  // Factura
  await page.click('[data-testid="view-invoice"]');
  await page.waitForURL(/\/facturas\/\d+$/);
  await page.waitForLoadState("networkidle");
  const invoiceUrl = page.url();
  check("Visualización de factura", (await page.locator('[data-testid="invoice-number"]').innerText()).includes(invoiceNumber));
  const [download] = await Promise.all([page.waitForEvent("download"), page.click('[data-testid="download-pdf"]')]);
  check("Descarga de factura en PDF", download.suggestedFilename() === `${invoiceNumber}.pdf`, download.suggestedFilename());
  await page.goto(`${BASE_URL}/facturas?q=${invoiceNumber}`, { waitUntil: "networkidle" });
  check("Búsqueda de factura por número", (await page.locator("tbody tr").count()) === 1);

  // Anulación
  await page.goto(invoiceUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Anular venta/i }).click();
  await page.fill('input[name="voidReason"]', "Prueba E2E");
  await page.getByRole("alertdialog").getByRole("button", { name: /Sí, anular venta/i }).click();
  await page.waitForTimeout(2500);
  check("Anulación restituye inventario", (await stockOf(productId)) === 8, `stock=${await stockOf(productId)}`);

  // CSV
  const csv = await page.request.get(`${BASE_URL}/api/reports/export?type=sales`);
  check("Exportación de reporte CSV", csv.status() === 200 && (await csv.text()).includes(invoiceNumber));

  // Integridad en la base: stock negativo y stock sin movimiento
  let blocked = false;
  try {
    await db.query("update public.products set stock = -1 where id = $1", [productId]);
  } catch {
    blocked = true;
  }
  check("La base de datos impide cambiar existencias sin movimiento / negativas", blocked);

  // Venta sin stock suficiente: el servidor la rechaza
  await page.goto(`${BASE_URL}/ventas/nueva`, { waitUntil: "networkidle" });
  await page.fill('[data-testid="pos-search"]', code);
  await page.waitForSelector(`[data-testid="pos-product-${code}"]`);
  await page.click(`[data-testid="pos-product-${code}"]`);
  await db.query("begin");
  await db.query("select set_config('mm.stock_change', 'on', true)");
  await db.query("update public.products set stock = 0 where id = $1", [productId]);
  await db.query("commit");
  const salesBefore = (await one("select count(*)::int as n from public.sales")).n;
  await page.click('[data-testid="pos-confirm"]');
  await page.getByRole("alertdialog").getByRole("button", { name: /Confirmar venta/i }).click();
  const toast = page.locator('[role="status"]').getByText(/Stock insuficiente/);
  await toast.waitFor({ timeout: 15000 }).catch(() => null);
  const salesAfter = (await one("select count(*)::int as n from public.sales")).n;
  check(
    "Servidor rechaza venta sin stock suficiente (transacción revertida)",
    (await toast.count()) > 0 && salesAfter === salesBefore && (await stockOf(productId)) === 0,
    `ventas ${salesBefore}→${salesAfter}`,
  );

  // Cambio de idioma
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.click('[data-testid="language-switcher"]:visible');
  await page.click('[data-testid="language-option-en"]:visible');
  await page.waitForFunction(() => document.documentElement.lang === "en", null, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  const enText = await page.locator("body").innerText();
  check("Cambio a inglés (dashboard)", enText.includes("Today's sales") && enText.includes("Best-selling products"));
  await page.goto(`${BASE_URL}/productos`, { waitUntil: "networkidle" });
  check("Idioma persiste al navegar (inventario)", (await page.locator("h1").innerText()) === "Products");
  await page.goto(`${BASE_URL}/ventas/nueva`, { waitUntil: "networkidle" });
  check("Idioma persiste al navegar (ventas)", (await page.locator("body").innerText()).includes("Confirm sale"));
  const localeCookie = (await ctx.cookies()).find((c) => c.name === "NEXT_LOCALE");
  check("Idioma guardado para futuras sesiones", localeCookie?.value === "en" && localeCookie.expires > Date.now() / 1000 + 86400);
  await page.click('[data-testid="language-switcher"]:visible');
  await page.click('[data-testid="language-option-es"]:visible');
  await page.waitForFunction(() => document.documentElement.lang === "es", null, { timeout: 15000 });
  check("Regreso a español", (await page.locator("h1").innerText()) === "Nueva venta");

  check("Sin errores de JavaScript en el navegador", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
  await ctx.close();

  // ───────── Vendedor ─────────
  const sctx = await newContext(browser, { locale: "es" });
  const sp = await sctx.newPage();
  await login(sp, SELLER.email, SELLER.password);
  const nav = await sp.locator("aside").innerText();
  check("Vendedor no ve menús de administración", !nav.includes("Usuarios") && !nav.includes("Reportes") && nav.includes("Nueva venta"));
  await sp.goto(`${BASE_URL}/usuarios`, { waitUntil: "networkidle" });
  check("Vendedor no puede acceder a /usuarios", new URL(sp.url()).pathname === "/");
  await sp.goto(`${BASE_URL}/productos/nuevo`, { waitUntil: "networkidle" });
  check("Vendedor no puede crear productos", new URL(sp.url()).pathname === "/");
  check("Vendedor no puede exportar reportes", (await sp.request.get(`${BASE_URL}/api/reports/export?type=sales`)).status() === 403);
  await sp.click('[data-testid="user-menu"]');
  await sp.click('[data-testid="logout"]');
  await sp.waitForURL(/\/signin/);
  check("Cierre de sesión", sp.url().includes("/signin"));
  await sp.goto(`${BASE_URL}/ventas`, { waitUntil: "networkidle" });
  check("Rutas protegidas tras cerrar sesión", sp.url().includes("/signin"));
  await sctx.close();

  // ───────── Políticas RLS (API de Supabase directa, con la clave pública) ─────────
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey, { auth: { persistSession: false } });
  const { data: anonRows } = await anon.from("products").select("id").limit(5);
  const { data: anonSales } = await anon.from("sales").select("id").limit(5);
  check("RLS: un visitante anónimo no puede leer datos", (anonRows ?? []).length === 0 && (anonSales ?? []).length === 0);

  const seller = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey, { auth: { persistSession: false } });
  await seller.auth.signInWithPassword(SELLER);
  const { data: sellerRows } = await seller.from("products").select("id").limit(1);
  const { error: insErr } = await seller
    .from("products")
    .insert({ code: `RLS-${stamp}`, name: "x", category_id: 1, brand: "x", purchase_price: 1, sale_price: 1 });
  const { data: upd } = await seller.from("products").update({ sale_price: 1 }).eq("id", productId).select("id");
  const { error: rpcErr } = await seller.rpc("register_movement", { p_product_id: productId, p_type: "ENTRY", p_quantity: 99 });
  const { error: saleErr } = await seller.from("sales").insert({ customer_id: 1, total: 0 });
  check(
    "RLS: el vendedor lee productos pero no puede modificarlos ni alterar el inventario/ventas por la API",
    (sellerRows ?? []).length === 1 && !!insErr && (upd ?? []).length === 0 && !!rpcErr && !!saleErr,
  );
  await seller.auth.signOut();

  // ───────── Móvil ─────────
  const mctx = await newContext(browser, { locale: "es", viewport: { width: 390, height: 844 } });
  const mp = await mctx.newPage();
  await login(mp, ADMIN.email, ADMIN.password);
  for (const r of ["/", "/productos", "/ventas/nueva", "/facturas", "/reportes", "/inventario", "/clientes"]) {
    await mp.goto(`${BASE_URL}${r}`, { waitUntil: "networkidle" });
    const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`Móvil sin scroll horizontal ${r}`, overflow <= 1, `exceso=${overflow}px`);
  }
  await mp.click('[data-testid="sidebar-toggle"]');
  await mp.waitForTimeout(400);
  const asideBox = await mp.locator("aside").boundingBox();
  check("Menú lateral desplegable en móvil", !!asideBox && asideBox.x >= 0);
  await mctx.close();
} finally {
  // Limpieza de los datos de prueba
  if (productId) {
    await db.query("begin");
    const { rows } = await db.query("select distinct sale_id from public.sale_items where product_id = $1", [productId]);
    const ids = rows.map((r) => r.sale_id);
    await db.query("delete from public.inventory_movements where product_id = $1 or sale_id = any($2)", [productId, ids]);
    await db.query("delete from public.invoices where sale_id = any($1)", [ids]);
    await db.query("delete from public.sales where id = any($1)", [ids]);
    await db.query("delete from public.products where id = $1", [productId]);
    await db.query("commit");
  }
  await db.end();
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones superadas.`);
process.exit(failed.length ? 1 : 0);
