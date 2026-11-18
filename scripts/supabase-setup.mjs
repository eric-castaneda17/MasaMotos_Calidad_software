/**
 * Configura la base de datos de MASA MOTOS en Supabase (sin Docker).
 *
 *   npm run db:setup            → crea/actualiza tablas, RLS y funciones; crea usuarios de prueba; siembra datos
 *   npm run db:setup -- --reset → además BORRA los datos de negocio y vuelve a sembrar
 *   npm run db:check            → solo verifica la conexión, las tablas y RLS
 *
 * Lee .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y SUPABASE_DB_URL.
 * Alternativa manual: pegar los archivos de supabase/migrations/ y supabase/seed.sql en el SQL Editor.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { qaCredentials } from "./lib/qa-credentials.mjs";

config({ path: ".env.local" });
config();

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check");
const RESET = args.has("--reset");

const { NEXT_PUBLIC_SUPABASE_URL: URL, SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY, SUPABASE_DB_URL: DB_URL } = process.env;
const missing = [
  ["NEXT_PUBLIC_SUPABASE_URL", URL],
  ["SUPABASE_DB_URL", DB_URL],
].filter(([, v]) => !v);
if (missing.length) {
  console.error(`✘ Faltan variables en .env.local: ${missing.map(([k]) => k).join(", ")}`);
  process.exit(1);
}

const MIGRATIONS = ["001_schema.sql", "002_security.sql", "003_functions.sql", "004_grants.sql"];
const TABLES = [
  "roles", "profiles", "categories", "suppliers", "products", "customers",
  "payment_methods", "sales", "sale_items", "invoices", "inventory_movements", "settings",
];
const TEST_USERS = CHECK_ONLY ? [] : [
  { ...qaCredentials("ADMIN"), name: "Administrador MASA", role: "ADMIN" },
  { ...qaCredentials("SELLER"), name: "Camila Vendedora", role: "SELLER" },
];

const db = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
const admin = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function verify() {
  const { rows } = await db.query(
    `select c.relname as table, c.relrowsecurity as rls,
            (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as policies
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and c.relname = any($1) order by 1`,
    [TABLES],
  );
  const found = new Set(rows.map((r) => r.table));
  let ok = true;
  for (const t of TABLES) {
    const r = rows.find((x) => x.table === t);
    if (!r) {
      ok = false;
      console.log(`  ✘ ${t}: no existe`);
      continue;
    }
    const { rows: c } = await db.query(`select count(*)::int as n from public.${t}`);
    console.log(`  ${r.rls ? "✔" : "✘"} ${t.padEnd(20)} RLS=${r.rls ? "sí" : "NO"}  políticas=${r.policies}  filas=${c[0].n}`);
    if (!r.rls) ok = false;
  }
  if (found.size !== TABLES.length) ok = false;
  return ok;
}

async function ensureUser(u) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const existing = data.users.find((x) => x.email?.toLowerCase() === u.email);
    if (existing) {
      await admin.auth.admin.updateUserById(existing.id, {
        app_metadata: { role: u.role, active: true },
        ban_duration: "none",
      });
      await db.query("update public.profiles set role = $1, active = true where id = $2", [u.role, existing.id]);
      return "existente";
    }
    if (data.users.length < 200) break;
  }
  const { error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { name: u.name },
    app_metadata: { role: u.role, active: true },
  });
  if (error) throw error;
  return "creado";
}

/**
 * Alternativa sin la clave secreta: crea la cuenta directamente en auth.users +
 * auth.identities (método de sembrado documentado por Supabase), con la
 * contraseña cifrada con bcrypt (pgcrypto).
 */
async function ensureUserViaSql(u) {
  const existing = await db.query("select id from auth.users where email = $1", [u.email]);
  if (existing.rowCount) {
    await db.query("update public.profiles set role = $1, active = true where id = $2", [u.role, existing.rows[0].id]);
    return "existente";
  }
  await db.query("begin");
  const { rows: [created] } = await db.query(
    `insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token,
       email_change, email_change_token_new, email_change_token_current, phone_change, phone_change_token,
       reauthentication_token)
     values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', $1,
       extensions.crypt($2, extensions.gen_salt('bf')), now(),
       jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', $4::text, 'active', true),
       jsonb_build_object('name', $3::text), now(), now(), '', '', '', '', '', '', '', '')
     returning id`,
    [u.email, u.password, u.name, u.role],
  );
  await db.query(
    `insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
     values (gen_random_uuid(), $1::text, $1::uuid,
       jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true), 'email', now(), now(), now())`,
    [created.id, u.email],
  );
  await db.query("commit");
  return "creado (vía SQL)";
}

async function serviceKeyWorks() {
  const res = await fetch(`${URL}/auth/v1/admin/users?per_page=1`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  }).catch(() => null);
  return !!res?.ok;
}

try {
  await db.connect();
  const { rows } = await db.query("select version()");
  console.log(`✔ Conexión con Supabase PostgreSQL: ${rows[0].version.split(",")[0]}`);

  if (!CHECK_ONLY) {
    for (const file of MIGRATIONS) {
      await db.query(readFileSync(join("supabase", "migrations", file), "utf8"));
      console.log(`✔ Migración aplicada: ${file}`);
    }

    const viaApi = await serviceKeyWorks();
    if (!viaApi) {
      console.log("⚠ SUPABASE_SERVICE_ROLE_KEY no es válida: los usuarios de prueba se crean vía SQL.");
      console.log("  (El módulo Usuarios de la aplicación sí necesita la clave secreta correcta.)");
    }
    for (const u of TEST_USERS) {
      console.log(`✔ Usuario ${u.email}: ${viaApi ? await ensureUser(u) : await ensureUserViaSql(u)}`);
    }

    if (RESET) {
      await db.query(`truncate public.inventory_movements, public.invoices, public.sale_items, public.sales,
                      public.products, public.categories, public.suppliers, public.customers,
                      public.payment_methods restart identity cascade`);
      await db.query("update public.settings set next_invoice_number = 1 where id = 1");
      console.log("✔ Datos de negocio eliminados (--reset)");
    }

    const notices = [];
    db.on("notice", (n) => notices.push(n.message));
    await db.query(readFileSync(join("supabase", "seed.sql"), "utf8"));
    notices.forEach((m) => console.log(`  · ${m}`));
    console.log("✔ Datos de prueba procesados");
  }

  console.log("\nTablas en Supabase:");
  const ok = await verify();
  console.log(ok ? "\n✔ Base de datos lista." : "\n✘ Hay problemas en la base de datos.");
  if (!CHECK_ONLY) {
    console.log("\nUsuarios de prueba preparados:");
    TEST_USERS.forEach((u) => console.log(`  ${u.role}: credenciales configuradas en el entorno privado.`));
  }
  process.exitCode = ok ? 0 : 1;
} catch {
  console.error("✘ Error en la preparación. Revise la configuración y la conexión privadas.");
  process.exitCode = 1;
} finally {
  await db.end().catch(() => {});
}
