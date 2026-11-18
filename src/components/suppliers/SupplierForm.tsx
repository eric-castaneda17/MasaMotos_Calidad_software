"use client";

import CheckboxInput from "@/components/form/CheckboxInput";
import TextInput from "@/components/form/TextInput";
import Button from "@/components/ui/button/Button";
import { useFormAction } from "@/hooks/useFormAction";
import { saveSupplierAction } from "@/lib/actions/suppliers";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export type SupplierFormValues = {
  id: number;
  name: string;
  taxId: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  active: boolean;
};

interface SupplierFormProps {
  supplier?: SupplierFormValues;
  onSaved: () => void;
  onCancel: () => void;
}

export default function SupplierForm({ supplier, onSaved, onCancel }: SupplierFormProps) {
  const t = useTranslations("suppliers");
  const tCust = useTranslations("customers.placeholders");
  const tc = useTranslations("common");
  const action = useMemo(() => saveSupplierAction.bind(null, supplier?.id ?? null), [supplier?.id]);
  const { pending, onSubmit, fieldErrors } = useFormAction(action, { onSuccess: onSaved });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput
          label={t("fields.name")}
          name="name"
          defaultValue={supplier?.name}
          placeholder={t("placeholders.name")}
          required
          maxLength={150}
          error={fieldErrors.name}
          autoFocus
          className="sm:col-span-2"
        />
        <TextInput
          label={t("fields.taxId")}
          name="taxId"
          defaultValue={supplier?.taxId}
          placeholder={t("placeholders.taxId")}
          required
          maxLength={30}
          error={fieldErrors.taxId}
        />
        <TextInput
          label={t("fields.contactName")}
          name="contactName"
          defaultValue={supplier?.contactName ?? ""}
          placeholder={t("placeholders.contactName")}
          maxLength={120}
          error={fieldErrors.contactName}
        />
        <TextInput
          label={t("fields.phone")}
          name="phone"
          type="tel"
          defaultValue={supplier?.phone ?? ""}
          placeholder={tCust("phone")}
          maxLength={20}
          error={fieldErrors.phone}
        />
        <TextInput
          label={t("fields.email")}
          name="email"
          type="email"
          defaultValue={supplier?.email ?? ""}
          placeholder={tCust("email")}
          maxLength={160}
          error={fieldErrors.email}
        />
        <TextInput
          label={t("fields.address")}
          name="address"
          defaultValue={supplier?.address ?? ""}
          placeholder={tCust("address")}
          maxLength={255}
          error={fieldErrors.address}
        />
        <TextInput
          label={t("fields.city")}
          name="city"
          defaultValue={supplier?.city ?? ""}
          placeholder={t("placeholders.city")}
          maxLength={80}
          error={fieldErrors.city}
        />
      </div>
      <CheckboxInput label={t("fields.active")} name="active" defaultChecked={supplier?.active ?? true} />
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={pending}>
          {tc("cancel")}
        </Button>
        <Button type="submit" size="sm" loading={pending}>
          {tc("save")}
        </Button>
      </div>
    </form>
  );
}
