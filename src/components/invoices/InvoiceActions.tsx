"use client";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import TextInput from "@/components/form/TextInput";
import Button from "@/components/ui/button/Button";
import { useCan } from "@/context/SessionContext";
import { useToast } from "@/context/ToastContext";
import { useActionRunner } from "@/hooks/useFormAction";
import { useFormat } from "@/hooks/useFormat";
import { useMessage } from "@/hooks/useMessage";
import { useModal } from "@/hooks/useModal";
import { usePaymentLabel } from "@/hooks/usePaymentLabel";
import { BanIcon, DownloadIcon, PrinterIcon } from "@/icons";
import { voidSaleAction } from "@/lib/actions/sales";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { downloadInvoicePdf } from "./invoicePdf";
import type { CompanyInfo, InvoiceDetail } from "./types";

export default function InvoiceActions({ invoice, company }: { invoice: InvoiceDetail; company: CompanyInfo }) {
  const t = useTranslations("invoices");
  const tc = useTranslations("common");
  const ts = useTranslations("sales.void");
  const tCust = useTranslations("customers");
  const f = useFormat();
  const msg = useMessage();
  const toast = useToast();
  const payLabel = usePaymentLabel();
  const canVoid = useCan("sales.void");
  const voidModal = useModal();
  const { run, pending } = useActionRunner();
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const [pdfLoading, setPdfLoading] = useState(false);

  const onPdf = async () => {
    setPdfLoading(true);
    try {
      await downloadInvoicePdf(
        invoice,
        company,
        {
          documentTitle: t("documentTitle"),
          number: t("number"),
          issuedAt: t("issuedAt"),
          seller: t("seller"),
          billTo: t("billTo"),
          document: `${tCust(`documentTypes.${invoice.customer.documentType as "CC"}`)}: ${invoice.customer.documentNumber}`,
          paymentMethod: t("paymentMethod"),
          paymentLabel: payLabel(invoice.paymentMethod.code, invoice.paymentMethod.name),
          amountReceived: t("amountReceived"),
          change: t("change"),
          code: t("code"),
          description: t("description"),
          quantity: t("quantity"),
          unitPrice: t("unitPrice"),
          amount: t("amount"),
          subtotal: t("subtotal"),
          discount: t("discount"),
          tax: t("tax", { rate: invoice.taxRate }),
          total: t("total"),
          notes: t("notes"),
          thanks: t("thanks"),
          legalNotice: t("legalNotice"),
          voided: t("voided"),
          voidReason: t("voidReason", { reason: invoice.voidReason ?? "" }),
          nit: t("nit", { value: company.companyTaxId }),
          phone: t("phone", { value: company.companyPhone }),
        },
        { money: f.money, dateTime: f.dateTime },
      );
    } catch (e) {
      console.error(e);
      toast.error(msg("errors.generic"));
    } finally {
      setPdfLoading(false);
    }
  };

  const onVoid = () => {
    if (!reason.trim()) {
      setReasonError("validation.required");
      return;
    }
    run(() => voidSaleAction(invoice.saleId, reason), (res) => {
      if (res.ok) {
        voidModal.closeModal();
        setReason("");
      }
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" startIcon={<PrinterIcon />} onClick={() => window.print()}>
        {tc("print")}
      </Button>
      <Button size="sm" variant="secondary" startIcon={<DownloadIcon />} onClick={onPdf} loading={pdfLoading} data-testid="download-pdf">
        {pdfLoading ? t("generatingPdf") : tc("downloadPdf")}
      </Button>
      {canVoid && invoice.status === "COMPLETED" && (
        <Button size="sm" variant="danger" startIcon={<BanIcon />} onClick={voidModal.openModal}>
          {ts("button")}
        </Button>
      )}
      <ConfirmDialog
        isOpen={voidModal.isOpen}
        onClose={voidModal.closeModal}
        title={ts("title")}
        message={ts("message")}
        confirmLabel={ts("confirm")}
        loading={pending}
        onConfirm={onVoid}
      >
        <TextInput
          label={ts("reason")}
          name="voidReason"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setReasonError(undefined);
          }}
          placeholder={ts("reasonPlaceholder")}
          maxLength={255}
          required
          error={reasonError}
        />
      </ConfirmDialog>
    </>
  );
}
