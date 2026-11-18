"use client";

import { cn } from "@/utils";

interface CheckboxInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  name: string;
  description?: string;
}

/** Casilla nativa: envía "on" en FormData cuando está marcada. */
export default function CheckboxInput({ label, name, description, className, id, ...rest }: CheckboxInputProps) {
  const inputId = id ?? name;
  return (
    <label
      htmlFor={inputId}
      className={cn("flex cursor-pointer items-start gap-3 select-none", className)}
    >
      <input
        id={inputId}
        name={name}
        type="checkbox"
        className="mt-0.5 size-5 shrink-0 cursor-pointer rounded-md border-gray-300 text-brand-600 focus:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-900"
        {...rest}
      />
      <span>
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{description}</span>
        )}
      </span>
    </label>
  );
}
