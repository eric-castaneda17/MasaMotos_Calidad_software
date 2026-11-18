import type { AppSettings } from "@/lib/data/settings";
import type { InvoiceDetail } from "@/lib/data/sales";

export type CompanyInfo = Pick<
  AppSettings,
  "companyName" | "companyTaxId" | "companyAddress" | "companyPhone" | "companyEmail" | "invoiceFooter"
>;

export type { InvoiceDetail };
