"use client";

import { useClickOutside } from "@/hooks/useClickOutside";
import { getLanguage, languages } from "@/i18n/languages";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { CheckLineIcon, ChevronDownIcon } from "@/icons";
import { cn } from "@/utils";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState, useTransition } from "react";

function LanguageSwitcherInner({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("header");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const current = getLanguage(locale);
  const CurrentFlag = current.FlagIcon;

  const select = (id: Locale) => {
    setOpen(false);
    if (id === locale) return;
    const qs = searchParams.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { locale: id, scroll: false });
      router.refresh();
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("changeLanguage")}
        data-testid="language-switcher"
      >
        {isPending ? (
          <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <CurrentFlag className="size-5 rounded-full" />
        )}
        <span>{compact ? current.code : current.name}</span>
        <ChevronDownIcon className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("language")}
          className="absolute end-0 z-40 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
        >
          {languages.map((lang) => {
            const Flag = lang.FlagIcon;
            const selected = lang.id === locale;
            return (
              <li key={lang.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => select(lang.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                    selected
                      ? "bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5",
                  )}
                  data-testid={`language-option-${lang.id}`}
                >
                  <Flag className="size-5 rounded-full" />
                  <span className="flex-1 text-start">{lang.name}</span>
                  {selected && <CheckLineIcon className="size-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** useSearchParams requiere un límite de Suspense en páginas prerenderizadas (login). */
export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  return (
    <Suspense fallback={<div className="h-11 w-24 rounded-full border border-gray-200 dark:border-gray-800" />}>
      <LanguageSwitcherInner compact={compact} />
    </Suspense>
  );
}
