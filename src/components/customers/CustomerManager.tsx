"use client";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import { DataTable, Td, Th, Tr } from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import FormModal from "@/components/common/FormModal";
import SearchBox from "@/components/common/SearchBox";
import UrlPagination from "@/components/common/UrlPagination";
import { iconBtn } from "@/components/products/ProductRowActions";
import Button from "@/components/ui/button/Button";
import { useActionRunner } from "@/hooks/useFormAction";
import { useFormat } from "@/hooks/useFormat";
import { Link } from "@/i18n/navigation";
import { EyeIcon, PencilIcon, PlusIcon, TrashBinIcon, UserCircleIcon } from "@/icons";
import { deleteCustomerAction } from "@/lib/actions/customers";
import type { CustomerRow } from "@/lib/data/customers";
import type { Paginated } from "@/lib/data/pagination";
import { useTranslations } from "next-intl";
import { useState } from "react";
import CustomerForm from "./CustomerForm";

export default function CustomerManager({ data, filtered }: { data: Paginated<CustomerRow>; filtered: boolean }) {
  const t = useTranslations("customers");
  const tc = useTranslations("common");
  const f = useFormat();
  const [editing, setEditing] = useState<CustomerRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<CustomerRow | null>(null);
  const { run, pending } = useActionRunner();

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-gray-800">
        <SearchBox placeholder={t("searchPlaceholder")} className="sm:max-w-md sm:flex-1" />
        <Button size="sm" startIcon={<PlusIcon />} onClick={() => setEditing("new")} data-testid="new-customer">
          {t("new")}
        </Button>
      </div>

      {data.rows.length === 0 ? (
        <EmptyState title={filtered ? tc("emptySearch") : t("empty")} icon={<UserCircleIcon />} />
      ) : (
        <>
          <DataTable>
            <thead>
              <tr>
                <Th>{t("fields.fullName")}</Th>
                <Th>{t("fields.document")}</Th>
                <Th>{t("fields.phone")}</Th>
                <Th>{t("fields.email")}</Th>
                <Th align="center">{t("fields.purchases")}</Th>
                <Th align="end">{t("fields.totalSpent")}</Th>
                <Th align="end">{tc("actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((c) => (
                <Tr key={c.id}>
                  <Td className="min-w-48">
                    <Link href={`/clientes/${c.id}`} className="font-medium text-gray-800 hover:text-brand-600 dark:text-white/90">
                      {c.fullName}
                    </Link>
                    {c.address && <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{c.address}</span>}
                  </Td>
                  <Td className="whitespace-nowrap">
                    <span className="text-xs text-gray-500">{c.documentType}</span> {c.documentNumber}
                  </Td>
                  <Td className="whitespace-nowrap">{c.phone ?? "—"}</Td>
                  <Td className="whitespace-nowrap">{c.email ?? "—"}</Td>
                  <Td align="center">{c.purchases}</Td>
                  <Td align="end" className="font-medium whitespace-nowrap">
                    {f.money(c.totalSpent)}
                  </Td>
                  <Td align="end">
                    <div className="flex justify-end gap-1">
                      <Link href={`/clientes/${c.id}`} className={iconBtn} aria-label={tc("details")} title={tc("details")}>
                        <EyeIcon className="fill-current" />
                      </Link>
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
          <UrlPagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} />
        </>
      )}

      <FormModal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? t("new") : t("edit")}
        size="lg"
      >
        {editing !== null && (
          <CustomerForm
            key={editing === "new" ? "new" : editing.id}
            customer={editing === "new" ? undefined : editing}
            onSaved={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        )}
      </FormModal>
      <ConfirmDialog
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t("confirmDeleteTitle")}
        message={t("confirmDelete", { name: deleting?.fullName ?? "" })}
        confirmLabel={tc("delete")}
        loading={pending}
        onConfirm={() => deleting && run(() => deleteCustomerAction(deleting.id), () => setDeleting(null))}
      />
    </>
  );
}
