"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/** Filtros, búsqueda y página viven en la URL; cualquier cambio de filtro reinicia la paginación. */
export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParams = useCallback(
    (updates: Record<string, string | undefined | null>, resetPage = true) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (resetPage && !("page" in updates)) next.delete("page");
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  return { searchParams, setParams, isPending };
}
