import PageHeader from "@/components/common/PageHeader";
import SupplierDetailView, { SupplierEditButton } from "@/components/suppliers/SupplierDetailView";
import { requirePageUser } from "@/lib/auth/dal";
import { getSupplier } from "@/lib/data/suppliers";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("suppliers");
  return { title: t("detail") };
}

export default async function SupplierDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requirePageUser("suppliers.manage");
  const supplierId = Number(id);
  if (!Number.isInteger(supplierId) || supplierId <= 0) notFound();
  const [t, supplier] = await Promise.all([getTranslations("suppliers"), getSupplier(supplierId)]);
  if (!supplier) notFound();

  return (
    <>
      <PageHeader
        title={supplier.name}
        subtitle={`${t("fields.taxId")}: ${supplier.taxId}`}
        crumbs={[{ label: t("title"), href: "/proveedores" }, { label: supplier.name }]}
        actions={<SupplierEditButton supplier={supplier} />}
      />
      <SupplierDetailView supplier={supplier} />
    </>
  );
}
