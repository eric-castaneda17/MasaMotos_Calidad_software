"use server";

import { requireActionUser } from "@/lib/auth/dal";
import { searchTerm } from "@/lib/data/search";
import { createClient } from "@/lib/supabase/server";

export type PosProduct = {
  id: number;
  code: string;
  name: string;
  brand: string;
  compatibleModel: string | null;
  salePrice: number;
  stock: number;
  hasImage: boolean;
};

export async function searchPosProductsAction(query: string): Promise<PosProduct[]> {
  await requireActionUser("sales.create");
  const q = searchTerm(query);
  const supabase = await createClient();
  let req = supabase
    .from("products_view")
    .select("id, code, name, brand, compatible_model, sale_price, stock, has_image")
    .eq("active", true);
  if (q) {
    req = req.or(`name.ilike.%${q}%,code.ilike.%${q}%,compatible_model.ilike.%${q}%,brand.ilike.%${q}%`);
  }
  const { data } = await req.order("stock", { ascending: false }).order("name").limit(q ? 12 : 6);
  return (data ?? []).map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    brand: p.brand,
    compatibleModel: p.compatible_model,
    salePrice: Number(p.sale_price),
    stock: p.stock,
    hasImage: p.has_image,
  }));
}
