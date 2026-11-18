import DataCard from "@/components/common/DataCard";
import PageHeader from "@/components/common/PageHeader";
import SupplierManager from "@/components/suppliers/SupplierManager";
import { requirePageUser } from "@/lib/auth/dal";
import { param, parsePage, type SearchParams } from "@/lib/data/pagination";
import { listSuppliers } from "@/lib/data/suppliers";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("suppliers");
  return { title: t("title") };
}

export default async function SuppliersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePageUser("suppliers.manage");
  const sp = await searchParams;
  const q = param(sp, "q")?.trim().slice(0, 80) || undefined;
  const [t, data] = await Promise.all([
    getTranslations("suppliers"),
    listSuppliers({ q, page: parsePage(param(sp, "page")) }),
  ]);

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} crumbs={[{ label: t("title") }]} />
      <DataCard bodyClassName="p-0 sm:p-0">
        <SupplierManager data={data} filtered={!!q} />
      </DataCard>
    </>
  );
}
