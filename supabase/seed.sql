-- ═══════════════════════════════════════════════════════════════════
-- MASA MOTOS · Datos de prueba
-- Requisito: existir en Supabase Auth los usuarios
--   admin@masamotos.com  y  vendedor@masamotos.com
-- (los crea `npm run db:setup`, o manualmente en Authentication → Users).
-- Solo siembra si la tabla de productos está vacía.
-- ═══════════════════════════════════════════════════════════════════
do $$
declare
  v_admin  uuid;
  v_seller uuid;
  v_cat    integer[];
  v_sup    integer[];
  v_cust   integer[];
  v_meth   integer[];
  v_prod   record;
  v_pids   integer[] := '{}';
  v_targets integer[] := '{}';
  v_i      integer;
  v_l      integer;
  v_lines  integer;
  v_pid    integer;
  v_idx    integer;
  v_qty    integer;
  v_stock  integer;
  v_target integer;
  v_when   timestamptz;
  v_sale   integer;
  v_sub    numeric;
  v_disc   numeric;
  v_tax    numeric;
  v_total  numeric;
  v_method integer;
  v_customer integer;
  v_user   uuid;
  v_inv    integer := 1;
  v_items  jsonb;
  it       jsonb;
begin
  if exists (select 1 from public.products) then
    raise notice 'La base ya tiene productos: no se siembran datos de prueba.';
    return;
  end if;

  select id into v_admin  from public.profiles where email = 'admin@masamotos.com';
  select id into v_seller from public.profiles where email = 'vendedor@masamotos.com';
  if v_admin is null then
    raise exception 'Cree primero el usuario admin@masamotos.com en Supabase Auth';
  end if;
  update public.profiles set role = 'ADMIN', active = true, name = 'Administrador MASA' where id = v_admin;
  if v_seller is not null then
    update public.profiles set role = 'SELLER', active = true, name = 'Camila Vendedora' where id = v_seller;
  else
    v_seller := v_admin;
  end if;

  perform setseed(0.20261116);
  perform set_config('mm.stock_change', 'on', true);

  update public.settings set
    company_name = 'MASA MOTOS', company_tax_id = '1075000000-1',
    company_address = 'Calle 7 # 6-45, Neiva, Huila', company_phone = '310 000 0000',
    company_email = 'ventas@masamotos.com', tax_rate = 19, tax_enabled = true,
    invoice_prefix = 'MM', next_invoice_number = 1,
    invoice_footer = 'Garantía de 30 días en repuestos eléctricos presentando esta factura. No se aceptan devoluciones de productos instalados.'
  where id = 1;

  insert into public.payment_methods (code, name) values
    ('CASH', 'Efectivo'), ('TRANSFER', 'Transferencia'), ('CARD', 'Tarjeta'), ('CUSTOM_NEQUI', 'Nequi')
  on conflict (code) do nothing;
  select array_agg(id order by id) into v_meth from public.payment_methods;

  with ins as (
    insert into public.categories (name, description) values
      ('Frenos', 'Pastillas, bandas, discos y líquido de frenos'),
      ('Motor', 'Pistones, anillos, empaques y componentes internos'),
      ('Transmisión', 'Kits de arrastre, cadenas, piñones y clutch'),
      ('Sistema eléctrico', 'Baterías, bujías, bombillos y reguladores'),
      ('Lubricantes', 'Aceites de motor, grasas y aditivos'),
      ('Llantas y neumáticos', 'Llantas, neumáticos y válvulas'),
      ('Suspensión', 'Amortiguadores, retenes y barras'),
      ('Accesorios', 'Cascos, guantes, espejos e impermeables'),
      ('Filtros', 'Filtros de aire, aceite y combustible')
    returning id)
  select array_agg(id order by id) into v_cat from ins;

  with ins as (
    insert into public.suppliers (name, tax_id, contact_name, phone, email, city, address) values
      ('Distrimotos del Huila S.A.S.', '900456123-1', 'Laura Méndez', '608 871 2233', 'ventas@distrimotoshuila.co', 'Neiva', 'Cra 5 # 12-40'),
      ('Importadora Andina de Repuestos Ltda.', '830112987-4', 'Carlos Rojas', '601 744 9080', 'pedidos@andinarepuestos.co', 'Bogotá', 'Av. Américas # 68-30'),
      ('Lubricantes y Filtros del Sur S.A.S.', '901234765-2', 'Diana Torres', '602 556 1199', 'comercial@lubrisur.co', 'Cali', 'Calle 70 # 1-25'),
      ('Moto Parts Colombia S.A.S.', '900987321-8', 'Andrés Gil', '604 448 3020', 'info@motopartscol.co', 'Medellín', 'Cra 52 # 30-11')
    returning id)
  select array_agg(id order by id) into v_sup from ins;

  -- Productos: stock inicial = objetivo + extra (las ventas históricas consumen el extra).
  for v_prod in
    select * from (values
      ('FRN-PAS-BWS', 'Pastillas de freno delanteras', 1, 'Yamaha', 'BWS 125, Crypton 115', 18000, 32000, 40, 8, 1),
      ('FRN-BND-AKT', 'Bandas de freno traseras', 1, 'AKT', 'AK 125, NKD 125', 14000, 24000, 30, 6, 4),
      ('FRN-DSC-PUL', 'Disco de freno delantero', 1, 'Bajaj', 'Pulsar 180, NS 200', 85000, 135000, 8, 3, 2),
      ('FRN-LIQ-DOT4', 'Líquido de frenos DOT 4 (250 ml)', 1, 'Motul', 'Universal', 12000, 21000, 25, 6, 3),
      ('MOT-PIS-CB110', 'Kit pistón y anillos STD', 2, 'Honda', 'CB 110, Wave 110', 62000, 98000, 10, 3, 2),
      ('MOT-EMP-BOX', 'Juego de empaques completo', 2, 'Bajaj', 'Boxer CT 100', 28000, 46000, 4, 4, 2),
      ('MOT-VAL-FZ', 'Válvulas admisión/escape', 2, 'Yamaha', 'FZ 2.0, FZ 150', 38000, 62000, 12, 3, 4),
      ('TRN-KIT-NKD', 'Kit de arrastre 428H', 3, 'AKT', 'NKD 125, Special 110', 68000, 105000, 15, 4, 4),
      ('TRN-CAD-520', 'Cadena reforzada 520 x 120', 3, 'DID', 'Pulsar 200, Duke 200', 95000, 148000, 6, 2, 4),
      ('TRN-CLU-DIS', 'Discos de clutch (juego)', 3, 'Suzuki', 'GN 125, GS 125', 45000, 72000, 0, 3, 2),
      ('ELE-BAT-12V', 'Batería sellada 12V 7Ah', 4, 'Yuasa', 'Universal 125-200 cc', 98000, 155000, 9, 3, 1),
      ('ELE-BUJ-CR7', 'Bujía iridio CR7HIX', 4, 'NGK', 'Pulsar, FZ, CB 190', 22000, 39000, 50, 10, 1),
      ('ELE-BOM-H4', 'Bombillo halógeno H4 12V', 4, 'Philips', 'Universal', 9000, 17000, 2, 5, 3),
      ('ELE-REG-AK', 'Regulador rectificador', 4, 'AKT', 'AK 125, TTR 125', 32000, 55000, 7, 2, 4),
      ('LUB-ACE-20W50', 'Aceite 4T 20W-50 mineral (1 L)', 5, 'Motul', 'Motores 4 tiempos', 19000, 29000, 80, 20, 3),
      ('LUB-ACE-10W40', 'Aceite 4T 10W-40 semisintético (1 L)', 5, 'Mobil', 'Motores 4 tiempos', 26000, 39000, 60, 15, 3),
      ('LUB-GRA-CAD', 'Lubricante de cadena en aerosol', 5, 'Motul', 'Universal', 21000, 34000, 18, 5, 3),
      ('LLA-DEL-90/90', 'Llanta delantera 90/90-18', 6, 'Michelin', 'Pulsar 180, Boxer', 135000, 198000, 6, 2, 2),
      ('LLA-TRA-110', 'Llanta trasera 110/90-17', 6, 'Pirelli', 'FZ 2.0, NS 160', 158000, 232000, 5, 2, 2),
      ('LLA-NEU-17', 'Neumático rin 17', 6, 'IRC', 'Universal rin 17', 18000, 29000, 0, 6, 2),
      ('SUS-AMO-TRA', 'Amortiguadores traseros (par)', 7, 'Honda', 'CB 110, Eco Deluxe', 120000, 185000, 4, 2, 4),
      ('SUS-RET-TEL', 'Retenes de telescopio', 7, 'Yamaha', 'XTZ 125, YBR 125', 16000, 28000, 20, 5, 4),
      ('ACC-CAS-INT', 'Casco integral certificado', 8, 'Shaft', 'Talla M / L', 145000, 229000, 7, 2, 1),
      ('ACC-GUA-PRO', 'Guantes de protección', 8, 'Alpinestars', 'Talla M / L', 42000, 69000, 14, 4, 1),
      ('ACC-ESP-UNI', 'Espejos retrovisores (par)', 8, 'Genérico', 'Universal rosca 10 mm', 15000, 26000, 3, 4, 4),
      ('ACC-IMP-2P', 'Impermeable dos piezas', 8, 'Pantera', 'Talla única', 38000, 59000, 16, 4, 1),
      ('FIL-ACE-HF', 'Filtro de aceite HF303', 9, 'Hiflofiltro', 'Pulsar, Discover', 9500, 17000, 45, 10, 3),
      ('FIL-AIR-FZ', 'Filtro de aire', 9, 'Yamaha', 'FZ 2.0, Fazer 150', 22000, 38000, 11, 3, 3),
      ('FIL-GAS-UNI', 'Filtro de gasolina', 9, 'Genérico', 'Universal', 4000, 8500, 35, 10, 3)
    ) as t(code, name, cat, brand, model, cost, price, target, min_stock, sup)
  loop
    insert into public.products (code, name, description, category_id, brand, compatible_model,
                                 purchase_price, sale_price, stock, min_stock, supplier_id)
    values (v_prod.code, v_prod.name, v_prod.name || ' marca ' || v_prod.brand || '. Compatible con ' || v_prod.model || '.',
            v_cat[v_prod.cat], v_prod.brand, v_prod.model, v_prod.cost, v_prod.price,
            v_prod.target + 4 + floor(random() * 11)::integer, v_prod.min_stock, v_sup[v_prod.sup])
    returning id into v_pid;
    v_pids := v_pids || v_pid;
    v_targets := v_targets || v_prod.target;
  end loop;
  -- El trigger registró el ajuste de stock inicial; se fecha 80 días atrás.
  update public.inventory_movements set created_at = now() - interval '80 days', user_id = v_admin;

  with ins as (
    insert into public.customers (full_name, document_type, document_number, phone, email, address) values
      ('Consumidor final', 'CC', '222222222222', null, null, null),
      ('Juan Carlos Perdomo', 'CC', '1075234567', '310 555 1234', 'jc.perdomo@correo.com', 'Calle 8 # 5-20, Neiva'),
      ('María Fernanda Silva', 'CC', '1080456321', '315 222 8899', 'mafe.silva@correo.com', 'Cra 16 # 45-10, Neiva'),
      ('Taller El Pistón S.A.S.', 'NIT', '901555222-3', '608 875 4411', 'tallerelpiston@correo.com', 'Av. La Toma # 20-15, Neiva'),
      ('Andrés Felipe Cuéllar', 'CC', '7723456', '300 444 5566', null, 'Barrio Las Granjas, Neiva'),
      ('Luisa Valentina Ortiz', 'TI', '1077889900', '321 111 2233', 'luisa.ortiz@correo.com', null),
      ('Mototaxis Garzón Ltda.', 'NIT', '900333444-5', '608 833 2020', 'mototaxisgarzon@correo.com', 'Garzón, Huila'),
      ('Pedro Ramírez Lozano', 'CE', 'E-456789', '312 987 6543', 'pramirez@correo.com', 'Pitalito, Huila')
    returning id)
  select array_agg(id order by id) into v_cust from ins;

  -- Ventas históricas (últimos 75 días) con detalle, movimientos y factura.
  for v_i in 1..85 loop
    v_when := date_trunc('day', now() - make_interval(days => floor(((85 - v_i)::numeric / 85) * 75)::integer))
              + make_interval(hours => 13 + floor(random() * 10)::integer, mins => floor(random() * 60)::integer);
    if v_when > now() then v_when := now() - interval '30 minutes'; end if;

    v_items := '[]'::jsonb;
    v_lines := 1 + floor(random() * 3)::integer;
    for v_l in 1..v_lines loop
      v_idx := 1 + floor(random() * array_length(v_pids, 1))::integer;
      v_pid := v_pids[v_idx];
      select stock into v_stock from public.products where id = v_pid;
      v_stock := v_stock - coalesce((select sum((e ->> 'q')::integer) from jsonb_array_elements(v_items) e
                                     where (e ->> 'p')::integer = v_pid), 0);
      continue when v_stock - v_targets[v_idx] <= 0;
      v_qty := least(1 + floor(random() * 2)::integer, v_stock - v_targets[v_idx]);
      v_items := v_items || jsonb_build_object('p', v_pid, 'q', v_qty);
    end loop;
    continue when jsonb_array_length(v_items) = 0;

    select coalesce(sum(p.sale_price * (e ->> 'q')::integer), 0) into v_sub
    from jsonb_array_elements(v_items) e join public.products p on p.id = (e ->> 'p')::integer;
    v_disc   := case when random() < 0.2 then round(v_sub * 0.05) else 0 end;
    v_tax    := round((v_sub - v_disc) * 0.19);
    v_total  := v_sub - v_disc + v_tax;
    v_method := case when random() < 0.55 then v_meth[1] else v_meth[2 + floor(random() * 3)::integer] end;
    v_customer := case when random() < 0.4 then v_cust[1] else v_cust[2 + floor(random() * 7)::integer] end;
    v_user   := case when random() < 0.6 then v_seller else v_admin end;

    insert into public.sales (customer_id, user_id, payment_method_id, subtotal, discount, tax_rate, tax_amount,
                              total, amount_received, created_at)
    values (v_customer, v_user, v_method, v_sub, v_disc, 19, v_tax, v_total,
            case when v_method = v_meth[1] then ceil(v_total / 10000) * 10000 end, v_when)
    returning id into v_sale;

    for it in select * from jsonb_array_elements(v_items) loop
      select stock into v_stock from public.products where id = (it ->> 'p')::integer;
      insert into public.sale_items (sale_id, product_id, product_code, product_name, quantity, unit_price, line_total)
      select v_sale, p.id, p.code, p.name, (it ->> 'q')::integer, p.sale_price, p.sale_price * (it ->> 'q')::integer
      from public.products p where p.id = (it ->> 'p')::integer;
      update public.products set stock = v_stock - (it ->> 'q')::integer where id = (it ->> 'p')::integer;
      insert into public.inventory_movements (product_id, type, quantity, stock_before, stock_after, user_id, sale_id, created_at)
      values ((it ->> 'p')::integer, 'SALE', (it ->> 'q')::integer, v_stock, v_stock - (it ->> 'q')::integer, v_user, v_sale, v_when);
    end loop;

    insert into public.invoices (number, sale_id, issued_at) values ('MM-' || lpad(v_inv::text, 6, '0'), v_sale, v_when);
    v_inv := v_inv + 1;
  end loop;

  -- Ajuste final al stock objetivo con entrada/salida registrada.
  for v_idx in 1..array_length(v_pids, 1) loop
    select stock into v_stock from public.products where id = v_pids[v_idx];
    v_target := v_targets[v_idx];
    if v_stock <> v_target then
      insert into public.inventory_movements (product_id, type, quantity, stock_before, stock_after, reason, user_id, created_at)
      values (v_pids[v_idx], case when v_stock < v_target then 'ENTRY' else 'EXIT' end, abs(v_target - v_stock), v_stock, v_target,
              case when v_stock < v_target then 'Compra a proveedor' else 'Conteo físico: unidades dañadas' end,
              v_admin, now() - interval '2 days');
      update public.products set stock = v_target where id = v_pids[v_idx];
    end if;
  end loop;

  update public.settings set next_invoice_number = v_inv where id = 1;
  raise notice 'Sembrado completo: % productos, % ventas.', array_length(v_pids, 1), v_inv - 1;
end $$;
