"use client";

import BrandLogo from "@/components/common/BrandLogo";
import { useCurrentUser } from "@/context/SessionContext";
import { useSidebar } from "@/context/SidebarContext";
import { Link, usePathname } from "@/i18n/navigation";
import { HorizontaLDots } from "@/icons";
import { can } from "@/lib/permissions";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";
import { activePath, NAV_GROUPS } from "./navigation";

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const user = useCurrentUser();
  const t = useTranslations("nav");
  const showText = isExpanded || isHovered || isMobileOpen;
  const current = activePath(pathname);

  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => can(user.role, i.permission)),
  })).filter((g) => g.items.length > 0);

  return (
    <aside
      className={cn(
        // La clase "dark" aplica estilos claros sobre el fondo negro del logo.
        "dark fixed top-0 start-0 z-99999 flex h-dvh flex-col border-e border-white/10 bg-black px-4 text-white transition-all duration-300 ease-in-out xl:z-50 print:hidden",
        showText ? "w-72.5" : "w-22.5",
        isMobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
        "xl:translate-x-0 xl:rtl:translate-x-0",
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Sidebar"
    >
      <div className={cn("flex items-center justify-center", showText ? "py-4" : "py-6")}>
        <Link href="/" aria-label="MASA MOTOS">
          {showText ? <BrandLogo variant="full" height={128} bare priority /> : <BrandLogo variant="mark" height={48} bare priority />}
        </Link>
      </div>

      <nav className="no-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto pb-6">
        {groups.map((group) => (
          <div key={group.key}>
            <h2
              className={cn(
                "mb-3 flex text-xs leading-5 font-semibold tracking-wider text-gray-500 uppercase",
                showText ? "justify-start ps-3" : "justify-center",
              )}
            >
              {showText ? t(`groups.${group.key}`) : <HorizontaLDots />}
            </h2>
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => {
                const active = item.path === current;
                return (
                  <li key={item.key}>
                    <Link
                      href={item.path}
                      className={cn(
                        "group menu-item",
                        active ? "menu-item-active" : "menu-item-inactive",
                        !showText && "xl:justify-center",
                      )}
                      aria-current={active ? "page" : undefined}
                      title={showText ? undefined : t(`items.${item.key}`)}
                    >
                      <span className={cn("[&>svg]:size-6", active ? "menu-item-icon-active" : "menu-item-icon-inactive")}>
                        {item.icon}
                      </span>
                      {showText && <span className="menu-item-text">{t(`items.${item.key}`)}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AppSidebar;
