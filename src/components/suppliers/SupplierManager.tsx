"use client";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import { DataTable, Td, Th, Tr } from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import FormModal from "@/components/common/FormModal";
import SearchBox from "@/components/common/SearchBox";
import { ActiveBadge } from "@/components/common/StatusBadges";
import UrlPagination from "@/components/common/UrlPagination";
import { iconBtn } from "@/components/products/ProductRowActions";
import Button from "@/components/ui/button/Button";
import { useActionRunner } from "@/hooks/useFormAction";
import { Link } from "@/i18n/navigation";
import { EyeIcon, PencilIcon, PlusIcon, TrashBinIcon, TruckIcon } from "@/icons";
import { deleteSupplierAction } from "@/lib/actions/suppliers";
import type { Paginated } from "@/lib/data/pagination";
import type { SupplierRow } from "@/lib/data/suppliers";
import { useTranslations } from "next-intl";
import { useState } from "react";
import SupplierForm from "./SupplierForm";

export default function SupplierManager({ data, filtered }: { data: Paginated<SupplierRow>; filtered: boolean }) {
  const t = useTranslations("suppliers");
  const tc = useTranslations("common");
  const [editing, setEditing] = useState<SupplierRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<SupplierRow | null>(null);
  const { run, pending } = useActionRunner();

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-gray-800">
        <SearchBox placeholder={t("searchPlaceholder")} className="sm:max-w-md sm:flex-1" />
        <Button size="sm" startIcon={<PlusIcon />} onClick={() => setEditing("new")}>
          {t("new")}
        </Button>
      </div>

      {data.rows.length === 0 ? (
        <EmptyState title={filtered ? tc("emptySearch") : t("empty")} icon={<TruckIcon />} />
      ) : (
        <>
          <DataTable>
            <thead>
              <tr>
                <Th>{t("fields.name")}</Th>
                <Th>{t("fields.taxId")}</Th>
                <Th>{t("fields.contactName")}</Th>
                <Th>{t("fields.phone")}</Th>
                <Th>{t("fields.city")}</Th>
                <Th align="center">{t("fields.products")}</Th>
                <Th>{tc("status")}</Th>
                <Th align="end">{tc("actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((s) => (
                <Tr key={s.id}>
                  <Td className="min-w-52">
                    <Link href={`/proveedores/${s.id}`} className="font-medium text-gray-800 hover:text-brand-600 dark:text-white/90">
                      {s.name}
                    </Link>
                    {s.email && <span className="block text-xs text-gray-500 dark:text-gray-400">{s.email}</span>}
                  </Td>
                  <Td className="font-mono whitespace-nowrap">{s.taxId}</Td>
                  <Td className="whitespace-nowrap">{s.contactName ?? "—"}</Td>
                  <Td className="whitespace-nowrap">{s.phone ?? "—"}</Td>
                  <Td className="whitespace-nowrap">{s.city ?? "—"}</Td>
                  <Td align="center">{s.productCount}</Td>
                  <Td>
                    <ActiveBadge active={s.active} />
                  </Td>
                  <Td align="end">
                    <div className="flex justify-end gap-1">
                      <Link href={`/proveedores/${s.id}`} className={iconBtn} aria-label={tc("details")} title={tc("details")}>
                        <EyeIcon className="fill-current" />
                      </Link>
                      <button type="button" className={iconBtn} onClick={() => setEditing(s)} aria-label={tc("edit")} title={tc("edit")}>
                        <PencilIcon className="fill-current" />
                      </button>
                      <button
                        type="button"
                        className={`${iconBtn} hover:text-error-600`}
                        onClick={() => setDeleting(s)}
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
          <UrlPagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} />
        </>
      )}

      <FormModal isOpen={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? t("new") : t("edit")} size="lg">
        {editing !== null && (
          <SupplierForm
            key={editing === "new" ? "new" : editing.id}
            supplier={editing === "new" ? undefined : editing}
            onSaved={() => setEditing(null)}
            onCancel={() => setEditing(null)}
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
        onConfirm={() => deleting && run(() => deleteSupplierAction(deleting.id), () => setDeleting(null))}
      />
    </>
  );
}
