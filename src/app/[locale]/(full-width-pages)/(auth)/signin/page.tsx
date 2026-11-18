import SignInForm from "@/components/auth/SignInForm";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("title") };
}

export default async function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SignInForm />;
}
