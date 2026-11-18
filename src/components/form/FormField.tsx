"use client";

import { useMessage } from "@/hooks/useMessage";
import { cn } from "@/utils";
import Label from "./Label";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** `error` es una clave de traducción. */
export default function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  const msg = useMessage();
  return (
    <div className={cn("min-w-0", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="ms-0.5 text-error-500" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-error-600 dark:text-error-400" role="alert">
          {msg(error)}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputClass = (hasError?: boolean) =>
  cn(
    "h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30",
    "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-800",
    hasError
      ? "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:border-error-500"
      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800",
  );
