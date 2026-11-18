"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { AlertIcon } from "@/icons";
import { useTranslations } from "next-intl";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  variant = "danger",
  loading,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  const t = useTranslations("common");
  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} className="m-4 max-w-md" showCloseButton={false}>
      <div className="p-6" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="flex items-start gap-4">
          <div
            className={
              variant === "danger"
                ? "flex size-11 shrink-0 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
                : "flex size-11 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-600 dark:bg-navy-500/15 dark:text-navy-300"
            }
          >
            <AlertIcon className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id="confirm-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <div className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{message}</div>
          </div>
        </div>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button variant={variant} size="sm" onClick={onConfirm} loading={loading}>
            {confirmLabel ?? t("confirm")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
