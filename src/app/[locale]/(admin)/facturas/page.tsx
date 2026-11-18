import DataCard from "@/components/common/DataCard";
import PageHeader from "@/components/common/PageHeader";
import SalesFilters from "@/components/sales/SalesFilters";
import SalesTable from "@/components/sales/SalesTable";
import { requirePageUser } from "@/lib/auth/dal";
import type { SearchParams } from "@/lib/data/pagination";
import { saleFiltersFromParams } from "@/lib/data/sale-filters";
import { listSales } from "@/lib/data/sales";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("invoices");
  return { title: t("title") };
}

export default async function InvoicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePageUser("invoices.view");
  const [t, data] = await Promise.all([
    getTranslations("invoices"),
    searchParams.then((sp) => listSales(saleFiltersFromParams(sp))),
  ]);

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} crumbs={[{ label: t("title") }]} />
      <DataCard bodyClassName="p-0 sm:p-0">
        <div className="border-b border-gray-100 p-4 sm:p-5 dark:border-gray-800">
          <SalesFilters searchPlaceholder={t("searchPlaceholder")} />
        </div>
        <SalesTable data={data} emptyText={t("empty")} showSeller={false} />
      </DataCard>
    </>
  );
}
