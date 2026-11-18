"use client";

import DataCard from "@/components/common/DataCard";
import CheckboxInput from "@/components/form/CheckboxInput";
import TextAreaInput from "@/components/form/TextAreaInput";
import TextInput from "@/components/form/TextInput";
import Button from "@/components/ui/button/Button";
import { useFormAction } from "@/hooks/useFormAction";
import { InfoIcon } from "@/icons";
import { saveSettingsAction } from "@/lib/actions/settings";
import type { AppSettings } from "@/lib/data/settings";
import { useTranslations } from "next-intl";

export default function SettingsForm({ settings }: { settings: AppSettings }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const { pending, onSubmit, fieldErrors } = useFormAction(saveSettingsAction);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <DataCard title={t("company.title")}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextInput label={t("company.name")} name="companyName" defaultValue={settings.companyName} required maxLength={120} error={fieldErrors.companyName} />
          <TextInput label={t("company.taxId")} name="companyTaxId" defaultValue={settings.companyTaxId} maxLength={30} error={fieldErrors.companyTaxId} />
          <TextInput label={t("company.address")} name="companyAddress" defaultValue={settings.companyAddress} maxLength={255} error={fieldErrors.companyAddress} />
          <TextInput label={t("company.phone")} name="companyPhone" type="tel" defaultValue={settings.companyPhone} maxLength={20} error={fieldErrors.companyPhone} />
          <TextInput
            label={t("company.email")}
            name="companyEmail"
            type="email"
            defaultValue={settings.companyEmail}
            maxLength={160}
            error={fieldErrors.companyEmail}
            className="sm:col-span-2"
          />
        </div>
      </DataCard>

      <DataCard title={t("billing.title")}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <CheckboxInput label={t("billing.taxEnabled")} name="taxEnabled" defaultChecked={settings.taxEnabled} className="sm:col-span-2" />
          <TextInput
            label={t("billing.taxRate")}
            name="taxRate"
            type="number"
            min={0}
            max={100}
            step="0.01"
            defaultValue={settings.taxRate}
            required
            error={fieldErrors.taxRate}
          />
          <TextInput
            label={t("billing.invoicePrefix")}
            name="invoicePrefix"
            defaultValue={settings.invoicePrefix}
            required
            maxLength={10}
            hint={t("billing.nextNumber", {
              number: `${settings.invoicePrefix}-${String(settings.nextInvoiceNumber).padStart(6, "0")}`,
            })}
            error={fieldErrors.invoicePrefix}
            className="[&_input]:uppercase"
          />
          <TextAreaInput
            label={t("billing.footer")}
            name="invoiceFooter"
            defaultValue={settings.invoiceFooter}
            placeholder={t("billing.footerPlaceholder")}
            maxLength={500}
            error={fieldErrors.invoiceFooter}
            className="sm:col-span-2"
          />
          <p className="flex gap-2 rounded-lg bg-navy-50 p-3 text-xs text-navy-800 sm:col-span-2 dark:bg-navy-500/15 dark:text-navy-200">
            <InfoIcon className="size-4 shrink-0" />
            {t("billing.dianNotice")}
          </p>
        </div>
      </DataCard>

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          {pending ? tc("saving") : tc("saveChanges")}
        </Button>
      </div>
    </form>
  );
}
