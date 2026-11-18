import CategoryManager from "@/components/categories/CategoryManager";
import DataCard from "@/components/common/DataCard";
import PageHeader from "@/components/common/PageHeader";
import { requirePageUser } from "@/lib/auth/dal";
import { listCategories } from "@/lib/data/categories";
import { param, type SearchParams } from "@/lib/data/pagination";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("categories");
  return { title: t("title") };
}

export default async function CategoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePageUser("categories.manage");
  const sp = await searchParams;
  const q = param(sp, "q")?.trim().slice(0, 80) || undefined;
  const [t, rows] = await Promise.all([getTranslations("categories"), listCategories(q)]);

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} crumbs={[{ label: t("title") }]} />
      <DataCard bodyClassName="p-0 sm:p-0">
        <CategoryManager rows={rows} filtered={!!q} />
      </DataCard>
    </>
  );
}
