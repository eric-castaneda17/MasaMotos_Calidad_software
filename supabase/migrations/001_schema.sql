-- ═══════════════════════════════════════════════════════════════════
-- MASA MOTOS · 001 · Esquema relacional (Supabase / PostgreSQL)
-- Ejecutar en: Supabase → SQL Editor  (o `npm run db:setup`)
-- ═══════════════════════════════════════════════════════════════════

-- ───────── Seguridad: roles y perfiles (vinculados a Supabase Auth) ─────────

create table if not exists public.roles (
  code        text primary key check (code in ('ADMIN', 'SELLER')),
  name        varchar(60)  not null,
  description varchar(255)
);

insert into public.roles (code, name, description) values
  ('ADMIN',  'Administrador', 'Acceso total al sistema'),
  ('SELLER', 'Vendedor',      'Ventas, clientes y consulta de productos')
on conflict (code) do nothing;

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  name          varchar(120) not null,
  email         varchar(160) not null unique,
  role          text not null default 'SELLER' references public.roles (code) on update cascade,
  active        boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ───────── Catálogo ─────────

create table if not exists public.categories (
  id          integer generated always as identity primary key,
  name        varchar(80) not null,
  description varchar(255),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists categories_name_key on public.categories (lower(name));

create table if not exists public.suppliers (
  id           integer generated always as identity primary key,
  name         varchar(150) not null,
  tax_id       varchar(30)  not null unique,
  contact_name varchar(120),
  phone        varchar(30),
  email        varchar(160),
  address      varchar(255),
  city         varchar(80),
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists suppliers_name_idx on public.suppliers (name);

create table if not exists public.products (
  id               integer generated always as identity primary key,
  code             varchar(40)  not null unique,
  name             varchar(150) not null,
  description      text,
  category_id      integer not null references public.categories (id) on delete restrict,
  brand            varchar(80)  not null,
  compatible_model varchar(160),
  purchase_price   numeric(14,2) not null check (purchase_price >= 0),
  sale_price       numeric(14,2) not null check (sale_price >= 0),
  stock            integer not null default 0 check (stock >= 0),
  min_stock        integer not null default 0 check (min_stock >= 0),
  supplier_id      integer references public.suppliers (id) on delete set null,
  image_path       text,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists products_name_idx     on public.products (name);
create index if not exists products_brand_idx    on public.products (brand);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_supplier_idx on public.products (supplier_id);

-- ───────── Clientes ─────────

create table if not exists public.customers (
  id              integer generated always as identity primary key,
  full_name       varchar(150) not null,
  document_type   text not null check (document_type in ('CC', 'CE', 'NIT', 'PP', 'TI')),
  document_number varchar(30)  not null,
  phone           varchar(30),
  email           varchar(160),
  address         varchar(255),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (document_type, document_number)
);
create index if not exists customers_name_idx on public.customers (full_name);

-- ───────── Ventas y facturación ─────────

create table if not exists public.payment_methods (
  id     integer generated always as identity primary key,
  code   varchar(30) not null unique,
  name   varchar(80) not null,
  active boolean not null default true
);

create table if not exists public.sales (
  id                integer generated always as identity primary key,
  customer_id       integer not null references public.customers (id) on delete restrict,
  user_id           uuid    not null references public.profiles (id) on delete restrict,
  payment_method_id integer not null references public.payment_methods (id) on delete restrict,
  subtotal          numeric(14,2) not null check (subtotal >= 0),
  discount          numeric(14,2) not null default 0 check (discount >= 0),
  tax_rate          numeric(5,2)  not null,
  tax_amount        numeric(14,2) not null check (tax_amount >= 0),
  total             numeric(14,2) not null check (total >= 0),
  amount_received   numeric(14,2),
  notes             varchar(500),
  status            text not null default 'COMPLETED' check (status in ('COMPLETED', 'VOIDED')),
  void_reason       varchar(255),
  voided_at         timestamptz,
  created_at        timestamptz not null default now(),
  constraint sales_discount_le_subtotal check (discount <= subtotal)
);
create index if not exists sales_created_idx  on public.sales (created_at);
create index if not exists sales_customer_idx on public.sales (customer_id);

create table if not exists public.sale_items (
  id           integer generated always as identity primary key,
  sale_id      integer not null references public.sales (id) on delete cascade,
  product_id   integer not null references public.products (id) on delete restrict,
  product_code varchar(40)  not null,
  product_name varchar(150) not null,
  quantity     integer not null check (quantity > 0),
  unit_price   numeric(14,2) not null check (unit_price >= 0),
  line_total   numeric(14,2) not null
);
create index if not exists sale_items_sale_idx    on public.sale_items (sale_id);
create index if not exists sale_items_product_idx on public.sale_items (product_id);

create table if not exists public.invoices (
  id        integer generated always as identity primary key,
  number    varchar(30) not null unique,
  sale_id   integer not null unique references public.sales (id) on delete restrict,
  issued_at timestamptz not null default now()
);

-- ───────── Inventario ─────────

create table if not exists public.inventory_movements (
  id           integer generated always as identity primary key,
  product_id   integer not null references public.products (id) on delete restrict,
  type         text not null check (type in ('ENTRY', 'EXIT', 'SALE', 'VOID', 'ADJUSTMENT')),
  quantity     integer not null check (quantity > 0),
  stock_before integer not null check (stock_before >= 0),
  stock_after  integer not null check (stock_after >= 0),
  reason       varchar(255),
  user_id      uuid references public.profiles (id) on delete set null,
  sale_id      integer references public.sales (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists movements_product_idx on public.inventory_movements (product_id, created_at);
create index if not exists movements_created_idx on public.inventory_movements (created_at);
create index if not exists movements_sale_idx    on public.inventory_movements (sale_id);

-- ───────── Configuración (fila única) ─────────

create table if not exists public.settings (
  id                  integer primary key default 1 check (id = 1),
  company_name        varchar(120) not null default 'MASA MOTOS',
  company_tax_id      varchar(30)  not null default '',
  company_address     varchar(255) not null default '',
  company_phone       varchar(30)  not null default '',
  company_email       varchar(160) not null default '',
  tax_rate            numeric(5,2) not null default 19 check (tax_rate between 0 and 100),
  tax_enabled         boolean not null default true,
  invoice_prefix      varchar(10)  not null default 'MM',
  next_invoice_number integer not null default 1,
  invoice_footer      varchar(500) not null default '',
  currency            varchar(3)   not null default 'COP'
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ───────── updated_at automático ─────────

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles', 'categories', 'suppliers', 'products', 'customers'] loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s', t);
    execute format('create trigger trg_%1$s_updated before update on public.%1$s
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;
