"use client";

import SelectInput from "@/components/form/SelectInput";
import TextInput from "@/components/form/TextInput";
import Button from "@/components/ui/button/Button";
import { useFormAction } from "@/hooks/useFormAction";
import { type CustomerOption, saveCustomerAction } from "@/lib/actions/customers";
import { DOCUMENT_TYPES } from "@/lib/validation/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export type CustomerFormValues = {
  id: number;
  fullName: string;
  documentType: string;
  documentNumber: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

interface CustomerFormProps {
  customer?: CustomerFormValues;
  onSaved: (customer?: CustomerOption) => void;
  onCancel: () => void;
}

export default function CustomerForm({ customer, onSaved, onCancel }: CustomerFormProps) {
  const t = useTranslations("customers");
  const tc = useTranslations("common");
  const action = useMemo(() => saveCustomerAction.bind(null, customer?.id ?? null), [customer?.id]);
  const { pending, onSubmit, fieldErrors } = useFormAction(action, { onSuccess: onSaved });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <TextInput
        label={t("fields.fullName")}
        name="fullName"
        defaultValue={customer?.fullName}
        placeholder={t("placeholders.fullName")}
        required
        maxLength={150}
        error={fieldErrors.fullName}
        autoFocus
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <SelectInput
          label={t("fields.documentType")}
          name="documentType"
          defaultValue={customer?.documentType ?? "CC"}
          options={DOCUMENT_TYPES.map((d) => ({ value: d, label: t(`documentTypes.${d}`) }))}
          required
          error={fieldErrors.documentType}
        />
        <TextInput
          label={t("fields.documentNumber")}
          name="documentNumber"
          defaultValue={customer?.documentNumber}
          placeholder={t("placeholders.documentNumber")}
          required
          maxLength={30}
          error={fieldErrors.documentNumber}
        />
        <TextInput
          label={t("fields.phone")}
          name="phone"
          type="tel"
          defaultValue={customer?.phone ?? ""}
          placeholder={t("placeholders.phone")}
          maxLength={20}
          error={fieldErrors.phone}
        />
        <TextInput
          label={t("fields.email")}
          name="email"
          type="email"
          defaultValue={customer?.email ?? ""}
          placeholder={t("placeholders.email")}
          maxLength={160}
          error={fieldErrors.email}
        />
      </div>
      <TextInput
        label={t("fields.address")}
        name="address"
        defaultValue={customer?.address ?? ""}
        placeholder={t("placeholders.address")}
        maxLength={255}
        error={fieldErrors.address}
      />
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={pending}>
          {tc("cancel")}
        </Button>
        <Button type="submit" size="sm" loading={pending} data-testid="customer-submit">
          {tc("save")}
        </Button>
      </div>
    </form>
  );
}
