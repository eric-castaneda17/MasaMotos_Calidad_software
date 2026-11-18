import DataCard from "@/components/common/DataCard";
import MetricCard from "@/components/common/MetricCard";
import PageHeader from "@/components/common/PageHeader";
import InventoryFilters, { RegisterMovementButton } from "@/components/inventory/InventoryToolbar";
import MovementTable from "@/components/inventory/MovementTable";
import { Link } from "@/i18n/navigation";
import { AlertIcon, BoxCubeIcon, ErrorIcon } from "@/icons";
import { requirePageUser } from "@/lib/auth/dal";
import { getStockSummary } from "@/lib/data/analytics";
import { getProductOptionsForMovements, listMovements, MOVEMENT_TYPES, type MovementType } from "@/lib/data/inventory";
import { param, parsePage, type SearchParams } from "@/lib/data/pagination";
import { addDays, isValidDay, localDayStart } from "@/lib/dates";
import { formatNumber } from "@/lib/money";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inventory");
  return { title: t("title") };
}

export default async function InventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePageUser("inventory.manage");
  const sp = await searchParams;
  const typeParam = param(sp, "type");
  const type = MOVEMENT_TYPES.find((m) => m === typeParam) as MovementType | undefined;
  const from = param(sp, "from");
  const to = param(sp, "to");

  const [t, tm, products, movements, dash] = await Promise.all([
    getTranslations("inventory"),
    getTranslations("dashboard.metrics"),
    getProductOptionsForMovements(),
    listMovements({
      type,
      q: param(sp, "q")?.trim().slice(0, 80) || undefined,
      start: isValidDay(from) ? localDayStart(from) : undefined,
      end: isValidDay(to) ? addDays(localDayStart(to), 1) : undefined,
      page: parsePage(param(sp, "page")),
    }),
    getStockSummary(),
  ]);

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        crumbs={[{ label: t("title") }]}
        actions={<RegisterMovementButton products={products} />}
      />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard tone="navy" icon={<BoxCubeIcon />} label={tm("totalProducts")} value={formatNumber(dash.total, locale)} />
        <Link href="/productos?status=low" className="block">
          <MetricCard tone="warning" icon={<AlertIcon />} label={t("summary.lowStock")} value={formatNumber(dash.low, locale)} />
        </Link>
        <Link href="/productos?status=out" className="block">
          <MetricCard tone="error" icon={<ErrorIcon />} label={t("summary.outOfStock")} value={formatNumber(dash.out, locale)} />
        </Link>
      </div>
      <DataCard bodyClassName="p-0 sm:p-0">
        <div className="border-b border-gray-100 p-4 sm:p-5 dark:border-gray-800">
          <InventoryFilters />
        </div>
        <MovementTable data={movements} />
      </DataCard>
    </>
  );
}
