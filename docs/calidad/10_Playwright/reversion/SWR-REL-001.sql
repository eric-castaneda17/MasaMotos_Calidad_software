-- Bloques revisables que scripts/qa-reversion.mjs ejecutará con parámetros enlazados.
-- El controlador ejecuta únicamente los bloques del caso. Este archivo no es un lote de psql.

-- @sql beginRead
begin isolation level repeatable read read only;

-- @sql beginWrite
begin read write;

-- @sql limits
set local lock_timeout = '750ms';
set local statement_timeout = '5s';
set local idle_in_transaction_session_timeout = '5s';
set local time zone 'UTC';

-- @sql structure
select 'table' as kind, c.relname as name, c.relrowsecurity::text || ':' ||
       coalesce(c.relacl::text, '') as definition
from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'v')
union all
select 'policy', tablename || ':' || policyname, row(roles, cmd, qual, with_check)::text
from pg_catalog.pg_policies where schemaname in ('public', 'storage')
union all
select 'function', p.proname || ':' || pg_get_function_identity_arguments(p.oid),
       pg_get_functiondef(p.oid) || coalesce(p.proacl::text, '')
from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f'
union all
select 'trigger', c.relname || ':' || t.tgname, pg_get_triggerdef(t.oid)
from pg_catalog.pg_trigger t join pg_catalog.pg_class c on c.oid = t.tgrelid
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'storage', 'auth') and not t.tgisinternal
order by kind, name;

-- @sql fixture
select p.id as product_id, c.id as customer_id, pm.id as payment_id, u.id as seller_id,
       i.id as collision_id, i.number as collision_number,
       right(i.number, 6)::integer as collision_sequence,
       pg_get_functiondef(f.oid) as sale_function
from public.products p
join public.customers c on c.document_type = 'CC' and c.document_number = $3
join public.payment_methods pm on pm.code = 'CASH' and pm.active
join public.sales prior on prior.notes = $4 and prior.status = 'COMPLETED'
join public.customers prior_customer on prior_customer.id = prior.customer_id
join public.profiles u on u.id = prior.user_id and u.role = 'SELLER' and u.active and lower(u.email) = $5
join public.invoices i on i.sale_id = prior.id
join public.settings cfg on cfg.id = 1
join pg_catalog.pg_proc f on f.oid = 'public.create_sale(integer,integer,text,numeric,numeric,text,jsonb)'::regprocedure
where p.code = $1 and p.active and p.stock = 3 and p.sale_price = 25000
  and c.full_name = $2 and prior_customer.document_number = $6
  and exists (
    select 1 from public.sale_items item
    where item.sale_id = prior.id and item.product_code = $7
  )
  and left(i.number, -6) = cfg.invoice_prefix || '-'
  and right(i.number, 6) ~ '^[0-9]{6}$'
  and case when right(i.number, 6) ~ '^[0-9]{6}$'
           then right(i.number, 6)::integer between 1 and cfg.next_invoice_number - 1
           else false end
  and exists (
    select 1 from pg_catalog.pg_constraint k
    where k.conrelid = 'public.invoices'::regclass and k.conname = 'invoices_number_key'
      and k.contype = 'u' and k.convalidated and not k.condeferrable
      and pg_get_constraintdef(k.oid) = 'UNIQUE (number)'
  );

-- @sql state
-- $1 repuesto, $2 cliente, $3 observación exclusiva, $4 factura de referencia.
with related_sales as (
  select s.id
  from public.sales s
  where s.notes = $3 or s.customer_id = $2
     or exists (select 1 from public.sale_items l where l.sale_id = s.id and l.product_id = $1)
     or exists (select 1 from public.inventory_movements m where m.sale_id = s.id and m.product_id = $1)
)
select jsonb_build_object(
  'product', (select jsonb_build_object('code', p.code, 'stock', p.stock, 'active', p.active,
                      'updatedAt', p.updated_at) from public.products p where p.id = $1),
  'settings', (select jsonb_build_object('prefix', s.invoice_prefix, 'next', s.next_invoice_number)
               from public.settings s where s.id = 1),
  'referenceInvoice', (select jsonb_build_object('id', i.id, 'number', i.number, 'saleId', i.sale_id)
                       from public.invoices i where i.id = $4),
  'sales', coalesce((select jsonb_agg(s.id order by s.id) from related_sales s), '[]'::jsonb),
  'items', coalesce((select jsonb_agg(l.id order by l.id) from public.sale_items l
                    where l.product_id = $1 or l.sale_id in (select id from related_sales)), '[]'::jsonb),
  'movements', coalesce((select jsonb_agg(jsonb_build_object(
                          'id', m.id, 'type', m.type, 'saleId', m.sale_id, 'quantity', m.quantity,
                          'stockBefore', m.stock_before, 'stockAfter', m.stock_after) order by m.id)
                        from public.inventory_movements m
                        where m.product_id = $1 or m.sale_id in (select id from related_sales)), '[]'::jsonb),
  'invoices', coalesce((select jsonb_agg(i.id order by i.id) from public.invoices i
                       where i.sale_id in (select id from related_sales)), '[]'::jsonb)
) as state;

-- @sql lockProduct
select id from public.products where id = $1 for update;

-- @sql lockCounter
select id from public.settings where id = 1 for update;

-- @sql prepareCounter
update public.settings
set next_invoice_number = $1
where id = 1 and next_invoice_number = $2 and invoice_prefix = $3
returning next_invoice_number;

-- @sql savepoint
savepoint before_sale;

-- @sql saleRole
set local role authenticated;

-- @sql saleIdentity
select set_config('request.jwt.claims', jsonb_build_object('sub', $1::uuid, 'role', 'authenticated')::text, true),
       set_config('request.jwt.claim.sub', $1::uuid::text, true);

-- @sql checkIdentity
select current_user = 'authenticated' and auth.uid() = $1::uuid
       and public.current_app_role() = 'SELLER' and public.is_staff() as authorized;

-- @sql failSale
select public.create_sale(
  $1::integer, $2::integer, 'PERCENT', 0::numeric, null::numeric, $3::text,
  jsonb_build_array(jsonb_build_object('productId', $4::integer, 'quantity', 1))
);

-- @sql undoSale
rollback to savepoint before_sale;

-- @sql rollback
rollback;
