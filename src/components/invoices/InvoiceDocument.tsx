"use client";

import BrandLogo from "@/components/common/BrandLogo";
import { useFormat } from "@/hooks/useFormat";
import { usePaymentLabel } from "@/hooks/usePaymentLabel";
import { useTranslations } from "next-intl";
import type { CompanyInfo, InvoiceDetail } from "./types";

export default function InvoiceDocument({ invoice, company }: { invoice: InvoiceDetail; company: CompanyInfo }) {
  const t = useTranslations("invoices");
  const tCust = useTranslations("customers");
  const f = useFormat();
  const payLabel = usePaymentLabel();
  const voided = invoice.status === "VOIDED";
  const change =
    invoice.amountReceived !== null && invoice.amountReceived >= invoice.total
      ? invoice.amountReceived - invoice.total
      : null;

  return (
    <article
      className="invoice-sheet relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-800 shadow-theme-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none dark:border-gray-800 dark:bg-gray-dark dark:text-gray-200"
      data-testid="invoice-document"
    >
      <div className="h-2 bg-gradient-to-r from-navy-800 via-navy-600 to-brand-600 print:h-1.5" />
      {voided && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="-rotate-12 rounded-xl border-4 border-error-500/60 px-8 py-2 text-6xl font-black tracking-widest text-error-500/50">
            {t("voided")}
          </span>
        </div>
      )}

      <div className="p-6 sm:p-10 print:p-6">
        <header className="flex flex-col gap-6 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between dark:border-gray-800">
          <div className="space-y-2">
            <BrandLogo variant="full" height={92} />
            <div className="text-xs leading-5 text-gray-500 dark:text-gray-400">
              <p className="font-semibold text-gray-700 dark:text-gray-300">{company.companyName}</p>
              {company.companyTaxId && <p>{t("nit", { value: company.companyTaxId })}</p>}
              {company.companyAddress && <p>{company.companyAddress}</p>}
              {company.companyPhone && <p>{t("phone", { value: company.companyPhone })}</p>}
              {company.companyEmail && <p>{company.companyEmail}</p>}
            </div>
          </div>
          <div className="sm:text-end">
            <p className="text-xs font-semibold tracking-widest text-brand-600 uppercase">{t("documentTitle")}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-navy-900 dark:text-white" data-testid="invoice-number">
              {t("number")} {invoice.number}
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t("issuedAt")}: <span className="text-gray-800 dark:text-gray-200">{f.dateTime(invoice.issuedAt)}</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("seller")}: <span className="text-gray-800 dark:text-gray-200">{invoice.sellerName}</span>
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">{t("billTo")}</p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">{invoice.customer.fullName}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tCust(`documentTypes.${invoice.customer.documentType as "CC"}`)}: {invoice.customer.documentNumber}
            </p>
            {invoice.customer.phone && <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.customer.phone}</p>}
            {invoice.customer.email && <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.customer.email}</p>}
            {invoice.customer.address && <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.customer.address}</p>}
          </div>
          <div className="sm:text-end">
            <p className="mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              {t("paymentMethod")}
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {payLabel(invoice.paymentMethod.code, invoice.paymentMethod.name)}
            </p>
            {invoice.amountReceived !== null && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("amountReceived")}: {f.money(invoice.amountReceived)}
                {change !== null && ` · ${t("change")}: ${f.money(change)}`}
              </p>
            )}
          </div>
        </section>

        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="bg-navy-900 text-white print:bg-navy-900">
                <th className="rounded-s-lg px-3 py-2.5 text-start font-semibold">{t("code")}</th>
                <th className="px-3 py-2.5 text-start font-semibold">{t("description")}</th>
                <th className="px-3 py-2.5 text-center font-semibold">{t("quantity")}</th>
                <th className="px-3 py-2.5 text-end font-semibold">{t("unitPrice")}</th>
                <th className="rounded-e-lg px-3 py-2.5 text-end font-semibold">{t("amount")}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((i) => (
                <tr key={i.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-3 py-2.5 font-mono text-xs">{i.code}</td>
                  <td className="px-3 py-2.5">{i.name}</td>
                  <td className="px-3 py-2.5 text-center tabular-nums">{i.quantity}</td>
                  <td className="px-3 py-2.5 text-end tabular-nums">{f.money(i.unitPrice)}</td>
                  <td className="px-3 py-2.5 text-end font-medium tabular-nums">{f.money(i.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-6 sm:flex-row sm:justify-between">
          <div className="max-w-sm text-xs text-gray-500 dark:text-gray-400">
            {invoice.notes && (
              <p className="mb-2">
                <b>{t("notes")}:</b> {invoice.notes}
              </p>
            )}
            {voided && invoice.voidReason && (
              <p className="mb-2 font-semibold text-error-600">{t("voidReason", { reason: invoice.voidReason })}</p>
            )}
            {company.invoiceFooter && <p className="mb-2">{company.invoiceFooter}</p>}
          </div>
          <dl className="w-full space-y-1.5 text-sm sm:w-72">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">{t("subtotal")}</dt>
              <dd className="tabular-nums">{f.money(invoice.subtotal)}</dd>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">{t("discount")}</dt>
                <dd className="tabular-nums">−{f.money(invoice.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">{t("tax", { rate: invoice.taxRate })}</dt>
              <dd className="tabular-nums">{f.money(invoice.taxAmount)}</dd>
            </div>
            <div className="mt-2 flex items-baseline justify-between rounded-lg bg-brand-50 px-3 py-2.5 dark:bg-brand-500/15">
              <dt className="font-semibold text-brand-800 dark:text-brand-300">{t("total")}</dt>
              <dd className="text-xl font-bold text-brand-700 tabular-nums dark:text-brand-300" data-testid="invoice-total">
                {f.money(invoice.total)}
              </dd>
            </div>
          </dl>
        </div>

        <footer className="mt-8 border-t border-gray-200 pt-4 text-center dark:border-gray-800">
          <p className="text-sm font-semibold text-navy-800 dark:text-navy-200">{t("thanks")}</p>
          <p className="mt-1 text-[11px] text-gray-400">{t("legalNotice")}</p>
        </footer>
      </div>
    </article>
  );
}
