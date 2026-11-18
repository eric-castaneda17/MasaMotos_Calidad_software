"use client";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import { DataTable, Td, Th, Tr } from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import FormModal from "@/components/common/FormModal";
import SearchBox from "@/components/common/SearchBox";
import { ActiveBadge } from "@/components/common/StatusBadges";
import CheckboxInput from "@/components/form/CheckboxInput";
import TextAreaInput from "@/components/form/TextAreaInput";
import TextInput from "@/components/form/TextInput";
import { iconBtn } from "@/components/products/ProductRowActions";
import Button from "@/components/ui/button/Button";
import { useActionRunner, useFormAction } from "@/hooks/useFormAction";
import { Link } from "@/i18n/navigation";
import { PencilIcon, PlusIcon, TagIcon, TrashBinIcon } from "@/icons";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/actions/categories";
import type { CategoryRow } from "@/lib/data/categories";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

function CategoryForm({ category, onDone }: { category?: CategoryRow; onDone: () => void }) {
  const t = useTranslations("categories");
  const tc = useTranslations("common");
  const action = useMemo(() => saveCategoryAction.bind(null, category?.id ?? null), [category?.id]);
  const { pending, onSubmit, fieldErrors } = useFormAction(action, { onSuccess: onDone });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <TextInput
        label={t("fields.name")}
        name="name"
        defaultValue={category?.name}
        placeholder={t("placeholders.name")}
        required
        maxLength={80}
        error={fieldErrors.name}
        autoFocus
      />
      <TextAreaInput
        label={t("fields.description")}
        name="description"
        defaultValue={category?.description ?? ""}
        placeholder={t("placeholders.description")}
        maxLength={255}
        error={fieldErrors.description}
      />
      <CheckboxInput label={t("fields.active")} name="active" defaultChecked={category?.active ?? true} />
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

export default function CategoryManager({ rows, filtered }: { rows: CategoryRow[]; filtered: boolean }) {
  const t = useTranslations("categories");
  const tc = useTranslations("common");
  const [editing, setEditing] = useState<CategoryRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
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
        <EmptyState title={filtered ? tc("emptySearch") : t("empty")} icon={<TagIcon />} />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <Th>{t("fields.name")}</Th>
              <Th>{t("fields.description")}</Th>
              <Th align="center">{t("fields.products")}</Th>
              <Th>{tc("status")}</Th>
              <Th align="end">{tc("actions")}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <Tr key={c.id}>
                <Td className="font-medium whitespace-nowrap text-gray-800 dark:text-white/90">{c.name}</Td>
                <Td className="min-w-64 text-gray-500 dark:text-gray-400">{c.description ?? "—"}</Td>
                <Td align="center">
                  <Link href={`/productos?category=${c.id}`} className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                    {c.productCount}
                  </Link>
                </Td>
                <Td>
                  <ActiveBadge active={c.active} />
                </Td>
                <Td align="end">
                  <div className="flex justify-end gap-1">
                    <button type="button" className={iconBtn} onClick={() => setEditing(c)} aria-label={tc("edit")} title={tc("edit")}>
                      <PencilIcon className="fill-current" />
                    </button>
                    <button
                      type="button"
                      className={`${iconBtn} hover:text-error-600`}
                      onClick={() => setDeleting(c)}
                      aria-label={tc("delete")}
                      title={tc("delete")}
                    >
                      <TrashBinIcon className="fill-current" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </DataTable>
      )}

      <FormModal isOpen={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? t("new") : t("edit")}>
        {editing !== null && (
          <CategoryForm
            key={editing === "new" ? "new" : editing.id}
            category={editing === "new" ? undefined : editing}
            onDone={() => setEditing(null)}
          />
        )}
      </FormModal>
      <ConfirmDialog
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t("confirmDeleteTitle")}
        message={t("confirmDelete", { name: deleting?.name ?? "" })}
        confirmLabel={tc("delete")}
        loading={pending}
        onConfirm={() => deleting && run(() => deleteCategoryAction(deleting.id), () => setDeleting(null))}
      />
    </>
  );
}
