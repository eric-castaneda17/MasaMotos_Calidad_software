import "server-only";

import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, type Paginated, paginate } from "./pagination";
import { searchTerm } from "./search";

export type StockStatus = "available" | "low" | "out";

export function stockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return "out";
  if (stock <= minStock) return "low";
  return "available";
}

export type ProductRow = {
  id: number;
  code: string;
  name: string;
  brand: string;
  compatibleModel: string | null;
  categoryName: string;
  supplierName: string | null;
  salePrice: number;
  purchasePrice: number;
  stock: number;
  minStock: number;
  active: boolean;
  hasImage: boolean;
  status: StockStatus;
  updatedAt: string;
};

export type ProductFilters = {
  q?: string;
  categoryId?: number;
  brand?: string;
  status?: StockStatus | "inactive";
  sort?: string;
  page: number;
};

const SORTS: Record<string, { column: string; ascending: boolean }> = {
  name_asc: { column: "name", ascending: true },
  name_desc: { column: "name", ascending: false },
  code_asc: { column: "code", ascending: true },
  price_asc: { column: "sale_price", ascending: true },
  price_desc: { column: "sale_price", ascending: false },
  stock_asc: { column: "stock", ascending: true },
  stock_desc: { column: "stock", ascending: false },
  recent: { column: "created_at", ascending: false },
};

export const PRODUCT_SORTS = Object.keys(SORTS);

export async function listProducts(f: ProductFilters): Promise<Paginated<ProductRow>> {
  const supabase = await createClient();
  let query = supabase.from("products_view").select("*", { count: "exact" });

  const q = searchTerm(f.q);
  if (q) query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,compatible_model.ilike.%${q}%`);
  if (f.categoryId) query = query.eq("category_id", f.categoryId);
  if (f.brand) query = query.eq("brand", f.brand);
  if (f.status === "inactive") query = query.eq("active", false);
  else if (f.status) query = query.eq("active", true).eq("stock_status", f.status);

  const sort = SORTS[f.sort ?? ""] ?? SORTS.name_asc;
  const from = (f.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query
    .order(sort.column, { ascending: sort.ascending })
    .order("id")
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw error;

  return paginate(
    (data ?? []).map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      brand: p.brand,
      compatibleModel: p.compatible_model,
      categoryName: p.category_name,
      supplierName: p.supplier_name,
      salePrice: Number(p.sale_price),
      purchasePrice: Number(p.purchase_price),
      stock: p.stock,
      minStock: p.min_stock,
      active: p.active,
      hasImage: p.has_image,
      status: p.stock_status as StockStatus,
      updatedAt: p.updated_at,
    })),
    count ?? 0,
    f.page,
  );
}

export async function getProduct(id: number) {
  const supabase = await createClient();
  const { data: p, error } = await supabase
    .from("products")
    .select("*, category:categories(id, name), supplier:suppliers(id, name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!p) return null;
  return {
    id: p.id as number,
    code: p.code as string,
    name: p.name as string,
    description: p.description as string | null,
    categoryId: p.category_id as number,
    brand: p.brand as string,
    compatibleModel: p.compatible_model as string | null,
    purchasePrice: Number(p.purchase_price),
    salePrice: Number(p.sale_price),
    stock: p.stock as number,
    minStock: p.min_stock as number,
    supplierId: p.supplier_id as number | null,
    active: p.active as boolean,
    hasImage: !!p.image_path,
    imagePath: p.image_path as string | null,
    createdAt: new Date(p.created_at),
    updatedAt: new Date(p.updated_at),
    category: p.category as { id: number; name: string },
    supplier: p.supplier as { id: number; name: string } | null,
    status: stockStatus(p.stock, p.min_stock),
  };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProduct>>>;

export async function getCatalogOptions() {
  const supabase = await createClient();
  const [categories, suppliers, brands] = await Promise.all([
    supabase.from("categories").select("id, name, active").order("name"),
    supabase.from("suppliers").select("id, name, active").order("name"),
    supabase.from("products").select("brand").order("brand"),
  ]);
  return {
    categories: categories.data ?? [],
    suppliers: suppliers.data ?? [],
    brands: [...new Set((brands.data ?? []).map((b) => b.brand as string))],
  };
}

export type ProductSalesStats = { unitsSold: number; revenue: number };

export async function getProductSalesStats(productId: number): Promise<ProductSalesStats> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("product_sales_stats", { p_product_id: productId }).single();
  const row = data as { units_sold: number; revenue: number } | null;
  return { unitsSold: Number(row?.units_sold ?? 0), revenue: Number(row?.revenue ?? 0) };
}
