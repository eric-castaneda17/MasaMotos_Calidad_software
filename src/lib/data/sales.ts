import "server-only";

import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, type Paginated, paginate } from "./pagination";
import { searchTerm } from "./search";

export type SaleStatus = "COMPLETED" | "VOIDED";

export type SaleRow = {
  id: number;
  invoiceId: number | null;
  invoiceNumber: string | null;
  createdAt: string;
  customerName: string;
  customerDocument: string;
  sellerName: string;
  paymentMethodCode: string;
  paymentMethodName: string;
  itemCount: number;
  total: number;
  status: SaleStatus;
};

export type SaleFilters = {
  q?: string;
  customerId?: number;
  status?: SaleStatus;
  start?: Date;
  end?: Date;
  page: number;
  pageSize?: number;
};

export async function listSales(f: SaleFilters): Promise<Paginated<SaleRow>> {
  const pageSize = f.pageSize ?? PAGE_SIZE;
  const supabase = await createClient();
  let query = supabase.from("sales_view").select("*", { count: "exact" });
  if (f.customerId) query = query.eq("customer_id", f.customerId);
  if (f.status) query = query.eq("status", f.status);
  if (f.start) query = query.gte("created_at", f.start.toISOString());
  if (f.end) query = query.lt("created_at", f.end.toISOString());
  const q = searchTerm(f.q);
  if (q) query = query.or(`invoice_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_document_number.ilike.%${q}%`);

  const from = (f.page - 1) * pageSize;
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw error;

  return paginate(
    (data ?? []).map((s) => ({
      id: s.id,
      invoiceId: s.invoice_id,
      invoiceNumber: s.invoice_number,
      createdAt: s.created_at,
      customerName: s.customer_name,
      customerDocument: s.customer_document,
      sellerName: s.seller_name,
      paymentMethodCode: s.payment_method_code,
      paymentMethodName: s.payment_method_name,
      itemCount: s.item_count,
      total: Number(s.total),
      status: s.status as SaleStatus,
    })),
    count ?? 0,
    f.page,
    pageSize,
  );
}

export async function getInvoice(invoiceId: number) {
  const supabase = await createClient();
  const { data: inv, error } = await supabase
    .from("invoices")
    .select(
      `id, number, issued_at,
       sale:sales (
         id, status, void_reason, voided_at, notes, subtotal, discount, tax_rate, tax_amount, total, amount_received,
         seller:profiles ( name ),
         payment_method:payment_methods ( code, name ),
         customer:customers ( id, full_name, document_type, document_number, phone, email, address ),
         items:sale_items ( id, product_id, product_code, product_name, quantity, unit_price, line_total )
       )`,
    )
    .eq("id", invoiceId)
    .maybeSingle();
  if (error) throw error;
  if (!inv) return null;

  type Item = {
    id: number;
    product_id: number;
    product_code: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  };
  const s = inv.sale as unknown as {
    id: number;
    status: SaleStatus;
    void_reason: string | null;
    voided_at: string | null;
    notes: string | null;
    subtotal: number;
    discount: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    amount_received: number | null;
    seller: { name: string };
    payment_method: { code: string; name: string };
    customer: {
      id: number;
      full_name: string;
      document_type: string;
      document_number: string;
      phone: string | null;
      email: string | null;
      address: string | null;
    };
    items: Item[];
  };

  return {
    id: inv.id as number,
    number: inv.number as string,
    issuedAt: inv.issued_at as string,
    saleId: s.id,
    status: s.status,
    voidReason: s.void_reason,
    voidedAt: s.voided_at,
    notes: s.notes,
    sellerName: s.seller.name,
    paymentMethod: { code: s.payment_method.code, name: s.payment_method.name },
    customer: {
      id: s.customer.id,
      fullName: s.customer.full_name,
      documentType: s.customer.document_type,
      documentNumber: s.customer.document_number,
      phone: s.customer.phone,
      email: s.customer.email,
      address: s.customer.address,
    },
    items: [...s.items]
      .sort((a, b) => a.id - b.id)
      .map((i) => ({
        id: i.id,
        productId: i.product_id,
        code: i.product_code,
        name: i.product_name,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price),
        lineTotal: Number(i.line_total),
      })),
    subtotal: Number(s.subtotal),
    discount: Number(s.discount),
    taxRate: Number(s.tax_rate),
    taxAmount: Number(s.tax_amount),
    total: Number(s.total),
    amountReceived: s.amount_received === null ? null : Number(s.amount_received),
  };
}

export type InvoiceDetail = NonNullable<Awaited<ReturnType<typeof getInvoice>>>;
