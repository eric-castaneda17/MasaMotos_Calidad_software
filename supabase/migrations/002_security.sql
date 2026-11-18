-- ═══════════════════════════════════════════════════════════════════
-- MASA MOTOS · 002 · Seguridad: perfiles, funciones de rol y RLS
-- ═══════════════════════════════════════════════════════════════════

-- ───────── Funciones auxiliares de autorización ─────────
-- SECURITY DEFINER para poder leer profiles sin recursión de RLS.

create or replace function public.current_app_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active and role = 'ADMIN')
$$;

revoke all on function public.current_app_role() from public, anon;
revoke all on function public.is_staff()         from public, anon;
revoke all on function public.is_admin()         from public, anon;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_staff()         to authenticated;
grant execute on function public.is_admin()         to authenticated;

-- ───────── Perfil automático al crear un usuario en Supabase Auth ─────────
-- Rol y estado se toman de app_metadata (solo modificable con la service_role
-- key, es decir, desde el servidor). Un registro público queda INACTIVO y sin acceso.

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, role, active)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    lower(new.email),
    case when new.raw_app_meta_data ->> 'role' = 'ADMIN' then 'ADMIN' else 'SELLER' end,
    coalesce((new.raw_app_meta_data ->> 'active')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Un usuario no administrador solo puede cambiar su propio nombre.
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role
       or new.active is distinct from old.active
       or new.email is distinct from old.email
       or new.id <> auth.uid() then
      raise exception 'forbidden' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_profiles_guard on public.profiles;
create trigger trg_profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ───────── Row Level Security ─────────

alter table public.roles               enable row level security;
alter table public.profiles            enable row level security;
alter table public.categories          enable row level security;
alter table public.suppliers           enable row level security;
alter table public.products            enable row level security;
alter table public.customers           enable row level security;
alter table public.payment_methods     enable row level security;
alter table public.sales               enable row level security;
alter table public.sale_items          enable row level security;
alter table public.invoices            enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.settings            enable row level security;

-- Elimina políticas previas para que el script sea re-ejecutable.
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Lectura: cualquier usuario interno activo (administrador o vendedor).
create policy roles_read      on public.roles               for select to authenticated using (public.is_staff());
create policy profiles_read   on public.profiles            for select to authenticated using (public.is_staff() or id = auth.uid());
create policy categories_read on public.categories          for select to authenticated using (public.is_staff());
create policy suppliers_read  on public.suppliers           for select to authenticated using (public.is_staff());
create policy products_read   on public.products            for select to authenticated using (public.is_staff());
create policy customers_read  on public.customers           for select to authenticated using (public.is_staff());
create policy methods_read    on public.payment_methods     for select to authenticated using (public.is_staff());
create policy sales_read      on public.sales               for select to authenticated using (public.is_staff());
create policy items_read      on public.sale_items          for select to authenticated using (public.is_staff());
create policy invoices_read   on public.invoices            for select to authenticated using (public.is_staff());
create policy movements_read  on public.inventory_movements for select to authenticated using (public.is_staff());
create policy settings_read   on public.settings            for select to authenticated using (public.is_staff());

-- Perfiles: el administrador gestiona; cada usuario puede editar su nombre (ver trigger).
create policy profiles_update on public.profiles for update to authenticated
  using (public.is_admin() or id = auth.uid()) with check (public.is_admin() or id = auth.uid());

-- Catálogo, proveedores, métodos de pago y configuración: solo administrador.
create policy categories_write on public.categories      for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy suppliers_write  on public.suppliers       for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy products_write   on public.products        for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy methods_write    on public.payment_methods for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy settings_write   on public.settings        for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Clientes: administrador y vendedor.
create policy customers_write on public.customers for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Ventas, detalles, facturas y movimientos: NO hay políticas de escritura directa.
-- Solo se modifican mediante las funciones transaccionales de 003_functions.sql,
-- que validan el rol y las existencias.

-- ───────── Supabase Storage: imágenes de productos (bucket privado) ─────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists mm_product_images_read   on storage.objects;
drop policy if exists mm_product_images_insert on storage.objects;
drop policy if exists mm_product_images_update on storage.objects;
drop policy if exists mm_product_images_delete on storage.objects;

create policy mm_product_images_read on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and public.is_staff());
create policy mm_product_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy mm_product_images_update on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
create policy mm_product_images_delete on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
