"use client";

import { useUrlParams } from "@/hooks/useUrlParams";
import { SearchIcon } from "@/icons";
import { cn } from "@/utils";
import { useRef, useState } from "react";

interface SearchBoxProps {
  placeholder: string;
  param?: string;
  className?: string;
}

export default function SearchBox({ placeholder, param = "q", className }: SearchBoxProps) {
  const { searchParams, setParams, isPending } = useUrlParams();
  const urlValue = searchParams.get(param) ?? "";
  const [value, setValue] = useState(urlValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza si la URL cambia desde fuera (p. ej. "Limpiar filtros").
  const [prevUrlValue, setPrevUrlValue] = useState(urlValue);
  if (urlValue !== prevUrlValue) {
    setPrevUrlValue(urlValue);
    setValue(urlValue);
  }

  const onChange = (v: string) => {
    setValue(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setParams({ [param]: v.trim() || undefined }), 350);
  };

  return (
    <div className={cn("relative min-w-0", className)}>
      <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-gray-400">
        {isPending ? (
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <SearchIcon className="size-5" />
        )}
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent ps-11 pe-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
      />
    </div>
  );
}
