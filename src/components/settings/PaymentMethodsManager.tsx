"use client";

import DataCard from "@/components/common/DataCard";
import FormModal from "@/components/common/FormModal";
import { ActiveBadge } from "@/components/common/StatusBadges";
import CheckboxInput from "@/components/form/CheckboxInput";
import TextInput from "@/components/form/TextInput";
import { iconBtn } from "@/components/products/ProductRowActions";
import Button from "@/components/ui/button/Button";
import { useFormAction } from "@/hooks/useFormAction";
import { usePaymentLabel } from "@/hooks/usePaymentLabel";
import { PencilIcon, PlusIcon } from "@/icons";
import { savePaymentMethodAction } from "@/lib/actions/settings";
import type { PaymentMethodOption } from "@/lib/data/settings";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

function MethodForm({ method, onDone }: { method?: PaymentMethodOption; onDone: () => void }) {
  const t = useTranslations("settings.paymentMethods");
  const tc = useTranslations("common");
  const label = usePaymentLabel();
  const action = useMemo(() => savePaymentMethodAction.bind(null, method?.id ?? null), [method?.id]);
  const { pending, onSubmit, fieldErrors } = useFormAction(action, { onSuccess: onDone });
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <TextInput
        label={t("name")}
        name="name"
        defaultValue={method ? label(method.code, method.name) : ""}
        placeholder={t("placeholder")}
        required
        maxLength={80}
        error={fieldErrors.name}
        autoFocus
      />
      <CheckboxInput label={t("active")} name="active" defaultChecked={method?.active ?? true} />
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="outline" size="sm" onClick={onDone} disabled={pending}>
          {tc("cancel")}
        </Button>
        <Button type="submit" size="sm" loading={pending}>
          {tc("save")}
        </Button>
      </div>
    </form>
  );
}

export default function PaymentMethodsManager({ methods }: { methods: PaymentMethodOption[] }) {
  const t = useTranslations("settings.paymentMethods");
  const tc = useTranslations("common");
  const label = usePaymentLabel();
  const [editing, setEditing] = useState<PaymentMethodOption | "new" | null>(null);

  return (
    <DataCard
      title={t("title")}
      subtitle={t("subtitle")}
      actions={
        <Button size="xs" startIcon={<PlusIcon />} onClick={() => setEditing("new")}>
          {t("new")}
        </Button>
      }
      bodyClassName="p-0 sm:p-0"
    >
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {methods.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <span className="flex-1 text-sm font-medium text-gray-800 dark:text-white/90">{label(m.code, m.name)}</span>
            <ActiveBadge active={m.active} />
            <button type="button" className={iconBtn} onClick={() => setEditing(m)} aria-label={tc("edit")} title={tc("edit")}>
              <PencilIcon className="fill-current" />
            </button>
          </li>
        ))}
      </ul>
      <FormModal isOpen={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? t("new") : t("edit")}>
        {editing !== null && (
          <MethodForm key={editing === "new" ? "new" : editing.id} method={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />
        )}
      </FormModal>
    </DataCard>
  );
}
