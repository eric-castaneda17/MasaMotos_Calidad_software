import PageHeader from "@/components/common/PageHeader";
import ProfileForms from "@/components/users/ProfileForms";
import { requirePageUser } from "@/lib/auth/dal";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profile");
  return { title: t("title") };
}

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePageUser();
  const t = await getTranslations("profile");
  return (
    <>
      <PageHeader title={t("title")} crumbs={[{ label: t("title") }]} />
      <ProfileForms />
    </>
  );
}
