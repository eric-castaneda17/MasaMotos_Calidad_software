import PageHeader from "@/components/common/PageHeader";
import ProductForm from "@/components/products/ProductForm";
import { requirePageUser } from "@/lib/auth/dal";
import { getCatalogOptions } from "@/lib/data/products";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("products");
  return { title: t("new") };
}

export default async function NewProductPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePageUser("products.manage");
  const [t, options] = await Promise.all([getTranslations("products"), getCatalogOptions()]);

  return (
    <>
      <PageHeader title={t("new")} crumbs={[{ label: t("title"), href: "/productos" }, { label: t("new") }]} />
      <ProductForm categories={options.categories} suppliers={options.suppliers} />
    </>
  );
}
