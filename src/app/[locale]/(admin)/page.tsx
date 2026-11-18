import PageHeader from "@/components/common/PageHeader";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import RecentMovements from "@/components/dashboard/RecentMovements";
import SalesOverview from "@/components/dashboard/SalesOverview";
import StockAlerts from "@/components/dashboard/StockAlerts";
import TopProducts from "@/components/dashboard/TopProducts";
import { Link } from "@/i18n/navigation";
import { CartIcon, PlusIcon } from "@/icons";
import { requirePageUser } from "@/lib/auth/dal";
import { getDashboardData } from "@/lib/data/analytics";
import { can } from "@/lib/permissions";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requirePageUser("dashboard.view");
  const [t, data] = await Promise.all([getTranslations("dashboard"), getDashboardData()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("greeting", { name: user.name.split(" ")[0] })}
        subtitle={t("subtitle")}
        actions={
          <>
            {can(user.role, "products.manage") && (
              <Link
                href="/productos/nuevo"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/5"
              >
                <PlusIcon className="size-4" />
                {t("quickActions.newProduct")}
              </Link>
            )}
            <Link
              href="/ventas/nueva"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-700"
            >
              <CartIcon className="size-5" />
              {t("quickActions.newSale")}
            </Link>
          </>
        }
      />

      <DashboardMetrics data={data} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <SalesOverview daily={data.daily} monthly={data.monthly} />
        </div>
        <TopProducts products={data.topProducts} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RecentMovements movements={data.recentMovements} />
        <StockAlerts items={data.lowStock} />
      </div>
    </div>
  );
}
