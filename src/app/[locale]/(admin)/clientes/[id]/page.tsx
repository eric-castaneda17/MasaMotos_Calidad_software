import DataCard from "@/components/common/DataCard";
import MetricCard from "@/components/common/MetricCard";
import PageHeader from "@/components/common/PageHeader";
import CustomerEditButton from "@/components/customers/CustomerEditButton";
import SalesTable from "@/components/sales/SalesTable";
import { CalenderIcon, CartIcon, DollarLineIcon } from "@/icons";
import { requirePageUser } from "@/lib/auth/dal";
import { getCustomer } from "@/lib/data/customers";
import { param, parsePage, type SearchParams } from "@/lib/data/pagination";
import { listSales } from "@/lib/data/sales";
import { formatDate, formatMoney, formatNumber } from "@/lib/money";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("customers");
  return { title: t("detail") };
}

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: SearchParams;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requirePageUser("customers.view");
  const customerId = Number(id);
  if (!Number.isInteger(customerId) || customerId <= 0) notFound();
  const sp = await searchParams;

  const [t, customer, sales] = await Promise.all([
    getTranslations("customers"),
    getCustomer(customerId),
    listSales({ customerId, page: parsePage(param(sp, "page")) }),
  ]);
  if (!customer) notFound();

  const info: [string, string][] = [
    [t("fields.documentType"), t(`documentTypes.${customer.documentType}`)],
    [t("fields.documentNumber"), customer.documentNumber],
    [t("fields.phone"), customer.phone ?? "—"],
    [t("fields.email"), customer.email ?? "—"],
    [t("fields.address"), customer.address ?? "—"],
    [t("fields.since"), formatDate(customer.createdAt, locale)],
  ];

  return (
    <>
      <PageHeader
        title={customer.fullName}
        subtitle={`${customer.documentType} ${customer.documentNumber}`}
        crumbs={[{ label: t("title"), href: "/clientes" }, { label: customer.fullName }]}
        actions={<CustomerEditButton customer={customer} />}
      />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard tone="navy" icon={<CartIcon />} label={t("fields.purchases")} value={formatNumber(customer.purchases, locale)} />
        <MetricCard tone="brand" icon={<DollarLineIcon />} label={t("fields.totalSpent")} value={formatMoney(customer.totalSpent, locale)} />
        <MetricCard
          tone="gray"
          icon={<CalenderIcon />}
          label={t("fields.lastPurchase")}
          value={customer.lastPurchase ? formatDate(customer.lastPurchase, locale) : "—"}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <DataCard title={t("detail")}>
          <dl className="space-y-3">
            {info.map(([label, value]) => (
              <div key={label} className="border-b border-gray-100 pb-2.5 last:border-0 dark:border-gray-800">
                <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="mt-0.5 text-sm break-words text-gray-800 dark:text-white/90">{value}</dd>
              </div>
            ))}
          </dl>
        </DataCard>
        <DataCard title={t("purchaseHistory")} className="xl:col-span-2" bodyClassName="p-0 sm:p-0">
          <SalesTable data={sales} emptyText={t("noPurchases")} showCustomer={false} />
        </DataCard>
      </div>
    </>
  );
}
