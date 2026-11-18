import "server-only";

import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, type Paginated, paginate } from "./pagination";
import { searchTerm } from "./search";

export type MovementType = "ENTRY" | "EXIT" | "SALE" | "VOID" | "ADJUSTMENT";

export type MovementRow = {
  id: number;
  type: MovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string | null;
  createdAt: string;
  productId: number;
  productCode: string;
  productName: string;
  userName: string | null;
  invoiceId: number | null;
  invoiceNumber: string | null;
};

export const MOVEMENT_TYPES: MovementType[] = ["ENTRY", "EXIT", "SALE", "VOID", "ADJUSTMENT"];

export async function listMovements(f: {
  productId?: number;
  type?: MovementType;
  q?: string;
  start?: Date;
  end?: Date;
  page: number;
  pageSize?: number;
}): Promise<Paginated<MovementRow>> {
  const pageSize = f.pageSize ?? PAGE_SIZE;
  const supabase = await createClient();
  let query = supabase.from("movements_view").select("*", { count: "exact" });
  if (f.productId) query = query.eq("product_id", f.productId);
  if (f.type) query = query.eq("type", f.type);
  const q = searchTerm(f.q);
  if (q) query = query.or(`product_name.ilike.%${q}%,product_code.ilike.%${q}%`);
  if (f.start) query = query.gte("created_at", f.start.toISOString());
  if (f.end) query = query.lt("created_at", f.end.toISOString());

  const from = (f.page - 1) * pageSize;
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw error;

  return paginate(
    (data ?? []).map((m) => ({
      id: m.id,
      type: m.type as MovementType,
      quantity: m.quantity,
      stockBefore: m.stock_before,
      stockAfter: m.stock_after,
      reason: m.reason,
      createdAt: m.created_at,
      productId: m.product_id,
      productCode: m.product_code,
      productName: m.product_name,
      userName: m.user_name,
      invoiceId: m.invoice_id,
      invoiceNumber: m.invoice_number,
    })),
    count ?? 0,
    f.page,
    pageSize,
  );
}

export async function getProductOptionsForMovements() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, code, name, stock")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []) as { id: number; code: string; name: string; stock: number }[];
}
