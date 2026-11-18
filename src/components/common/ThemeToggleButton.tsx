"use client";

import { useTheme } from "@/context/ThemeContext";
import { MoonIcon, SunIcon } from "@/icons";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";

const VARIANTS = {
  header:
    "size-11 border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
  floating: "size-14 bg-brand-500 text-white hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-600",
};

export default function ThemeToggleButton({ variant = "header" }: { variant?: keyof typeof VARIANTS }) {
  const { toggleTheme } = useTheme();
  const t = useTranslations("header");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("toggleTheme")}
      className={cn("relative flex items-center justify-center rounded-full transition-colors", VARIANTS[variant])}
    >
      <SunIcon className="hidden size-5 dark:block" />
      <MoonIcon className="size-5 dark:hidden" />
    </button>
  );
}
