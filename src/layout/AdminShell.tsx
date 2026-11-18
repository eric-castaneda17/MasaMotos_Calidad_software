"use client";

import { useSidebar } from "@/context/SidebarContext";
import type { LowStockItem } from "@/lib/data/analytics";
import { cn } from "@/utils";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import Backdrop from "./Backdrop";

export default function AdminShell({
  alerts,
  children,
}: {
  alerts: LowStockItem[];
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />
      <div
        className={cn(
          "min-w-0 flex-1 transition-all duration-300 ease-in-out print:ms-0",
          isExpanded || isHovered ? "xl:ms-72.5" : "xl:ms-22.5",
        )}
      >
        <AppHeader alerts={alerts} />
        <main className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
