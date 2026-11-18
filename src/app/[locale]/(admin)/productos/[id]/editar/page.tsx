import PageHeader from "@/components/common/PageHeader";
import ProductForm from "@/components/products/ProductForm";
import { requirePageUser } from "@/lib/auth/dal";
import { getCatalogOptions, getProduct } from "@/lib/data/products";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("products");
  return { title: t("edit") };
}

export default async function EditProductPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requirePageUser("products.manage");
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();

  const [t, product, options] = await Promise.all([
    getTranslations("products"),
    getProduct(productId),
    getCatalogOptions(),
  ]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={t("edit")}
        subtitle={`${product.code} · ${product.name}`}
        crumbs={[
          { label: t("title"), href: "/productos" },
          { label: product.name, href: `/productos/${product.id}` },
          { label: t("edit") },
        ]}
      />
      <ProductForm product={product} categories={options.categories} suppliers={options.suppliers} />
    </>
  );
}
