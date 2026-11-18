"use client";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useActionRunner } from "@/hooks/useFormAction";
import { useModal } from "@/hooks/useModal";
import { Link } from "@/i18n/navigation";
import { BanIcon, CheckCircleIcon, EyeIcon, PencilIcon, TrashBinIcon } from "@/icons";
import { deleteProductAction, toggleProductActiveAction } from "@/lib/actions/products";
import { useTranslations } from "next-intl";

interface ProductRowActionsProps {
  id: number;
  name: string;
  active: boolean;
  canManage: boolean;
}

export const iconBtn =
  "inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white [&>svg]:size-5";

export default function ProductRowActions({ id, name, active, canManage }: ProductRowActionsProps) {
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const deactivate = useModal();
  const remove = useModal();
  const { run, pending } = useActionRunner();

  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/productos/${id}`} className={iconBtn} title={tc("details")} aria-label={tc("details")}>
        <EyeIcon className="fill-current" />
      </Link>
      {canManage && (
        <>
          <Link href={`/productos/${id}/editar`} className={iconBtn} title={tc("edit")} aria-label={tc("edit")}>
            <PencilIcon className="fill-current" />
          </Link>
          {active ? (
            <button type="button" className={iconBtn} onClick={deactivate.openModal} title={tc("deactivate")} aria-label={tc("deactivate")}>
              <BanIcon />
            </button>
          ) : (
            <button
              type="button"
              className={iconBtn}
              disabled={pending}
              onClick={() => run(() => toggleProductActiveAction(id))}
              title={tc("activate")}
              aria-label={tc("activate")}
            >
              <CheckCircleIcon className="fill-current" />
            </button>
          )}
          <button
            type="button"
            className={`${iconBtn} hover:text-error-600 dark:hover:text-error-400`}
            onClick={remove.openModal}
            title={tc("delete")}
            aria-label={tc("delete")}
          >
            <TrashBinIcon className="fill-current" />
          </button>
        </>
      )}

      <ConfirmDialog
        isOpen={deactivate.isOpen}
        onClose={deactivate.closeModal}
        title={t("confirmDeactivateTitle")}
        message={t("confirmDeactivate", { name })}
        confirmLabel={tc("deactivate")}
        loading={pending}
        onConfirm={() => run(() => toggleProductActiveAction(id), () => deactivate.closeModal())}
      />
      <ConfirmDialog
        isOpen={remove.isOpen}
        onClose={remove.closeModal}
        title={t("confirmDeleteTitle")}
        message={t("confirmDelete", { name })}
        confirmLabel={tc("delete")}
        loading={pending}
        onConfirm={() => run(() => deleteProductAction(id), () => remove.closeModal())}
      />
    </div>
  );
}
