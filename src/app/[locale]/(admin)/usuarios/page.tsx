import DataCard from "@/components/common/DataCard";
import PageHeader from "@/components/common/PageHeader";
import UserManager from "@/components/users/UserManager";
import { requirePageUser } from "@/lib/auth/dal";
import { param, type SearchParams } from "@/lib/data/pagination";
import { listUsers } from "@/lib/data/users";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("users");
  return { title: t("title") };
}

export default async function UsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePageUser("users.manage");
  const sp = await searchParams;
  const [t, rows] = await Promise.all([
    getTranslations("users"),
    listUsers(param(sp, "q")?.trim().slice(0, 80) || undefined),
  ]);

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} crumbs={[{ label: t("title") }]} />
      <DataCard bodyClassName="p-0 sm:p-0">
        <UserManager rows={rows} />
      </DataCard>
    </>
  );
}
