"use client";

import DateRangeFilter from "@/components/common/DateRangeFilter";
import FilterSelect from "@/components/common/FilterSelect";
import SearchBox from "@/components/common/SearchBox";
import { useUrlParams } from "@/hooks/useUrlParams";
import { useTranslations } from "next-intl";

export default function SalesFilters({ searchPlaceholder }: { searchPlaceholder: string }) {
  const t = useTranslations("sales");
  const tc = useTranslations("common");
  const { searchParams, setParams } = useUrlParams();
  const hasFilters = ["q", "status", "from", "to"].some((k) => searchParams.get(k));

  return (
    <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-12">
      <SearchBox placeholder={searchPlaceholder} className="lg:col-span-5" />
      <FilterSelect
        param="status"
        placeholder={t("allStatuses")}
        options={(["COMPLETED", "VOIDED"] as const).map((s) => ({ value: s, label: t(`status.${s}`) }))}
        className="lg:col-span-2"
      />
      <DateRangeFilter className="lg:col-span-5" />
      {hasFilters && (
        <button
          type="button"
          onClick={() => setParams({ q: undefined, status: undefined, from: undefined, to: undefined })}
          className="justify-self-start text-sm font-medium text-brand-600 hover:text-brand-700 lg:col-span-12 dark:text-brand-400"
        >
          {tc("clearFilters")}
        </button>
      )}
    </div>
  );
}
