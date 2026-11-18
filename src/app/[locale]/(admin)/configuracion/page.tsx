import PageHeader from "@/components/common/PageHeader";
import PaymentMethodsManager from "@/components/settings/PaymentMethodsManager";
import SettingsForm from "@/components/settings/SettingsForm";
import { requirePageUser } from "@/lib/auth/dal";
import { getPaymentMethods, getSettings } from "@/lib/data/settings";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePageUser("settings.manage");
  const [t, settings, methods] = await Promise.all([getTranslations("settings"), getSettings(), getPaymentMethods(false)]);

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} crumbs={[{ label: t("title") }]} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SettingsForm settings={settings} />
        </div>
        <PaymentMethodsManager methods={methods} />
      </div>
    </>
  );
}
