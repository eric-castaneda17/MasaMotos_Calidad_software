import DataCard from "@/components/common/DataCard";
import PageHeader from "@/components/common/PageHeader";
import { ActiveBadge, StockBadge } from "@/components/common/StatusBadges";
import MovementTable from "@/components/inventory/MovementTable";
import ProductDetailActions from "@/components/products/ProductDetailActions";
import ProductThumb from "@/components/products/ProductThumb";
import { Link } from "@/i18n/navigation";
import { AlertIcon } from "@/icons";
import { requirePageUser } from "@/lib/auth/dal";
import { listMovements } from "@/lib/data/inventory";
import { param, parsePage, type SearchParams } from "@/lib/data/pagination";
import { getProduct, getProductSalesStats } from "@/lib/data/products";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/money";
import { can } from "@/lib/permissions";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("products");
  return { title: t("detail") };
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: SearchParams;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requirePageUser("products.view");
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();
  const sp = await searchParams;

  const [t, product, stats, movements] = await Promise.all([
    getTranslations("products"),
    getProduct(productId),
    getProductSalesStats(productId),
    listMovements({ productId, page: parsePage(param(sp, "page")) }),
  ]);
  if (!product) notFound();
  const canManage = can(user.role, "products.manage");
  const margin = product.salePrice > 0 ? ((product.salePrice - product.purchasePrice) / product.salePrice) * 100 : 0;

  const rows: [string, React.ReactNode][] = [
    [t("fields.code"), <span key="c" className="font-mono">{product.code}</span>],
    [t("fields.category"), product.category.name],
    [t("fields.brand"), product.brand],
    [t("fields.compatibleModel"), product.compatibleModel ?? "—"],
    [
      t("fields.supplier"),
      product.supplier ? (
        canManage ? (
          <Link key="s" href={`/proveedores/${product.supplier.id}`} className="text-brand-600 hover:underline dark:text-brand-400">
            {product.supplier.name}
          </Link>
        ) : (
          product.supplier.name
        )
      ) : (
        t("noSupplier")
      ),
    ],
    ...(canManage
      ? ([[t("fields.purchasePrice"), formatMoney(product.purchasePrice, locale)]] as [string, React.ReactNode][])
      : []),
    [t("fields.salePrice"), <b key="p">{formatMoney(product.salePrice, locale)}</b>],
    ...(canManage ? ([[t("fields.margin"), `${margin.toFixed(1)}%`]] as [string, React.ReactNode][]) : []),
    [t("fields.minStock"), formatNumber(product.minStock, locale)],
    [t("fields.updatedAt"), formatDateTime(product.updatedAt, locale)],
  ];

  return (
    <>
      <PageHeader
        title={product.name}
        subtitle={product.description ?? undefined}
        crumbs={[{ label: t("title"), href: "/productos" }, { label: product.name }]}
        actions={
          canManage && (
            <ProductDetailActions
              product={{ id: product.id, code: product.code, name: product.name, stock: product.stock }}
            />
          )
        }
      />

      {product.active && product.status !== "available" && (
        <div
          role="alert"
          className={
            product.status === "out"
              ? "mb-6 flex items-center gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-300"
              : "mb-6 flex items-center gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/15 dark:text-warning-300"
          }
        >
          <AlertIcon className="size-5 shrink-0" />
          {product.status === "out" ? t("outAlert") : t("stockAlert")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard>
          <ProductThumb
            productId={product.id}
            hasImage={product.hasImage}
            version={product.updatedAt.toISOString()}
            name={product.name}
            size="lg"
          />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/5">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("fields.stock")}</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums dark:text-white">{product.stock}</p>
            </div>
            <div className="flex flex-col items-start justify-center gap-2 rounded-xl bg-gray-50 p-4 dark:bg-white/5">
              <StockBadge status={product.status} active={product.active} />
              <ActiveBadge active={product.active} />
            </div>
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/5">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("salesStats.unitsSold")}</p>
              <p className="text-lg font-bold text-gray-900 tabular-nums dark:text-white">{formatNumber(stats.unitsSold, locale)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/5">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("salesStats.revenue")}</p>
              <p className="text-lg font-bold text-gray-900 tabular-nums dark:text-white">{formatMoney(stats.revenue, locale)}</p>
            </div>
          </div>
        </DataCard>

        <DataCard title={t("detail")} className="lg:col-span-2">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="min-w-0 border-b border-gray-100 pb-3 dark:border-gray-800">
                <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="mt-0.5 truncate text-sm text-gray-800 dark:text-white/90">{value}</dd>
              </div>
            ))}
          </dl>
        </DataCard>
      </div>

      <DataCard title={t("movementsTitle")} className="mt-6" bodyClassName="p-0 sm:p-0">
        <MovementTable data={movements} showProduct={false} />
      </DataCard>
    </>
  );
}
