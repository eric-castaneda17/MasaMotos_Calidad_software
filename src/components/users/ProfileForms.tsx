"use client";

import DataCard from "@/components/common/DataCard";
import { RoleBadge } from "@/components/common/StatusBadges";
import TextInput from "@/components/form/TextInput";
import Button from "@/components/ui/button/Button";
import { useCurrentUser } from "@/context/SessionContext";
import { useFormAction } from "@/hooks/useFormAction";
import { changePasswordAction, updateProfileAction } from "@/lib/actions/users";
import { useTranslations } from "next-intl";
import { useRef } from "react";

export default function ProfileForms() {
  const t = useTranslations("profile");
  const tu = useTranslations("users.hints");
  const tc = useTranslations("common");
  const user = useCurrentUser();
  const pwdForm = useRef<HTMLFormElement>(null);
  const profile = useFormAction(updateProfileAction);
  const password = useFormAction(changePasswordAction, { onSuccess: () => pwdForm.current?.reset() });

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <DataCard title={t("info.title")}>
        <form onSubmit={profile.onSubmit} noValidate className="space-y-5">
          <TextInput label={t("info.name")} name="name" defaultValue={user.name} required maxLength={120} error={profile.fieldErrors.name} />
          <TextInput label={t("info.email")} name="emailReadonly" value={user.email} disabled readOnly />
          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-400">{t("info.role")}</p>
            <RoleBadge role={user.role} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={profile.pending}>
              {tc("saveChanges")}
            </Button>
          </div>
        </form>
      </DataCard>
      <DataCard title={t("password.title")}>
        <form ref={pwdForm} onSubmit={password.onSubmit} noValidate className="space-y-5">
          <TextInput
            label={t("password.current")}
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            error={password.fieldErrors.currentPassword}
          />
          <TextInput
            label={t("password.new")}
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            hint={tu("password")}
            error={password.fieldErrors.newPassword}
          />
          <TextInput
            label={t("password.confirm")}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            error={password.fieldErrors.confirmPassword}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" variant="secondary" loading={password.pending}>
              {t("password.submit")}
            </Button>
          </div>
        </form>
      </DataCard>
    </div>
  );
}
