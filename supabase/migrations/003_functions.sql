-- ═══════════════════════════════════════════════════════════════════
-- MASA MOTOS · 003 · Lógica de negocio: funciones transaccionales,
-- vistas de consulta y funciones de reportes
-- ═══════════════════════════════════════════════════════════════════
-- Los errores de negocio se lanzan con errcode P0001, el mensaje es una
-- clave de traducción (src/messages/*.json → "errors.<clave>") y el detalle
-- (DETAIL) lleva los parámetros en JSON.

-- ───────── Integridad del inventario ─────────

-- Las existencias solo cambian mediante movimientos registrados (funciones de
-- este archivo), nunca con un UPDATE directo desde la API.
create or replace function public.guard_product_stock() returns trigger
language plpgsql as $$
begin
  if new.stock is distinct from old.stock
     and coalesce(current_setting('mm.stock_change', true), '') <> 'on' then
    raise exception 'stockViaMovements' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists trg_products_stock_guard on public.products;
create trigger trg_products_stock_guard before update on public.products
  for each row execute function public.guard_product_stock();

-- Stock inicial: al crear un producto con existencias se registra el ajuste.
create or replace function public.log_initial_stock() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.stock > 0 then
    insert into public.inventory_movements (product_id, type, quantity, stock_before, stock_after, reason, user_id)
    values (new.id, 'ADJUSTMENT', new.stock, 0, new.stock, 'initialStock', auth.uid());
  end if;
  return new;
end $$;

drop trigger if exists trg_products_initial_stock on public.products;
create trigger trg_products_initial_stock after insert on public.products
  for each row execute function public.log_initial_stock();

-- ───────── Movimientos de inventario (solo administrador) ─────────
-- ENTRY suma, EXIT resta (nunca por debajo de 0), ADJUSTMENT fija el conteo físico.

create or replace function public.register_movement(
  p_product_id integer, p_type text, p_quantity integer, p_reason text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_before integer;
  v_name text;
  v_after integer;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if p_type not in ('ENTRY', 'EXIT', 'ADJUSTMENT') or p_quantity is null or p_quantity < 0 then
    raise exception 'validation' using errcode = 'P0001';
  end if;

  select stock, name into v_before, v_name from public.products where id = p_product_id for update;
  if not found then raise exception 'notFound' using errcode = 'P0001'; end if;

  v_after := case p_type when 'ENTRY' then v_before + p_quantity
                         when 'EXIT' then v_before - p_quantity
                         else p_quantity end;
  if v_after < 0 then
    raise exception 'insufficientStock' using errcode = 'P0001',
      detail = json_build_object('product', v_name, 'available', v_before)::text;
  end if;
  if v_after = v_before then raise exception 'noStockChange' using errcode = 'P0001'; end if;

  perform set_config('mm.stock_change', 'on', true);
  update public.products set stock = v_after where id = p_product_id;
  insert into public.inventory_movements (product_id, type, quantity, stock_before, stock_after, reason, user_id)
  values (p_product_id, p_type, abs(v_after - v_before), v_before, v_after, nullif(trim(p_reason), ''), auth.uid());
end $$;

-- ───────── Venta transaccional ─────────
-- 1) bloquea los productos (FOR UPDATE, en orden de id), 2) valida existencias,
-- 3) calcula totales con los precios de la base (no los del navegador),
-- 4) crea venta y detalle, 5) descuenta inventario y registra movimientos,
-- 6) asigna el consecutivo de factura. Si algo falla, no se guarda nada.

create or replace function public.create_sale(
  p_customer_id integer,
  p_payment_method_id integer,
  p_discount_type text,
  p_discount_value numeric,
  p_amount_received numeric,
  p_notes text,
  p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_settings public.settings%rowtype;
  v_method   public.payment_methods%rowtype;
  v_requested integer;
  v_found     integer := 0;
  v_sub_c     bigint := 0;
  v_disc_c    bigint;
  v_tax_c     bigint;
  v_rate      numeric;
  v_total     numeric;
  v_sale_id   integer;
  v_invoice_id integer;
  v_seq       integer;
  v_prefix    text;
  v_number    text;
  r record;
begin
  if not public.is_staff() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'emptyCart' using errcode = 'P0001';
  end if;
  if p_discount_type not in ('PERCENT', 'AMOUNT') or coalesce(p_discount_value, 0) < 0 then
    raise exception 'validation' using errcode = 'P0001';
  end if;
  if exists (select 1 from jsonb_array_elements(p_items) e
             where (e ->> 'productId') is null or coalesce((e ->> 'quantity')::integer, 0) <= 0) then
    raise exception 'validation' using errcode = 'P0001';
  end if;

  perform 1 from public.customers where id = p_customer_id;
  if not found then raise exception 'customerRequired' using errcode = 'P0001'; end if;
  select * into v_method from public.payment_methods where id = p_payment_method_id;
  if not found or not v_method.active then raise exception 'paymentMethodRequired' using errcode = 'P0001'; end if;
  select * into v_settings from public.settings where id = 1;

  select count(distinct (e ->> 'productId')::integer) into v_requested from jsonb_array_elements(p_items) e;

  -- Paso 1: bloqueo y validación.
  for r in
    select p.id, p.name, p.sale_price, p.stock, p.active, q.qty
    from (select (e ->> 'productId')::integer as pid, sum((e ->> 'quantity')::integer) as qty
          from jsonb_array_elements(p_items) e group by 1) q
    join public.products p on p.id = q.pid
    order by p.id
    for update of p
  loop
    v_found := v_found + 1;
    if not r.active then
      raise exception 'productInactive' using errcode = 'P0001', detail = json_build_object('product', r.name)::text;
    end if;
    if r.stock < r.qty then
      raise exception 'insufficientStock' using errcode = 'P0001',
        detail = json_build_object('product', r.name, 'available', r.stock)::text;
    end if;
    v_sub_c := v_sub_c + round(r.sale_price * 100) * r.qty;
  end loop;
  if v_found <> v_requested then raise exception 'notFound' using errcode = 'P0001'; end if;

  -- Paso 2: totales en centavos (misma fórmula que src/lib/sale-calc.ts).
  v_disc_c := case when p_discount_type = 'PERCENT'
                   then round(v_sub_c * least(coalesce(p_discount_value, 0), 100) / 100.0)
                   else round(coalesce(p_discount_value, 0) * 100) end;
  v_disc_c := least(v_disc_c, v_sub_c);
  v_rate   := case when v_settings.tax_enabled then v_settings.tax_rate else 0 end;
  v_tax_c  := round((v_sub_c - v_disc_c) * v_rate / 100);
  v_total  := (v_sub_c - v_disc_c + v_tax_c) / 100.0;

  if p_amount_received is not null and p_amount_received < v_total then
    raise exception 'amountReceivedTooLow' using errcode = 'P0001';
  end if;

  insert into public.sales (customer_id, user_id, payment_method_id, subtotal, discount, tax_rate,
                            tax_amount, total, amount_received, notes)
  values (p_customer_id, auth.uid(), p_payment_method_id, v_sub_c / 100.0, v_disc_c / 100.0, v_rate,
          v_tax_c / 100.0, v_total, p_amount_received, nullif(trim(p_notes), ''))
  returning id into v_sale_id;

  -- Paso 3: detalle, descuento de inventario y movimientos.
  perform set_config('mm.stock_change', 'on', true);
  for r in
    select p.id, p.code, p.name, p.sale_price, p.stock, q.qty
    from (select (e ->> 'productId')::integer as pid, sum((e ->> 'quantity')::integer) as qty
          from jsonb_array_elements(p_items) e group by 1) q
    join public.products p on p.id = q.pid
    order by p.id
  loop
    insert into public.sale_items (sale_id, product_id, product_code, product_name, quantity, unit_price, line_total)
    values (v_sale_id, r.id, r.code, r.name, r.qty, r.sale_price, r.sale_price * r.qty);
    update public.products set stock = r.stock - r.qty where id = r.id;
    insert into public.inventory_movements (product_id, type, quantity, stock_before, stock_after, user_id, sale_id)
    values (r.id, 'SALE', r.qty, r.stock, r.stock - r.qty, auth.uid(), v_sale_id);
  end loop;

  -- Paso 4: consecutivo de factura (el UPDATE bloquea la fila: números únicos y sin saltos).
  update public.settings set next_invoice_number = next_invoice_number + 1 where id = 1
  returning next_invoice_number - 1, invoice_prefix into v_seq, v_prefix;
  v_number := v_prefix || '-' || lpad(v_seq::text, 6, '0');
  insert into public.invoices (number, sale_id) values (v_number, v_sale_id) returning id into v_invoice_id;

  return jsonb_build_object('saleId', v_sale_id, 'invoiceId', v_invoice_id, 'invoiceNumber', v_number);
end $$;

-- ───────── Anulación de venta (solo administrador): restituye el inventario ─────────

create or replace function public.void_sale(p_sale_id integer, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_status text;
  r record;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if nullif(trim(p_reason), '') is null then raise exception 'validation' using errcode = 'P0001'; end if;

  select status into v_status from public.sales where id = p_sale_id for update;
  if not found then raise exception 'notFound' using errcode = 'P0001'; end if;
  if v_status = 'VOIDED' then raise exception 'alreadyVoided' using errcode = 'P0001'; end if;

  perform set_config('mm.stock_change', 'on', true);
  for r in
    select si.product_id, si.quantity, p.stock
    from public.sale_items si join public.products p on p.id = si.product_id
    where si.sale_id = p_sale_id
    order by si.product_id
    for update of p
  loop
    update public.products set stock = r.stock + r.quantity where id = r.product_id;
    insert into public.inventory_movements (product_id, type, quantity, stock_before, stock_after, reason, user_id, sale_id)
    values (r.product_id, 'VOID', r.quantity, r.stock, r.stock + r.quantity, left(trim(p_reason), 255), auth.uid(), p_sale_id);
  end loop;

  update public.sales set status = 'VOIDED', void_reason = left(trim(p_reason), 255), voided_at = now()
  where id = p_sale_id;
end $$;

-- ───────── Eliminación definitiva de producto (solo sin historial) ─────────

create or replace function public.delete_product(p_product_id integer) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  perform 1 from public.products where id = p_product_id for update;
  if not found then raise exception 'notFound' using errcode = 'P0001'; end if;
  if exists (select 1 from public.sale_items where product_id = p_product_id)
     or exists (select 1 from public.inventory_movements where product_id = p_product_id and type <> 'ADJUSTMENT') then
    raise exception 'productHasHistory' using errcode = 'P0001';
  end if;
  delete from public.inventory_movements where product_id = p_product_id;
  delete from public.products where id = p_product_id;
end $$;

-- Último acceso del usuario autenticado.
create or replace function public.touch_last_login() returns void
language sql security definer set search_path = public as $$
  update public.profiles set last_login_at = now() where id = auth.uid();
$$;

-- ───────── Vistas de consulta (security_invoker: respetan las políticas RLS) ─────────

create or replace view public.products_view with (security_invoker = true) as
select p.id, p.code, p.name, p.description, p.category_id, c.name as category_name,
       p.brand, p.compatible_model, p.purchase_price, p.sale_price, p.stock, p.min_stock,
       p.supplier_id, s.name as supplier_name, (p.image_path is not null) as has_image,
       p.active, p.created_at, p.updated_at,
       case when p.stock <= 0 then 'out' when p.stock <= p.min_stock then 'low' else 'available' end as stock_status
from public.products p
join public.categories c on c.id = p.category_id
left join public.suppliers s on s.id = p.supplier_id;

create or replace view public.sales_view with (security_invoker = true) as
select s.id, s.created_at, s.status, s.total, s.customer_id,
       c.full_name as customer_name, c.document_type || ' ' || c.document_number as customer_document,
       c.document_number as customer_document_number,
       u.name as seller_name, pm.code as payment_method_code, pm.name as payment_method_name,
       i.id as invoice_id, i.number as invoice_number,
       (select count(*) from public.sale_items si where si.sale_id = s.id)::integer as item_count
from public.sales s
join public.customers c on c.id = s.customer_id
join public.profiles u on u.id = s.user_id
join public.payment_methods pm on pm.id = s.payment_method_id
left join public.invoices i on i.sale_id = s.id;

create or replace view public.movements_view with (security_invoker = true) as
select m.id, m.type, m.quantity, m.stock_before, m.stock_after, m.reason, m.created_at,
       m.product_id, p.code as product_code, p.name as product_name,
       u.name as user_name, i.id as invoice_id, i.number as invoice_number
from public.inventory_movements m
join public.products p on p.id = m.product_id
left join public.profiles u on u.id = m.user_id
left join public.invoices i on i.sale_id = m.sale_id;

create or replace view public.customers_view with (security_invoker = true) as
select c.*,
       coalesce(st.purchases, 0)::integer as purchases,
       coalesce(st.total_spent, 0) as total_spent,
       st.last_purchase
from public.customers c
left join lateral (
  select count(*) as purchases, sum(s.total) as total_spent, max(s.created_at) as last_purchase
  from public.sales s where s.customer_id = c.id and s.status = 'COMPLETED'
) st on true;

create or replace view public.suppliers_view with (security_invoker = true) as
select s.*, (select count(*) from public.products p where p.supplier_id = s.id)::integer as product_count
from public.suppliers s;

create or replace view public.categories_view with (security_invoker = true) as
select c.*, (select count(*) from public.products p where p.category_id = c.id)::integer as product_count
from public.categories c;

create or replace view public.users_view with (security_invoker = true) as
select u.*, (select count(*) from public.sales s where s.user_id = u.id)::integer as sales_count
from public.profiles u;

-- ───────── Funciones de reportes (security invoker: respetan RLS) ─────────

create or replace function public.stock_summary()
returns table (total bigint, available bigint, low bigint, out_of_stock bigint, inactive bigint)
language sql stable set search_path = public as $$
  select count(*) filter (where active),
         count(*) filter (where active and stock > min_stock),
         count(*) filter (where active and stock > 0 and stock <= min_stock),
         count(*) filter (where active and stock = 0),
         count(*) filter (where not active)
  from public.products
$$;

create or replace function public.sales_summary(p_start timestamptz default null, p_end timestamptz default null)
returns table (sales_count bigint, total numeric, discount numeric, tax numeric, subtotal numeric, units bigint)
language sql stable set search_path = public as $$
  select count(*),
         coalesce(sum(s.total), 0), coalesce(sum(s.discount), 0),
         coalesce(sum(s.tax_amount), 0), coalesce(sum(s.subtotal), 0),
         coalesce((select sum(si.quantity) from public.sale_items si join public.sales s2 on s2.id = si.sale_id
                   where s2.status = 'COMPLETED'
                     and (p_start is null or s2.created_at >= p_start)
                     and (p_end is null or s2.created_at < p_end)), 0)
  from public.sales s
  where s.status = 'COMPLETED'
    and (p_start is null or s.created_at >= p_start)
    and (p_end is null or s.created_at < p_end)
$$;

create or replace function public.sales_by_day(p_start timestamptz, p_end timestamptz)
returns table (key text, total numeric, sales_count bigint)
language sql stable set search_path = public as $$
  select to_char(s.created_at at time zone 'America/Bogota', 'YYYY-MM-DD'), sum(s.total), count(*)
  from public.sales s
  where s.status = 'COMPLETED' and s.created_at >= p_start and s.created_at < p_end
  group by 1 order by 1
$$;

create or replace function public.sales_by_month(p_start timestamptz, p_end timestamptz)
returns table (key text, total numeric, sales_count bigint)
language sql stable set search_path = public as $$
  select to_char(s.created_at at time zone 'America/Bogota', 'YYYY-MM'), sum(s.total), count(*)
  from public.sales s
  where s.status = 'COMPLETED' and s.created_at >= p_start and s.created_at < p_end
  group by 1 order by 1
$$;

create or replace function public.top_products(p_limit integer, p_start timestamptz default null, p_end timestamptz default null)
returns table (product_id integer, code text, name text, units bigint, revenue numeric)
language sql stable set search_path = public as $$
  select p.id, p.code::text, p.name::text, sum(si.quantity), sum(si.line_total)
  from public.sale_items si
  join public.sales s on s.id = si.sale_id
  join public.products p on p.id = si.product_id
  where s.status = 'COMPLETED'
    and (p_start is null or s.created_at >= p_start)
    and (p_end is null or s.created_at < p_end)
  group by p.id, p.code, p.name
  order by 4 desc, 5 desc
  limit p_limit
$$;

create or replace function public.low_stock_products(p_limit integer default null)
returns table (id integer, code text, name text, brand text, category_name text, supplier_name text,
               stock integer, min_stock integer)
language sql stable set search_path = public as $$
  select p.id, p.code::text, p.name::text, p.brand::text, c.name::text, sp.name::text, p.stock, p.min_stock
  from public.products p
  join public.categories c on c.id = p.category_id
  left join public.suppliers sp on sp.id = p.supplier_id
  where p.active and p.stock <= p.min_stock
  order by p.stock, p.name
  limit p_limit
$$;

create or replace function public.sales_by_payment_method(p_start timestamptz, p_end timestamptz)
returns table (code text, name text, sales_count bigint, total numeric)
language sql stable set search_path = public as $$
  select pm.code::text, pm.name::text, count(*), sum(s.total)
  from public.sales s join public.payment_methods pm on pm.id = s.payment_method_id
  where s.status = 'COMPLETED' and s.created_at >= p_start and s.created_at < p_end
  group by pm.code, pm.name
  order by 4 desc
$$;

create or replace function public.product_sales_stats(p_product_id integer)
returns table (units_sold bigint, revenue numeric)
language sql stable set search_path = public as $$
  select coalesce(sum(si.quantity), 0), coalesce(sum(si.line_total), 0)
  from public.sale_items si join public.sales s on s.id = si.sale_id
  where si.product_id = p_product_id and s.status = 'COMPLETED'
$$;

-- ───────── Permisos de ejecución: solo usuarios autenticados ─────────

do $$
declare f text;
begin
  foreach f in array array[
    'register_movement(integer, text, integer, text)',
    'create_sale(integer, integer, text, numeric, numeric, text, jsonb)',
    'void_sale(integer, text)',
    'delete_product(integer)',
    'touch_last_login()',
    'stock_summary()',
    'sales_summary(timestamptz, timestamptz)',
    'sales_by_day(timestamptz, timestamptz)',
    'sales_by_month(timestamptz, timestamptz)',
    'top_products(integer, timestamptz, timestamptz)',
    'low_stock_products(integer)',
    'sales_by_payment_method(timestamptz, timestamptz)',
    'product_sales_stats(integer)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- Las vistas no deben ser accesibles para usuarios anónimos.
revoke all on public.products_view, public.sales_view, public.movements_view, public.customers_view,
              public.suppliers_view, public.categories_view, public.users_view from anon;
