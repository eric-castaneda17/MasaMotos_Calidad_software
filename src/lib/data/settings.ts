import "server-only";

import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export type AppSettings = {
  companyName: string;
  companyTaxId: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  taxRate: number;
  taxEnabled: boolean;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  invoiceFooter: string;
  currency: string;
};

export const getSettings = cache(async (): Promise<AppSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return {
    companyName: data.company_name,
    companyTaxId: data.company_tax_id,
    companyAddress: data.company_address,
    companyPhone: data.company_phone,
    companyEmail: data.company_email,
    taxRate: Number(data.tax_rate),
    taxEnabled: data.tax_enabled,
    invoicePrefix: data.invoice_prefix,
    nextInvoiceNumber: data.next_invoice_number,
    invoiceFooter: data.invoice_footer,
    currency: data.currency,
  };
});

export type PaymentMethodOption = { id: number; code: string; name: string; active: boolean };

export async function getPaymentMethods(onlyActive = true): Promise<PaymentMethodOption[]> {
  const supabase = await createClient();
  let q = supabase.from("payment_methods").select("id, code, name, active").order("id");
  if (onlyActive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
