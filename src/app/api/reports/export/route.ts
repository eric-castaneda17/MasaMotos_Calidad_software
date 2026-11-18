import { routing, type Locale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/dal";
import { getReportData, lowStockProducts } from "@/lib/data/analytics";
import { listSales } from "@/lib/data/sales";
import { resolveRange } from "@/lib/dates";
import { formatDateTime } from "@/lib/money";
import { can } from "@/lib/permissions";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const TYPES = ["sales", "top", "lowstock", "daily"] as const;
type ExportType = (typeof TYPES)[number];

/** Escapa un valor CSV y neutraliza fórmulas (inyección CSV en Excel). */
function cell(v: string | number | null | undefined) {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s) && typeof v === "string") s = `'${s}`;
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const toCsv = (rows: (string | number | null)[][]) => "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  if (!can(user.role, "reports.view")) return new NextResponse(null, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const type = TYPES.find((t) => t === sp.get("type")) as ExportType | undefined;
  if (!type) return new NextResponse("Invalid type", { status: 400 });

  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  const locale: Locale = routing.locales.includes(cookieLocale as Locale) ? (cookieLocale as Locale) : routing.defaultLocale;
  const [tp, ts, ti, tr, tpm] = await Promise.all([
    getTranslations({ locale, namespace: "products.fields" }),
    getTranslations({ locale, namespace: "sales" }),
    getTranslations({ locale, namespace: "dashboard.topProducts" }),
    getTranslations({ locale, namespace: "reports.csv" }),
    getTranslations({ locale, namespace: "paymentMethods" }),
  ]);
  const range = resolveRange(sp.get("from") ?? undefined, sp.get("to") ?? undefined);
  const pay = (code: string, name: string) => (tpm.has(code as "CASH") ? tpm(code as "CASH") : name);

  let rows: (string | number | null)[][];
  if (type === "sales") {
    const data = await listSales({ start: range.start, end: range.end, page: 1, pageSize: 10_000 });
    rows = [
      [ts("fields.invoice"), ts("fields.date"), ts("fields.customer"), "ID", ts("fields.seller"), ts("fields.paymentMethod"), ts("fields.items"), ts("fields.total"), ts("fields.status")],
      ...data.rows.map((s) => [
        s.invoiceNumber,
        formatDateTime(s.createdAt, locale),
        s.customerName,
        s.customerDocument,
        s.sellerName,
        pay(s.paymentMethodCode, s.paymentMethodName),
        s.itemCount,
        s.total,
        ts(`status.${s.status}`),
      ]),
    ];
  } else if (type === "top") {
    const data = await getReportData(range.start, range.end);
    rows = [[tp("code"), tp("name"), ti("units"), ti("revenue")], ...data.topProducts.map((p) => [p.code, p.name, p.units, p.revenue])];
  } else if (type === "daily") {
    const data = await getReportData(range.start, range.end);
    rows = [[tr("day"), tr("count"), tr("total")], ...data.daily.map((d) => [d.key, d.count, d.total])];
  } else {
    const data = await lowStockProducts();
    rows = [
      [tp("code"), tp("name"), tp("category"), tp("brand"), tp("supplier"), tp("stock"), tp("minStock")],
      ...data.map((p) => [p.code, p.name, p.categoryName, p.brand, p.supplierName, p.stock, p.minStock]),
    ];
  }

  const filename = `masamotos-${type}-${range.fromDay}_${range.toDay}.csv`;
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
