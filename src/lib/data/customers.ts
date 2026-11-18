import "server-only";

import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, type Paginated, paginate } from "./pagination";
import { searchTerm } from "./search";

export type CustomerRow = {
  id: number;
  fullName: string;
  documentType: string;
  documentNumber: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  purchases: number;
  totalSpent: number;
};

type ViewRow = {
  id: number;
  full_name: string;
  document_type: string;
  document_number: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  purchases: number;
  total_spent: number;
  last_purchase: string | null;
  created_at: string;
};

const toRow = (c: ViewRow): CustomerRow => ({
  id: c.id,
  fullName: c.full_name,
  documentType: c.document_type,
  documentNumber: c.document_number,
  phone: c.phone,
  email: c.email,
  address: c.address,
  purchases: c.purchases,
  totalSpent: Number(c.total_spent),
});

export async function listCustomers(f: { q?: string; page: number }): Promise<Paginated<CustomerRow>> {
  const supabase = await createClient();
  let query = supabase.from("customers_view").select("*", { count: "exact" });
  const q = searchTerm(f.q);
  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,document_number.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`,
    );
  }
  const from = (f.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.order("full_name").range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return paginate(((data ?? []) as ViewRow[]).map(toRow), count ?? 0, f.page);
}

export async function getCustomer(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("customers_view").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const c = data as ViewRow;
  return {
    ...toRow(c),
    lastPurchase: c.last_purchase,
    createdAt: new Date(c.created_at),
  };
}

