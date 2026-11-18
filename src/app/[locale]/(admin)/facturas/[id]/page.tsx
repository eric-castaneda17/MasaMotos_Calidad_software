import PageHeader from "@/components/common/PageHeader";
import InvoiceActions from "@/components/invoices/InvoiceActions";
import InvoiceDocument from "@/components/invoices/InvoiceDocument";
import { requirePageUser } from "@/lib/auth/dal";
import { getInvoice } from "@/lib/data/sales";
import { getSettings } from "@/lib/data/settings";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const t = await getTranslations("invoices");
  const { id } = await params;
  const inv = Number.isInteger(Number(id)) ? await getInvoice(Number(id)) : null;
  return { title: inv ? `${t("documentTitle")} ${inv.number}` : t("title") };
}

export default async function InvoicePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requirePageUser("invoices.view");
  const invoiceId = Number(id);
  if (!Number.isInteger(invoiceId) || invoiceId <= 0) notFound();

  const [t, invoice, settings] = await Promise.all([getTranslations("invoices"), getInvoice(invoiceId), getSettings()]);
  if (!invoice) notFound();

  const company = {
    companyName: settings.companyName,
    companyTaxId: settings.companyTaxId,
    companyAddress: settings.companyAddress,
    companyPhone: settings.companyPhone,
    companyEmail: settings.companyEmail,
    invoiceFooter: settings.invoiceFooter,
  };

  return (
    <>
      <PageHeader
        title={`${t("documentTitle")} ${invoice.number}`}
        crumbs={[{ label: t("title"), href: "/facturas" }, { label: invoice.number }]}
        actions={<InvoiceActions invoice={invoice} company={company} />}
      />
      <InvoiceDocument invoice={invoice} company={company} />
    </>
  );
}
