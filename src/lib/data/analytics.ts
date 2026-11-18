import "server-only";

import { addDays, localDayStart, monthRange, todayRange, toLocalDateString } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { MovementType } from "./inventory";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type SeriesPoint = { key: string; total: number; count: number };

type SeriesRow = { key: string; total: number; sales_count: number };

async function rpcRows<T>(supabase: Supabase, fn: string, args?: Record<string, unknown>): Promise<T[]> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return (data ?? []) as T[];
}

export async function salesByDay(start: Date, end: Date, client?: Supabase): Promise<SeriesPoint[]> {
  const supabase = client ?? (await createClient());
  const rows = await rpcRows<SeriesRow>(supabase, "sales_by_day", {
    p_start: start.toISOString(),
    p_end: end.toISOString(),
  });
  const map = new Map(rows.map((r) => [r.key, r]));
  // Rellena los días sin ventas con cero para un gráfico continuo.
  const out: SeriesPoint[] = [];
  for (let d = start; d < end; d = addDays(d, 1)) {
    const key = toLocalDateString(d);
    const r = map.get(key);
    out.push({ key, total: r ? Number(r.total) : 0, count: r ? Number(r.sales_count) : 0 });
  }
  return out;
}

export async function salesByMonth(start: Date, end: Date, client?: Supabase): Promise<SeriesPoint[]> {
  const supabase = client ?? (await createClient());
  const rows = await rpcRows<SeriesRow>(supabase, "sales_by_month", {
    p_start: start.toISOString(),
    p_end: end.toISOString(),
  });
  const map = new Map(rows.map((r) => [r.key, r]));
  const out: SeriesPoint[] = [];
  const first = toLocalDateString(start).slice(0, 7);
  const last = toLocalDateString(addDays(end, -1)).slice(0, 7);
  let [y, m] = first.split("-").map(Number);
  for (let guard = 0; guard < 240; guard++) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const r = map.get(key);
    out.push({ key, total: r ? Number(r.total) : 0, count: r ? Number(r.sales_count) : 0 });
    if (key === last) break;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

export type TopProduct = { productId: number; code: string; name: string; units: number; revenue: number };

export async function topProducts(limit: number, start?: Date, end?: Date, client?: Supabase): Promise<TopProduct[]> {
  const supabase = client ?? (await createClient());
  const rows = await rpcRows<{ product_id: number; code: string; name: string; units: number; revenue: number }>(
    supabase,
    "top_products",
    { p_limit: limit, p_start: start?.toISOString() ?? null, p_end: end?.toISOString() ?? null },
  );
  return rows.map((r) => ({
    productId: r.product_id,
    code: r.code,
    name: r.name,
    units: Number(r.units),
    revenue: Number(r.revenue),
  }));
}

export type LowStockItem = {
  id: number;
  code: string;
  name: string;
  brand: string;
  categoryName: string;
  supplierName: string | null;
  stock: number;
  minStock: number;
};

export async function lowStockProducts(limit?: number, client?: Supabase): Promise<LowStockItem[]> {
  const supabase = client ?? (await createClient());
  const rows = await rpcRows<{
    id: number;
    code: string;
    name: string;
    brand: string;
    category_name: string;
    supplier_name: string | null;
    stock: number;
    min_stock: number;
  }>(supabase, "low_stock_products", { p_limit: limit ?? null });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    brand: r.brand,
    categoryName: r.category_name,
    supplierName: r.supplier_name,
    stock: r.stock,
    minStock: r.min_stock,
  }));
}

async function salesSummary(supabase: Supabase, start?: Date, end?: Date) {
  const [r] = await rpcRows<{
    sales_count: number;
    total: number;
    discount: number;
    tax: number;
    subtotal: number;
    units: number;
  }>(supabase, "sales_summary", { p_start: start?.toISOString() ?? null, p_end: end?.toISOString() ?? null });
  return {
    count: Number(r?.sales_count ?? 0),
    total: Number(r?.total ?? 0),
    discount: Number(r?.discount ?? 0),
    tax: Number(r?.tax ?? 0),
    subtotal: Number(r?.subtotal ?? 0),
    units: Number(r?.units ?? 0),
  };
}

export async function getStockSummary(client?: Supabase) {
  const supabase = client ?? (await createClient());
  const [s] = await rpcRows<{ total: number; available: number; low: number; out_of_stock: number; inactive: number }>(
    supabase,
    "stock_summary",
  );
  return {
    total: Number(s?.total ?? 0),
    available: Number(s?.available ?? 0),
    low: Number(s?.low ?? 0),
    out: Number(s?.out_of_stock ?? 0),
    inactive: Number(s?.inactive ?? 0),
  };
}

export async function getDashboardData() {
  const supabase = await createClient();
  const today = todayRange();
  const month = monthRange();
  const last30Start = addDays(today.start, -29);
  const last12Start = localDayStart(
    (() => {
      let [y, m] = toLocalDateString().split("-").map(Number);
      m -= 11;
      if (m <= 0) {
        m += 12;
        y--;
      }
      return `${y}-${String(m).padStart(2, "0")}-01`;
    })(),
  );

  const [stock, todaySummary, monthSummary, allSummary, invoices, daily, monthly, top, low, movements] =
    await Promise.all([
      getStockSummary(supabase),
      salesSummary(supabase, today.start, today.end),
      salesSummary(supabase, month.start, month.end),
      salesSummary(supabase),
      supabase.from("invoices").select("id", { count: "exact", head: true }),
      salesByDay(last30Start, today.end, supabase),
      salesByMonth(last12Start, month.end, supabase),
      topProducts(5, undefined, undefined, supabase),
      lowStockProducts(6, supabase),
      supabase
        .from("movements_view")
        .select("id, type, quantity, stock_after, product_id, product_name, product_code, user_name, created_at")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(8),
    ]);

  return {
    products: stock,
    today: todaySummary,
    month: monthSummary,
    allTime: allSummary,
    invoiceCount: invoices.count ?? 0,
    daily,
    monthly,
    topProducts: top,
    lowStock: low,
    recentMovements: (movements.data ?? []).map((m) => ({
      id: m.id as number,
      type: m.type as MovementType,
      quantity: m.quantity as number,
      stockAfter: m.stock_after as number,
      productId: m.product_id as number,
      productName: m.product_name as string,
      productCode: m.product_code as string,
      userName: (m.user_name as string | null) ?? null,
      createdAt: m.created_at as string,
    })),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getReportData(start: Date, end: Date) {
  const supabase = await createClient();
  const [summary, daily, monthly, top, low, byMethod] = await Promise.all([
    salesSummary(supabase, start, end),
    salesByDay(start, end, supabase),
    salesByMonth(start, end, supabase),
    topProducts(10, start, end, supabase),
    lowStockProducts(undefined, supabase),
    rpcRows<{ code: string; name: string; sales_count: number; total: number }>(supabase, "sales_by_payment_method", {
      p_start: start.toISOString(),
      p_end: end.toISOString(),
    }),
  ]);
  return {
    summary: { ...summary, averageTicket: summary.count ? summary.total / summary.count : 0 },
    daily,
    monthly,
    topProducts: top,
    lowStock: low,
    byPaymentMethod: byMethod.map((r) => ({
      code: r.code,
      name: r.name,
      count: Number(r.sales_count),
      total: Number(r.total),
    })),
  };
}

export type ReportData = Awaited<ReturnType<typeof getReportData>>;
