import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { parse } from "dotenv";
import pg from "pg";
import { qaCredentials } from "./lib/qa-credentials.mjs";

export const qaDirectory = ".qa";
export const lotFile = `${qaDirectory}/lote.json`;
export const appUrl = process.env.QA_APP_URL ?? "http://localhost:3000";
export const academicProject = "mrlasbwtjpbqfzhvdjru";

function parseEndpoint(value) {
  try {
    return new URL(value);
  } catch {
    throw new Error("Endpoint QA inválido.");
  }
}

export function academicEndpoints(config) {
  const url = parseEndpoint(config.NEXT_PUBLIC_SUPABASE_URL);
  const pgUrl = parseEndpoint(config.SUPABASE_DB_URL);
  assert(config.QA_SUPABASE_REF === academicProject, "Confirme el proyecto académico en QA_SUPABASE_REF.");
  assert(
    url.origin === `https://${academicProject}.supabase.co` && url.pathname === "/" &&
      !url.username && !url.password && !url.search && !url.hash,
    "La URL de la API no corresponde al proyecto académico.",
  );
  const direct = pgUrl.hostname === `db.${academicProject}.supabase.co` && pgUrl.username === "postgres";
  const pooled = pgUrl.hostname === "aws-1-us-east-2.pooler.supabase.com" &&
    pgUrl.username === `postgres.${academicProject}`;
  assert(
    ["postgresql:", "postgres:"].includes(pgUrl.protocol) && (direct || pooled) &&
      ["", "5432"].includes(pgUrl.port) && pgUrl.pathname === "/postgres" && pgUrl.password && !pgUrl.hash,
    "La conexión PostgreSQL no corresponde al destino académico en modo sesión.",
  );
  // Ningún parámetro del DSN puede reemplazar el destino o las opciones TLS verificadas.
  pgUrl.search = "";
  pgUrl.port = "5432";
  return { project: academicProject, url: url.origin, dbUrl: pgUrl.toString() };
}

export async function qaConfig() {
  const config = { ...parse(await readFile(".env.local")), ...process.env };
  const localApp = parseEndpoint(appUrl);
  assert(
    ["http:", "https:"].includes(localApp.protocol) && ["localhost", "127.0.0.1"].includes(localApp.hostname) &&
      !localApp.username && !localApp.password,
    "Use una instancia local de la aplicación.",
  );
  return {
    ...academicEndpoints(config),
    apiKey: config.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    serviceKey: config.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export async function credentials(role) {
  return qaCredentials(role);
}

async function connect() {
  const config = await qaConfig();
  const ca = process.env.QA_DB_CA_FILE ? await readFile(process.env.QA_DB_CA_FILE, "utf8") : undefined;
  const db = new pg.Client({
    connectionString: config.dbUrl,
    ssl: { ca, rejectUnauthorized: true },
    connectionTimeoutMillis: 10000,
  });
  await db.connect();
  return { db, config };
}

export async function snapshot(db) {
  const objects = await db.query(`
    select 'table' as kind, c.relname as name, c.relrowsecurity::text || ':' ||
      coalesce(c.relacl::text, '') as definition
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind in ('r','v')
    union all
    select 'policy', tablename || ':' || policyname, row(roles, cmd, qual, with_check)::text
    from pg_policies where schemaname in ('public','storage')
    union all
    select 'function', p.proname || ':' || pg_get_function_identity_arguments(p.oid),
           pg_get_functiondef(p.oid) || coalesce(p.proacl::text,'')
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prokind='f'
    union all
    select 'trigger', c.relname || ':' || t.tgname, pg_get_triggerdef(t.oid)
    from pg_trigger t join pg_class c on c.oid=t.tgrelid
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname in ('public','storage','auth') and not t.tgisinternal
    order by kind,name
  `);
  const { rows: [counts] } = await db.query(`
    select
      (select count(*)::int from public.products where code not like 'QA\\_TEST-%') as existing_products,
      (select count(*)::int from public.sales where coalesce(notes,'') not like 'QA\\_TEST-%') as other_sales,
      (select count(*)::int from public.invoices) as total_invoices,
      (select count(*)::int from public.inventory_movements) as total_movements
  `);
  const { rows: [settings] } = await db.query("select tax_rate, tax_enabled, next_invoice_number from public.settings where id=1");
  const { rows: [payment] } = await db.query("select id from public.payment_methods where code='CASH' and active");
  return {
    objects: Object.fromEntries(["table", "policy", "function", "trigger"].map((kind) => [
      kind, objects.rows.filter((row) => row.kind === kind).length,
    ])),
    structuralHash: createHash("sha256").update(JSON.stringify(objects.rows)).digest("hex"),
    counts,
    settings,
    cashActive: Boolean(payment),
  };
}

async function writeJson(file, data) {
  await mkdir(qaDirectory, { recursive: true });
  await writeFile(`${qaDirectory}/${file}`, JSON.stringify(data, null, 2) + "\n");
}

async function createFixtures(db) {
  const run = `QA_TEST-${Date.now().toString(36).toUpperCase()}`;
  const products = {};
  const customers = {};
  await db.query("begin");
  try {
    const categoryIds = [];
    for (const suffix of ["A", "B"]) {
      const { rows: [category] } = await db.query("insert into public.categories(name) values($1) returning id,name", [`${run}-${suffix}`]);
      categoryIds.push(category);
    }
    for (const [key, stock, category, brand] of [
      ["CAT_AVAILABLE", 4, 0, "Yamaha"], ["CAT_LOW", 2, 0, "Honda"], ["CAT_ZERO", 0, 1, "Yamaha"],
      ["BB_BOUNDARY", 3, 0, "Yamaha"], ["BB_SALE", 10, 0, "Yamaha"],
      ["API_ZERO", 3, 0, "Yamaha"], ["API_LOW", 3, 0, "Yamaha"], ["API_SALE", 10, 0, "Yamaha"],
      ["API_INVOICE", 4, 0, "Yamaha"], ["BB_INVOICE", 4, 0, "Yamaha"],
      ["E2E_SALE", 10, 0, "Yamaha"], ["E2E_RACE", 1, 0, "Yamaha"],
    ]) {
      const code = `${run}-${key}`;
      const { rows: [product] } = await db.query(
        `insert into public.products(code,name,brand,category_id,purchase_price,sale_price,stock,min_stock)
         values($1,$1,$2,$3,10000,25000,$4,2) returning id,code,name,stock`,
        [code, brand, categoryIds[category].id, stock],
      );
      products[key] = product;
    }
    for (const key of ["BB", "BB_INVOICE", "API_ZERO", "API_LOW", "API_SALE", "API_INVOICE", "E2E_SALE", "E2E_NEW", "E2E_A", "E2E_B"]) {
      const { rows: [customer] } = await db.query(
        `insert into public.customers(full_name,document_type,document_number)
         values($1,'CC',$2) returning id,full_name,document_number`,
        [`${run}-${key}`, `QA-${run.slice(8)}-${key.replaceAll("_", "-")}`],
      );
      customers[key] = customer;
    }
    const { rows: [cash] } = await db.query("select id from public.payment_methods where code='CASH' and active");
    await db.query("commit");
    return { run, categories: categoryIds, products, customers, cashId: cash.id };
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
}

async function createInactive(db, config, lot) {
  const email = `${lot.run.toLowerCase()}-inactive@example.test`;
  const password = process.env.QA_INACTIVE_PASSWORD;
  if (!password) return { ready: false, reason: "QA_INACTIVE_PASSWORD ausente" };
  const admin = createClient(config.url, config.serviceKey, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { name: `${lot.run}-inactive` },
    app_metadata: { role: "SELLER", active: false },
  });
  if (error && error.status !== 401) return { ready: false, status: error.status ?? null };
  if (error) {
    // Alternativa de la semilla existente. Solo se inserta una identidad nueva del lote.
    await db.query("begin");
    try {
      const { rows: [account] } = await db.query(`
        insert into auth.users (instance_id,id,aud,role,email,encrypted_password,
          email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
          confirmation_token,recovery_token,email_change,email_change_token_new,
          email_change_token_current,phone_change,phone_change_token,reauthentication_token)
        values ('00000000-0000-0000-0000-000000000000',gen_random_uuid(),'authenticated','authenticated',$1,
          extensions.crypt($2,extensions.gen_salt('bf')),now(),
          '{"provider":"email","providers":["email"],"role":"SELLER","active":false}'::jsonb,
          jsonb_build_object('name',$3::text),now(),now(),'','','','','','','','')
        returning id
      `, [email, password, `${lot.run}-inactive`]);
      await db.query(`
        insert into auth.identities (id,provider_id,user_id,identity_data,provider,created_at,updated_at)
        values (gen_random_uuid(),$1::uuid::text,$1::uuid,
          jsonb_build_object('sub',$1::uuid::text,'email',$2::text,'email_verified',true),'email',now(),now())
      `, [account.id, email]);
      const { rows: [profile] } = await db.query("select role,active from public.profiles where id=$1", [account.id]);
      assert(profile?.role === "SELLER" && profile.active === false, "El perfil sintético debe quedar inactivo.");
      await db.query("commit");
    } catch (failure) {
      await db.query("rollback");
      throw failure;
    }
  }
  return { ready: true, method: data?.user ? "Auth Admin" : "semilla SQL", ...(error ? { adminStatus: error.status } : {}) };
}

async function renewE2eFixtures(db, lot, raceOnly) {
  const retry = Date.now().toString(36).toUpperCase();
  const products = raceOnly ? [["E2E_RACE", 1]] : [["E2E_SALE", 10], ["E2E_RACE", 1]];
  const customers = raceOnly ? ["E2E_A", "E2E_B"] : ["E2E_SALE", "E2E_NEW", "E2E_A", "E2E_B"];
  await db.query("begin");
  try {
    for (const [key, stock] of products) {
      const code = `${lot.run}-R${retry}-${key.replaceAll("_", "-")}`;
      const { rows: [product] } = await db.query(
        `insert into public.products(code,name,brand,category_id,purchase_price,sale_price,stock,min_stock)
         values($1,$1,'Yamaha',$2,10000,25000,$3,2) returning id,code,name,stock`,
        [code, lot.categories[0].id, stock],
      );
      lot.products[key] = product;
    }
    for (const key of customers) {
      const slug = key.replaceAll("_", "-");
      const { rows: [customer] } = await db.query(
        `insert into public.customers(full_name,document_type,document_number)
         values($1,'CC',$2) returning id,full_name,document_number`,
        [`${lot.run}-R${retry}-${slug}`, `QA-${retry}-${slug}`],
      );
      lot.customers[key] = customer;
    }
    await db.query("commit");
    return { retry, newProducts: products.length, newCustomers: customers.length };
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
}

async function main(mode) {
  const { db, config } = await connect();
  try {
    if (mode === "check") {
      const before = await snapshot(db);
      await writeJson("estado-inicial.json", before);
      console.log(JSON.stringify({ connected: true, ...before }));
    } else if (mode === "prepare") {
      assert.equal(process.env.QA_ALLOW_WRITES, "1", "La preparación requiere QA_ALLOW_WRITES=1.");
      const before = await snapshot(db);
      assert(before.cashActive && before.settings.tax_enabled && Number(before.settings.tax_rate) === 19, "QA requiere efectivo activo e IVA de 19 %.");
      const lot = await createFixtures(db);
      await writeJson("lote.json", lot);
      const inactive = await createInactive(db, config, lot);
      console.log(JSON.stringify({ lot: lot.run, products: Object.keys(lot.products).length, customers: Object.keys(lot.customers).length, inactive }));
    } else if (mode === "inactive") {
      assert.equal(process.env.QA_ALLOW_WRITES, "1");
      const lot = JSON.parse(await readFile(lotFile, "utf8"));
      assert.match(lot.run, /^QA_TEST-[A-Z0-9]+$/);
      console.log(JSON.stringify(await createInactive(db, config, lot)));
    } else if (mode === "retest-e2e") {
      assert.equal(process.env.QA_ALLOW_WRITES, "1");
      const lot = JSON.parse(await readFile(lotFile, "utf8"));
      assert.match(lot.run, /^QA_TEST-[A-Z0-9]+$/);
      const retry = await renewE2eFixtures(db, lot, process.argv.includes("--solo-carrera"));
      await writeJson("lote.json", lot);
      console.log(JSON.stringify({ lot: lot.run, ...retry }));
    } else if (mode === "after") {
      const lot = JSON.parse(await readFile(lotFile, "utf8"));
      const result = await snapshot(db);
      const { rows } = await db.query(`
        select p.code,p.stock,
          (select count(*)::int from public.inventory_movements m where m.product_id=p.id and m.type='SALE') as sale_movements,
          (select count(distinct s.id)::int from public.sale_items i join public.sales s on s.id=i.sale_id
            where i.product_id=p.id) as sales
        from public.products p where left(p.code,length($1))=$1 order by p.code
      `, [lot.run + "-"]);
      await writeJson("estado-final.json", { ...result, lot: lot.run, products: rows });
      console.log(JSON.stringify({ ...result, lot: lot.run, products: rows }));
    } else throw new Error("Modo esperado: check, prepare, inactive, retest-e2e o after.");
  } finally {
    await db.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv[2]).catch((error) => {
    console.error("Operación QA detenida.", error.code ?? error.name);
    process.exitCode = 1;
  });
}
