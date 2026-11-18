"use client";

import DateRangeFilter from "@/components/common/DateRangeFilter";
import FilterSelect from "@/components/common/FilterSelect";
import SearchBox from "@/components/common/SearchBox";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useUrlParams } from "@/hooks/useUrlParams";
import { SwapIcon } from "@/icons";
import { useTranslations } from "next-intl";
import MovementFormModal, { type MovementProductOption } from "./MovementFormModal";

export function RegisterMovementButton({ products }: { products: MovementProductOption[] }) {
  const t = useTranslations("inventory");
  const modal = useModal();
  return (
    <>
      <Button size="sm" variant="secondary" startIcon={<SwapIcon />} onClick={modal.openModal} data-testid="register-movement">
        {t("registerMovement")}
      </Button>
      <MovementFormModal isOpen={modal.isOpen} onClose={modal.closeModal} products={products} />
    </>
  );
}

export default function InventoryFilters() {
  const t = useTranslations("inventory");
  const tc = useTranslations("common");
  const { searchParams, setParams } = useUrlParams();
  const hasFilters = ["q", "type", "from", "to"].some((k) => searchParams.get(k));

  return (
    <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-12">
      <SearchBox placeholder={t("filters.searchPlaceholder")} className="lg:col-span-5" />
      <FilterSelect
        param="type"
        placeholder={t("filters.allTypes")}
        options={(["ENTRY", "EXIT", "SALE", "VOID", "ADJUSTMENT"] as const).map((k) => ({ value: k, label: t(`types.${k}`) }))}
        className="lg:col-span-2"
      />
      <DateRangeFilter className="lg:col-span-5" />
      {hasFilters && (
        <button
          type="button"
          onClick={() => setParams({ q: undefined, type: undefined, from: undefined, to: undefined })}
          className="justify-self-start text-sm font-medium text-brand-600 hover:text-brand-700 lg:col-span-12 dark:text-brand-400"
        >
          {tc("clearFilters")}
        </button>
      )}
    </div>
  );
}
