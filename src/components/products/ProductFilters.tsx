"use client";

import FilterSelect from "@/components/common/FilterSelect";
import SearchBox from "@/components/common/SearchBox";
import { useUrlParams } from "@/hooks/useUrlParams";
import { useTranslations } from "next-intl";

interface ProductFiltersProps {
  categories: { id: number; name: string }[];
  brands: string[];
  sorts: string[];
}

export default function ProductFilters({ categories, brands, sorts }: ProductFiltersProps) {
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const { searchParams, setParams } = useUrlParams();
  const hasFilters = ["q", "category", "brand", "status", "sort"].some((k) => searchParams.get(k));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
      <SearchBox placeholder={t("filters.searchPlaceholder")} className="sm:col-span-2 lg:col-span-4" />
      <FilterSelect
        param="category"
        placeholder={t("filters.allCategories")}
        options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
        className="lg:col-span-2"
      />
      <FilterSelect
        param="brand"
        placeholder={t("filters.allBrands")}
        options={brands.map((b) => ({ value: b, label: b }))}
        className="lg:col-span-2"
      />
      <FilterSelect
        param="status"
        placeholder={t("filters.allStatuses")}
        options={(["available", "low", "out", "inactive"] as const).map((s) => ({
          value: s,
          label: t(`stockStatus.${s}`),
        }))}
        className="lg:col-span-2"
      />
      <FilterSelect
        param="sort"
        placeholder={t("filters.sortBy")}
        ariaLabel={t("filters.sortBy")}
        options={sorts.map((s) => ({ value: s, label: t(`sort.${s}`) }))}
        className="lg:col-span-2"
      />
      {hasFilters && (
        <button
          type="button"
          onClick={() => setParams({ q: undefined, category: undefined, brand: undefined, status: undefined, sort: undefined })}
          className="justify-self-start text-sm font-medium text-brand-600 hover:text-brand-700 sm:col-span-2 lg:col-span-12 dark:text-brand-400"
        >
          {tc("clearFilters")}
        </button>
      )}
    </div>
  );
}
