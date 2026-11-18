"use client";

import BrandLogo from "@/components/common/BrandLogo";
import GridShape from "@/components/common/GridShape";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function NotFound() {
  const t = useTranslations("notFound");
  const tc = useTranslations("common");

  return (
    <div className="relative z-1 flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      <GridShape />
      <div className="mx-auto w-full max-w-60.5 text-center sm:max-w-118">
        <div className="mb-6 flex justify-center">
          <BrandLogo variant="full" height={120} />
        </div>
        <h1 className="mb-8 text-title-md font-bold text-gray-800 xl:text-title-2xl dark:text-white/90">
          {t("error")}
        </h1>
        <Image src="/images/error/404.svg" alt="404" className="dark:hidden" width={472} height={152} />
        <Image src="/images/error/404-dark.svg" alt="404" className="hidden dark:block" width={472} height={152} />
        <p className="mt-10 mb-6 text-base text-gray-700 sm:text-lg dark:text-gray-400">{t("message")}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-3.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-700"
        >
          {t("backHome")}
        </Link>
      </div>
      <p className="absolute bottom-6 start-1/2 -translate-x-1/2 text-center text-sm text-gray-500 rtl:translate-x-1/2 dark:text-gray-400">
        {tc("copyright", { year: new Date().getFullYear() })}
      </p>
    </div>
  );
}
