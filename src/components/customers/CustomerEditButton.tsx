"use client";

import FormModal from "@/components/common/FormModal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { PencilIcon } from "@/icons";
import { useTranslations } from "next-intl";
import CustomerForm, { type CustomerFormValues } from "./CustomerForm";

export default function CustomerEditButton({ customer }: { customer: CustomerFormValues }) {
  const t = useTranslations("customers");
  const tc = useTranslations("common");
  const modal = useModal();
  return (
    <>
      <Button variant="outline" size="sm" startIcon={<PencilIcon className="fill-current" />} onClick={modal.openModal}>
        {tc("edit")}
      </Button>
      <FormModal isOpen={modal.isOpen} onClose={modal.closeModal} title={t("edit")} size="lg">
        <CustomerForm customer={customer} onSaved={modal.closeModal} onCancel={modal.closeModal} />
      </FormModal>
    </>
  );
}
