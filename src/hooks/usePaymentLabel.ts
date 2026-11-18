"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

/** Nombre traducido de un método de pago predefinido; los personalizados usan su nombre. */
export function usePaymentLabel() {
  const t = useTranslations("paymentMethods");
  return useCallback(
    (code: string, name: string) => (t.has(code as "CASH") ? t(code as "CASH") : name),
    [t],
  );
}
