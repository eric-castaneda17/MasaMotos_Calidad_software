"use client";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import { DataTable, Td, Th, Tr } from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import FormModal from "@/components/common/FormModal";
import SearchBox from "@/components/common/SearchBox";
import { ActiveBadge, RoleBadge } from "@/components/common/StatusBadges";
import CheckboxInput from "@/components/form/CheckboxInput";
import SelectInput from "@/components/form/SelectInput";
import TextInput from "@/components/form/TextInput";
import { iconBtn } from "@/components/products/ProductRowActions";
import Button from "@/components/ui/button/Button";
import { useCurrentUser } from "@/context/SessionContext";
import { useActionRunner, useFormAction } from "@/hooks/useFormAction";
import { useFormat } from "@/hooks/useFormat";
import { BanIcon, CheckCircleIcon, PencilIcon, PlusIcon, UsersIcon } from "@/icons";
import { saveUserAction, toggleUserActiveAction } from "@/lib/actions/users";
import type { UserRow } from "@/lib/data/users";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

function UserForm({ user, onDone }: { user?: UserRow; onDone: () => void }) {
  const t = useTranslations("users");
  const tr = useTranslations("roles");
  const tc = useTranslations("common");
  const action = useMemo(() => saveUserAction.bind(null, user?.id ?? null), [user?.id]);
  const { pending, onSubmit, fieldErrors } = useFormAction(action, { onSuccess: onDone });
  const [role, setRole] = useState<"ADMIN" | "SELLER">(user?.role ?? "SELLER");

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <TextInput label={t("fields.name")} name="name" defaultValue={user?.name} required maxLength={120} error={fieldErrors.name} autoFocus />
      <TextInput
        label={t("fields.email")}
        name="email"
        type="email"
        defaultValue={user?.email}
        required
        maxLength={160}
        autoComplete="off"
        error={fieldErrors.email}
      />
      <SelectInput
        label={t("fields.role")}
        name="role"
        value={role}
        onChange={(e) => setRole(e.target.value as "ADMIN" | "SELLER")}
        options={(["ADMIN", "SELLER"] as const).map((r) => ({ value: r, label: tr(r) }))}
        hint={t(`roleDescriptions.${role}`)}
        required
        error={fieldErrors.role}
      />
      <TextInput
        label={user ? t("fields.newPassword") : t("fields.password")}
        name="password"
        type="password"
        autoComplete="new-password"
        required={!user}
        hint={user ? t("hints.passwordEdit") : t("hints.password")}
        error={fieldErrors.password}
      />
      <CheckboxInput label={t("fields.active")} name="active" defaultChecked={user?.active ?? true} />
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

export default function UserManager({ rows }: { rows: UserRow[] }) {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const f = useFormat();
  const me = useCurrentUser();
  const [editing, setEditing] = useState<UserRow | "new" | null>(null);
  const [deactivating, setDeactivating] = useState<UserRow | null>(null);
  const { run, pending } = useActionRunner();

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-gray-800">
        <SearchBox placeholder={t("searchPlaceholder")} className="sm:max-w-md sm:flex-1" />
        <Button size="sm" startIcon={<PlusIcon />} onClick={() => setEditing("new")}>
          {t("new")}
        </Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState title={t("empty")} icon={<UsersIcon />} />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <Th>{t("fields.name")}</Th>
              <Th>{t("fields.role")}</Th>
              <Th>{tc("status")}</Th>
              <Th>{t("fields.lastLogin")}</Th>
              <Th align="center">{t("fields.sales")}</Th>
              <Th align="end">{tc("actions")}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const isMe = u.id === me.id;
              return (
                <Tr key={u.id}>
                  <Td className="min-w-56">
                    <span className="block font-medium text-gray-800 dark:text-white/90">
                      {u.name}
                      {isMe && (
                        <span className="ms-2 rounded-full bg-navy-50 px-2 py-0.5 text-xs text-navy-700 dark:bg-navy-500/15 dark:text-navy-300">
                          {t("you")}
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">{u.email}</span>
                  </Td>
                  <Td>
                    <RoleBadge role={u.role} />
                  </Td>
                  <Td>
                    <ActiveBadge active={u.active} />
                  </Td>
                  <Td className="whitespace-nowrap">{u.lastLoginAt ? f.dateTime(u.lastLoginAt) : t("never")}</Td>
                  <Td align="center">{u.salesCount}</Td>
                  <Td align="end">
                    <div className="flex justify-end gap-1">
                      <button type="button" className={iconBtn} onClick={() => setEditing(u)} aria-label={tc("edit")} title={tc("edit")}>
                        <PencilIcon className="fill-current" />
                      </button>
                      {!isMe &&
                        (u.active ? (
                          <button
                            type="button"
                            className={iconBtn}
                            onClick={() => setDeactivating(u)}
                            aria-label={tc("deactivate")}
                            title={tc("deactivate")}
                          >
                            <BanIcon />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={iconBtn}
                            disabled={pending}
                            onClick={() => run(() => toggleUserActiveAction(u.id))}
                            aria-label={tc("activate")}
                            title={tc("activate")}
                          >
                            <CheckCircleIcon className="fill-current" />
                          </button>
                        ))}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </DataTable>
      )}

      <FormModal isOpen={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? t("new") : t("edit")}>
        {editing !== null && (
          <UserForm key={editing === "new" ? "new" : editing.id} user={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />
        )}
      </FormModal>
      <ConfirmDialog
        isOpen={deactivating !== null}
        onClose={() => setDeactivating(null)}
        title={t("confirmDeactivateTitle")}
        message={t("confirmDeactivate", { name: deactivating?.name ?? "" })}
        confirmLabel={tc("deactivate")}
        loading={pending}
        onConfirm={() => deactivating && run(() => toggleUserActiveAction(deactivating.id), () => setDeactivating(null))}
      />
    </>
  );
}
