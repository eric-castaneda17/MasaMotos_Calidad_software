"use client";

import { CheckCircleIcon, CloseIcon, ErrorIcon, InfoIcon } from "@/icons";
import { cn } from "@/utils";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const styles: Record<ToastKind, string> = {
  success: "border-success-500 bg-success-50 text-success-800 dark:bg-success-500/15 dark:text-success-300",
  error: "border-error-500 bg-error-50 text-error-800 dark:bg-error-500/15 dark:text-error-300",
  info: "border-navy-500 bg-navy-50 text-navy-800 dark:bg-navy-500/15 dark:text-navy-200",
};

const icons: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircleIcon className="size-5 shrink-0" />,
  error: <ErrorIcon className="size-5 shrink-0" />,
  info: <InfoIcon className="size-5 shrink-0" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, kind, message }]);
      setTimeout(() => dismiss(id), kind === "error" ? 6000 : 4000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-999999 flex flex-col items-end gap-2 sm:inset-x-auto sm:end-6 sm:bottom-6"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex w-full items-start gap-3 rounded-xl border-s-4 px-4 py-3 text-sm font-medium shadow-theme-lg sm:w-96",
              "animate-[toast-in_200ms_ease-out]",
              styles[t.kind],
            )}
          >
            {icons[t.kind]}
            <p className="flex-1">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="opacity-60 hover:opacity-100"
              aria-label="×"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
