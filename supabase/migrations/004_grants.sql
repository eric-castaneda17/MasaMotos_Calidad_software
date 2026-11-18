-- ═══════════════════════════════════════════════════════════════════
-- MASA MOTOS · 004 · Privilegios de la API de datos (Data API)
-- Los proyectos nuevos de Supabase NO conceden automáticamente permisos
-- sobre las tablas nuevas. Se otorgan aquí de forma explícita y mínima;
-- encima de estos permisos, las políticas RLS (002) deciden qué filas ve
-- y modifica cada usuario.
-- ═══════════════════════════════════════════════════════════════════

grant usage on schema public to authenticated, service_role;

-- Visitantes sin sesión: ningún acceso a datos.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

-- Usuarios autenticados: lectura de tablas y vistas (filtrada por RLS).
revoke all on all tables in schema public from authenticated;
grant select on all tables in schema public to authenticated;

-- Escritura solo donde existen políticas RLS de escritura.
grant insert, update, delete on public.categories, public.suppliers, public.products,
                                public.payment_methods, public.customers to authenticated;
grant update on public.profiles, public.settings to authenticated;
-- sales, sale_items, invoices, inventory_movements: sin escritura directa;
-- solo mediante create_sale / void_sale / register_movement / delete_product.

grant usage, select on all sequences in schema public to authenticated;

-- Rol de servicio (solo servidor): acceso completo.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
