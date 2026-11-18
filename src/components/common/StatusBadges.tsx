"use client";

import Badge from "@/components/ui/badge/Badge";
import { useTranslations } from "next-intl";

export function StockBadge({ status, active = true }: { status: "available" | "low" | "out"; active?: boolean }) {
  const t = useTranslations("products.stockStatus");
  if (!active) return <Badge color="light">{t("inactive")}</Badge>;
  const color = status === "available" ? "success" : status === "low" ? "warning" : "error";
  return (
    <Badge color={color}>
      {t(status)}
    </Badge>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  const t = useTranslations("common");
  return (
    <Badge color={active ? "success" : "light"}>
      {active ? t("active") : t("inactive")}
    </Badge>
  );
}

export function SaleStatusBadge({ status }: { status: "COMPLETED" | "VOIDED" }) {
  const t = useTranslations("sales.status");
  return (
    <Badge color={status === "COMPLETED" ? "success" : "error"}>
      {t(status)}
    </Badge>
  );
}

const movementColors = {
  ENTRY: "success",
  EXIT: "warning",
  SALE: "info",
  VOID: "error",
  ADJUSTMENT: "light",
} as const;

export function MovementBadge({ type }: { type: keyof typeof movementColors }) {
  const t = useTranslations("inventory.types");
  return (
    <Badge color={movementColors[type]}>
      {t(type)}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: "ADMIN" | "SELLER" }) {
  const t = useTranslations("roles");
  return (
    <Badge color={role === "ADMIN" ? "primary" : "info"}>
      {t(role)}
    </Badge>
  );
}
