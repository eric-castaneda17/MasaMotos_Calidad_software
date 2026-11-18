import "server-only";

import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, type Paginated, paginate } from "./pagination";
import { stockStatus } from "./products";
import { searchTerm } from "./search";

export type SupplierRow = {
  id: number;
  name: string;
  taxId: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  active: boolean;
  productCount: number;
};

type ViewRow = {
  id: number;
  name: string;
  tax_id: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  active: boolean;
  product_count?: number;
};

const toRow = (s: ViewRow): SupplierRow => ({
  id: s.id,
  name: s.name,
  taxId: s.tax_id,
  contactName: s.contact_name,
  phone: s.phone,
  email: s.email,
  address: s.address,
  city: s.city,
  active: s.active,
  productCount: s.product_count ?? 0,
});

export async function listSuppliers(f: { q?: string; page: number }): Promise<Paginated<SupplierRow>> {
  const supabase = await createClient();
  let query = supabase.from("suppliers_view").select("*", { count: "exact" });
  const q = searchTerm(f.q);
  if (q) query = query.or(`name.ilike.%${q}%,tax_id.ilike.%${q}%,contact_name.ilike.%${q}%,city.ilike.%${q}%`);
  const from = (f.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.order("name").range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return paginate(((data ?? []) as ViewRow[]).map(toRow), count ?? 0, f.page);
}

export async function getSupplier(id: number) {
  const supabase = await createClient();
  const [{ data: s, error }, { data: products }] = await Promise.all([
    supabase.from("suppliers").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("products")
      .select("id, code, name, brand, stock, min_stock, purchase_price, active")
      .eq("supplier_id", id)
      .order("name"),
  ]);
  if (error) throw error;
  if (!s) return null;
  return {
    ...toRow(s as ViewRow),
    products: (products ?? []).map((p) => ({
      id: p.id as number,
      code: p.code as string,
      name: p.name as string,
      brand: p.brand as string,
      stock: p.stock as number,
      minStock: p.min_stock as number,
      purchasePrice: Number(p.purchase_price),
      active: p.active as boolean,
      status: stockStatus(p.stock, p.min_stock),
    })),
  };
}

export type SupplierDetail = NonNullable<Awaited<ReturnType<typeof getSupplier>>>;
