"use client";

import { useCurrentUser } from "@/context/SessionContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { Link } from "@/i18n/navigation";
import { ChevronDownIcon, LogoutIcon, SettingsIcon, UserCircleIcon } from "@/icons";
import { logoutAction } from "@/lib/actions/auth";
import { can } from "@/lib/permissions";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function UserDropdown() {
  const t = useTranslations("userDropdown");
  const tRoles = useTranslations("roles");
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const item =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300"
        aria-expanded={open}
        data-testid="user-menu"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-navy-700 text-sm font-bold text-white dark:bg-navy-600">
          {initials(user.name)}
        </span>
        <span className="hidden text-start sm:block">
          <span className="block max-w-36 truncate text-sm font-semibold">{user.name}</span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">{tRoles(user.role)}</span>
        </span>
        <ChevronDownIcon className={cn("size-5 text-gray-500 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute end-0 z-40 mt-3 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark">
          <div className="border-b border-gray-200 px-3 pb-3 dark:border-gray-800">
            <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{user.name}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
          <ul className="flex flex-col gap-1 py-3">
            <li>
              <Link href="/perfil" className={item} onClick={() => setOpen(false)}>
                <UserCircleIcon className="size-5 text-gray-500" />
                {t("profile")}
              </Link>
            </li>
            {can(user.role, "settings.manage") && (
              <li>
                <Link href="/configuracion" className={item} onClick={() => setOpen(false)}>
                  <SettingsIcon className="size-5 text-gray-500" />
                  {t("settings")}
                </Link>
              </li>
            )}
          </ul>
          <button
            type="button"
            className={cn(item, "border-t border-gray-200 pt-3 text-brand-700 dark:border-gray-800 dark:text-brand-400")}
            disabled={isPending}
            onClick={() => startTransition(() => logoutAction())}
            data-testid="logout"
          >
            <LogoutIcon className="size-5" />
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
