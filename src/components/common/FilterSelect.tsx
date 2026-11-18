"use client";

import SelectInput, { type SelectOption } from "@/components/form/SelectInput";
import { useUrlParams } from "@/hooks/useUrlParams";

interface FilterSelectProps {
  param: string;
  options: SelectOption[];
  placeholder: string;
  ariaLabel?: string;
  className?: string;
}

export default function FilterSelect({ param, options, placeholder, ariaLabel, className }: FilterSelectProps) {
  const { searchParams, setParams } = useUrlParams();
  return (
    <SelectInput
      name={`filter-${param}`}
      aria-label={ariaLabel ?? placeholder}
      value={searchParams.get(param) ?? ""}
      onChange={(e) => setParams({ [param]: e.target.value || undefined })}
      options={options}
      placeholder={placeholder}
      className={className}
    />
  );
}
