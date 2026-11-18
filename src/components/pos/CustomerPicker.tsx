"use client";

import FormModal from "@/components/common/FormModal";
import CustomerForm from "@/components/customers/CustomerForm";
import { useModal } from "@/hooks/useModal";
import { PlusIcon, SearchIcon, UserCircleIcon } from "@/icons";
import { type CustomerOption, searchCustomersAction } from "@/lib/actions/customers";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

interface CustomerPickerProps {
  value: CustomerOption | null;
  onChange: (c: CustomerOption | null) => void;
  error?: boolean;
}

export default function CustomerPicker({ value, onChange, error }: CustomerPickerProps) {
  const t = useTranslations("pos.customer");
  const tCust = useTranslations("customers");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerOption[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modal = useModal();

  const onSearch = (v: string) => {
    setQuery(v);
    if (timer.current) clearTimeout(timer.current);
    if (!v.trim()) {
      setResults(null);
      return;
    }
    timer.current = setTimeout(() => {
      startTransition(async () => setResults(await searchCustomersAction(v)));
    }, 250);
  };

  const select = (c: CustomerOption) => {
    onChange(c);
    setQuery("");
    setResults(null);
  };

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-white/3" data-testid="pos-selected-customer">
          <UserCircleIcon className="size-8 shrink-0 text-navy-600 dark:text-navy-300" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{value.fullName}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {value.documentType} {value.documentNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            {t("change")}
          </button>
        </div>
      ) : (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-gray-400">
            {isPending ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <SearchIcon className="size-5" />
            )}
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            aria-invalid={error || undefined}
            className={`h-11 w-full rounded-lg border bg-transparent ps-11 pe-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:bg-gray-900 dark:text-white/90 ${
              error
                ? "border-error-500 focus:ring-error-500/20"
                : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700"
            }`}
            data-testid="pos-customer-search"
          />
          {results && (
            <ul className="absolute inset-x-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark">
              {results.length === 0 ? (
                <li className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">{t("noResults")}</li>
              ) : (
                results.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => select(c)}
                      className="w-full rounded-lg px-3 py-2 text-start hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                      <span className="block text-sm font-medium text-gray-800 dark:text-white/90">{c.fullName}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {c.documentType} {c.documentNumber}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
          {error && <p className="mt-1.5 text-xs text-error-600 dark:text-error-400">{t("required")}</p>}
        </div>
      )}
      <button
        type="button"
        onClick={modal.openModal}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-navy-700 hover:text-navy-900 dark:text-navy-300"
      >
        <PlusIcon className="size-4" />
        {t("new")}
      </button>

      <FormModal isOpen={modal.isOpen} onClose={modal.closeModal} title={tCust("new")} size="lg">
        <CustomerForm
          onCancel={modal.closeModal}
          onSaved={(c) => {
            if (c) onChange(c);
            modal.closeModal();
          }}
        />
      </FormModal>
    </div>
  );
}
