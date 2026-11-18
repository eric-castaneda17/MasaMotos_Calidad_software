import PageHeader from "@/components/common/PageHeader";
import ReportView from "@/components/reports/ReportView";
import { requirePageUser } from "@/lib/auth/dal";
import { getReportData } from "@/lib/data/analytics";
import { param, parsePage, type SearchParams } from "@/lib/data/pagination";
import { listSales } from "@/lib/data/sales";
import { resolveRange } from "@/lib/dates";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reports");
  return { title: t("title") };
}

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePageUser("reports.view");
  const sp = await searchParams;
  const range = resolveRange(param(sp, "from"), param(sp, "to"));

  const [t, data, history] = await Promise.all([
    getTranslations("reports"),
    getReportData(range.start, range.end),
    listSales({ start: range.start, end: range.end, status: "COMPLETED", page: parsePage(param(sp, "page")) }),
  ]);

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} crumbs={[{ label: t("title") }]} />
      <ReportView data={data} history={history} fromDay={range.fromDay} toDay={range.toDay} />
    </>
  );
}
