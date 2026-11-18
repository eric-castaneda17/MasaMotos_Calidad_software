import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { isRtl } from "@/i18n/languages";
import { type Locale, routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Outfit } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";

const outfit = Outfit({
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: { default: t("appName"), template: `%s · ${t("appName")}` },
    description: t("appTagline"),
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale} dir={isRtl(locale as Locale) ? "rtl" : "ltr"} suppressHydrationWarning>
      <body className={`${outfit.className} bg-gray-50 dark:bg-gray-900`}>
        <NextIntlClientProvider>
          <ThemeProvider>
            <ToastProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </ToastProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
