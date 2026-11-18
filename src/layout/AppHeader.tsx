"use client";

import BrandLogo from "@/components/common/BrandLogo";
import ThemeToggleButton from "@/components/common/ThemeToggleButton";
import LanguageSwitcher from "@/components/header/LanguageSwitcher";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useCan } from "@/context/SessionContext";
import { useSidebar } from "@/context/SidebarContext";
import { Link, useRouter } from "@/i18n/navigation";
import { CloseIcon, MenuIcon, MoreDotIcon, SearchIcon } from "@/icons";
import type { LowStockItem } from "@/lib/data/analytics";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

const AppHeader: React.FC<{ alerts: LowStockItem[] }> = ({ alerts }) => {
  const t = useTranslations("header");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const canSeeProducts = useCan("products.view");

  const handleToggle = () => {
    if (window.innerWidth >= 1280) toggleSidebar();
    else toggleMobileSidebar();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    router.push(q ? `/productos?q=${encodeURIComponent(q)}` : "/productos");
  };

  return (
    <header className="sticky top-0 z-999 flex w-full border-gray-200 bg-white/95 backdrop-blur xl:border-b dark:border-gray-800 dark:bg-gray-900/95 print:hidden">
      <div className="flex grow flex-col items-center justify-between xl:flex-row xl:px-6">
        <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 sm:gap-4 xl:justify-normal xl:border-b-0 xl:px-0 xl:py-4 dark:border-gray-800">
          <button
            type="button"
            className={cn(
              "flex size-10 items-center justify-center rounded-lg border-gray-200 text-gray-500 lg:size-11 xl:border dark:border-gray-800 dark:text-gray-400",
              isMobileOpen && "bg-gray-100 dark:bg-white/5",
            )}
            onClick={handleToggle}
            aria-label={t("toggleSidebar")}
            data-testid="sidebar-toggle"
          >
            {isMobileOpen ? (
              <CloseIcon className="size-6" />
            ) : (
              <MenuIcon className="rtl:-scale-x-100" aria-hidden="true" />
            )}
          </button>

          <Link href="/" className="xl:hidden" aria-label="MASA MOTOS">
            <BrandLogo variant="lockup" height={36} />
          </Link>

          <div className="flex items-center gap-1.5 xl:hidden">
            <LanguageSwitcher compact />
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex size-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label={t("toggleMenu")}
              aria-expanded={menuOpen}
              data-testid="header-menu-toggle"
            >
              <MoreDotIcon className="size-6" />
            </button>
          </div>

          {canSeeProducts && (
            <form onSubmit={onSearch} className="hidden xl:block" role="search">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-gray-500 dark:text-gray-400">
                  <SearchIcon className="size-5" />
                </span>
                <input
                  ref={inputRef}
                  type="search"
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("searchPlaceholder")}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 ps-12 pe-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden xl:w-107.5 dark:border-gray-800 dark:bg-white/3 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
                <kbd className="pointer-events-none absolute inset-y-0 end-2.5 my-auto inline-flex h-7 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-1.75 text-xs text-gray-500 dark:border-gray-800 dark:bg-white/3 dark:text-gray-400">
                  Ctrl K
                </kbd>
              </div>
            </form>
          )}
        </div>

        <div
          className={cn(
            "w-full items-center justify-between gap-3 px-4 py-3 shadow-theme-md xl:flex xl:justify-end xl:px-0 xl:py-4 xl:shadow-none",
            menuOpen ? "flex" : "hidden",
          )}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            <div className="hidden xl:block">
              <LanguageSwitcher />
            </div>
            <ThemeToggleButton />
            <NotificationDropdown alerts={alerts} />
          </div>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
