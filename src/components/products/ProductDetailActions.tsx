"use client";

import MovementFormModal, { type MovementProductOption } from "@/components/inventory/MovementFormModal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { Link } from "@/i18n/navigation";
import { PencilIcon, SwapIcon } from "@/icons";
import { useTranslations } from "next-intl";

export default function ProductDetailActions({ product }: { product: MovementProductOption }) {
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const modal = useModal();

  return (
    <>
      <Link
        href={`/productos/${product.id}/editar`}
        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/5"
      >
        <PencilIcon className="size-4 fill-current" />
        {tc("edit")}
      </Link>
      <Button size="sm" variant="secondary" startIcon={<SwapIcon />} onClick={modal.openModal}>
        {t("registerMovement")}
      </Button>
      <MovementFormModal isOpen={modal.isOpen} onClose={modal.closeModal} products={[]} fixedProduct={product} />
    </>
  );
}
