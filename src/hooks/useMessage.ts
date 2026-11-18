"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

/** Claves con namespace ("errors.x", "toast.x") se usan tal cual; las simples se buscan en "validation". */
export function useMessage() {
  const t = useTranslations();
  return useCallback(
    (key: string | undefined, params?: Record<string, string | number>) => {
      if (!key) return "";
      const full = key.includes(".") ? key : `validation.${key}`;
      return t.has(full) ? t(full, params) : t("errors.generic");
    },
    [t],
  );
}
