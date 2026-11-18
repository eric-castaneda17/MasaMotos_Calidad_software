import DataCard from "@/components/common/DataCard";
import PageHeader from "@/components/common/PageHeader";
import CustomerManager from "@/components/customers/CustomerManager";
import { requirePageUser } from "@/lib/auth/dal";
import { listCustomers } from "@/lib/data/customers";
import { param, parsePage, type SearchParams } from "@/lib/data/pagination";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("customers");
  return { title: t("title") };
}

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePageUser("customers.view");
  const sp = await searchParams;
  const q = param(sp, "q")?.trim().slice(0, 80) || undefined;
  const [t, data] = await Promise.all([
    getTranslations("customers"),
    listCustomers({ q, page: parsePage(param(sp, "page")) }),
  ]);

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} crumbs={[{ label: t("title") }]} />
      <DataCard bodyClassName="p-0 sm:p-0">
        <CustomerManager data={data} filtered={!!q} />
      </DataCard>
    </>
  );
}
