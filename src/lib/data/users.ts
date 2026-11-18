import "server-only";

import { createClient } from "@/lib/supabase/server";
import { searchTerm } from "./search";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SELLER";
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  salesCount: number;
};

export async function listUsers(q?: string): Promise<UserRow[]> {
  const supabase = await createClient();
  let query = supabase.from("users_view").select("*");
  const term = searchTerm(q);
  if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
  const { data, error } = await query.order("active", { ascending: false }).order("name");
  if (error) throw error;
  return (data ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    lastLoginAt: u.last_login_at,
    createdAt: u.created_at,
    salesCount: u.sales_count,
  }));
}
