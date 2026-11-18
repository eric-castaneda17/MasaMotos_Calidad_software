"use client";

import DataCard from "@/components/common/DataCard";
import { DataTable, Td, Th, Tr } from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import FormModal from "@/components/common/FormModal";
import { ActiveBadge, StockBadge } from "@/components/common/StatusBadges";
import Button from "@/components/ui/button/Button";
import { useFormat } from "@/hooks/useFormat";
import { useModal } from "@/hooks/useModal";
import { Link } from "@/i18n/navigation";
import { BoxCubeIcon, MailIcon, PencilIcon } from "@/icons";
import type { SupplierDetail } from "@/lib/data/suppliers";
import { useTranslations } from "next-intl";
import SupplierForm from "./SupplierForm";

export function SupplierEditButton({ supplier }: { supplier: SupplierDetail }) {
  const t = useTranslations("suppliers");
  const tc = useTranslations("common");
  const modal = useModal();
  return (
    <>
      <Button variant="outline" size="sm" startIcon={<PencilIcon className="fill-current" />} onClick={modal.openModal}>
        {tc("edit")}
      </Button>
      <FormModal isOpen={modal.isOpen} onClose={modal.closeModal} title={t("edit")} size="lg">
        <SupplierForm supplier={supplier} onSaved={modal.closeModal} onCancel={modal.closeModal} />
      </FormModal>
    </>
  );
}

export default function SupplierDetailView({ supplier }: { supplier: SupplierDetail }) {
  const t = useTranslations("suppliers");
  const tp = useTranslations("products.fields");
  const f = useFormat();

  const info: [string, React.ReactNode][] = [
    [t("fields.taxId"), <span key="t" className="font-mono">{supplier.taxId}</span>],
    [t("fields.contactName"), supplier.contactName ?? "—"],
    [t("fields.phone"), supplier.phone ?? "—"],
    [
      t("fields.email"),
      supplier.email ? (
        <a key="e" href={`mailto:${supplier.email}`} className="inline-flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-400">
          <MailIcon className="size-4" />
          {supplier.email}
        </a>
      ) : (
        "—"
      ),
    ],
    [t("fields.address"), supplier.address ?? "—"],
    [t("fields.city"), supplier.city ?? "—"],
    [t("fields.active"), <ActiveBadge key="a" active={supplier.active} />],
  ];

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <DataCard title={t("contactInfo")}>
        <dl className="space-y-3">
          {info.map(([label, value]) => (
            <div key={label} className="border-b border-gray-100 pb-2.5 last:border-0 dark:border-gray-800">
              <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
              <dd className="mt-0.5 text-sm break-words text-gray-800 dark:text-white/90">{value}</dd>
            </div>
          ))}
        </dl>
      </DataCard>
      <DataCard title={t("productsTitle")} subtitle={String(supplier.products.length)} className="xl:col-span-2" bodyClassName="p-0 sm:p-0">
        {supplier.products.length === 0 ? (
          <EmptyState title={t("noProducts")} icon={<BoxCubeIcon />} />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>{tp("name")}</Th>
                <Th>{tp("brand")}</Th>
                <Th align="end">{tp("purchasePrice")}</Th>
                <Th align="end">{tp("stock")}</Th>
                <Th>{tp("status")}</Th>
              </tr>
            </thead>
            <tbody>
              {supplier.products.map((p) => (
                <Tr key={p.id}>
                  <Td className="min-w-52">
                    <Link href={`/productos/${p.id}`} className="font-medium text-gray-800 hover:text-brand-600 dark:text-white/90">
                      {p.name}
                    </Link>
                    <span className="block font-mono text-xs text-gray-500">{p.code}</span>
                  </Td>
                  <Td>{p.brand}</Td>
                  <Td align="end">{f.money(p.purchasePrice)}</Td>
                  <Td align="end">{p.stock}</Td>
                  <Td>
                    <StockBadge status={p.status} active={p.active} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </DataCard>
    </div>
  );
}
