"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { CheckCircleIcon, ReceiptIcon } from "@/icons";
import { useTranslations } from "next-intl";

interface SaleSuccessModalProps {
  invoiceNumber: string | null;
  onViewInvoice: () => void;
  onNewSale: () => void;
}

export default function SaleSuccessModal({ invoiceNumber, onViewInvoice, onNewSale }: SaleSuccessModalProps) {
  const t = useTranslations("pos");
  return (
    <Modal isOpen={!!invoiceNumber} onClose={onNewSale} className="m-4 max-w-md" showCloseButton={false}>
      <div className="p-7 text-center" data-testid="sale-success">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400">
          <CheckCircleIcon className="size-9" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("successTitle")}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t("successMessage", { number: invoiceNumber ?? "" })}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" size="sm" onClick={onNewSale}>
            {t("newSale")}
          </Button>
          <Button size="sm" startIcon={<ReceiptIcon />} onClick={onViewInvoice} data-testid="view-invoice">
            {t("viewInvoice")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
