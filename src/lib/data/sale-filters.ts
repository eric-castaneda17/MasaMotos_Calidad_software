import "server-only";

import { addDays, isValidDay, localDayStart } from "@/lib/dates";
import { param, parsePage } from "./pagination";
import type { SaleFilters } from "./sales";

export function saleFiltersFromParams(sp: Record<string, string | string[] | undefined>): SaleFilters {
  const from = param(sp, "from");
  const to = param(sp, "to");
  const status = param(sp, "status");
  return {
    q: param(sp, "q")?.trim().slice(0, 80) || undefined,
    status: status === "COMPLETED" || status === "VOIDED" ? status : undefined,
    start: isValidDay(from) ? localDayStart(from) : undefined,
    end: isValidDay(to) ? addDays(localDayStart(to), 1) : undefined,
    page: parsePage(param(sp, "page")),
  };
}
