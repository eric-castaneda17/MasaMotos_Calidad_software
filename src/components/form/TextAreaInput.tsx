"use client";

import { cn } from "@/utils";
import FormField from "./FormField";

interface TextAreaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
}

export default function TextAreaInput({
  label,
  name,
  error,
  hint,
  required,
  className,
  rows = 3,
  id,
  ...rest
}: TextAreaInputProps) {
  const inputId = id ?? name;
  return (
    <FormField label={label} htmlFor={inputId} error={error} hint={hint} required={required} className={className}>
      <textarea
        id={inputId}
        name={name}
        rows={rows}
        required={required}
        aria-invalid={!!error || undefined}
        className={cn(
          "w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30",
          error
            ? "border-error-500 focus:ring-error-500/20"
            : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800",
        )}
        {...rest}
      />
    </FormField>
  );
}
