"use client";

import { ChevronDownIcon } from "@/icons";
import { cn } from "@/utils";
import FormField, { inputClass } from "./FormField";

export type SelectOption = { value: string; label: string; disabled?: boolean };

interface SelectInputProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  name: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
}

/** Sin `label` se renderiza solo el control. */
export default function SelectInput({
  label,
  name,
  options,
  placeholder,
  error,
  hint,
  required,
  className,
  id,
  ...rest
}: SelectInputProps) {
  const selectId = id ?? name;
  const control = (
    <div className={cn("relative", !label && className)}>
      <select
        id={selectId}
        name={name}
        required={required}
        aria-invalid={!!error || undefined}
        className={cn(inputClass(!!error), "appearance-none pe-10")}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled} className="dark:bg-gray-900">
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-gray-500 dark:text-gray-400">
        <ChevronDownIcon className="size-5" />
      </span>
    </div>
  );
  if (!label) return control;
  return (
    <FormField label={label} htmlFor={selectId} error={error} hint={hint} required={required} className={className}>
      {control}
    </FormField>
  );
}
