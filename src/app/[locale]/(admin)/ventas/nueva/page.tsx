import PageHeader from "@/components/common/PageHeader";
import PosScreen from "@/components/pos/PosScreen";
import { requirePageUser } from "@/lib/auth/dal";
import { getPaymentMethods, getSettings } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pos");
  return { title: t("title") };
}

/** Documento estándar de "Consumidor final" usado como cliente por defecto. */
const FINAL_CONSUMER_DOC = "222222222222";

export default async function NewSalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePageUser("sales.create");

  const [t, tNav, settings, methods, defaultCustomer] = await Promise.all([
    getTranslations("pos"),
    getTranslations("nav.items"),
    getSettings(),
    getPaymentMethods(true),
    createClient().then(async (supabase) => {
      const { data } = await supabase
        .from("customers")
        .select("id, full_name, document_type, document_number, phone, email")
        .eq("document_number", FINAL_CONSUMER_DOC)
        .maybeSingle();
      return data
        ? {
            id: data.id as number,
            fullName: data.full_name as string,
            documentType: data.document_type as string,
            documentNumber: data.document_number as string,
            phone: data.phone as string | null,
            email: data.email as string | null,
          }
        : null;
    }),
  ]);

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        crumbs={[{ label: tNav("sales"), href: "/ventas" }, { label: t("title") }]}
      />
      <PosScreen
        methods={methods.map((m) => ({ id: m.id, code: m.code, name: m.name }))}
        taxRate={settings.taxRate}
        taxEnabled={settings.taxEnabled}
        defaultCustomer={defaultCustomer}
      />
    </>
  );
}
