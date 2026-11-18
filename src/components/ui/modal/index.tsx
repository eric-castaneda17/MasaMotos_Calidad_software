"use client";

import { CloseIcon } from "@/icons";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export function Modal({ isOpen, onClose, children, className, showCloseButton = true }: ModalProps) {
  const t = useTranslations("common");

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto">
      <div className="fixed inset-0 size-full bg-gray-400/50 backdrop-blur-[32px]" onClick={onClose} />
      <div className={cn("relative w-full rounded-3xl bg-white dark:bg-gray-900", className)}>
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="absolute end-3 top-3 z-999 flex size-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 sm:end-6 sm:top-6 sm:size-11 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <CloseIcon className="size-6" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
