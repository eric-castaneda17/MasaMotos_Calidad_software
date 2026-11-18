import "server-only";

import { createClient } from "@/lib/supabase/server";
import { searchTerm } from "./search";

export type CategoryRow = {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  productCount: number;
};

export async function listCategories(q?: string): Promise<CategoryRow[]> {
  const supabase = await createClient();
  let query = supabase.from("categories_view").select("id, name, description, active, product_count");
  const term = searchTerm(q);
  if (term) query = query.ilike("name", `%${term}%`);
  const { data, error } = await query.order("name");
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    active: c.active,
    productCount: c.product_count,
  }));
}
