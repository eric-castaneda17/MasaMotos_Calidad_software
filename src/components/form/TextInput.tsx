"use client";

import { cn } from "@/utils";
import { forwardRef } from "react";
import FormField, { inputClass } from "./FormField";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  prefix?: string;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, name, error, hint, required, className, prefix, id, ...rest },
  ref,
) {
  const inputId = id ?? name;
  return (
    <FormField label={label} htmlFor={inputId} error={error} hint={hint} required={required} className={className}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-sm text-gray-500 dark:text-gray-400">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          required={required}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(inputClass(!!error), prefix && "ps-8")}
          {...rest}
        />
      </div>
    </FormField>
  );
});

export default TextInput;
