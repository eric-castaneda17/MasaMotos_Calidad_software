import DataCard from "@/components/common/DataCard";
import PageHeader from "@/components/common/PageHeader";
import ProductFilters from "@/components/products/ProductFilters";
import ProductTable from "@/components/products/ProductTable";
import { Link } from "@/i18n/navigation";
import { PlusIcon } from "@/icons";
import { requirePageUser } from "@/lib/auth/dal";
import { param, parsePage, type SearchParams } from "@/lib/data/pagination";
import { getCatalogOptions, listProducts, PRODUCT_SORTS, type StockStatus } from "@/lib/data/products";
import { can } from "@/lib/permissions";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("products");
  return { title: t("title") };
}

const STATUSES = ["available", "low", "out", "inactive"] as const;

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requirePageUser("products.view");
  const sp = await searchParams;
  const t = await getTranslations("products");

  const q = param(sp, "q")?.trim().slice(0, 80) || undefined;
  const categoryId = Number(param(sp, "category")) || undefined;
  const brand = param(sp, "brand") || undefined;
  const statusParam = param(sp, "status");
  const status = STATUSES.find((s) => s === statusParam) as StockStatus | "inactive" | undefined;
  const sort = PRODUCT_SORTS.includes(param(sp, "sort") ?? "") ? param(sp, "sort") : undefined;

  const [options, data] = await Promise.all([
    getCatalogOptions(),
    listProducts({ q, categoryId, brand, status, sort, page: parsePage(param(sp, "page")) }),
  ]);
  const canManage = can(user.role, "products.manage");

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        crumbs={[{ label: t("title") }]}
        actions={
          canManage && (
            <Link
              href="/productos/nuevo"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-700"
              data-testid="new-product"
            >
              <PlusIcon className="size-4" />
              {t("new")}
            </Link>
          )
        }
      />
      <DataCard bodyClassName="p-0 sm:p-0">
        <div className="border-b border-gray-100 p-4 sm:p-5 dark:border-gray-800">
          <ProductFilters categories={options.categories} brands={options.brands} sorts={PRODUCT_SORTS} />
        </div>
        <ProductTable data={data} canManage={canManage} filtered={!!(q || categoryId || brand || status)} />
      </DataCard>
    </>
  );
}
