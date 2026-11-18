import BrandLogo from "@/components/common/BrandLogo";
import GridShape from "@/components/common/GridShape";
import ThemeToggleButton from "@/components/common/ThemeToggleButton";
import LanguageSwitcher from "@/components/header/LanguageSwitcher";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="relative z-1 bg-white dark:bg-gray-900">
      <div className="relative flex min-h-dvh w-full flex-col justify-center lg:flex-row">
        <div className="absolute end-4 top-4 z-10 sm:end-6 sm:top-6">
          <LanguageSwitcher />
        </div>
        {children}
        <div className="hidden w-full items-center bg-black lg:grid lg:w-1/2">
          <div className="relative z-1 flex items-center justify-center">
            <GridShape />
            <div className="flex max-w-md flex-col items-center text-center">
              <BrandLogo variant="full" height={300} bare priority />
              <div className="mt-6 h-1 w-24 rounded-full bg-gradient-to-r from-navy-500 via-white to-brand-500" />
              <p className="mt-5 text-lg font-semibold text-white">{t("brandTitle")}</p>
              <p className="mt-2 text-sm text-white/60">{t("brandText")}</p>
            </div>
          </div>
        </div>
        <div className="fixed end-6 bottom-6 z-50 hidden sm:block">
          <ThemeToggleButton variant="floating" />
        </div>
      </div>
    </div>
  );
}
